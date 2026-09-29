// IndexedDB 封装：离线题库缓存 + 答题发件箱（outbox）
const IDB = (() => {
  const DB_NAME = 'maritime-crew';
  const DB_VERSION = 1;
  let dbp = null;

  function open() {
    if (dbp) return dbp;
    dbp = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv');
        if (!db.objectStoreNames.contains('outbox')) {
          const s = db.createObjectStore('outbox', { keyPath: 'uuid' });
          s.createIndex('ts', 'ts', { unique: false });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbp;
  }

  async function tx(store, mode, fn) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const t = db.transaction(store, mode);
      const s = t.objectStore(store);
      const r = fn(s);
      t.oncomplete = () => resolve(r);
      t.onerror = () => reject(t.error);
    });
  }

  return {
    async get(key) {
      return tx('kv', 'readonly', s => new Promise((res) => {
        const r = s.get(key);
        r.onsuccess = () => res(r.result);
        r.onerror = () => res(undefined);
      }));
    },
    async set(key, val) {
      return tx('kv', 'readwrite', s => { s.put(val, key); });
    },
    async addAnswer(answer) {
      return tx('outbox', 'readwrite', s => { s.put(answer); });
    },
    async pendingAnswers() {
      return tx('outbox', 'readonly', s => new Promise((res) => {
        const r = s.getAll();
        r.onsuccess = () => res(r.result || []);
      }));
    },
    async removeAnswers(uuids) {
      return tx('outbox', 'readwrite', s => { uuids.forEach(u => s.delete(u)); });
    },
  };
})();
