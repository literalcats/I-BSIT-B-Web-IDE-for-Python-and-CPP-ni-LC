// js/ui/presetsMenu.js
// The "Presets" drop-down: ready-made example programs, grouped by topic.
// Choosing one creates a NEW file (it never replaces the student's work).

import { LANGUAGES, LANGUAGE_IDS } from '../config.js';
import { byId, el } from '../core/dom.js';
import { buildPresetGroups } from '../content/presets.js';

export function createPresetsMenu({ getIndex, getCurrentLanguage, onPick }) {
  const menu = byId('menu-presets');
  let language = 'python';

  function render() {
    const index = getIndex();
    const children = [];

    // Language switch (clicking it must not close the menu).
    const switcher = el(
      'div',
      { class: 'tabs', role: 'group', 'aria-label': 'Preset language' },
      ...LANGUAGE_IDS.map((id) =>
        el('button', {
          class: 'tab',
          type: 'button',
          'aria-selected': String(id === language),
          text: LANGUAGES[id].label,
          onclick: (event) => {
            event.stopPropagation();
            language = id;
            render();
            menu.querySelector(`.tab[aria-selected="true"]`)?.focus();
          },
        }),
      ),
    );
    children.push(switcher);

    if (!index) {
      children.push(el('p', { class: 'empty-state', text: 'The preset list could not be loaded. Check your connection and reload.' }));
    } else {
      for (const { group, items } of buildPresetGroups(index, language)) {
        children.push(el('div', { class: 'menu__group', text: group }));
        for (const item of items) {
          children.push(
            el(
              'button',
              { class: 'menu__item', type: 'button', onclick: () => onPick({ ...item, language }) },
              item.title,
              el('span', { class: 'menu__hint', text: item.description }),
            ),
          );
        }
      }
    }
    menu.replaceChildren(...children);
  }

  return {
    /** Called each time the menu opens. */
    prepare() {
      language = getCurrentLanguage() || 'python';
      render();
    },
  };
}
