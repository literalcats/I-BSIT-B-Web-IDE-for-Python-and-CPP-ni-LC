// js/ui/fileList.js
// Draws the list of files in the left panel. It only DISPLAYS; clicking a
// file calls onSelect(id) and the app decides what to do.

import { LANGUAGES } from '../config.js';
import { byId, el } from '../core/dom.js';

export function createFileList({ onSelect }) {
  const list = byId('file-list');

  return {
    render(files, currentId) {
      if (files.length === 0) {
        list.replaceChildren(el('li', { class: 'empty-state', text: 'No files yet. Press "+ New file" to start.' }));
        return;
      }
      list.replaceChildren(
        ...files.map((file) =>
          el(
            'li',
            {},
            el(
              'button',
              {
                class: 'file-item',
                type: 'button',
                'aria-current': file.id === currentId ? 'true' : 'false',
                onclick: () => onSelect(file.id),
                title: file.name,
              },
              el('span', { class: 'file-item__name', text: file.name }),
              el('span', { class: 'file-item__lang', text: LANGUAGES[file.language].label }),
            ),
          ),
        ),
      );
    },
  };
}
