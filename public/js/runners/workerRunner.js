// js/runners/workerRunner.js
// ---------------------------------------------------------------------------
// Manages ONE language's background worker from the page's side:
//   - starts the worker the first time it is needed (and keeps it for speed),
//   - sends it the program,
//   - forwards the printed text to the screen,
//   - enforces the time limit and output limit,
//   - handles Stop by ending the worker (the next run starts a fresh one).
//
// run() always resolves (never throws) with:
//   { status: 'ok' | 'error' | 'stopped' | 'timeout' | 'too-much-output' | 'engine-error',
//     exitCode?, message? }
// ---------------------------------------------------------------------------

export function createWorkerRunner({
  workerUrl,
  engineLabel, // e.g. "Python", used in messages
  limits, // { runTimeoutMs, engineLoadTimeoutMs, maxOutputChars }
  onEngineState = () => {}, // 'idle' | 'loading' | 'ready' | 'error'
  createWorker = (url) => new Worker(url), // swapped out in tests
}) {
  let worker = null;
  let engineReady = false;
  let active = null; // the run in progress: { resolve, onOutput, onStatus, timers, outputChars }

  function setEngineState(state) {
    onEngineState(state);
  }

  function spawn() {
    worker = createWorker(workerUrl);
    engineReady = false;
    worker.onmessage = (event) => handleMessage(event.data);
    worker.onerror = (event) => {
      const detail = event && event.message ? ` (${event.message})` : '';
      failEngine(`The ${engineLabel} engine files could not be loaded${detail}. Check your connection and reload.`);
    };
    worker.onmessageerror = () => failEngine(`The ${engineLabel} engine sent a message the page could not read.`);
  }

  function killWorker() {
    if (worker) worker.terminate();
    worker = null;
    engineReady = false;
  }

  function clearTimers() {
    if (!active) return;
    clearTimeout(active.loadTimer);
    clearTimeout(active.runTimer);
  }

  /** End the current run with a result. Bad endings also throw the worker away. */
  function finish(result, { killWorkerToo = false } = {}) {
    if (killWorkerToo) {
      killWorker();
      setEngineState('idle');
    }
    if (!active) return;
    clearTimers();
    const { resolve } = active;
    active = null;
    resolve(result);
  }

  function failEngine(message) {
    killWorker();
    if (active) finish({ status: 'engine-error', message });
    setEngineState('error'); // last, so nothing above can overwrite it
  }

  function handleMessage(data) {
    switch (data.type) {
      case 'loading':
        setEngineState('loading');
        if (active) active.onStatus('loading', data.text);
        break;

      case 'ready':
        engineReady = true;
        setEngineState('ready');
        break;

      case 'started':
        engineReady = true;
        setEngineState('ready');
        if (!active) break;
        clearTimeout(active.loadTimer);
        active.onStatus('running');
        active.runTimer = setTimeout(
          () => finish({ status: 'timeout' }, { killWorkerToo: true }),
          limits.runTimeoutMs,
        );
        break;

      case 'out':
        if (!active) break;
        active.outputChars += data.text.length;
        if (active.outputChars > limits.maxOutputChars) {
          finish({ status: 'too-much-output' }, { killWorkerToo: true });
        } else {
          active.onOutput(data.kind, data.text);
        }
        break;

      case 'done':
        finish({ status: data.exitCode === 0 ? 'ok' : 'error', exitCode: data.exitCode });
        break;

      case 'fatal':
        failEngine(data.message);
        break;

      default:
        break; // ignore unknown messages, so adding new ones later cannot break this
    }
  }

  return {
    get isRunning() {
      return active !== null;
    },
    get isReady() {
      return engineReady;
    },

    /** Start loading the engine in the background so the first Run is fast. */
    warmUp() {
      if (worker || active) return;
      spawn();
      setEngineState('loading');
      worker.postMessage({ type: 'warmup' });
    },

    /** Run one program. `request` = { code, fileName, stdin }. */
    run(request, { onOutput, onStatus }) {
      if (active) return Promise.resolve({ status: 'engine-error', message: 'A program is already running.' });
      if (!worker) spawn();

      return new Promise((resolve) => {
        active = { resolve, onOutput, onStatus, outputChars: 0, runTimer: null, loadTimer: null };
        active.loadTimer = setTimeout(
          () =>
            failEngine(`The ${engineLabel} engine took too long to load. Check your connection and try again.`),
          limits.engineLoadTimeoutMs,
        );
        onStatus(engineReady ? 'running' : 'loading', engineReady ? undefined : `Loading ${engineLabel}…`);
        worker.postMessage({ type: 'run', ...request });
      });
    },

    /** The Stop button. */
    stop() {
      if (active) finish({ status: 'stopped' }, { killWorkerToo: true });
    },
  };
}
