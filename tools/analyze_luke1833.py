#!/usr/bin/env python3
"""Preliminary research scan of the public-domain 1833 Nahuatl Gospel of Luke.

Reads an Internet Archive machine transcription or a locally checked transcript.
Records only aggregate spelling statistics. OCR is NOT a verified sentence corpus.
This tool makes no use of the modern 2004/2011 Nahuatl Bible translations.
"""
import argparse
from collections import Counter
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import re
from urllib.request import Request, urlopen
import time
import unicodedata

ROOT=Path(__file__).resolve().parents[1]
SOURCE='https://archive.org/details/elevangeliodeslu00pazy'
TEXT_URL='https://archive.org/download/elevangeliodeslu00pazy/elevangeliodeslu00pazy_djvu.txt'
TOKEN=re.compile(r"[^\W\d_]+(?:['’][^\W\d_]+)*",re.UNICODE)
CLASSES={'Classical Nahuatl','Classical Nahuatl (historical dictionary lemma)'}

def normalize(token):
 s=unicodedata.normalize('NFD',str(token).casefold())
 return ''.join(c for c in s if unicodedata.category(c)!='Mn')

def variants(token):
 first=normalize(token)
 proposals={first}
 transforms=[
  lambda s:s.replace('quj','qui'),
  lambda s:s.replace('nj','ni'),
  lambda s:s.replace('j','i'),
  lambda s:s.replace('v','u'),
  lambda s:s.replace('ç','z'),
  lambda s:'i'+s[1:] if s.startswith('y') else s,
 ]
 for tr in transforms:proposals.add(tr(first))
 # Two-step normalizations remain hypotheses, not transcribed spelling.
 for x in list(proposals):
  for tr in transforms:proposals.add(tr(x))
 return proposals

def lexicon(path):
 obj=json.loads(path.read_text(encoding='utf-8'))
 results=set()
 for item in obj['words']:
  if item.get('variety') not in CLASSES:continue
  for key in ('word','original'):
   spelling=item.get(key,'').strip()
   if len(TOKEN.findall(spelling))==1:results.add(normalize(spelling))
 return results

def fetch(limit=3_000_000):
 last=None
 for attempt in range(3):
  try:
   req=Request(TEXT_URL,headers={'User-Agent':'Tlahtolli-Research/0.1 (1833 historical edition, aggregate statistics only)'})
   with urlopen(req,timeout=50) as res:
    content=res.read(limit+1)
    if len(content)>limit:raise ValueError('OCR transcription exceeds byte limit')
    if not content or b'<html' in content[:300].lower():raise ValueError('Unexpected HTML/empty OCR')
    return content.decode('utf-8-sig',errors='replace')
  except Exception as e:
   last=e
   if attempt<2:time.sleep(4*(attempt+1))
 raise RuntimeError('1833 Archive OCR unavailable: '+str(last))

def analyze(text,vocab):
 if len(text)<10000:raise ValueError('OCR seems incomplete: fewer than 10,000 characters')
 raw=TOKEN.findall(text)
 if len(raw)<1800:raise ValueError('Too few letter-like OCR units; verify the source')
 counts=Counter(normalize(x) for x in raw)
 exact=sum(n for t,n in counts.items() if t in vocab)
 candidates=sum(n for t,n in counts.items() if t not in vocab and (variants(t)&vocab))
 total=sum(counts.values())
 return {
  'format':'tlahtolli-luke1833-aggregate-analysis',
  'schema':1,
  'created_utc':datetime.now(timezone.utc).isoformat(timespec='seconds'),
  'original_publication':'Mariano Paz y Sánchez, Gospel of Luke translated into Nahuatl, 1833',
  'source':SOURCE,
  'text_provider':TEXT_URL,
  'edition_rights':'Original 1833 edition is public domain (Wikimedia Commons Public Domain Mark).',
  'variety':'Historical southern Puebla Nahuatl, ca. 1830, not automatically identical to sixteenth-century central Nahuatl.',
  'text_quality':'UNVERIFIED archive OCR. Frequent scanning/printing errors and historical spelling variations; not suitable for direct model training.',
  'text_redistributed':False,
  'training_ready':False,
  'parallel_aligned':False,
  'source_sha256':hashlib.sha256(text.encode('utf-8')).hexdigest(),
  'stats':{
   'approximate_ocr_letter_runs':total,'distinct_ocr_forms':len(counts),
   'dictionary_exact_form_occurrences':exact,
   'dictionary_hypothetical_normalization_occurrences':candidates,
   'dictionary_exact_form_percent':round(100*exact/total,2),
   'dictionary_tentative_plus_exact_percent':round(100*(exact+candidates)/total,2),
   'page_break_markers':text.count('\f')},
  'frequent_written_forms':counts.most_common(25),
  'notes':[
   'These measurements are OCR token runs, not linguistically verified word counts.',
   'Orthographic transformations are only candidate comparisons. No automatic vowel-length inference.',
   'Source references and spelling counts cannot substitute for aligned sentence-level translation pairs.'
  ]
 }

def main():
 p=argparse.ArgumentParser()
 mode=p.add_mutually_exclusive_group(required=True)
 mode.add_argument('--download-archive',action='store_true')
 mode.add_argument('--input-text',type=Path)
 p.add_argument('--output',type=Path,default=ROOT/'research/translation_corpus/luke_1833_analysis.json')
 args=p.parse_args()
 text=fetch() if args.download_archive else args.input_text.read_text(encoding='utf-8-sig')
 report=analyze(text,lexicon(ROOT/'dictionary.json'))
 args.output.parent.mkdir(exist_ok=True,parents=True)
 args.output.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 print('Analyzed 1833 Luke source: '+str(report['stats']['approximate_ocr_letter_runs'])+
  ' preliminary OCR units; verified training pairs: 0')
 return 0

if __name__=='__main__':raise SystemExit(main())
