import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBus } from '../public/js/core/bus.js';

test('emit reaches every listener, in order, with the arguments', () => {
  const bus = createBus();
  const seen = [];
  bus.on('x', (a, b) => seen.push(['first', a, b]));
  bus.on('x', (a) => seen.push(['second', a]));
  bus.emit('x', 1, 2);
  assert.deepEqual(seen, [['first', 1, 2], ['second', 1]]);
});

test('emitting with nobody listening is fine', () => {
  assert.doesNotThrow(() => createBus().emit('nobody'));
});

test('a crashing listener does not stop the others', () => {
  const bus = createBus();
  const originalError = console.error;
  console.error = () => {};
  try {
    let reached = false;
    bus.on('x', () => { throw new Error('boom'); });
    bus.on('x', () => { reached = true; });
    bus.emit('x');
    assert.equal(reached, true);
  } finally {
    console.error = originalError;
  }
});

test('on() returns a way to stop listening', () => {
  const bus = createBus();
  let count = 0;
  const stop = bus.on('x', () => count++);
  bus.emit('x');
  stop();
  bus.emit('x');
  assert.equal(count, 1);
});
