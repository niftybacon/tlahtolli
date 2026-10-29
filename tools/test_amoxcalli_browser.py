#!/usr/bin/env python3
"""Browser smoke for full source archive search and evidence-aware translator comparisons."""
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
    page.wait_for_function('window.TlahtolliArchive.ready===true',timeout=60000)
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
    page.wait_for_function("document.querySelector('#translatorStatus').textContent.includes('headwords')")
    def expand_archive_evidence():
        # Exercise the actual disclosure UI, rather than accidentally asserting
        # against invisible textContent in a collapsed <details> element.
        opened=page.evaluate("""() => {
          let count=0;
          for(const detail of document.querySelectorAll('#translatorAnalyses details')){
            const header=detail.querySelector(':scope > summary');
            if(header?.textContent.includes('Additional lexical evidence')){
              detail.open=true;count++;
            }
          }
          return count;
        }""")
        assert opened>=1,'Expected an expandable lexical evidence section'

    # Archive rows are source evidence only; an OCR section marker is not a
    # verified Classical Nahuatl word and must remain unknown in the gloss.
    page.locator('#translatorInput').fill('LXVIIT')
    page.locator('#translatorForm button[type=submit]').click()
    page.wait_for_function("""() => {
      const root=document.querySelector('#translatorAnalyses');
      return !!root && root.textContent.includes('Additional lexical evidence')
        && root.textContent.includes('LXVIIT [headword]');
    }""")
    expand_archive_evidence()
    unknown=page.locator('#translatorAnalyses').inner_text()
    assert 'Unindexed form' in unknown,unknown
    assert 'Additional lexical evidence' in unknown,unknown
    assert 'Siméon' in unknown,unknown
    assert 'Grammatical labels are source-reported, not verified parses' in unknown,unknown
    assert '[?LXVIIT]' in page.locator('#translatorGloss').inner_text()
    assert '1 unknown' in page.locator('#translatorStatus').inner_text()

    # A known dictionary form must ALSO get comparisons, without changing
    # the published translator's existing lexical decision.
    page.locator('#translatorInput').fill('in')
    page.locator('#translatorForm button[type=submit]').click()
    page.wait_for_function("""() => {
      const root=document.querySelector('#translatorAnalyses');
      return !!root && root.textContent.includes('Additional lexical evidence')
        && root.textContent.includes('Matched source form: in [headword]');
    }""")
    expand_archive_evidence()
    known=page.locator('#translatorAnalyses').inner_text()
    assert 'Additional lexical evidence' in known
    assert 'Matched source form: in [headword]' in known
    assert '0 unknown' in page.locator('#translatorStatus').inner_text()

    # Kaikki lists both alomeh as an independent headword and alomeh as
    # the plural of alo. The screen must retain those DIFFERENT analyses,
    # but must not turn either dictionary record into a verified sentence.
    page.locator('#translatorInput').fill('alomeh')
    page.locator('#translatorForm button[type=submit]').click()
    page.wait_for_function("""() => {
      const root=document.querySelector('#translatorAnalyses');
      return !!root && root.textContent.includes('Additional lexical evidence')
        && root.textContent.includes('alomeh [source-listed form; source labels: plural]')
        && root.textContent.includes('alomeh [headword]');
    }""")
    expand_archive_evidence()
    plural=page.locator('#translatorAnalyses').inner_text()
    assert 'alo' in plural
    assert 'source labels: plural' in plural
    assert 'unreviewed' in plural.lower()
    assert 'Unindexed form' in plural
    assert '[?alomeh]' in page.locator('#translatorGloss').inner_text()

    # An exact Classical source-listed form now also becomes an explicitly
    # unreviewed morphology clue within the EXISTING sentence analysis.
    # It must not become a translated sentence or a curated lexical hit.
    page.locator('#translatorPassages details.translator-morph-panel').evaluate_all(
        '(nodes)=>nodes.forEach(n=>n.open=true)')
    grammatical=page.locator('#translatorPassages').inner_text()
    assert 'Partial morphology only' in grammatical,grammatical
    assert 'Archive source-listed form (unreviewed)' in grammatical,grammatical
    assert 'alomeh → alo' in grammatical,grammatical
    assert 'unreviewed' in grammatical.lower()
    assert '[?alomeh]' in page.locator('#translatorGloss').inner_text()

    # A real historical y→i candidate must surface through the existing
    # archive + historical engine bridge, without changing the working gloss.
    page.locator('#translatorInput').fill('yca')
    page.locator('#translatorForm button[type=submit]').click()
    page.wait_for_function("""() => {
      const root=document.querySelector('#translatorAnalyses');
      return !!root && root.textContent.includes('Tentative historical spelling')
        && root.textContent.includes('yca → ica');
    }""",timeout=30000)
    page.locator('#translatorAnalyses details.translator-morph-panel').evaluate_all(
        '(nodes)=>nodes.forEach(n=>n.open=true)')
    spelling=page.locator('#translatorAnalyses').inner_text()
    assert 'yca → ica' in spelling and 'unverified spelling hypothesis' in spelling
    assert '[?yca]' in page.locator('#translatorGloss').inner_text()
    assert '1 unknown' in page.locator('#translatorStatus').inner_text()

    # Do not use a one-letter historical y→i suggestion to manufacture lexical
    # coverage, even if the Classical archive happens to index 'i'.
    direct=page.evaluate("""() => window.TlahtolliArchive.lookupHistoricalEvidence(
      'y',window.TlahtolliHistoricalMorphology.variants('y','codex'))""")
    assert direct['total']==0

    # The archive is explicitly source-separated: an Eastern Huasteca
    # entry can be queried only when opting out of classicalOnly.
    dialect=page.evaluate("""() => ({
      classical:window.TlahtolliArchive.lookupEvidence('peso',{limit:50}).hits
        .some(h=>h.variety==='Eastern Huasteca Nahuatl'),
      unrestricted:window.TlahtolliArchive.lookupEvidence('peso',{classicalOnly:false,limit:50}).hits
        .some(h=>h.variety==='Eastern Huasteca Nahuatl')
    })""")
    assert not dialect['classical'] and dialect['unrestricted'],dialect
    assert not errors,errors
    print('PASS: 36,543 archive rows, historical/modern source isolation, verified vs unreviewed UI distinction, cautious yca→ica historical spelling bridge, source-form grammar tags, and preserved unknown glosses')
    browser.close()
