const express = require('express');
const db = require('./db');
const path = require('path');

const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ---------- 题目 ----------
app.get('/api/questions', (req, res) => {
  const { category, type } = req.query;
  let rows = db.prepare('SELECT * FROM questions').all();
  if (category) rows = rows.filter(r => r.category === category);
  if (type) rows = rows.filter(r => r.type === type);
  rows = rows.map(r => ({ ...r, options: JSON.parse(r.options), meta: JSON.parse(r.meta || '{}') }));
  res.json({ questions: rows, updated_at: Date.now() });
});

app.get('/api/categories', (req, res) => {
  const cats = [
    { id: 'navigation', name: '船舶驾驶', icon: '🧭' },
    { id: 'marine', name: '轮机工程', icon: '⚙️' },
    { id: 'radio', name: '无线电通信', icon: '📡' },
  ];
  const types = [
    { id: 'chart', name: '海图题', icon: '🗺️' },
    { id: 'collision', name: '避碰题', icon: '🚢' },
    { id: 'listening', name: '英语听力', icon: '🎧' },
    { id: 'general', name: '综合题', icon: '📝' },
  ];
  res.json({ categories: cats, types });
});

// ---------- 统计 ----------
function computeStats(user) {
  const answers = db.prepare('SELECT * FROM answers WHERE user = ?').all(user);
  const qmap = {};
  db.prepare('SELECT id, category, type FROM questions').all().forEach(q => qmap[q.id] = q);
  const stats = { total: 0, correct: 0, byType: {}, byCategory: {} };
  for (const a of answers) {
    const q = qmap[a.question_id];
    if (!q) continue;
    stats.total++;
    if (a.correct) stats.correct++;
    if (!stats.byType[q.type]) stats.byType[q.type] = { total: 0, correct: 0 };
    if (!stats.byCategory[q.category]) stats.byCategory[q.category] = { total: 0, correct: 0 };
    stats.byType[q.type].total++;
    stats.byType[q.type].correct += a.correct ? 1 : 0;
    stats.byCategory[q.category].total++;
    stats.byCategory[q.category].correct += a.correct ? 1 : 0;
  }
  stats.accuracy = stats.total ? Math.round(stats.correct / stats.total * 100) : 0;
  for (const k in stats.byType) stats.byType[k].accuracy = Math.round(stats.byType[k].correct / stats.byType[k].total * 100);
  for (const k in stats.byCategory) stats.byCategory[k].accuracy = Math.round(stats.byCategory[k].correct / stats.byCategory[k].total * 100);
  return stats;
}

app.get('/api/stats', (req, res) => {
  const user = req.query.user || 'guest';
  res.json({ user, stats: computeStats(user) });
});

// ---------- 同步：上传离线答题记录 ----------
app.post('/api/sync', (req, res) => {
  const { user, answers } = req.body;
  if (!user || !Array.isArray(answers)) return res.status(400).json({ error: 'user and answers required' });
  const insert = db.prepare(`INSERT OR IGNORE INTO answers (uuid, user, question_id, chosen, correct, ts)
                             VALUES (@uuid, @user, @question_id, @chosen, @correct, @ts)`);
  let synced = 0;
  const tx = db.transaction((items) => {
    for (const a of items) {
      const info = insert.run({
        uuid: a.uuid, user, question_id: a.question_id,
        chosen: a.chosen, correct: a.correct ? 1 : 0, ts: a.ts || Date.now(),
      });
      if (info.changes) synced++;
    }
  });
  tx(answers);
  res.json({ ok: true, synced, total: answers.length, stats: computeStats(user), server_time: Date.now() });
});

// ---------- 同步：拉取（多设备） ----------
app.get('/api/sync', (req, res) => {
  const user = req.query.user || 'guest';
  const since = parseInt(req.query.since || '0', 10);
  const rows = db.prepare('SELECT uuid, question_id, chosen, correct, ts FROM answers WHERE user = ? AND ts > ? ORDER BY ts').all(user, since);
  res.json({ answers: rows, stats: computeStats(user), server_time: Date.now() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`航海船员刷题站 running on http://localhost:${PORT}`));
