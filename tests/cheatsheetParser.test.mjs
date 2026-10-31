import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseCheatSheet, matchesFilters, groupByLevel, wrapCppStatements, toFullProgram, slugify,
} from '../public/js/content/cheatsheetParser.js';

const SAMPLE = `# Title is ignored

## For loop
level: 2
importance: must
summary: Repeat things.
stdin: Ana | 17

- First point.
- Second point.

\`\`\`python
for i in range(3):
    print(i)
\`\`\`

## Broken topic
level: 9
importance: must
summary: Bad level.

\`\`\`python
x = 1
\`\`\`
`;

test('parses a topic: metadata, bullets, code, stdin', () => {
  const { topics, problems } = parseCheatSheet(SAMPLE, 'python');
  assert.equal(topics.length, 1);
  const t = topics[0];
  assert.equal(t.id, 'python-for-loop');
  assert.equal(t.level, 2);
  assert.equal(t.importance, 'must');
  assert.equal(t.summary, 'Repeat things.');
  assert.equal(t.stdin, 'Ana\n17\n');
  assert.deepEqual(t.points, ['First point.', 'Second point.']);
  assert.equal(t.code, 'for i in range(3):\n    print(i)');
  assert.equal(problems.length, 1); // the broken topic is reported, not fatal
  assert.match(problems[0], /Broken topic.*level/);
});

test('C++ topics require runs and a valid kind', () => {
  const md = '## A\nlevel: 1\nimportance: must\nsummary: s\n\n```cpp\nint x;\n```\n';
  assert.match(parseCheatSheet(md, 'cpp').problems[0], /runs must be/);
  const ok = parseCheatSheet(md.replace('summary: s', 'summary: s\nruns: yes'), 'cpp');
  assert.equal(ok.topics.length, 1);
  assert.equal(ok.topics[0].kind, 'statements');
});

test('problems: unknown lines, unclosed code, missing code or summary', () => {
  assert.match(parseCheatSheet('## A\nlevel: 1\nimportance: must\nsummary: s\nwhat is this\n', 'python').problems.join('|'), /could not understand/);
  assert.match(parseCheatSheet('## A\nlevel: 1\nimportance: must\nsummary: s\n```python\nx=1\n', 'python').problems.join('|'), /never closed/);
  assert.match(parseCheatSheet('## A\nlevel: 1\nimportance: must\nsummary: s\n', 'python').problems[0], /code block is missing/);
  assert.match(parseCheatSheet('## A\nlevel: 1\nimportance: must\n```python\nx=1\n```\n', 'python').problems[0], /summary is missing/);
});

test('handles Windows line endings and text before the first topic', () => {
  const { topics } = parseCheatSheet(SAMPLE.replace(/\n/g, '\r\n'), 'python');
  assert.equal(topics.length, 1);
  assert.equal(topics[0].code, 'for i in range(3):\n    print(i)');
});

test('filters by search words, level and importance', () => {
  const t = parseCheatSheet(SAMPLE, 'python').topics[0];
  assert.equal(matchesFilters(t, { query: 'repeat' }), true);
  assert.equal(matchesFilters(t, { query: 'range loop' }), true);
  assert.equal(matchesFilters(t, { query: 'range banana' }), false); // every word must match
  assert.equal(matchesFilters(t, { query: 'RANGE' }), true);        // case-insensitive, also searches code
  assert.equal(matchesFilters(t, { level: '2' }), true);
  assert.equal(matchesFilters(t, { level: '3' }), false);
  assert.equal(matchesFilters(t, { importance: 'nice' }), false);
});

test('groups by level in order, skipping empty levels', () => {
  const mk = (level, id) => ({ level, id });
  const groups = groupByLevel([mk(3, 'a'), mk(1, 'b'), mk(3, 'c')]);
  assert.deepEqual(groups.map((g) => [g.level, g.topics.map((t) => t.id)]), [[1, ['b']], [3, ['a', 'c']]]);
});

test('C++ statements are wrapped in a full program; Python is left as is', () => {
  const wrapped = wrapCppStatements('int x = 5;\n\ncout << x << endl;\n');
  assert.equal(wrapped, '#include <iostream>\nusing namespace std;\n\nint main() {\n    int x = 5;\n\n    cout << x << endl;\n    return 0;\n}\n');
  assert.equal(toFullProgram({ language: 'python', kind: 'program', code: 'print(1)  \n\n' }), 'print(1)\n');
  assert.equal(toFullProgram({ language: 'cpp', kind: 'program', code: 'int main(){}' }), 'int main(){}\n');
});

test('slugify makes safe ids', () => {
  assert.equal(slugify('if, elif, else'), 'if-elif-else');
  assert.equal(slugify('  C++ & Python!  '), 'c-python');
});
