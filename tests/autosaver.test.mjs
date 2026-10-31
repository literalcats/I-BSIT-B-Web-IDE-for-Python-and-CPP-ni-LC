// The autosaver is the part that must never put text into the wrong file.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAutosaver } from '../public/js/app/autosaver.js';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

test('saves the file that was edited, after the pause', async () => {
  const saved = [];
  const saver = createAutosaver({ delayMs: 20, save: async (id) => saved.push(id) });
  saver.markDirty('a');
  assert.equal(saver.isDirty, true);
  await wait(60);
  assert.deepEqual(saved, ['a']);
  assert.equal(saver.isDirty, false);
});

test('many quick edits cause ONE save', async () => {
  const saved = [];
  const saver = createAutosaver({ delayMs: 20, save: async (id) => saved.push(id) });
  for (let i = 0; i < 5; i++) saver.markDirty('a');
  await wait(60);
  assert.deepEqual(saved, ['a']);
});

test('flush saves right now and the timer does not save again', async () => {
  const saved = [];
  const saver = createAutosaver({ delayMs: 20, save: async (id) => saved.push(id) });
  saver.markDirty('a');
  await saver.flush();
  await wait(60);
  assert.deepEqual(saved, ['a']);
});

test('flush with nothing waiting does nothing', async () => {
  const saved = [];
  const saver = createAutosaver({ delayMs: 20, save: async (id) => saved.push(id) });
  await saver.flush();
  assert.deepEqual(saved, []);
});

test('RACE: edit file A, switch to file B quickly -> A is saved as A, B as B', async () => {
  const saved = [];
  const saver = createAutosaver({ delayMs: 1000, save: async (id) => saved.push(id) });
  saver.markDirty('A');
  await saver.flush(); // what open() does before switching files
  saver.markDirty('B');
  await saver.flush();
  assert.deepEqual(saved, ['A', 'B']);
});

test('an edit made DURING a save is not lost', async () => {
  const saved = [];
  let saver;
  saver = createAutosaver({
    delayMs: 20,
    save: async (id) => {
      saved.push(id);
      if (saved.length === 1) saver.markDirty('a'); // the student typed while saving
      await wait(5);
    },
  });
  saver.markDirty('a');
  await saver.flush();
  assert.equal(saver.isDirty, true);
  await wait(60);
  assert.deepEqual(saved, ['a', 'a']);
});

test('discard forgets waiting changes (used when a file is deleted)', async () => {
  const saved = [];
  const saver = createAutosaver({ delayMs: 20, save: async (id) => saved.push(id) });
  saver.markDirty('a');
  saver.discard();
  await wait(60);
  assert.deepEqual(saved, []);
});

test('SNAPSHOT: saves the text from the moment of the edit, not whatever is on screen later', async () => {
  const saved = [];
  const saver = createAutosaver({ delayMs: 20, save: async (id, text) => saved.push([id, text]) });
  saver.markDirty('A', 'text typed in A');
  // (the screen now shows file B, but the snapshot already belongs to A)
  await saver.flush();
  assert.deepEqual(saved, [['A', 'text typed in A']]);
});

test('the newest snapshot wins when edits come quickly', async () => {
  const saved = [];
  const saver = createAutosaver({ delayMs: 20, save: async (id, text) => saved.push([id, text]) });
  saver.markDirty('A', 'one');
  saver.markDirty('A', 'two');
  await saver.flush();
  assert.deepEqual(saved, [['A', 'two']]);
});
