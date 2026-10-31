#!/usr/bin/env python3
"""Public desk must display PR #120's English dictionary readings for yehua."""
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
        if url.hostname!="tlahtolli.test":return route.abort()
        rel=url.path.lstrip("/") or "index.html"
        file=ROOT/rel
        if not file.is_file() or not file.resolve().is_relative_to(ROOT.resolve()):
            return route.fulfill(status=404,body="Not found")
        if rel=="cloud-config.js":
            return route.fulfill(status=200,content_type="text/javascript",
                         body="window.TLAHTOLLI_CLOUD_CONFIG={url:'',publishableKey:''};")
        return route.fulfill(status=200,body=file.read_bytes(),
                      content_type=MIME.get(file.suffix,"text/plain"))
    page.route("**/*",respond)
    page.goto("https://tlahtolli.test/",wait_until="load",timeout=30000)
    page.locator("#tabTranslator").click()
    page.wait_for_function("""() => document.querySelector('#translatorStatus')
      ?.textContent.includes('headwords')""",timeout=30000)
    def run(value):
        page.locator("#translatorDirection").select_option("nh-en")
        page.locator("#translatorInput").fill(value)
        page.locator("#translatorForm").evaluate("(node)=>node.requestSubmit()")
        return page.locator(".translator-yehua-english")
    for value,count in [
        ('yehua',1),('In can on nemian noyollo yehua?',1),
        ('Macazo tleon xoconyoyocoya ti noyollo, yehua cuix ic nepohualoyan in oncan nemohua yehua',2)
    ]:
        panel=run(value)
        assert panel.count()==1,value
        assert panel.locator(".translator-analysis").count()==count,value
        text=panel.inner_text()
        assert "that / that one" in text and "a little while ago / then" in text,value
        assert "Molina 1571" in text,value
        assert panel.get_by_role("link",name="Inspect original dictionary evidence").count()==2*count,value
        assert page.locator("#translatorGloss").inner_text().count(
            "[that / that one | a little while ago / then]")==count,value
        assert page.locator(".translator-composed-english").count()==0,value
        if 'Macazo' in value:
            assert "Published poem English" in text and "Brinton 1890 Song VI stanza 2" in text
            assert panel.get_by_role("link",name="Inspect Brinton original and English edition").count()==1
        else:
            assert "Published poem English" not in text
    for value in ["yehuan","yēhua","yehuatl","yeua","yegua","noyolloyehua","noyollo yehua"]:
        panel=run(value)
        if value=="noyollo yehua":
            assert panel.count()==1
            assert "Published poem English" not in panel.inner_text()
        else:assert panel.count()==0,value
    panel=run("nichōca")
    assert panel.count()==0
    assert page.locator(".translator-english-output").inner_text()=="I cry."
    assert not errors,errors
    browser.close()
print("PASS browser presents documented English options for each original yehua, and published contextual Brinton only; altered forms and full-clause English remain refused.")
