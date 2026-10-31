// js/storage/memory.js
// A pretend database that lives only in memory. It has exactly the same
// methods as the real one (idb.js). We use it:
//   - in automated tests, and
//   - as a safety net when the browser refuses IndexedDB (some private modes).
// In that second case files vanish when the tab closes, and the app warns the student.

import { KEY_PATHS, STORES } from './schema.js';

export function createMemoryAdapter() {
  const tables = Object.fromEntries(STORES.map((name) => [name, new Map()]));

  return {
    kind: 'memory',

    async getAll(store) {
      return [...tables[store].values()].map((record) => structuredClone(record));
    },

    async get(store, key) {
      const record = tables[store].get(key);
      return record === undefined ? undefined : structuredClone(record);
    },

    async put(store, value) {
      tables[store].set(value[KEY_PATHS[store]], structuredClone(value));
    },

    async remove(store, key) {
      tables[store].delete(key);
    },

    async clear(store) {
      tables[store].clear();
    },
  };
}
