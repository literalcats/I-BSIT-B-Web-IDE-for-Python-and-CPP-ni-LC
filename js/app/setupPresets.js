// js/app/setupPresets.js
// The "Presets" menu: ready-made example programs that open as a NEW file.

import { fetchPresetCode, fetchPresetIndex } from '../content/presets.js';
import { registerMenu } from '../ui/menus.js';
import { createPresetsMenu } from '../ui/presetsMenu.js';

export function setupPresets({ files, createAndReport, notify }) {
  let presetIndex = null;

  const loadIndex = async () => {
    try {
      presetIndex = await fetchPresetIndex();
    } catch {
      presetIndex = null; // offline and never loaded: the menu says so, nothing breaks
    }
  };
  loadIndex();

  const menu = createPresetsMenu({
    getIndex: () => presetIndex,
    getCurrentLanguage: () => files.current?.language,
    onPick: async (item) => {
      try {
        const code = await fetchPresetCode(item.path);
        await createAndReport(
          { name: item.fileName, language: item.language, content: code, stdin: item.stdin },
          { suffixOnClash: true, message: `Opened "${item.title}" as a new file` },
        );
      } catch (error) {
        notify(error.message, { error: true });
      }
    },
  });

  registerMenu('btn-presets', 'menu-presets', () => {
    menu.prepare();
    if (!presetIndex) loadIndex().then(() => menu.prepare());
  });
}
