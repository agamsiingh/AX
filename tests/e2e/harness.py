"""Shared harness for the AGMIEX end-to-end QA: static server, network mocks, reporting."""

import functools
import gzip
import http.server
import json
import pathlib
import socketserver
import threading

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / "tests" / "e2e" / "output"

SUPABASE_REST = "https://enymspckgosfeqbjlkab.supabase.co/rest/v1/"
RAZORPAY_URL = "https://rzp.io/rzp/GdtBvmmE"

VIEWPORTS = {
    "mobile": dict(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True, device_scale_factor=2),
    "tablet": dict(viewport={"width": 820, "height": 1180}, is_mobile=True, has_touch=True, device_scale_factor=2),
    "desktop": dict(viewport={"width": 1440, "height": 900}),
}


class Report:
    """Collects named checks; prints a summary and returns an exit code."""

    def __init__(self):
        self.results = []
        self.notes = []

    def check(self, ok, name, detail=""):
        self.results.append({"ok": bool(ok), "name": name, "detail": str(detail)[:400]})
        mark = "PASS" if ok else "FAIL"
        print(f"  [{mark}] {name}" + (f" — {detail}" if detail and not ok else ""))
        return ok

    def note(self, text):
        self.notes.append(text)
        print(f"  [INFO] {text}")

    def finish(self):
        failed = [r for r in self.results if not r["ok"]]
        OUT.mkdir(parents=True, exist_ok=True)
        (OUT / "report.json").write_text(json.dumps({"results": self.results, "notes": self.notes}, indent=2), "utf-8")
        print(f"\n  {len(self.results) - len(failed)}/{len(self.results)} checks passed")
        for r in failed:
            print(f"   ✗ {r['name']}: {r['detail']}")
        return 1 if failed else 0


class _Handler(http.server.SimpleHTTPRequestHandler):
    """Static handler that gzips text and serves 404.html (with a 404 status), like most static hosts."""

    COMPRESSIBLE = (".html", ".css", ".js", ".svg", ".json", ".webmanifest", ".xml", ".txt")

    def log_message(self, *args):
        pass

    def do_GET(self):
        path = pathlib.Path(self.translate_path(self.path))
        if path.is_dir():
            path = path / "index.html"
        if (path.is_file() and path.suffix in self.COMPRESSIBLE
                and "gzip" in self.headers.get("Accept-Encoding", "")):
            body = gzip.compress(path.read_bytes(), 6)
            self.send_response(200)
            self.send_header("Content-Type", self.guess_type(str(path)))
            self.send_header("Content-Encoding", "gzip")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        super().do_GET()

    def send_error(self, code, message=None, explain=None):
        page = pathlib.Path(self.directory) / "404.html"
        if code == 404 and page.exists():
            body = page.read_bytes()
            self.send_response(404)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        super().send_error(code, message, explain)


def start_server(base: pathlib.Path):
    handler = functools.partial(_Handler, directory=str(base))
    httpd = socketserver.ThreadingTCPServer(("127.0.0.1", 0), handler)
    httpd.daemon_threads = True
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd, f"http://127.0.0.1:{httpd.server_address[1]}"


class SupabaseMock:
    """Intercepts Supabase REST calls so tests never write to the production database."""

    def __init__(self):
        self.mode = "ok"
        self.requests = []

    def handle(self, route, request):
        table = request.url.split("/rest/v1/")[1].split("?")[0]
        try:
            body = json.loads(request.post_data or "null")
        except ValueError:
            body = request.post_data
        self.requests.append({"table": table, "method": request.method, "body": body, "headers": request.headers})
        if self.mode == "network":
            return route.abort("failed")
        if self.mode == "error":
            return route.fulfill(status=401, content_type="application/json",
                                 body=json.dumps({"code": "42501", "message": "new row violates row-level security policy"}))
        if self.mode == "duplicate":
            return route.fulfill(status=409, content_type="application/json",
                                 body=json.dumps({"code": "23505", "message": "duplicate key value"}))
        return route.fulfill(status=201, body="")


def new_context(browser, viewport_name, supabase: SupabaseMock, **extra):
    ctx = browser.new_context(**VIEWPORTS[viewport_name], **extra)
    ctx.route(SUPABASE_REST + "**", supabase.handle)
    ctx.route("https://rzp.io/**", lambda route, _req: route.fulfill(
        status=200, content_type="text/html", body="<!doctype html><title>Razorpay (stub)</title><p>stub</p>"))
    return ctx


def attach_error_collectors(page, origin):
    """Returns a list that fills with first-party console errors, page errors and failed local requests."""
    problems = []
    page.on("pageerror", lambda err: problems.append(f"pageerror: {err}"))

    def on_console(msg):
        if msg.type != "error":
            return
        url = (msg.location or {}).get("url", "")
        if not url or url.startswith(origin):
            problems.append(f"console: {msg.text}")

    page.on("console", on_console)
    page.on("response", lambda r: problems.append(f"HTTP {r.status}: {r.url}")
            if r.url.startswith(origin) and r.status >= 400 else None)
    page.on("requestfailed", lambda r: problems.append(f"requestfailed: {r.url}")
            if r.url.startswith(origin) else None)
    return problems


SCROLL_THROUGH = """async () => {
  const step = Math.max(200, innerHeight * 0.7);
  for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
    window.scrollTo({ top: y, behavior: 'instant' });
    await new Promise(r => setTimeout(r, 90));
  }
  window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' });
  await new Promise(r => setTimeout(r, 400));
  window.scrollTo({ top: 0, behavior: 'instant' });
}"""
