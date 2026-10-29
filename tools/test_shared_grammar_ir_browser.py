#!/usr/bin/env python3
"""Browser integration of the bounded shared grammar graph. Not translation gold."""
import json
from pathlib import Path
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
p = json.loads((ROOT / "paradigms.json").read_text(encoding="utf-8"))["paradigms"]
matrix = p["mati"]["cells"][0][0]
relative = p["chōca"]["cells"][0][2]
live = p["nemi"]["cells"][0][2]
sentence = matrix + " in " + matrix + " in iicxi in " + relative
input_text = sentence + ". " + relative + " in cihuātl. " + live + "."

with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True, args=["--no-sandbox"])
    page = browser.new_page(viewport={"width": 1200, "height": 950})
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))

    def serve(route):
        url = urlsplit(route.request.url)
        if url.hostname != "tlahtolli.test":
            route.abort()
            return
        rel = url.path.lstrip("/") or "index.html"
        file = (ROOT / rel).resolve()
        if not file.is_relative_to(ROOT.resolve()) or not file.is_file():
            route.fulfill(status=404, body="Not found")
            return
        if rel == "cloud-config.js":
            route.fulfill(status=200, content_type="text/javascript",
                          body="window.TLAHTOLLI_CLOUD_CONFIG={url:'',publishableKey:''};")
            return
        content_type = {".html": "text/html", ".js": "text/javascript",
                        ".json": "application/json"}.get(file.suffix, "text/plain")
        route.fulfill(status=200, body=file.read_bytes(), content_type=content_type)

    page.route("**/*", serve)
    page.goto("https://tlahtolli.test/", wait_until="load")
    page.locator("#tabTranslator").click()
    page.wait_for_function(
        "() => document.querySelector('#translatorStatus')?.textContent.includes('115')"
    )

    def analyze(value):
        page.locator("#translatorInput").fill(value)
        page.locator("#translatorForm button[type=submit]").click()

    analyze(input_text)
    panel = page.locator("#translatorPassages .translator-shared-grammar-ir")
    assert panel.count() == 1, "Shared grammar panel should show for nested input"
    panel.evaluate("(node) => node.open=true")
    rendered = panel.inner_text()
    assert "Shared grammatical representation" in rendered
    assert "3 clauses" in rendered
    assert "subordinate links" in rendered
    assert "possible antecedent" in rendered
    assert "iicxi" in rendered and "nominal possessor 3sg" in rendered
    assert "cihuātl" in rendered
    assert "NOT identity" in rendered
    assert "candidate" in rendered
    assert "translation" in rendered.lower()
    assert page.locator("#translatorPassages .translator-nested-in-proposals").count() == 1
    assert page.locator("#translatorPassages .translator-discourse-references").count() == 1

    analyze("in iicxi in " + relative)
    panel = page.locator("#translatorPassages .translator-shared-grammar-ir")
    panel.evaluate("(node) => node.open=true")
    assert "nominal possessor 3sg" in panel.inner_text()
    assert "possible-relative-gap" in panel.inner_text()

    analyze("in inxiuh in " + relative)
    panel = page.locator("#translatorPassages .translator-shared-grammar-ir")
    if panel.count():
        panel.evaluate("(node) => node.open=true")
        assert "nominal possessor 3sg" not in panel.inner_text()

    assert not errors, errors
    browser.close()
print("PASS: browser shared grammatical IR; nested clauses, cited possession, candidate-only discourse, historical refusals.")
