// tests/helpers/pyodideNode.mjs
// Finds Pyodide so the tests can run real Python. It looks in:
//   1. the folder named by the PYODIDE_DIR environment variable, then
//   2. node_modules/pyodide  (exists after you run "npm install").
// If neither exists the Python tests are skipped (not failed).
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

export const PYODIDE_DIR = process.env.PYODIDE_DIR || path.join(ROOT, 'node_modules', 'pyodide');
export const HAS_PYODIDE = existsSync(path.join(PYODIDE_DIR, 'pyodide.mjs'));

export const BOOTSTRAP_PATH = path.join(ROOT, 'public', 'js', 'runners', 'python_bootstrap.py');

let cached = null;

/** Load Pyodide once and share it between tests (loading takes a couple of seconds). */
export async function loadSharedPyodide() {
  if (!cached) {
    cached = (async () => {
      const { loadPyodide } = await import(pathToFileURL(path.join(PYODIDE_DIR, 'pyodide.mjs')).href);
      const pyodide = await loadPyodide({ indexURL: PYODIDE_DIR + path.sep });
      const bootstrap = await readFile(BOOTSTRAP_PATH, 'utf8');
      return { pyodide, bootstrap };
    })();
  }
  return cached;
}
