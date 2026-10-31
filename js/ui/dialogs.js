// js/ui/dialogs.js
// The pop-up windows (<dialog> elements in index.html).
// Each function returns a Promise, so the app can simply write:
//     if (await confirmDialog({...})) { deleteIt(); }

import { LANGUAGES } from '../config.js';
import { byId } from '../core/dom.js';
import { checkFileName } from '../storage/fileStore.js';

/** Open a <dialog>. Falls back gracefully if the browser lacks showModal. */
export function openDialog(dialog) {
  if (dialog.open) return;
  if (typeof dialog.showModal === 'function') dialog.showModal();
  else dialog.setAttribute('open', '');
}

export function closeDialog(dialog) {
  if (!dialog.open) return;
  if (typeof dialog.close === 'function') dialog.close();
  else dialog.removeAttribute('open');
}

/** Wire a simple "Close" button once. */
export function bindClose(dialogId, buttonId) {
  byId(buttonId).addEventListener('click', () => closeDialog(byId(dialogId)));
}

/**
 * Ask "are you sure?". Resolves true (OK) or false (Cancel / Escape).
 */
export function confirmDialog({ title, message, okLabel = 'Delete', danger = true }) {
  const dialog = byId('dlg-confirm');
  byId('confirm-title').textContent = title;
  byId('confirm-message').textContent = message;
  const ok = byId('confirm-ok');
  ok.textContent = okLabel;
  ok.className = danger ? 'btn btn--danger' : 'btn btn--primary';

  return new Promise((resolve) => {
    let answer = false;
    const cancel = byId('confirm-cancel');
    const onOk = () => { answer = true; closeDialog(dialog); };
    const onCancel = () => closeDialog(dialog);
    const onClose = () => {
      ok.removeEventListener('click', onOk);
      cancel.removeEventListener('click', onCancel);
      dialog.removeEventListener('close', onClose);
      resolve(answer);
    };
    ok.addEventListener('click', onOk);
    cancel.addEventListener('click', onCancel);
    dialog.addEventListener('close', onClose);
    openDialog(dialog);
    cancel.focus(); // the safe choice is focused first
  });
}

/**
 * Ask for a file name.
 *   mode 'new'    : also asks for the language, returns { name } (the full name with extension)
 *   mode 'rename' : the language is fixed, returns { name }
 * `takenNames` = names already used by OTHER files (the window refuses duplicates).
 * Resolves null if cancelled. The window stays open until the name is valid.
 */
export function fileNameDialog({ mode, language = 'python', currentName = '', takenNames = [] }) {
  const dialog = byId('dlg-file');
  const form = byId('form-file');
  const languageField = byId('field-language');
  const languageSelect = byId('file-language');
  const input = byId('file-name');
  const extHint = byId('file-name-ext');
  const error = byId('file-name-error');

  byId('dlg-file-title').textContent = mode === 'new' ? 'New file' : 'Rename file';
  byId('file-submit').textContent = mode === 'new' ? 'Create file' : 'Rename';
  languageField.hidden = mode !== 'new';
  languageSelect.value = language;
  error.textContent = '';

  const extOf = () => LANGUAGES[languageSelect.value].ext;
  const refreshHint = () => {
    extHint.textContent = `The name ends in ${mode === 'new' ? extOf() : LANGUAGES[language].ext}. We add it if you forget.`;
  };

  // In "new" mode we edit only the part before the extension.
  const stripExt = (name) => (name.toLowerCase().endsWith(LANGUAGES[language].ext) ? name.slice(0, -LANGUAGES[language].ext.length) : name);
  input.value = mode === 'rename' ? stripExt(currentName) : '';
  refreshHint();

  return new Promise((resolve) => {
    let result = null;

    const onLanguage = () => refreshHint();
    const onCancel = () => closeDialog(dialog);
    const onSubmit = (event) => {
      event.preventDefault();
      const chosenLanguage = mode === 'new' ? languageSelect.value : language;
      const ext = LANGUAGES[chosenLanguage].ext;
      let typed = input.value.trim();
      if (!typed.toLowerCase().endsWith(ext)) typed += ext;
      const check = checkFileName(typed);
      if (!check.ok) {
        error.textContent = check.message;
        input.focus();
        return;
      }
      if (takenNames.some((taken) => taken.toLowerCase() === check.name.toLowerCase())) {
        error.textContent = 'A file with that name already exists.';
        input.focus();
        return;
      }
      result = { name: check.name, language: check.language };
      closeDialog(dialog);
    };
    const onClose = () => {
      form.removeEventListener('submit', onSubmit);
      languageSelect.removeEventListener('change', onLanguage);
      byId('file-cancel').removeEventListener('click', onCancel);
      dialog.removeEventListener('close', onClose);
      resolve(result);
    };

    form.addEventListener('submit', onSubmit);
    languageSelect.addEventListener('change', onLanguage);
    byId('file-cancel').addEventListener('click', onCancel);
    dialog.addEventListener('close', onClose);
    openDialog(dialog);
    input.focus();
    input.select();
  });
}
