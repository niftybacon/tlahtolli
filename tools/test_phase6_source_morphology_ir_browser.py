#!/usr/bin/env python3
"""Real translator tab: retain cited original source morphology, not made-up English."""
from pathlib import Path
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
MIME={".js":"text/javascript",".json":"application/json",".html":"text/html",".css":"text/css"}
with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,args=["--no-sandbox"])
    page=browser.new_page()
    errors=[]
    page.on("pageerror",lambda e:errors.append(str(e)))
    def respond(route):
        url=urlsplit(route.request.url)
        if url.hostname!="tlahtolli.test":
            route.abort()
            return
        rel=url.path.lstrip("/") or "index.html"
        file=ROOT/rel
        if not file.is_file() or not file.resolve().is_relative_to(ROOT.resolve()):
            route.fulfill(status=404,body="Not found")
        elif rel=="cloud-config.js":
            route.fulfill(status=200,content_type="text/javascript",
                          body="window.TLAHTOLLI_CLOUD_CONFIG={url:'',publishableKey:''};")
        else:
            route.fulfill(status=200,body=file.read_bytes(),
                          content_type=MIME.get(file.suffix,"text/plain"))
    page.route("**/*",respond)
    page.goto("https://tlahtolli.test/",wait_until="load",timeout=30000)
    page.locator("#tabTranslator").click()
    page.wait_for_function("""() => document.querySelector('#translatorStatus')
      ?.textContent.includes('headwords')""",timeout=30000)
    for value,written in [
        ("noyollo yehua","noyollo"),
        ("Macazo tleon xoconyoyocoya ti noyollo, yehua cuix ic nepohualoyan",
         "noyollo,"),
        ("In can on nemian noyollo yehua?","noyollo")
    ]:
        page.locator("#translatorDirection").select_option("nh-en")
        page.locator("#translatorInput").fill(value)
        page.locator("#translatorForm").evaluate("(node)=>node.requestSubmit()")
        panel=page.locator(".translator-shared-grammar-ir")
        assert panel.count()==1,value
        panel.evaluate("(node)=>node.open=true")
        content=panel.inner_text()
        assert "source" in content.lower() and "unreviewed" in content,value
        assert "original written token "+written in content,value
        assert "candidate lemma yollotl" in content,value
        assert "grammatical role, referent and sense unresolved" in content,value
        assert "0 noun mentions" in content,value
        assert panel.get_by_role("link",name="Open original Brinton edited source").count()==1,value
        assert panel.get_by_role("link",name="Inspect lexical possessed-stem source").count()==1,value
        assert page.locator(".translator-composed-english").count()==0,value
    for value in ["noyōllo yehua","moyollo yehua","noyollo,, yehua"]:
        page.locator("#translatorInput").fill(value)
        page.locator("#translatorForm").evaluate("(node)=>node.requestSubmit()")
        panel=page.locator(".translator-shared-grammar-ir")
        assert panel.count()==1,value
        panel.evaluate("(node)=>node.open=true")
        assert "source-exact possessed form(s) below" not in panel.inner_text().lower(),value
    page.locator("#translatorInput").fill("nichōca")
    page.locator("#translatorForm").evaluate("(node)=>node.requestSubmit()")
    assert page.locator(".translator-english-output").inner_text()=="I cry."
    assert not errors,errors
    browser.close()
print("PASS original Brinton source-morphology browser evidence and abstention; 3 supported contexts, 3 negatives, 1 finite control")
