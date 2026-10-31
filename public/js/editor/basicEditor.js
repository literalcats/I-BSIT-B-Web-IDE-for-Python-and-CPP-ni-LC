// js/editor/basicEditor.js
// ---------------------------------------------------------------------------
// The SIMPLE editor: a plain text box with a few helpers (Tab inserts spaces,
// Enter keeps the indentation). It is used when:
//   * the student chooses "Use the simple editor" (lighter, good on phones), or
//   * the full editor (Monaco) could not load.
// It offers exactly the same methods as monacoEditor.js (see editor/index.js).
// ---------------------------------------------------------------------------

import { INDENT, newLineWithIndent, outdentLine } from './indent.js';

export function createBasicEditor(container, { onChange }) {
  const box = document.createElement('textarea');
  box.className = 'basic-editor code';
  box.spellcheck = false;
  box.autocomplete = 'off';
  box.setAttribute('autocapitalize', 'off');
  box.setAttribute('aria-label', 'Code editor. Press Escape then Tab to leave the editor.');
  container.append(box);

  let currentId = null;
  let language = 'python';
  let tabTrapped = true; // Escape turns this off so keyboard users can leave the box

  /** Change the text in a way the browser can undo (Ctrl+Z), when it allows it. */
  function insertText(text, start = box.selectionStart, end = box.selectionEnd) {
    box.focus();
    box.setSelectionRange(start, end);
    const done = typeof document.execCommand === 'function' && document.execCommand('insertText', false, text);
    if (!done) {
      box.setRangeText(text, start, end, 'end');
      box.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  box.addEventListener('input', () => onChange());

  box.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      tabTrapped = false; // the next Tab moves focus away
      return;
    }
    if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;

    if (event.key === 'Tab') {
      if (!tabTrapped) {
        tabTrapped = true;
        return; // let the browser move focus
      }
      event.preventDefault();
      if (event.shiftKey) outdentSelection();
      else if (box.selectionStart !== box.selectionEnd && selectionSpansLines()) indentSelection();
      else insertText(INDENT);
      return;
    }

    tabTrapped = true;

    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      insertText(newLineWithIndent(box.value.slice(0, box.selectionStart), language));
    }
  });

  function selectionSpansLines() {
    return box.value.slice(box.selectionStart, box.selectionEnd).includes('\n');
  }

  /** The start/end of all lines touched by the selection. */
  function selectedLinesRange() {
    const start = box.value.lastIndexOf('\n', box.selectionStart - 1) + 1;
    let end = box.value.indexOf('\n', box.selectionEnd);
    if (end === -1) end = box.value.length;
    return [start, end];
  }

  function indentSelection() {
    const [start, end] = selectedLinesRange();
    const block = box.value.slice(start, end).split('\n').map((line) => INDENT + line).join('\n');
    insertText(block, start, end);
    box.setSelectionRange(start, start + block.length);
  }

  function outdentSelection() {
    const [start, end] = selectedLinesRange();
    const block = box.value.slice(start, end).split('\n').map(outdentLine).join('\n');
    insertText(block, start, end);
    box.setSelectionRange(start, start + block.length);
  }

  return {
    kind: 'basic',

    /** Show a file. (The simple editor keeps one undo history, so switching files resets it.) */
    openDocument(id, text, languageId) {
      currentId = id;
      language = languageId;
      box.value = text;
      box.scrollTop = 0;
      box.setSelectionRange(0, 0);
    },

    closeDocument(id) {
      if (id === currentId) currentId = null;
    },

    getValue: () => box.value,

    /** Replace the whole text (used when a preset is loaded). */
    replaceAll(text) {
      insertText(text, 0, box.value.length);
    },

    insertAtCursor(text) {
      insertText(text);
    },

    setLanguage(languageId) {
      language = languageId;
    },

    setTheme() {}, // colors come from CSS variables, nothing to do

    focus: () => box.focus(),
    layout() {},

    dispose() {
      box.remove();
    },
  };
}
