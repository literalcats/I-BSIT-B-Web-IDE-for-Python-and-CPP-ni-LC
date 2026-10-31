// js/config.js
// ---------------------------------------------------------------------------
// Every "setting" of the app lives here, so nothing else has magic numbers.
// Change a value here and the whole app follows.
// ---------------------------------------------------------------------------

export const APP = {
  name: 'I-BSIT-B Code Lab',

  // IndexedDB (the browser database that keeps students' files).
  dbName: 'bsit-code-lab',
  dbVersion: 1, // raise this ONLY when you change the database shape (see storage/idb.js)

  // Limits that protect the browser from huge files and endless programs.
  maxFileChars: 200000,
  maxNameChars: 60,
  autosaveMs: 600, // how long to wait after typing before saving
  warmUpDelayMs: 1500, // after a file opens, wait this long, then start loading its language engine
  runTimeoutMs: 15000, // a program that runs longer than this is stopped
  engineLoadTimeoutMs: 120000, // loading Python the first time can be slow
  maxOutputChars: 100000, // stop programs that print forever
};

// The exact engines students run on. Shown in the About dialog and the README, and
// checked by a test (tests/versions.test.mjs) so the words can never drift from the
// real thing. When you upgrade an engine, change it here AND in package.json / third_party.
export const ENGINES = {
  python: { engine: 'Pyodide 0.26.4', version: 'Python 3.12' },
  // JSCPP is an interpreter for a beginner subset of C++. It has no official C++ "standard".
  cpp: { engine: 'JSCPP 2.0.9', version: 'a beginner subset of C++ (like C++98 basics)' },
};

// The languages this app teaches. To add one later, add it here, then add a
// runner in js/runners/ and an entry in js/runners/runnerManager.js.
export const LANGUAGES = {
  python: { id: 'python', label: 'Python', ext: '.py', monaco: 'python' },
  // `badge` is the text on the file badge; C++ says "simplified" so students see the limit at all times.
  cpp: { id: 'cpp', label: 'C++', badge: 'C++ · simplified', ext: '.cpp', monaco: 'cpp' },
};

export const LANGUAGE_IDS = Object.keys(LANGUAGES);

// What a brand-new empty file starts with.
export const STARTERS = {
  python: '# Write your Python code here.\n# Press Ctrl+Enter (or the Run button) to run it.\n\nprint("Hello!")\n',
  cpp:
    '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello!" << endl;\n    return 0;\n}\n',
};

// The base address of the website, worked out from where this file lives.
// NOTE: the app must still be hosted at the ROOT of its domain (like https://name.vercel.app/):
// sw.js and pwa/offline.js use absolute paths such as /precache.json and /vendor/.
export const SITE_ROOT = new URL('../', import.meta.url);

/** Turn a path like "data/presets/presets.json" into a full web address. */
export function urlFor(path) {
  return new URL(path, SITE_ROOT).href;
}

/** "hello.py" -> "python", "main.cpp" -> "cpp", anything else -> null. */
export function languageFromName(name) {
  const lower = String(name).toLowerCase();
  for (const language of Object.values(LANGUAGES)) {
    if (lower.endsWith(language.ext)) return language.id;
  }
  return null;
}
