/* IndexedDB 封装：题库缓存 / 作答记录 / 元信息
 * 离线刷题时作答先写入本地 attemptsStore（pending=1），
 * 联网同步成功后标记 pending=0，并写入服务器返回的服务端统计。
 */
(function (global) {
  'use strict';

  const DB_NAME = 'maritime-quiz';
  const DB_VERSION = 1;
  const STORE = {
    META: 'meta',           // key/value：bootstrap 数据、用户、serverStats
    ATTEMPTS: 'attempts',   // 作答记录，keyPath offlineId
  };

  let dbPromise = null;

  function openDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE.META)) db.createObjectStore(STORE.META);
        if (!db.objectStoreNames.contains(STORE.ATTEMPTS)) {
          const s = db.createObjectStore(STORE.ATTEMPTS, { keyPath: 'offlineId' });
          s.createIndex('pending', 'pending', { unique: false });
          s.createIndex('questionId', 'questionId', { unique: false });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbPromise;
  }

  function tx(storeName, mode) {
    return openDB().then(
      (db) => db.transaction(storeName, mode).objectStore(storeName),
    );
  }

  function metaGet(key) {
    return tx(STORE.META, 'readonly').then(
      (s) => new Promise((res, rej) => {
        const r = s.get(key);
        r.onsuccess = () => res(r.result);
        r.onerror = () => rej(r.error);
      }),
    );
  }

  function metaSet(key, value) {
    return tx(STORE.META, 'readwrite').then(
      (s) => new Promise((res, rej) => {
        const r = s.put(value, key);
        r.onsuccess = () => res();
        r.onerror = () => rej(r.error);
      }),
    );
  }

  function addAttempt(attempt) {
    return tx(STORE.ATTEMPTS, 'readwrite').then(
      (s) => new Promise((res, rej) => {
        const r = s.put(attempt);
        r.onsuccess = () => res();
        r.onerror = () => rej(r.error);
      }),
    );
  }

  function getAllAttempts() {
    return tx(STORE.ATTEMPTS, 'readonly').then(
      (s) => new Promise((res, rej) => {
        const r = s.getAll();
        r.onsuccess = () => res(r.result || []);
        r.onerror = () => rej(r.error);
      }),
    );
  }

  function getPendingAttempts() {
    return tx(STORE.ATTEMPTS, 'readonly').then((s) => {
      const idx = s.index('pending');
      return new Promise((res, rej) => {
        const r = idx.getAll(1);
        r.onsuccess = () => res(r.result || []);
        r.onerror = () => rej(r.error);
      });
    });
  }

  function markSynced(offlineIds, serverAttempts) {
    const map = new Map((serverAttempts || []).map((a) => [a.offlineId, a]));
    return tx(STORE.ATTEMPTS, 'readwrite').then((s) => new Promise((res, rej) => {
      let remaining = offlineIds.length;
      if (!remaining) return res();
      offlineIds.forEach((id) => {
        const getReq = s.get(id);
        getReq.onsuccess = () => {
          const row = getReq.result;
          if (row) {
            row.pending = 0;
            const sa = map.get(id);
            if (sa) {
              row.correct = sa.correct; // 以服务端重算为准
              row.serverCreatedAt = sa.createdAt;
            }
            const putReq = s.put(row);
            putReq.onsuccess = () => { if (--remaining === 0) res(); };
            putReq.onerror = () => rej(putReq.error);
          } else if (--remaining === 0) res();
        };
        getReq.onerror = () => rej(getReq.error);
      });
    }));
  }

  function removeAttempt(offlineId) {
    return tx(STORE.ATTEMPTS, 'readwrite').then((s) => new Promise((res, rej) => {
      const r = s.delete(offlineId);
      r.onsuccess = () => res();
      r.onerror = () => rej(r.error);
    }));
  }

  global.QDB = {
    metaGet, metaSet,
    addAttempt, getAllAttempts, getPendingAttempts, markSynced, removeAttempt,
  };
})(window);
