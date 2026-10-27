#!/usr/bin/env python3
"""Prepare a source-documented dictionary entry. Checks structure, not historical truth."""
from pathlib import Path
import json, argparse, re, sys, unicodedata
from datetime import date

ROOT=Path(__file__).resolve().parents[1]
FIELDS=['word','meaning','pos','stem','original','variety','status','source','example','translation','notes','number','animacy','plural','pluralStatus','absolutive','possessed','grammarSource','grammarNotes']
FORM_FIELDS=['form','category','gloss','evidence','source','note']
CLAIM_FIELDS=['field','assessment','source','locator','note','reviewer','checkedAt']

def fail(msg): raise ValueError(msg)
def key(w):
    def n(s): return ''.join(c for c in unicodedata.normalize('NFD',s.lower()) if not unicodedata.combining(c))
    return (n(w.get('variety','')),n(w.get('word','')))
def normalize(o):
    if not isinstance(o,dict): fail('Expected a single JSON object')
    entry={f:str(o.get(f,'') or '').strip() for f in FIELDS}
    entry['variety']=entry['variety'] or 'Classical Nahuatl'
    entry['status']=entry['status'] or 'Draft'
    if not all(entry[x] for x in ('word','meaning','pos','variety')): fail('Missing core lemma fields')
    if len(entry['word'])>160:fail('Headword too long')
    if entry['status']=='Checked against source' and not entry['source'].startswith(('http://','https://')):fail('Missing lexical source')
    if 'noun' not in entry['pos'].lower() and entry['animacy'] in ('animate','inanimate'):fail('Animacy on a non-noun')
    if entry['pluralStatus']=='attested' and not entry['plural']:fail('Attested plural needs exact written form')
    entry['inflections']=[]
    for f in o.get('inflections',[]):
        x={k:str(f.get(k,'') or '').strip() for k in FORM_FIELDS}
        if not x['form'] or not x['category']:fail('Incomplete form')
        if x['evidence'] not in ('dictionary','text','paradigm','stem','review'):fail('Invalid form evidence')
        if x['evidence']!='review' and not x['source'].startswith(('http://','https://')):fail('Non-provisional form lacks citation')
        entry['inflections'].append(x)
    entry['claims']=[]
    for c in o.get('claims',[]):
        x={k:str(c.get(k,'') or '').strip() for k in CLAIM_FIELDS}
        if x['field'] not in ('headword','meaning','pos','animacy','number','plural','possessed','stem','usage','other'):fail('Bad claim field')
        if x['assessment'] not in ('dictionary','text','grammar','inference','unverified'):fail('Bad evidence type')
        if not x['note']:fail('Claim missing explanation')
        if x['assessment']!='unverified' and not (x['locator'] and x['source'].startswith(('http://','https://'))):fail('Claim missing URL or page/folio')
        entry['claims'].append(x)
    entry['formsEdited']=bool(o.get('formsEdited',False))
    return entry
def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--candidate',required=True,type=Path)
    opts=parser.add_mutually_exclusive_group(required=True)
    opts.add_argument('--dry-run',action='store_true')
    opts.add_argument('--apply',action='store_true')
    args=parser.parse_args()
    candidate=normalize(json.loads(args.candidate.read_text(encoding='utf8')))
    dp=ROOT/'dictionary.json'; d=json.loads(dp.read_text(encoding='utf8'))
    matched=[w for w in d['words'] if key(w)==key(candidate)]
    print(('ALREADY EXISTS' if matched else 'NEW ENTRY'),candidate['word'],'—',candidate['meaning'])
    print('Citations:',len(candidate['claims']),'Forms:',len(candidate['inflections']))
    if args.dry_run: print('Preview only; no files changed');return
    if matched:fail('Existing headwords must be edited through explicit reviewed changes; refusing overwrite')
    pp=ROOT/'paradigms.json';p=json.loads(pp.read_text(encoding='utf8'))
    today=date.today().isoformat()
    match=re.fullmatch(re.escape(today)+r'\.(\d+)',d.get('version',''))
    version=today+'.'+str(int(match.group(1))+1 if match else 1)
    d['words'].append(candidate);d['version']=version;p['version']=version
    hp=ROOT/'index.html';html=hp.read_text(encoding='utf8')
    marker=re.search(r'(window\.TLAHTOLLI_OFFLINE_SEED=)(.*?)(;\s*</script>)',html,re.S)
    if not marker:fail('Offline dictionary seed missing; no changes made')
    seed=json.loads(marker.group(2));seed['words']=d['words'];seed['version']=version
    html=html[:marker.start(2)]+json.dumps(seed,ensure_ascii=False,separators=(',',':'))+html[marker.end(2):]
    # Write publication files together in the local working tree. Review the Git diff before a commit.
    dp.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    pp.write_text(json.dumps(p,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    hp.write_text(html,encoding='utf8')
    print('Prepared',version,'— now run python tools/validate.py and review the diff before publication.')
if __name__=='__main__':
    try:main()
    except (ValueError,KeyError,TypeError,json.JSONDecodeError) as exc:
        print('Rejected:',exc,file=sys.stderr);sys.exit(1)
