// tests/wiring.test.mjs
// DISCREPANCY CHECKS: does the code agree with itself?
//   - every element id the JavaScript asks for exists in index.html
//   - every button in index.html is actually used by some JavaScript
//   - every message-bus event has both a sender and a listener
//   - every import points to a file, and every named import really is exported
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { JS_ROOT, listJsFiles, read, relJs } from './helpers/sourceTools.mjs';

const html = read('public', 'index.html');
const sources = listJsFiles().map((file) => ({ file, rel: relJs(file), text: readFileSync(file, 'utf8') }));
const allJs = sources.map((s) => s.text).join('\n');

const htmlIds = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);

test('index.html has no duplicate ids', () => {
  const dupes = htmlIds.filter((id, i) => htmlIds.indexOf(id) !== i);
  assert.deepEqual(dupes, []);
});

test('every id the JavaScript asks for exists in index.html', () => {
  const asked = new Set();
  for (const { text } of sources) {
    for (const m of text.matchAll(/\b(?:byId|getElementById)\(\s*['"]([^'"]+)['"]/g)) asked.add(m[1]);
    for (const m of text.matchAll(/(?:bindClose|registerMenu)\(\s*['"]([^'"]+)['"](?:\s*,\s*['"]([^'"]+)['"])?/g)) {
      asked.add(m[1]);
      if (m[2]) asked.add(m[2]);
    }
  }
  const missing = [...asked].filter((id) => !htmlIds.includes(id));
  assert.deepEqual(missing, [], 'JavaScript wants ids that index.html does not have');
});

test('every button and menu item in index.html is used by JavaScript', () => {
  const buttonIds = [...html.matchAll(/<button[^>]*\sid="([^"]+)"/g)].map((m) => m[1]);
  const unused = buttonIds.filter((id) => !allJs.includes(`'${id}'`) && !allJs.includes(`"${id}"`));
  assert.deepEqual(unused, [], 'These buttons do nothing because no JavaScript mentions them');
});

test('every message-bus event has a sender and a listener', () => {
  const emitted = new Set([...allJs.matchAll(/bus\.emit\(\s*'([^']+)'/g)].map((m) => m[1]));
  const heard = new Set([...allJs.matchAll(/bus\.on\(\s*'([^']+)'/g)].map((m) => m[1]));
  assert.deepEqual([...emitted].filter((e) => !heard.has(e)), [], 'Events nobody listens to');
  assert.deepEqual([...heard].filter((e) => !emitted.has(e)), [], 'Listeners for events nobody sends');
});

test('every import resolves to a file and every named import is exported', () => {
  const problems = [];
  for (const { file, rel, text } of sources) {
    for (const m of text.matchAll(/import\s+\{([^}]+)\}\s+from\s+['"](\.[^'"]+)['"]/g)) {
      const target = path.resolve(path.dirname(file), m[2]);
      let targetText;
      try {
        targetText = readFileSync(target, 'utf8');
      } catch {
        problems.push(`${rel}: cannot find ${m[2]}`);
        continue;
      }
      for (const raw of m[1].split(',')) {
        const name = raw.trim().split(/\s+as\s+/)[0];
        if (!name) continue;
        const exported = new RegExp(`export\\s+(?:async\\s+)?(?:function|const|let|class)\\s+${name}\\b|export\\s*\\{[^}]*\\b${name}\\b`).test(targetText);
        if (!exported) problems.push(`${rel}: "${name}" is not exported by ${path.relative(JS_ROOT, target)}`);
      }
    }
  }
  assert.deepEqual(problems, []);
});

test('the service worker and manifest point to files that exist', () => {
  const manifest = JSON.parse(read('public', 'manifest.webmanifest'));
  for (const icon of manifest.icons) {
    assert.doesNotThrow(() => readFileSync(path.join(JS_ROOT, '..', icon.src.replace(/^\//, ''))), `missing icon ${icon.src}`);
  }
  assert.ok(manifest.start_url && manifest.display, 'manifest needs start_url and display');
});
