// js/ui/toast.js
// Small pop-up messages at the bottom of the screen ("Saved", "File deleted"...).

import { byId, el } from '../core/dom.js';

const SHOW_MS = 4000;

/**
 * showToast('File deleted')
 * showToast('Could not save', { error: true })
 * showToast('Update ready', { actionLabel: 'Reload', onAction: () => location.reload(), sticky: true })
 */
export function showToast(message, { error = false, actionLabel = '', onAction = null, sticky = false } = {}) {
  const region = byId('toast-region');
  const toast = el('div', { class: error ? 'toast toast--error' : 'toast', role: error ? 'alert' : 'status' }, el('span', { text: message }));

  const remove = () => toast.remove();
  if (actionLabel && onAction) {
    toast.append(
      el('button', { class: 'btn btn--small', type: 'button', text: actionLabel, onclick: () => { remove(); onAction(); } }),
    );
  }
  if (sticky) {
    toast.append(el('button', { class: 'btn btn--small btn--ghost', type: 'button', 'aria-label': 'Dismiss', text: '✕', onclick: remove }));
  } else {
    setTimeout(remove, error ? SHOW_MS * 2 : SHOW_MS);
  }

  region.append(toast);
  return remove;
}
