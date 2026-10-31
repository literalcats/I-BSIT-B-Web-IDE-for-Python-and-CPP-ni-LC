// tests/presets.test.mjs
// Makes sure every preset exists and RUNS:
//   Python  -> real Python (Pyodide), exit code 0, no error text
//   C++     -> g++ with no warnings, exit code 0
//   C++     -> also JSCPP (the browser engine) when installed, same output as g++
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildPresetGroups } from '../public/js/content/presets.js';
import { createPythonSession } from '../public/js/runners/pythonSession.js';
import { HAS_PYODIDE, loadSharedPyodide } from './helpers/pyodideNode.mjs';
import { HAS_GPP, HAS_JSCPP, runWithGpp, runWithJscpp } from './helpers/cppTools.mjs';

const PUBLIC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');
const index = JSON.parse(readFileSync(path.join(PUBLIC, 'data', 'presets', 'index.json'), 'utf8'));
const read = (rel) => readFileSync(path.join(PUBLIC, rel), 'utf8');

const all = (languageId) => buildPresetGroups(index, languageId).flatMap((g) => g.items);

test('index.json: every preset has both language files and a group that is listed', () => {
  const ids = index.presets.map((p) => p.id);
  assert.equal(new Set(ids).size, ids.length, 'duplicate preset ids');
  for (const languageId of ['python', 'cpp']) {
    const items = all(languageId);
    assert.equal(items.length, index.presets.length, `${languageId}: some presets were dropped`);
    for (const item of items) assert.ok(existsSync(path.join(PUBLIC, item.path)), `missing file ${item.path}`);
  }
  for (const preset of index.presets) assert.ok(index.groups.includes(preset.group), `unknown group ${preset.group}`);
});

test('every preset has comments to learn from', () => {
  for (const languageId of ['python', 'cpp']) {
    const marker = languageId === 'python' ? '#' : '//';
    for (const item of all(languageId)) {
      const code = read(item.path);
      const commentLines = code.split('\n').filter((line) => line.includes(marker)).length;
      assert.ok(commentLines >= 3, `${item.path} has only ${commentLines} comment lines`);
      assert.ok(code.split('\n')[0].includes('PRESET:'), `${item.path} should start with a "PRESET:" title comment`);
    }
  }
});

test('buildPresetGroups skips damaged entries instead of breaking', () => {
  const groups = buildPresetGroups({ groups: ['A'], presets: [null, { id: 1 }, { id: 'x', title: 'X', group: 'A' }, { id: 'y', title: 'Y' }] }, 'python');
  assert.deepEqual(groups.map((g) => [g.group, g.items.map((i) => i.id)]), [['A', ['x']], ['Other', ['y']]]);
  assert.deepEqual(buildPresetGroups(null, 'cpp'), []);
});

test('Python presets all run without errors', { skip: !HAS_PYODIDE && 'Pyodide not installed', timeout: 180000 }, async () => {
  const { pyodide, bootstrap } = await loadSharedPyodide();
  const session = createPythonSession(pyodide, bootstrap);
  const failures = [];
  for (const item of all('python')) {
    let err = '';
    let out = '';
    const { exitCode } = session.run({
      code: read(item.path),
      fileName: item.fileName,
      stdin: item.stdin,
      write: (kind, text) => (kind === 'err' ? (err += text) : (out += text)),
    });
    if (exitCode !== 0) failures.push(`${item.fileName}: ${err.trim().split('\n').pop()}`);
    else if (out.trim() === '') failures.push(`${item.fileName}: printed nothing`);
  }
  assert.deepEqual(failures, []);
});

test('C++ presets compile cleanly with g++ and run', { skip: !HAS_GPP && 'g++ not installed', timeout: 300000 }, () => {
  const failures = [];
  for (const item of all('cpp')) {
    const result = runWithGpp(read(item.path), item.stdin);
    if (!result.ok) failures.push(`${item.fileName}: ${result.error}`);
    else if (result.warnings) failures.push(`${item.fileName}: warnings: ${result.warnings.split('\n')[0]}`);
    else if (result.stdout.trim() === '') failures.push(`${item.fileName}: printed nothing`);
  }
  assert.deepEqual(failures, []);
});

test('C++ presets give the same output in JSCPP (the browser engine) as in g++', { skip: !(HAS_GPP && HAS_JSCPP) && 'needs g++ and JSCPP (run npm install)' }, () => {
  const failures = [];
  for (const item of all('cpp')) {
    const source = read(item.path);
    const expected = runWithGpp(source, item.stdin);
    const actual = runWithJscpp(source, item.stdin);
    if (!actual.ok) failures.push(`${item.fileName}: JSCPP error: ${actual.error}`);
    else if (actual.stdout.trim() !== expected.stdout.trim()) {
      failures.push(`${item.fileName}: output differs\n  g++:   ${JSON.stringify(expected.stdout)}\n  JSCPP: ${JSON.stringify(actual.stdout)}`);
    }
  }
  assert.deepEqual(failures, []);
});
