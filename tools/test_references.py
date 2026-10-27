#!/usr/bin/env python3
"""Bounded morphology and historical-citation regression checks. Not human peer review."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
d=json.loads((root/'dictionary.json').read_text(encoding='utf-8'))
p=json.loads((root/'paradigms.json').read_text(encoding='utf-8'))
r=json.loads((root/'references.json').read_text(encoding='utf-8'))
assert d['version']==p['version']==r['version']
assert len(r['witnesses'])==22 and len(r['sources'])==8
assert all(x['locator'] and x['url'].startswith('https://') for x in r['witnesses'])
assert all(x['lemma'] in {w['word'] for w in d['words']} for x in r['witnesses'])
with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,args=['--no-sandbox'])
    page=browser.new_page()
    errors=[]
    page.on('pageerror',lambda err:errors.append(str(err)))
    page.evaluate("""([d,p,r])=>{window.fetch=async u=>new Response(JSON.stringify(String(u).startsWith('dictionary.json')?d:String(u).startsWith('paradigms.json')?p:r),{status:200,headers:{'Content-Type':'application/json'}})}""",[d,p,r])
    page.set_content((root/'index.html').read_text(encoding='utf-8'),wait_until='load')
    page.wait_for_function("document.querySelector('#syncStatus')?.textContent.includes('Synced')")
    page.locator('#search').fill('xōchitl')
    page.locator('[data-entry-tab="verification"]').click()
    assert 'Book 11, folio 160v' in page.locator('#detail').inner_text()
    page.locator('#tabAudit').click()
    atlas=page.locator('#sourceAtlas').inner_text()
    assert '22 located text witnesses' in atlas and 'Gran Diccionario' in atlas
    page.locator('#tabDict').click()
    page.locator('#analyzerDetails').evaluate('(el)=>el.open=true')
    page.locator('#formProbeInput').fill('nimitzchīhua')
    page.locator('#formProbeForm button[type="submit"]').click()
    analysis=page.locator('#formProbeOutput').inner_text()
    assert 'Rule-based hypotheses' in analysis and 'not attested' in analysis and '2sg object' in analysis
    page.locator('#formProbeInput').fill('ninēchchīhua')
    page.locator('#formProbeForm button[type="submit"]').click()
    assert 'Rule-based hypotheses' not in page.locator('#formProbeOutput').inner_text()
    assert not errors,errors
    browser.close()
print('PASS: multiple referenced corpora and cautious morphological hypotheses')
