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
    # The 1573 manuscript reading aid uses only a tiny editorial-assisted
    # excerpt. It must never claim that the low-resolution image was deciphered.
    desk=page.locator("#manuscriptReadingDesk")
    assert desk.count()==1
    desk.evaluate("(node)=>node.open=true")
    page.wait_for_function("""() => document.querySelector('#manuscriptReadingContent')
      ?.textContent.includes('ticnamaca y¯ totlal')""")
    reading=page.locator("#manuscriptReadingContent").inner_text()
    assert "NOT a decipherment" in reading
    assert "NOT independent evaluation data" in reading
    assert "abbreviation unresolved" in reading
    assert page.locator("#manuscriptReadingContent a[href*='BC16a000.png']").count()==1
    assert page.locator("#manuscriptReadingContent a[href*='/bc16/elements/']").count()==1
    page.locator("#manuscriptReadingContent .translator-actions button").click()
    assert page.locator("#translatorInput").input_value()=="ticnamaca y¯ totlal"
    assert "[?ticnamaca]" in page.locator("#translatorGloss").inner_text()
    assert "[?totlal]" in page.locator("#translatorGloss").inner_text()
    # Source interpretation must not become a confident contextual sentence.
    assert "No automatically inferred reading here is a verified historical word" in reading
    page.locator("#translatorInput").fill("in xōchitl in cuīcatl")
    page.locator("#translatorForm button[type=submit]").click()
    assert "[?xōchitl: multiple dictionary senses]" in page.locator("#translatorGloss").inner_text()
    assert "UNRESOLVED DICTIONARY SENSES" in page.locator("#translatorAnalyses").inner_text()
    assert "calendrical day sign" in page.locator("#translatorAnalyses").inner_text()
    assert page.locator("#translatorAnalyses .translator-word").count() == 4
    page.locator("#translatorInput").fill("iuhquin chimalli")
    page.locator("#translatorForm button[type=submit]").click()
    assert "Compositional comparison reading" in page.locator("#translatorPassages").inner_text()
    assert "like shield" in page.locator("#translatorPassages").inner_text()
    assert "not a verified passage translation" in page.locator("#translatorPassages").inner_text()
    page.locator("#translatorInput").fill("ahmo nichōca")
    page.locator("#translatorForm button[type=submit]").click()
    assert "I do not cry" in page.locator("#translatorPassages").inner_text()
    assert "grammar-derived candidate" in page.locator("#translatorPassages").inner_text()
    page.locator("#translatorInput").fill("ahmo niquittaz in cihuātl")
    page.locator("#translatorForm button[type=submit]").click()
    assert "I will not see the woman" in page.locator("#translatorPassages").inner_text()
    assert "future" in page.locator("#translatorPassages").inner_text()
    assert "wife (possessed)" in page.locator("#translatorPassages").inner_text()
    page.locator("#translatorInput").fill("quitta in cihuātl in conetl")
    page.locator("#translatorForm button[type=submit]").click()
    assert "Subject/object roles remain ambiguous" in page.locator("#translatorPassages").inner_text()
    assert "The woman sees the child" in page.locator("#translatorPassages").inner_text()
    assert "The child sees the woman" in page.locator("#translatorPassages").inner_text()
    page.locator("#translatorInput").fill("nichōca extra")
    page.locator("#translatorForm button[type=submit]").click()
    assert "no words were silently discarded" in page.locator("#translatorPassages").inner_text()
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
    page.locator('#lukeReviewLoad').click()
    page.wait_for_function("document.querySelectorAll('#lukeReviewItems .luke-review-card').length === 15")
    assert '0 mechanically joined' in page.locator('#lukeReviewCounts').inner_text()
    assert '400 unresolved' in page.locator('#lukeReviewCounts').inner_text()
    assert page.locator('#lukeVersePicker option').count() >= 700
    assert 'unverified' in page.locator('#lukeVersePreview').inner_text().lower()
    page.locator('#lukeReviewItems .luke-review-card').first.locator('button').first.click()
    assert 'Local review: accept' in page.locator('#lukeReviewItems .luke-review-card').first.inner_text()
    page.locator('#lukeReviewType').select_option('possible_spaced_word')
    assert page.locator('#lukeReviewItems .luke-review-card').count() >= 1

    page.locator("#translatorInput").fill("yhuan")
    page.locator("#translatorOrthography").select_option('luke1833')
    page.locator("#translatorForm button[type=submit]").click()
    assert 'īhuān' in page.locator('#translatorAnalyses').inner_text()
    assert '1833 Luke unverified OCR' in page.locator('#translatorAnalyses').inner_text()
    page.wait_for_function("document.querySelectorAll('#lukeChapterRows tr').length === 24")
    page.locator("#lukeChapterPicker").select_option("1")
    assert '1–80' in page.locator("#lukeChapterDetail").inner_text()
    assert 'NOT proofread' in page.locator("#lukeChapterDetail").inner_text()
    page.locator("#lukeChapterPicker").select_option("21")
    assert 'CUAITL' in page.locator("#lukeChapterDetail").inner_text()
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
