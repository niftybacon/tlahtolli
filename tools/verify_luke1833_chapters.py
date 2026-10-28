#!/usr/bin/env python3
"""24-chapter structural audit of public-domain 1833 Nahuatl Luke OCR.
OCR heading recognition != facsimile page verification. No text altered.
"""
import argparse
from collections import Counter
from datetime import datetime,timezone
import hashlib,json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT/'research/translation_corpus'
EXPECTED=[80,52,38,44,39,49,50,56,62,42,54,59,35,35,32,31,37,43,48,47,38,71,56,53]
HEADING=re.compile(r'\b(?:IC|1C)\s+([^\n]{1,90}?)\s+(?:QUAITL|CUAITL)\b',re.IGNORECASE)
WORD=r'[^\W\d_]'
VERSE=re.compile(r'(?m)^[ \t]*(\d{1,3})[ \t]+('+WORD+r'{1,})',re.UNICODE)
SPLIT_NUMBER=re.compile(r'(?m)^[ \t]*(\d)[ \t]+(\d)[ \t]+('+WORD+r'{2,})',re.UNICODE)
def analyze(content):
 headings=[]
 for m in HEADING.finditer(content):
  heading=' '.join(m.group(0).split())
  if not any(x in heading.upper() for x in ('TENON','TENOX','TONONO','TENOST')) and 'MATLACTLI YHUAN YEY' not in heading.upper():
   continue
  headings.append((m.start(),m.end(),heading))
 if len(headings)!=24:
  raise ValueError(f'Expected 24 chapter headings, found {len(headings)}; manual boundary review required.')
 chapters=[]
 for i,(start,end,heading) in enumerate(headings):
  chapter=i+1;limit=headings[i+1][0] if i+1<len(headings) else len(content)
  section=content[end:limit];expected=EXPECTED[i];markers=[]
  for m in VERSE.finditer(section):
   n=int(m.group(1));first=m.group(2)
   if first.upper() in ('SAN','LUCAS','LUGAS'):continue
   markers.append({'verse':n,'absolute_offset':end+m.start(),
                   'first_word_ocr':first[:45],'printed_digits':m.group(1)})
  possible={m['verse'] for m in markers if 2<=m['verse']<=expected}
  missing=[v for v in range(2,expected+1) if v not in possible]
  split=[]
  for m in SPLIT_NUMBER.finditer(section):
   n=int(m.group(1)+m.group(2))
   if 2<=n<=expected and n in missing:
    split.append({'possible_verse':n,'absolute_offset':end+m.start(),
      'printed_digits':m.group(1)+' '+m.group(2),
      'first_word_ocr':m.group(3)[:45],'status':'needs_image_confirmation'})
  seen=Counter(m['verse'] for m in markers if 2<=m['verse']<=expected)
  duplicated=sorted(n for n,count in seen.items() if count>1)
  anomalous=[{'printed_digits':m['printed_digits'],'absolute_offset':m['absolute_offset']}
             for m in markers if m['verse']>expected or m['verse']==0]
  in_order=[m['verse'] for m in markers if 2<=m['verse']<=expected]
  reversals=sum(1 for a,b in zip(in_order,in_order[1:]) if b<a)
  implicit=not any(m['verse']==1 for m in markers)
  damaged=heading.upper().startswith('1C ') or any(x in heading.upper() for x in
          ('CUAITL','TENONOTLAL','TENOXOTZAL','TENOSTOTZAL','TONONOTZAL'))
  chapters.append({
   'chapter':chapter,'ocr_heading':heading,'ocr_heading_offset':start,
   'heading_end_offset':end,'end_before_offset':limit,
   'expected_verse_count':expected,
   'heading_status':'recognized_ocr_damaged' if damaged else 'recognized_unverified',
   'verse_1_status':'implicit_ocr_position_not_facsimile_checked' if implicit else 'explicit_ocr_marker_unverified',
   'distinct_verse_numbers_seen_2_to_end':len(possible),
   'verses_needing_marker_review':missing,
   'suspected_split_numerals':split[:20],
   'duplicate_verse_marker_candidates':duplicated,
   'out_of_range_marker_candidates':anomalous[:20],
   'out_of_order_number_transitions':reversals,
   'marker_samples':markers[:3]+markers[-3:] if len(markers)>6 else markers,
   'facsimile_pages_checked':[],
   'chapter_status':'OCR_STRUCTURAL_AUDIT_ONLY',
   'verse_text_verified':False,
   'review_priority':'high' if damaged or len(missing)>=6 or reversals>=2 else 'normal',
  })
 return {
  'format':'tlahtolli-luke1833-chapter-audit','schema':1,
  'created_utc':datetime.now(timezone.utc).isoformat(timespec='seconds'),
  'source':'https://archive.org/details/elevangeliodeslu00pazy',
  'original_publication_year':1833,
  'input_ocr_sha256':hashlib.sha256(content.encode('utf8')).hexdigest(),
  'verse_count_reference':'https://www.mobile.catholic-resources.org/Bible/NT-Statistics-Greek.htm',
  'editorial_status':'UNREVIEWED_MACHINE_STRUCTURAL_CHECK; not facsimile transcription verification',
  'facsimile_review_completed_chapters':0,
  'training_approved':False,
  'totals':{
   'chapters_located':len(chapters),
   'reference_verse_count':sum(EXPECTED),
   'chapter_headings_needing_review':sum(c['heading_status']!='recognized_unverified' for c in chapters),
   'verse_marker_positions_requiring_review':sum(len(c['verses_needing_marker_review']) for c in chapters)},
  'chapters':chapters}
def main():
 p=argparse.ArgumentParser()
 p.add_argument('--input',type=Path,default=BASE/'luke_1833_working_ocr.txt')
 p.add_argument('--output',type=Path,default=BASE/'luke_1833_chapter_audit.json')
 args=p.parse_args()
 report=analyze(args.input.read_text(encoding='utf8'))
 checked=BASE/'luke_1833_facsimile_number_checks.json'
 if checked.exists():
  review=json.loads(checked.read_text(encoding='utf8'))
  if review.get('format')=='tlahtolli-luke1833-facsimile-number-checks' and len(review.get('patches',[]))==6:
   first=report['chapters'][0]
   first['facsimile_pages_checked']=review['chapter_1_pdf_pages_checked_1based']
   first['chapter_status']='PRINTED_VERSE_NUMERALS_CHECKED_TEXT_NOT_PROOFREAD'
   first['verse_numbering_print_checked']=True
   first['verse_text_verified']=False
   second=report['chapters'][1]
   second['facsimile_pages_checked']=review['chapter_2_partial_pdf_pages_checked_1based']
   second['chapter_status']='SELECTED_VERSE_NUMERALS_CHECKED_TEXT_NOT_PROOFREAD'
   report['totals']['chapters_with_facsimile_numbering_checks']=2
   report['totals']['chapters_with_full_wording_proofread']=0
 args.output.parent.mkdir(exist_ok=True,parents=True)
 args.output.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
 print('Audit: '+str(report['totals']))
if __name__=='__main__':main()
