#!/usr/bin/env python3
"""Source-led Amoxtli 02: linked reader tokens, local migration, and source boundaries."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
d=json.loads((ROOT/'dictionary.json').read_text(encoding='utf8'))
p=json.loads((ROOT/'paradigms.json').read_text(encoding='utf8'))
l=json.loads((ROOT/'data/lexicon.json').read_text(encoding='utf8'))
m=json.loads((ROOT/'data/morphology.json').read_text(encoding='utf8'))
e=json.loads((ROOT/'data/evidence.json').read_text(encoding='utf8'))
new=['itic','nemini','iuhquin','inīn','ītech','quiza','tlapalli','cen','polihui']
assert len(d['words'])==len(l['words'])==len(m['entries'])==len(e['entries'])==112
assert [w['word'] for w in d['words'][103:]]==new
assert d['version']==l['version']==p['version']==m['version']==e['version']=='2026-10-27.5.0'
assert sum(len(w['claims']) for w in d['words'][:103])==777
assert sum(len(w['inflections']) for w in d['words'][:103])==211
assert sum(len(w['claims']) for w in d['words'][103:])==81
for w in d['words'][103:]:
  assert len(w['claims'])==9,(w['word'],w['claims'])
  for field in ('headword','meaning','pos'):
    claim=next(c for c in w['claims'] if c['field']==field)
    assert claim['assessment']=='dictionary' and claim['source']==w['source'] and claim['locator']
  assert any(c['field']=='other' and c['assessment']=='text' and c['locator'] for c in w['claims'])
  assert w['pluralStatus'] in ('no_attested_form','inapplicable')
  assert w['word'] not in p['paradigms']
with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,args=['--no-sandbox'])
  page=browser.new_page()
  errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.evaluate("""([d,p])=>{
   window.fetch=async u=>{
    const x=String(u),a=x.startsWith('release.json')?
    {format:'tlahtolli-release-manifest',schema:1,version:d.version,
     headwords:d.words.length,paradigms:Object.keys(p.paradigms).length}
    :x.startsWith('dictionary.json')?d:x.startsWith('paradigms.json')?p:
    {format:'tlahtolli-source-atlas',schema:1,version:d.version,sources:[],witnesses:[]};
    return new Response(JSON.stringify(a),{status:200,headers:{'Content-Type':'application/json'}});
   };
  }""",[d,p])
  page.set_content((ROOT/'index.html').read_text(encoding='utf8'),wait_until='load')
  page.wait_for_function("['Current','Synced'].some(x=>document.querySelector('#syncStatus')?.textContent.includes(x))")
  checks=page.evaluate("""()=>{
    const titles=passages.map(x=>x.title);
    const expected=['Dwelling in water','Like a shield','Flower and pigment','We go, we perish'];
    const found=passages.slice(1).map(p=>({
     title:p.title,source:p.source,tokens:getTokens(p.normalized).map((t,i)=>({
      token:t,match:resolveToken(p,i).type,
      lemma:resolveToken(p,i).word?.word||''})),
     notes:p.notes
    }));
    const draft=cleanPassage({...passageExamples[0],original:'user-written text',
      notes:'do not overwrite this note'});
    const customized=cleanPassage({...passageExamples[2],translation:'my translation'});
    const merged=mergePublishedPassages([draft,customized],[]);
    const again=mergePublishedPassages(merged.passages,merged.seen);
    const deleted=mergePublishedPassages(merged.passages.filter(p=>p.title!==passageExamples[3].title),
      merged.seen);
    return {titles,expected,found,initial:merged.passages.length,
      custom:merged.passages.find(x=>x.title===customized.title)?.translation,
      note:merged.passages[0].notes,repeatAdded:again.added.length,
      deliberatelyDeletedStillAbsent:!deleted.passages.some(p=>p.title===passageExamples[3].title),
      newNames:words.slice(103).map(x=>x.word)};
  }""")
  assert len(checks['titles'])==5,checks['titles']
  assert all(any(name in title for title in checks['titles']) for name in checks['expected'])
  assert all(x['source'].startswith('https://') for x in checks['found'])
  assert all(x['notes'] for x in checks['found'])
  assert all(x['match']!='unknown' for p in checks['found'] for x in p['tokens']),checks['found']
  assert checks['initial']==5 and checks['custom']=='my translation' and checks['note']=='do not overwrite this note'
  assert checks['repeatAdded']==0 and checks['deliberatelyDeletedStillAbsent']
  assert checks['newNames']==new
  page.locator('#tabRead').click()
  assert page.locator('#passageList [data-passage]').count()==5
  assert not errors,errors
  browser.close()
print('PASS: four sourced reader excerpts, nine new lemmas and additive local-data migration')
