#!/usr/bin/env python3
"""Exercise the real integrated public translation desk; no synthetic UI mocks."""
from pathlib import Path
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
MIME={".js":"text/javascript",".json":"application/json",".html":"text/html",".css":"text/css"}
with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,args=["--no-sandbox"])
    page=browser.new_page()
    errors=[]
    page.on("pageerror",lambda error:errors.append(str(error)))
    def respond(route):
        u=urlsplit(route.request.url)
        if u.hostname!="tlahtolli.test":return route.abort()
        relative=u.path.lstrip("/") or "index.html"
        target=ROOT/relative
        if not target.is_file() or not target.resolve().is_relative_to(ROOT.resolve()):
            return route.fulfill(status=404,body="Not found")
        return route.fulfill(status=200,body=target.read_bytes(),
             content_type=MIME.get(target.suffix,"text/plain"))
    page.route("**/*",respond)
    page.goto("https://tlahtolli.test/",wait_until="load",timeout=30000)
    page.locator("#tabTranslator").click()
    page.wait_for_function("""() => document.querySelector('#translatorStatus')
      ?.textContent.includes('headwords')""",timeout=30000)
    def run(source):
        page.locator("#translatorDirection").select_option("nh-en")
        page.locator("#translatorInput").fill(source)
        page.locator("#translatorForm").evaluate("(node)=>node.requestSubmit()")
        return page.locator(".translator-zan-english")
    for word,n in [
        ("zan",1),("çan",1),("zan tontemiqui",1),
        ("zan ye in cuicatlin",1),("amo tlatla, zan quintocaya",1),
        ("zan ye no",1),("zan ye nō",1),
        ("zan in xochitl, zan in cuicatl",2)
    ]:
        panel=run(word)
        assert panel.count()==1,word
        assert panel.locator(".translator-analysis").count()==n,word
        contents=panel.inner_text()
        assert "only / just / merely" in contents and "but / however" in contents,word
        assert panel.get_by_role("link",name="Inspect Molina zan senses").count()==n*2,word
        assert page.locator("#translatorGloss").inner_text().count(
            "[only / just / merely | but / however]")==n,word
        assert page.locator(".translator-composed-english").count()==0,word
        if word=="zan ye in cuicatlin":
            assert "Documented expression zan ye" in contents
            assert "Published Brinton English: \"the only songs\"" in contents
        if word=="zan tontemiqui":
            assert "Published Brinton English: \"we only dream\"" in contents
        if word.startswith("zan ye no") or word=="zan ye nō":
            assert "likewise / the same" in contents and "Documented expression" in contents
    for text in ["zanio","zanye","za","zān","san","zancuel","zan-ye","yehua"]:
        panel=run(text)
        assert panel.count()==0,text
        if text=="yehua":
            assert page.locator(".translator-yehua-english").count()==1
    panel=run("nichōca")
    assert panel.count()==0
    assert page.locator(".translator-english-output").inner_text()=="I cry."
    assert not errors,errors
    browser.close()
print("PASS browser: both source English zan readings, exact Brinton restrictive editorial comparisons, length-bounded phrases, preserved yehua and real finite English.")
