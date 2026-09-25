/* ═══════════════════════════════════════════
   AGMIEX — Production build
   1. Regenerates book-demo/index.html from book-demo.html (kept in the repo root).
   2. Writes an optimised copy of the site to dist/:
      bundled + minified CSS and JS, whitespace-collapsed HTML, static assets.
   The repo root itself stays deployable without a build step.
   ═══════════════════════════════════════════ */

import { build } from 'esbuild';
import { cp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import { DIST, MIRRORS, PAGES, ROOT, STATIC_ASSETS, minifyHtml, mirrorHtml, stripDevBlocks } from './lib/site.mjs';

const BROWSER_TARGETS = ['chrome100', 'edge100', 'firefox100', 'safari15'];

async function syncMirrors() {
  for (const { source, target } of MIRRORS) {
    const html = await readFile(path.join(ROOT, source), 'utf8');
    const out = path.join(ROOT, target);
    await mkdir(path.dirname(out), { recursive: true });
    await writeFile(out, mirrorHtml(html, source));
  }
}

async function bundleAssets() {
  await build({
    entryPoints: [path.join(ROOT, 'assets/css/main.css')],
    outfile: path.join(DIST, 'assets/css/main.css'),
    bundle: true,
    minify: true,
    target: BROWSER_TARGETS,
    external: ['*.woff2'], // fonts are copied as static assets; keep their relative URLs
    logLevel: 'warning',
  });
  await build({
    entryPoints: [path.join(ROOT, 'assets/js/main.js')],
    outfile: path.join(DIST, 'assets/js/main.js'),
    bundle: true,
    minify: true,
    format: 'esm',
    target: BROWSER_TARGETS,
    legalComments: 'none',
    logLevel: 'warning',
  });
}

async function writePages() {
  const pages = [...PAGES, ...MIRRORS.map((m) => m.target)];
  for (const page of pages) {
    const html = await readFile(path.join(ROOT, page), 'utf8');
    const out = path.join(DIST, page);
    await mkdir(path.dirname(out), { recursive: true });
    await writeFile(out, minifyHtml(stripDevBlocks(html)));
  }
  return pages;
}

async function copyStatic() {
  for (const item of STATIC_ASSETS) {
    await cp(path.join(ROOT, item), path.join(DIST, item), { recursive: true });
  }
}

async function report(files) {
  const rows = [];
  for (const file of files) {
    const buf = await readFile(path.join(DIST, file));
    rows.push([file, buf.length, gzipSync(buf).length]);
  }
  const kb = (n) => `${(n / 1024).toFixed(1)} KB`.padStart(9);
  console.log('\n  File'.padEnd(34) + 'Size'.padStart(9) + 'Gzip'.padStart(10));
  rows.forEach(([file, size, gz]) => console.log(`  ${file.padEnd(32)}${kb(size)} ${kb(gz)}`));
}

const started = Date.now();
await syncMirrors();
await rm(DIST, { recursive: true, force: true });
await mkdir(DIST, { recursive: true });
await bundleAssets();
const pages = await writePages();
await copyStatic();
await stat(path.join(DIST, 'index.html'));
await report([...pages, 'assets/css/main.css', 'assets/js/main.js']);
console.log(`\n  ✓ Built dist/ in ${Date.now() - started} ms\n`);
