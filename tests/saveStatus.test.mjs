import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSaveStatus } from '../public/js/ui/saveStatus.js';
import { describeOffline } from '../public/js/pwa/offline.js';

test('save status texts', () => {
  const element = { textContent: '' };
  const status = createSaveStatus({ element, persistent: true });
  status.saving();
  assert.equal(element.textContent, 'Saving…');
  status.saved('10:42');
  assert.equal(element.textContent, 'Saved on this device · 10:42');
  status.error('Disk full');
  assert.equal(element.textContent, '⚠ Disk full');
  status.idle();
  assert.equal(element.textContent, '');
});

test('in private mode the status never claims it saved', () => {
  const element = { textContent: '' };
  const status = createSaveStatus({ element, persistent: false });
  status.saved('10:42');
  assert.match(element.textContent, /Not saved/);
});

test('describeOffline covers every state with words and a download button only when useful', () => {
  const MB = 1024 * 1024;
  assert.equal(describeOffline({ unavailable: true, reason: 'No caches' }).canDownload, false);
  assert.equal(describeOffline({ enginesMissing: true }).canDownload, false);
  assert.match(describeOffline({ ready: true }).chip, /ready/);
  assert.match(describeOffline({ coreReady: false }).chip, /getting ready/);
  const need = describeOffline({ coreReady: true, bytesTotal: 20 * MB, bytesSaved: 0 });
  assert.equal(need.canDownload, true);
  assert.match(need.text, /20 MB/);
});
