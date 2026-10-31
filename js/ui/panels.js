// js/ui/panels.js
// Shows and hides the side panels (Files on the left, Cheat sheet on the right).
//
//   Wide screens  : Files is always visible; the cheat sheet opens beside the editor.
//   Narrow screens: panels slide OVER the editor, with a dark backdrop behind them.
//
// The breakpoints below must match css/layout.css.

import { byId } from '../core/dom.js';

const MEDIA_FILES_OVERLAY = '(max-width: 819px)';
const MEDIA_CHEAT_OVERLAY = '(max-width: 1099px)';

export function createPanels({ onLayoutChange = () => {} } = {}) {
  const files = byId('files-panel');
  const cheat = byId('cheat-panel');
  const scrim = byId('scrim');
  const filesButton = byId('btn-files');
  const cheatButton = byId('btn-cheat');

  const isOverlay = (query) => window.matchMedia(query).matches;

  function setOpen(panel, button, open) {
    panel.classList.toggle('panel--open', open);
    button.setAttribute('aria-expanded', String(open));
  }

  function refresh() {
    // The scrim (dark backdrop) only shows while an OVERLAY panel is open.
    const filesOverlayOpen = files.classList.contains('panel--open') && isOverlay(MEDIA_FILES_OVERLAY);
    const cheatOverlayOpen = cheat.classList.contains('panel--open') && isOverlay(MEDIA_CHEAT_OVERLAY);
    scrim.hidden = !(filesOverlayOpen || cheatOverlayOpen);
    onLayoutChange();
  }

  const api = {
    openFiles() { setOpen(files, filesButton, true); if (isOverlay(MEDIA_CHEAT_OVERLAY)) api.closeCheat(); refresh(); },
    closeFiles() { setOpen(files, filesButton, false); refresh(); },
    openCheat() { setOpen(cheat, cheatButton, true); if (isOverlay(MEDIA_FILES_OVERLAY)) api.closeFiles(); refresh(); },
    closeCheat() { setOpen(cheat, cheatButton, false); refresh(); },
    toggleCheat() { return cheat.classList.contains('panel--open') ? api.closeCheat() : api.openCheat(); },
    toggleFiles() { return files.classList.contains('panel--open') ? api.closeFiles() : api.openFiles(); },
    /** After choosing a file on a phone, get the panel out of the way. */
    afterFilePick() { if (isOverlay(MEDIA_FILES_OVERLAY)) api.closeFiles(); },
  };

  scrim.addEventListener('click', () => { api.closeFiles(); api.closeCheat(); });
  byId('btn-cheat-close').addEventListener('click', api.closeCheat);
  cheatButton.addEventListener('click', api.toggleCheat);
  filesButton.addEventListener('click', api.toggleFiles);

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !scrim.hidden) { api.closeFiles(); api.closeCheat(); }
  });

  // Rotating a phone or resizing the window can change which mode we are in.
  const onResize = () => {
    // The Files panel is part of the page on wide screens, so make it visible there.
    if (!isOverlay(MEDIA_FILES_OVERLAY)) setOpen(files, filesButton, true);
    else if (files.classList.contains('panel--open') && scrim.hidden) setOpen(files, filesButton, false);
    refresh();
  };
  window.addEventListener('resize', onResize);

  // Starting state: Files visible on wide screens, hidden on phones; cheat sheet closed.
  setOpen(files, filesButton, !isOverlay(MEDIA_FILES_OVERLAY));
  setOpen(cheat, cheatButton, false);
  refresh();

  return api;
}
