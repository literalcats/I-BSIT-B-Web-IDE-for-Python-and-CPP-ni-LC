import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cppLimitHint, findMissingLibrary } from '../public/js/runners/limitHints.js';
import { runWithJscpp, HAS_JSCPP } from './helpers/cppTools.mjs';

test('finds the missing library name in JSCPP errors', () => {
  assert.equal(findMissingLibrary('2:1 cannot find library: vector'), 'vector');
  assert.equal(findMissingLibrary('4:1 type struct Student is not defined'), '');
});

test('hint with a missing library names it and says the code is not necessarily wrong', () => {
  const hint = cppLimitHint('2:1 cannot find library: string');
  assert.match(hint, /<string> library is not available/);
  assert.match(hint, /does not mean your code is wrong/);
  assert.match(hint, /g\+\+/);
  assert.match(hint, /Tips and limits/);
});

test('generic hint is honest that it may be the student\'s mistake OR an app limit', () => {
  const hint = cppLimitHint('Parsing Failure: line 4');
  assert.match(hint, /mistake in your code, or something/);
  assert.match(hint, /std::string/);
});

test('the hint matches what the engine really reports for an unsupported feature', { skip: !HAS_JSCPP && 'JSCPP not available' }, () => {
  const result = runWithJscpp('#include <vector>\nint main() { return 0; }\n');
  assert.equal(result.ok, false);
  assert.equal(findMissingLibrary(result.error), 'vector');
});
