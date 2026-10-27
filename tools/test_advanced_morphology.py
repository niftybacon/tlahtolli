#!/usr/bin/env python3
"""Browser regression and evidence boundary for advanced Classical Nahuatl morphology.

A matching synthetic parse is NOT evidence of historical attestation.
"""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
d=json.loads((ROOT/'dictionary.json').read_text(encoding='utf-8'))
p=json.loads((ROOT/'paradigms.json').read_text(encoding='utf-8'))
assert len(d['words'])>=103
assert len(p['paradigms'])==12
assert sum(len(w['claims']) for w in d['words'])>=674
assert sum(len(w['inflections']) for w in d['words'])>=178

with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,args=['--no-sandbox'])
    page=browser.new_page()
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.evaluate("""([d,p])=>{
      window.fetch=async url=>{
       const u=String(url),v=u.startsWith('release.json')
         ? {format:'tlahtolli-release-manifest',schema:1,version:d.version,
            headwords:d.words.length,paradigms:Object.keys(p.paradigms).length}
         :u.startsWith('dictionary.json')?d
         :u.startsWith('paradigms.json')?p
         :{format:'tlahtolli-source-atlas',schema:1,version:d.version,sources:[],witnesses:[]};
       return new Response(JSON.stringify(v),{status:200,headers:{'Content-Type':'application/json'}});
      };
    }""",[d,p])
    page.set_content((ROOT/'index.html').read_text(encoding='utf-8'),wait_until='load')
    page.wait_for_function("document.querySelector('#syncStatus')?.textContent.includes('Current')")

    # Core data boundaries and exact verb-paradigm reverse analyses.
    result=page.evaluate("""()=>{
      const E=TlahtolliMorphEngine, q=w=>E.analyze(w);
      let coverage=0;
      for(const [name,m] of Object.entries(FULL_VERB_PARADIGMS))
       for(let t=0;t<m.cells.length;t++)
        for(let p=0;p<6;p++){
         const hits=q(m.cells[t][p]);
         if(!hits.some(h=>h.lemma===name&&h.grade==='paradigm'&&h.features.patternIndex===t))
           throw Error('Missing indexed conjugation '+name+'/'+t+'/'+p+': '+m.cells[t][p]);
         coverage++;
        }
      const documented=q('noxōchiuh');
      const productive=q('nimitzchīhua');
      const future=q('nimitzchīhuaz');
      const preterite=q('nimitzchīuh');
      const analogy=q('moxōchiuh');
      const ambiguity=q('tlacuah').filter(h=>h.lemma==='tlacuā'&&h.grade==='paradigm');
      const pluralHouse=q('caltin');
      const pluralFlower=q('xōchimeh');
      const noun=q('calli');
      const flower=q('xōchitl');
      const diacritics=q('xochitl');
      return {coverage,
       documented:documented.map(x=>({kind:x.kind,grade:x.grade})),
       productive:productive.map(x=>({kind:x.kind,grade:x.grade,object:x.features.object,tense:x.features.tense})),
       future:future.map(x=>({grade:x.grade,tense:x.features.tense})),
       preterite:preterite.map(x=>({grade:x.grade,tense:x.features.tense})),
       analogy:analogy.map(x=>({grade:x.grade,kind:x.kind})),
       ambiguity:ambiguity.length,
       pluralHouse:pluralHouse.filter(x=>x.kind.toLowerCase().includes('plural')).map(x=>({grade:x.grade,parts:x.parts.map(p=>p.surface)})),
       pluralFlower:pluralFlower.filter(x=>x.kind.toLowerCase().includes('plural')).map(x=>({grade:x.grade,parts:x.parts.map(p=>p.surface)})),
       noun:noun.map(x=>({kind:x.kind,grade:x.grade,parts:x.parts.map(p=>p.surface)})),
       flower:flower.map(x=>({kind:x.kind,parts:x.parts.map(p=>p.surface)})),
       diacritics:diacritics.some(x=>x.lemma==='xōchitl'),
       unknown:q('noneofthisisnahuatl'),
       rejected:q('nimitzchīhua nimitzchīhua')
      };
    }""")
    assert result['coverage']==720,result
    assert result['ambiguity']>=2,result
    assert any(x['kind']=='Noun citation-form segmentation' and x['grade']=='lexical' and x['parts']==['cal','li'] for x in result['noun']),result['noun']
    assert any(x['kind']=='Noun citation-form segmentation' and x['parts']==['xōchi','tl'] for x in result['flower']),result['flower']
    assert any(x['parts']==['cal','tin'] and x['grade']=='lexical' for x in result['pluralHouse']),result['pluralHouse']
    assert any(x['parts']==['xōchi','meh'] and x['grade']=='lexical' for x in result['pluralFlower']),result['pluralFlower']
    assert result['diacritics'],result
    assert result['unknown']==[] and result['rejected']==[],result
    assert any(x['grade']=='hypothesis' and x['object']=='2sg' for x in result['productive']),result['productive']
    assert any(x['grade']=='hypothesis' and x['tense']=='Future' for x in result['future']),result['future']
    assert any(x['grade']=='hypothesis' for x in result['preterite']),result['preterite']
    assert any(x['grade']=='analogy' for x in result['analogy']),result['analogy']
    assert not any(x['grade']=='manuscript' for x in result['productive']+result['future']+result['analogy']),result

    # Render meaningful human-facing disclosures without modifying the stored corpus.
    page.locator('#analyzerDetails').evaluate('(e)=>e.open=true')
    page.locator('#formProbeInput').fill('nimitzchīhuaz')
    page.locator('#formProbeForm button[type="submit"]').click()
    prose=page.locator('#formProbeOutput').inner_text()
    assert 'Advanced morphology' in prose and 'Productive grammatical hypothesis' in prose,prose[:1000]
    assert 'NOT independently attested' in prose or 'NOT independently' in prose,prose[:1000]
    page.locator('#formProbeInput').fill('calli')
    page.locator('#formProbeForm button[type="submit"]').click()
    assert 'Absolutive li' in page.locator('#formProbeOutput').inner_text()
    assert not errors,errors
    browser.close()

print('PASS: 720 indexed verb cells, ambiguity, irregular stem templates, noun boundaries,')
print('      productive person/object hypotheses, possessor analogy and evidence safety.')
