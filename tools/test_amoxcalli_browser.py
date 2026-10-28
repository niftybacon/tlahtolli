#!/usr/bin/env python3
"""Browser smoke for full source archive search and cautious translator fallback."""
from pathlib import Path
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
MIME={'.js':'text/javascript','.json':'application/json','.html':'text/html','.css':'text/css'}
with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1200,'height':850})
    errors=[]
    page.on('pageerror',lambda error:errors.append(str(error)))
    def respond(route):
        parsed=urlsplit(route.request.url)
        if parsed.hostname!='tlahtolli.test':
            route.abort()
            return
        path=parsed.path.lstrip('/') or 'index.html'
        local=ROOT/path
        if not local.is_file() or not local.resolve().is_relative_to(ROOT.resolve()):
            route.fulfill(status=404,body='Not found')
        elif path=='cloud-config.js':
            route.fulfill(status=200,content_type='text/javascript',body="window.TLAHTOLLI_CLOUD_CONFIG={url:'',publishableKey:''};")
        else:
            route.fulfill(status=200,body=local.read_bytes(),content_type=MIME.get(local.suffix,'text/plain'))
    page.route('**/*',respond)
    page.goto('https://tlahtolli.test/',wait_until='load',timeout=30000)
    assert page.locator('#historicalArchive').count()==1
    assert page.locator('#archiveSearch').is_disabled()
    assert page.locator('#count').count()==1
    page.locator('#historicalArchive').evaluate('(node)=>node.open=true')
    page.locator('#archiveLoad').click()
    page.wait_for_function('window.TlahtolliArchive.ready===true',{ 'timeout':60000 } )
    assert '36,543' in page.locator('#archiveStatus').inner_text()
    report=page.evaluate("""() => ({
      total:window.TlahtolliArchive.manifest.source_rows.total,
      atl:window.TlahtolliArchive.lookup('ATL',{limit:20}).filter(x=>x.sourceKey==='simeon').length,
      modern:window.TlahtolliArchive.lookup('peso',{classicalOnly:false,limit:50})
        .some(x=>x.variety==='Eastern Huasteca Nahuatl'),
      raw:window.TlahtolliArchive.lookup('LXVIIT',{limit:10}).length
    })""")
    assert report['total']==36543 and report['atl']>=2 and report['raw']>=1,report
    assert report['modern'],report
    page.locator('#archiveSearch').fill('CUICATL')
    page.wait_for_function("document.querySelector('#archiveStatus').textContent.includes('source records found')")
    assert page.locator('#archiveResults .archive-entry').count()>0
    assert 'Siméon' in page.locator('#archiveResults').inner_text()
    page.locator('#tabTranslator').click()
    page.wait_for_function("document.querySelector('#translatorStatus').textContent.includes('115')")
    page.locator('#translatorInput').fill('LXVIIT')
    page.locator('#translatorForm button[type=submit]').click()
    page.wait_for_function("document.querySelector('#translatorAnalyses').textContent.includes('Extended source archive')")
    assert 'Unindexed form' in page.locator('#translatorAnalyses').inner_text()
    assert 'unreviewed' in page.locator('#translatorAnalyses').inner_text().lower()
    assert not errors,errors
    print('PASS: 36,543 archive rows, source diversity, search and unverified translator fallback')
    browser.close()
