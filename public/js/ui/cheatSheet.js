// js/ui/cheatSheet.js
// The cheat sheet side panel: search, filters, topics grouped from the
// easiest level to the hardest, and "Copy to editor" buttons.

import { LANGUAGES } from '../config.js';
import { byId, el } from '../core/dom.js';
import {
  IMPORTANCE, LEVELS, RUNS, groupByLevel, matchesFilters, parseCheatSheet,
} from '../content/cheatsheetParser.js';

export function createCheatSheet({ fetchText, onInsert, onOpenAsFile }) {
  const list = byId('cheat-list');
  const search = byId('cheat-search');
  const levelFilter = byId('filter-level');
  const importanceFilter = byId('filter-importance');
  const tabs = [...document.querySelectorAll('#cheat-panel [role="tab"][data-lang]')];

  let language = 'python';
  const loaded = new Map(); // languageId -> { topics, problems } or { error }
  const loading = new Map();

  async function ensureLoaded(languageId) {
    if (loaded.has(languageId)) return loaded.get(languageId);
    if (!loading.has(languageId)) {
      loading.set(
        languageId,
        fetchText(`data/cheatsheets/${languageId}.md`)
          .then((text) => parseCheatSheet(text, languageId))
          .catch(() => ({ error: true }))
          .then((result) => {
            if (!result.error) loaded.set(languageId, result); // do not remember failures, so we can retry
            loading.delete(languageId);
            return result;
          }),
      );
    }
    return loading.get(languageId);
  }

  function chips(topic) {
    const result = [
      el('span', { class: `chip chip--lvl${topic.level}`, text: `Level ${topic.level} · ${LEVELS[topic.level]}` }),
      el('span', { class: `chip chip--${topic.importance}`, text: IMPORTANCE[topic.importance] }),
    ];
    if (topic.language === 'cpp') {
      const cls = topic.runs === 'yes' ? 'ok' : topic.runs === 'maybe' ? 'warn' : 'bad';
      result.push(el('span', { class: `chip chip--${cls}`, text: RUNS[topic.runs] }));
    }
    return result;
  }

  function card(topic) {
    return el(
      'details',
      { class: 'cheat-card', dataset: { id: topic.id } },
      el(
        'summary',
        {},
        el('span', { class: 'cheat-card__title', text: topic.title }),
        el('span', { class: 'cheat-card__tags' }, ...chips(topic)),
        el('span', { class: 'cheat-card__summary', text: topic.summary }),
      ),
      el(
        'div',
        { class: 'cheat-card__body' },
        topic.points.length ? el('ul', {}, ...topic.points.map((point) => el('li', { text: point }))) : null,
        el('pre', { class: 'code-block', tabindex: '0' }, el('code', { text: topic.code })),
        el(
          'div',
          { class: 'cheat-card__actions' },
          el('button', { class: 'btn btn--small btn--primary', type: 'button', text: 'Copy to editor', onclick: () => onInsert(topic) }),
          el('button', { class: 'btn btn--small', type: 'button', text: 'Open as new file', onclick: () => onOpenAsFile(topic) }),
        ),
      ),
    );
  }

  async function render() {
    const result = await ensureLoaded(language);
    if (result.error) {
      list.replaceChildren(
        el('p', { class: 'empty-state', text: 'The cheat sheet could not be loaded. Check your connection and try again.' }),
        el('div', { class: 'empty-state' }, el('button', { class: 'btn', type: 'button', text: 'Try again', onclick: () => render() })),
      );
      return;
    }

    const filters = { query: search.value, level: levelFilter.value, importance: importanceFilter.value };
    const shown = result.topics.filter((topic) => matchesFilters(topic, filters));
    if (shown.length === 0) {
      list.replaceChildren(el('p', { class: 'empty-state', text: 'No topics match. Clear the search or change the filters.' }));
      return;
    }

    const nodes = [];
    for (const group of groupByLevel(shown)) {
      nodes.push(el('h3', { class: 'cheat-group' }, `Level ${group.level} · ${group.label}`, el('span', { class: 'hint', text: `(${group.topics.length})` })));
      nodes.push(...group.topics.map(card));
    }
    list.replaceChildren(...nodes);
  }

  function setLanguage(languageId) {
    if (!LANGUAGES[languageId]) return;
    language = languageId;
    for (const tab of tabs) tab.setAttribute('aria-selected', String(tab.dataset.lang === languageId));
    render();
  }

  for (const tab of tabs) tab.addEventListener('click', () => setLanguage(tab.dataset.lang));
  search.addEventListener('input', () => render());
  levelFilter.addEventListener('change', () => render());
  importanceFilter.addEventListener('change', () => render());

  return {
    setLanguage,
    /** Load the topics in the background so the panel opens instantly. */
    preload() {
      ensureLoaded(language);
    },
  };
}
