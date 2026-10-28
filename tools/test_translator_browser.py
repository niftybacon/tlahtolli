#!/usr/bin/env python3
"""Browser regression: translator is a native Tlahtōlli tab, not a separate page."""
from pathlib import Path
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
MIME = {".js": "text/javascript", ".json": "application/json",
        ".html": "text/html", ".css": "text/css"}
with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True, args=["--no-sandbox"])
    page = browser.new_page(accept_downloads=True, viewport={"width": 1100, "height": 850})
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))

    def respond(route):
        url = urlsplit(route.request.url)
        if url.hostname != "tlahtolli.test":
            route.abort()
            return
        path = url.path.lstrip("/") or "index.html"
        file = ROOT / path
        if not file.is_file() or not file.resolve().is_relative_to(ROOT.resolve()):
            route.fulfill(status=404, body="Not found")
            return
        if path == "cloud-config.js":
            # Keep testing independent of real Supabase credentials and network.
            route.fulfill(status=200, content_type="text/javascript",
                          body="window.TLAHTOLLI_CLOUD_CONFIG={url:'',publishableKey:''};")
            return
        route.fulfill(status=200, body=file.read_bytes(),
                      content_type=MIME.get(file.suffix, "text/plain"))

    page.route("**/*", respond)
    page.goto("https://tlahtolli.test/", wait_until="load", timeout=30000)
    page.locator("#tabTranslator").click()
    page.wait_for_function("document.querySelector('#translatorStatus').textContent.includes('115')")
    assert page.locator("#translatorView").is_visible(), "Translator tab did not open"
    assert page.locator("#dictionaryView").is_hidden(), "Dictionary remained visible"
    assert page.locator("#tabTranslator").get_attribute("aria-selected") == "true"
    page.locator("#translatorInput").fill("in xōchitl in cuīcatl")
    page.locator("#translatorForm button[type=submit]").click()
    assert "[flower]" in page.locator("#translatorGloss").inner_text()
    assert page.locator("#translatorAnalyses .translator-word").count() == 4
    page.locator("#translatorExample").click()
    assert "mirror" in page.locator("#translatorPassages").inner_text().lower()
    assert "Not an approved translation training pair" in page.locator("#translatorPassages").inner_text()
    page.locator("#translatorInput").fill("zzzyxxy")
    page.locator("#translatorForm button[type=submit]").click()
    assert "Unindexed form" in page.locator("#translatorAnalyses").inner_text()
    page.locator("#translatorInput").fill("nimitzchīhua")
    page.locator("#translatorForm button[type=submit]").click()
    assert page.locator("#translatorAnalyses .translator-morph-panel").count() >= 1, "Advanced morphological proposals missing"
    assert "Tēntli morphology engine" in page.locator("#translatorMorphStatus").inner_text()
    page.locator("#translatorLukeExample").click()
    assert page.locator("#translatorOrthography").input_value() == "luke1833"
    assert "Yacuic" in page.locator("#translatorInput").input_value()
    page.locator("#codexAtlas").evaluate("(e)=>e.open=true")
    page.wait_for_function("document.querySelectorAll('#codexBookRows tr').length === 12")
    assert '291,900' in page.locator('#codexSummary').inner_text()
    page.locator("#lukeAtlas").evaluate("(e)=>e.open=true")
    page.wait_for_function("document.querySelector('#lukeSummary')?.textContent.includes('26,201')")
    assert '1833' in page.locator('#lukeAtlas').inner_text()
    page.locator("#translatorInput").fill("yhuan")
    page.locator("#translatorOrthography").select_option('luke1833')
    page.locator("#translatorForm button[type=submit]").click()
    assert 'īhuān' in page.locator('#translatorAnalyses').inner_text()
    assert '1833 Luke unverified OCR' in page.locator('#translatorAnalyses').inner_text()
    page.locator('#codexBookSelect').select_option('6')
    assert 'Rhetoric' in page.locator('#codexBookDetail').inner_text()
    assert 'Not' not in page.locator('#codexSummary').inner_text()

    page.locator("#tabStudy").click()
    assert page.locator("#translatorView").is_hidden()
    assert page.locator("#studyView").is_visible()
    page.locator("#tabTranslator").click()
    assert page.locator("#translatorView").is_visible()
    assert not errors, f"Unexpected browser JS errors: {errors}"
    print("PASS: integrated translator tab, lexical gloss, sourced passage, unknown-word caution and navigation")
    browser.close()
