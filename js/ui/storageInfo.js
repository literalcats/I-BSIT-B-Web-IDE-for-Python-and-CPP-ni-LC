// js/ui/storageInfo.js
// Tells students, in plain words:
//   * WHERE their files are saved (in this browser, on this device),
//   * whether the browser promises to keep them,
//   * whether the app works OFFLINE yet, and lets them download the engines.

import { byId } from '../core/dom.js';
import { describeOffline, formatMB } from '../pwa/offline.js';
import { openDialog } from './dialogs.js';
import { showToast } from './toast.js';

const PROMPTED_KEY = 'bsit.offlinePrompted';

export function createStorageInfo({ offline, persistent, askPersistence }) {
  const chip = byId('offline-chip');
  const note = byId('storage-note');
  const detail = byId('offline-detail');
  const progress = byId('offline-progress');
  const downloadButton = byId('btn-offline-download');
  const persistText = byId('storage-persist-text');
  let busy = false;

  // ---- The note at the bottom of the file list -----------------------------
  note.textContent = persistent
    ? 'Saved on this device, in your browser (IndexedDB). Nothing is uploaded.'
    : '⚠ Saving is OFF here (private window?). Files disappear when you close the tab. Use "Back up all files".';

  async function refresh() {
    const status = await offline.getStatus();
    const view = describeOffline(status);
    chip.textContent = view.chip;
    detail.textContent = view.text;
    downloadButton.hidden = !view.canDownload;
    downloadButton.textContent = view.canDownload
      ? `Download offline files (${formatMB(status.bytesTotal - status.bytesSaved)})`
      : 'Download offline files';
    return status;
  }

  async function describePersistence() {
    const result = await askPersistence();
    persistText.textContent =
      result === 'granted'
        ? 'Your browser has agreed to keep this data, so it will not be cleared automatically when the device runs low on space.'
        : result === 'denied'
          ? 'Your browser may clear this data if the device runs low on space. Installing the app and using "Back up all files" now and then keeps your work safe.'
          : 'Your browser did not say whether it will keep this data. Use "Back up all files" now and then to be safe.';
  }

  async function startDownload() {
    if (busy) return;
    busy = true;
    downloadButton.disabled = true;
    progress.hidden = false;
    progress.value = 0;
    detail.textContent = 'Downloading… keep this window open.';
    try {
      await offline.downloadEngines(({ bytesSaved, bytesTotal }) => {
        progress.value = bytesTotal === 0 ? 100 : Math.round((bytesSaved / bytesTotal) * 100);
      });
      showToast('Offline files saved. Code Lab now works without internet.');
    } catch (error) {
      showToast(error.message, { error: true });
    } finally {
      busy = false;
      downloadButton.disabled = false;
      progress.hidden = true;
      await refresh();
    }
  }

  downloadButton.addEventListener('click', startDownload);
  byId('btn-storage-info').addEventListener('click', () => api.open());
  byId('mi-storage').addEventListener('click', () => api.open());
  byId('storage-close').addEventListener('click', () => byId('dlg-storage').close());

  const api = {
    refresh,

    async open() {
      openDialog(byId('dlg-storage'));
      persistText.textContent = 'Checking whether your browser protects this data…';
      await Promise.all([refresh(), describePersistence()]);
    },

    /** Once, after the first load: offer the download if the engines are not saved yet. */
    async offerDownloadOnce() {
      const status = await refresh();
      if (status.unavailable || status.enginesMissing || status.ready || !status.coreReady) return;
      try {
        if (localStorage.getItem(PROMPTED_KEY)) return;
        localStorage.setItem(PROMPTED_KEY, '1');
      } catch {
        /* no localStorage: offer it anyway */
      }
      showToast('Want Code Lab to work offline?', { actionLabel: 'Download', onAction: () => api.open(), sticky: true });
    },
  };

  return api;
}
