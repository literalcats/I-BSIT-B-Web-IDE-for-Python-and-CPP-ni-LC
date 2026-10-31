// tests/docsMatchData.test.mjs
// DISCREPANCY CHECKS between what the docs SAY and what the app HAS.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { APP } from '../public/js/config.js';
import { parseCheatSheet } from '../public/js/content/cheatsheetParser.js';
import { read } from './helpers/sourceTools.mjs';

const python = parseCheatSheet(read('public', 'data', 'cheatsheets', 'python.md'), 'python').topics;
const cpp = parseCheatSheet(read('public', 'data', 'cheatsheets', 'cpp.md'), 'cpp').topics;
const readme = read('README.md');
const index = JSON.parse(read('public', 'data', 'presets', 'index.json'));
const seconds = APP.runTimeoutMs / 1000;

test('README topic counts match the cheat sheets', () => {
  assert.ok(readme.includes(`${python.length} Python and ${cpp.length} C++ topics`), `README should say "${python.length} Python and ${cpp.length} C++ topics"`);
});

test('README preset count matches the presets', () => {
  assert.ok(readme.includes(`${index.presets.length} commented programs per language`), `README should say ${index.presets.length} commented programs per language`);
});

test('the time limit in README, the About dialog and the flowchart matches config.js', () => {
  assert.ok(readme.includes(`${seconds} seconds`), 'README time limit');
  assert.ok(read('public', 'index.html').includes(`after ${seconds} seconds`), 'About dialog time limit');
  assert.ok(read('docs', 'how-code-lab-works.mmd').includes(`${seconds} seconds`), 'flowchart time limit');
});

test('Java is not offered anywhere (it was removed on purpose)', () => {
  const html = read('public', 'index.html');
  assert.ok(!/\bjava\b(?!script)/i.test(html), 'index.html mentions Java');
  assert.ok(!/\.java\b/.test(read('public', 'js', 'config.js')), 'config.js offers .java');
});

test('README shows the flowchart, and the image file exists', () => {
  assert.match(readme, /docs\/how-code-lab-works\.png/);
  assert.ok(read('docs', 'how-code-lab-works.mmd').length > 100);
});
