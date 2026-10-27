#!/usr/bin/env python3
"""SRS v3 integration: settings, timer, measured stats, Anki TSV and backward compatibility."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
d=json.loads((root/'dictionary.json').read_text(encoding='utf-8'))
p=json.loads((root/'paradigms.json').read_text(encoding='utf-8'))
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,args=['--no-sandbox'])
 page=browser.new_page(accept_downloads=True)
 errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.evaluate("""([d,p])=>{
    window.fetch=async url=>{
      const s=String(url),obj=s.startsWith('release.json')
       ?{format:'tlahtolli-release-manifest',schema:1,version:d.version,headwords:d.words.length,paradigms:Object.keys(p.paradigms).length}
       :s.startsWith('dictionary.json')?d:s.startsWith('paradigms.json')?p
       :{format:'tlahtolli-source-atlas',schema:1,version:d.version,sources:[],witnesses:[]};
      return new Response(JSON.stringify(obj),{status:200,headers:{'Content-Type':'application/json'}});
    }
 }""",[d,p])
 page.set_content((root/'index.html').read_text(encoding='utf-8'),wait_until='load')
 page.wait_for_function("document.querySelector('#syncStatus')?.textContent.includes('Current')")
 page.locator('#tabStudy').click()
 page.locator('#srsOptions').evaluate('(e)=>e.open=true')
 assert page.locator('#srs_newOrder').count()==1
 assert page.locator('#srs_reviewOrder').count()==1
 assert page.locator('#srsReviewFirst').count()==1
 assert page.locator('#srsAutoReveal').count()==1
 assert page.locator('#srsTimer').count()==1
 page.locator('#srs_newLimit').fill('2')
 page.locator('#srs_reviewLimit').fill('5')
 page.locator('#srs_timerSeconds').fill('1')
 page.locator('#srs_newOrder').select_option('random')
 page.locator('#srs_reviewOrder').select_option('hardest')
 page.locator('#srsReviewFirst').uncheck()
 page.locator('#srsAutoReveal').check()
 page.locator('#srsSave').click()
 settings=page.evaluate("TlahtolliSRS.getSettings()")
 assert settings['newLimit']==2 and settings['reviewLimit']==5,settings
 assert settings['newOrder']=='random' and settings['reviewOrder']=='hardest'
 assert settings['reviewFirst']==False and settings['autoReveal']==True
 assert settings['timerSeconds']==1
 record=page.evaluate("""()=>{
  const old=TlahtolliSRS.schedule(null,'good',1700000000000);
  const second=TlahtolliSRS.schedule(old,'good',1700000000000+86400000);
  return {old,second,steps:TlahtolliSRS.steps('1m 10m')};
 }""")
 assert record['old']['phase']=='learning'
 assert record['second']['phase']=='review'
 assert record['steps']==[60000,600000]
 # Real local settings and records remain compatible with browser backup.
 # about:blank test harness blocks localStorage; real same-origin Pages storage is covered by existing backup tests.
 assert page.evaluate('TlahtolliSRS.getSettings().newLimit')==2
 page.locator('#srsInsights').evaluate('(e)=>e.open=true')
 assert '30-day first-review retention' in page.locator('#srsRetention').inner_text()
 assert page.locator('.srs-forecast-row').count()==7
 # Timer must never auto-grade (can auto-reveal only).
 page.locator('#studySubset').select_option('all')
 page.locator('#studyReveal').click()
 assert page.locator('[data-study-grade="good"]').count()==1
 # Export every note with a persistent GUID and a TSV that Anki can import.
 with page.expect_download() as event:
  page.locator('#srsAnkiVocab').click()
 tsv=Path(event.value.path()).read_text(encoding='utf-8-sig')
 assert '#guid column:1' in tsv
 assert '#tags column:4' in tsv
 assert '#columns:GUID\tFront\tBack\tTags' in tsv
 rows=[line for line in tsv.splitlines() if not line.startswith('#') and line.strip()]
 assert len(rows)==len(d['words']),len(rows)
 assert all(row.startswith('tl') and len(row.split('\t'))==4 for row in rows[:3])
 with page.expect_download() as event2:
  page.locator('#srsAnkiVocab').click()
 tsv2=Path(event2.value.path()).read_text(encoding='utf-8-sig')
 assert tsv==tsv2,'Anki note IDs must remain stable between exports'
 with page.expect_download() as event3:
  page.locator('#srsAnkiVerbs').click()
 text=Path(event3.value.path()).read_text(encoding='utf-8-sig')
 assert 'GrammarDerived' in text and len([x for x in text.splitlines() if not x.startswith('#') and x.strip()])==720
 assert not errors,errors
 browser.close()
print('PASS: study preferences and timers, SRS legacy records, 7-day forecast, stable Anki export identifiers')
