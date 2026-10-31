// tests/helpers/cppTools.mjs
// Helpers that run C++ for real, so we can check every example in the app.
//   * g++ (if installed) is the "truth": real C++ must compile and run.
//   * JSCPP (if installed by npm install) is what runs in the browser; its output
//     is compared with g++'s.
// Anything that is not installed is skipped, not failed.
//
// JSCPP is loaded from third_party/jscpp/JSCPP.es5.min.js, the SAME file the website
// ships, through the SAME loader the worker uses (jscppLoader.js). So these tests
// check what students will really run.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { loadJscppInto } from '../../public/js/runners/jscppLoader.js';

const gpp = spawnSync('g++', ['--version'], { encoding: 'utf8' });
export const HAS_GPP = gpp.status === 0;

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const JSCPP_FILE = path.join(ROOT, 'third_party', 'jscpp', 'JSCPP.es5.min.js');
export const HAS_JSCPP = existsSync(JSCPP_FILE);

/** Load a fresh copy of the engine (a fresh one per program, like a fresh worker run). */
export function loadJscpp() {
  const sandbox = { console, setTimeout, clearTimeout, setInterval, clearInterval, postMessage() {} };
  sandbox.self = sandbox;
  sandbox.global = sandbox;
  vm.createContext(sandbox);
  const code = readFileSync(JSCPP_FILE, 'utf8');
  return loadJscppInto(sandbox, () => vm.runInContext(code, sandbox));
}

/** Compile `source` with g++ and run it. Returns { ok, stdout, error }. */
export function runWithGpp(source, stdin = '') {
  const dir = mkdtempSync(path.join(tmpdir(), 'cpp-'));
  try {
    const src = path.join(dir, 'main.cpp');
    const exe = path.join(dir, 'main');
    writeFileSync(src, source);
    const compile = spawnSync('g++', ['-std=c++17', '-Wall', '-Wextra', '-o', exe, src], { encoding: 'utf8' });
    if (compile.status !== 0) return { ok: false, stdout: '', error: 'compile: ' + compile.stderr };
    // cwd = the temp folder, so a program that writes a file cannot litter the project.
    const run = spawnSync(exe, [], { input: stdin, encoding: 'utf8', timeout: 10000, cwd: dir });
    const warnings = compile.stderr.trim();
    return { ok: run.status === 0, stdout: run.stdout, error: run.status === 0 ? '' : `exit ${run.status}`, warnings };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** Run `source` with JSCPP (the in-browser engine). */
export function runWithJscpp(source, stdin = '') {
  let stdout = '';
  try {
    const exitCode = loadJscpp().run(source, stdin, {
      stdio: { write: (text) => (stdout += text) },
      unsigned_overflow: 'warn',
    });
    return { ok: !exitCode, stdout, error: exitCode ? `exit ${exitCode}` : '' };
  } catch (error) {
    return { ok: false, stdout, error: String(error && error.message ? error.message : error) };
  }
}
