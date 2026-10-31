// js/ui/theme.js
// Dark / light mode. The choice is remembered in localStorage (a tiny
// per-browser setting). The colors themselves live in css/tokens.css.

import { byId } from '../core/dom.js';

const KEY = 'bsit.theme';
const META_COLORS = { dark: '#242729', light: '#f3f4f6' };

export function readTheme() {
  try {
    return localStorage.getItem(KEY) === 'light' ? 'light' : 'dark'; // dark is the default
  } catch {
    return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
  }
}

/** Apply a theme to the page. onChange(theme) lets other parts (the editor) follow. */
export function applyTheme(theme, onChange = () => {}) {
  document.documentElement.dataset.theme = theme;
  byId('meta-theme-color').setAttribute('content', META_COLORS[theme]);

  // The button shows what you will switch TO.
  byId('theme-icon').textContent = theme === 'dark' ? '☀' : '☾';
  byId('theme-label').textContent = theme === 'dark' ? 'Light mode' : 'Dark mode';
  byId('btn-theme').setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');

  try {
    localStorage.setItem(KEY, theme);
  } catch {
    /* private mode: the theme just will not be remembered */
  }
  onChange(theme);
}

export function initTheme(onChange) {
  applyTheme(readTheme(), onChange);
  byId('btn-theme').addEventListener('click', () => {
    applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark', onChange);
  });
}
