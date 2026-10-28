#!/usr/bin/env python3
"""Browser test: provisional Codex notes are visible and verification is gated."""
from pathlib import Path
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
MIME = {".js":"text/javascript",".json":"application/json",".html":"text/html",".css":"text/css"}

with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,args=["--no-sandbox"])
    page=browser.new_page(viewport={"width":1200,"height":850})
    errors=[]
    page.on("pageerror", lambda err: errors.append(str(err)))
    dialogs=[]
    def on_dialog(d):
        dialogs.append(d.message)
        d.accept()
    page.on("dialog",on_dialog)
    def serve(route):
        u=urlsplit(route.request.url)
        if u.hostname!="tlahtolli.test":
            route.abort()
            return
        path=u.path.lstrip("/") or "index.html"
        file=ROOT/path
        if not file.is_file() or not file.resolve().is_relative_to(ROOT.resolve()):
            route.fulfill(status=404,body="Not found")
            return
        if path=="cloud-config.js":
            route.fulfill(status=200,content_type="text/javascript",body="window.TLAHTOLLI_CLOUD_CONFIG={url:'',publishableKey:''};")
            return
        route.fulfill(status=200,body=file.read_bytes(),content_type=MIME.get(file.suffix,"text/plain"))
    page.route("**/*",serve)
    page.goto("https://tlahtolli.test/",wait_until="load",timeout=30000)
    page.locator("#tabTranslator").click()
    page.locator("#codexCloseReadingPanel").evaluate("(x)=>x.open=true")
    page.wait_for_function("document.querySelectorAll('#codexCloseReading .codex-clr-row').length===6",timeout=30000)
    panel=page.locator("#codexCloseReading")
    page.locator("#codexFacsimileReviewPanel").evaluate("(x)=>x.open=true")
    page.wait_for_function("document.querySelectorAll('#codexFacsimileReview .codex-clr-row').length===2")
    image_panel=page.locator("#codexFacsimileReview")
    assert "5 localized visual observations" in image_panel.inner_text()
    assert "ZERO certified diplomatic lines" in image_panel.inner_text()
    assert "62r" in image_panel.inner_text() and "209v" in image_panel.inner_text()
    assert "16 analyzed word occurrences" in panel.inner_text()
    assert "No manuscript line has yet been certified" in panel.inner_text()
    assert "atl yitic nemjnj" in panel.inner_text()
    assert "possessed relational noun" in panel.inner_text()
    assert "like a shield" in panel.inner_text()
    assert "facsimile checked: NO" in panel.inner_text()
    panel.locator(".codex-clr-row").first.get_by_role("button",name="Analyze this excerpt").click()
    assert "atl yitic nemjnj" in page.locator("#translatorInput").input_value()
    page.wait_for_function("document.querySelector('#codexContextMatches').textContent.includes('Codex contextual grammar notes')",timeout=10000)
    assert "yitic" in page.locator("#codexContextMatches").inner_text()
    page.locator("#corpusIntegrity").evaluate("(x)=>x.open=true")
    page.wait_for_function("document.querySelectorAll('#corpusIntegrityMount .ci-entry').length>=3")
    entry=page.locator("#corpusIntegrityMount .ci-entry").first
    entry.get_by_role("button",name="Review passage").click()
    entry.locator('[data-key="checked_by"]').fill("Test reviewer")
    entry.locator('[data-key="source_status"]').select_option("facsimile_checked")
    entry.get_by_role("button",name="Save local review").click()
    assert any("exact source-image HTTPS URL, folio, and physical line range" in msg for msg in dialogs)
    assert not errors,errors
    print("PASS: six source-aware Codex notes, translator bridge, exact-folio source gate and no JS errors")
    browser.close()
