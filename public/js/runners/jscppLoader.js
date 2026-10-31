// js/runners/jscppLoader.js
// ---------------------------------------------------------------------------
// WHY THIS FILE EXISTS (a real bug found while testing)
//
// JSCPP's browser file (JSCPP.es5.min.js) checks, when it loads:
//     "is there a window with a document?"
//        yes -> define the global  JSCPP  (what we want)
//        no  -> assume it IS a worker script, and install its own
//               message handler instead. JSCPP is then never defined.
//
// A Web Worker has no window and no document, so without help our C++ worker
// would load the file and find no JSCPP. The fix: pretend there is a window
// for the short moment the file loads, then remove the pretend objects.
//
// This function is shared by the real worker (cpp.worker.js) and by the
// tests (tests/helpers/cppTools.mjs), so the tests exercise the same logic.
// ---------------------------------------------------------------------------

/**
 * @param scope     the global object (self in a worker, a sandbox in tests)
 * @param loadFile  a function that loads the JSCPP file (importScripts, or vm in tests)
 * @returns         the JSCPP engine
 */
export function loadJscppInto(scope, loadFile) {
  const hadWindow = 'window' in scope;
  const hadDocument = 'document' in scope;

  if (!hadWindow) scope.window = scope;
  if (!hadDocument) scope.document = {};

  try {
    loadFile();
  } finally {
    // Take the pretend objects away again so nothing else is fooled by them.
    if (!hadWindow) delete scope.window;
    if (!hadDocument) delete scope.document;
  }

  const engine = scope.JSCPP;
  if (!engine || typeof engine.run !== 'function') {
    throw new Error('JSCPP loaded but JSCPP.run was not found. The engine file may be the wrong version.');
  }
  return engine;
}
