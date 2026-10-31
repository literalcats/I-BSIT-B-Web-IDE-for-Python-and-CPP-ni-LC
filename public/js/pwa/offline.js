// js/pwa/offline.js
// ---------------------------------------------------------------------------
// Answers "can I use this app with no internet?" and downloads the big engine
// files on request. It reads the browser's Cache Storage directly (the same
// place the service worker saves files).
// ---------------------------------------------------------------------------

const PREFIX = 'bsit-';
const PARALLEL_DOWNLOADS = 3;

export const formatMB = (bytes) => `${(bytes / 1024 / 1024).toFixed(bytes < 10 * 1024 * 1024 ? 1 : 0)} MB`;

/**
 * Pure helper (easy to test): given the manifest and the saved addresses,
 * work out how much is ready.
 */
export function summarizeOffline(manifest, coreCacheExists, coreKeys, engineKeys) {
  const savedCore = new Set(coreKeys);
  const savedEngines = new Set(engineKeys);
  const engines = manifest.engines || [];

  const engineFilesSaved = engines.filter((file) => savedEngines.has(file.url));
  const bytesTotal = engines.reduce((sum, file) => sum + file.size, 0);
  const bytesSaved = engineFilesSaved.reduce((sum, file) => sum + file.size, 0);

  const coreReady = coreCacheExists && manifest.core.every((url) => savedCore.has(url));
  const enginesReady = engines.length > 0 && engineFilesSaved.length === engines.length;

  return {
    coreReady,
    enginesReady,
    enginesMissing: engines.length === 0, // this build has no engine files at all
    filesSaved: engineFilesSaved.length,
    filesTotal: engines.length,
    bytesSaved,
    bytesTotal,
    // "ready" = a student with no internet can open the app and run code
    ready: coreReady && enginesReady,
  };
}

/**
 * Pure helper (easy to test): turn the summary into the words shown on screen.
 * Returns { chip, text, canDownload }.
 */
export function describeOffline(status) {
  if (status.unavailable) {
    return { chip: 'Offline: not available here', text: status.reason, canDownload: false };
  }
  if (status.enginesMissing) {
    return {
      chip: 'Offline: engines missing',
      text: 'This copy of the app was built without the Python, C++ and editor files, so code cannot run. The person who deployed it needs to run "npm run build".',
      canDownload: false,
    };
  }
  if (status.ready) {
    return {
      chip: 'Offline: ready ✓',
      text: 'Everything is saved on this device. You can open Code Lab with no internet and run Python and C++.',
      canDownload: false,
    };
  }
  if (!status.coreReady) {
    return {
      chip: 'Offline: getting ready…',
      text: 'The app is saving its own files for offline use. This takes a few seconds on the first visit. Stay online, then check again.',
      canDownload: false,
    };
  }
  return {
    chip: 'Offline: needs download',
    text: `The app opens offline already, but running code needs the Python, C++ and editor files (${formatMB(status.bytesTotal - status.bytesSaved)} left to download). Do this once while you have internet.`,
    canDownload: true,
  };
}

export function createOfflineManager() {
  const supported = 'caches' in window;

  async function loadManifest() {
    const response = await fetch('/precache.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('precache.json not found');
    return response.json();
  }

  async function pathsIn(cacheName) {
    if (!(await caches.has(cacheName))) return [];
    const cache = await caches.open(cacheName);
    return (await cache.keys()).map((request) => new URL(request.url).pathname);
  }

  return {
    supported,

    /** Returns the summary above, or { unavailable: true } when offline mode cannot work here. */
    async getStatus() {
      if (!supported) return { unavailable: true, reason: 'This browser cannot save files for offline use.' };
      if (!('serviceWorker' in navigator)) return { unavailable: true, reason: 'This browser has no service worker support.' };
      let manifest;
      try {
        manifest = await loadManifest();
      } catch {
        return { unavailable: true, reason: 'The offline file list could not be read. Reload the page.' };
      }
      const coreName = `${PREFIX}core-${manifest.coreVersion}`;
      const engineName = `${PREFIX}engines-${manifest.enginesVersion}`;
      const coreExists = await caches.has(coreName);
      return summarizeOffline(manifest, coreExists, await pathsIn(coreName), await pathsIn(engineName));
    },

    /**
     * Download every engine file that is not saved yet.
     * onProgress({ bytesSaved, bytesTotal }) is called as files arrive.
     * Throws an Error with a friendly message if some files fail.
     */
    async downloadEngines(onProgress = () => {}) {
      const manifest = await loadManifest();
      const engineName = `${PREFIX}engines-${manifest.enginesVersion}`;
      const cache = await caches.open(engineName);
      const have = new Set((await cache.keys()).map((request) => new URL(request.url).pathname));

      const bytesTotal = manifest.engines.reduce((sum, file) => sum + file.size, 0);
      let bytesSaved = manifest.engines.filter((f) => have.has(f.url)).reduce((sum, f) => sum + f.size, 0);
      const queue = manifest.engines.filter((file) => !have.has(file.url));
      let failed = 0;
      onProgress({ bytesSaved, bytesTotal });

      async function worker() {
        while (queue.length > 0) {
          const file = queue.shift();
          try {
            const response = await fetch(file.url, { cache: 'reload' });
            if (!response.ok) throw new Error(String(response.status));
            await cache.put(file.url, response);
            bytesSaved += file.size;
            onProgress({ bytesSaved, bytesTotal });
          } catch {
            failed += 1;
          }
        }
      }
      await Promise.all(Array.from({ length: PARALLEL_DOWNLOADS }, worker));

      if (failed > 0) {
        throw new Error(`${failed} file${failed === 1 ? '' : 's'} could not be downloaded. Check your connection and try again.`);
      }
    },
  };
}
