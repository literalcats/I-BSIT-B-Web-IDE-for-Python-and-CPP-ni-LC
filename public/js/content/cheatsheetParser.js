// js/content/cheatsheetParser.js
// ---------------------------------------------------------------------------
// Turns a cheat sheet Markdown file (data/cheatsheets/python.md) into a list
// of topic objects. Markdown is easy for anyone to edit, so classmates can
// add topics later without touching any JavaScript.
//
// THE FORMAT (one topic):
//
//   ## Topic title
//   level: 2            1 = easiest ... 4 = hardest
//   importance: must    must | good | nice
//   runs: yes           C++ only: yes | maybe | no  (does it run in the browser?)
//   kind: statements    C++ only: statements (goes inside main) | program (a whole file)
//   stdin: Ana | 17     optional example input, "|" separates lines
//   summary: One short sentence.
//
//   - A bullet point explaining the idea.
//   - Another one.
//
//   ```python
//   print("code goes here")
//   ```
//
// Lines starting with "<!--" are comments and ignored.
// ---------------------------------------------------------------------------

export const LEVELS = {
  1: 'Easiest',
  2: 'Easy',
  3: 'Medium',
  4: 'Hardest',
};

export const IMPORTANCE = {
  must: 'Must-know',
  good: 'Good to know',
  nice: 'Nice to have',
};

export const RUNS = {
  yes: 'Runs here',
  maybe: 'May run here',
  no: 'Needs g++',
};

const META_KEYS = new Set(['level', 'importance', 'runs', 'kind', 'stdin', 'summary']);

/** Parse one whole file. Never throws: problems are returned in `problems`. */
export function parseCheatSheet(markdown, languageId) {
  const topics = [];
  const problems = [];
  const lines = String(markdown).replace(/\r\n?/g, '\n').split('\n');

  let topic = null;
  let inCode = false;
  let code = [];
  let metaDone = false;

  const closeTopic = () => {
    if (!topic) return;
    const issue = checkTopic(topic, languageId);
    if (issue) problems.push(`"${topic.title}": ${issue}`);
    else topics.push(topic);
    topic = null;
  };

  for (const [index, line] of lines.entries()) {
    if (inCode) {
      if (line.startsWith('```')) {
        inCode = false;
        if (topic) topic.code = code.join('\n');
        code = [];
      } else code.push(line);
      continue;
    }

    if (line.startsWith('<!--')) continue;

    if (line.startsWith('## ')) {
      closeTopic();
      topic = {
        id: '',
        title: line.slice(3).trim(),
        level: 0,
        importance: '',
        runs: languageId === 'cpp' ? '' : 'yes',
        kind: languageId === 'cpp' ? 'statements' : 'program',
        stdin: '',
        summary: '',
        points: [],
        code: '',
        language: languageId,
      };
      topic.id = `${languageId}-${slugify(topic.title)}`;
      metaDone = false;
      continue;
    }

    if (!topic) continue; // text before the first "##" (a file title, notes) is ignored

    if (line.startsWith('```')) {
      inCode = true;
      metaDone = true;
      continue;
    }

    if (line.trim() === '') {
      continue;
    }

    if (line.startsWith('- ')) {
      topic.points.push(line.slice(2).trim());
      metaDone = true;
      continue;
    }

    const meta = !metaDone && /^([a-z]+):\s*(.*)$/.exec(line);
    if (meta && META_KEYS.has(meta[1])) {
      applyMeta(topic, meta[1], meta[2].trim());
      continue;
    }

    problems.push(`line ${index + 1}: could not understand "${line.slice(0, 40)}"`);
  }

  if (inCode) problems.push('a code block was never closed with ```');
  closeTopic();
  return { topics, problems };
}

function applyMeta(topic, key, value) {
  if (key === 'level') topic.level = Number(value);
  else if (key === 'stdin') topic.stdin = value.split('|').map((part) => part.trim()).join('\n') + (value ? '\n' : '');
  else topic[key] = value;
}

function checkTopic(topic, languageId) {
  if (!(topic.level in LEVELS)) return 'level must be 1, 2, 3 or 4';
  if (!(topic.importance in IMPORTANCE)) return 'importance must be must, good or nice';
  if (topic.summary === '') return 'summary is missing';
  if (topic.code.trim() === '') return 'a code block is missing';
  if (languageId === 'cpp') {
    if (!(topic.runs in RUNS)) return 'runs must be yes, maybe or no';
    if (topic.kind !== 'statements' && topic.kind !== 'program') return 'kind must be statements or program';
  }
  return null;
}

export function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ---------------------------------------------------------------------------
// Filtering and grouping (used by the cheat sheet panel)
// ---------------------------------------------------------------------------

/** Does this topic match the search box and the two drop-downs? */
export function matchesFilters(topic, { query = '', level = 'all', importance = 'all' }) {
  if (level !== 'all' && topic.level !== Number(level)) return false;
  if (importance !== 'all' && topic.importance !== importance) return false;
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const haystack = [topic.title, topic.summary, ...topic.points, topic.code].join(' ').toLowerCase();
  return words.every((word) => haystack.includes(word));
}

/** Group topics by level (1..4), keeping the file's order inside each level. */
export function groupByLevel(topics) {
  const groups = [];
  for (const level of [1, 2, 3, 4]) {
    const items = topics.filter((topic) => topic.level === level);
    if (items.length > 0) groups.push({ level, label: LEVELS[level], topics: items });
  }
  return groups;
}

// ---------------------------------------------------------------------------
// Making snippets ready to use in the editor
// ---------------------------------------------------------------------------

/** A complete C++ program around a few statements. */
export function wrapCppStatements(statements) {
  const body = statements
    .replace(/\s+$/, '')
    .split('\n')
    .map((line) => (line.trim() === '' ? '' : '    ' + line))
    .join('\n');
  return `#include <iostream>\nusing namespace std;\n\nint main() {\n${body}\n    return 0;\n}\n`;
}

/** The text of a complete runnable file for this topic. */
export function toFullProgram(topic) {
  if (topic.language === 'cpp' && topic.kind === 'statements') return wrapCppStatements(topic.code);
  return topic.code.replace(/\s+$/, '') + '\n';
}
