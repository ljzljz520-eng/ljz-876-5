/**
 * 航海船员证书刷题站 — 服务端
 * 零数据库依赖：JSON 文件持久化（lib/store.js）
 */
const path = require('path');
const express = require('express');
const store = require('./lib/store');

const app = express();
app.use(express.json({ limit: '2mb' }));

// ---------- 工具 ----------
function ok(res, data) {
  res.json({ ok: true, data });
}
function fail(res, status, message) {
  res.status(status).json({ ok: false, error: message });
}

// ---------- API ----------

// 引导数据：题库 + 版本目录（Service Worker 也会缓存此接口供离线使用）
app.get('/api/bootstrap', (req, res) => {
  ok(res, {
    questions: store.questions,
    versions: store.versions,
    serverTime: Date.now(),
  });
});

// 用户注册/更新（本地生成 id 后上报）
app.post('/api/users', (req, res) => {
  try {
    const { id, name, role } = req.body || {};
    ok(res, { user: store.upsertUser({ id, name, role }) });
  } catch (e) {
    fail(res, e.status || 500, e.message);
  }
});

// 离线进度同步（幂等：offlineId 去重，服务端重算对错）
app.post('/api/sync', (req, res) => {
  try {
    const { userId, attempts } = req.body || {};
    if (!userId) return fail(res, 400, '缺少 userId');
    const result = store.syncAttempts(userId, attempts);
    ok(res, {
      ...result,
      stats: store.getStats(userId),
      serverTime: Date.now(),
    });
  } catch (e) {
    fail(res, e.status || 500, e.message);
  }
});

// 拉取统计（错题重练页/统计页在线时校正本地数据）
app.get('/api/stats/:userId', (req, res) => {
  try {
    ok(res, { stats: store.getStats(req.params.userId) });
  } catch (e) {
    fail(res, e.status || 500, e.message);
  }
});

app.get('/api/health', (req, res) => ok(res, { status: 'up', time: Date.now() }));

// ---------- 静态资源（PWA 前端） ----------
const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir, { etag: true, lastModified: true }));

// SPA 回退：非 /api 路径一律返回 index.html
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api/')) {
    return res.sendFile(path.join(publicDir, 'index.html'));
  }
  next();
});

// 错误兜底
app.use((err, req, res, next) => {
  console.error('[server]', err);
  fail(res, 500, '服务器内部错误');
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const server = app.listen(PORT, HOST, () => {
  console.log(`⚓ 航海船员证书刷题站已启动: http://${HOST}:${PORT}`);
});

function gracefulExit() {
  server.close(() => {
    store.saveSync();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 3000).unref();
}
process.on('SIGTERM', gracefulExit);
process.on('SIGINT', gracefulExit);
