#!/usr/bin/env python3
"""Prepare a source-documented entry in the normalized Phase 2 sources."""
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
    # Phase 2: modify authoritative editorial sources, never the published outputs.
    from build_dictionary import assemble, read_json, run as build_outputs, MORPH_KEYS
    lexp=ROOT/'data'/'lexicon.json'
    morph_p=ROOT/'data'/'morphology.json'
    evid_p=ROOT/'data'/'evidence.json'
    lex=read_json(lexp);morph=read_json(morph_p);evid=read_json(evid_p)
    pp=ROOT/'paradigms.json';p=read_json(pp)
    rp=ROOT/'references.json';r=read_json(rp)
    release_p=ROOT/'release.json';release=read_json(release_p)
    current=assemble(lex,morph,evid,p,r,release)
    published=read_json(ROOT/'dictionary.json')
    if current!=published:
        fail('Published dictionary diverges from canonical data sources; repair before adding')
    matched=[w for w in current['words'] if key(w)==key(candidate)]
    print(('ALREADY EXISTS' if matched else 'NEW ENTRY'),candidate['word'],'—',candidate['meaning'])
    print('Citations:',len(candidate['claims']),'Forms:',len(candidate['inflections']))
    if args.dry_run: print('Preview only; no files changed');return
    if matched:fail('Existing headwords must be edited through explicit reviewed changes; refusing overwrite')
    today=date.today().isoformat()
    match=re.fullmatch(re.escape(today)+r'\.(\d+)',current.get('version',''))
    version=today+'.'+str(int(match.group(1))+1 if match else 1)
    lex['words'].append({k:v for k,v in candidate.items()
                         if k not in MORPH_KEYS and k!='claims'})
    morphology={k:candidate[k] for k in MORPH_KEYS}
    morph['entries'].append({'word':candidate['word'],'variety':candidate['variety'],**morphology})
    evid['entries'].append({'word':candidate['word'],'variety':candidate['variety'],
                            'claims':candidate['claims']})
    for document in (lex,morph,evid,p,r,release):document['version']=version
    release['headwords']=len(lex['words'])
    release['paradigms']=len(p['paradigms'])
    # Validate the entire assembled new edition in memory before touching disk.
    assemble(lex,morph,evid,p,r,release)
    for path,document in ((lexp,lex),(morph_p,morph),(evid_p,evid),
                          (pp,p),(rp,r),(release_p,release)):
        path.write_text(json.dumps(document,ensure_ascii=False,indent=2)+'\n',
                        encoding='utf-8')
    build_outputs(write=True)
    print('Prepared',version,'from three canonical source files.')
    print('Run python tools/validate.py and review the complete Git diff before publishing.')
if __name__=='__main__':
    try:main()
    except (ValueError,KeyError,TypeError,json.JSONDecodeError) as exc:
        print('Rejected:',exc,file=sys.stderr);sys.exit(1)
