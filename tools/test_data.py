#!/usr/bin/env python3
"""Conservative regression examples from existing lexicon citations."""
import json
from pathlib import Path
root=Path(__file__).resolve().parents[1]
w={x['word']:x for x in json.loads((root/'dictionary.json').read_text(encoding='utf8'))['words']}
p=json.loads((root/'paradigms.json').read_text(encoding='utf8'))['paradigms']
assert w['calli']['plural']=='caltin'
assert w['xōchitl']['plural']=='xōchimeh'
assert w['tepētl']['plural']=='tētepeh'
assert w['cītlalin']['plural']=='cīcītlaltin'
assert w['ātl']['animacy']=='inanimate'
assert p['chōca']['cells'][1][0]=='nichōcac'
assert p['nemi']['b2s']=='nen'
for lemma in ('calli','xōchitl','tepētl','cītlalin'):
    assert any(c.get('field')=='plural' and c.get('locator') and c.get('source') for c in w[lemma]['claims'])
for lemma,field in [('tlācatl','plural'),('pilli','plural'),('ōcēlōtl','plural'),('nemi','stem'),('cuīcatl','possessed')]:
    assert any(c.get('field')==field and c.get('source','').startswith('https://') and c.get('locator') for c in w[lemma]['claims'])
assert sum(len(x.get('claims',[])) for x in w.values())>=13
print('PASS: selected documented-form regression fixtures. Not comprehensive peer review.')

# v2.0 lexicographic expansion and explicitly uncertain animacy.
new=json.loads((root/'dictionary.json').read_text(encoding='utf8'))['words'][44:88]
assert len(new)==44 and len({x['word'] for x in new})==44
assert all(len(x.get('claims',[]))>=3 and x['source'].startswith('https://nahuatl.wired-humanities.org/content/') for x in new)
assert all(any(c.get('field')=='animacy' and c.get('assessment') in ('grammar','inference','unverified') for c in x['claims']) for x in new)
for lemma,plural in [('conetl','cōconeh'),('ichpochtli','ichpōpōchtin'),('telpochtli','tēlpōpōchtin'),('namictli','nānāmictin')]:
 x=next(x for x in new if x['word']==lemma)
 assert x['plural']==plural and x['pluralStatus']=='attested'
