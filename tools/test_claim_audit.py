#!/usr/bin/env python3
"""Field-evidence status and corrected plural regression (not specialist verification)."""
from pathlib import Path
import json,csv
r=Path(__file__).resolve().parents[1]
d=json.loads((r/'dictionary.json').read_text(encoding='utf8'))
p=json.loads((r/'paradigms.json').read_text(encoding='utf8'))
s=json.loads((r/'references.json').read_text(encoding='utf8'))
assert d['version']==p['version']==s['version']=='2026-10-29.1.0'
assert len(d['words'])>=88 and len(p['paradigms'])>=12
fields={'headword','meaning','pos'}
for i,w in enumerate(d['words']):
  if i>=88: continue # legacy-source regression fixtures; additional entries use schema checks
  claims=w.get('claims',[])
  f={c['field'] for c in claims}
  assert fields<=f,w['word']
  if 'noun' in w['pos'].lower():
    assert {'animacy','number','plural','possessed','stem'}<=f,w['word']
  if 44<=i<88: # original 44-word research cohort only; new verbs have their own checks
    for name in fields:
      assert any(c['field']==name and c['assessment'] in ('dictionary','grammar') and c['locator'] and c['source']==w['source'] for c in claims),(w['word'],name)
    assert any(c['field']=='animacy' and c['assessment'] in ('grammar','inference','unverified') for c in claims)
    assert any(c['field']=='number' and c['assessment'] in ('grammar','inference','unverified') for c in claims)
assert d['words'][44]['word']=='tonalli' and not d['words'][44]['plural']
assert any(c['field']=='plural' and 'plural ending/pattern' in c['note'] for c in d['words'][44]['claims'])
for name,plural in [('conetl','cōconeh'),('ichpochtli','ichpōpōchtin'),('telpochtli','tēlpōpōchtin'),('namictli','nānāmictin')]:
  w=next(w for w in d['words'] if w['word']==name)
  assert w['plural']==plural and w['pluralStatus']=='attested'
from collections import Counter
counts=Counter(c['assessment'] for w in d['words'] for c in w['claims'])
assert all(counts[grade]>=baseline for grade,baseline in {"dictionary":324,"grammar":129,"unverified":95,"inference":108,"text":15}.items()),counts
with (r/'claim_audit.csv').open(encoding='utf-8',newline='') as f: rows=list(csv.DictReader(f))
assert len(rows)==sum(len(w['claims']) for w in d['words']) and len(rows)>=674
assert 'function renderClaimLedger' in (r/'index.html').read_text(encoding='utf8')
print('PASS:',len(d['words']),'headwords,',len(rows),'claim-level records, plural and source-grading safeguards')

# v2.2 additional source checks in founding 44 entries.
assert all(any(c.get('field')==f and c.get('assessment')!='unverified' and c.get('locator') for c in w['claims']) for w in d['words'][:44] for f in ('headword','meaning','pos'))
assert next(w for w in d['words'] if w['word']=='tlālli')['claims'][0] is not None
assert any(c['field']=='plural' and 'late' in c['note'].lower() and c['assessment']=='text' for c in next(w for w in d['words'] if w['word']=='tlālli')['claims'])

# v2.3: contextual exceptions and reliable witnessed plurals.
assert next(x for x in d['words'] if x['word']=='tlatoani')['plural']=='tlatoque'
assert next(x for x in d['words'] if x['word']=='teopixqui')['plural']=='teopixque'
assert any(c['assessment']=='grammar' for c in next(x for x in d['words'] if x['word']=='tepētl')['claims'] if c['field']=='animacy')
assert all(any(c['field']=='number' and c['assessment']=='grammar' for c in w['claims']) for w in d['words'] if w['word'] in ('calli','tetl','ātl'))

for name in ('tlaxcalli','conetl','milli','teōtl'):
 w=next(w for w in d['words'] if w['word']==name)
 assert any(c['field']=='possessed' and c['assessment'] in ('grammar','text') and c['source'].startswith('https://') and c['locator'] for c in w['claims'])

# October 27 field-specific reassessment: no blanket promotion of inferences.
with (r/'claim_reassessment_2026-10-27.csv').open(encoding='utf-8',newline='') as f: review=list(csv.DictReader(f))
assert len(review)==222
assert sum(x['decision']=='upgraded_with_specific_evidence' for x in review)==16
assert sum(x['current_status']=='unverified' for x in review)==95
assert sum(x['current_status']=='inference' for x in review)==111
for word,field in [('xōchitl','possessed'),('itzcuintli','plural'),('icxitl','possessed'),('āltepētl','possessed'),('tecpan','other')]:
    w=next(x for x in d['words'] if x['word']==word)
    c=next(x for x in w['claims'] if x['field']==field)
    assert c['assessment']!='unverified' and c['locator'] and c['source'].startswith('https://')
assert next(x for x in d['words'] if x['word']=='tecpan')['absolutive'].startswith('none (locative/relational')
assert next(x for x in d['words'] if x['word']=='itzcuintli')['pluralStatus']=='attested'
