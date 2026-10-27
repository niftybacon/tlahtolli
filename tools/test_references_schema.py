#!/usr/bin/env python3
"""Validate bibliographic source metadata and located witnesses, not their historical truth."""
import json
from pathlib import Path
from urllib.parse import urlsplit
root=Path(__file__).resolve().parents[1]
d=json.loads((root/'dictionary.json').read_text(encoding='utf8'))
p=json.loads((root/'paradigms.json').read_text(encoding='utf8'))
r=json.loads((root/'references.json').read_text(encoding='utf8'))
assert d['version']==p['version']==r['version']
assert r['format']=='tlahtolli-source-atlas' and r['schema']==1
sources={s['id']:s for s in r['sources']}
assert len(sources)==8 and len(r['witnesses'])==24
lemmas={w['word'] for w in d['words']}
for s in sources.values():
 assert urlsplit(s['url']).scheme=='https'
 assert s['rights'] and s['publisher'] and s['note']
for w in r['witnesses']:
 assert w['lemma'] in lemmas and w['sourceId'] in sources
 assert w['locator'] and w['form'] and w['evidence']=='transcription-occurrence'
 assert urlsplit(w['url']).netloc in ('florentinecodex.getty.edu','enl.wired-humanities.org','www.bible.com')
 assert not any(k in w for k in ('animacy','pluralStatus'))
print('PASS: source eras, 8 collections, 24 located witnesses; no linguistic certification')
