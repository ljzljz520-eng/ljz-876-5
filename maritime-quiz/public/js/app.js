/* ========== 航证刷题 · 主应用 ========== */
(function () {
  'use strict';

  const TYPE_META = {
    chart: { label: '海图题' },
    colreg: { label: '避碰题' },
    listening: { label: '英语听力' },
    knowledge: { label: '专业知识' },
  };
  const CAT_META = {
    deck: { label: '驾驶', emoji: '🧭' },
    engine: { label: '轮机', emoji: '⚙️' },
    radio: { label: '无线电', emoji: '📡' },
  };

  const state = {
    user: null,
    questions: [],
    versions: [],
    attempts: [],          // 本地全部作答
    stats: null,           // 本地实时统计
    serverStats: null,     // 上次同步的服务器统计
    practice: null,        // 当前刷题会话
    syncing: false,
    syncTimer: null,
  };

  // ---------- 工具 ----------
  const $ = (sel, root) => (root || document).querySelector(sel);
  const view = () => $('#view');
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => 'u-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
  const attemptId = () => 'a-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  const qById = (id) => state.questions.find((q) => q.id === id);
  const pctOrDash = (v) => (v === null || v === undefined || isNaN(v) ? '—' : v + '%');
  const verById = (id) => state.versions.find((v) => v.id === id);
  const isOnline = () => navigator.onLine;

  let toastTimer = null;
  function toast(msg, ms = 2200) {
    const el = $('#toast');
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, ms);
  }

  // ---------- 本地统计（与服务端同口径） ----------
  function computeStats() {
    const latest = new Map();
    for (const a of state.attempts) {
      const prev = latest.get(a.questionId);
      if (!prev || a.createdAt >= prev.createdAt) latest.set(a.questionId, a);
    }
    const g = {
      type: { chart: [], colreg: [], listening: [], knowledge: [] },
      category: { deck: [], engine: [], radio: [] },
    };
    const wrongQuestionIds = [];
    for (const [qid, a] of latest) {
      const q = qById(qid);
      if (!q) continue;
      g.type[q.type] && g.type[q.type].push(a.correct);
      g.category[q.category] && g.category[q.category].push(a.correct);
      if (!a.correct) wrongQuestionIds.push(qid);
    }
    const rate = (arr) => (arr.length
      ? Math.round((arr.filter(Boolean).length / arr.length) * 1000) / 10
      : null);
    const tile = (label, arr) => ({
      label, total: arr.length, correctCount: arr.filter(Boolean).length, rate: rate(arr),
    });
    const pending = state.attempts.filter((a) => a.pending).length;
    return {
      totalAnswered: latest.size,
      overallRate: rate([...latest.values()].map((a) => a.correct)),
      byType: {
        chart: tile('海图题', g.type.chart),
        colreg: tile('避碰题', g.type.colreg),
        listening: tile('英语听力', g.type.listening),
        knowledge: tile('专业知识', g.type.knowledge),
      },
      byCategory: {
        deck: tile('驾驶', g.category.deck),
        engine: tile('轮机', g.category.engine),
        radio: tile('无线电', g.category.radio),
      },
      wrongQuestionIds,
      attemptCount: state.attempts.length,
      pending,
    };
  }

  function refreshStats() {
    state.stats = computeStats();
    updateChrome();
  }

  function refreshPendingBadge() {
    const badge = $('#pending-badge');
    const pending = state.attempts.filter((a) => a.pending).length;
    if (pending > 0) {
      badge.hidden = false;
      badge.textContent = `${pending} 待同步`;
    } else {
      badge.hidden = true;
    }
  }

  function updateConnUI() {
    const conn = $('#conn');
    const text = $('#conn-text');
    conn.classList.toggle('online', isOnline());
    conn.classList.toggle('offline', !isOnline());
    text.textContent = isOnline() ? '在线' : '离线模式';
    refreshPendingBadge();
  }

  function updateChrome() {
    updateConnUI();
    document.querySelectorAll('.tabbar a').forEach((a) => {
      const tab = a.dataset.tab;
      a.classList.toggle('active', location.hash.startsWith(`#/${tab}`));
    });
  }

  // ---------- 同步 ----------
  async function syncNow({ manual = false } = {}) {
    if (state.syncing) return;
    if (!isOnline()) {
      if (manual) toast('📴 当前离线，作答已保存在本机，联网后自动同步');
      return;
    }
    const pending = await QDB.getPendingAttempts();
    if (!pending.length) {
      if (manual) toast('✅ 所有进度均已同步');
      return;
    }
    state.syncing = true;
    try {
      await API.saveUser(state.user).catch(() => {});
      const payload = pending.map((a) => ({
        offlineId: a.offlineId,
        questionId: a.questionId,
        selected: a.selected,
        createdAt: a.createdAt,
      }));
      const result = await API.sync(state.user.id, payload);
      await QDB.markSynced(pending.map((a) => a.offlineId), result.attempts);
      state.attempts = await QDB.getAllAttempts();
      state.serverStats = result.stats;
      state.serverStats = { ...result.stats, _at: Date.now() };
      await QDB.metaSet('serverStats', { at: Date.now(), stats: state.serverStats }).catch(() => {});
      refreshStats();
      if (manual) toast(`✅ 已同步 ${result.accepted} 条作答记录`);
    } catch (e) {
      if (manual) toast('同步失败：' + e.message + '（记录保留在本机）');
    } finally {
      state.syncing = false;
      const r = location.hash.replace('#/', '').split('/')[0];
      if (['home', 'stats', 'settings'].includes(r)) renderRoute();
    }
  }

  function scheduleAutoSync(delay = 4000) {
    clearTimeout(state.syncTimer);
    state.syncTimer = setTimeout(() => syncNow({ manual: false }), delay);
  }

  // ---------- 初始化 ----------
  async function loadUser() {
    const saved = localStorage.getItem('mq-user');
    if (saved) {
      try { state.user = JSON.parse(saved); } catch { state.user = null; }
    }
    if (!state.user) {
      state.user = { id: uid(), name: '船员' + Math.floor(Math.random() * 1000), role: 'deck' };
      localStorage.setItem('mq-user', JSON.stringify(state.user));
    }
    API.saveUser(state.user).catch(() => {});
  }

  async function loadBootstrap() {
    // 在线优先；失败则用 IndexedDB 中的缓存题库（离线可刷题）
    try {
      const data = await API.bootstrap();
      state.questions = data.questions;
      state.versions = data.versions;
      await QDB.metaSet('bootstrap', { at: Date.now(), ...data });
      return true;
    } catch (e) {
      const cached = await QDB.metaGet('bootstrap');
      if (cached && cached.questions) {
        state.questions = cached.questions;
        state.versions = cached.versions || [];
        return false;
      }
      throw e;
    }
  }

  async function init() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((e) =>
        console.warn('SW 注册失败：', e));
    }
    window.addEventListener('online', () => {
      updateConnUI();
      toast('🌐 网络已恢复，正在同步刷题进度…');
      syncNow();
    });
    window.addEventListener('offline', () => {
      updateConnUI();
      toast('📴 已进入离线模式，可继续刷题');
    });

    await loadUser();
    await loadBootstrap().catch(() => {
      state.questions = [];
      state.versions = [];
    });
    state.attempts = await QDB.getAllAttempts();
    const serverStatsCache = await QDB.metaGet('serverStats').catch(() => null);
    state.serverStats = serverStatsCache ? { ...serverStatsCache.stats, _at: serverStatsCache.at } : null;
    refreshStats();

    window.addEventListener('hashchange', renderRoute);
    renderRoute();
    updateChrome();

    // 启动后若有积压记录则自动同步
    if (isOnline() && state.attempts.some((a) => a.pending)) syncNow();
  }


  // ---------- 版本标签（解析适用考试版本） ----------
  function verTagsHtml(versionIds) {
    return `<div class="ver-tags">
      <span class="vt-label">📌 适用考试版本：</span>
      ${versionIds.map((id) => {
        const v = verById(id);
        if (!v) return '';
        return `<span class="ver-tag ${v.current ? '' : 'old'}"
          title="${esc(v.name)}${v.current ? '（现行）' : '（旧版·仅对照学习）'}">${esc(v.tag)}${v.current ? '' : '·旧版'}</span>`;
      }).join('')}
    </div>`;
  }

  function typeBadge(type) {
    return `<span class="badge ${type}">${TYPE_META[type]?.label || type}</span>`;
  }
  function catBadge(cat) {
    return `<span class="badge ${cat}">${CAT_META[cat]?.label || cat}</span>`;
  }

  function syncBannerHtml() {
    if (!isOnline()) {
      return `<div class="sync-banner offline"><span>📴 离线刷题中，作答保存在本机</span>
        <b>${state.stats.pending} 条待同步</b></div>`;
    }
    if (state.stats.pending > 0) {
      return `<div class="sync-banner online-pending"><span>🌐 已联网，有刷题进度待同步</span>
        <button class="btn sm gold" id="sync-now">立即同步</button></div>`;
    }
    return `<div class="sync-banner synced"><span>✅ 刷题进度已同步</span>
      <button class="btn sm secondary" id="sync-now">重新同步</button></div>`;
  }

  function bindSyncBanner() {
    $('#sync-now')?.addEventListener('click', () => syncNow({ manual: true }));
  }

  // ---------- 首页 ----------
  function renderHome() {
    const s = state.stats;
    const counts = (cat) => state.questions.filter((q) => q.category === cat).length;
    const overview = s
      ? `<div class="hero-stats">
           <div><strong>${s.totalAnswered}/${state.questions.length}</strong>已练习题数</div>
           <div><strong>${s.overallRate === null ? '—' : s.overallRate + '%'}</strong>总正确率</div>
           <div><strong>${s.wrongQuestionIds.length}</strong>待攻克错题</div>
         </div>`
      : '';
    view().innerHTML = `
      <div class="hero">
        <h1>⚓ 船员适任证书刷题</h1>
        <p>轮机 · 驾驶 · 无线电｜海图题 / 避碰题 / 英语听力专项</p>
        ${overview}
      </div>
      ${syncBannerHtml()}
      <div class="section-title">选择练习类别</div>
      <div class="cat-grid">
        <div class="cat-card" data-cat="deck" tabindex="0" role="button">
          <span class="emoji">🧭</span><b>驾驶</b><span>${counts('deck')} 题 · 海图/避碰/听力</span>
        </div>
        <div class="cat-card" data-cat="engine" tabindex="0" role="button">
          <span class="emoji">⚙️</span><b>轮机</b><span>${counts('engine')} 题 · 柴油机/防污染/听力</span>
        </div>
        <div class="cat-card" data-cat="radio" tabindex="0" role="button">
          <span class="emoji">📡</span><b>无线电</b><span>${counts('radio')} 题 · GMDSS/DSC/听力</span>
        </div>
      </div>
      <div class="section-title">专项正确率</div>
      <div class="card">${renderTypeBars()}</div>
      <div class="section-title">快捷入口</div>
      <div class="row-between">
        <a class="btn secondary" href="#/wrong">🔁 错题重练（${s ? s.wrongQuestionIds.length : 0}）</a>
        <a class="btn" href="#/stats">📊 查看完整统计</a>
      </div>
      <p class="muted mt16">📡 进度自动保存在本机（IndexedDB），无网络也能刷题；回到网络环境后自动同步，也可在「我的」页手动同步。</p>
    `;
    view().querySelectorAll('.cat-card').forEach((el) => {
      const go = () => { location.hash = '#/practice?cat=' + el.dataset.cat; };
      el.addEventListener('click', go);
      el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    });
    bindSyncBanner();
  }

  function renderTypeBars() {
    const s = state.stats;
    return Object.entries(TYPE_META).map(([type, meta]) => {
      const t = s.byType[type];
      const pct = t.rate === null ? 0 : t.rate;
      return `<div class="bar-row">
        <span class="bar-label">${meta.label}</span>
        <span class="bar-track"><span class="bar-fill" style="width:${pct}%"></span></span>
        <span class="bar-val">${t.rate === null ? '未练习' : t.rate + '% (' + t.correctCount + '/' + t.total + ')'}</span>
      </div>`;
    }).join('');
  }

  // ---------- 我的 / 设置 ----------
  function renderSettings() {
    const u = state.user;
    view().innerHTML = `
      <div class="card">
        <h2>👤 船员档案</h2>
        <label class="field">昵称
          <input type="text" id="user-name" maxlength="20" value="${esc(u.name)}" />
        </label>
        <label class="field">报考类别
          <select id="user-role">
            <option value="deck" ${u.role === 'deck' ? 'selected' : ''}>驾驶专业</option>
            <option value="engine" ${u.role === 'engine' ? 'selected' : ''}>轮机专业</option>
            <option value="radio" ${u.role === 'radio' ? 'selected' : ''}>无线电专业</option>
          </select>
        </label>
        <button class="btn block" id="save-profile">保存档案</button>
        <div class="kv mt16"><span>设备用户 ID（同步凭证）</span><b>${esc(u.id)}</b></div>
      </div>

      <div class="card">
        <h2>🔄 进度同步</h2>
        ${syncBannerHtml()}
        <div class="kv"><span>本机作答记录</span><b>${state.stats.attemptCount} 条</b></div>
        <div class="kv"><span>待同步（仅存本机）</span><b>${state.stats.pending} 条</b></div>
        <div class="kv"><span>最近服务端校正</span><b>${state.serverStats && state.serverStats._at ? new Date(state.serverStats._at).toLocaleString('zh-CN') : '—'}</b></div>
      </div>

      <div class="card">
        <h2>ℹ️ 关于考试版本</h2>
        <p class="muted">每题解析均标注适用考试版本（现行 / 旧版对照）：</p>
        ${state.versions.map((v) => `
          <div class="kv">
            <span>${esc(v.name)}</span>
            <b style="color:${v.current ? 'var(--ok)' : 'var(--muted)'}">${v.current ? '现行' : '旧版对照'}</b>
          </div>`).join('')}
      </div>

      <div class="card">
        <h2>🧹 本地数据</h2>
        <p class="muted">清除本机题库缓存与作答记录（已同步到服务器的记录不受影响）。</p>
        <button class="btn ghost block" id="clear-local">清除本机全部数据</button>
      </div>
    `;
    $('#save-profile').addEventListener('click', async () => {
      state.user.name = $('#user-name').value.trim() || '船员';
      state.user.role = $('#user-role').value;
      localStorage.setItem('mq-user', JSON.stringify(state.user));
      try { await API.saveUser(state.user); toast('✅ 档案已保存并同步'); }
      catch { toast('档案已保存在本机，联网后同步'); }
      renderRoute();
    });
    $('#clear-local').addEventListener('click', async () => {
      if (!confirm('确定清除本机题库缓存与全部作答记录？')) return;
      indexedDB.deleteDatabase('maritime-quiz');
      localStorage.removeItem('mq-user');
      location.reload();
    });
    bindSyncBanner();
  }


  // ---------- 刷题配置页 ----------
  function parseHashQuery(hash) {
    const qIndex = hash.indexOf('?');
    if (qIndex < 0) return {};
    const out = {};
    hash.slice(qIndex + 1).split('&').forEach((pair) => {
      const [k, v] = pair.split('=');
      out[decodeURIComponent(k)] = decodeURIComponent(v || '');
    });
    return out;
  }

  function renderPractice() {
    if (!state.questions.length) {
      view().innerHTML = `<div class="empty"><span class="e-emoji">📡</span>
        题库尚未缓存且当前无法连接服务器。<br>请先在联网环境打开本站一次，之后即可离线刷题。</div>`;
      return;
    }
    const query = parseHashQuery(location.hash);
    const cat = CAT_META[query.cat] ? query.cat : (state.user.role || 'deck');
    const types = Object.keys(TYPE_META);
    const activeType = types.includes(query.type) ? query.type : 'all';
    const wrongOnly = query.mode === 'wrong';

    const pool = state.questions.filter((q) =>
      q.category === cat &&
      (activeType === 'all' || q.type === activeType) &&
      (!wrongOnly || state.stats.wrongQuestionIds.includes(q.id)));

    const typeCount = (t) => state.questions.filter((q) => q.category === cat && (t === 'all' || q.type === t)).length;

    view().innerHTML = `
      <div class="card">
        <h2>⚓ 练习设置${wrongOnly ? ' · 错题重练' : ''}</h2>
        <label class="field mt8">船员类别
          <select id="p-cat">
            ${Object.entries(CAT_META).map(([k, m]) =>
              `<option value="${k}" ${k === cat ? 'selected' : ''}>${m.emoji} ${m.label}（${state.questions.filter(q => q.category === k).length} 题）</option>`).join('')}
          </select>
        </label>
        <div class="muted">题型专项</div>
        <div class="chips" id="p-type-chips">
          <button class="chip ${activeType === 'all' ? 'active' : ''}" data-type="all">全部 ${typeCount('all')}</button>
          ${types.map((t) => `<button class="chip ${activeType === t ? 'active' : ''}" data-type="${t}">
            ${TYPE_META[t].label} ${typeCount(t)}</button>`).join('')}
        </div>
        <label class="field mt8">练习范围
          <select id="p-scope">
            <option value="all" ${wrongOnly ? '' : 'selected'}>顺序练习（全部 ${typeCount(activeType)} 题）</option>
            <option value="wrong" ${wrongOnly ? 'selected' : ''}>只练错题（${state.stats.wrongQuestionIds.filter((id) => { const q = qById(id); return q && q.category === cat && (activeType === 'all' || q.type === activeType); }).length} 题）</option>
          </select>
        </label>
        <label class="field">题量
          <select id="p-limit">
            <option value="0">全部可练习题</option>
            <option value="10" selected>10 题一组</option>
            <option value="20">20 题一组</option>
          </select>
        </label>
        <button class="btn block" id="p-start" ${pool.length === 0 ? 'disabled' : ''}>
          ${pool.length === 0 ? '该范围暂无可练习题' : `开始练习（${pool.length} 题可选）`}
        </button>
        <p class="muted mt8">💡 听力题使用浏览器语音合成朗读英文，可随时查看听力原文；海图题内嵌示意海图。</p>
      </div>
      ${wrongOnly && pool.length === 0 ? `<div class="card"><div class="empty"><span class="e-emoji">🎉</span>该类别暂无错题，先去刷题吧！</div></div>` : ''}
    `;

    $('#p-cat').addEventListener('change', (e) => {
      location.hash = `#/practice?cat=${e.target.value}`;
    });
    $('#p-type-chips').addEventListener('click', (e) => {
      const btn = e.target.closest('.chip');
      if (!btn) return;
      location.hash = `#/practice?cat=${cat}&type=${btn.dataset.type}${wrongOnly ? '&mode=wrong' : ''}`;
    });
    $('#p-start').addEventListener('click', () => {
      const scope = $('#p-scope').value;
      const limit = Number($('#p-limit').value);
      startPractice({ cat, type: activeType, scope, limit });
    });
  }

  function startPractice({ cat, type, scope, limit }) {
    let pool = state.questions.filter((q) =>
      q.category === cat && (type === 'all' || q.type === type));
    if (scope === 'wrong') pool = pool.filter((q) => state.stats.wrongQuestionIds.includes(q.id));
    const ids = pool.map((q) => q.id);
    if (limit > 0 && ids.length > limit) {
      // 随机抽取一组
      for (let i = ids.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [ids[i], ids[j]] = [ids[j], ids[i]];
      }
      ids.length = limit;
      // 抽回后按题库顺序练习
      ids.sort((a, b) => qById(a).id.localeCompare(qById(b).id));
    }
    state.practice = { ids, index: 0, answered: {} };
    location.hash = '#/quiz';
  }

  // ---------- 答题页 ----------
  function renderQuiz() {
    const p = state.practice;
    if (!p || !p.ids.length) {
      view().innerHTML = `<div class="empty"><span class="e-emoji">⚓</span>尚未开始练习<br>
        <a class="btn mt16" href="#/practice">去选择题库</a></div>`;
      return;
    }
    const q = qById(p.ids[p.index]);
    const answer = p.answered[q.id]; // {selected, correct, createdAt}
    const done = !!answer;
    const correctCount = Object.values(p.answered).filter((a) => a.correct).length;

    view().innerHTML = `
      <div class="card">
        <div class="q-meta">
          ${catBadge(q.category)}${typeBadge(q.type)}
          <span class="badge id">${esc(q.id)}</span>
          <span style="flex:1"></span>
          <span class="q-progress">${p.index + 1} / ${p.ids.length} · 本组对 ${correctCount} 题</span>
        </div>
        <div class="q-stem">${esc(q.stem)}</div>
        ${q.media ? renderMedia(q, done) : ''}
        <ul class="options">
          ${q.options.map((opt, i) => {
            let cls = '';
            if (done) {
              if (i === q.answer) cls = 'correct';
              else if (i === answer.selected) cls = 'wrong';
            }
            return `<li><button class="${cls}" data-i="${i}" ${done ? 'disabled' : ''}>
              <span class="key">${'ABCD'[i]}</span><span>${esc(opt)}</span>
            </button></li>`;
          }).join('')}
        </ul>
        ${done ? renderAnalysis(q, answer) : ''}
        <div class="q-nav">
          <button class="btn secondary" id="q-prev" ${p.index === 0 ? 'disabled' : ''}>← 上一题</button>
          ${p.index === p.ids.length - 1
            ? '<button class="btn gold" id="q-finish">结束练习 📊</button>'
            : '<button class="btn" id="q-next" ' + (done ? '' : 'disabled') + '>下一题 →</button>'}
        </div>
        <div class="q-dots">
          ${p.ids.map((id, i) => {
            const a = p.answered[id];
            const cls = a ? (a.correct ? 'done-right' : 'done-wrong') : '';
            return `<button class="${cls} ${i === p.index ? 'current' : ''}" data-i="${i}">${i + 1}</button>`;
          }).join('')}
        </div>
      </div>
    `;

    if (!done) {
      view().querySelectorAll('.options button').forEach((btn) => {
        btn.addEventListener('click', () => submitAnswer(q, Number(btn.dataset.i)));
      });
    }
    $('#q-prev')?.addEventListener('click', () => { p.index = Math.max(0, p.index - 1); renderRoute(); });
    $('#q-next')?.addEventListener('click', () => { p.index = Math.min(p.ids.length - 1, p.index + 1); renderRoute(); });
    $('#q-finish')?.addEventListener('click', finishPractice);
    view().querySelectorAll('.q-dots button').forEach((b) =>
      b.addEventListener('click', () => { p.index = Number(b.dataset.i); renderRoute(); }));

    bindListening(q);
  }

  function renderMedia(q) {
    if (q.media.kind === 'svg') {
      return `<div class="q-media">${q.media.svg}</div>`;
    }
    if (q.media.kind === 'speech') {
      return `
        <div class="listen-box" id="listen-box">
          <button class="play" id="listen-play" title="播放听力"
            ${Speaker.supported ? '' : 'disabled'}>▶</button>
          <div>
            <div><b>英语听力</b> <span class="hint">${Speaker.supported ? '点击播放（可反复听）' : '当前浏览器不支持语音播放'}</span></div>
            <div class="hint">模拟 VHF / 机舱通话 · 听完后选择正确理解</div>
          </div>
          <button class="reveal" id="listen-reveal">👁 显示/隐藏听力原文</button>
          <div class="transcript" id="listen-transcript" hidden>${esc(q.media.text)}</div>
        </div>`;
    }
    return '';
  }

  function bindListening(q) {
    if (q.media?.kind !== 'speech') return;
    const playBtn = $('#listen-play');
    const revealBtn = $('#listen-reveal');
    const transcript = $('#listen-transcript');
    if (!playBtn) return;
    let stopFn = null;
    const setPlaying = (on) => {
      playBtn.classList.toggle('playing', on);
      playBtn.textContent = on ? '■' : '▶';
    };
    playBtn.addEventListener('click', () => {
      if (playBtn.classList.contains('playing')) { stopFn && stopFn(); setPlaying(false); return; }
      stopFn = Speaker.speak(q.media.text, q.media.lang || 'en-US', {
        onStart: () => setPlaying(true),
        onEnd: () => setPlaying(false),
        onError: () => { setPlaying(false); transcript.hidden = false; toast('语音不可用，已显示听力原文'); },
      });
    });
    revealBtn.addEventListener('click', () => { transcript.hidden = !transcript.hidden; });
    // 离开页面停止朗读
    Speaker.stop();
    if (playBtn.classList.contains('playing')) setPlaying(false);
  }

  function renderAnalysis(q, answer) {
    const correctLetter = 'ABCD'[q.answer];
    return `
      <div class="analysis">
        <h4>📖 题目解析</h4>
        <div class="verdict ${answer.correct ? 'right' : 'wrong'}">
          ${answer.correct ? '✅ 回答正确' : `❌ 回答错误，正确答案：${correctLetter}．${esc(q.options[q.answer])}`}
        </div>
        <div>${esc(q.explanation)}</div>
        ${verTagsHtml(q.versions)}
      </div>`;
  }

  async function submitAnswer(q, selected) {
    const correct = selected === q.answer;
    const now = Date.now();
    const record = {
      offlineId: attemptId(),
      userId: state.user.id,
      questionId: q.id,
      selected,
      correct,           // 本地即时判定，服务端同步时会重算校正
      createdAt: now,
      pending: 1,
    };
    state.practice.answered[q.id] = { selected, correct, createdAt: now };
    await QDB.addAttempt(record);
    state.attempts = await QDB.getAllAttempts();
    refreshStats();
    renderRoute();
    // 在线则自动同步（防抖）；离线时静默留在本机
    scheduleAutoSync();
  }

  function finishPractice() {
    const p = state.practice;
    const total = p.ids.length;
    const correctCount = Object.values(p.answered).filter((a) => a.correct).length;
    const rate = total ? Math.round((correctCount / total) * 100) : 0;
    state.practice = null;
    view().innerHTML = `
      <div class="card" style="text-align:center">
        <div style="font-size:46px">${rate >= 80 ? '🏆' : rate >= 60 ? '⛴️' : '🌊'}</div>
        <h2>本组练习完成</h2>
        <p>共 ${total} 题，答对 <b style="color:var(--ok)">${correctCount}</b> 题，正确率 <b>${rate}%</b></p>
        <div class="stat-grid mt16">
          <div class="stat-tile"><div class="num">${total - correctCount}</div><div class="lbl">本组错题</div></div>
          <div class="stat-tile"><div class="num">${state.stats.pending}</div><div class="lbl">待同步记录</div></div>
        </div>
        <div class="q-nav">
          <a class="btn secondary" href="#/practice">再来一组</a>
          <a class="btn" href="#/stats">查看统计</a>
        </div>
        ${state.stats.pending > 0 && isOnline()
          ? '<p class="muted mt16">🔄 作答正在后台同步…</p>'
          : state.stats.pending > 0
            ? '<p class="muted mt16">📴 离线作答已保存在本机，联网后自动同步</p>'
            : '<p class="muted mt16">✅ 作答已同步到服务器</p>'}
      </div>`;
    syncNow();
  }


  // ---------- 错题页 ----------
  function renderWrong() {
    const s = state.stats;
    const wrongIds = s.wrongQuestionIds;
    let html = `<div class="row-between">
      <h2 style="margin:2px 0 12px">🔁 错题重练 <small>按最新一次作答判定，共 ${wrongIds.length} 题</small></h2>
      ${wrongIds.length ? '<button class="btn gold sm" id="wrong-start-all">错题全部重练</button>' : ''}
    </div>`;
    if (!wrongIds.length) {
      html += `<div class="card"><div class="empty"><span class="e-emoji">🎉</span>暂无错题，保持状态！</div></div>`;
    } else {
      // 按类别分组
      const groups = { deck: [], engine: [], radio: [] };
      wrongIds.forEach((id) => { const q = qById(id); q && groups[q.category].push(q); });
      html += Object.entries(groups).filter(([, arr]) => arr.length).map(([cat, arr]) => `
        <div class="section-title">${CAT_META[cat].emoji} ${CAT_META[cat].label}（${arr.length}）</div>
        <div class="qlist">
          ${arr.map((q) => `
            <div class="qlist-item" data-qid="${esc(q.id)}">
              <span class="mark-wrong">✗</span>
              <div class="t">${esc(q.stem)}
                <span class="sub">${typeBadge(q.type)} <span class="badge id">${esc(q.id)}</span></span>
              </div>
              <a class="btn sm secondary" data-qid="${esc(q.id)}" href="javascript:void(0)">重练</a>
            </div>`).join('')}
        </div>
        <div class="mt8"><button class="btn secondary sm wrong-practice-cat" data-cat="${cat}">练本类错题（${arr.length} 题）</button></div>
      `).join('');
    }
    view().innerHTML = html;

    $('#wrong-start-all')?.addEventListener('click', () => {
      state.practice = { ids: wrongIds.slice(), index: 0, answered: {} };
      location.hash = '#/quiz';
    });
    view().querySelectorAll('.qlist-item').forEach((el) => {
      el.addEventListener('click', () => {
        const id = el.dataset.qid;
        state.practice = { ids: [id, ...wrongIds.filter((x) => x !== id)], index: 0, answered: {} };
        location.hash = '#/quiz';
      });
    });
    view().querySelectorAll('.wrong-practice-cat').forEach((b) => {
      b.addEventListener('click', () => { location.hash = `#/practice?cat=${b.dataset.cat}&mode=wrong`; });
    });
  }

  // ---------- 统计页 ----------
  function renderStats() {
    const s = state.stats;
    const ringPct = s.overallRate === null ? 0 : s.overallRate;
    const barTile = (t) => {
      const pct = t.rate === null ? 0 : t.rate;
      return `<div class="bar-row">
        <span class="bar-label">${t.label}</span>
        <span class="bar-track"><span class="bar-fill" style="width:${pct}%"></span></span>
        <span class="bar-val">${t.rate === null ? '未练习' : t.rate + '%'}</span>
      </div>
      <div class="muted" style="margin:-4px 0 10px 74px;font-size:12px">答对 ${t.correctCount} / ${t.total} 题</div>`;
    };
    view().innerHTML = `
      ${syncBannerHtml()}
      <div class="card">
        <h2>📊 总正确率</h2>
        <div class="ring-wrap">
          <div class="ring" style="--p:${ringPct}"><span>${s.overallRate === null ? '—' : s.overallRate + '%'}</span></div>
          <div>
            <div class="kv"><span>已练习题数</span><b>${s.totalAnswered} / ${state.questions.length}</b></div>
            <div class="kv"><span>累计作答次数</span><b>${s.attemptCount}</b></div>
            <div class="kv"><span>错题（最新一次答错）</span><b>${s.wrongQuestionIds.length}</b></div>
            <div class="kv"><span>待同步</span><b>${s.pending}</b></div>
          </div>
        </div>
      </div>

      <div class="section-title">专项题型正确率</div>
      <div class="card">
        ${barTile(s.byType.chart)}
        ${barTile(s.byType.colreg)}
        ${barTile(s.byType.listening)}
        ${barTile(s.byType.knowledge)}
        <a class="btn secondary sm" href="#/practice?cat=deck&type=chart">专攻海图题</a>
        <a class="btn secondary sm" href="#/practice?cat=deck&type=colreg">专攻避碰题</a>
        <a class="btn secondary sm" href="#/wrong">错题重练</a>
      </div>

      <div class="section-title">按船员类别</div>
      <div class="stat-grid">
        ${Object.values(s.byCategory).map((c) => `
          <div class="stat-tile">
            <div class="num">${c.rate === null ? '—' : c.rate + '%'}</div>
            <div class="lbl">${c.label}（${c.correctCount}/${c.total}）</div>
          </div>`).join('')}
      </div>

      <div class="section-title">服务端校正数据</div>
      <div class="card">
        ${state.serverStats ? `
          <p class="muted">上次成功同步后服务器统计（多设备进度以此为准）：</p>
          <div class="kv"><span>服务端记录题数</span><b>${state.serverStats.totalAnswered ?? '—'}</b></div>
          <div class="kv"><span>服务端总正确率</span><b>${pctOrDash(state.serverStats.overallRate)}</b></div>
          <div class="kv"><span>海图题 / 避碰题 / 听力</span>
            <b>${state.serverStats.byType?.chart.rate ?? '—'}% / ${state.serverStats.byType?.colreg.rate ?? '—'}% / ${state.serverStats.byType?.listening.rate ?? '—'}%</b></div>
        ` : `<p class="muted">尚未成功同步过。在线作答后会自动把进度上传并在此校正。</p>`}
        <button class="btn block mt16" id="stats-sync">🔄 立即同步并校正</button>
      </div>
    `;
    bindSyncBanner();
    $('#stats-sync').addEventListener('click', async () => {
      await syncNow({ manual: true });
    });
  }

  // ---------- 路由 ----------
  const routes = {
    '': renderHome,
    home: renderHome,
    practice: renderPractice,
    quiz: renderQuiz,
    wrong: renderWrong,
    stats: renderStats,
    settings: renderSettings,
  };

  function renderRoute() {
    const raw = location.hash.replace(/^#\/?/, '');
    const name = raw.split('?')[0] || 'home';
    const fn = routes[name] || renderHome;
    window.scrollTo({ top: 0 });
    fn();
    updateChrome();
  }



  window.MQ = { state, refreshStats, syncNow, toast };
  document.addEventListener('DOMContentLoaded', init);
})();
