#!/usr/bin/env python3
"""Browser regression: Again/learning timers must resume automatically, not freeze at 'Still learning'."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

root=Path(__file__).resolve().parents[1]
dictionary=json.loads((root/'dictionary.json').read_text(encoding='utf-8'))
paradigms=json.loads((root/'paradigms.json').read_text(encoding='utf-8'))
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,args=['--no-sandbox'])
 page=browser.new_page()
 errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.evaluate("""([d,p])=>{
  window.fetch=async url=>{
   const s=String(url),v=s.startsWith('release.json')
    ?{format:'tlahtolli-release-manifest',schema:1,version:d.version,headwords:d.words.length,paradigms:Object.keys(p.paradigms).length}
    :s.startsWith('dictionary.json')?d:s.startsWith('paradigms.json')?p
    :{format:'tlahtolli-source-atlas',schema:1,version:d.version,sources:[],witnesses:[]};
   return new Response(JSON.stringify(v),{status:200,headers:{'Content-Type':'application/json'}});
  };
 }""",[dictionary,paradigms])
 page.set_content((root/'index.html').read_text(encoding='utf-8'),wait_until='load')
 page.wait_for_function("document.querySelector('#syncStatus')?.textContent.includes('Current')")
 page.locator('#tabStudy').click()
 page.locator('#studySubset').select_option('due')
 page.evaluate("""()=>{
  TlahtolliSRS.applySettings({...TlahtolliSRS.getSettings(),newLimit:1,learning:'1s 1s'});
 }""")
 page.locator('#studyReveal').click()
 page.locator('[data-study-grade="again"]').click()
 assert 'Still learning' in page.locator('#studyCard').inner_text()
 assert page.locator('#studyCard [data-srs-waiting]').count()==1
 page.wait_for_selector('#studyReveal',timeout=12000)
 page.locator('#studyReveal').click()
 page.locator('[data-study-grade="good"]').click()
 assert 'Still learning' in page.locator('#studyCard').inner_text()
 page.wait_for_selector('#studyReveal',timeout=12000)
 page.locator('#studyReveal').click()
 page.locator('[data-study-grade="good"]').click()
 assert page.evaluate("Object.values(studyRecords).some(r=>r.phase==='review')"),'Card must graduate after final Good'
 assert page.locator('#studyCard [data-srs-waiting]').count()==0
 assert not errors,errors
 browser.close()
print('PASS: waiting countdown automatically changes into a ready card after Again and intermediate Good')
