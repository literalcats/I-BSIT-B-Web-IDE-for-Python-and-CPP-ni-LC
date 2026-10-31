// tests/helpers/sourceTools.mjs
// Small tools that READ the app's own source files, used by the "guard" tests.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const JS_ROOT = path.join(ROOT, 'public', 'js');
export const read = (...parts) => readFileSync(path.join(ROOT, ...parts), 'utf8');

export function listJsFiles(dir = JS_ROOT) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) out.push(...listJsFiles(full));
    else if (name.endsWith('.js')) out.push(full);
  }
  return out;
}

export const relJs = (file) => path.relative(JS_ROOT, file).split(path.sep).join('/');

/** { 'app/fileController.js': ['config.js', 'core/dom.js', ...] } (only app-internal imports). */
export function importGraph() {
  const graph = new Map();
  for (const file of listJsFiles()) {
    const source = readFileSync(file, 'utf8');
    const deps = [...source.matchAll(/(?:import|from)\s*(?:[^'"]*?from\s*)?\(?\s*['"](\.[^'"]+)['"]/g)]
      .map((m) => relJs(path.resolve(path.dirname(file), m[1])));
    graph.set(relJs(file), [...new Set(deps)]);
  }
  return graph;
}

/** Rough size and branching of every function (good enough to catch a growing "god function"). */
export function measureFunctions() {
  const results = [];
  for (const file of listJsFiles()) {
    const lines = readFileSync(file, 'utf8').split('\n');
    for (let i = 0; i < lines.length; i++) {
      const m = /^(\s*)(?:export\s+)?(?:async\s+)?function\s+(\w+)|^(\s*)(?:async\s+)?(\w+)\(.*\)\s*\{\s*$|^(\s*)(?:const|let)\s+(\w+)\s*=\s*(?:async\s*)?\(.*\)\s*=>\s*\{\s*$/.exec(lines[i]);
      if (!m) continue;
      const name = m[2] || m[4] || m[6];
      if (['if', 'for', 'while', 'switch', 'catch'].includes(name)) continue;
      let depth = 0, started = false, end = i;
      for (let j = i; j < lines.length; j++) {
        for (const ch of lines[j].replace(/'[^']*'|"[^"]*"|`[^`]*`|\/\/.*$/g, '')) {
          if (ch === '{') { depth++; started = true; } else if (ch === '}') depth--;
        }
        if (started && depth <= 0) { end = j; break; }
      }
      const body = lines.slice(i, end + 1).join('\n').replace(/\/\/.*$/gm, '');
      const branches = (body.match(/\b(if|for|while|case|catch)\b|&&|\|\||\?[^.?]/g) || []).length + 1;
      results.push({ file: relJs(file), name, length: end - i + 1, branches });
    }
  }
  return results;
}
