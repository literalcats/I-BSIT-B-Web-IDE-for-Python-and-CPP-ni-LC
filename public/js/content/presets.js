// js/content/presets.js
// ---------------------------------------------------------------------------
// Loads the ready-made example programs (presets).
//   data/presets/index.json            the list: titles, groups, sample input
//   data/presets/python/<id>.py        the code, one file per preset
//   data/presets/cpp/<id>.cpp
//
// Picking a preset ALWAYS makes a new file. It never overwrites a student's work.
// ---------------------------------------------------------------------------

import { LANGUAGES, urlFor } from '../config.js';

/** Where a preset's code file lives, relative to the site root. */
export function presetPath(id, languageId) {
  return `data/presets/${languageId}/${id}${LANGUAGES[languageId].ext}`;
}

/**
 * Turn the raw index.json into the list for ONE language, grouped for the menu.
 * Returns [{ group, items: [{ id, title, description, stdin, fileName, path }] }].
 * Entries with a missing id or title are skipped instead of breaking the menu.
 */
export function buildPresetGroups(index, languageId) {
  const ext = LANGUAGES[languageId].ext;
  const groupOrder = Array.isArray(index?.groups) ? index.groups : [];
  const byGroup = new Map(groupOrder.map((name) => [name, []]));

  for (const entry of Array.isArray(index?.presets) ? index.presets : []) {
    if (!entry || typeof entry.id !== 'string' || typeof entry.title !== 'string') continue;
    const group = typeof entry.group === 'string' ? entry.group : 'Other';
    if (!byGroup.has(group)) byGroup.set(group, []);
    byGroup.get(group).push({
      id: entry.id,
      title: entry.title,
      description: typeof entry.description === 'string' ? entry.description : '',
      stdin: entry.stdin && typeof entry.stdin[languageId] === 'string' ? entry.stdin[languageId] : '',
      fileName: entry.id + ext,
      path: presetPath(entry.id, languageId),
    });
  }

  return [...byGroup].filter(([, items]) => items.length > 0).map(([group, items]) => ({ group, items }));
}

/** Download the list. Throws a friendly Error if it cannot be read. */
export async function fetchPresetIndex(fetchFn = fetch) {
  const response = await fetchFn(urlFor('data/presets/index.json'));
  if (!response.ok) throw new Error('The preset list could not be loaded.');
  return response.json();
}

/** Download the code of one preset. */
export async function fetchPresetCode(path, fetchFn = fetch) {
  const response = await fetchFn(urlFor(path));
  if (!response.ok) throw new Error('That preset could not be loaded. Check your connection.');
  return response.text();
}
