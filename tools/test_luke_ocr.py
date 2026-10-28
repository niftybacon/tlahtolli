#!/usr/bin/env python3
"""Regression tests for conservative 1833 Luke OCR cleanup.
Input is synthetic, never copied from the historical book.
"""
import importlib.util,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('ocr',ROOT/'tools'/'clean_segment_luke1833.py')
ocr=importlib.util.module_from_spec(spec)
spec.loader.exec_module(ocr)
dictionary={'words':[{
 'word':'paquiliztli','original':'paquiliztli','source':'https://example.org/headword',
 'variety':'Classical Nahuatl',
 'inflections':[{'form':'paquiliztli','evidence':'dictionary','source':'https://example.org/headword'},
               {'form':'-paquil','evidence':'stem','source':'https://example.org/grammar'}]
 },{
 'word':'īhuān','original':'ihuan, yhuan','source':'https://example.org/ihuan',
 'variety':'Classical Nahuatl','inflections':[]
 },{
 'word':'inīn','original':'inin','source':'https://example.org/inin',
 'variety':'Classical Nahuatl','inflections':[]
 }]}
refs=ocr.references(dictionary)
assert 'yhuan' in refs and 'ihuan' in refs
assert 'paquil' not in refs
base=('Lorem ipsum lorem ipsum '+chr(10))*600
raw=base+'paqui-\nliztli anquihua-\nzoa in  in\n2  Tlahtolli\nSAN LUCAS, II.\n3  Cihuātl\n'
draft,report=ocr.prepare(raw,refs)
assert 'paquiliztli ' in draft
assert 'anquihua-\nzoa' in draft, 'Unsupported word must not silently be merged'
assert 'in  in' in draft,'Possible spacing join must not be automatically applied'
assert report['counts']['applied_hyphen']==1,report['counts']
assert report['counts']['unresolved_hyphen']==1
assert report['counts']['possible_space_joins']>=1
assert any(x['kind']=='possible_spaced_word' and x['status']=='needs_review' for x in report['review_queue'])
assert all(x['source_review_required'] for x in report['review_queue'])
assert report['training_approved'] is False
assert report['specialist_reviewed'] is False
assert any(v['number_candidate']==2 for v in report['verse_candidates'])
assert 'paquiliztli' not in report['original_ocr_hash']
assert report['original_ocr_hash']!=report['working_draft_hash']
print('PASS: reversible OCR repair, unsupported join preservation, conservative segmentation and evidence links')
