/* 航海船员证书刷题站 - 前端逻辑 */
const TYPE_NAMES = { chart: '海图题', collision: '避碰题', listening: '英语听力', general: '综合题' };
const CAT_NAMES = { navigation: '船舶驾驶', marine: '轮机工程', radio: '无线电通信' };
const TYPE_ICONS = { chart: '🗺️', collision: '🚢', listening: '🎧', general: '📝' };

const state = {
  user: localStorage.getItem('crew-user') || '船员001',
  online: navigator.onLine,
  questions: [],
  pool: [],
  idx: 0,
  chosen: null,
  sessionAnswers: [],   // 本机本次/历史答题记录
};

const $ = (id) => document.getElementById(id);

// ---------- 网络状态 ----------
function setOnlineUI() {
  state.online = navigator.onLine;
  $('netDot').className = 'dot ' + (state.online ? 'online' : 'offline');
  $('netText').textContent = state.online ? '在线' : '离线（答题保存在本机）';
  $('syncTip').textContent = state.online
    ? '离线时答题会保存在本机，恢复网络后自动同步进度。'
    : '当前离线：答题记录已保存在本机，联网后自动同步。';
  updatePending();
}
window.addEventListener('online', () => { setOnlineUI(); flushOutbox(); });
window.addEventListener('offline', setOnlineUI);

async function updatePending() {
  const p = await IDB.pendingAnswers();
  const badge = $('pendingBadge');
  if (p.length) { badge.hidden = false; badge.textContent = `待同步 ${p.length}`; }
  else badge.hidden = true;
}

// ---------- 数据加载 ----------
async function loadQuestions() {
  try {
    const r = await fetch('/api/questions');
    const data = await r.json();
    state.questions = data.questions;
    await IDB.set('questions', data.questions);
  } catch (e) {
    const cached = await IDB.get('questions');
    if (cached) state.questions = cached;
  }
}

async function loadSessionAnswers() {
  state.sessionAnswers = (await IDB.get('answers')) || [];
}
async function saveSessionAnswers() {
  await IDB.set('answers', state.sessionAnswers);
}

// ---------- 首页 ----------
function renderHome() {
  const grid = $('catGrid');
  grid.innerHTML = '';
  const cats = [
    { id: 'navigation', name: '船舶驾驶', icon: '🧭' },
    { id: 'marine', name: '轮机工程', icon: '⚙️' },
    { id: 'radio', name: '无线电通信', icon: '📡' },
  ];
  cats.forEach(c => {
    const count = state.questions.filter(q => q.category === c.id).length;
    const div = document.createElement('div');
    div.className = 'cat-card';
    div.innerHTML = `<div class="icon">${c.icon}</div><div class="name">${c.name}</div><div class="count">${count} 题</div>`;
    div.onclick = () => startQuiz(c.id, null);
    grid.appendChild(div);
  });
  renderTypeStats();
}

function renderTypeStats() {
  const box = $('typeStats');
  box.innerHTML = '';
  const local = computeLocalStats();
  ['chart', 'collision', 'listening', 'general'].forEach(t => {
    const s = local.byType[t] || { total: 0, correct: 0, accuracy: 0 };
    const div = document.createElement('div');
    div.className = 'type-stat';
    div.innerHTML = `
      <div class="t-name">${TYPE_ICONS[t]} ${TYPE_NAMES[t]}</div>
      <div class="t-acc">${s.total ? s.accuracy + '%' : '—'}</div>
      <div class="t-bar"><i style="width:${s.accuracy}%"></i></div>
      <div class="t-sub">${s.correct}/${s.total} 正确</div>`;
    div.onclick = () => startQuiz(null, t);
    div.style.cursor = 'pointer';
    box.appendChild(div);
  });
}

// ---------- 答题 ----------
function startQuiz(category, type) {
  let pool = state.questions.slice();
  if (category) pool = pool.filter(q => q.category === category);
  if (type) pool = pool.filter(q => q.type === type);
  if (!pool.length) { alert('暂无题目'); return; }
  // 打乱顺序
  pool.sort(() => Math.random() - 0.5);
  state.pool = pool;
  state.idx = 0;
  state.filterCat = category;
  state.filterType = type;
  $('screenHome').hidden = true;
  $('screenStats').hidden = true;
  $('screenQuiz').hidden = false;
  renderQuestion();
}

function renderQuestion() {
  state.chosen = null;
  const q = state.pool[state.idx];
  $('qCat').textContent = CAT_NAMES[q.category];
  $('qType').textContent = TYPE_NAMES[q.type];
  $('qProgress').textContent = `${state.idx + 1} / ${state.pool.length}`;
  $('qText').textContent = q.question;

  // 媒体区：海图 SVG / 听力
  const media = $('qMedia');
  media.innerHTML = '';
  if (q.type === 'chart' && q.meta && q.meta.svg) {
    const wrap = document.createElement('div');
    wrap.innerHTML = q.meta.svg;
    media.appendChild(wrap);
  }
  if (q.type === 'listening' && q.meta && q.meta.script) {
    const box = document.createElement('div');
    box.className = 'listen-box';
    box.innerHTML = `<div style="margin-bottom:8px;color:#14568f">🎧 听力题：请播放语音后作答</div>`;
    const btn = document.createElement('button');
    btn.className = 'btn primary';
    btn.textContent = '🔊 播放听力';
    btn.onclick = () => speak(q.meta.script);
    box.appendChild(btn);
    const tip = document.createElement('div');
    tip.style.cssText = 'font-size:12px;color:#6b7c93;margin-top:8px';
    tip.textContent = '提示：没听清可重复播放；听力原文在作答后可查看。';
    box.appendChild(tip);
    media.appendChild(box);
    $('btnSpeak').hidden = true;
  } else {
    $('btnSpeak').hidden = true;
  }

  // 选项
  const opts = $('qOptions');
  opts.innerHTML = '';
  const letters = ['A', 'B', 'C', 'D'];
  q.options.forEach((opt, i) => {
    const div = document.createElement('div');
    div.className = 'opt';
    div.innerHTML = `<span class="letter">${letters[i]}</span>${opt}`;
    div.onclick = () => {
      if ($('qResult').hidden === false) return;
      state.chosen = i;
      opts.querySelectorAll('.opt').forEach(o => o.classList.remove('selected'));
      div.classList.add('selected');
      $('btnSubmit').disabled = false;
    };
    opts.appendChild(div);
  });

  $('btnSubmit').disabled = true;
  $('qResult').hidden = true;
}

function speak(text) {
  if (!('speechSynthesis' in window)) { alert('当前浏览器不支持语音播放'); return; }
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-US';
  u.rate = 0.85;
  window.speechSynthesis.speak(u);
}

$('btnSubmit').onclick = async () => {
  if (state.chosen === null) return;
  const q = state.pool[state.idx];
  const correct = state.chosen === q.answer;

  // 标记选项
  const optEls = $('qOptions').querySelectorAll('.opt');
  optEls.forEach((el, i) => {
    if (i === q.answer) el.classList.add('correct');
    if (i === state.chosen && !correct) el.classList.add('wrong');
  });
  $('btnSubmit').disabled = true;

  // 结果区
  const result = $('qResult');
  result.hidden = false;
  const head = $('resultHead');
  head.textContent = correct ? '✅ 回答正确' : '❌ 回答错误';
  head.className = 'result-head ' + (correct ? 'ok' : 'no');
  $('qExplain').textContent = q.explanation;
  $('qVersion').textContent = q.exam_version;

  // 听力题：展示听力原文
  const oldScript = $('qScript');
  if (oldScript) oldScript.remove();
  if (q.type === 'listening' && q.meta && q.meta.script) {
    const sc = document.createElement('div');
    sc.id = 'qScript';
    sc.className = 'explain';
    sc.style.marginTop = '8px';
    sc.innerHTML = `<b>听力原文：</b>${q.meta.script}`;
    $('qExplain').parentElement.after(sc);
  }

  // 记录到本机
  const rec = {
    uuid: `${state.user}-${q.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    user: state.user, question_id: q.id, chosen: state.chosen,
    correct: correct ? 1 : 0, ts: Date.now(),
  };
  state.sessionAnswers.push(rec);
  await saveSessionAnswers();
  await IDB.addAnswer(rec);
  await updatePending();

  // 在线则立即同步
  if (navigator.onLine) flushOutbox();
};

$('btnNext').onclick = () => {
  if (state.idx < state.pool.length - 1) {
    state.idx++;
    renderQuestion();
  } else {
    alert('本组题目已完成！');
    backHome();
  }
};
$('btnBack').onclick = backHome;

function backHome() {
  window.speechSynthesis && window.speechSynthesis.cancel();
  $('screenQuiz').hidden = true;
  $('screenStats').hidden = true;
  $('screenHome').hidden = false;
  renderHome();
}

// ---------- 统计 ----------
function computeLocalStats() {
  const qmap = {};
  state.questions.forEach(q => qmap[q.id] = q);
  const stats = { total: 0, correct: 0, byType: {}, byCategory: {} };
  for (const a of state.sessionAnswers) {
    const q = qmap[a.question_id];
    if (!q) continue;
    stats.total++;
    if (a.correct) stats.correct++;
    stats.byType[q.type] = stats.byType[q.type] || { total: 0, correct: 0 };
    stats.byCategory[q.category] = stats.byCategory[q.category] || { total: 0, correct: 0 };
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

function renderStats() {
  const s = computeLocalStats();
  $('statsOverview').innerHTML = `
    <div class="big">${s.accuracy}%</div>
    <div class="sub">总正确率 ${s.correct}/${s.total}（本机记录）</div>`;
  const detail = $('statsDetail');
  detail.innerHTML = '';
  const groups = [
    { title: '按题型', data: s.byType, names: TYPE_NAMES, icons: TYPE_ICONS },
    { title: '按类别', data: s.byCategory, names: CAT_NAMES, icons: { navigation: '🧭', marine: '⚙️', radio: '📡' } },
  ];
  groups.forEach(g => {
    const title = document.createElement('div');
    title.className = 'section-title';
    title.textContent = g.title;
    detail.appendChild(title);
    Object.keys(g.data).forEach(key => {
      const item = g.data[key];
      const row = document.createElement('div');
      row.className = 'stat-row';
      row.innerHTML = `
        <div class="r-top"><span>${g.icons[key] || ''} ${g.names[key] || key}</span><span>${item.accuracy}%</span></div>
        <div class="r-bar"><i style="width:${item.accuracy}%"></i></div>
        <div class="r-sub">${item.correct}/${item.total} 正确</div>`;
      detail.appendChild(row);
    });
    if (!Object.keys(g.data).length) {
      detail.innerHTML += `<div class="tip">暂无答题记录</div>`;
    }
  });
}

// ---------- 同步 ----------
async function flushOutbox() {
  if (!navigator.onLine) return;
  const pending = await IDB.pendingAnswers();
  if (!pending.length) return;
  try {
    const r = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: state.user, answers: pending }),
    });
    const data = await r.json();
    if (data.ok) {
      await IDB.removeAnswers(pending.map(a => a.uuid));
      await IDB.set('serverStats', data.stats);
      await IDB.set('lastSync', data.server_time);
      await pullAnswers();
      updatePending();
      if (!$('screenStats').hidden) renderStats();
    }
  } catch (e) { /* 离线或失败，稍后重试 */ }
}

async function pullAnswers() {
  try {
    const since = (await IDB.get('lastSync')) || 0;
    const r = await fetch(`/api/sync?user=${encodeURIComponent(state.user)}&since=${since}`);
    const data = await r.json();
    if (data.answers && data.answers.length) {
      const existing = new Set(state.sessionAnswers.map(a => a.uuid));
      data.answers.forEach(a => { if (!existing.has(a.uuid)) state.sessionAnswers.push(a); });
      await saveSessionAnswers();
    }
    if (data.stats) await IDB.set('serverStats', data.stats);
    await IDB.set('lastSync', data.server_time);
  } catch (e) { /* 离线忽略 */ }
}

$('btnSync').onclick = async () => {
  if (!navigator.onLine) { alert('当前离线，联网后将自动同步'); return; }
  await flushOutbox();
  alert('同步完成');
};

// ---------- Tab 切换 ----------
document.querySelectorAll('.tab').forEach(tab => {
  tab.onclick = () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const which = tab.dataset.tab;
    $('screenHome').hidden = which !== 'home';
    $('screenStats').hidden = which !== 'stats';
    $('screenQuiz').hidden = true;
    if (which === 'home') renderHome();
    if (which === 'stats') renderStats();
  };
});
$('btnStatsBack').onclick = () => {
  document.querySelector('.tab[data-tab="home"]').click();
};

// ---------- 用户 ----------
$('userInput').addEventListener('change', (e) => {
  state.user = e.target.value.trim() || '船员001';
  localStorage.setItem('crew-user', state.user);
});

// ---------- 启动 ----------
async function init() {
  $('userInput').value = state.user;
  setOnlineUI();
  await loadQuestions();
  await loadSessionAnswers();
  renderHome();
  updatePending();
  if (navigator.onLine) { flushOutbox(); pullAnswers(); }

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
}
init();
