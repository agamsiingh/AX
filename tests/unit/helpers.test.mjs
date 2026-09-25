import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mailtoLink, whatsappLink } from '../../assets/js/config.js';
import { minifyHtml, mirrorHtml, rewriteRelativeUrls, stripDevBlocks } from '../../scripts/lib/site.mjs';

test('whatsappLink encodes prefilled text', () => {
  assert.equal(whatsappLink(), 'https://wa.me/918534855501');
  assert.equal(whatsappLink('Hi & ₹99?'), 'https://wa.me/918534855501?text=Hi%20%26%20%E2%82%B999%3F');
});

test('mailtoLink uses %20 for spaces so mail clients keep them', () => {
  const link = mailtoLink('Project enquiry', 'Line one\nLine two');
  assert.ok(link.startsWith('mailto:agamsbusiness@gmail.com?'));
  assert.ok(link.includes('subject=Project%20enquiry'));
  assert.ok(link.includes('body=Line%20one%0ALine%20two'));
  assert.ok(!link.includes('+'));
});

test('rewriteRelativeUrls prefixes only relative URLs', () => {
  const html =
    '<a href="index.html#faq"></a><a href="#top"></a><a href="https://x.dev"></a><a href="mailto:a@b.co"></a>' +
    '<img src="assets/a.png" srcset="assets/a-1.webp 400w, assets/a-2.webp 800w"><use href="assets/icons/sprite.svg#i-x"></use>' +
    '<a href="/terms.html"></a>';
  const out = rewriteRelativeUrls(html);
  assert.ok(out.includes('href="../index.html#faq"'));
  assert.ok(out.includes('href="#top"'));
  assert.ok(out.includes('href="https://x.dev"'));
  assert.ok(out.includes('href="mailto:a@b.co"'));
  assert.ok(out.includes('src="../assets/a.png"'));
  assert.ok(out.includes('srcset="../assets/a-1.webp 400w, ../assets/a-2.webp 800w"'));
  assert.ok(out.includes('href="../assets/icons/sprite.svg#i-x"'));
  assert.ok(out.includes('href="/terms.html"'));
});

test('mirrorHtml adds a generated-file notice after the doctype', () => {
  const out = mirrorHtml('<!DOCTYPE html>\n<html></html>', 'book-demo.html');
  assert.match(out, /^<!DOCTYPE html>\n<!-- Generated from book-demo\.html/);
});

test('minifyHtml collapses markup but preserves <pre>, scripts and JSON-LD content', () => {
  const html = [
    '<div>',
    '  <!-- a comment -->',
    '  <p>Hello   world</p>',
    '</div>',
    '<pre>line 1\n  line 2</pre>',
    '<script>var a = 1;\n var b = 2;</script>',
    '<script type="application/ld+json">{ "a": 1,\n "b": [1, 2] }</script>',
  ].join('\n');
  const out = minifyHtml(html);
  assert.ok(out.includes('<div><p>Hello world</p></div>'));
  assert.ok(!out.includes('a comment'));
  assert.ok(out.includes('<pre>line 1\n  line 2</pre>'));
  assert.ok(out.includes('var a = 1;\n var b = 2;'));
  assert.ok(out.includes('{"a":1,"b":[1,2]}'));
});

test('stripDevBlocks removes source-only preload hints', () => {
  const html = [
    '<head>',
    '  <!-- dev:start — x -->',
    '  <link rel="preload" href="a.css" as="style">',
    '  <!-- dev:end -->',
    '  <link rel="stylesheet" href="main.css">',
    '</head>',
  ].join('\n');
  const out = stripDevBlocks(html);
  assert.ok(!out.includes('preload'));
  assert.ok(out.includes('<link rel="stylesheet" href="main.css">'));
});
