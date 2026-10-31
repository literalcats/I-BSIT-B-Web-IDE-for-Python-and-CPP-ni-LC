// js/app/fileController.js
// ---------------------------------------------------------------------------
// Everything about the student's FILES while the app is running:
//   open, create, rename, delete, download, and saving automatically.
//
// It sits between three parts and keeps them in sync:
//     the database (store)  <->  this controller  <->  the screen (editor, list, header)
// Each part stays simple because only this file knows about all three.
//
// The "wait, then save, never into the wrong file" logic lives in autosaver.js,
// and the "Saving…" text lives in ui/saveStatus.js, so this file only decides WHAT
// to do, not how timers or status text work.
// ---------------------------------------------------------------------------

import { APP, LANGUAGES, STARTERS } from '../config.js';
import { byId } from '../core/dom.js';
import { downloadText } from '../core/utils.js';
import { StoreError } from '../storage/fileStore.js';
import { createSaveStatus } from '../ui/saveStatus.js';
import { createAutosaver } from './autosaver.js';

const LAST_FILE_KEY = 'lastFileId';
const FIRST_FILE = { name: 'hello.py', content: STARTERS.python };

export function createFileController({ store, persistent, editor, fileList, consolePanel, bus, notify }) {
  let files = [];
  let currentId = null;

  const status = createSaveStatus({ element: byId('save-status'), persistent });
  const badge = byId('file-badge');
  const title = byId('file-title');

  const current = () => files.find((file) => file.id === currentId) || null;
  const replaceInList = (updated) => {
    files = files.map((file) => (file.id === updated.id ? updated : file));
  };
  const messageFor = (error, fallback) => (error instanceof StoreError ? error.message : fallback);

  async function reloadList() {
    files = await store.list();
    fileList.render(files, currentId);
  }

  /** There must always be at least one file to show. */
  async function ensureOneFile() {
    if (files.length > 0) return;
    files = [await store.create(FIRST_FILE)];
  }

  // ---- Saving (the waiting and the id-bookkeeping are in autosaver.js) --------
  const contentSaver = createAutosaver({
    delayMs: APP.autosaveMs,
    save: async (id, text) => {
      status.saving();
      try {
        replaceInList(await store.update(id, { content: text }));
        status.saved();
      } catch (error) {
        status.error(messageFor(error, 'Could not save. Download a copy to be safe.'));
        notify(messageFor(error, 'Could not save your file. Use Download to keep a copy.'), { error: true });
      }
    },
  });

  const stdinSaver = createAutosaver({
    delayMs: APP.autosaveMs,
    save: async (id, text) => {
      try {
        replaceInList(await store.update(id, { stdin: text }));
      } catch (error) {
        notify(error.message, { error: true });
      }
    },
  });

  /** Save everything that is waiting (before running, switching files, and closing the tab). */
  const flush = () => Promise.all([contentSaver.flush(), stdinSaver.flush()]);

  // ---- Showing a file ---------------------------------------------------------
  async function open(id) {
    await flush();
    const file = files.find((item) => item.id === id);
    if (!file) return;

    currentId = id;
    editor.openDocument(file.id, file.content, file.language);
    consolePanel.setStdin(file.stdin || '');
    consolePanel.setLanguageHint(file.language);

    badge.textContent = LANGUAGES[file.language].badge || LANGUAGES[file.language].label;
    title.textContent = file.name;
    fileList.render(files, currentId);
    status.idle();
    bus.emit('file-opened', file);

    try {
      await store.setSetting(LAST_FILE_KEY, id);
    } catch {
      /* remembering the last file is a nicety; ignore failures */
    }
  }

  // ---- Public actions ---------------------------------------------------------
  return {
    get current() {
      return current();
    },
    get files() {
      return files;
    },

    open,
    flush,

    /** The text on screen right now (always at least as new as the saved copy). */
    liveText: () => editor.getValue(),

    /** Start up: load files, make a first one if there are none, open the last used. */
    async init() {
      await reloadList();
      await ensureOneFile();
      let startId = await store.getSetting(LAST_FILE_KEY, null);
      if (!files.some((file) => file.id === startId)) startId = files[0].id;
      await open(startId);
    },

    /** The editor reports a change. */
    onEditorChange() {
      if (!currentId) return;
      status.saving();
      contentSaver.markDirty(currentId, editor.getValue()); // text NOW, while this file is still on screen
    },

    onStdinChange() {
      stdinSaver.markDirty(currentId, consolePanel.getStdin());
    },

    /**
     * Create a file and open it.
     * `suffixOnClash` is for presets (never fail, just make "name (2).py").
     * Returns the new file, or throws StoreError (the caller shows the message).
     */
    async create({ name, language, content, stdin = '' }, { suffixOnClash = false } = {}) {
      await flush();
      const text = content ?? STARTERS[language];
      const file = await store.create({ name, content: text, stdin }, { conflict: suffixOnClash ? 'suffix' : 'error' });
      await reloadList();
      await open(file.id);
      return file;
    },

    async rename(newName) {
      const file = current();
      if (!file) return null;
      await flush();
      const updated = await store.rename(file.id, newName);
      await reloadList();
      title.textContent = updated.name;
      return updated;
    },

    /** Delete the open file. The caller has already asked "are you sure?". */
    async deleteCurrent() {
      const file = current();
      if (!file) return;
      contentSaver.discard(); // do not save into a file that is about to disappear
      stdinSaver.discard();

      await store.remove(file.id);
      editor.closeDocument(file.id);
      currentId = null;
      await reloadList();
      await ensureOneFile();
      await open(files[0].id);
    },

    /** Download the open file to the student's computer. */
    async download() {
      const file = current();
      if (!file) return;
      await flush();
      downloadText(file.name, editor.getValue());
    },

    /** Put text into the open file at the cursor ("Copy to editor"). */
    insertSnippet(text) {
      if (!current()) return false;
      editor.insertAtCursor(text.endsWith('\n') ? text : text + '\n');
      return true;
    },

    /** After a restore, refresh the list but keep the current file open. */
    refreshList: reloadList,
  };
}
