// sw.js  -  the SERVICE WORKER: the part that makes the app work offline.
// ---------------------------------------------------------------------------
// A service worker sits between the page and the network. Every file the page
// asks for goes through here first:
//   1. If we saved a copy -> hand it over (instant, works with no internet).
//   2. If not -> fetch it from the internet, and save big engine files for next time.
//
// What gets saved, and when:
//   * "core" files (page, styles, scripts, cheat sheets, presets): saved when the
//     app is first opened (small).
//   * "engine" files (Python, editor, C++): saved the first time they are used,
//     or all at once with the "Download offline files" button.
//
// precache.js (made by `npm run build`) lists the files and a version number.
// A new deploy changes the version, so students get the update automatically.
// ---------------------------------------------------------------------------

importScripts('/precache.js'); // defines self.PRECACHE

const MANIFEST = self.PRECACHE;
const PREFIX = 'bsit-';
const CORE_CACHE = `${PREFIX}core-${MANIFEST.coreVersion}`;
const ENGINE_CACHE = `${PREFIX}engines-${MANIFEST.enginesVersion}`;

// ---- Install: save the core files -----------------------------------------
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CORE_CACHE);
      // cache: 'reload' skips the browser's own cache, so we never save a stale file.
      await cache.addAll(MANIFEST.core.map((url) => new Request(url, { cache: 'reload' })));
    })(),
  );
  // No skipWaiting() here on purpose: a new version waits until the old tabs are
  // closed (or the student taps "Reload"), so a page is never half old, half new.
});

// ---- Activate: remove saved files from older versions ---------------------
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const name of await caches.keys()) {
        if (name.startsWith(PREFIX) && name !== CORE_CACHE && name !== ENGINE_CACHE) {
          await caches.delete(name);
        }
      }
      await self.clients.claim(); // start controlling open pages right away
    })(),
  );
});

// The page can ask a waiting update to take over ("Reload to update").
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'skip-waiting') self.skipWaiting();
});

// ---- Fetch: answer from the saved copy, otherwise from the network --------
self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // never touch other websites

  // The page asks for the version list; answer with the copy this worker knows.
  if (url.pathname === '/precache.json') {
    event.respondWith(new Response(JSON.stringify(MANIFEST), { headers: { 'Content-Type': 'application/json' } }));
    return;
  }

  event.respondWith(answer(request, url));
});

async function answer(request, url) {
  const saved = await caches.match(request, { ignoreSearch: true });
  if (saved) return saved;

  try {
    const response = await fetch(request);
    // Save engine files the first time they are used, so they work offline next time.
    if (response.ok && url.pathname.startsWith('/vendor/')) {
      // Saving a copy can fail (storage full, partial response). That must NOT turn a
      // good download into an "offline" error, so it gets its own try/catch.
      try {
        const cache = await caches.open(ENGINE_CACHE);
        await cache.put(request, response.clone());
      } catch {
        /* no copy saved this time; the student still gets the file */
      }
    }
    return response;
  } catch {
    // Offline and not saved. For page loads, show the app itself.
    if (request.mode === 'navigate') {
      const home = await caches.match('/');
      if (home) return home;
    }
    return new Response('You are offline and this file has not been saved yet.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}
