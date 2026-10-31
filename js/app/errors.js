// js/app/errors.js
// What the student sees when something unexpected goes wrong.

import { el } from '../core/dom.js';

/** The message shown if the app cannot start at all (should be rare). */
export function showFatal(error) {
  console.error(error);
  document.body.prepend(
    el(
      'div',
      { class: 'fatal', role: 'alert' },
      el('h2', { text: 'Code Lab could not start' }),
      el('p', { text: 'Your saved files are not deleted. Try reloading the page. If it keeps happening, tell your teacher or the person who set up this site.' }),
      el('p', { class: 'hint', text: `Technical detail: ${error && error.message ? error.message : String(error)}` }),
      el('button', { class: 'btn btn--primary', type: 'button', text: 'Reload', onclick: () => window.location.reload() }),
    ),
  );
}

/** Never let a surprise error leave the student guessing. Warns once, logs every time. */
export function installGlobalErrorHandlers(notify) {
  let warned = false;
  const surprise = (event) => {
    console.error(event.error || event.reason || event);
    if (warned) return;
    warned = true;
    notify('Something went wrong. Your files are safe. Reload the page if things look odd.', { error: true });
  };
  window.addEventListener('error', surprise);
  window.addEventListener('unhandledrejection', surprise);
}
