#!/usr/bin/env python3
"""Browser check for the claim-ledger UX and intact 88-entry backups."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
d=json.loads((root/'dictionary.json').read_text(encoding='utf8'))
p=json.loads((root/'paradigms.json').read_text(encoding='utf8'))
with sync_playwright() as pw:
    b=pw.chromium.launch(headless=True,args=['--no-sandbox'])
    page=b.new_page(accept_downloads=True)
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.evaluate("""([d,p])=>{
      window.fetch=async url=>{
        const name=String(url),value=name.startsWith('release.json')
          ? {format:'tlahtolli-release-manifest',schema:1,version:d.version,
             headwords:d.words.length,paradigms:Object.keys(p.paradigms).length}
          : name.startsWith('dictionary.json')?d:p;
        return new Response(JSON.stringify(value),{status:200,headers:{'Content-Type':'application/json'}});
      };
    }""",[d,p])
    page.set_content((root/'index.html').read_text(encoding='utf8'),wait_until='load')
    page.wait_for_function("['Current','Synced'].some(s=>document.querySelector('#syncStatus')?.textContent.includes(s))")
    page.locator('#search').fill('tonalli')
    page.locator('button.result').first.click()
    page.locator('[data-entry-tab="verification"]').click()
    assert 'Field-by-field evidence ledger' in page.locator('#detail').inner_text()
    assert page.locator('.claim-ledger tbody tr').count()==8
    assert 'Needs verification' in page.locator('.claim-ledger').inner_text()
    page.locator('#tabAudit').click()
    assert 'Noun citation number' in page.locator('#auditCoverageMatrix').inner_text()
    page.locator('#workspaceTools').evaluate('(e)=>e.open=true')
    with page.expect_download() as dl:page.locator('#allBackup').click()
    backup=json.loads(Path(dl.value.path()).read_text(encoding='utf-8-sig'))
    assert len(backup['words'])==88
    tonalli=next(w for w in backup['words'] if w['word']=='tonalli')
    assert tonalli['plural']=='' and len(tonalli['claims'])==9
    assert not errors,errors
    b.close()
print('PASS: evidence ledger, audit view, corrected plural, preserved backup')
