/* Service Worker：离线刷题支持
 * - 应用外壳：预缓存
 * - 题库接口 /api/bootstrap：stale-while-revalidate（离线直接返回缓存题库）
 * - 同步类 POST：不拦截（离线时由前端写入 IndexedDB，上线后重放）
 */
const CACHE_VERSION = 'mq-v1';
const SHELL = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/js/db.js',
  '/js/api.js',
  '/js/speech.js',
  '/js/app.js',
  '/manifest.webmanifest',
  '/icons/icon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
      .catch((err) => console.warn('[SW] 预缓存部分失败：', err)),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))),
    ).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return; // POST 同步请求直接走网络，由前端处理失败重试

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // 题库引导接口：网络优先刷新缓存，离线时回退缓存
  if (url.pathname === '/api/bootstrap') {
    event.respondWith(
      fetch(req).then((resp) => {
        const copy = resp.clone();
        caches.open(CACHE_VERSION).then((c) => c.put(req, copy));
        return resp;
      }).catch(() => caches.match(req).then((r) => r || new Response(
        JSON.stringify({ ok: false, error: 'offline' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } },
      ))),
    );
    return;
  }

  // 其他 GET（静态资源 / 页面）：缓存优先，后台更新
  if (url.pathname.startsWith('/api/')) return; // 实时类 API 不缓存
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req).then((resp) => {
        if (resp && resp.status === 200) {
          const copy = resp.clone();
          caches.open(CACHE_VERSION).then((c) => c.put(req, copy));
        }
        return resp;
      }).catch(() => cached);
      return cached || network;
    }),
  );
});

// 页面可主动触发更新检查
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});
