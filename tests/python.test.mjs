// tests/python.test.mjs  -  runs REAL Python (Pyodide) through our session code.
// Skipped automatically when Pyodide is not installed (see helpers/pyodideNode.mjs).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HAS_PYODIDE, loadSharedPyodide } from './helpers/pyodideNode.mjs';
import { createPythonSession } from '../public/js/runners/pythonSession.js';

const options = { skip: !HAS_PYODIDE && 'Pyodide not installed (run npm install)', timeout: 120000 };

/** Run `code` and return everything it printed, in order, as one string with markers for errors. */
async function runCode(code, stdin = '') {
  const { pyodide, bootstrap } = await loadSharedPyodide();
  const session = createPythonSession(pyodide, bootstrap);
  let out = '';
  let err = '';
  let all = '';
  const { exitCode } = session.run({
    code,
    fileName: 'test.py',
    stdin,
    write: (kind, text) => {
      if (kind === 'err') err += text;
      else out += text;
      all += text;
    },
  });
  return { exitCode, out, err, all };
}

test('print works and finishes with exit code 0', options, async () => {
  const result = await runCode('print("Hello, BSIT!")');
  assert.equal(result.exitCode, 0);
  assert.equal(result.out, 'Hello, BSIT!\n');
});

test('input() reads the typed lines and echoes them', options, async () => {
  const result = await runCode('name = input("Name? ")\nage = int(input("Age? "))\nprint(name, age + 1)', 'Ana\n17\n');
  assert.equal(result.exitCode, 0);
  assert.equal(result.out, 'Name? Ana\nAge? 17\nAna 18\n');
});

test('running out of input gives EOFError plus our hint', options, async () => {
  const result = await runCode('input()', '');
  assert.equal(result.exitCode, 1);
  assert.match(result.err, /EOFError/);
  assert.match(result.err, /Input tab/);
});

test('errors show the student file name and hide Pyodide internals', options, async () => {
  const result = await runCode('x = 1\nprint(1 / 0)\n');
  assert.equal(result.exitCode, 1);
  assert.match(result.err, /File "test\.py", line 2/);
  assert.match(result.err, /ZeroDivisionError: division by zero/);
  assert.doesNotMatch(result.err, /_pyodide|python3\d+\.zip|eval_code/);
});

test('syntax errors are reported clearly', options, async () => {
  const result = await runCode('print("a"\nprint("b")\n');
  assert.equal(result.exitCode, 1);
  assert.match(result.err, /SyntaxError/);
  assert.match(result.err, /test\.py/);
});

test('text printed without a newline still appears (prompts, end="")', options, async () => {
  const result = await runCode('print("a", end="")\nprint("b", end="")');
  assert.equal(result.out, 'ab');
});

test('unicode text survives (accents, kanji, emoji)', options, async () => {
  const result = await runCode('print("café 漢字 🐍")');
  assert.equal(result.out, 'café 漢字 🐍\n');
});

test('sys.exit() finishes cleanly; non-zero means failed', options, async () => {
  assert.equal((await runCode('import sys\nsys.exit(0)')).exitCode, 0);
  assert.equal((await runCode('import sys\nsys.exit(2)')).exitCode, 1);
});

test('each run starts clean: variables never leak between runs', options, async () => {
  await runCode('leftover = 42');
  const result = await runCode('print("leftover" in globals())');
  assert.equal(result.out, 'False\n');
});

test('the standard library works (math, random, datetime)', options, async () => {
  const result = await runCode('import math, random, datetime\nprint(math.sqrt(16))\nrandom.seed(1)\nprint(type(datetime.date.today()).__name__)');
  assert.equal(result.exitCode, 0);
  assert.equal(result.out, '4.0\ndate\n');
});
