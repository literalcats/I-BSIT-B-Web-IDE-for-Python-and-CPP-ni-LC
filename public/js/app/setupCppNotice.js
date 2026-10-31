// js/app/setupCppNotice.js
// The first time a student opens a C++ file on this device, explain (once) that C++
// here is a simplified interpreter. "Learn more" opens the Tips and limits dialog.

import { byId } from '../core/dom.js';
import { openDialog } from '../ui/dialogs.js';

const SEEN_KEY = 'bsit.cppNoticeSeen';

function alreadySeen() {
  try {
    return localStorage.getItem(SEEN_KEY) === '1';
  } catch {
    return false; // no storage: show it (once per page load, because of `shownThisVisit`)
  }
}

function markSeen() {
  try {
    localStorage.setItem(SEEN_KEY, '1');
  } catch {
    /* fine: the notice may appear again next visit */
  }
}

export function setupCppNotice({ bus, notify }) {
  let shownThisVisit = false;

  bus.on('file-opened', (file) => {
    if (file.language !== 'cpp' || shownThisVisit || alreadySeen()) return;
    shownThisVisit = true;
    markSeen();
    notify('C++ here is a simplified interpreter, not a full compiler. Some valid C++ (like std::string, struct, vectors) will not run.', {
      actionLabel: 'Learn more',
      onAction: () => openDialog(byId('dlg-about')),
      sticky: true,
    });
  });
}
