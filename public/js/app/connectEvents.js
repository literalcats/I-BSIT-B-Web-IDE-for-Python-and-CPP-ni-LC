// js/app/connectEvents.js
// ---------------------------------------------------------------------------
// ONE readable list of "when THIS happens, do THAT".
//
// Parts of the app announce things on the message bus (core/bus.js). This file
// is the only place that decides who reacts. To change what happens on an
// event, you change one line here.
//
//   event             who says it                      what happens
//   ----------------  -------------------------------  -----------------------------
//   editor-changed    the editor (any keystroke)       start the autosave timer
//   stdin-changed     the Input tab                    start the autosave timer
//   run-requested     Ctrl+Enter                       run the program
//   save-requested    Ctrl+S                           save now and say so
//   file-picked(id)   the file list                    open that file
//   file-opened(file) the file controller              (cheat sheet: see setupCheatSheet)
//                                                      start loading that language's engine
//   theme-changed(t)  the theme button                 recolor the editor
//   layout-changed    the panels                       resize the editor
// ---------------------------------------------------------------------------

import { APP } from '../config.js';

export function connectEvents({ bus, files, runs, editor, panels, notify }) {
  bus.on('editor-changed', () => files.onEditorChange());
  bus.on('stdin-changed', () => files.onStdinChange());
  bus.on('run-requested', () => runs.run());

  bus.on('save-requested', async () => {
    await files.flush();
    notify('Saved on this device');
  });

  bus.on('file-picked', async (id) => {
    await files.open(id);
    panels.afterFilePick();
  });

  bus.on('file-opened', (file) => {
    // Start loading the engine shortly after the page settles, so Run feels instant.
    setTimeout(() => runs.warmUp(file.language), APP.warmUpDelayMs);
  });

  bus.on('theme-changed', (theme) => editor.setTheme(theme));
  bus.on('layout-changed', () => editor.layout());
}
