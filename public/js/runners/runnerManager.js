// js/runners/runnerManager.js
// ---------------------------------------------------------------------------
// The ONE door the rest of the app uses to run code:
//     const runners = createRunnerManager({ onOutput, onStatus, onEngineState });
//     await runners.run('python', { code, fileName, stdin });
//     runners.stop();
//
// ADDING A LANGUAGE LATER: add it to LANGUAGES in config.js, write a
// <name>.worker.js, and add one line to RUNNERS below. Nothing else changes.
// ---------------------------------------------------------------------------

import { APP, LANGUAGES } from '../config.js';
import { createWorkerRunner } from './workerRunner.js';

const RUNNERS = {
  python: { workerFile: './python.worker.js' },
  cpp: { workerFile: './cpp.worker.js' },
};

/** The friendly text shown in the console when a run ends in a special way. */
export function describeResult(result) {
  switch (result.status) {
    case 'ok':
      return { kind: 'info', text: '\n— Finished —' };
    case 'error':
      return { kind: 'info', text: '\n— Stopped because of an error (see above) —' };
    case 'stopped':
      return { kind: 'info', text: '\n— Stopped by you —' };
    case 'timeout':
      return {
        kind: 'err',
        text: `\nStopped: the program ran for more than ${Math.round(APP.runTimeoutMs / 1000)} seconds. Check for a loop that never ends.`,
      };
    case 'too-much-output':
      return { kind: 'err', text: '\nStopped: the program printed too much text. Check for a loop that never ends.' };
    case 'engine-error':
      return { kind: 'err', text: `\n${result.message}` };
    default:
      return { kind: 'info', text: '' };
  }
}

export function createRunnerManager({ onOutput, onStatus, onEngineState = () => {}, createWorker }) {
  const limits = {
    runTimeoutMs: APP.runTimeoutMs,
    engineLoadTimeoutMs: APP.engineLoadTimeoutMs,
    maxOutputChars: APP.maxOutputChars,
  };

  const runners = {};
  for (const [id, entry] of Object.entries(RUNNERS)) {
    runners[id] = createWorkerRunner({
      workerUrl: new URL(entry.workerFile, import.meta.url).href,
      engineLabel: LANGUAGES[id].label,
      limits,
      onEngineState: (state) => onEngineState(id, state),
      createWorker,
    });
  }

  let current = null; // language id of the run in progress

  return {
    get isRunning() {
      return current !== null;
    },

    warmUp(language) {
      if (runners[language]) runners[language].warmUp();
    },

    /** Run a program; returns { status, ... } (see workerRunner.js). */
    async run(language, request) {
      const runner = runners[language];
      if (!runner) return { status: 'engine-error', message: `Unknown language: ${language}` };
      if (current) return { status: 'engine-error', message: 'A program is already running.' };

      current = language;
      try {
        return await runner.run(request, { onOutput, onStatus });
      } finally {
        current = null;
      }
    },

    stop() {
      if (current) runners[current].stop();
    },
  };
}
