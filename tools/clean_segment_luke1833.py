#!/usr/bin/env python3
"""Reversible OCR cleanup + candidate verse segmentation of public-domain 1833 Luke.

No trained model, no unreviewed transcriptions marked authoritative. The full
working text is explicitly an automatically prepared OCR draft.
"""
import argparse
from collections import Counter
import hashlib,json,re,sys,unicodedata
from pathlib import Path
from datetime import datetime,timezone

ROOT=Path(__file__).resolve().parents[1]
DIR=ROOT/'research/translation_corpus'
SOURCE='https://archive.org/details/elevangeliodeslu00pazy'
L=r'[^\W\d_]'
TOKEN=re.compile(L+r'+',re.UNICODE)
HYPHEN=re.compile(r'('+L+r'{2,})-[ \t]*\r?\n[ \t]*('+L+r'{2,})',re.UNICODE)
SPACED=re.compile(r'(?<!\w)('+L+r'{1,7})[ \t]+('+L+r'{2,})(?!\w)',re.UNICODE)
HEADER=re.compile(r'(?im)\bSAN\s+LUCAS\s*[,\.]\s*([IVXLCDM]{1,8})\b')
VERSE=re.compile(r'(?m)^[ \t]*(\d{1,3})[ \t]+('+L+r'{2,})',re.UNICODE)

def fold(t):
 return ''.join(c for c in unicodedata.normalize('NFD',t.casefold()) if unicodedata.category(c)!='Mn')
def references(dictionary):
 forms={}
 def add(surface,lemma,source,status):
  if not surface or len(TOKEN.findall(surface))!=1 or '-' in surface:return
  key=fold(surface)
  if len(key)<2:return
  entry={'lemma':lemma,'source':source or '', 'evidence':status}
  arr=forms.setdefault(key,[])
  if entry not in arr:arr.append(entry)
 for w in dictionary['words']:
  if w.get('variety') not in {'Classical Nahuatl','Classical Nahuatl (historical dictionary lemma)'}:continue
  for term in [w.get('word','')]+re.split(r'[/,;]',w.get('original','')):
   add(term.strip(),w['word'],w.get('source'),'published_lemma_or_spelling')
  for form in w.get('inflections',[]):
   if form.get('evidence') in {'dictionary','text','grammar'}:
    add(form.get('form',''),w['word'],form.get('source'),form['evidence'])
 return forms

def prepare(raw,ref,max_queue=1300):
 if len(raw)<12000:raise ValueError('OCR is incomplete')
 tokens=Counter(fold(m.group()) for m in TOKEN.finditer(raw))
 edits=[];queue=[];stats=Counter()
 for m in HYPHEN.finditer(raw):
  combined=m[1]+m[2];k=fold(combined);refs=ref.get(k,[]);hits=tokens.get(k,0)
  safe=bool(refs) or hits>=2
  item={'kind':'line_hyphen_join','offset':m.start(),'original':m.group(),
        'proposed':combined,'status':'mechanical_applied' if safe else 'needs_review',
        'reason':'published_form' if refs else 'repeated_unsplit_in_ocr' if safe else 'not_supported',
        'lexical_references':refs[:2],
        'source_review_required':True}
  stats['applied_hyphen' if safe else 'unresolved_hyphen']+=1
  if len(queue)<max_queue:queue.append(item)
  if safe:edits.append((m.start(),m.end(),combined))
 seen_space=set();selected_spaces=0
 for m in SPACED.finditer(raw):
  proposal=m[1]+m[2];refs=ref.get(fold(proposal),[])
  if not refs:continue
  stats['possible_space_joins']+=1
  pair=fold(m.group())
  if selected_spaces>=325 or pair in seen_space:continue
  seen_space.add(pair);selected_spaces+=1
  queue.append({'kind':'possible_spaced_word','offset':m.start(),
    'original':m.group(),'proposed':proposal,'status':'needs_review',
    'reason':'complete_form_in_published_dictionary_but_spacing_may_be_real',
    'lexical_references':refs[:2],'source_review_required':True})
 out=[];cursor=0
 for start,end,word in edits:
  if start<cursor:continue
  out.extend([raw[cursor:start],word]);cursor=end
 out.append(raw[cursor:]);working=''.join(out)
 headings=[{'offset':m.start(),'roman':m.group(1),'review_status':'unverified'} for m in HEADER.finditer(raw)]
 markers=[(m.start(),int(m[1]),m[2]) for m in VERSE.finditer(raw) if 1<=int(m[1])<=80]
 sections=[]
 for i,(offset,num,word) in enumerate(markers):
  end=markers[i+1][0] if i+1<len(markers) else len(raw)
  chunk=raw[offset:end]
  if len(chunk)<20:continue
  # Only tentative verse segmentation; page numbers and running headers can mimic verse numbers.
  sections.append({'id':'ocr-'+str(offset),'raw_offset':offset,'number_candidate':num,
     'first_word':word,'preceding_heading':next((h['roman'] for h in reversed(headings) if h['offset']<offset),None),
     'text_preview':re.sub(r'\s+',' ',chunk[:350]).strip(),
     'text_length':len(chunk),'status':'unverified_ocr_segmentation'})
 stats['header_candidates']=len(headings);stats['verse_start_candidates']=len(sections)
 report={'format':'tlahtolli-luke1833-ocr-segmentation','schema':1,
  'source':SOURCE,'year':1833,'created_utc':datetime.now(timezone.utc).isoformat(timespec='seconds'),
  'variety':'historic southern Puebla Nahuatl (not automatically equivalent to Classical Nahuatl)',
  'original_ocr_hash':hashlib.sha256(raw.encode('utf8')).hexdigest(),
  'working_draft_hash':hashlib.sha256(working.encode('utf8')).hexdigest(),
  'status':'draft_only','training_approved':False,'specialist_reviewed':False,
  'automatic_policy':'Only join line-ending hyphens when published forms or >=2 unsplit occurrences support the join; no automatic merge of spaced prefixes, normalization or emendation.',
  'counts':dict(stats),'running_headers':headings[:140],
  'verse_candidates':sections, 'verse_candidates_total':len(sections), 'verse_candidates_truncated':False,
  'review_queue':queue,'queue_capped':len(queue)>=max_queue,
  'note':'Numbers and header markers may be page numbers; no chapter/verse alignment has been verified. OCR previews are from a public-domain 1833 printed work.'}
 return working,report

def main():
 p=argparse.ArgumentParser()
 group=p.add_mutually_exclusive_group(required=True)
 group.add_argument('--download-archive',action='store_true')
 group.add_argument('--input-text',type=Path)
 p.add_argument('--working-file',type=Path,default=DIR/'luke_1833_working_ocr.txt')
 p.add_argument('--review-file',type=Path,default=DIR/'luke_1833_review_queue.json')
 args=p.parse_args()
 if args.download_archive:
  from analyze_luke1833 import fetch
  raw=fetch()
 else:raw=args.input_text.read_text(encoding='utf-8-sig')
 dic=json.loads((ROOT/'dictionary.json').read_text(encoding='utf8'))
 text,review=prepare(raw,references(dic))
 args.working_file.parent.mkdir(parents=True,exist_ok=True)
 args.working_file.write_text('# UNREVIEWED AUTOMATIC OCR WORKING DRAFT. Source: '+SOURCE+'\n'+text,encoding='utf8')
 review['working_draft_hash']=hashlib.sha256(args.working_file.read_text(encoding='utf8').encode('utf8')).hexdigest()
 review['hash_convention']='UTF-8 decoded text with universal newlines, including draft header'
 args.review_file.write_text(json.dumps(review,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
 print('1833 Luke draft prepared: '+str(review['counts']))
 return 0
if __name__=='__main__':sys.exit(main())
