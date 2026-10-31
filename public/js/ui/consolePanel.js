// js/ui/consolePanel.js
// The bottom area: the Output tab (what the program prints) and the Input tab
// (what the program reads with input() / cin).

import { byId, el } from '../core/dom.js';

export function createConsole({ onStdinChange }) {
  const output = byId('output');
  const stdin = byId('stdin');
  const panelInput = byId('panel-input');
  const tabOutput = byId('tab-output');
  const tabInput = byId('tab-input');
  const status = byId('engine-status');

  function showTab(name) {
    const isOutput = name === 'output';
    output.hidden = !isOutput;
    panelInput.hidden = isOutput;
    tabOutput.setAttribute('aria-selected', String(isOutput));
    tabInput.setAttribute('aria-selected', String(!isOutput));
    if (!isOutput) stdin.focus();
  }

  tabOutput.addEventListener('click', () => showTab('output'));
  tabInput.addEventListener('click', () => showTab('input'));
  byId('btn-clear').addEventListener('click', () => api.clear());
  stdin.addEventListener('input', () => onStdinChange(stdin.value));

  const api = {
    showTab,

    /** Add text. kind: 'out' (normal), 'err' (red), 'info' (grey italic). */
    print(kind, text) {
      if (text === '') return;
      const nearBottom = output.scrollHeight - output.scrollTop - output.clientHeight < 40;
      if (kind === 'out') output.append(document.createTextNode(text));
      else output.append(el('span', { class: kind === 'err' ? 'output__err' : 'output__info', text }));
      if (nearBottom) output.scrollTop = output.scrollHeight; // follow new text, unless the student scrolled up
    },

    clear() {
      output.replaceChildren();
    },

    getOutputText() {
      return output.textContent;
    },

    getStdin: () => stdin.value,
    setStdin(text) {
      stdin.value = text;
    },

    /** Small status text next to the tabs ("Loading Python…"). */
    setStatus(text) {
      status.textContent = text;
    },

    /** The hint under the Input box depends on the language. */
    setLanguageHint(languageId) {
      byId('stdin-hint').textContent =
        languageId === 'cpp'
          ? 'cin reads these values in order (spaces or new lines both work). The answers you type are not repeated in the output.'
          : 'Each input() reads one line from here. If the program asks for more lines than you typed, it stops with an error.';
    },
  };

  return api;
}
