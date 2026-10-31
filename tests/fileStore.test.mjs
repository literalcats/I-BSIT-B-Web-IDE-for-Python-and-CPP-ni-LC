// tests/fileStore.test.mjs  -  run with:  npm test
// Checks the file cabinet (create / rename / backup...) using the in-memory database.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFileStore, checkFileName, makeUniqueName } from '../public/js/storage/fileStore.js';
import { createMemoryAdapter } from '../public/js/storage/memory.js';
import { APP } from '../public/js/config.js';

function freshStore() {
  let id = 0;
  let clock = 1000;
  return createFileStore(createMemoryAdapter(), { makeId: () => `id${++id}`, now: () => (clock += 1) });
}

test('file names: accepts good names and finds the language', () => {
  assert.deepEqual(checkFileName('hello.py'), { ok: true, name: 'hello.py', language: 'python' });
  assert.deepEqual(checkFileName('  Main Program.CPP '), { ok: true, name: 'Main Program.cpp', language: 'cpp' });
  assert.equal(checkFileName('grades_v2 (final).py').ok, true);
});

test('file names: rejects bad names with a helpful code', () => {
  assert.equal(checkFileName('').code, 'empty-name');
  assert.equal(checkFileName('   ').code, 'empty-name');
  assert.equal(checkFileName('.py').code, 'empty-name');
  assert.equal(checkFileName('notes.txt').code, 'bad-extension');
  assert.equal(checkFileName('hello').code, 'bad-extension');
  assert.equal(checkFileName('a/b.py').code, 'bad-characters');
  assert.equal(checkFileName('..\\x.py').code, 'bad-characters');
  assert.equal(checkFileName('<script>.py').code, 'bad-characters');
  assert.equal(checkFileName('hello .py').code, 'bad-characters');
  assert.equal(checkFileName('a'.repeat(APP.maxNameChars) + '.py').code, 'name-too-long');
});

test('unique names get (2), (3)... and ignore upper/lowercase', () => {
  assert.equal(makeUniqueName('a.py', []), 'a.py');
  assert.equal(makeUniqueName('a.py', ['A.PY']), 'a (2).py');
  assert.equal(makeUniqueName('a.py', ['a.py', 'a (2).py']), 'a (3).py');
});

test('create, list (sorted), update, rename, remove', async () => {
  const store = freshStore();
  const b = await store.create({ name: 'b.py', content: 'print(2)' });
  const a = await store.create({ name: 'a.cpp', content: 'int main(){}' });
  assert.deepEqual((await store.list()).map((f) => f.name), ['a.cpp', 'b.py']);

  await store.update(b.id, { content: 'print(3)', stdin: '5\n' });
  const reloaded = (await store.list()).find((f) => f.id === b.id);
  assert.equal(reloaded.content, 'print(3)');
  assert.equal(reloaded.stdin, '5\n');
  assert.ok(reloaded.updatedAt > reloaded.createdAt);

  await store.rename(b.id, 'c.py');
  assert.deepEqual((await store.list()).map((f) => f.name), ['a.cpp', 'c.py']);

  await store.remove(a.id);
  assert.deepEqual((await store.list()).map((f) => f.name), ['c.py']);
});

test('refuses duplicates, language changes and missing files', async () => {
  const store = freshStore();
  const a = await store.create({ name: 'a.py' });
  await store.create({ name: 'b.py' });
  await assert.rejects(() => store.create({ name: 'A.py' }), { code: 'name-taken' });
  await assert.rejects(() => store.rename(a.id, 'B.py'), { code: 'name-taken' });
  await assert.rejects(() => store.rename(a.id, 'a.cpp'), { code: 'language-change' });
  await assert.rejects(() => store.update('nope', { content: 'x' }), { code: 'not-found' });
  await store.rename(a.id, 'a.py'); // renaming to itself is fine
});

test('rejects oversized and non-text content', async () => {
  const store = freshStore();
  const file = await store.create({ name: 'a.py' });
  await assert.rejects(() => store.update(file.id, { content: 'x'.repeat(APP.maxFileChars + 1) }), { code: 'too-large' });
  await assert.rejects(() => store.update(file.id, { content: 42 }), { code: 'bad-data' });
});

test('backup round-trip keeps content and never overwrites existing files', async () => {
  const source = freshStore();
  await source.create({ name: 'hello.py', content: 'print("hi")', stdin: '1\n' });
  await source.create({ name: 'big.cpp', content: '// ñ ✓ 漢字' });
  const backup = JSON.parse(JSON.stringify(await source.exportAll()));

  const target = freshStore();
  await target.create({ name: 'hello.py', content: 'MY OWN WORK' });
  const result = await target.importAll(backup);
  assert.deepEqual(result, { imported: 2, skipped: 0 });

  const files = await target.list();
  assert.deepEqual(files.map((f) => f.name), ['big.cpp', 'hello (2).py', 'hello.py']);
  assert.equal(files.find((f) => f.name === 'hello.py').content, 'MY OWN WORK');
  assert.equal(files.find((f) => f.name === 'hello (2).py').content, 'print("hi")');
  assert.equal(files.find((f) => f.name === 'big.cpp').content, '// ñ ✓ 漢字');
});

test('restore rejects junk and skips damaged entries without stopping', async () => {
  const store = freshStore();
  await assert.rejects(() => store.importAll({ hello: 1 }), { code: 'bad-backup' });
  await assert.rejects(() => store.importAll(null), { code: 'bad-backup' });
  const result = await store.importAll({
    format: 'bsit-code-lab-backup',
    files: [{ name: 'evil/../x.py', content: 'x' }, null, { name: 'ok.py', content: 'print(1)' }],
  });
  assert.deepEqual(result, { imported: 1, skipped: 2 });
});

test('settings are remembered', async () => {
  const store = freshStore();
  assert.equal(await store.getSetting('lastFile', 'none'), 'none');
  await store.setSetting('lastFile', 'id9');
  assert.equal(await store.getSetting('lastFile'), 'id9');
});

test('two updates to the same file at the same time do not erase each other', async () => {
  const base = createMemoryAdapter();
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const slow = { ...base, async get(s, k) { const r = await base.get(s, k); await sleep(5); return r; } };
  const store = createFileStore(slow);
  const file = await store.create({ name: 'x.py', content: 'old', stdin: 'old' });

  await Promise.all([store.update(file.id, { content: 'new code' }), store.update(file.id, { stdin: 'new input' })]);

  const saved = (await store.list())[0];
  assert.equal(saved.content, 'new code');
  assert.equal(saved.stdin, 'new input');
});

test('a failed write does not block the writes after it', async () => {
  const store = createFileStore(createMemoryAdapter());
  const file = await store.create({ name: 'x.py', content: 'a' });
  await assert.rejects(store.update(file.id, { content: 42 })); // not text -> refused
  await store.update(file.id, { content: 'b' });
  assert.equal((await store.list())[0].content, 'b');
});
