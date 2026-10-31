// tests/serviceWorker.test.mjs
// Runs the real sw.js in a fake browser and checks what a student sees.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { ROOT } from './helpers/sourceTools.mjs';

const code = readFileSync(`${ROOT}/public/sw.js`, 'utf8');

/** Load sw.js with fake `caches` and `fetch`; returns a function that simulates a page request. */
function loadServiceWorker({ putFails = false, online = true } = {}) {
  const handlers = {};
  const self = {
    location: new URL('http://localhost/sw.js'),
    addEventListener: (type, fn) => { handlers[type] = fn; },
    importScripts() {},
    clients: { claim: async () => {} },
    PRECACHE: { coreVersion: 'c1', enginesVersion: 'e1', core: [], engines: [] },
  };
  const cache = {
    put: async () => { if (putFails) throw Object.assign(new Error('Quota exceeded'), { name: 'QuotaExceededError' }); },
    addAll: async () => {},
  };
  const caches = { match: async () => undefined, open: async () => cache, keys: async () => [], delete: async () => true };
  const fetchFn = async () => {
    if (!online) throw new TypeError('Failed to fetch');
    return new Response('engine bytes', { status: 200 });
  };
  const sandbox = { self, caches, fetch: fetchFn, importScripts: () => {}, URL, Request, Response, Promise, JSON, console };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);

  return async (path, mode = 'cors') => {
    let answer;
    handlers.fetch({ request: new Request(`http://localhost${path}`, { mode: mode === 'navigate' ? undefined : mode }), respondWith: (p) => { answer = p; } });
    return answer;
  };
}

test('an engine file is served when the browser has no room to save a copy of it', async () => {
  const request = loadServiceWorker({ putFails: true, online: true });
  const response = await request('/vendor/pyodide/pyodide.asm.wasm');
  assert.equal(response.status, 200, 'the student is online, so the file must still load');
  assert.equal(await response.text(), 'engine bytes');
});

test('an engine file is saved on first use', async () => {
  const request = loadServiceWorker();
  assert.equal((await request('/vendor/pyodide/pyodide.asm.js')).status, 200);
});

test('offline and not saved -> a clear 503 message', async () => {
  const request = loadServiceWorker({ online: false });
  const response = await request('/vendor/pyodide/pyodide.asm.wasm');
  assert.equal(response.status, 503);
  assert.match(await response.text(), /offline/i);
});
