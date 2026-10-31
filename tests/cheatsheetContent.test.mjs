// tests/cheatsheetContent.test.mjs
// Makes sure EVERY example in the cheat sheets really works:
//   - the Markdown parses with no problems,
//   - every Python example runs in real Python (Pyodide) with no error,
//   - every C++ example compiles with g++ with NO warnings, and runs,
//   - every C++ example marked "runs: yes" gives the same output in JSCPP (the browser engine).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCheatSheet, toFullProgram } from '../public/js/content/cheatsheetParser.js';
import { createPythonSession } from '../public/js/runners/pythonSession.js';
import { HAS_PYODIDE, loadSharedPyodide } from './helpers/pyodideNode.mjs';
import { HAS_GPP, HAS_JSCPP, runWithGpp, runWithJscpp } from './helpers/cppTools.mjs';

const DATA = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'data', 'cheatsheets');
const load = (name, language) => parseCheatSheet(readFileSync(path.join(DATA, name), 'utf8'), language);

const python = load('python.md', 'python');
const cpp = load('cpp.md', 'cpp');

test('cheat sheets parse with no problems and have unique ids', () => {
  assert.deepEqual(python.problems, []);
  assert.deepEqual(cpp.problems, []);
  for (const { topics } of [python, cpp]) {
    const ids = topics.map((t) => t.id);
    assert.equal(new Set(ids).size, ids.length, 'duplicate topic titles');
    assert.ok(topics.length >= 25);
  }
});

test('every level and importance is used, so filters are never empty', () => {
  for (const { topics } of [python, cpp]) {
    for (const level of [1, 2, 3, 4]) assert.ok(topics.some((t) => t.level === level), `level ${level}`);
    for (const importance of ['must', 'good', 'nice']) assert.ok(topics.some((t) => t.importance === importance), importance);
  }
});

test('"must-know" topics are never marked "nice to have" while being the easiest (sanity)', () => {
  assert.ok(python.topics.filter((t) => t.level === 1).every((t) => t.importance === 'must'));
  assert.ok(cpp.topics.filter((t) => t.level === 1).every((t) => t.importance === 'must'));
});

test('Python examples all run without errors', { skip: !HAS_PYODIDE && 'Pyodide not installed', timeout: 180000 }, async () => {
  const { pyodide, bootstrap } = await loadSharedPyodide();
  const session = createPythonSession(pyodide, bootstrap);
  const failures = [];
  for (const topic of python.topics) {
    let err = '';
    const { exitCode } = session.run({
      code: toFullProgram(topic),
      fileName: 'example.py',
      stdin: topic.stdin,
      write: (kind, text) => {
        if (kind === 'err') err += text;
      },
    });
    if (exitCode !== 0) failures.push(`${topic.title}: ${err.trim().split('\n').pop()}`);
  }
  assert.deepEqual(failures, []);
});

test('C++ examples compile cleanly with g++ and run', { skip: !HAS_GPP && 'g++ not installed', timeout: 300000 }, () => {
  const failures = [];
  for (const topic of cpp.topics) {
    const result = runWithGpp(toFullProgram(topic), topic.stdin);
    if (!result.ok) failures.push(`${topic.title}: ${result.error}`);
    else if (result.warnings) failures.push(`${topic.title}: warnings: ${result.warnings.split('\n')[0]}`);
  }
  assert.deepEqual(failures, []);
});

test('C++ examples marked "runs: yes" give the same output in JSCPP as in g++', { skip: !(HAS_GPP && HAS_JSCPP) && 'needs g++ and JSCPP (run npm install)' }, () => {
  const failures = [];
  for (const topic of cpp.topics.filter((t) => t.runs === 'yes')) {
    const source = toFullProgram(topic);
    const expected = runWithGpp(source, topic.stdin);
    const actual = runWithJscpp(source, topic.stdin);
    if (!actual.ok) failures.push(`${topic.title}: JSCPP error: ${actual.error}`);
    else if (actual.stdout.trim() !== expected.stdout.trim()) {
      failures.push(`${topic.title}: output differs\n  g++:   ${JSON.stringify(expected.stdout)}\n  JSCPP: ${JSON.stringify(actual.stdout)}`);
    }
  }
  assert.deepEqual(failures, [], 'Change those topics to "runs: maybe" or fix the example');
});

test('C++ topics marked "runs: no" really do not work in JSCPP (the tags are honest both ways)', { skip: !(HAS_GPP && HAS_JSCPP) && 'needs g++ and JSCPP' }, () => {
  const wronglyTagged = [];
  for (const topic of cpp.topics.filter((t) => t.runs === 'no')) {
    const source = toFullProgram(topic);
    const expected = runWithGpp(source, topic.stdin);
    const actual = runWithJscpp(source, topic.stdin);
    if (actual.ok && actual.stdout.trim() === expected.stdout.trim()) wronglyTagged.push(topic.title);
  }
  assert.deepEqual(wronglyTagged, [], 'These work in the browser now, so change them to "runs: yes"');
});
