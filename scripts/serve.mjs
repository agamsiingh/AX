/* ═══════════════════════════════════════════
   AGMIEX — Tiny static server for local preview (no dependencies)
   npm run dev      → serves the repo root   (http://localhost:5173)
   npm run preview  → serves dist/           (http://localhost:4173)
   ═══════════════════════════════════════════ */

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import { DIST, ROOT } from './lib/site.mjs';

const useDist = process.argv.includes('--dist');
const base = useDist ? DIST : ROOT;
const port = Number(process.env.PORT) || (useDist ? 4173 : 5173);

const COMPRESSIBLE = new Set(['.html', '.css', '.js', '.mjs', '.json', '.webmanifest', '.svg', '.txt', '.xml']);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
};

async function resolveFile(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const target = path.normalize(path.join(base, decoded));
  if (!target.startsWith(base)) return null; // block path traversal
  try {
    const info = await stat(target);
    return info.isDirectory() ? path.join(target, 'index.html') : target;
  } catch {
    return null;
  }
}

createServer(async (req, res) => {
  let file = await resolveFile(req.url || '/');
  let status = 200;
  if (!file) {
    file = path.join(base, '404.html');
    status = 404;
  }
  try {
    let body = await readFile(file);
    const ext = path.extname(file);
    const headers = { 'Content-Type': TYPES[ext] || 'application/octet-stream' };
    // Compress text like production static hosts do, so previews and audits are realistic.
    if (COMPRESSIBLE.has(ext) && (req.headers['accept-encoding'] || '').includes('gzip')) {
      body = gzipSync(body);
      headers['Content-Encoding'] = 'gzip';
    }
    res.writeHead(status, headers);
    res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
}).listen(port, () => {
  console.log(`  Serving ${useDist ? 'dist/' : 'project root'} at http://localhost:${port}`);
});
