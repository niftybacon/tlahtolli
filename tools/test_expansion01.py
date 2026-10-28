#!/usr/bin/env python3
"""Expansion 01: source-located lexeme, closed-world form and browser checks.

A cited dictionary form is NOT a manuscript-attested token unless the locator
explicitly identifies historical context. No productive tense table is added.
"""
import csv
import json
from collections import Counter
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
d=json.loads((ROOT/'dictionary.json').read_text(encoding='utf-8'))
p=json.loads((ROOT/'paradigms.json').read_text(encoding='utf-8'))
e=json.loads((ROOT/'data/evidence.json').read_text(encoding='utf-8'))
m=json.loads((ROOT/'data/morphology.json').read_text(encoding='utf-8'))
l=json.loads((ROOT/'data/lexicon.json').read_text(encoding='utf-8'))
names=['ācatl','cuahuitl','iztatl','nacatl','tamalli','quetzalli','āyōtl',
       'cacahuatl','tlacuilo','cochi','caqui','tlazotla','cuiloa','tlacuiloa','yauh']
assert len(d['words'])==len(e['entries'])==len(m['entries'])==len(l['words'])>=103
assert [w['word'] for w in d['words'][88:103]]==names
assert len(p['paradigms'])==12
assert d['version']==p['version']==e['version']==m['version']==l['version']
assert sum(len(w['claims']) for w in d['words'][:88])==674
assert sum(len(w['inflections']) for w in d['words'][:88])==178
assert sum(len(w['claims']) for w in d['words'][:103])==777
assert sum(len(w['inflections']) for w in d['words'][:103])==211
old_grade=Counter(c['assessment'] for w in d['words'][:88] for c in w['claims'])
assert old_grade=={'dictionary':327,'grammar':129,'text':15,'inference':108,'unverified':95},old_grade
for w in d['words'][88:103]:
    claims={c['field']:c for c in w['claims']}
    assert {'headword','meaning','pos','stem','other'}<=set(claims) if 'verb' in w['pos'] else {'headword','meaning','pos','animacy','number','plural','possessed','stem'}<=set(claims)
    for field in ('headword','meaning','pos'):
        c=claims[field]
        assert c['assessment']=='dictionary' and c['source']==w['source'] and c['locator'],w['word']
    assert w['source'].startswith('https://nahuatl.wired-humanities.org/'),w['word']
    assert 'Tlahtōlli' in w['claims'][0]['reviewer']
    assert all(f['evidence'] in ('dictionary','text','stem','paradigm','review') for f in w['inflections'])
    assert all(f['source']==w['source'] for f in w['inflections'])
    for c in w['claims']:
        if c['assessment'] not in ('unverified',):
            assert c['locator'] and c['source'].startswith('https://'),(w['word'],c['field'])
        if c['assessment']=='text':
            assert c['field'] in ('plural','possessed'),(w['word'],c['field'])
    if w['pos'].startswith('noun') and w['word']!='tlacuilo':
        assert w['plural']=='' and w['pluralStatus']=='no_attested_form',w['word']
by={w['word']:w for w in d['words']}
assert by['āyōtl']['plural']=='' and next(c for c in by['āyōtl']['claims'] if c['field']=='plural')['assessment']=='unverified'
assert by['nacatl']['possessed'].startswith('-nacayō')
assert all(f['evidence']=='stem' for f in by['nacatl']['inflections'] if f['form']=='-nacayō')
assert by['tlacuilo']['plural']=='tlacuiloque'
assert any(f['evidence']=='text' and f['form']=='tlacuiloque' for f in by['tlacuilo']['inflections'])
assert any(f['evidence']=='dictionary' and f['form']=='onitlacac' for f in by['caqui']['inflections'])
assert all(x not in p['paradigms'] for x in names if x in ('cochi','caqui','yauh'))
with (ROOT/'claim_audit.csv').open(encoding='utf-8',newline='') as stream:
    rows=list(csv.DictReader(stream))
assert len(rows)==sum(len(w['claims']) for w in d['words'])

with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,args=['--no-sandbox'])
    page=browser.new_page()
    errors=[]
    page.on('pageerror',lambda x:errors.append(str(x)))
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
    assert int(page.locator('#total').inner_text())==len(d['words'])
    parsed=page.evaluate("""()=>{
     const f=x=>TlahtolliMorphEngine.analyze(x);
     return {
      reed:f('ācatl').some(x=>x.lemma==='ācatl'&&x.kind==='Noun citation-form segmentation'),
      salt:f('noztauh').some(x=>x.lemma==='iztatl'&&x.grade==='manuscript'),
      feather:f('noquetzale').some(x=>x.lemma==='quetzalli'&&x.grade==='manuscript'),
      scribes:f('tlacuiloque').some(x=>x.lemma==='tlacuilo'&&x.grade==='manuscript'),
      slept:f('onicoch').some(x=>x.lemma==='cochi'&&x.grade==='lexical'),
      hear:f('onitlacac').some(x=>x.lemma==='caqui'&&x.grade==='lexical'),
      love:f('onitetlazotlac').some(x=>x.lemma==='tlazotla'&&x.grade==='lexical'),
      write:f('onitlacuilo').some(x=>x.lemma==='cuiloa'),
      wrote:f('onitlahcuiloh').some(x=>x.lemma==='tlacuiloa'&&x.grade==='manuscript'),
      go:f('ōniyah').some(x=>x.lemma==='yauh'),
      sleepSegments:f('onicoch').some(x=>x.lemma==='cochi'&&x.parts.map(p=>p.surface).join('|')==='o|ni|coch'),
      hearingSegments:f('onitlacac').some(x=>x.lemma==='caqui'&&x.parts.map(p=>p.surface).join('|')==='o|ni|tla|cac'),
      motionSegments:f('ōniyah').some(x=>x.lemma==='yauh'&&x.parts.map(p=>p.surface).join('|')==='ō|ni|yah'),
      turtle:f('āyōmeh').some(x=>x.lemma==='āyōtl'&&x.grade==='manuscript'),
      corpusSize:words.length,
      totalClaims:words.reduce((n,w)=>n+(w.claims||[]).length,0)
     };
    }""")
    assert all(parsed[k] for k in ('reed','salt','feather','scribes','slept','hear','love','write','wrote','go','sleepSegments','hearingSegments','motionSegments')),parsed
    assert not parsed['turtle'],parsed
    assert parsed['corpusSize']==len(d['words']) and parsed['totalClaims']==sum(len(w['claims']) for w in d['words']),parsed
    page.locator('#analyzerDetails').evaluate('(el)=>el.open=true')
    page.locator('#formProbeInput').fill('onicoch')
    page.locator('#formProbeForm button[type="submit"]').click()
    txt=page.locator('#formProbeOutput').inner_text()
    assert 'cochi' in txt and 'Advanced morphology' in txt,txt[:700]
    assert not errors,errors
    browser.close()

print('PASS: 103 entries, 211 indexed forms, 777 sourced/provisional claims;')
print('      88-word provenance preserved, verb irregularity + cited nouns searchable offline.')
