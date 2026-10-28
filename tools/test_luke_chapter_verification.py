#!/usr/bin/env python3
"""Guard against overstating Luke 1833 chapter/wording verification."""
import json
from pathlib import Path
base=Path(__file__).resolve().parents[1]/'research/translation_corpus'
d=json.loads((base/'luke_1833_chapter_audit.json').read_text(encoding='utf8'))
p=json.loads((base/'luke_1833_facsimile_number_checks.json').read_text(encoding='utf8'))
assert d['format']=='tlahtolli-luke1833-chapter-audit'
assert d['totals']['chapters_located']==24
assert d['totals']['reference_verse_count']==1151
assert len(d['chapters'])==24
assert d['facsimile_review_completed_chapters']==0
assert d['training_approved'] is False
assert p['format']=='tlahtolli-luke1833-facsimile-number-checks'
assert len(p['patches'])>=8
for chapter in range(1,4):
 c=d['chapters'][chapter-1]
 assert c['chapter']==chapter
 assert c['verse_numbering_print_checked'] is True
 assert c['verses_needing_marker_review']==[]
 assert c['distinct_verse_numbers_seen_2_to_end']==c['expected_verse_count']-1
 assert c['verse_text_verified'] is False
 assert c['facsimile_pages_checked']
for c in d['chapters'][3:]:
 assert c['verse_text_verified'] is False
 assert not c.get('verse_numbering_print_checked',False)
print('PASS: 24 chapters structurally audited, 1–3 image-checked numerals, 0 entire chapters word-proofread')
