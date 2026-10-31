// js/app/setupFileButtons.js
// The New / Rename / Delete / Download buttons, plus `createAndReport`, which
// other features (presets, cheat sheet) also use to make a file.
// It asks the student (dialogs), tells the controller, and reports the result.

import { byId } from '../core/dom.js';
import { StoreError } from '../storage/fileStore.js';
import { confirmDialog, fileNameDialog } from '../ui/dialogs.js';

export function setupFileButtons({ files, panels, notify }) {
  const messageFor = (error, fallback) => (error instanceof StoreError ? error.message : fallback);

  /** Create a file and tell the student what happened (or why it failed). */
  async function createAndReport(details, { suffixOnClash = false, message = '' } = {}) {
    try {
      const file = await files.create(details, { suffixOnClash });
      panels.afterFilePick();
      if (message) notify(message);
      return file;
    } catch (error) {
      notify(messageFor(error, 'Could not create the file.'), { error: true });
      return null;
    }
  }

  async function newFile() {
    const result = await fileNameDialog({
      mode: 'new',
      language: files.current?.language,
      takenNames: files.files.map((f) => f.name),
    });
    if (result) await createAndReport({ name: result.name, language: result.language });
  }

  async function renameFile() {
    const file = files.current;
    if (!file) return;
    const result = await fileNameDialog({
      mode: 'rename',
      language: file.language,
      currentName: file.name,
      takenNames: files.files.filter((f) => f.id !== file.id).map((f) => f.name),
    });
    if (!result) return;
    try {
      await files.rename(result.name);
      notify(`Renamed to ${result.name}`);
    } catch (error) {
      notify(messageFor(error, 'Could not rename the file.'), { error: true });
    }
  }

  async function deleteFile() {
    const file = files.current;
    if (!file) return;
    const sure = await confirmDialog({
      title: `Delete ${file.name}?`,
      message: 'This removes the file from this device. It cannot be undone. Use Download first if you want a copy.',
      okLabel: 'Delete file',
    });
    if (!sure) return;
    try {
      await files.deleteCurrent();
      notify(`Deleted ${file.name}`);
    } catch {
      notify('Could not delete the file.', { error: true });
    }
  }

  byId('btn-new-file').addEventListener('click', newFile);
  byId('btn-rename').addEventListener('click', renameFile);
  byId('btn-delete').addEventListener('click', deleteFile);
  byId('btn-download').addEventListener('click', () => files.download());

  return { createAndReport };
}
