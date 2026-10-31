// js/app/runController.js
// The Run and Stop buttons: gathers the program, sends it to the right engine,
// and shows the result. It never touches the database or the editor's insides;
// it only asks the file controller for the open file and its text.

import { LANGUAGES } from '../config.js';
import { byId } from '../core/dom.js';
import { cppLimitHint } from '../runners/limitHints.js';
import { createRunnerManager, describeResult } from '../runners/runnerManager.js';

export function createRunController({ files, consolePanel, notify }) {
  const runButton = byId('btn-run');
  const stopButton = byId('btn-stop');
  const engineState = {}; // language id -> 'idle' | 'loading' | 'ready' | 'error'
  let errorText = ''; // what the current run printed as errors (used for the C++ hint)

  function showRunning(isRunning) {
    runButton.hidden = isRunning;
    stopButton.hidden = !isRunning;
    (isRunning ? stopButton : runButton).focus({ preventScroll: true });
  }

  const runners = createRunnerManager({
    onOutput: (kind, text) => {
      if (kind === 'err' && errorText.length < 2000) errorText += text;
      consolePanel.print(kind, text);
    },
    onStatus: (status, text) => {
      if (status === 'loading') consolePanel.setStatus(text || 'Loading…');
      else consolePanel.setStatus(status === 'running' ? 'Running…' : '');
    },
    onEngineState: (language, state) => {
      engineState[language] = state;
    },
  });

  return {
    /** Start loading an engine in the background so the first Run is quick. */
    warmUp(language) {
      const state = engineState[language];
      if (!state || state === 'idle') runners.warmUp(language);
    },

    async run() {
      if (runners.isRunning) return;
      const file = files.current;
      if (!file) return;

      await files.flush(); // save first, so a crash can never lose the code
      const request = { code: files.liveText(), fileName: file.name, stdin: consolePanel.getStdin() };

      consolePanel.showTab('output');
      consolePanel.clear();
      errorText = '';
      consolePanel.print('info', `▶ ${file.name} (${LANGUAGES[file.language].label})\n`);
      showRunning(true);

      let result;
      try {
        result = await runners.run(file.language, request);
      } catch (error) {
        // runners.run is built never to throw. If something unexpected happens, say so.
        console.error(error);
        result = { status: 'engine-error', message: `Something went wrong: ${error.message}` };
      } finally {
        showRunning(false);
        consolePanel.setStatus('');
      }

      const ending = describeResult(result);
      consolePanel.print(ending.kind, ending.text + '\n');
      // A failed C++ run may be the app's limit, not the student's mistake: say so.
      if (file.language === 'cpp' && result.status === 'error' && errorText) {
        consolePanel.print('info', cppLimitHint(errorText));
      }
      if (result.status === 'engine-error') {
        notify('The engine could not run your code. See the output for details.', { error: true });
      }
    },

    stop() {
      runners.stop();
    },
  };
}
