// js/runners/python.worker.js
// ---------------------------------------------------------------------------
// A "Web Worker": a separate background thread. Running Python here means:
//   * the page never freezes while a program runs, and
//   * the Stop button can instantly kill an endless loop (by ending this thread).
//
// Messages IN  (from the page):  { type: 'warmup' }  or  { type: 'run', code, fileName, stdin }
// Messages OUT (to the page):    loading, ready, started, out, done, fatal   (see workerRunner.js)
// ---------------------------------------------------------------------------

const PYODIDE_FOLDER = new URL('../../vendor/pyodide/', self.location.href).href;
const BOOTSTRAP_URL = new URL('./python_bootstrap.py', self.location.href).href;

let sessionPromise = null; // the loaded engine, created once and then reused

/** Load Python the first time it is needed (takes a few seconds, then it is cached). */
function getSession() {
  if (!sessionPromise) {
    sessionPromise = (async () => {
      self.postMessage({ type: 'loading', text: 'Loading Python (first time only)…' });

      importScripts(PYODIDE_FOLDER + 'pyodide.js'); // defines loadPyodide()
      const pyodide = await self.loadPyodide({ indexURL: PYODIDE_FOLDER });

      const response = await fetch(BOOTSTRAP_URL);
      if (!response.ok) throw new Error('python_bootstrap.py could not be loaded.');
      const bootstrap = await response.text();

      // Dynamic import() is allowed in classic workers (static "import ... from" is not).
      const { createPythonSession } = await import('./pythonSession.js');
      return createPythonSession(pyodide, bootstrap);
    })();
    // If loading failed, forget it so the next try starts fresh.
    sessionPromise.catch(() => {
      sessionPromise = null;
    });
  }
  return sessionPromise;
}

self.onmessage = async (event) => {
  const message = event.data;
  try {
    const session = await getSession();
    if (message.type === 'warmup') {
      self.postMessage({ type: 'ready' });
      return;
    }
    if (message.type !== 'run') return;

    const { createOutputBuffer } = await import('./outputBuffer.js');
    const buffer = createOutputBuffer((kind, text) => self.postMessage({ type: 'out', kind, text }));

    self.postMessage({ type: 'started' });
    const { exitCode } = session.run({
      code: message.code,
      fileName: message.fileName,
      stdin: message.stdin,
      write: buffer.write,
    });
    buffer.flush();
    self.postMessage({ type: 'done', exitCode });
  } catch (error) {
    self.postMessage({
      type: 'fatal',
      message: 'The Python engine could not start. ' + (error && error.message ? error.message : String(error)),
    });
  }
};
