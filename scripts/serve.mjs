// scripts/serve.mjs
// A tiny web server for testing on your own computer (no packages needed).
//   npm start   ->  http://localhost:3000
// It serves the public/ folder, just like Vercel will.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_DIR = path.resolve(HERE, '..', 'public');

// Which "Content-Type" to send for each file ending. WebAssembly (.wasm)
// MUST be application/wasm or the browser refuses to run it.
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.wasm': 'application/wasm',
  '.zip': 'application/zip',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.py': 'text/plain; charset=utf-8',
  '.cpp': 'text/plain; charset=utf-8',
};

export function startServer({ port = 3000, dir = DEFAULT_DIR } = {}) {
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      let relative = decodeURIComponent(url.pathname);
      if (relative.endsWith('/')) relative += 'index.html';

      // Safety: never allow "../" to escape the public folder.
      const filePath = path.normalize(path.join(dir, relative));
      if (!filePath.startsWith(dir)) {
        res.writeHead(403).end('Forbidden');
        return;
      }

      const info = await stat(filePath);
      if (!info.isFile()) throw new Error('not a file');
      const body = await readFile(filePath);
      const headers = {
        'Content-Type': MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
        'Content-Length': body.length,
      };
      // The service worker files must never be cached by the browser's normal cache.
      if (/\/(sw|precache)\.js$/.test(relative)) headers['Cache-Control'] = 'no-cache';
      res.writeHead(200, headers).end(body);
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Not found');
    }
  });

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, () => resolve(server));
  });
}

// Run directly (npm start)? Then start listening.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT) || 3000;
  startServer({ port }).then(() => {
    console.log(`\nCode Lab is running at  http://localhost:${port}`);
    console.log('Press Ctrl+C to stop.\n');
  });
}
