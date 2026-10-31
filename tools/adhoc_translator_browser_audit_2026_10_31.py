#!/usr/bin/env python3
"""Read-only, disposable real-page crosscheck of selected adversarial inputs."""
from pathlib import Path
from urllib.parse import urlsplit
import json
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
MIME={".js":"text/javascript",".json":"application/json",".html":"text/html",".css":"text/css"}
cases=[
 ("known finite","nh-en","nichōca"),
 ("new finite+object","nh-en","ahmo niquitta in conetl"),
 ("lexical/grammar mismatch","nh-en","niquitta in cihuātl"),
 ("ambiguous roles","nh-en","quitta in cihuātl in tlācatl"),
 ("unknown token","nh-en","niquittax in cihuātl"),
 ("unresolved poem","nh-en","In can on nemian noyollo yehua?"),
 ("unresolved contextual heart","nh-en","noyollo yehua"),
 ("nominal-vocative contrast","nh-en","antepilhuan"),
 ("song interjection","nh-en","Nican momalinaco in colcahuahtecpillotl huiya nican milacatzoa in Colhuaca Chichimecayotl"),
 ("punctuation edge","nh-en","nichōca,"),
 ("interrogative","nh-en","cuix nichōca?"),
 ("reverse sentence","en-nh","I do not cry"),
]
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
        name=url.path.lstrip("/") or "index.html"
        file=ROOT/name
        if not file.is_file() or not file.resolve().is_relative_to(ROOT.resolve()):
            route.fulfill(status=404,body="Not found")
        elif name=="cloud-config.js":
            route.fulfill(status=200,content_type="text/javascript",
                          body="window.TLAHTOLLI_CLOUD_CONFIG={url:'',publishableKey:''};")
        else:
            route.fulfill(status=200,body=file.read_bytes(),
                          content_type=MIME.get(file.suffix,"text/plain"))
    page.route("**/*",respond)
    page.goto("https://tlahtolli.test/",wait_until="load",timeout=35000)
    page.locator("#tabTranslator").click()
    page.wait_for_function("""() => document.querySelector('#translatorStatus')
      ?.textContent.includes('headwords')""",timeout=40000)
    print("BROWSER_META "+json.dumps({"tested":len(cases),"headwords_loaded":page.locator("#translatorStatus").inner_text()},ensure_ascii=False),flush=True)
    for name,direction,value in cases:
        page.locator("#translatorDirection").select_option(direction)
        page.locator("#translatorInput").fill(value)
        page.locator("#translatorForm").evaluate("(node)=>node.requestSubmit()")
        panel=page.locator("#translatorPassages")
        draft=panel.locator(".translator-composed-english .translator-english-output")
        output={
            "case":name,"input":value,"direction":direction,
            "gloss":page.locator("#translatorGloss").inner_text()[:300],
            "english":draft.first.inner_text() if draft.count() else None,
            "english_choice_count":panel.locator(".translator-composed-english select").count(),
            "poetic_notice":panel.locator(".translator-poetic-vocable").count()>0,
            "passage_excerpt":panel.inner_text()[:550]
        }
        print("BROWSER_CASE "+json.dumps(output,ensure_ascii=False),flush=True)
    print("BROWSER_END "+json.dumps({"cases":len(cases),"browser_errors":errors[:12]},ensure_ascii=False),flush=True)
    browser.close()
