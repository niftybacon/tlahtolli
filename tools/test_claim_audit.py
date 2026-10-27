#!/usr/bin/env python3
"""Field-evidence status and corrected plural regression (not specialist verification)."""
from pathlib import Path
import json,csv
r=Path(__file__).resolve().parents[1]
d=json.loads((r/'dictionary.json').read_text(encoding='utf8'))
p=json.loads((r/'paradigms.json').read_text(encoding='utf8'))
s=json.loads((r/'references.json').read_text(encoding='utf8'))
assert d['version']==p['version']==s['version']=='2026-10-27.2'
assert len(d['words'])==88 and len(p['paradigms'])==12
fields={'headword','meaning','pos'}
for i,w in enumerate(d['words']):
  claims=w.get('claims',[])
  f={c['field'] for c in claims}
  assert fields<=f,w['word']
  if 'noun' in w['pos'].lower():
    assert {'animacy','number','plural','possessed','stem'}<=f,w['word']
  if i>=44:
    for name in fields:
      assert any(c['field']==name and c['assessment'] in ('dictionary','grammar') and c['locator'] and c['source']==w['source'] for c in claims),(w['word'],name)
    assert any(c['field']=='animacy' and c['assessment']=='unverified' for c in claims)
    assert any(c['field']=='number' and c['assessment']=='unverified' for c in claims)
assert d['words'][44]['word']=='tonalli' and not d['words'][44]['plural']
assert any(c['field']=='plural' and 'plural ending/pattern' in c['note'] for c in d['words'][44]['claims'])
for name,plural in [('conetl','cōconeh'),('ichpochtli','ichpōpōchtin'),('telpochtli','tēlpōpōchtin'),('namictli','nānāmictin')]:
  w=next(w for w in d['words'] if w['word']==name)
  assert w['plural']==plural and w['pluralStatus']=='attested'
from collections import Counter
counts=Counter(c['assessment'] for w in d['words'] for c in w['claims'])
assert counts=={"dictionary":313,"unverified":349,"grammar":8,"text":4},counts
with (r/'claim_audit.csv').open(encoding='utf-8',newline='') as f: rows=list(csv.DictReader(f))
assert len(rows)==674
assert 'function renderClaimLedger' in (r/'index.html').read_text(encoding='utf8')
print('PASS: 88 headwords, 672 claim-level records, plural and source-grading safeguards')

# v2.2 additional source checks in founding 44 entries.
assert all(any(c.get('field')==f and c.get('assessment')!='unverified' and c.get('locator') for c in w['claims']) for w in d['words'][:44] for f in ('headword','meaning','pos'))
assert next(w for w in d['words'] if w['word']=='tlālli')['claims'][0] is not None
assert any(c['field']=='plural' and 'late' in c['note'].lower() and c['assessment']=='text' for c in next(w for w in d['words'] if w['word']=='tlālli')['claims'])
