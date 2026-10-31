// js/editor/index.js
// ---------------------------------------------------------------------------
// The ONE door for the editor. The rest of the app only calls:
//
//   const editor = await createEditor(container, { onChange, onRun, onSave, theme, mode });
//
//   editor.openDocument(id, text, languageId)   show a file
//   editor.closeDocument(id)                    forget a deleted file
//   editor.getValue()                           the current text
//   editor.replaceAll(text)                     swap the text (undo-able)
//   editor.insertAtCursor(text)                 paste a snippet at the cursor
//   editor.setLanguage(id) / setTheme(name) / focus() / layout() / dispose()
//
// `editor.kind` is 'monaco' or 'basic'. Both kinds behave the same, so the
// app never needs to know which one it got.
//
// mode: 'auto'   - Monaco on computers, the simple editor on touch phones/tablets
//       'monaco' - always Monaco (falls back to simple if it cannot load)
//       'basic'  - always the simple editor
// ---------------------------------------------------------------------------

import { createBasicEditor } from './basicEditor.js';

/** Is this a touch-first device? Monaco is awkward there, so we default to the simple editor. */
export function prefersSimpleEditor() {
  try {
    return window.matchMedia('(pointer: coarse)').matches;
  } catch {
    return false;
  }
}

/**
 * Returns { editor, fellBack, reason }.
 * `fellBack` is true when Monaco was wanted but failed (the app shows a note).
 */
export async function createEditor(container, options) {
  const wantsMonaco = options.mode === 'monaco' || (options.mode !== 'basic' && !prefersSimpleEditor());

  if (wantsMonaco) {
    try {
      const { createMonacoEditor } = await import('./monacoEditor.js');
      const editor = await createMonacoEditor(container, options);
      return { editor, fellBack: false, reason: null };
    } catch (error) {
      console.warn('Monaco could not load, using the simple editor:', error);
      container.replaceChildren(); // remove anything Monaco half-created
      return {
        editor: createBasicEditor(container, options),
        fellBack: true,
        reason: error && error.message ? error.message : 'unknown error',
      };
    }
  }

  return { editor: createBasicEditor(container, options), fellBack: false, reason: null };
}
