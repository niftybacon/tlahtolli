#!/usr/bin/env python3
import importlib.util,json
from pathlib import Path
root=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('codex',root/'tools/analyze_florentine_codex.py')
codex=importlib.util.module_from_spec(spec)
spec.loader.exec_module(codex)
books={n:'in xochitl in cuicatl. '*20 for n,_ in codex.BOOKS}
d=codex.analyze_texts(books,root/'dictionary.json')
assert len(d['books'])==12
assert d['totals']['books_checked']==12
assert d['train_eligible'] is False
assert d['verbatim_source_text_in_output'] is False
assert 'in xochitl in cuicatl.' not in json.dumps(d)
try:codex.analyze_texts({1:'foo '*200},root/'dictionary.json')
except ValueError:pass
else:raise AssertionError('Partial corpus was accepted')
live=root/'research/florentine_codex/analysis.json'
if live.exists():
 report=json.loads(live.read_text(encoding='utf-8'))
 assert report['totals']['books_checked']==12
 assert report['train_eligible'] is False
print('PASS: full-corpus aggregate analysis, no verbatim transcriptions')
