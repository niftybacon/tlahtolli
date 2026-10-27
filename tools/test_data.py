#!/usr/bin/env python3
"""Conservative regression examples from existing lexicon citations."""
import json
from pathlib import Path
root=Path(__file__).resolve().parents[1]
w={x['word']:x for x in json.loads((root/'dictionary.json').read_text(encoding='utf8'))['words']}
p=json.loads((root/'paradigms.json').read_text(encoding='utf8'))['paradigms']
assert w['calli']['plural']=='caltin'
assert w['xōchitl']['plural']=='xōchimeh'
assert w['tēpetl']['plural']=='tētepeh'
assert w['cītlalin']['plural']=='cīcītlaltin'
assert w['ātl']['animacy']=='inanimate'
assert p['chōca']['cells'][1][0]=='nichōcac'
assert p['nemi']['b2s']=='nen'
for lemma in ('calli','xōchitl','tēpetl','cītlalin'):
    assert any(c.get('field')=='plural' and c.get('locator') and c.get('source') for c in w[lemma]['claims'])
print('PASS: selected documented-form regression fixtures. Not comprehensive peer review.')
