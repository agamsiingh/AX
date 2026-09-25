/* Shared helpers for the build and check scripts (no dependencies). */

import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const DIST = path.join(ROOT, 'dist');

/** Pages that make up the live site (relative to ROOT). */
export const PAGES = ['index.html', 'book-demo.html', 'privacy-policy.html', 'terms.html', '404.html'];

/** Generated copy of book-demo.html served at /book-demo/ (kept for the existing pretty URL). */
export const MIRRORS = [{ source: 'book-demo.html', target: 'book-demo/index.html' }];

/** Static files and folders copied as-is into dist/. */
export const STATIC_ASSETS = ['robots.txt', 'sitemap.xml', 'site.webmanifest', 'favicon.ico', 'assets/img', 'assets/icons', 'assets/fonts'];

const SKIP_PREFIX = /^(?:[a-z][a-z0-9+.-]*:|\/\/|\/|#|\?)/i; // absolute URLs, root paths, anchors

function prefixUrl(url, prefix) {
  const trimmed = url.trim();
  return !trimmed || SKIP_PREFIX.test(trimmed) ? url : prefix + trimmed;
}

/**
 * Rewrite relative href/src/srcset URLs for a copy of a page that lives one or more
 * directories deeper than the original (e.g. book-demo.html → book-demo/index.html).
 */
export function rewriteRelativeUrls(html, prefix = '../') {
  return html
    .replace(/\b(href|src)="([^"]*)"/g, (_, attr, value) => `${attr}="${prefixUrl(value, prefix)}"`)
    .replace(/\bsrcset="([^"]*)"/g, (_, value) => {
      const rewritten = value
        .split(',')
        .map((candidate) => {
          const [url, ...descriptor] = candidate.trim().split(/\s+/);
          return [prefixUrl(url, prefix), ...descriptor].join(' ');
        })
        .join(', ');
      return `srcset="${rewritten}"`;
    });
}

export function mirrorHtml(sourceHtml, sourceName) {
  const notice = `<!-- Generated from ${sourceName} by \`npm run build\`. Edit ${sourceName} instead. -->`;
  return rewriteRelativeUrls(sourceHtml).replace(/^<!DOCTYPE html>\s*/i, `<!DOCTYPE html>\n${notice}\n`);
}

/** Remove blocks that only make sense for the unbundled source (see the dev:start comments). */
export function stripDevBlocks(html) {
  return html.replace(/[ \t]*<!-- dev:start[\s\S]*?<!-- dev:end -->\s*/g, '');
}

const PRESERVE = /(<pre[\s\S]*?<\/pre>|<textarea[\s\S]*?<\/textarea>|<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>)/gi;

export function minifyHtml(html) {
  return html
    .split(PRESERVE)
    .map((chunk, index) => {
      if (index % 2 === 1) {
        // Compact JSON-LD; leave other preserved blocks untouched.
        const json = chunk.match(/^(<script type="application\/ld\+json">)([\s\S]*)(<\/script>)$/i);
        return json ? json[1] + JSON.stringify(JSON.parse(json[2])) + json[3] : chunk;
      }
      // Drop comments, remove line-break indentation between tags, collapse the rest.
      return chunk
        .replace(/<!--(?!\s*Generated)[\s\S]*?-->/g, '')
        .replace(/>\s*\n\s*</g, '><')
        .replace(/\s+/g, ' ');
    })
    .join('')
    .trim();
}
