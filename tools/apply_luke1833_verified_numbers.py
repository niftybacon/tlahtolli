#!/usr/bin/env python3
"""Apply only five 1833 Luke chapter-one verse-number corrections checked visually
against the public-domain scanned page images. Does not proofread verse wording.
"""
import argparse,json
from datetime import datetime,timezone
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT/'research/translation_corpus'
PATCHES=[
 dict(verse=13,find='\n1 3  Auh  in  Ángel',replace='\n13  Auh  in  Ángel',pdf_page=10,printed_page=2),
 dict(verse=31,find='\n131  Xic  itanican',replace='\n31  Xic  itanican',pdf_page=13,printed_page=5),
 dict(verse=38,find='\n.38  Auh  in  Maria',replace='\n38  Auh  in  Maria',pdf_page=13,printed_page=5),
 dict(verse=57,find='\n51  Auh  in  Isabel',replace='\n57  Auh  in  Isabel',pdf_page=15,printed_page=7),
 dict(verse=67,find='\n61  Auh  in  Zacharias',replace='\n67  Auh  in  Zacharias',pdf_page=16,printed_page=8),
 dict(chapter=2,verse=11,find='\n1 1  lpampa',replace='\n11  lpampa',pdf_page=19,printed_page=11),
 dict(chapter=2,verse=28,find='\n.  28  Auh  in  Simeón',replace='\n28  Auh  in  Simeón',pdf_page=21,printed_page=13),
]
def apply(text):
 changes=[]
 for p in PATCHES:
  if text.count(p['find'])!=1:raise ValueError('Expected exactly one OCR marker for Luke 1:'+str(p['verse']))
  start=text.index(p['find'])
  if p.get('chapter',1)==1 and start>13000:raise ValueError('Chapter 1 patch fell outside chapter')
  if p.get('chapter',1)==2 and not 12200<start<20600:raise ValueError('Chapter 2 patch outside chapter')
  text=text.replace(p['find'],p['replace'],1)
  changes.append({'chapter':p.get('chapter',1),'verse':p['verse'],'before':p['find'].strip(),'after':p['replace'].strip(),
   'pdf_page_1based':p['pdf_page'],'printed_page':p['printed_page'],
   'verification':'original_1833_scanned_image_verified_number_only'})
 return text,changes
def main():
 parser=argparse.ArgumentParser()
 parser.add_argument('--input',type=Path,default=BASE/'luke_1833_working_ocr.txt')
 parser.add_argument('--report',type=Path,default=BASE/'luke_1833_facsimile_number_checks.json')
 args=parser.parse_args()
 text=args.input.read_text(encoding='utf8')
 corrected,changes=apply(text)
 args.input.write_text(corrected,encoding='utf8')
 report={
  'format':'tlahtolli-luke1833-facsimile-number-checks','schema':1,
  'created_utc':datetime.now(timezone.utc).isoformat(timespec='seconds'),
  'source':'https://commons.wikimedia.org/wiki/File:Yacuic_iyec_tenonotzaltzin_in_Jesu-Christo,_quenami_oquimo_ihcuilhuili_in_San_Lucas.pdf',
  'source_pdf_page_count':152,
  'chapter_1_pdf_pages_checked_1based':list(range(9,18)),
  'chapter_1_printed_pages_checked_1based':list(range(1,10)),
  'chapter_1_verse_numeral_sequence':'1–80 visually checked across printed pages 1–9; not a line-by-line reading of Nahuatl wording',
  'chapter_1_verse_numbering_status':'pages_checked_numbering_only',
  'chapter_1_verse_wording_verified':False,
  'chapter_2_pdf_pages_checked_1based':list(range(18,24)),
  'chapter_2_printed_pages_checked_1based':list(range(10,16)),
  'chapter_2_verse_numeral_sequence':'1–52 visually checked across printed pages 10–15, not a line-by-line correction of Nahuatl wording',
  'chapter_2_verse_numbering_status':'pages_checked_numbering_only',
  'chapter_2_partial_observation':'Printed page 11 confirms verse 11; printed page 13 confirms verse 28, both OCR numeral errors.',
  'other_22_chapters_verse_numerals_not_fully_checked':True,
  'patches':changes,
  'rights':'1833 original edition public domain; no modern copyrighted Bible translations used',
  'caveat':'These five numeral corrections are image-checked. Other punctuation, spelling and word boundaries remain unreviewed.',
  'training_approved':False,
 }
 args.report.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
 print('Chapter 1: printed 1–80, Chapter 2: printed 1–52 page-checked. '+str(len(changes))+' numeral corrections; wording remains unreviewed.')
if __name__=='__main__':main()
