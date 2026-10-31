// tests/architecture.test.mjs
// GUARD TEST: keeps the code tidy as the app grows. If one of these fails, it is
// not a bug in the app; it is a signal that the structure is getting messy.
//
// The rules:
//   1. No circular imports (A imports B imports A).
//   2. Layers only point DOWN:  config/core -> storage/content/runners/editor/pwa -> ui -> app -> main
//   3. No function is huge or tangled (so nobody has to hold 200 lines in their head).
//   4. main.js stays a short list of connections (no feature logic).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { importGraph, measureFunctions, read } from './helpers/sourceTools.mjs';

const LAYERS = { 'config.js': 0, core: 0, storage: 1, content: 1, runners: 1, editor: 1, pwa: 1, ui: 2, app: 3, 'main.js': 4 };
const layerOf = (file) => LAYERS[file.split('/')[0]] ?? LAYERS[file] ?? 99;

test('no circular imports', () => {
  const graph = importGraph();
  const cycles = new Set();
  const state = new Map();
  const visit = (node, stack) => {
    state.set(node, 1);
    stack.push(node);
    for (const dep of graph.get(node) || []) {
      if (!graph.has(dep)) continue;
      if (state.get(dep) === 1) cycles.add([...stack.slice(stack.indexOf(dep)), dep].join(' -> '));
      else if (!state.get(dep)) visit(dep, stack);
    }
    stack.pop();
    state.set(node, 2);
  };
  for (const node of graph.keys()) if (!state.get(node)) visit(node, []);
  assert.deepEqual([...cycles], [], 'Circular imports found');
});

test('layers only import downwards (a lower layer never imports a higher one)', () => {
  const bad = [];
  for (const [file, deps] of importGraph()) {
    assert.notEqual(layerOf(file), 99, `${file} is in a folder that is not in the layer list; add it to LAYERS`);
    for (const dep of deps) if (layerOf(dep) > layerOf(file)) bad.push(`${file} -> ${dep}`);
  }
  assert.deepEqual(bad, [], 'A lower layer imports a higher one');
});

test('no giant or tangled functions', () => {
  // "Factory" functions (createX / setupX) are a box holding many small inner
  // functions, so they may be longer. Every other function must stay short.
  // These limits are a RATCHET: they match today's code, so the code can get
  // better but cannot quietly get worse. Lower them when you tidy something up.
  const LIMITS = { plain: { lines: 90, branches: 20 }, factory: { lines: 175, branches: 26 } };
  const tooBig = measureFunctions()
    .filter((f) => {
      const limit = /^(create|setup|install|init)/.test(f.name) ? LIMITS.factory : LIMITS.plain;
      return f.length > limit.lines || f.branches > limit.branches;
    })
    .map((f) => `${f.file} :: ${f.name} (${f.length} lines, ~${f.branches} branches)`);
  assert.deepEqual(tooBig, [], 'Split these functions into smaller ones');
});

test('main.js stays a short list of connections', () => {
  const codeLines = read('public', 'js', 'main.js').split('\n').filter((l) => l.trim() && !l.trim().startsWith('//')).length;
  assert.ok(codeLines <= 80, `main.js has ${codeLines} code lines; move feature logic into app/ modules`);
});
