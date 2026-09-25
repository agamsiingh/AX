/* ═══════════════════════════════════════════
   AGMIEX — Static site checks (no dependencies)
   Verifies every page for broken local links/anchors/icons, SEO metadata,
   structured data, image attributes, form labelling and duplicate IDs.
   Runs against the repo root, and against dist/ when it exists.
   ═══════════════════════════════════════════ */

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { DIST, MIRRORS, PAGES, ROOT, mirrorHtml } from './lib/site.mjs';

const SITE_ORIGIN = 'https://agmiex.com';
const failures = [];
const fail = (where, message) => failures.push(`${where}: ${message}`);

const read = (file) => readFileSync(file, 'utf8');
const normaliseQuotes = (text) => text.replace(/[’‘]/g, "'").replace(/[“”]/g, '"');
const decodeEntities = (text) =>
  text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");

function parseTags(html) {
  const tags = [];
  const tagRe = /<([a-z][a-z0-9-]*)\b([^>]*)>/gi;
  let match;
  while ((match = tagRe.exec(html))) {
    const attrs = {};
    const attrRe = /([:\w-]+)(?:\s*=\s*"([^"]*)")?/g;
    let a;
    while ((a = attrRe.exec(match[2]))) attrs[a[1].toLowerCase()] = a[2] ?? '';
    tags.push({ name: match[1].toLowerCase(), attrs });
  }
  return tags;
}

const idCache = new Map();
function idsIn(file) {
  if (!idCache.has(file)) {
    idCache.set(file, new Set(parseTags(read(file)).map((t) => t.attrs.id).filter(Boolean)));
  }
  return idCache.get(file);
}

function resolveLocal(base, pageFile, url) {
  const [withoutHash, fragment = ''] = url.split('#');
  const clean = withoutHash.split('?')[0];
  if (!clean) return { file: pageFile, fragment };
  let target = clean.startsWith('/') ? path.join(base, clean) : path.join(path.dirname(pageFile), clean);
  if (clean.endsWith('/') || (existsSync(target) && !path.extname(target))) target = path.join(target, 'index.html');
  return { file: target, fragment };
}

function checkPage(base, rel) {
  const file = path.join(base, rel);
  const where = `${path.relative(ROOT, file)}`;
  if (!existsSync(file)) return fail(where, 'page is missing');

  const html = read(file);
  const tags = parseTags(html);
  const is404 = rel === '404.html';

  // ── Head metadata ──
  const title = html.match(/<title>([^<]*)<\/title>/i)?.[1]?.trim() ?? '';
  if (title.length < 10 || title.length > 70) fail(where, `<title> should be 10–70 characters (got ${title.length})`);
  const description = tags.find((t) => t.name === 'meta' && t.attrs.name === 'description')?.attrs.content ?? '';
  if (description.length < 50 || description.length > 170) {
    fail(where, `meta description should be 50–170 characters (got ${description.length})`);
  }
  if (!tags.find((t) => t.name === 'html')?.attrs.lang) fail(where, '<html> is missing lang');
  if (!tags.some((t) => t.name === 'meta' && t.attrs.name === 'viewport')) fail(where, 'missing viewport meta');
  if (!is404) {
    if (!tags.some((t) => t.name === 'link' && t.attrs.rel === 'canonical')) fail(where, 'missing canonical link');
    for (const prop of ['og:title', 'og:description', 'og:image', 'og:url']) {
      if (!tags.some((t) => t.name === 'meta' && t.attrs.property === prop)) fail(where, `missing ${prop}`);
    }
  }

  // ── Structure ──
  const h1s = tags.filter((t) => t.name === 'h1').length;
  if (h1s !== 1) fail(where, `expected exactly one <h1> (found ${h1s})`);
  if (!tags.some((t) => t.name === 'main')) fail(where, 'missing <main> landmark');

  const seen = new Set();
  tags.forEach(({ attrs }) => {
    if (!attrs.id) return;
    if (seen.has(attrs.id)) fail(where, `duplicate id "${attrs.id}"`);
    seen.add(attrs.id);
  });

  // ── Structured data ──
  const faqQuestions = [];
  for (const [, json] of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)) {
    try {
      const data = JSON.parse(json);
      const nodes = data['@graph'] || [data];
      nodes
        .filter((n) => n['@type'] === 'FAQPage')
        .forEach((n) => n.mainEntity.forEach((q) => faqQuestions.push(q.name)));
    } catch (err) {
      fail(where, `invalid JSON-LD: ${err.message}`);
    }
  }
  const visibleText = normaliseQuotes(decodeEntities(html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<[^>]+>/g, ' ')));
  faqQuestions.forEach((q) => {
    if (!visibleText.includes(normaliseQuotes(q))) fail(where, `FAQ schema question not visible on page: "${q}"`);
  });

  // ── Images ──
  tags
    .filter((t) => t.name === 'img')
    .forEach(({ attrs }) => {
      if (!('alt' in attrs)) fail(where, `<img src="${attrs.src}"> is missing alt`);
      if (!attrs.width || !attrs.height) fail(where, `<img src="${attrs.src}"> should declare width and height`);
    });

  // ── Forms ──
  const labelled = new Set(tags.filter((t) => t.name === 'label' && t.attrs.for).map((t) => t.attrs.for));
  tags
    .filter((t) => ['input', 'select', 'textarea'].includes(t.name) && t.attrs.type !== 'hidden')
    .forEach(({ name, attrs }) => {
      if (attrs['aria-label'] || attrs['aria-labelledby']) return;
      if (!attrs.id) {
        if (attrs.type !== 'checkbox') fail(where, `<${name} name="${attrs.name}"> has no id/label`);
        return;
      }
      if (!labelled.has(attrs.id)) fail(where, `<${name} id="${attrs.id}"> has no <label for>`);
    });

  // ── Links, assets and icons ──
  tags.forEach(({ name, attrs }) => {
    if (attrs.target === '_blank' && !/noopener/.test(attrs.rel || '')) {
      fail(where, `<${name} href="${attrs.href}"> opens a new tab without rel="noopener"`);
    }
    const urls = [];
    if (attrs.href !== undefined) urls.push(attrs.href);
    if (attrs.src !== undefined) urls.push(attrs.src);
    if (attrs.srcset) urls.push(...attrs.srcset.split(',').map((s) => s.trim().split(/\s+/)[0]));

    urls.forEach((url) => {
      if (!url) return fail(where, `<${name}> has an empty URL`);
      if (/^(?:https?:|mailto:|tel:|data:|\/\/)/i.test(url)) return;
      const { file: target, fragment } = resolveLocal(base, file, url);
      if (!existsSync(target)) return fail(where, `broken link "${url}"`);
      if (fragment && /\.(html|svg)$/.test(target) && !idsIn(target).has(fragment)) {
        fail(where, `"${url}" points to a missing id "#${fragment}"`);
      }
    });
  });
}

function checkSitemap(base) {
  const file = path.join(base, 'sitemap.xml');
  if (!existsSync(file)) return fail('sitemap.xml', 'missing');
  for (const [, loc] of read(file).matchAll(/<loc>([^<]+)<\/loc>/g)) {
    if (!loc.startsWith(SITE_ORIGIN)) fail('sitemap.xml', `unexpected origin in ${loc}`);
    const rel = loc.slice(SITE_ORIGIN.length).replace(/^\//, '') || 'index.html';
    if (!existsSync(path.join(base, rel))) fail('sitemap.xml', `${loc} has no matching file`);
  }
  if (!/Sitemap:\s*https:\/\/agmiex\.com\/sitemap\.xml/.test(read(path.join(base, 'robots.txt')))) {
    fail('robots.txt', 'does not reference the sitemap');
  }
}

function checkMirrors() {
  for (const { source, target } of MIRRORS) {
    const expected = mirrorHtml(read(path.join(ROOT, source)), source);
    const actualPath = path.join(ROOT, target);
    if (!existsSync(actualPath) || read(actualPath) !== expected) {
      fail(target, `out of date with ${source} — run \`npm run build\``);
    }
  }
}

const targets = [{ label: 'source', base: ROOT }];
if (existsSync(path.join(DIST, 'index.html'))) targets.push({ label: 'dist', base: DIST });

for (const { base } of targets) {
  [...PAGES, ...MIRRORS.map((m) => m.target)].forEach((page) => checkPage(base, page));
  checkSitemap(base);
}
checkMirrors();

if (failures.length) {
  console.error(`\n  ✗ ${failures.length} site check(s) failed:\n`);
  failures.forEach((f) => console.error(`    • ${f}`));
  console.error('');
  process.exit(1);
}
console.log(`  ✓ Site checks passed (${targets.map((t) => t.label).join(' + ')})`);
