// js/pwa/register.js
// Turns on the service worker and tells the app when an UPDATE is ready.
//
// Update flow: a new deploy installs quietly in the background and WAITS.
// We show "A new version is ready" with a Reload button. Tapping it asks the
// waiting worker to take over, then the page reloads once.

export function registerServiceWorker({ onUpdateReady }) {
  if (!('serviceWorker' in navigator)) return;

  let reloadRequested = false;

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // A new worker took over. Only reload if the student asked for the update.
    if (reloadRequested) window.location.reload();
  });

  const start = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');

      const offerUpdate = (worker) =>
        onUpdateReady(() => {
          reloadRequested = true;
          worker.postMessage({ type: 'skip-waiting' });
        });

      // An update was already waiting when the page opened.
      if (registration.waiting && navigator.serviceWorker.controller) offerUpdate(registration.waiting);

      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        if (!worker) return;
        worker.addEventListener('statechange', () => {
          // "installed" while an older worker still controls the page = an update is waiting.
          if (worker.state === 'installed' && navigator.serviceWorker.controller) offerUpdate(worker);
        });
      });

      // Look for updates each time the student comes back to the app.
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') registration.update().catch(() => {});
      });
    } catch (error) {
      console.warn('The service worker could not start (offline mode unavailable):', error);
    }
  };

  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start, { once: true });
}
