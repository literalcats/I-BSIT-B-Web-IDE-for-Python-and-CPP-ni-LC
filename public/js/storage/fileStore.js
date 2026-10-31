// js/storage/fileStore.js
// ---------------------------------------------------------------------------
// The "file cabinet": create, rename, save and delete students' files, plus
// backup and restore. It talks to a database "adapter" (idb.js or memory.js),
// so this file never touches IndexedDB directly and can be tested on its own.
//
// A file record looks like:
//   { id, name: 'hello.py', language: 'python', content, stdin, createdAt, updatedAt }
// ---------------------------------------------------------------------------

import { APP, LANGUAGES, languageFromName } from '../config.js';
import { newId } from '../core/utils.js';

export const BACKUP_FORMAT = 'bsit-code-lab-backup';

/** An error with a short machine-readable `code`, so the UI can react to it. */
export class StoreError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'StoreError';
    this.code = code;
  }
}

// Letters, numbers, spaces, _ ( ) . -   and the name must not start with a space or dot.
const NAME_PATTERN = /^[\p{L}\p{N}_][\p{L}\p{N}_ ().-]*$/u;

/**
 * Check a full file name such as "hello.py".
 * Returns { ok: true, name, language } or { ok: false, code, message }.
 */
export function checkFileName(rawName) {
  const name = String(rawName ?? '').trim();
  if (name === '') return fail('empty-name', 'Type a file name.');
  if (name.length > APP.maxNameChars) {
    return fail('name-too-long', `Use ${APP.maxNameChars} characters or fewer.`);
  }

  const language = languageFromName(name);
  if (!language) {
    const exts = Object.values(LANGUAGES).map((l) => l.ext).join(' or ');
    return fail('bad-extension', `File names must end in ${exts}.`);
  }

  const ext = LANGUAGES[language].ext;
  const base = name.slice(0, name.length - ext.length);
  if (base.replace(/[ .]/g, '') === '') return fail('empty-name', 'Type a name before the dot.');
  if (!NAME_PATTERN.test(base)) {
    return fail('bad-characters', 'Use letters, numbers, spaces, _ - . ( ) only.');
  }
  if (base !== base.trimEnd()) return fail('bad-characters', 'Remove the space before the dot.');

  // Keep the extension lowercase ("Hello.PY" -> "Hello.py").
  return { ok: true, name: base + ext, language };

  function fail(code, message) {
    return { ok: false, code, message };
  }
}

/** "hello.py" taken? -> "hello (2).py", then "hello (3).py" ... (case-insensitive). */
export function makeUniqueName(name, takenNames) {
  const taken = new Set([...takenNames].map((n) => n.toLowerCase()));
  if (!taken.has(name.toLowerCase())) return name;
  const language = languageFromName(name);
  const ext = language ? LANGUAGES[language].ext : '';
  const base = name.slice(0, name.length - ext.length);
  for (let n = 2; ; n += 1) {
    const candidate = `${base} (${n})${ext}`;
    if (!taken.has(candidate.toLowerCase())) return candidate;
  }
}

function checkContent(value, label) {
  if (typeof value !== 'string') throw new StoreError('bad-data', `${label} must be text.`);
  if (value.length > APP.maxFileChars) {
    throw new StoreError(
      'too-large',
      `${label} is too long to save (limit ${APP.maxFileChars.toLocaleString()} characters).`,
    );
  }
}

const byName = (a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base', numeric: true });

export function createFileStore(adapter, { now = () => Date.now(), makeId = newId } = {}) {
  const FILES = 'files';
  const SETTINGS = 'settings';

  // Writes happen ONE AT A TIME, in the order they were asked for.
  // Why: update() reads the file, changes one part, and writes it back. If two
  // updates (code and Input) overlapped, both would read the OLD file and the
  // second write would erase the first one's change.
  let writeQueue = Promise.resolve();
  function inOrder(task) {
    const result = writeQueue.then(task);
    writeQueue = result.catch(() => {}); // a failed write must not block the ones after it
    return result;
  }

  async function names(exceptId = null) {
    const all = await adapter.getAll(FILES);
    return all.filter((file) => file.id !== exceptId).map((file) => file.name);
  }

  async function load(id) {
    const file = await adapter.get(FILES, id);
    if (!file) throw new StoreError('not-found', 'That file no longer exists.');
    return file;
  }

  const store = {
    adapterKind: adapter.kind,

    /** All files, sorted by name. */
    async list() {
      return (await adapter.getAll(FILES)).sort(byName);
    },

    /**
     * Add a file. `conflict: 'error'` refuses a duplicate name,
     * `conflict: 'suffix'` picks "name (2).py" instead.
     */
    async create({ name, content = '', stdin = '' }, { conflict = 'error' } = {}) {
      const check = checkFileName(name);
      if (!check.ok) throw new StoreError(check.code, check.message);
      checkContent(content, 'This file');
      checkContent(stdin, 'The input');

      const existing = await names();
      let finalName = check.name;
      if (existing.some((n) => n.toLowerCase() === finalName.toLowerCase())) {
        if (conflict !== 'suffix') {
          throw new StoreError('name-taken', 'A file with that name already exists.');
        }
        finalName = makeUniqueName(finalName, existing);
      }

      const stamp = now();
      const file = {
        id: makeId(),
        name: finalName,
        language: check.language,
        content,
        stdin,
        createdAt: stamp,
        updatedAt: stamp,
      };
      await adapter.put(FILES, file);
      return file;
    },

    /** Save new text (and/or program input) for a file. */
    async update(id, patch) {
      const file = await load(id);
      if ('content' in patch) {
        checkContent(patch.content, 'This file');
        file.content = patch.content;
      }
      if ('stdin' in patch) {
        checkContent(patch.stdin, 'The input');
        file.stdin = patch.stdin;
      }
      file.updatedAt = now();
      await adapter.put(FILES, file);
      return file;
    },

    /** Rename a file. The language (.py / .cpp) must stay the same. */
    async rename(id, newName) {
      const file = await load(id);
      const check = checkFileName(newName);
      if (!check.ok) throw new StoreError(check.code, check.message);
      if (check.language !== file.language) {
        throw new StoreError('language-change', `A ${LANGUAGES[file.language].label} file must keep ${LANGUAGES[file.language].ext}.`);
      }
      const others = await names(id);
      if (others.some((n) => n.toLowerCase() === check.name.toLowerCase())) {
        throw new StoreError('name-taken', 'A file with that name already exists.');
      }
      file.name = check.name;
      file.updatedAt = now();
      await adapter.put(FILES, file);
      return file;
    },

    async remove(id) {
      await adapter.remove(FILES, id);
    },

    // ---- Backup and restore ------------------------------------------------

    /** Everything as one plain object (ready for JSON.stringify). */
    async exportAll() {
      const files = await this.list();
      return {
        format: BACKUP_FORMAT,
        version: 1,
        exportedAt: new Date(now()).toISOString(),
        files: files.map(({ name, language, content, stdin, createdAt, updatedAt }) => ({
          name, language, content, stdin, createdAt, updatedAt,
        })),
      };
    },

    /**
     * Add the files from a backup. Existing files are NEVER overwritten or
     * deleted: a name clash becomes "name (2).py".
     * Returns { imported, skipped }.
     */
    async importAll(data) {
      if (!data || data.format !== BACKUP_FORMAT || !Array.isArray(data.files)) {
        throw new StoreError('bad-backup', 'That does not look like a Code Lab backup file.');
      }
      let imported = 0;
      let skipped = 0;
      for (const item of data.files) {
        try {
          await this.create(
            { name: item?.name, content: item?.content ?? '', stdin: item?.stdin ?? '' },
            { conflict: 'suffix' },
          );
          imported += 1;
        } catch {
          skipped += 1; // a damaged entry must not stop the rest
        }
      }
      return { imported, skipped };
    },

    // ---- Small remembered settings (like "last opened file") ---------------

    async getSetting(key, fallback = null) {
      const record = await adapter.get(SETTINGS, key);
      return record ? record.value : fallback;
    },

    async setSetting(key, value) {
      await adapter.put(SETTINGS, { key, value });
    },
  };

  // Every method that CHANGES data goes through the one-at-a-time queue.
  // (Reads are not queued, and importAll is not queued as a whole: it calls
  // create(), which is.)
  for (const method of ['create', 'update', 'rename', 'remove']) {
    const original = store[method];
    store[method] = (...args) => inOrder(() => original.apply(store, args));
  }
  return store;
}
