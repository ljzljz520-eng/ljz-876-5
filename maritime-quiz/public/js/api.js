/* 轻量 API 客户端：在线失败时抛出，调用方负责回退到 IndexedDB */
(function (global) {
  'use strict';

  async function request(method, url, body) {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' },
      // 离线时快速失败，不卡 UI
      signal: AbortSignal.timeout(8000),
    };
    if (body !== undefined) opts.body = JSON.stringify(body);
    const resp = await fetch(url, opts);
    let payload = null;
    try { payload = await resp.json(); } catch { /* ignore */ }
    if (!resp.ok || !payload || payload.ok === false) {
      const err = new Error((payload && payload.error) || `请求失败 (${resp.status})`);
      err.status = resp.status;
      throw err;
    }
    return payload.data;
  }

  global.API = {
    bootstrap: () => request('GET', '/api/bootstrap'),
    saveUser: (user) => request('POST', '/api/users', user),
    sync: (userId, attempts) => request('POST', '/api/sync', { userId, attempts }),
    stats: (userId) => request('GET', `/api/stats/${encodeURIComponent(userId)}`),
  };
})(window);
