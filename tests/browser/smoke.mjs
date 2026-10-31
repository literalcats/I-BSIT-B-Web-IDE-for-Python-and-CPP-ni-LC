// tests/browser/smoke.mjs  -  a real-browser check of the whole app.
//
// Run it with:   node tests/browser/smoke.mjs
// It needs Playwright and a Chromium browser (not part of the app, only for testing),
// and a built app (npm run build). It starts its own web server.
//
// Set SHOTS=/some/folder to save screenshots.
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { startServer } from '../../scripts/serve.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const SHOTS = process.env.SHOTS || '';
if (SHOTS) mkdirSync(SHOTS, { recursive: true });

const results = [];
async function step(name, work) {
  try {
    await work();
    results.push({ name, ok: true });
    console.log(`  PASS  ${name}`);
  } catch (error) {
    results.push({ name, ok: false, error });
    console.log(`  FAIL  ${name}\n        ${String(error.message).split('\n')[0]}`);
  }
}
const expect = (condition, message) => { if (!condition) throw new Error(message); };

const server = await startServer({ port: 0 });
const base = `http://localhost:${server.address().port}/`;
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1360, height: 820 }, acceptDownloads: true });
const page = await context.newPage();

const pageErrors = [];
page.on('pageerror', (error) => pageErrors.push(error.message));
const consoleErrors = [];
page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });

const output = () => page.locator('#output').innerText();
const waitForOutput = (text, timeout = 90000) =>
  page.waitForFunction((t) => document.getElementById('output').textContent.includes(t), text, { timeout });
const shot = async (name) => { if (SHOTS) await page.screenshot({ path: path.join(SHOTS, name + '.png') }); };
const setCode = async (code) => {
  await page.evaluate((text) => window.codeLab.editor.replaceAll(text), code);
};
const getCode = () => page.evaluate(() => window.codeLab.editor.getValue());

console.log('\nBrowser smoke test\n');

await step('app starts and creates a first file (hello.py)', async () => {
  await page.goto(base);
  await page.waitForFunction(() => window.codeLab && window.codeLab.files.current);
  expect((await page.locator('#file-title').innerText()) === 'hello.py', 'first file should be hello.py');
  expect((await page.locator('#file-list .file-item').count()) === 1, 'one file in the list');
  expect((await page.evaluate(() => document.documentElement.dataset.theme)) === 'dark', 'dark is the default theme');
});

await step('Monaco is not installed here, so the simple editor is used (fallback works)', async () => {
  const kind = await page.evaluate(() => window.codeLab.editor.kind);
  expect(kind === 'basic', `editor kind was ${kind}`);
});

await step('typing is auto-saved and shows "Saved on this device"', async () => {
  await setCode('print("saved?")\n');
  await page.waitForFunction(() => document.getElementById('save-status').textContent.startsWith('Saved on this device'), null, { timeout: 5000 });
});

await step('Python runs (real Pyodide in a worker) and prints the output', async () => {
  await setCode('print("Hello from Pyodide!")\nprint(2 ** 10)\n');
  await page.click('#btn-run');
  await waitForOutput('Finished');
  const text = await output();
  expect(text.includes('Hello from Pyodide!') && text.includes('1024'), `output was: ${text}`);
});

await step('a Python error shows the file name and line, in red', async () => {
  await setCode('x = 1\nprint(1 / 0)\n');
  await page.click('#btn-run');
  await waitForOutput('ZeroDivisionError');
  const text = await output();
  expect(text.includes('hello.py') && text.includes('line 2'), `no file/line in: ${text}`);
  expect((await page.locator('#output .output__err').count()) > 0, 'error text should be styled');
  expect(!/_pyodide|eval_code/.test(text), 'internal frames leaked');
});

await step('input() reads from the Input tab and echoes the answers', async () => {
  await setCode('name = input("Name? ")\nage = int(input("Age? "))\nprint(f"{name} is {age}")\n');
  await page.click('#tab-input');
  await page.fill('#stdin', 'Ana\n17\n');
  await page.click('#btn-run');
  await waitForOutput('Ana is 17');
  expect((await output()).includes('Name? Ana'), 'the typed answer should be echoed');
});

await step('an endless loop can be stopped with Stop, and the app keeps working', async () => {
  await setCode('while True:\n    pass\n');
  await page.click('#btn-run');
  await page.waitForSelector('#btn-stop:not([hidden])');
  await page.waitForTimeout(500);
  await page.click('#btn-stop');
  await waitForOutput('Stopped by you', 10000);
  expect(await page.locator('#btn-run').isVisible(), 'Run should be back');
  await setCode('print("still alive")\n');
  await page.click('#btn-run');
  await waitForOutput('still alive');
});

await step('files survive a page reload (IndexedDB), including the Input text', async () => {
  await setCode('print("persist me")\n');
  await page.click('#tab-input');
  await page.fill('#stdin', 'remembered\n');
  await page.waitForTimeout(1200);
  await page.reload();
  await page.waitForFunction(() => window.codeLab && window.codeLab.files.current);
  expect((await getCode()) === 'print("persist me")\n', 'code should be restored');
  expect((await page.inputValue('#stdin')) === 'remembered\n', 'input should be restored');
});

await step('new file dialog refuses a duplicate name and a bad extension', async () => {
  await page.click('#btn-new-file');
  await page.fill('#file-name', 'hello');
  await page.click('#file-submit');
  expect((await page.locator('#file-name-error').innerText()).includes('already exists'), 'duplicate not refused');
  await page.fill('#file-name', 'bad/name');
  await page.click('#file-submit');
  expect((await page.locator('#file-name-error').innerText()).length > 0, 'bad name not refused');
  await page.fill('#file-name', 'second');
  await page.click('#file-submit');
  await page.waitForFunction(() => window.codeLab.files.current.name === 'second.py');
});

await step('rename and delete (with a confirmation) work', async () => {
  await page.click('#btn-rename');
  await page.fill('#file-name', 'renamed');
  await page.click('#file-submit');
  await page.waitForFunction(() => window.codeLab.files.current.name === 'renamed.py');
  await page.click('#btn-delete');
  await page.click('#confirm-ok');
  await page.waitForFunction(() => window.codeLab.files.files.length === 1);
  expect((await page.locator('#file-title').innerText()) === 'hello.py', 'should fall back to hello.py');
});

await step('presets create a NEW file with comments and sample input', async () => {
  await page.click('#btn-presets');
  await page.click('#menu-presets >> text=Ask the user');
  await page.waitForFunction(() => window.codeLab.files.current.name === 'user_input.py');
  expect((await getCode()).includes('# PRESET: Asking the user'), 'preset code missing');
  expect((await page.inputValue('#stdin')) === 'Ana\n2008\n', 'sample input missing');
  await page.click('#btn-run');
  await waitForOutput('Finished');
  expect((await output()).includes('Born in 2008'), 'preset did not run correctly');
  expect((await page.locator('#file-list .file-item').count()) === 2, 'the original file must still exist');
});

await step('cheat sheet: opens, groups by level, filters, copies into the editor', async () => {
  await page.click('#btn-cheat');
  await page.waitForSelector('#cheat-list .cheat-card');
  expect((await page.locator('#cheat-list .cheat-card').count()) >= 25, 'too few Python topics');
  expect((await page.locator('#cheat-list .cheat-group').first().innerText()).includes('Level 1'), 'level 1 should come first');
  await page.selectOption('#filter-importance', 'must');
  const mustCount = await page.locator('#cheat-list .cheat-card').count();
  expect(mustCount > 5 && mustCount < 30, `must-know count ${mustCount}`);
  await page.selectOption('#filter-importance', 'all');
  await page.fill('#cheat-search', 'for loops');
  await page.locator('#cheat-list .cheat-card summary').first().click();
  await shot('cheat-open');
  await setCode('# my work\n');
  await page.locator('#cheat-list .cheat-card button:text("Copy to editor")').first().click();
  const code = await getCode();
  expect(code.includes('# my work') && code.includes('range'), `snippet not inserted: ${code}`);
});

await step('cheat sheet: wrong-language insert is refused, "Open as new file" works', async () => {
  await page.click('#cheat-panel [data-lang="cpp"]');
  await page.fill('#cheat-search', '');
  await page.waitForSelector('#cheat-list .cheat-card');
  await page.locator('#cheat-list .cheat-card summary').first().click();
  const before = await getCode();
  await page.locator('#cheat-list .cheat-card button:text("Copy to editor")').first().click();
  expect((await getCode()) === before, 'C++ code must not be pasted into a Python file');
  await page.locator('#cheat-list .cheat-card button:text("Open as new file")').first().click();
  await page.waitForFunction(() => window.codeLab.files.current.language === 'cpp');
  expect((await getCode()).includes('int main()'), 'new C++ file should be a full program');
});

await step('C++ runs in a real worker (JSCPP) and prints the program output', async () => {
  await page.click('#btn-run');
  // The new-file template is a hello-world, so some text must appear and no error.
  await page.waitForFunction(
    () => /Hello/i.test(document.getElementById('output').textContent),
    null, { timeout: 60000 });
  const out = await page.evaluate(() => document.getElementById('output').textContent);
  expect(!/engine could not start/i.test(out), 'C++ engine failed to start: ' + out.slice(0, 200));
  await page.waitForSelector('#btn-run', { state: 'visible', timeout: 20000 });
});

await step('C++ limits are explained: badge, one-time notice, and a hint when a run fails', async () => {
  // 1. The badge always says "simplified" for C++ files.
  const badge = await page.textContent('#file-badge');
  expect(/simplified/i.test(badge), 'C++ badge should say simplified, got: ' + badge);

  // 2. The one-time notice was shown when the first C++ file opened (and has a Learn more button).
  const notice = page.locator('#toast-region .toast', { hasText: 'simplified interpreter' });
  expect(await notice.count() === 1, 'one-time C++ notice should be on screen');
  await notice.locator('button:text("Learn more")').click();
  expect(await page.locator('#dlg-about').evaluate((d) => d.open), 'Learn more should open Tips and limits');
  await page.click('#about-close');

  // 3. An unsupported feature gives the honest hint (not just a raw engine error).
  await setCode('#include <vector>\nusing namespace std;\nint main() { vector<int> v; return 0; }\n');
  await page.click('#btn-run');
  await page.waitForFunction(() => /Note: .*not a full compiler/s.test(document.getElementById('output').textContent), null, { timeout: 60000 });
  const out = await page.textContent('#output');
  expect(/<vector> library is not available/.test(out), 'hint should name the library: ' + out.slice(0, 300));
  expect(/g\+\+/.test(out), 'hint should mention g++');
  await shot('cpp-hint');
  await page.waitForSelector('#btn-run', { state: 'visible', timeout: 20000 });

  // 4. A correct program prints NO hint.
  await setCode('#include <iostream>\nusing namespace std;\nint main() { cout << "fine" << endl; return 0; }\n');
  await page.click('#btn-run');
  await page.waitForFunction(() => /— Finished —/.test(document.getElementById('output').textContent), null, { timeout: 30000 });
  await page.waitForSelector('#btn-run', { state: 'visible', timeout: 20000 });
  const finalOut = await page.textContent('#output');
  expect(/^fine$/m.test(finalOut), 'the working program should print fine: ' + JSON.stringify(finalOut));
  expect(!/Note: /.test(finalOut), 'no hint should appear for a working program. Output was: ' + JSON.stringify(finalOut));
});

await step('the C++ notice is shown only once (not again after a reload)', async () => {
  await page.reload();
  await page.waitForFunction(() => window.codeLab);
  await page.waitForTimeout(800);
  expect((await page.locator('#toast-region .toast', { hasText: 'simplified interpreter' }).count()) === 0, 'notice should not repeat');
});

// The next two steps use a brand-new browser profile each, so their files cannot disturb other steps.
// They reproduce two real data-loss bugs found in a review (see tests/fileController.test.mjs).
async function inFreshApp(work) {
  const freshContext = await browser.newContext();
  const fresh = await freshContext.newPage();
  try {
    await fresh.goto(base);
    await fresh.waitForFunction(() => window.codeLab);
    await work(fresh);
  } finally {
    await freshContext.close();
  }
}
const reloadAndListFiles = async (fresh) => {
  await fresh.reload();
  await fresh.waitForFunction(() => window.codeLab);
  return fresh.evaluate(() => window.codeLab.files.files.map((f) => ({ name: f.name, content: f.content, stdin: f.stdin })));
};

await step('code and Input edited together are both saved (real IndexedDB)', async () => {
  await inFreshApp(async (fresh) => {
    await fresh.evaluate(() => {
      const box = document.querySelector('.basic-editor');
      box.value = 'print("NEW CODE")';
      box.dispatchEvent(new Event('input', { bubbles: true }));
      const input = document.getElementById('stdin');
      input.value = 'NEW INPUT';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      return window.codeLab.files.flush();
    });
    const saved = (await reloadAndListFiles(fresh)).find((f) => f.name === 'hello.py');
    expect(saved.content === 'print("NEW CODE")', 'code was lost: ' + JSON.stringify(saved.content));
    expect(saved.stdin === 'NEW INPUT', 'input was lost: ' + JSON.stringify(saved.stdin));
  });
});

await step('a keystroke while switching files never lands in the other file', async () => {
  await inFreshApp(async (fresh) => {
    const ids = await fresh.evaluate(async () => {
      const f = window.codeLab.files;
      const a = await f.create({ name: 'a.py', language: 'python', content: 'AAA original' });
      const b = await f.create({ name: 'b.py', language: 'python', content: 'BBB original' });
      await f.open(a.id);
      return { b: b.id };
    });
    await fresh.evaluate(async (bId) => {
      const type = (text) => {
        const box = document.querySelector('.basic-editor');
        box.value = text;
        box.dispatchEvent(new Event('input', { bubbles: true }));
      };
      type('AAA edited once');
      const switching = window.codeLab.files.open(bId); // click file B ...
      type('AAA edited AGAIN');                         // ... and a keystroke lands during the save
      await switching;
    }, ids.b);
    await fresh.waitForTimeout(1500); // longer than the autosave delay
    const files = await reloadAndListFiles(fresh);
    const a = files.find((f) => f.name === 'a.py');
    const b = files.find((f) => f.name === 'b.py');
    expect(a.content === 'AAA edited AGAIN', 'a.py has the wrong text: ' + JSON.stringify(a.content));
    expect(b.content === 'BBB original', 'b.py was changed: ' + JSON.stringify(b.content));
  });
});

await step('theme toggle switches to the light palette and is remembered', async () => {
  await page.click('#btn-theme');
  expect((await page.evaluate(() => document.documentElement.dataset.theme)) === 'light', 'not light');
  await shot('light');
  await page.reload();
  await page.waitForFunction(() => window.codeLab);
  expect((await page.evaluate(() => document.documentElement.dataset.theme)) === 'light', 'light not remembered');
  await page.click('#btn-theme');
});

await step('backup downloads a JSON file; restore adds files back without overwriting', async () => {
  await page.click('#btn-more');
  const [download] = await Promise.all([page.waitForEvent('download'), page.click('#mi-backup')]);
  const file = await download.path();
  const text = (await import('node:fs')).readFileSync(file, 'utf8');
  const backup = JSON.parse(text);
  expect(backup.format === 'bsit-code-lab-backup' && backup.files.length >= 2, 'bad backup');
  const before = await page.evaluate(() => window.codeLab.files.files.length);
  await page.click('#btn-more');
  await page.setInputFiles('#restore-input', file);
  await page.waitForFunction((n) => window.codeLab.files.files.length > n, before);
});

await step('install button is visible and opens instructions when no install prompt exists', async () => {
  expect(await page.locator('#btn-install').isVisible(), 'install button hidden');
  await page.click('#btn-install');
  await page.waitForSelector('#dlg-install[open]');
  expect((await page.locator('#install-steps li').count()) >= 2, 'no steps shown');
  await page.click('#install-close');
});

await step('service worker saves the app; it reloads and RUNS PYTHON with the network off', async () => {
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(async () => (await caches.keys()).some((k) => k.startsWith('bsit-core-')));
  // Run once online so the Python engine files are saved too (runtime caching).
  await page.click('#btn-run');
  await page.waitForFunction(() => document.getElementById('output').textContent.length > 0);
  await page.evaluate(() => window.codeLab.files.files.length);
  await page.click('#btn-new-file');
  await page.selectOption('#file-language', 'python'); // the dialog defaults to the open file's language
  await page.fill('#file-name', 'offline_check');
  await page.click('#file-submit');
  await page.waitForFunction(() => window.codeLab.files.current.name === 'offline_check.py');
  await setCode('print("online first")\n');
  await page.click('#btn-run');
  await waitForOutput('Finished');
  await context.setOffline(true);
  await page.reload();
  await page.waitForFunction(() => window.codeLab && window.codeLab.files.current, null, { timeout: 20000 });
  await setCode('print("works offline!")\nprint(sum(range(5)))\n');
  await page.click('#btn-run');
  await waitForOutput('works offline!');
  expect((await output()).includes('10'), 'offline output wrong');
  await shot('offline-run');
  await context.setOffline(false);
});

await step('offline status text reflects what is saved', async () => {
  await page.click('#btn-storage-info');
  await page.waitForSelector('#dlg-storage[open]');
  await page.waitForFunction(() => !document.getElementById('offline-detail').textContent.startsWith('Checking'));
  const chip = await page.locator('#offline-chip').innerText();
  expect(/Offline:/.test(chip), `chip was ${chip}`);
  expect((await page.locator('#storage-persist-text').innerText()).length > 20, 'persistence text missing');
  await shot('storage-dialog');
  await page.click('#storage-close');
});

await step('phone layout: panels become overlays, nothing scrolls sideways', async () => {
  await page.setViewportSize({ width: 390, height: 780 });
  await page.waitForTimeout(300);
  expect(await page.locator('#files-panel').isHidden(), 'files panel should be hidden on a phone');
  await shot('phone');
  await page.click('#btn-files');
  expect(await page.locator('#files-panel').isVisible(), 'files panel should open');
  await shot('phone-files');
  await page.click('#scrim', { position: { x: 370, y: 400 } }); // the strip NOT covered by the panel
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow <= 0, `page scrolls sideways by ${overflow}px`);
  await page.setViewportSize({ width: 1360, height: 820 });
});

await step('no unexpected JavaScript errors happened', async () => {
  const unexpected = pageErrors.filter((m) => !/Failed to load resource/.test(m));
  expect(unexpected.length === 0, `page errors: ${unexpected.join(' | ')}`);
});

await shot('desktop-dark-final');
await browser.close();
server.close();

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
if (consoleErrors.length) console.log(`(console errors seen: ${[...new Set(consoleErrors)].slice(0, 4).join(' | ')})`);
process.exit(failed.length ? 1 : 0);
