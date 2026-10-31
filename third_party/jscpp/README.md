# JSCPP (C++ interpreter used by Code Lab)

This folder holds the **official browser build** of JSCPP, copied unchanged.

| | |
|---|---|
| Project | https://github.com/felixhao28/JSCPP |
| Version | 2.0.9 (the version in the project's package.json and on npm) |
| File | `JSCPP.es5.min.js` (from the project's `gh-pages` branch, `dist/`, commit `76e3534`, 2021-05-07) |
| SHA-256 | `e73047b962bd8fa92faf493873b38990b63df876e67dc0a7dfc7c0fc046e7fdd` |
| License | MIT (see `LICENSE`, copyright Felix Hao) |

## Why it is kept in the repo and not installed with npm

JSCPP's npm package leaves out its `dist/` folder (the package's `.npmignore` lists `/dist/`),
so `npm install` never provides the browser file. `scripts/build.mjs` copies this file into
`public/vendor/jscpp/` during the build.

## How to update it

1. Download the new `dist/JSCPP.es5.min.js` from the project's `gh-pages` branch.
2. Replace the file here and update the version, commit and SHA-256 above
   (`sha256sum third_party/jscpp/JSCPP.es5.min.js`).
3. Run `npm test`. It runs every C++ example and preset through this exact file.

The file is loaded by `public/js/runners/jscppLoader.js`, which explains a quirk of the engine
(it only defines itself when it sees a `window`, so a worker needs a small shim).
