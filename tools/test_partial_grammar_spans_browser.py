#!/usr/bin/env python3
"""Browser check for general, source-guarded partial grammar windows."""
from pathlib import Path
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,args=["--no-sandbox"])
    page=browser.new_page(viewport={"width":1200,"height":900})
    errors=[]
    page.on("pageerror",lambda err:errors.append(str(err)))

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
        typ={".html":"text/html",".js":"text/javascript",
             ".json":"application/json"}.get(file.suffix,"text/plain")
        route.fulfill(status=200,body=file.read_bytes(),content_type=typ)

    page.route("**/*",serve)
    page.goto("https://tlahtolli.test/",wait_until="load")
    page.locator("#tabTranslator").click()
    page.wait_for_function(
        "() => document.querySelector('#translatorStatus')?.textContent.includes('115')")

    def analyze(text):
        page.locator("#translatorInput").fill(text)
        page.locator("#translatorForm button[type=submit]").click()
        return page.locator("#translatorPassages")

    original="injn itoca itech qujça xochitl, ioan tlapalli"
    result=analyze(original)
    partial=result.locator(".translator-partial-grammar-spans")
    assert partial.count()==1,"Historical longer phrase not exposed"
    partial.evaluate("(node)=>node.open=true")
    content=partial.inner_text()
    assert "itech qujça xochitl," in content,content
    assert "Original words 3–5" in content,content
    assert "source-finite" in content and "NOT a translation" in content
    assert "Words without a recovered structural window:" in content
    assert "1: injn" in content and "7: tlapalli" in content
    assert partial.get_by_role("link",name="Inspect partial-window evidence").count()>=2

    for sample,expected in (
        ("niquitta in cihuātl extra","indexed-finite"),
        ("iuhqujn chimalli desconocido más","comparison"),
        ("atl yitic nemjnj extra","locative"),
        ("qujça in xochitl extra","source-finite"),
    ):
        content=analyze(sample).locator(".translator-partial-grammar-spans")
        assert content.count()==1,sample
        content.evaluate("(node)=>node.open=true")
        assert expected in content.inner_text(),sample

    for sample in ("niquittaz in cihuātl",
                   "itech qujça cihuātl ioan tlapalli",
                   "unknown unknown unknown unknown"):
        result=analyze(sample)
        assert result.locator(".translator-partial-grammar-spans").count()==0,sample
    assert "I will see the woman" in analyze("niquittaz in cihuātl").inner_text()
    assert not errors,errors
    browser.close()
print("PASS general partial historical grammar windows: original offsets, four grammar families, refusal and no complete English leakage.")
