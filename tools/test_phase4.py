#!/usr/bin/env python3
"""Phase 4 historically bounded morphology and source-record regressions."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
data=json.loads((root/'dictionary.json').read_text(encoding='utf-8'))
par=json.loads((root/'paradigms.json').read_text(encoding='utf-8'))
entries={w['word']:w for w in data['words']}
assert len(entries)==88 and len(par['paradigms'])==12
assert sum(len(w['claims']) for w in entries.values())==674
from collections import Counter
counts=Counter(c['assessment'] for w in entries.values() for c in w['claims'])
assert dict(counts)=={'dictionary':327,'grammar':129,'text':15,'inference':108,'unverified':95},counts
for name in ('calli','tlālli','tēpetl'):
    claim=next(c for c in entries[name]['claims'] if c['field']=='stem')
    assert claim['assessment']=='dictionary' and claim['locator'] and claim['source'].startswith('https://')
for name,field in [('ātl','plural'),('cuīcatl','plural'),('ilhuicatl','possessed'),('cītlalin','possessed')]:
    claim=next(c for c in entries[name]['claims'] if c['field']==field)
    assert claim['assessment']=='unverified',(name,claim)
with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,args=['--no-sandbox'])
    page=browser.new_page()
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.evaluate("""([d,p])=>{
      window.fetch=async url=>{
        const u=String(url),result=u.startsWith('release.json')
          ? {format:'tlahtolli-release-manifest',schema:1,version:d.version,headwords:d.words.length,paradigms:Object.keys(p.paradigms).length}
          : u.startsWith('dictionary.json')?d
          : u.startsWith('paradigms.json')?p
          : {format:'tlahtolli-source-atlas',schema:1,version:d.version,sources:[],witnesses:[]};
        return new Response(JSON.stringify(result),{status:200,headers:{'Content-Type':'application/json'}});
      };
    }""",[data,par])
    page.set_content((root/'index.html').read_text(encoding='utf-8'),wait_until='load')
    page.wait_for_function("document.querySelector('#syncStatus')?.textContent.includes('Current')")
    page.locator('#analyzerDetails').evaluate("(e)=>e.open=true")
    def check(word,terms):
        page.locator('#formProbeInput').fill(word)
        page.locator('#formProbeForm button[type="submit"]').click()
        txt=page.locator('#formProbeOutput').inner_text()
        for term in terms:assert term in txt,(word,term,txt[:800])
    check('nichōcac',['Advanced morphology','Subject 1sg prefix','Indexed lexical base','Tense/mood and/or subject-number material'])
    check('nicchīhua',['Advanced morphology','Fixed third-person-singular object prefix','Indexed lexical base'])
    check('calli',['Advanced morphology','Noun citation-form segmentation','dictionary','Absolutive li'])
    check('xōchitl',['Advanced morphology','Absolutive tl'])
    check('nimitzchīhua',['Rule-based hypotheses','2sg object','not attested'])
    check('notahistoricalform',['No indexed analysis'])
    assert 'Morpheme-level analysis' not in page.locator('#formProbeOutput').inner_text()
    assert not errors,errors
    browser.close()
print('PASS: Phase 4 grade boundaries, three source locators, noun and verb morpheme views')
