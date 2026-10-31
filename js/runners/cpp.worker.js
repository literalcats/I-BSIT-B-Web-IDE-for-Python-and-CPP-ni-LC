// js/runners/cpp.worker.js
// A background thread that runs C++ with JSCPP (see python.worker.js for why
// we use a worker). It speaks the same messages as the Python worker, so the
// page treats both languages in the same way.

const JSCPP_URL = new URL('../../vendor/jscpp/JSCPP.es5.min.js', self.location.href).href;

let enginePromise = null;

function getEngine() {
  if (!enginePromise) {
    enginePromise = (async () => {
      self.postMessage({ type: 'loading', text: 'Loading C++…' });
      const [{ runCpp }, { createOutputBuffer }, { loadJscppInto }] = await Promise.all([
        import('./cppSession.js'),
        import('./outputBuffer.js'),
        import('./jscppLoader.js'),
      ]);
      // A worker has no window, and JSCPP only defines itself when it sees one.
      // loadJscppInto() handles that (see jscppLoader.js for the full story).
      const JSCPP = loadJscppInto(self, () => importScripts(JSCPP_URL));
      return { runCpp, createOutputBuffer, JSCPP };
    })();
    enginePromise.catch(() => {
      enginePromise = null;
    });
  }
  return enginePromise;
}

self.onmessage = async (event) => {
  const message = event.data;
  try {
    const engine = await getEngine();
    if (message.type === 'warmup') {
      self.postMessage({ type: 'ready' });
      return;
    }
    if (message.type !== 'run') return;

    const buffer = engine.createOutputBuffer((kind, text) => self.postMessage({ type: 'out', kind, text }));
    self.postMessage({ type: 'started' });
    const { exitCode } = engine.runCpp(engine.JSCPP, {
      code: message.code,
      stdin: message.stdin,
      write: buffer.write,
    });
    buffer.flush();
    self.postMessage({ type: 'done', exitCode });
  } catch (error) {
    self.postMessage({
      type: 'fatal',
      message: 'The C++ engine could not start. ' + (error && error.message ? error.message : String(error)),
    });
  }
};
