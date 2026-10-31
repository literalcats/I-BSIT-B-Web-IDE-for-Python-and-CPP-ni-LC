// scripts/build.mjs
// ---------------------------------------------------------------------------
// WHAT THIS FILE DOES (run it with: npm run build)
//
//  1. VENDOR step  - copies the big "engine" files (Python, editor, C++) out of
//                    node_modules/ into public/vendor/ so the website can serve
//                    them itself. This is what makes the app work offline:
//                    nothing is loaded from somebody else's server (a CDN).
//  2. MANIFEST step - writes public/precache.js (+ precache.json): a list of every file the
//                    service worker should save for offline use, plus a
//                    "version" that changes whenever any file changes. A new
//                    version makes phones/laptops fetch the update.
//
// Vercel runs this automatically on every deploy (see vercel.json).
// Use  npm run manifest  to do only step 2 (no node_modules needed).
// ---------------------------------------------------------------------------
import { copyFile, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(ROOT, 'public');
const VENDOR = path.join(PUBLIC, 'vendor');
const NODE_MODULES = path.join(ROOT, 'node_modules');
const SKIP_VENDOR = process.argv.includes('--skip-vendor');

// Files that exist only to run the build; they must never be cached as "app files".
const NEVER_PRECACHE = new Set(['sw.js', 'precache.js', 'precache.json']);

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

/** Return every file inside `dir` as a path relative to `dir` (with / slashes). */
async function listFiles(dir) {
  const found = [];
  async function walk(current) {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) await walk(full);
      else found.push(path.relative(dir, full).split(path.sep).join('/'));
    }
  }
  await walk(dir);
  return found.sort();
}

/** Copy the files of `srcDir` that pass `keep(relativePath)` into `destDir`. */
async function copyFiltered(srcDir, destDir, keep) {
  let count = 0;
  for (const rel of await listFiles(srcDir)) {
    if (!keep(rel)) continue;
    const target = path.join(destDir, rel);
    await mkdir(path.dirname(target), { recursive: true });
    await copyFile(path.join(srcDir, rel), target);
    count += 1;
  }
  return count;
}

const mb = (bytes) => (bytes / 1024 / 1024).toFixed(1) + ' MB';

async function folderSize(dir) {
  let total = 0;
  for (const rel of await listFiles(dir)) total += (await stat(path.join(dir, rel))).size;
  return total;
}

// ---------------------------------------------------------------------------
// STEP 1: the engines. Each entry says where the files come from and which
// ones are required (if a required file is missing, the build stops).
// ---------------------------------------------------------------------------
const ENGINES = [
  {
    label: 'Python engine (Pyodide)',
    from: path.join(NODE_MODULES, 'pyodide'),
    to: path.join(VENDOR, 'pyodide'),
    // Only the runtime files, not the type definitions or source maps.
    keep: (rel) =>
      /^(pyodide\.(js|mjs|asm\.js|asm\.wasm)|python_stdlib\.zip|pyodide-lock\.json)$/.test(rel),
    required: ['pyodide.js', 'pyodide.asm.js', 'pyodide.asm.wasm', 'python_stdlib.zip', 'pyodide-lock.json'],
  },
  {
    label: 'Code editor (Monaco)',
    from: path.join(NODE_MODULES, 'monaco-editor', 'min', 'vs'),
    to: path.join(VENDOR, 'monaco', 'vs'),
    // We only teach Python and C++, so leave out the other 80+ languages.
    // (If the editor ever misbehaves, set PRUNE_MONACO to false to copy everything.)
    keep: (rel) => {
      const PRUNE_MONACO = true;
      if (rel.endsWith('.map')) return false;
      if (!PRUNE_MONACO) return true;
      const parts = rel.split('/');
      if (parts[0] === 'language') return false;
      if (parts[0] === 'basic-languages' && parts.length > 2) {
        return parts[1] === 'python' || parts[1] === 'cpp';
      }
      return true;
    },
    required: ['loader.js', 'editor/editor.main.js'],
  },
  {
    // JSCPP's npm package does NOT include its browser file (its .npmignore skips dist/),
    // so we keep the official browser build in third_party/jscpp/ (see the README there).
    label: 'C++ engine (JSCPP)',
    from: path.join(ROOT, 'third_party', 'jscpp'),
    to: path.join(VENDOR, 'jscpp'),
    keep: (rel) => rel === 'JSCPP.es5.min.js',
    required: ['JSCPP.es5.min.js'],
  },
];

async function vendorEngines() {
  console.log('\n[1/2] Copying engines into public/vendor/ ...');
  let failed = false;

  for (const engine of ENGINES) {
    if (!existsSync(engine.from)) {
      if (existsSync(engine.to)) {
        console.log(`  - ${engine.label}: node_modules not found, keeping the copy already in public/vendor/`);
        continue;
      }
      console.error(`  x ${engine.label}: cannot find ${path.relative(ROOT, engine.from)}`);
      console.error('    Fix: run  npm install  first, then  npm run build  again.');
      failed = true;
      continue;
    }

    await rm(engine.to, { recursive: true, force: true });
    const count = await copyFiltered(engine.from, engine.to, engine.keep);
    const missing = engine.required.filter((rel) => !existsSync(path.join(engine.to, rel)));
    if (missing.length > 0) {
      console.error(`  x ${engine.label}: these required files were not found: ${missing.join(', ')}`);
      console.error('    The package layout may have changed. Check the package version in package.json.');
      failed = true;
      continue;
    }
    console.log(`  ok ${engine.label}: ${count} files, ${mb(await folderSize(engine.to))}`);
  }

  if (failed) {
    console.error('\nBuild stopped: some engine files are missing (see above).');
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// STEP 2: the offline manifest (public/precache.js).
// "core"    = the app itself (small). The service worker saves it on install.
// "engines" = public/vendor (big). Saved when first used, or via the
//             "Get offline files" button in the app.
// ---------------------------------------------------------------------------
async function sha(files, baseDir) {
  const hash = createHash('sha256');
  for (const rel of files) {
    hash.update(rel);
    hash.update(await readFile(path.join(baseDir, rel)));
  }
  return hash.digest('hex').slice(0, 12);
}

async function writeManifest() {
  console.log('\n[2/2] Writing public/precache.js ...');
  const all = (await listFiles(PUBLIC)).filter(
    (rel) => !NEVER_PRECACHE.has(rel) && !rel.split('/').some((part) => part.startsWith('.')),
  );
  const coreFiles = all.filter((rel) => !rel.startsWith('vendor/'));
  const engineFiles = all.filter((rel) => rel.startsWith('vendor/'));

  const engines = [];
  for (const rel of engineFiles) {
    engines.push({ url: '/' + rel, size: (await stat(path.join(PUBLIC, rel))).size });
  }

  const manifest = {
    coreVersion: await sha(coreFiles, PUBLIC),
    enginesVersion: engineFiles.length ? await sha(engineFiles, PUBLIC) : 'none',
    // '/' is the home page (index.html), so cache it under both names.
    core: ['/', ...coreFiles.map((rel) => '/' + rel)],
    engines,
  };

  // precache.js is read by the service worker (importScripts); precache.json is
  // the same data for the page. Both are generated, never edited by hand.
  const text =
    '// AUTO-GENERATED by scripts/build.mjs - do not edit by hand.\n' +
    'self.PRECACHE = ' + JSON.stringify(manifest, null, 1) + ';\n';
  await writeFile(path.join(PUBLIC, 'precache.js'), text);
  await writeFile(path.join(PUBLIC, 'precache.json'), JSON.stringify(manifest));

  const engineBytes = engines.reduce((sum, file) => sum + file.size, 0);
  console.log(`  ok ${manifest.core.length} core files, ${engines.length} engine files (${mb(engineBytes)})`);
  console.log(`  core version ${manifest.coreVersion}, engines version ${manifest.enginesVersion}`);
}

// ---------------------------------------------------------------------------
if (!SKIP_VENDOR) await vendorEngines();
await writeManifest();
console.log('\nBuild finished.\n');
