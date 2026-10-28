#!/usr/bin/env python3
"""Browser regression for private two-pass Florentine Codex collation drafts."""
import json
from pathlib import Path
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
MIME = {".js": "text/javascript", ".json": "application/json", ".html": "text/html", ".css": "text/css"}

with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True, args=["--no-sandbox"])
    page = browser.new_page(accept_downloads=True, viewport={"width": 1150, "height": 850})
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    def serve(route):
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
            route.fulfill(status=200, content_type="text/javascript",
                          body="window.TLAHTOLLI_CLOUD_CONFIG={url:'',publishableKey:''};")
            return
        route.fulfill(status=200, body=file.read_bytes(),
                      content_type=MIME.get(file.suffix, "text/plain"))
    page.route("**/*", serve)
    page.goto("https://tlahtolli.test/", wait_until="load", timeout=30000)
    page.locator("#tabTranslator").click()
    page.locator("#codexDoublePassPanel").evaluate("(e)=>e.open=true")
    page.wait_for_function("document.querySelectorAll('#codexDoublePassReview .cdp-card').length === 5")
    assert "0 / 5 regions" in page.locator("#codexDoublePassReview").inner_text()
    card = page.locator("#codexDoublePassReview .cdp-card").first
    fields = card.locator("input")
    fields.nth(0).fill("Nahuatl column, handwritten lines 12–13")
    fields.nth(1).fill("crop x=400..600, y=600..700 of referenced image")
    fields.nth(2).fill("First reader")
    fields.nth(3).fill("Second reader")
    areas = card.locator("textarea")
    areas.nth(0).fill("atl yitic ne\nmjnj")
    areas.nth(1).fill("atl yitic ne\nmjni")
    card.get_by_role("button", name="Save local draft and compare readings").click()
    assert "READINGS DISAGREE" in card.locator(".cdp-status").inner_text()
    assert card.locator(".cdp-status").get_attribute("data-verdict") == "disagreement"

    areas.nth(1).fill("atl yitic ne\nmjnj")
    card.get_by_role("button", name="Save local draft and compare readings").click()
    assert "NOT verified paleography" in card.locator(".cdp-status").inner_text()
    assert "1 / 5 agreeing" in page.locator("#codexDoublePassReview").inner_text()
    with page.expect_download() as info:
        page.get_by_role("button", name="Export all local readings as JSON").click()
    exported = json.loads(Path(info.value.path()).read_text(encoding="utf-8"))
    assert exported["gold_standard"] is False
    assert exported["train_eligible"] is False
    assert len(exported["records"]) == 5
    rec = exported["records"][0]
    assert rec["comparison"] == "textual_agreement_only"
    assert rec["first"]["reading"] == "atl yitic ne\nmjnj"
    assert rec["second"]["reading"] == "atl yitic ne\nmjnj"
    assert rec["facsimile_certified"] is False
    assert rec["translation_certified"] is False
    assert rec["train_eligible"] is False

    page.reload(wait_until="load")
    page.locator("#tabTranslator").click()
    page.locator("#codexDoublePassPanel").evaluate("(e)=>e.open=true")
    page.wait_for_function("document.querySelectorAll('#codexDoublePassReview .cdp-card').length === 5")
    assert page.locator("#codexDoublePassReview .cdp-card textarea").first.input_value() == "atl yitic ne\nmjnj"
    assert "1 / 5 regions" in page.locator("#codexDoublePassReview").inner_text()

    # A single named reader cannot satisfy the separate-reader requirement.
    first = page.locator("#codexDoublePassReview .cdp-card").first
    first.locator("input").nth(3).fill("First reader")
    first.get_by_role("button", name="Save local draft and compare readings").click()
    assert "Two distinct named readers" in first.locator(".cdp-status").inner_text()
    assert not errors, errors
    print("PASS: literal independent readings, disagreement detection, non-certifying export, persistence and same-reader refusal")
    browser.close()
