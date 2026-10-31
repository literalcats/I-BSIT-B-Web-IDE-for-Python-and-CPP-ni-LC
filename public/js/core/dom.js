// js/core/dom.js
// Small helpers for talking to the web page (the "DOM").

/**
 * Find an element by its id. If it is missing we stop with a clear message,
 * instead of failing later with a confusing "cannot read properties of null".
 */
export function byId(id) {
  const node = document.getElementById(id);
  if (!node) throw new Error(`index.html has no element with id="${id}"`);
  return node;
}

/**
 * Build an element safely:  el('button', { class: 'btn', onclick: fn }, 'Save')
 * Text is added as plain text (never as HTML), so a file named
 * "<script>" can't hurt anything.
 */
export function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value === null || value === undefined || value === false) continue;
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key === 'dataset') Object.assign(node.dataset, value);
    else if (key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.slice(2).toLowerCase(), value);
    } else node.setAttribute(key, value === true ? '' : String(value));
  }
  for (const child of children.flat()) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child); // strings become plain text nodes
  }
  return node;
}
