// js/pwa/install.js
// The visible "Install app" button.
//
// Chrome / Edge / Android give us an install prompt we can trigger ourselves.
// iPhone / iPad Safari and Firefox do NOT, so for them the button opens a short
// how-to with the exact steps for that browser.

/** What to tell the student, based on their browser. Pure function (easy to test). */
export function installInstructions(userAgent, { standalone = false } = {}) {
  if (standalone) {
    return { platform: 'installed', intro: 'Code Lab is already installed on this device.', steps: [] };
  }

  const ua = String(userAgent);
  const isIOS = /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && /Mobile/i.test(ua));
  const isAndroid = /Android/i.test(ua);
  const isFirefox = /Firefox|FxiOS/i.test(ua);
  const isEdge = /Edg\//i.test(ua);
  const isChromium = /Chrome|CriOS|Chromium/i.test(ua) && !isEdge;
  const isSafari = /Safari/i.test(ua) && !isChromium && !isFirefox && !isEdge;

  if (isIOS) {
    if (/CriOS|FxiOS|EdgiOS/i.test(ua)) {
      return {
        platform: 'ios-other',
        intro: 'On iPhone and iPad, installing only works from Safari.',
        steps: ['Open this same page in Safari.', 'Tap the Share button (square with an arrow).', 'Choose "Add to Home Screen", then tap Add.'],
      };
    }
    return {
      platform: 'ios',
      intro: 'On iPhone and iPad you add it from the Share menu.',
      steps: ['Tap the Share button (square with an arrow) at the bottom of Safari.', 'Scroll down and choose "Add to Home Screen".', 'Tap Add. Code Lab appears on your home screen.'],
    };
  }
  if (isAndroid) {
    return {
      platform: 'android',
      intro: 'On Android, use the browser menu.',
      steps: isFirefox
        ? ['Tap the ⋮ menu.', 'Choose "Install".', 'Confirm. Code Lab appears on your home screen.']
        : ['Tap the ⋮ menu (top right of Chrome).', 'Choose "Install app" (or "Add to Home screen").', 'Confirm. Code Lab appears on your home screen.'],
    };
  }
  if (isFirefox) {
    return {
      platform: 'firefox-desktop',
      intro: 'Firefox on computers cannot install web apps.',
      steps: ['Open this page in Chrome or Edge to install it.', 'You can still use Code Lab in Firefox, and it works offline after the first visit.'],
    };
  }
  if (isEdge || isChromium) {
    return {
      platform: 'desktop-chromium',
      intro: 'In Chrome or Edge, look for the install icon.',
      steps: ['Look for the install icon (a screen with a down arrow) at the right end of the address bar.', 'Or open the ⋮ menu and choose "Install I-BSIT-B Code Lab" (Chrome) or "Apps > Install this site as an app" (Edge).', 'Click Install.'],
    };
  }
  if (isSafari) {
    return {
      platform: 'safari-mac',
      intro: 'In Safari on a Mac, add it to your Dock.',
      steps: ['Open the File menu.', 'Choose "Add to Dock".', 'Click Add.'],
    };
  }
  return {
    platform: 'other',
    intro: 'Installing works best in Chrome, Edge or Safari.',
    steps: ['Open this page in Chrome, Edge or Safari.', 'Follow that browser\'s "Install" or "Add to Home Screen" option.'],
  };
}

export function isStandalone() {
  try {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  } catch {
    return false;
  }
}

/**
 * Wire up the button.
 *   showHelp({ intro, steps })  opens the how-to window
 */
export function initInstallButton({ button, showHelp }) {
  let deferredPrompt = null;

  const refreshVisibility = () => {
    button.hidden = isStandalone(); // no need to offer install inside the installed app
  };

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault(); // keep it for our own button
    deferredPrompt = event;
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    button.hidden = true;
  });

  button.addEventListener('click', async () => {
    if (deferredPrompt) {
      const prompt = deferredPrompt;
      deferredPrompt = null; // a prompt can only be used once
      try {
        await prompt.prompt();
        await prompt.userChoice;
      } catch {
        showHelp(installInstructions(navigator.userAgent));
      }
      return;
    }
    showHelp(installInstructions(navigator.userAgent, { standalone: isStandalone() }));
  });

  refreshVisibility();
}
