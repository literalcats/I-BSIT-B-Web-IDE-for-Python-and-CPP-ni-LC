// js/storage/idb.js
// ---------------------------------------------------------------------------
// The REAL database: IndexedDB, built into every modern browser.
// This is where students' files are saved ON THEIR OWN DEVICE.
//
// IndexedDB's raw API is clumsy (lots of callbacks), so this file wraps it in
// five simple async methods. Libraries like Dexie.js do the same job; we wrote
// a small one so the app has no extra dependency to download or break.
//
// HOW TO CHANGE THE DATABASE LATER (a "migration"):
//   1. Raise APP.dbVersion in js/config.js by 1 (1 -> 2).
//   2. Add a function below under MIGRATIONS with that number.
//   Students who already have version 1 are upgraded automatically and keep
//   all their files. Never edit an old migration - add a new one.
// ---------------------------------------------------------------------------

import { KEY_PATHS } from './schema.js';

const MIGRATIONS = {
  1(db) {
    db.createObjectStore('files', { keyPath: KEY_PATHS.files });
    db.createObjectStore('settings', { keyPath: KEY_PATHS.settings });
  },
};

export function openIdbAdapter({ name, version }) {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available in this browser.'));
      return;
    }

    let request;
    try {
      request = indexedDB.open(name, version);
    } catch (error) {
      reject(error);
      return;
    }

    request.onupgradeneeded = (event) => {
      // Run every migration the student's database has not seen yet.
      for (let step = event.oldVersion + 1; step <= version; step += 1) {
        if (MIGRATIONS[step]) MIGRATIONS[step](request.result, request.transaction);
      }
    };
    request.onerror = () => reject(request.error);
    request.onblocked = () => {
      reject(new Error('Another Code Lab tab is using an older version. Close the other tabs and reload.'));
    };
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => db.close(); // let a newer tab upgrade the database
      resolve(createAdapter(db));
    };
  });
}

function createAdapter(db) {
  /**
   * Run one IndexedDB operation and wait until it is truly saved
   * (the transaction "complete" event), not just requested.
   */
  function run(storeName, mode, work) {
    return new Promise((resolve, reject) => {
      let result;
      const transaction = db.transaction(storeName, mode);
      transaction.oncomplete = () => resolve(result);
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error || new Error('The database stopped the save.'));
      const request = work(transaction.objectStore(storeName));
      if (request) {
        request.onsuccess = () => {
          result = request.result;
        };
      }
    });
  }

  return {
    kind: 'indexeddb',
    getAll: (store) => run(store, 'readonly', (s) => s.getAll()),
    get: (store, key) => run(store, 'readonly', (s) => s.get(key)),
    put: (store, value) => run(store, 'readwrite', (s) => s.put(value)),
    remove: (store, key) => run(store, 'readwrite', (s) => s.delete(key)),
    clear: (store) => run(store, 'readwrite', (s) => s.clear()),
  };
}
