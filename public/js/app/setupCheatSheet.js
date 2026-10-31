// js/app/setupCheatSheet.js
// The cheat sheet side panel: "Copy to Editor" and "Open as new file".

import { LANGUAGES, urlFor } from '../config.js';
import { slugify, toFullProgram } from '../content/cheatsheetParser.js';
import { createCheatSheet } from '../ui/cheatSheet.js';

export function setupCheatSheet({ files, bus, createAndReport, notify }) {
  const cheat = createCheatSheet({
    fetchText: async (path) => {
      const response = await fetch(urlFor(path));
      if (!response.ok) throw new Error(`Could not load ${path}`);
      return response.text();
    },

    onInsert: (topic) => {
      const file = files.current;
      if (!file) return;
      if (file.language !== topic.language) {
        notify(`Your open file is ${LANGUAGES[file.language].label}. Open a ${LANGUAGES[topic.language].label} file first, or use "Open as new file".`, { error: true });
        return;
      }
      files.insertSnippet(topic.code);
      notify(`Copied "${topic.title}" into ${file.name}`);
    },

    onOpenAsFile: (topic) => createAndReport(
      {
        name: slugify(topic.title).replace(/-/g, '_') + LANGUAGES[topic.language].ext,
        language: topic.language,
        content: toFullProgram(topic),
        stdin: topic.stdin,
      },
      { suffixOnClash: true, message: `Opened "${topic.title}" as a new file` },
    ),
  });

  // Show the topics of the language of the file that is open.
  bus.on('file-opened', (file) => cheat.setLanguage(file.language));
  return cheat;
}
