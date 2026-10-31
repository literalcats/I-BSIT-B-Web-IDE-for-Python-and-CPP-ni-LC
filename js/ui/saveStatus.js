// js/ui/saveStatus.js
// The small text in the top bar: "Saving…", "Saved on this device · 10:42", etc.
// It only draws text; it never saves anything.

import { formatClock } from '../core/utils.js';

export function createSaveStatus({ element, persistent }) {
  const show = (text) => { element.textContent = persistent ? text : '⚠ Not saved: private mode'; };

  return {
    idle: () => show(''),
    saving: () => show('Saving…'),
    saved: (clock = formatClock()) => show(`Saved on this device · ${clock}`),
    error: (message) => show(`⚠ ${message}`),
  };
}
