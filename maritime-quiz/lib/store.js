/**
 * 极简 JSON 文件存储（无外部数据库依赖）
 * 结构：{ users: {}, attempts: [] }
 * attempts: { id, offlineId, userId, questionId, selected, correct, createdAt }
 */
const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, '..', 'data', 'db.json');
const questions = require('../data/questions');
const versions = require('../data/versions');

let db = { users: {}, attempts: [] };
let saveTimer = null;

function load() {
  try {
    if (fs.existsSync(DB_FILE)) {
      db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
      db.users ||= {};
      db.attempts ||= [];
    }
  } catch (err) {
    console.error('[store] 读取数据库失败，使用空库：', err.message);
    db = { users: {}, attempts: [] };
  }
}

function persist() {
  // 防抖写盘，避免同步风暴
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    const tmp = DB_FILE + '.tmp';
    fs.writeFile(tmp, JSON.stringify(db, null, 2), (err) => {
      if (err) return console.error('[store] 写数据库失败：', err.message);
      fs.rename(tmp, DB_FILE, (e) => e && console.error('[store] 重命名失败：', e.message));
    });
  }, 300);
}

function saveSync() {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

const questionIndex = new Map(questions.map((q) => [q.id, q]));

function getUser(id) {
  return db.users[id] || null;
}

function upsertUser({ id, name, role }) {
  if (!id || typeof id !== 'string' || id.length > 64) {
    throw Object.assign(new Error('用户 id 不合法'), { status: 400 });
  }
  const existing = db.users[id];
  const user = existing
    ? { ...existing, name: name ?? existing.name, role: role ?? existing.role }
    : { id, name: name || '船员', role: role || 'deck', createdAt: new Date().toISOString() };
  db.users[id] = user;
  persist();
  return user;
}

/**
 * 同步一批离线作答。服务端以题库为准重算对错（不信任客户端 correct），
 * 按 (userId, offlineId) 幂等去重。
 * 返回 { accepted, skipped, attempts }
 */
function syncAttempts(userId, incoming) {
  if (!db.users[userId]) throw Object.assign(new Error('用户不存在'), { status: 404 });
  if (!Array.isArray(incoming)) throw Object.assign(new Error('attempts 必须是数组'), { status: 400 });

  const seen = new Set(
    db.attempts.filter((a) => a.userId === userId && a.offlineId).map((a) => a.offlineId),
  );
  const accepted = [];
  let skipped = 0;

  for (const raw of incoming.slice(0, 1000)) {
    const offlineId = String(raw.offlineId || '');
    if (!offlineId || seen.has(offlineId)) {
      skipped += 1;
      continue;
    }
    const q = questionIndex.get(String(raw.questionId));
    const selected = Number(raw.selected);
    if (!q || !Number.isInteger(selected) || selected < 0 || selected >= q.options.length) {
      skipped += 1;
      continue;
    }
    const attempt = {
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      offlineId,
      userId,
      questionId: q.id,
      selected,
      correct: selected === q.answer,
      createdAt: Number(raw.createdAt) && Number(raw.createdAt) > 0
        ? new Date(Number(raw.createdAt)).toISOString()
        : new Date().toISOString(),
      syncedAt: new Date().toISOString(),
    };
    db.attempts.push(attempt);
    seen.add(offlineId);
    accepted.push(attempt);
  }
  persist();
  return { accepted: accepted.length, skipped, attempts: accepted };
}

/** 个人统计：按题型（海图/避碰/听力）与类别拆分；错题按"最新一次作答错误"判定 */
function getStats(userId) {
  if (!db.users[userId]) throw Object.assign(new Error('用户不存在'), { status: 404 });

  const mine = db.attempts.filter((a) => a.userId === userId);
  // 每题只保留最新一次作答
  const latest = new Map();
  for (const a of mine) {
    const prev = latest.get(a.questionId);
    if (!prev || new Date(a.createdAt) >= new Date(prev.createdAt)) latest.set(a.questionId, a);
  }

  const groups = {
    type: { chart: {}, colreg: {}, listening: {}, knowledge: {} },
    category: { deck: {}, engine: {}, radio: {} },
  };
  const wrongIds = [];

  for (const [qid, attempt] of latest) {
    const q = questionIndex.get(qid);
    if (!q) continue;
    const t = groups.type[q.type];
    t.total = (t.total || 0) + 1;
    t.correctCount = (t.correctCount || 0) + (attempt.correct ? 1 : 0);
    const c = groups.category[q.category];
    c.total = (c.total || 0) + 1;
    c.correctCount = (c.correctCount || 0) + (attempt.correct ? 1 : 0);
    if (!attempt.correct) wrongIds.push(qid);
  }

  const pct = (g) => (g.total ? Math.round((g.correctCount / g.total) * 1000) / 10 : null);
  const summary = {
    totalAnswered: latest.size,
    overallRate: pct({
      total: latest.size,
      correctCount: [...latest.values()].filter((a) => a.correct).length,
    }),
    byType: {
      chart: { label: '海图题', total: groups.type.chart.total || 0, correctCount: groups.type.chart.correctCount || 0, rate: pct(groups.type.chart) },
      colreg: { label: '避碰题', total: groups.type.colreg.total || 0, correctCount: groups.type.colreg.correctCount || 0, rate: pct(groups.type.colreg) },
      listening: { label: '英语听力', total: groups.type.listening.total || 0, correctCount: groups.type.listening.correctCount || 0, rate: pct(groups.type.listening) },
      knowledge: { label: '专业知识', total: groups.type.knowledge.total || 0, correctCount: groups.type.knowledge.correctCount || 0, rate: pct(groups.type.knowledge) },
    },
    byCategory: {
      deck: { label: '驾驶', total: groups.category.deck.total || 0, correctCount: groups.category.deck.correctCount || 0, rate: pct(groups.category.deck) },
      engine: { label: '轮机', total: groups.category.engine.total || 0, correctCount: groups.category.engine.correctCount || 0, rate: pct(groups.category.engine) },
      radio: { label: '无线电', total: groups.category.radio.total || 0, correctCount: groups.category.radio.correctCount || 0, rate: pct(groups.category.radio) },
    },
    wrongQuestionIds: wrongIds,
    attemptCount: mine.length,
  };
  return summary;
}

function shutdown() {
  try { saveSync(); } catch { /* ignore */ }
}

load();
module.exports = {
  questions,
  versions,
  getUser,
  upsertUser,
  syncAttempts,
  getStats,
  saveSync,
  shutdown,
};
