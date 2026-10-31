// js/core/utils.js
// Tiny helpers used by several parts of the app.

/**
 * "Wait until the student stops typing, then save."
 *   const saver = createDebouncer(saveNow, 600);
 *   saver.schedule();  // call on every keystroke
 *   saver.flush();     // save right now (e.g. when the tab closes)
 */
export function createDebouncer(task, delayMs) {
  let timer = null;
  return {
    schedule() {
      clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        task();
      }, delayMs);
    },
    flush() {
      if (timer === null) return;
      clearTimeout(timer);
      timer = null;
      task();
    },
    cancel() {
      clearTimeout(timer);
      timer = null;
    },
  };
}

/** "3:07 PM" style clock text. */
export function formatClock(date = new Date()) {
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

/** Make the browser download `text` as a file. */
export function downloadText(filename, text, mime = 'text/plain') {
  const url = URL.createObjectURL(new Blob([text], { type: `${mime};charset=utf-8` }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Today's date as 2026-10-28 (used in backup file names). */
export function todayStamp(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Make a unique id. Uses the browser's built-in generator when it exists. */
export function newId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
