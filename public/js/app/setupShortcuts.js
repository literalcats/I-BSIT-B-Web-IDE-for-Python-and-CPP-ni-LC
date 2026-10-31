// js/app/setupShortcuts.js
// Keyboard shortcuts, and "save when the student leaves the page".

export function setupShortcuts({ bus, files }) {
  document.addEventListener('keydown', (event) => {
    if (event.defaultPrevented) return; // Monaco already handled it
    const mod = event.ctrlKey || event.metaKey;
    if (!mod) return;
    if (event.key === 'Enter') {
      event.preventDefault();
      bus.emit('run-requested');
    } else if (event.key.toLowerCase() === 's') {
      event.preventDefault();
      bus.emit('save-requested');
    }
  });

  // Save when the student leaves or hides the page.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') files.flush();
  });
  window.addEventListener('pagehide', () => { files.flush(); });
}
