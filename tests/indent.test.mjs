import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newLineWithIndent, outdentLine, leadingWhitespace } from '../public/js/editor/indent.js';

test('Enter keeps the current indentation', () => {
  assert.equal(newLineWithIndent('x = 1', 'python'), '\n');
  assert.equal(newLineWithIndent('if a:\n    x = 1', 'python'), '\n    ');
  assert.equal(newLineWithIndent('\t\tfoo();', 'cpp'), '\n\t\t');
});

test('Python: a trailing colon indents one level deeper', () => {
  assert.equal(newLineWithIndent('for i in range(3):', 'python'), '\n    ');
  assert.equal(newLineWithIndent('    if ok:  ', 'python'), '\n        ');
  assert.equal(newLineWithIndent('    if ok:  # comment', 'python'), '\n        ');
});

test('Python: a colon inside a string or after code is not an opener', () => {
  assert.equal(newLineWithIndent('d = {"a": 1}', 'python'), '\n');
  assert.equal(newLineWithIndent('x = 1  # note:', 'python'), '\n');
});

test('C++: an opening brace indents one level deeper', () => {
  assert.equal(newLineWithIndent('int main() {', 'cpp'), '\n    ');
  assert.equal(newLineWithIndent('    if (x) {  ', 'cpp'), '\n        ');
  assert.equal(newLineWithIndent('    x++; // {', 'cpp'), '\n    ');
});

test('only the line the cursor is on matters', () => {
  assert.equal(newLineWithIndent('def f():\n    pass\nprint(1)', 'python'), '\n');
});

test('Shift+Tab removes one level', () => {
  assert.equal(outdentLine('        x'), '    x');
  assert.equal(outdentLine('  x'), 'x');
  assert.equal(outdentLine('\tx'), 'x');
  assert.equal(outdentLine('x'), 'x');
  assert.equal(leadingWhitespace('  \tx'), '  \t');
});
