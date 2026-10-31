// js/app/setupPwa.js
// The "installable, works offline" side of the app: the service worker, the
// Install button, and the offline / storage information.

import { byId, el } from '../core/dom.js';
import { createOfflineManager } from '../pwa/offline.js';
import { initInstallButton } from '../pwa/install.js';
import { registerServiceWorker } from '../pwa/register.js';
import { requestPersistence } from '../storage/index.js';
import { bindClose, openDialog } from '../ui/dialogs.js';
import { createStorageInfo } from '../ui/storageInfo.js';

/** Start the service worker. Called first, so it works even if the database cannot open. */
export function startServiceWorker({ notify }) {
  registerServiceWorker({
    onUpdateReady: (apply) => notify('A new version of Code Lab is ready.', { actionLabel: 'Reload', onAction: apply, sticky: true }),
  });
}

export function setupInstallButton() {
  initInstallButton({
    button: byId('btn-install'),
    showHelp: ({ intro, steps }) => {
      byId('install-intro').textContent = intro;
      byId('install-steps').replaceChildren(...steps.map((step) => el('li', { text: step })));
      openDialog(byId('dlg-install'));
    },
  });
  bindClose('dlg-install', 'install-close');
}

export function setupOfflineInfo({ persistent }) {
  const offline = createOfflineManager();
  const storageInfo = createStorageInfo({ offline, persistent, askPersistence: requestPersistence });

  setTimeout(() => storageInfo.offerDownloadOnce(), 4000);
  window.addEventListener('online', () => storageInfo.refresh());
  window.addEventListener('offline', () => storageInfo.refresh());
  return storageInfo;
}
