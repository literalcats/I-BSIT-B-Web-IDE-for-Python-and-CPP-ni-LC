// js/ui/menus.js
// Drop-down menus (Presets, More). Click the button to open, click outside or
// press Escape to close. Arrow keys move between items.

import { byId } from '../core/dom.js';

const registered = [];

export function closeAllMenus() {
  for (const { button, menu } of registered) {
    menu.hidden = true;
    button.setAttribute('aria-expanded', 'false');
  }
}

/** Connect a button to its menu. `onOpen` runs just before it opens (to fill it). */
export function registerMenu(buttonId, menuId, onOpen = () => {}) {
  const button = byId(buttonId);
  const menu = byId(menuId);
  registered.push({ button, menu });

  button.addEventListener('click', (event) => {
    event.stopPropagation();
    const willOpen = menu.hidden;
    closeAllMenus();
    if (willOpen) {
      onOpen();
      menu.hidden = false;
      button.setAttribute('aria-expanded', 'true');
      const first = menu.querySelector('button');
      if (first) first.focus();
    }
  });

  menu.addEventListener('click', () => closeAllMenus()); // choosing an item closes the menu

  menu.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    const items = [...menu.querySelectorAll('button')];
    const index = items.indexOf(document.activeElement);
    const next = event.key === 'ArrowDown' ? index + 1 : index - 1;
    items[(next + items.length) % items.length]?.focus();
  });
}

/** Close menus on outside click / Escape (call once). */
export function initMenuClosing() {
  document.addEventListener('click', closeAllMenus);
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    const open = registered.find(({ menu }) => !menu.hidden);
    if (open) {
      closeAllMenus();
      open.button.focus();
    }
  });
}
