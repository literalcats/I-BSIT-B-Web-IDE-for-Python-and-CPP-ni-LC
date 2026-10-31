// js/app/autosaver.js
// ---------------------------------------------------------------------------
// "Save after the student pauses typing", and never into the wrong file.
//
// It remembers WHICH file has unsaved changes AND the text as it was at that
// moment (a "snapshot"). Both are taken at the moment of the edit, so switching
// files quickly can never save one file's text into another file.
//
// (An earlier version remembered only the id and read the screen at save time.
//  If a keystroke landed while the student was switching files, the screen
//  already showed the NEW file, and the old file was overwritten with its text.)
//
//   const saver = createAutosaver({ delayMs: 600, save: async (id, snapshot) => { ... } });
//   saver.markDirty(fileId, text);   // on every edit
//   await saver.flush();       // save right now (before running, switching, closing)
//   saver.discard();           // forget pending changes (the file was deleted)
//
// This file has no screen or database code, so it is easy to unit-test.
// ---------------------------------------------------------------------------

import { createDebouncer } from '../core/utils.js';

export function createAutosaver({ delayMs, save }) {
  let pendingId = null;
  let pendingSnapshot = null;

  async function saveIfDirty() {
    const id = pendingId;
    if (!id) return; // nothing waiting
    const snapshot = pendingSnapshot;
    pendingId = null; // clear first, so an edit made DURING the save is not lost
    pendingSnapshot = null;
    await save(id, snapshot);
  }

  const timer = createDebouncer(saveIfDirty, delayMs);

  return {
    markDirty(id, snapshot) {
      if (!id) return;
      pendingId = id;
      pendingSnapshot = snapshot;
      timer.schedule();
    },

    /** Save now (does nothing if nothing is waiting). */
    async flush() {
      timer.cancel(); // we are saving right now, so the timer is not needed
      await saveIfDirty();
    },

    /** Throw away waiting changes without saving them. */
    discard() {
      timer.cancel();
      pendingId = null;
      pendingSnapshot = null;
    },

    get isDirty() {
      return pendingId !== null;
    },
  };
}
