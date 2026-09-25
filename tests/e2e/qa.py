"""End-to-end QA for the AGMIEX website (Playwright for Python).

Usage:
    python tests/e2e/qa.py            # test the source (repo root)
    python tests/e2e/qa.py --dist     # test the production build (run `npm run build` first)
    python tests/e2e/qa.py --no-axe   # skip axe-core (needs network access to cdn.jsdelivr.net)

Requires: pip install playwright && python -m playwright install chromium
Supabase and Razorpay are always mocked: no rows are written and no payments are opened.
Screenshots and report.json are written to tests/e2e/output/.
"""

import argparse
import sys
from urllib.parse import urlparse

from playwright.sync_api import sync_playwright

sys.path.insert(0, str(__import__("pathlib").Path(__file__).parent))
from harness import OUT, ROOT, SCROLL_THROUGH, Report, SupabaseMock, attach_error_collectors, new_context, start_server  # noqa: E402
import interactions  # noqa: E402

PAGES = ["/index.html", "/book-demo.html", "/book-demo/", "/privacy-policy.html", "/terms.html", "/404.html"]
AXE_CDN = "https://cdn.jsdelivr.net/npm/axe-core@4.10.2/axe.min.js"

OVERFLOW_JS = """() => {
  const vw = document.documentElement.clientWidth;
  return [...document.querySelectorAll('body *')].filter(e => {
    const r = e.getBoundingClientRect(); const cs = getComputedStyle(e);
    if (!r.width || cs.position === 'fixed' || cs.visibility === 'hidden') return false;
    for (let p = e.parentElement; p; p = p.parentElement) {
      const o = getComputedStyle(p).overflowX; if (o === 'hidden' || o === 'auto' || o === 'clip' || o === 'scroll') return false;
    }
    return r.right > vw + 1 || r.left < -1;
  }).slice(0, 5).map(e => `${e.tagName.toLowerCase()}.${[...e.classList].join('.')}`);
}"""

TAP_TARGETS_JS = """() => [...document.querySelectorAll('a[href], button, input, select, textarea')].filter(e => {
  const target = e.closest('label') || e;  // a wrapping <label> is part of the hit area
  const r = target.getBoundingClientRect(); if (!r.width || !r.height) return false;
  if (e.closest('p, li.chip, .prose, .form-footnote, .breadcrumbs, .mobile-menu__contact, address')) return false;
  const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || cs.display === 'none') return false;
  return r.width < 24 || r.height < 24;
}).map(e => `${e.tagName.toLowerCase()} "${(e.textContent || e.getAttribute('aria-label') || '').trim().slice(0, 30)}" ${Math.round(e.getBoundingClientRect().width)}x${Math.round(e.getBoundingClientRect().height)}`)"""


def sweep(browser, base, report, screens):
    """Every page × viewport × theme: errors, overflow, reveals, images, tap targets, screenshots."""
    for page_path in PAGES:
        for vp in ("mobile", "tablet", "desktop"):
            for theme in ("light", "dark"):
                if vp == "tablet" and theme == "dark":
                    continue
                ctx = new_context(browser, vp, SupabaseMock(), color_scheme=theme)
                page = ctx.new_page()
                problems = attach_error_collectors(page, base)
                page.goto(base + page_path, wait_until="load")
                page.evaluate(SCROLL_THROUGH)
                page.wait_for_timeout(300)
                label = f"{page_path} [{vp}/{theme}]"
                report.check(not problems, f"errors: none on {label}", "; ".join(problems[:4]))
                overflow = page.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
                offenders = page.evaluate(OVERFLOW_JS)
                report.check(overflow <= 0 and not offenders, f"layout: no horizontal overflow on {label}", f"{overflow}px {offenders}")
                hidden = page.evaluate("[...document.querySelectorAll('[data-reveal]')].filter(e => !e.classList.contains('is-visible')).length")
                report.check(hidden == 0, f"animation: all reveal blocks shown after scrolling {label}", f"{hidden} hidden")
                broken = page.evaluate("[...document.images].filter(i => i.getBoundingClientRect().width && (!i.complete || !i.naturalWidth)).map(i => i.currentSrc || i.src)")
                report.check(not broken, f"images: all visible images loaded on {label}", broken)
                if vp == "mobile" and theme == "light":
                    small = page.evaluate(TAP_TARGETS_JS)
                    report.check(not small, f"mobile: tap targets ≥ 24px on {page_path}", small[:5])
                if screens:
                    # Full-page captures don't scroll, so render content-visibility:auto sections explicitly.
                    page.add_style_tag(content="main > .section { content-visibility: visible !important; }")
                    name = page_path.strip("/").replace("/", "_").replace(".html", "") or "index"
                    page.screenshot(path=str(OUT / f"{name}-{vp}-{theme}.png"), full_page=True)
                ctx.close()


def crawl_links(browser, base, report):
    """Every internal link on every page resolves; anchors exist; external links are safe."""
    ctx = new_context(browser, "desktop", SupabaseMock())
    page = ctx.new_page()
    external, checked = set(), {}
    for page_path in PAGES:
        page.goto(base + page_path)
        hrefs = page.evaluate("[...document.querySelectorAll('a[href]')].map(a => [a.getAttribute('href'), a.href, a.target, a.rel])")
        for raw, absolute, target, rel in hrefs:
            if absolute.startswith(("mailto:", "tel:")):
                continue
            if not absolute.startswith(base):
                external.add(absolute.split("?")[0])
                if target == "_blank" and "noopener" not in rel:
                    report.check(False, f"links: {raw} on {page_path} opens without noopener")
                continue
            url, _, frag = absolute.partition("#")
            if url not in checked:
                checked[url] = ctx.request.get(url).status
            ok = checked[url] == 200
            if ok and frag:
                sub = ctx.new_page()
                sub.goto(url)
                ok = sub.evaluate("id => !!document.getElementById(id)", frag)
                sub.close()
            if not ok:
                report.check(False, f"links: {raw} on {page_path} is broken", checked[url])
    report.check(all(s == 200 for s in checked.values()), f"links: {len(checked)} internal URLs return 200")
    report.note("external destinations: " + ", ".join(sorted({urlparse(u).netloc for u in external})))
    ctx.close()


def accessibility(browser, base, report):
    for vp, theme in (("desktop", "light"), ("desktop", "dark"), ("mobile", "light"), ("mobile", "dark")):
        ctx = new_context(browser, vp, SupabaseMock(), color_scheme=theme)
        page = ctx.new_page()
        for page_path in PAGES:
            page.goto(base + page_path, wait_until="load")
            page.evaluate(SCROLL_THROUGH)
            page.wait_for_timeout(1500)  # let entrance animations finish before measuring contrast
            try:
                page.add_script_tag(url=AXE_CDN)
            except Exception as err:
                report.note(f"axe-core unavailable ({err.__class__.__name__}); skipping accessibility scan")
                ctx.close()
                return
            result = page.evaluate("""async () => {
              const r = await axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] });
              return r.violations.map(v => ({ id: v.id, impact: v.impact, n: v.nodes.length,
                where: v.nodes.slice(0, 3).map(n => n.target.join(' ')) }));
            }""")
            serious = [v for v in result if v["impact"] in ("serious", "critical")]
            minor = [v for v in result if v["impact"] not in ("serious", "critical")]
            report.check(not serious, f"axe: no serious/critical issues on {page_path} [{vp}/{theme}]", serious)
            if minor:
                report.note(f"axe minor on {page_path} [{vp}/{theme}]: " + ", ".join(f"{v['id']}×{v['n']}" for v in minor))
        ctx.close()


def progressive_enhancement(browser, base, report):
    ctx = browser.new_context(java_script_enabled=False, viewport={"width": 1280, "height": 900})
    page = ctx.new_page()
    page.goto(base + "/index.html")
    report.check(page.evaluate("getComputedStyle(document.querySelector('.service-card')).opacity") == "1", "no-JS: content is visible")
    report.check(page.locator("#faq-3").is_visible(), "no-JS: FAQ answers readable")
    ctx.close()

    ctx = new_context(browser, "desktop", SupabaseMock(), reduced_motion="reduce")
    page = ctx.new_page()
    page.goto(base + "/index.html")
    report.check(page.evaluate("[...document.querySelectorAll('[data-reveal]')].every(e => e.classList.contains('is-visible'))"), "reduced motion: reveals skipped")
    report.check(page.evaluate("getComputedStyle(document.querySelector('.hero__rise')).animationDuration") in ("1e-05s", "0.00001s"), "reduced motion: hero animation disabled")
    ctx.close()


def seo(browser, base, report):
    ctx = new_context(browser, "desktop", SupabaseMock())
    page = ctx.new_page()
    for page_path in PAGES:
        page.goto(base + page_path)
        meta = page.evaluate("""() => ({
          title: document.title, lang: document.documentElement.lang,
          desc: document.querySelector('meta[name=description]')?.content || '',
          canonical: document.querySelector('link[rel=canonical]')?.href || '',
          robots: document.querySelector('meta[name=robots]')?.content || '',
          h1: document.querySelectorAll('h1').length,
          ld: [...document.querySelectorAll('script[type="application/ld+json"]')].map(s => { try { JSON.parse(s.textContent); return true } catch { return false } }),
        })""")
        ok = meta["title"] and meta["lang"] and 50 <= len(meta["desc"]) <= 170 and meta["h1"] == 1 and all(meta["ld"])
        if page_path == "/404.html":
            ok = ok and "noindex" in meta["robots"]
        else:
            ok = ok and meta["canonical"].startswith("https://agmiex.com/")
        report.check(ok, f"seo: metadata complete on {page_path}", meta)
    for asset in ("/robots.txt", "/sitemap.xml", "/site.webmanifest", "/favicon.ico", "/assets/img/og-image.jpg"):
        report.check(ctx.request.get(base + asset).status == 200, f"seo: {asset} served")
    ctx.close()


def performance(browser, base, report):
    """Throttled (≈ slow 4G, 4× CPU) load of the home page: LCP, CLS and first-party bytes."""
    ctx = new_context(browser, "mobile", SupabaseMock())
    page = ctx.new_page()
    cdp = ctx.new_cdp_session(page)
    cdp.send("Network.enable")
    cdp.send("Network.emulateNetworkConditions", {"offline": False, "latency": 150, "downloadThroughput": 1_600_000 / 8, "uploadThroughput": 750_000 / 8})
    cdp.send("Emulation.setCPUThrottlingRate", {"rate": 4})
    page.add_init_script("""
      window.__cls = 0; window.__lcp = 0;
      new PerformanceObserver(l => l.getEntries().forEach(e => { if (!e.hadRecentInput) window.__cls += e.value })).observe({ type: 'layout-shift', buffered: true });
      new PerformanceObserver(l => l.getEntries().forEach(e => { window.__lcp = e.startTime; window.__lcpEl = e.element ? e.element.tagName + '.' + e.element.className : e.url })).observe({ type: 'largest-contentful-paint', buffered: true });
    """)
    page.goto(base + "/index.html", wait_until="load")
    page.wait_for_timeout(2500)
    stats = page.evaluate("""() => ({
      lcp: Math.round(window.__lcp), lcpElement: window.__lcpEl, cls: +window.__cls.toFixed(3),
      fcp: Math.round(performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0),
      firstParty: Math.round(performance.getEntriesByType('resource').filter(r => r.name.startsWith(location.origin))
        .reduce((s, r) => s + (r.transferSize || r.encodedBodySize || 0), 0) / 1024),
      requests: performance.getEntriesByType('resource').length,
    })""")
    report.note(f"perf (throttled mobile, home, above-the-fold): {stats}")
    report.check(stats["lcp"] and stats["lcp"] < 2500, "perf: LCP under 2.5 s on throttled mobile", stats)
    report.check(stats["cls"] < 0.1, "perf: CLS under 0.1", stats)
    ctx.close()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dist", action="store_true", help="test dist/ instead of the source")
    parser.add_argument("--no-axe", action="store_true")
    parser.add_argument("--no-screens", action="store_true")
    args = parser.parse_args()

    base_dir = ROOT / "dist" if args.dist else ROOT
    if not (base_dir / "index.html").exists():
        sys.exit(f"{base_dir} has no index.html — run `npm run build` first.")
    OUT.mkdir(parents=True, exist_ok=True)
    httpd, base = start_server(base_dir)
    report = Report()
    print(f"Testing {'dist/' if args.dist else 'source'} at {base}")

    with sync_playwright() as p:
        browser = p.chromium.launch()
        steps = [("responsive sweep", lambda: sweep(browser, base, report, not args.no_screens)),
                 ("interactions", lambda: interactions.run_all(browser, base, report)),
                 ("links", lambda: crawl_links(browser, base, report)),
                 ("seo", lambda: seo(browser, base, report)),
                 ("progressive enhancement", lambda: progressive_enhancement(browser, base, report)),
                 ("performance", lambda: performance(browser, base, report))]
        if not args.no_axe:
            steps.append(("accessibility", lambda: accessibility(browser, base, report)))
        for name, step in steps:
            print(f"\n━━ {name} ━━")
            try:
                step()
            except Exception as err:
                report.check(False, f"{name} step crashed", repr(err))
        browser.close()
    httpd.shutdown()
    sys.exit(report.finish())


if __name__ == "__main__":
    main()
