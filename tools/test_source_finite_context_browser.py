#!/usr/bin/env python3
"""Exercise source-recorded finite analysis in the real browser Translator."""
from pathlib import Path
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True, args=["--no-sandbox"])
    page = browser.new_page(viewport={"width": 1200, "height": 900})
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))

    def serve(route):
        uri = urlsplit(route.request.url)
        if uri.hostname != "tlahtolli.test":
            route.abort()
            return
        rel = uri.path.lstrip("/") or "index.html"
        f = (ROOT / rel).resolve()
        if not f.is_file() or not f.is_relative_to(ROOT.resolve()):
            route.fulfill(status=404, body="Not found")
            return
        if rel == "cloud-config.js":
            route.fulfill(status=200, content_type="text/javascript",
                          body="window.TLAHTOLLI_CLOUD_CONFIG={url:'',publishableKey:''};")
            return
        typ = {".html":"text/html", ".js":"text/javascript",
               ".json":"application/json"}.get(f.suffix, "text/plain")
        route.fulfill(status=200, body=f.read_bytes(), content_type=typ)

    page.route("**/*", serve)
    page.goto("https://tlahtolli.test/", wait_until="load")
    page.locator("#tabTranslator").click()
    page.wait_for_function("() => document.querySelector('#translatorStatus')?.textContent.includes('118')")

    def analyze(value):
        page.locator("#translatorInput").fill(value)
        page.locator("#translatorForm button[type=submit]").click()
        return page.locator("#translatorPassages")

    for value, lemma, marker in (
        ("qujça in xochitl", "quiza", "ONLY IF unresolved verb person is 3sg"),
        ("in xochitl qujça", "quiza", "ONLY IF unresolved verb person is 3sg"),
        ("cen tipolihui", "polihui", "2sg"),
        ("tipolihui cen", "polihui", "2sg"),
        ("itech qujça", "quiza", "Relational: itech"),
        ("qujça itech", "quiza", "Relational: itech"),
    ):
        panel = analyze(value).locator(".translator-source-finite-proposals")
        assert panel.count() == 1, value
        panel.evaluate("(node)=>node.open=true")
        text = panel.inner_text()
        assert lemma in text and marker in text and "NOT a translation" in text, text
        assert "NOT thereby attested" in text, text
        assert panel.get_by_role("link", name="Inspect source finite form and clause evidence").count() >= 2

    for value, marker, is_witness in (
        ("itech qujça xochitl", "UNRESOLVED", True),
        ("itech qujça in xochitl", "ONLY IF unverified verb person is 3sg", False),
        ("in xochitl itech qujça", "ONLY IF unverified verb person is 3sg", False),
    ):
        panel = analyze(value).locator(".translator-source-finite-proposals")
        assert panel.count() == 1, f"No new source-finite structure for {value}"
        panel.evaluate("(node)=>node.open=true")
        contents = panel.inner_text()
        assert marker in contents and "Relational: itech" in contents
        assert "NOT a translation" in contents
        if is_witness:
            assert "Exact editorial witness: passage-3" in contents
            assert "grammar is NOT thereby verified" in contents
        else:
            assert "Exact editorial witness" not in contents
            assert "NOT thereby attested" in contents

    for value in ("tipolihui in cihuātl", "quiza in xochitl",
                  "qujça in xochitl extra", "ahmo qujça in xochitl",
                  "qujça in unknown", "qujça itech extra", "qujça?",
                  "itech qujça cihuātl", "itech qujça tlapalli",
                  "itech qujça xochitl extra", "itech tipolihui in xochitl"):
        assert analyze(value).locator(".translator-source-finite-proposals").count() == 0, value

    assert "I will see the woman" in analyze("niquittaz in cihuātl").inner_text()
    assert not errors, errors
    browser.close()
print("PASS browser source finite context: real Tēntli, 9 structural readings, 11 refusals, English regression.")
