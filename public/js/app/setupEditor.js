// js/app/setupEditor.js
// Creates the code editor (Monaco, or the simple one if Monaco cannot load)
// and connects its three signals to the message bus.

import { byId, el } from '../core/dom.js';
import { createEditor } from '../editor/index.js';
import { readTheme } from '../ui/theme.js';

export const EDITOR_PREF_KEY = 'bsit.editor'; // 'monaco' | 'basic' | (unset = automatic)

export function readEditorPref() {
  try {
    return localStorage.getItem(EDITOR_PREF_KEY) || 'auto';
  } catch {
    return 'auto';
  }
}

/** The "More" menu choice. Returns false if the browser would not remember it. */
export function saveEditorPref(value) {
  try {
    localStorage.setItem(EDITOR_PREF_KEY, value);
    return true;
  } catch {
    return false;
  }
}

export async function setupEditor({ bus, notify }) {
  const container = byId('editor-container');
  const loadingCover = el('div', { class: 'editor-loading', text: 'Loading editor…' });
  container.append(loadingCover);

  const { editor, fellBack } = await createEditor(container, {
    mode: readEditorPref(),
    theme: readTheme(),
    onChange: () => bus.emit('editor-changed'),
    onRun: () => bus.emit('run-requested'),
    onSave: () => bus.emit('save-requested'),
  });

  loadingCover.remove();
  if (fellBack) {
    notify('The full editor could not load, so the simple editor is being used. Everything still works.', { error: true });
  }
  byId('mi-editor').textContent = editor.kind === 'monaco' ? 'Use the simple editor' : 'Use the full editor';
  return editor;
}
