"""Committed-data regressions for October 28 audit corrections."""
import hashlib,json
from pathlib import Path
R=Path(__file__).resolve().parents[1]
def read(p): return json.loads((R/p).read_text(encoding='utf8'))
base='research/translation_corpus/'
q=read(base+'luke_1833_review_queue.json')
text=(R/base/'luke_1833_working_ocr.txt').read_text(encoding='utf8')
assert q['working_draft_hash']==hashlib.sha256(text.encode('utf8')).hexdigest()
assert len(q['verse_candidates'])==q['counts']['verse_start_candidates']
assert not q['verse_candidates_truncated']
assert all(x['status']=='needs_review' for x in q['review_queue'])
assert (R/base/q['previous_review_file']).exists()
words=read('dictionary.json')['words']; by={w['word']:w for w in words}
assert 'tepētl' in by and 'tēpetl' not in by
# Normalized publication/study identity remains identical after vowel correction.
import unicodedata
fold=lambda s: ''.join(c for c in unicodedata.normalize('NFD',s) if not unicodedata.combining(c))
assert fold('tēpetl')==fold('tepētl')
assert all(x['lemma'] in by for x in read('references.json')['witnesses'])
assert all('p. 134' not in c['locator'] for c in by['mati']['claims'])
assert all(c['assessment']=='inference' for w in words for c in w['claims'] if c['locator']=='Editorial applicability decision; precise grammatical source pending')
print('PASS: current OCR hash, complete candidates, pending repairs, preserved history, lemma identities and citation downgrades')
