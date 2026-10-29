#!/usr/bin/env python3
"""Browser: separate noun coordination from clause coordination and English."""
from pathlib import Path
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,args=["--no-sandbox"])
    page=browser.new_page(viewport={"width":1200,"height":900})
    errors=[]
    page.on("pageerror",lambda e:errors.append(str(e)))
    def serve(route):
        uri=urlsplit(route.request.url)
        if uri.hostname!="tlahtolli.test":
            route.abort()
            return
        rel=uri.path.lstrip("/") or "index.html"
        file=(ROOT/rel).resolve()
        if not file.is_file() or not file.is_relative_to(ROOT.resolve()):
            route.fulfill(status=404,body="Not found")
            return
        if rel=="cloud-config.js":
            route.fulfill(status=200,content_type="text/javascript",
                          body="window.TLAHTOLLI_CLOUD_CONFIG={url:'',publishableKey:''};")
            return
        typ={".html":"text/html",".js":"text/javascript",".json":"application/json"}.get(file.suffix,"text/plain")
        route.fulfill(status=200,body=file.read_bytes(),content_type=typ)
    page.route("**/*",serve)
    page.goto("https://tlahtolli.test/",wait_until="load")
    page.locator("#tabTranslator").click()
    page.wait_for_function("() => document.querySelector('#translatorStatus')?.textContent.includes('headwords')")
    def analyze(text):
        page.locator("#translatorInput").fill(text)
        page.locator("#translatorForm button[type=submit]").click()
        return page.locator("#translatorPassages")

    historic=analyze("xochitl, ioan tlapalli")
    panel=historic.locator(".translator-nominal-coordination")
    assert panel.count()==1,"Actual folio noun sequence should be recognized"
    panel.evaluate("(node)=>node.open=true")
    detail=panel.inner_text()
    assert "xochitl, ioan tlapalli" in detail
    assert "Exact editorial word window: passage-3" in detail
    assert "and / together with" in detail
    assert "NOT a sentence translation" in detail
    assert panel.get_by_role("link",name="Inspect nominal coordination evidence").count()>=3
    assert historic.locator(".translator-composed-english").count()==0

    for sample in ("in cihuātl īhuān in conetl",
                   "in cihuātl ihuan in conetl",
                   "cihuātl yhuan conetl",
                   "cihuātl iuan in conetl"):
        result=analyze(sample)
        coord=result.locator(".translator-nominal-coordination")
        assert coord.count()==1,sample
        coord.evaluate("(node)=>node.open=true")
        text=coord.inner_text()
        assert "cihuātl" in text and "conetl" in text
        assert "and / together with" in text
        assert "Exact editorial word window" not in text
        assert result.locator(".translator-composed-english").count()==0

    sample="injn itoca itech qujça xochitl, ioan tlapalli"
    result=analyze(sample)
    spans=result.locator(".translator-partial-grammar-spans")
    assert spans.count()==1
    spans.evaluate("(node)=>node.open=true")
    text=spans.inner_text()
    assert "Original words 3–5" in text and "source-finite" in text,text
    assert "Original words 5–7" in text and "nominal-coordination" in text,text
    assert result.locator(".translator-composed-english").count()==0

    for sample in ("tlapalli, ioan xochitl","cihuātl ioan conetl",
                   "in cihuātl īhuān in unknown","ninemi ihuan nichōca",
                   "in cihuātl ihuan in conetl extra"):
        assert analyze(sample).locator(".translator-nominal-coordination").count()==0,sample

    # Reuse the SAME integrated translator for grammar-constrained attachment.
    for sample,agreement in (
        ("chōca in cihuātl īhuān in conetl","3sg"),
        ("chōcah in cihuātl īhuān in conetl","3pl"),
        ("in cihuātl īhuān in conetl chōcah","3pl"),
    ):
        result=analyze(sample)
        linked=result.locator(".translator-coordinated-subject")
        assert linked.count()==1,sample
        linked.evaluate("(node)=>node.open=true")
        label=linked.inner_text()
        assert agreement in label and "NOT a translation" in label,label
        assert "cihuātl" in label and "conetl" in label
        assert linked.get_by_role("link",name="Inspect agreement and nominal evidence").count()>=4
        assert result.locator(".translator-composed-english").count()==0,sample

    for sample in (
        "chōcah xōchitl īhuān tetl",
        "niquitta in cihuātl īhuān in conetl",
        "chōcah in cihuātl īhuān in xōchitl",
        "chōcah cihuātl ioan conetl",
    ):
        result=analyze(sample)
        assert result.locator(".translator-coordinated-subject").count()==0,sample
        assert result.locator(".translator-composed-english").count()==0,sample

    supported=analyze("niquittaz in cihuātl")
    assert "I will see the woman" in supported.inner_text()
    assert not errors,errors
    browser.close()
print("PASS noun coordination browser: source-located ioan, productive cited spelling, two historical inner windows, cited third-person subject attachments, no invented English.")
