// tests/versions.test.mjs
// The words in the app, README and docs about "which Python / which C++" must match
// the real engines. If you upgrade an engine, this test tells you what else to update.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { ENGINES } from '../public/js/config.js';
import { read, ROOT } from './helpers/sourceTools.mjs';
import { HAS_PYODIDE, loadSharedPyodide } from './helpers/pyodideNode.mjs';

const pkg = JSON.parse(read('package.json'));
const pyodideVersion = ENGINES.python.engine.replace('Pyodide ', '');
const pythonMinor = ENGINES.python.version.replace('Python ', '');
const jscppVersion = ENGINES.cpp.engine.replace('JSCPP ', '');

test('config says the same Pyodide version as package.json', () => {
  assert.equal(pkg.dependencies.pyodide, pyodideVersion);
});

test('the real Pyodide reports the Python version we tell students', { skip: !HAS_PYODIDE && 'Pyodide not installed' }, async () => {
  const { pyodide } = await loadSharedPyodide();
  assert.equal(pyodide.version, pyodideVersion, 'Pyodide version differs from config.js');
  const python = pyodide.runPython('import sys; ".".join(map(str, sys.version_info[:2]))');
  assert.equal(python, pythonMinor, 'Python version differs from config.js');
});

test('the shipped JSCPP file is the one third_party/README.md describes', () => {
  const readme = read('third_party', 'jscpp', 'README.md');
  const sha = createHash('sha256').update(readFileSync(`${ROOT}/third_party/jscpp/JSCPP.es5.min.js`)).digest('hex');
  assert.ok(readme.includes(sha), 'sha256 in third_party/jscpp/README.md does not match the file');
  assert.ok(readme.includes(jscppVersion), 'JSCPP version in README differs from config.js');
});

test('the words shown to students and in the README match config.js', () => {
  const html = read('public', 'index.html');
  const readme = read('README.md');
  assert.ok(html.includes(`${ENGINES.python.version}</strong> runs with ${ENGINES.python.engine}`), 'About dialog: Python line');
  assert.ok(html.includes(ENGINES.cpp.engine), 'About dialog: C++ line');
  assert.ok(readme.includes(ENGINES.python.version) && readme.includes(ENGINES.python.engine), 'README: Python versions');
  assert.ok(readme.includes(ENGINES.cpp.engine), 'README: C++ engine version');
});
