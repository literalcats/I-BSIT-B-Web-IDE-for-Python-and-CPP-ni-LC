import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installInstructions } from '../public/js/pwa/install.js';
import { summarizeOffline, formatMB } from '../public/js/pwa/offline.js';

const UA = {
  iphoneSafari: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  iphoneChrome: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0 Mobile/15E148 Safari/604.1',
  androidChrome: 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36',
  windowsChrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
  windowsEdge: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36 Edg/120.0',
  windowsFirefox: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
  macSafari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
};

test('install instructions are chosen per browser', () => {
  const platform = (ua, options) => installInstructions(ua, options).platform;
  assert.equal(platform(UA.iphoneSafari), 'ios');
  assert.equal(platform(UA.iphoneChrome), 'ios-other');
  assert.equal(platform(UA.androidChrome), 'android');
  assert.equal(platform(UA.windowsChrome), 'desktop-chromium');
  assert.equal(platform(UA.windowsEdge), 'desktop-chromium');
  assert.equal(platform(UA.windowsFirefox), 'firefox-desktop');
  assert.equal(platform(UA.macSafari), 'safari-mac');
  assert.equal(platform('weird browser'), 'other');
  assert.equal(platform(UA.windowsChrome, { standalone: true }), 'installed');
});

test('every instruction set has an intro and steps (except "installed")', () => {
  for (const ua of Object.values(UA)) {
    const result = installInstructions(ua);
    assert.ok(result.intro.length > 10);
    assert.ok(result.steps.length >= 2);
  }
});

const MANIFEST = {
  core: ['/', '/index.html', '/js/main.js'],
  engines: [{ url: '/vendor/a.wasm', size: 9_000_000 }, { url: '/vendor/b.js', size: 1_000_000 }],
};

test('offline summary: nothing saved yet', () => {
  const s = summarizeOffline(MANIFEST, false, [], []);
  assert.equal(s.ready, false);
  assert.equal(s.coreReady, false);
  assert.equal(s.filesSaved, 0);
  assert.equal(s.bytesTotal, 10_000_000);
});

test('offline summary: core saved but engines only partly', () => {
  const s = summarizeOffline(MANIFEST, true, ['/', '/index.html', '/js/main.js'], ['/vendor/b.js']);
  assert.equal(s.coreReady, true);
  assert.equal(s.enginesReady, false);
  assert.equal(s.ready, false);
  assert.equal(s.filesSaved, 1);
  assert.equal(s.bytesSaved, 1_000_000);
});

test('offline summary: everything saved means ready', () => {
  const s = summarizeOffline(MANIFEST, true, MANIFEST.core, MANIFEST.engines.map((f) => f.url));
  assert.equal(s.ready, true);
});

test('offline summary: a core file missing means not ready; a build without engines is flagged', () => {
  assert.equal(summarizeOffline(MANIFEST, true, ['/'], MANIFEST.engines.map((f) => f.url)).coreReady, false);
  const none = summarizeOffline({ core: ['/'], engines: [] }, true, ['/'], []);
  assert.equal(none.enginesMissing, true);
  assert.equal(none.ready, false);
});

test('formatMB', () => {
  assert.equal(formatMB(1.5 * 1024 * 1024), '1.5 MB');
  assert.equal(formatMB(15 * 1024 * 1024), '15 MB');
});
