#!/usr/bin/env python3
"""UI regression: citation requirements, safe export and persisted reader notes."""
from pathlib import Path
import json
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
d=json.loads((root/'dictionary.json').read_text(encoding='utf8'))
p=json.loads((root/'paradigms.json').read_text(encoding='utf8'))
with sync_playwright() as pw:
    browser=pw.chromium.launch(**({'executable_path':'/usr/bin/chromium'} if Path('/usr/bin/chromium').exists() else {}),headless=True,args=['--no-sandbox'])
    page=browser.new_page(accept_downloads=True)
    errors=[];alerts=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('dialog',lambda dlg:(alerts.append(dlg.message),dlg.accept()))
    page.evaluate("""([d,p])=>{
      window.fetch=async u=>{
        const name=String(u),data=name.startsWith('release.json')
          ? {format:'tlahtolli-release-manifest',schema:1,version:d.version,
             headwords:d.words.length,paradigms:Object.keys(p.paradigms).length}
          : name.startsWith('dictionary.json')?d:p;
        return new Response(JSON.stringify(data),{status:200,headers:{'Content-Type':'application/json'}});
      };
    }""",[d,p])
    page.set_content((root/'index.html').read_text(encoding='utf8'),wait_until='load')
    page.wait_for_function("['Current','Synced'].some(s=>document.querySelector('#syncStatus')?.textContent.includes(s))")
    page.locator('#tabRead').click()
    assert page.locator('#interlinearRows tr').count()==4
    page.locator('#analysisEvidence').select_option('text')
    page.locator('#applyLink').click()
    assert alerts and 'valid http' in alerts[0]
    assert not page.evaluate('() => Object.keys(passages[0].analyses).length')
    page.locator('#analysisSource').fill('https://example.org/edition')
    page.locator('#analysisLocator').fill('folio 3r, line 2')
    page.locator('#analysisNotes').fill('=HYPERLINK("http://untrusted") note')
    page.locator('#applyLink').click()
    assert 'Reference + locator supplied' in page.locator('#interlinearDesk').inner_text()
    with page.expect_download() as dl:page.locator('#interlinearCsv').click()
    tsv=Path(dl.value.path()).read_text(encoding='utf-8-sig')
    assert 'folio 3r, line 2' in tsv and "'=HYPERLINK" in tsv
    assert len(tsv.splitlines())==5
    page.locator('[data-interlinear-token="0"]').click()
    assert page.evaluate('() => tokenIdx')==0
    page.locator('#workspaceTools').evaluate('(e)=>e.open=true')
    with page.expect_download() as dl:page.locator('#allBackup').click()
    backup=json.loads(Path(dl.value.path()).read_text(encoding='utf-8-sig'))
    record=backup['passages'][0]['analyses']['1']
    assert record['source']=='https://example.org/edition' and record['evidence']=='text'
    assert page.evaluate('(x) => cleanPassage(x).analyses[1]',backup['passages'][0])==record
    assert not errors,errors
    browser.close()
print('PASS: citation gate, local annotation export, safe TSV, backup')
