#!/usr/bin/env python3
"""Headless UI tests with deterministic local data; no browser upload or external calls."""
from pathlib import Path
import json
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
dictionary=json.loads((root/'dictionary.json').read_text(encoding='utf8'))
paradigms=json.loads((root/'paradigms.json').read_text(encoding='utf8'))
with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,args=['--no-sandbox'])
    page=browser.new_page(accept_downloads=True)
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.evaluate("""([words,paradigms])=>{
      window.__data={words,paradigms};
      window.fetch=async url=>new Response(JSON.stringify(
        String(url).startsWith('dictionary.json')?window.__data.words:window.__data.paradigms),
        {status:200,headers:{'Content-Type':'application/json'}});
    }""",[dictionary,paradigms])
    page.set_content((root/'index.html').read_text(encoding='utf8'),wait_until='load')
    page.wait_for_function("document.querySelector('#syncStatus')?.textContent.includes('Synced')")
    assert page.locator('#total').inner_text()=='88'
    assert not page.locator('#workspaceTools').evaluate('(e)=>e.open')
    assert not page.locator('#analyzerDetails').evaluate('(e)=>e.open')
    page.locator('#quickLookup').fill('xōchitl')
    page.locator('#quickLookupForm button[type="submit"]').click()
    assert page.locator('#search').input_value()=='xōchitl'
    assert page.locator('button.result').count()>0
    page.keyboard.press('Control+k')
    assert page.locator('#quickLookup').evaluate('(e)=>document.activeElement===e')
    page.locator('#search').fill('')
    page.locator('#facetPOS').select_option('noun')
    assert page.locator('button.result').count()==70
    page.locator('#facetAnimacy').select_option('animate')
    assert page.locator('button.result').count()>10
    page.locator('#facetAnimacy').select_option('all')
    page.locator('#facetEvidence').select_option('field')
    assert page.locator('button.result').count()>=5
    page.locator('#facetPOS').select_option('all')
    page.locator('#facetEvidence').select_option('all')
    page.locator('#analyzerDetails').evaluate('(e)=>e.open=true')
    page.locator('#formProbeInput').fill('nichōcac')
    page.locator('#formProbeForm button[type="submit"]').click()
    analysis=page.locator('#formProbeOutput').inner_text()
    assert 'Preterite' in analysis and 'Subject prefix' in analysis and 'ni-' in analysis
    page.locator('#formProbeInput').fill('notahistoricalform')
    page.locator('#formProbeForm button[type="submit"]').click()
    assert 'No indexed analysis' in page.locator('#formProbeOutput').inner_text()
    page.locator('#tabRead').click()
    page.locator('#concordanceInput').fill('in')
    assert page.locator('.concordance-row').count()==2
    page.locator('#concordanceMode').select_option('phrase')
    page.locator('#concordanceInput').fill('in xōchitl')
    assert page.locator('.concordance-row').count()==1
    page.locator('#concordanceMode').select_option('lemma')
    page.locator('#concordanceInput').fill('xōchitl')
    assert page.locator('.concordance-row').count()==1
    page.locator('#concordanceMode').select_option('exact')
    page.locator('#concordanceInput').fill('in')
    page.locator('.concordance-row').first.click()
    page.locator('#analyzerDetails').evaluate('(e)=>e.open=false')
    page.locator('#readerToAnalysis').click()
    assert page.locator('#analyzerDetails').evaluate('(e)=>e.open')
    assert page.locator('#formProbeInput').input_value()=='in'
    page.locator('#tabAudit').click()
    assert 'Noun plural behavior' in page.locator('#auditCoverageMatrix').inner_text()
    page.locator('#tabStudy').click()
    assert '720' in page.locator('#drillStats').inner_text()
    page.locator('#drillVerb').select_option('chōca')
    page.locator('#drillScope').select_option('core')
    assert '24' in page.locator('#drillStats').inner_text()
    page.locator('#drillReveal').click()
    page.locator('[data-drill-grade=good]').click()
    page.locator('#studyReveal').click()
    page.locator('[data-study-grade="good"]').click()
    page.locator('#workspaceTools').evaluate('(e)=>e.open=true')
    with page.expect_download() as download:page.locator('#allBackup').click()
    backup=json.loads(Path(download.value.path()).read_text(encoding='utf-8-sig'))
    assert len(backup['words'])==88 and len(backup['studyRecords'])==2 and any(k.startswith('paradigm§') for k in backup['studyRecords'])
    assert not errors,errors
    browser.close()
print('PASS: v2.0 browser regressions including focused UI')
