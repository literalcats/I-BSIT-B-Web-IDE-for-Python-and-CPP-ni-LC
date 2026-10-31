// js/main.js
// ---------------------------------------------------------------------------
// THE START OF THE APP. This file only CONNECTS the other modules, in order.
// It contains no feature logic: each feature lives in its own module.
//
//   storage/   saving files in IndexedDB          editor/   Monaco or the simple editor
//   runners/   running Python and C++             content/  cheat sheets and presets
//   app/       controllers + setup of each feature  ui/     menus, dialogs, panels, theme
//   pwa/       offline, install, updates          core/     small helpers (dom, bus, utils)
//
// Adding a feature = one new module + one line here, so existing features stay untouched.
// Parts talk to each other through the message bus (core/bus.js); the full list of
// "when X happens, do Y" is in app/connectEvents.js.
// ---------------------------------------------------------------------------

import { byId } from './core/dom.js';
import { createBus } from './core/bus.js';
import { openStorage } from './storage/index.js';
import { createFileController } from './app/fileController.js';
import { createRunController } from './app/runController.js';
import { connectEvents } from './app/connectEvents.js';
import { installGlobalErrorHandlers, showFatal } from './app/errors.js';
import { setupEditor } from './app/setupEditor.js';
import { setupFileButtons } from './app/setupFileButtons.js';
import { setupCheatSheet } from './app/setupCheatSheet.js';
import { setupCppNotice } from './app/setupCppNotice.js';
import { setupPresets } from './app/setupPresets.js';
import { setupMoreMenu } from './app/setupMoreMenu.js';
import { setupShortcuts } from './app/setupShortcuts.js';
import { setupInstallButton, setupOfflineInfo, startServiceWorker } from './app/setupPwa.js';
import { initTheme } from './ui/theme.js';
import { showToast as notify } from './ui/toast.js';
import { initMenuClosing } from './ui/menus.js';
import { createPanels } from './ui/panels.js';
import { createFileList } from './ui/fileList.js';
import { createConsole } from './ui/consolePanel.js';

async function main() {
  const bus = createBus();

  // 1. Things that need no database.
  initTheme((theme) => bus.emit('theme-changed', theme));
  initMenuClosing();
  const panels = createPanels({ onLayoutChange: () => bus.emit('layout-changed') });
  startServiceWorker({ notify });

  // 2. The database.
  const { store, persistent } = await openStorage();
  if (!persistent) {
    notify('Your browser blocked saving (private window?). Your files will disappear when you close this tab. Use "Back up all files".', { error: true });
  }

  // 3. Screen parts (they only draw; the controllers decide what happens).
  const consolePanel = createConsole({ onStdinChange: () => bus.emit('stdin-changed') });
  const fileList = createFileList({ onSelect: (id) => bus.emit('file-picked', id) });
  const editor = await setupEditor({ bus, notify });

  // 4. Controllers.
  const files = createFileController({ store, persistent, editor, fileList, consolePanel, bus, notify });
  const runs = createRunController({ files, consolePanel, notify });

  // 5. Features.
  const { createAndReport } = setupFileButtons({ files, panels, notify });
  const cheat = setupCheatSheet({ files, bus, createAndReport, notify });
  setupPresets({ files, createAndReport, notify });
  setupCppNotice({ bus, notify });
  setupMoreMenu({ store, files, editor, notify });
  setupInstallButton();
  setupOfflineInfo({ persistent });
  setupShortcuts({ bus, files });
  byId('btn-run').addEventListener('click', () => runs.run());
  byId('btn-stop').addEventListener('click', () => runs.stop());

  // 6. Who reacts to which event (must come before init, which announces "file-opened").
  connectEvents({ bus, files, runs, editor, panels, notify });

  // 7. Go!
  await files.init();
  cheat.preload();
  installGlobalErrorHandlers(notify);

  // A handle for automated browser tests and for poking around in the browser console.
  window.codeLab = { files, editor };
}

main().catch(showFatal);
