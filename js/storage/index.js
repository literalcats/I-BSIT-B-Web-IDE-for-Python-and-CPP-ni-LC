// js/storage/index.js
// The one place the rest of the app calls to get the file store.
// It tries the real database (IndexedDB). If the browser refuses (some private
// windows do), it falls back to memory and tells the app, so the student sees
// a clear warning instead of silently losing work.

import { APP } from '../config.js';
import { openIdbAdapter } from './idb.js';
import { createMemoryAdapter } from './memory.js';
import { createFileStore } from './fileStore.js';

/** Returns { store, persistent, reason }. `persistent` is false in the fallback case. */
export async function openStorage() {
  try {
    const adapter = await openIdbAdapter({ name: APP.dbName, version: APP.dbVersion });
    return { store: createFileStore(adapter), persistent: true, reason: null };
  } catch (error) {
    console.warn('IndexedDB unavailable, using temporary memory storage:', error);
    return {
      store: createFileStore(createMemoryAdapter()),
      persistent: false,
      reason: error && error.message ? error.message : 'IndexedDB is unavailable.',
    };
  }
}

/**
 * Ask the browser to protect our data from automatic clean-up.
 * Returns 'granted', 'denied' or 'unsupported'.
 */
export async function requestPersistence() {
  if (!navigator.storage || !navigator.storage.persist) return 'unsupported';
  try {
    if (await navigator.storage.persisted()) return 'granted';
    return (await navigator.storage.persist()) ? 'granted' : 'denied';
  } catch {
    return 'unsupported';
  }
}
