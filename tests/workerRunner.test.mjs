// tests/workerRunner.test.mjs
// Checks the "page side" of running code (time limit, Stop, output limit,
// engine errors) using a FAKE worker, so no real engine is needed.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWorkerRunner } from '../public/js/runners/workerRunner.js';
import { describeResult } from '../public/js/runners/runnerManager.js';
import { createOutputBuffer } from '../public/js/runners/outputBuffer.js';

const LIMITS = { runTimeoutMs: 60, engineLoadTimeoutMs: 80, maxOutputChars: 50 };

/** A pretend worker. `script(worker, message)` decides how it reacts to messages. */
function makeRunner(script) {
  const log = { states: [], output: [], statuses: [], terminated: 0, spawned: 0 };
  const runner = createWorkerRunner({
    workerUrl: 'fake.js',
    engineLabel: 'Python',
    limits: LIMITS,
    onEngineState: (s) => log.states.push(s),
    createWorker: () => {
      log.spawned += 1;
      const worker = {
        terminated: false,
        postMessage(message) {
          setTimeout(() => !worker.terminated && script(worker, message), 0);
        },
        terminate() {
          worker.terminated = true;
          log.terminated += 1;
        },
        emit(data) {
          if (!worker.terminated) worker.onmessage({ data });
        },
      };
      return worker;
    },
  });
  const run = (request = { code: 'x' }) =>
    runner.run(request, {
      onOutput: (kind, text) => log.output.push([kind, text]),
      onStatus: (status) => log.statuses.push(status),
    });
  return { runner, run, log };
}

test('normal run: output is forwarded, result is ok, worker is kept for reuse', async () => {
  const { run, log } = makeRunner((w, m) => {
    w.emit({ type: 'started' });
    w.emit({ type: 'out', kind: 'out', text: 'hi\n' });
    w.emit({ type: 'done', exitCode: 0 });
  });
  assert.deepEqual(await run(), { status: 'ok', exitCode: 0 });
  assert.deepEqual(log.output, [['out', 'hi\n']]);
  assert.equal(log.terminated, 0);
  await run();
  assert.equal(log.spawned, 1); // the same worker was reused
});

test('a crashing program (exit code 1) reports status "error"', async () => {
  const { run } = makeRunner((w) => {
    w.emit({ type: 'started' });
    w.emit({ type: 'done', exitCode: 1 });
  });
  assert.equal((await run()).status, 'error');
});

test('an endless program is stopped by the time limit and the worker is thrown away', async () => {
  const { run, log } = makeRunner((w) => w.emit({ type: 'started' })); // never finishes
  assert.deepEqual(await run(), { status: 'timeout' });
  assert.equal(log.terminated, 1);
});

test('the Stop button ends the run and kills the worker', async () => {
  const { run, runner, log } = makeRunner((w) => w.emit({ type: 'started' }));
  const promise = run();
  await new Promise((r) => setTimeout(r, 10));
  runner.stop();
  assert.deepEqual(await promise, { status: 'stopped' });
  assert.equal(log.terminated, 1);
  assert.equal(runner.isRunning, false);
  // The next run gets a brand-new worker.
  const second = makeRunner((w) => {
    w.emit({ type: 'started' });
    w.emit({ type: 'done', exitCode: 0 });
  });
  assert.equal((await second.run()).status, 'ok');
});

test('a program that prints forever is cut off at the output limit', async () => {
  const { run, log } = makeRunner((w) => {
    w.emit({ type: 'started' });
    for (let i = 0; i < 20; i += 1) w.emit({ type: 'out', kind: 'out', text: 'xxxxxxxxxx' });
  });
  assert.deepEqual(await run(), { status: 'too-much-output' });
  const shown = log.output.map(([, text]) => text).join('');
  assert.ok(shown.length > 0 && shown.length <= LIMITS.maxOutputChars, `showed ${shown.length} chars`);
  assert.equal(log.terminated, 1);
});

test('"fatal" from the worker becomes an engine-error and the state is "error"', async () => {
  const { run, log } = makeRunner((w) => w.emit({ type: 'fatal', message: 'engine files missing' }));
  assert.deepEqual(await run(), { status: 'engine-error', message: 'engine files missing' });
  assert.equal(log.states.at(-1), 'error');
});

test('an engine that never loads times out with a clear message', async () => {
  const { run } = makeRunner(() => {}); // never answers
  const result = await run();
  assert.equal(result.status, 'engine-error');
  assert.match(result.message, /took too long to load/);
});

test('a worker script error (onerror) is reported', async () => {
  const { run } = makeRunner((w) => w.onerror({ message: '404' }));
  const result = await run();
  assert.equal(result.status, 'engine-error');
  assert.match(result.message, /could not be loaded \(404\)/);
});

test('a second run while one is active is refused, not stacked', async () => {
  const { run, runner } = makeRunner((w) => w.emit({ type: 'started' }));
  const first = run();
  const second = await run();
  assert.equal(second.status, 'engine-error');
  runner.stop();
  await first;
});

test('unknown messages are ignored', async () => {
  const { run } = makeRunner((w) => {
    w.emit({ type: 'something-new' });
    w.emit({ type: 'started' });
    w.emit({ type: 'done', exitCode: 0 });
  });
  assert.equal((await run()).status, 'ok');
});

test('describeResult gives every ending a friendly message', () => {
  for (const status of ['ok', 'error', 'stopped', 'timeout', 'too-much-output']) {
    assert.ok(describeResult({ status }).text.length > 0, status);
  }
  assert.match(describeResult({ status: 'engine-error', message: 'boom' }).text, /boom/);
});

test('output buffer keeps order and merges same-kind text', () => {
  const sent = [];
  const buffer = createOutputBuffer((kind, text) => sent.push([kind, text]));
  buffer.write('out', 'a');
  buffer.write('out', 'b');
  buffer.write('err', 'E');
  buffer.write('out', 'c');
  buffer.flush();
  assert.deepEqual(sent, [['out', 'ab'], ['err', 'E'], ['out', 'c']]);
  buffer.write('out', 'x'.repeat(3000)); // big text is sent immediately
  assert.equal(sent.length, 4);
});
