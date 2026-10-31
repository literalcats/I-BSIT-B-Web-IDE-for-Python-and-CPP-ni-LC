// js/editor/monacoEditor.js
// ---------------------------------------------------------------------------
// The FULL editor: Monaco, the same editor that powers VS Code.
// Its files are copied into /vendor/monaco/ by `npm run build` and loaded from
// our own site, so it works offline too.
// ---------------------------------------------------------------------------

import { LANGUAGES, urlFor } from '../config.js';

const LOAD_TIMEOUT_MS = 20000;
let loadPromise = null;

/** Load Monaco's files once (they are big). Rejects if they cannot be loaded. */
function loadMonaco() {
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const base = urlFor('vendor/monaco/');

    // Tell Monaco where to find its helper worker (our own same-origin launcher).
    self.MonacoEnvironment = {
      getWorkerUrl: () => new URL('./monaco.worker.js', import.meta.url).href,
    };

    const timer = setTimeout(() => reject(new Error('Loading the editor took too long.')), LOAD_TIMEOUT_MS);
    const fail = (message) => {
      clearTimeout(timer);
      reject(new Error(message));
    };

    const script = document.createElement('script');
    script.src = base + 'vs/loader.js';
    script.onerror = () => fail('The editor files were not found.');
    script.onload = () => {
      try {
        window.require.config({ paths: { vs: base + 'vs' } });
        window.require(
          ['vs/editor/editor.main'],
          () => {
            clearTimeout(timer);
            resolve(window.monaco);
          },
          () => fail('The editor could not start.'),
        );
      } catch (error) {
        fail(error.message);
      }
    };
    document.head.append(script);
  });

  // If loading failed, allow another attempt later (for example after going online).
  loadPromise.catch(() => {
    loadPromise = null;
  });
  return loadPromise;
}

/** Colors that match css/tokens.css (Monaco cannot read CSS variables). */
function defineThemes(monaco) {
  monaco.editor.defineTheme('bsit-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '7f8c84', fontStyle: 'italic' },
      { token: 'keyword', foreground: '5fcf7a' },
      { token: 'string', foreground: 'e8b64a' },
      { token: 'number', foreground: '85aef7' },
    ],
    colors: {
      'editor.background': '#171a1b',
      'editor.foreground': '#e3e6e3',
      'editorLineNumber.foreground': '#6b746e',
      'editorLineNumber.activeForeground': '#a4aba6',
      'editor.lineHighlightBackground': '#212526',
      'editor.selectionBackground': '#1f7a3566',
      'editorCursor.foreground': '#5fcf7a',
    },
  });

  monaco.editor.defineTheme('bsit-light', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '5f6368', fontStyle: 'italic' },
      { token: 'keyword', foreground: '1a73e8' },
      { token: 'string', foreground: 'b3261e' },
      { token: 'number', foreground: '137333' },
    ],
    colors: {
      'editor.background': '#f8f9fa',
      'editor.foreground': '#202124',
      'editorLineNumber.foreground': '#80868b',
      'editor.lineHighlightBackground': '#eef1f4',
      'editorCursor.foreground': '#1a73e8',
    },
  });
}

export async function createMonacoEditor(container, { onChange, onRun, onSave, theme }) {
  const monaco = await loadMonaco();
  defineThemes(monaco);

  const editor = monaco.editor.create(container, {
    theme: theme === 'light' ? 'bsit-light' : 'bsit-dark',
    automaticLayout: true, // resize with the window
    fontFamily: getComputedStyle(document.documentElement).getPropertyValue('--font-code').trim() || 'monospace',
    fontSize: 14,
    tabSize: 4,
    insertSpaces: true,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    renderLineHighlight: 'line',
    padding: { top: 8, bottom: 8 },
    wordWrap: 'off',
    accessibilitySupport: 'auto',
  });

  // Our own shortcuts must win over Monaco's (Ctrl+Enter normally inserts a line).
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => onRun());
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => onSave());

  // One "model" (text + undo history) per file, so switching files keeps each file's undo stack.
  const models = new Map();

  function modelFor(id, text, languageId) {
    let model = models.get(id);
    if (!model) {
      model = monaco.editor.createModel(text, LANGUAGES[languageId].monaco);
      model.onDidChangeContent(() => {
        if (editor.getModel() === model) onChange();
      });
      models.set(id, model);
    }
    return model;
  }

  return {
    kind: 'monaco',

    openDocument(id, text, languageId) {
      const model = models.get(id);
      if (model && model.getValue() !== text) model.setValue(text); // text changed behind our back
      editor.setModel(modelFor(id, text, languageId));
      editor.setScrollTop(0);
    },

    closeDocument(id) {
      const model = models.get(id);
      if (!model) return;
      if (editor.getModel() === model) editor.setModel(null);
      model.dispose();
      models.delete(id);
    },

    getValue: () => (editor.getModel() ? editor.getValue() : ''),

    /** Replace everything, but as an edit the student can undo with Ctrl+Z. */
    replaceAll(text) {
      const model = editor.getModel();
      if (!model) return;
      editor.executeEdits('preset', [{ range: model.getFullModelRange(), text }]);
      editor.pushUndoStop();
    },

    insertAtCursor(text) {
      const selection = editor.getSelection();
      editor.executeEdits('cheatsheet', [{ range: selection, text, forceMoveMarkers: true }]);
      editor.pushUndoStop();
      editor.focus();
    },

    setLanguage(languageId) {
      const model = editor.getModel();
      if (model) monaco.editor.setModelLanguage(model, LANGUAGES[languageId].monaco);
    },

    setTheme(name) {
      monaco.editor.setTheme(name === 'light' ? 'bsit-light' : 'bsit-dark');
    },

    focus: () => editor.focus(),
    layout: () => editor.layout(),

    dispose() {
      for (const model of models.values()) model.dispose();
      models.clear();
      editor.dispose();
    },
  };
}
