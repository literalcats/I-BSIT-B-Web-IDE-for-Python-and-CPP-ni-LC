// tests/fileController.test.mjs
// Tests the REAL file controller with a fake screen and a fake (slow) database.
// These two tests reproduce real data-loss bugs found in a review:
//   A) code and Input saved at the same moment -> one overwrote the other
//   B) a keystroke arriving while switching files -> file A was saved with file B's text
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBus } from '../public/js/core/bus.js';
import { createFileStore } from '../public/js/storage/fileStore.js';
import { createMemoryAdapter } from '../public/js/storage/memory.js';

// The controller looks up a few elements by id; give it simple stand-ins.
const elements = {};
globalThis.document = { getElementById: (id) => (elements[id] ??= { textContent: '' }) };
const { createFileController } = await import('../public/js/app/fileController.js');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** A database that answers reads slowly, like a real one, so operations can overlap. */
function slowAdapter(delayMs = 5) {
  const base = createMemoryAdapter();
  return {
    ...base,
    async get(store, key) {
      const record = await base.get(store, key);
      await sleep(delayMs);
      return record;
    },
  };
}

function setup() {
  const store = createFileStore(slowAdapter());
  const editor = {
    text: '',
    openDocument(id, text) { this.text = text; },
    closeDocument() {},
    getValue() { return this.text; },
    insertAtCursor() {},
  };
  const stdinBox = { text: '' };
  const consolePanel = {
    getStdin: () => stdinBox.text,
    setStdin: (t) => { stdinBox.text = t; },
    setLanguageHint() {},
  };
  const fileList = { render() {} };
  const controller = createFileController({
    store, persistent: true, editor, fileList, consolePanel, bus: createBus(), notify: () => {},
  });
  return { store, editor, stdinBox, controller };
}

const contentOf = async (store, name) => (await store.list()).find((f) => f.name === name);

test('A) code and Input edited together are BOTH saved (no lost update)', async () => {
  const { store, editor, stdinBox, controller } = setup();
  await controller.init(); // creates hello.py and opens it

  editor.text = 'print("new code")';
  controller.onEditorChange();
  stdinBox.text = 'new input';
  controller.onStdinChange();
  await controller.flush(); // what Run, switching files and closing the tab all do

  const saved = await contentOf(store, 'hello.py');
  assert.equal(saved.content, 'print("new code")');
  assert.equal(saved.stdin, 'new input');
});

test('B) a keystroke while switching files is saved into the file it was typed in', async () => {
  const { store, editor, controller } = setup();
  await controller.init();
  const a = await controller.create({ name: 'a.py', language: 'python', content: 'AAA original' });
  const b = await controller.create({ name: 'b.py', language: 'python', content: 'BBB original' });
  await controller.open(a.id);

  editor.text = 'AAA edited once';
  controller.onEditorChange();

  const switching = controller.open(b.id); // the student clicks file B ...
  editor.text = 'AAA edited AGAIN';        // ... and one more keystroke lands in file A
  controller.onEditorChange();
  await switching;
  await controller.flush();

  assert.equal((await contentOf(store, 'a.py')).content, 'AAA edited AGAIN', 'file A keeps its own text');
  assert.equal((await contentOf(store, 'b.py')).content, 'BBB original', 'file B is untouched');
  assert.equal(editor.text, 'BBB original', 'the screen shows file B');
});
