// js/app/setupMoreMenu.js
// The "More" menu: back up, restore, switch editor, and the Tips dialog.

import { byId } from '../core/dom.js';
import { downloadText, todayStamp } from '../core/utils.js';
import { StoreError } from '../storage/fileStore.js';
import { bindClose, openDialog } from '../ui/dialogs.js';
import { registerMenu } from '../ui/menus.js';
import { saveEditorPref } from './setupEditor.js';

const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`;

export function setupMoreMenu({ store, files, editor, notify }) {
  registerMenu('btn-more', 'menu-more');

  async function backup() {
    try {
      await files.flush();
      const data = await store.exportAll();
      downloadText(`code-lab-backup-${todayStamp()}.json`, JSON.stringify(data, null, 2), 'application/json');
      notify(`Backed up ${plural(data.files.length, 'file')}`);
    } catch {
      notify('Could not create the backup.', { error: true });
    }
  }

  async function restore(file) {
    try {
      const { imported, skipped } = await store.importAll(JSON.parse(await file.text()));
      await files.refreshList();
      const extra = skipped ? ` (${skipped} skipped because they were damaged)` : '';
      notify(`Added ${plural(imported, 'file')} from the backup${extra}`);
    } catch (error) {
      notify(error instanceof StoreError ? error.message : 'That file is not a Code Lab backup.', { error: true });
    }
  }

  async function switchEditor() {
    await files.flush(); // make sure nothing is lost before the page reloads
    if (!saveEditorPref(editor.kind === 'monaco' ? 'basic' : 'monaco')) {
      notify('Your browser could not remember that choice.', { error: true });
      return;
    }
    window.location.reload();
  }

  const restoreInput = byId('restore-input');
  byId('mi-backup').addEventListener('click', backup);
  byId('mi-restore').addEventListener('click', () => restoreInput.click());
  restoreInput.addEventListener('change', () => {
    const [file] = restoreInput.files;
    restoreInput.value = ''; // so choosing the same file again still fires "change"
    if (file) restore(file);
  });
  byId('mi-editor').addEventListener('click', switchEditor);
  byId('mi-about').addEventListener('click', () => openDialog(byId('dlg-about')));
  bindClose('dlg-about', 'about-close');
}
