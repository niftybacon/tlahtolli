#!/usr/bin/env python3
"""Structural validation only; NOT independent linguistic peer review."""
import json,re,sys
from pathlib import Path
from urllib.parse import urlsplit
from html.parser import HTMLParser
from collections import Counter
from build_dictionary import assemble, audit_csv, read_json
root=Path(__file__).resolve().parents[1]
d=json.loads((root/'dictionary.json').read_text(encoding='utf-8'))
p=json.loads((root/'paradigms.json').read_text(encoding='utf-8'))
s=json.loads((root/'references.json').read_text(encoding='utf-8'))
release=json.loads((root/'release.json').read_text(encoding='utf-8'))
errors=[]
try:
    canonical=assemble(read_json(root/'data/lexicon.json'),read_json(root/'data/morphology.json'),read_json(root/'data/evidence.json'),p,s,release)
    if canonical!=d:errors.append('dictionary.json is stale relative to authoritative data sources')
    if audit_csv(canonical)!=(root/'claim_audit.csv').read_text(encoding='utf-8'):errors.append('claim_audit.csv is stale relative to canonical evidence')
except (ValueError,KeyError,TypeError) as exc:
    errors.append('Canonical source validation failed: '+str(exc))
def check(ok,msg):
    if not ok:errors.append(msg)
def valid_url(s):
    try:
        u=urlsplit(str(s))
        return u.scheme in ('https','http') and bool(u.netloc)
    except (ValueError,TypeError):return False
check(d.get('schema')==1 and d.get('format')=='tlahtolli-published-dictionary','Invalid dictionary schema')
check(p.get('schema')==1 and p.get('format')=='tlahtolli-verb-paradigms','Invalid verb schema')
check(d.get('version')==p.get('version'),'Dictionary and paradigms are different versions')
check(s.get('version')==d.get('version'),'References and dictionary are different versions')
check(release.get('format')=='tlahtolli-release-manifest' and release.get('schema')==1,'Invalid release manifest')
check(release.get('version')==d.get('version'),'Release manifest is stale: bump release.json with published JSON')
check(release.get('headwords')==len(d.get('words',[])),'Release headword count mismatch')
check(release.get('paradigms')==len(p.get('paradigms',{})),'Release paradigms count mismatch')
words=d.get('words',[])
check(isinstance(words,list) and len(words)>=88,'Missing founding headwords')
seen=set(); forms=0
for w in words:
    key=(w.get('word'),w.get('variety'))
    check(key not in seen,'Duplicate lemma: '+str(key));seen.add(key)
    for f in ('word','meaning','pos','variety'):check(bool(w.get(f)),str(key)+' missing '+f)
    if w.get('status')=='Checked against source':check(valid_url(w.get('source')),str(key)+' lacks lexical source')
    if w.get('pluralStatus')=='attested':check(bool(w.get('plural')),str(key)+' plural has no exact form')
    if 'noun' not in w.get('pos','').lower():check(w.get('animacy') not in ('animate','inanimate'),str(key)+' non-noun animacy')
    local=set()
    for f in w.get('inflections',[]):
        forms+=1
        fk=(f.get('form'),f.get('category'),f.get('source'))
        check(fk not in local,str(key)+' duplicate form '+str(fk));local.add(fk)
        check(bool(f.get('form') and f.get('category')),str(key)+' incomplete inflection')
        check(f.get('evidence') in ('dictionary','text','paradigm','stem','review'),str(key)+' bad form evidence')
        if f.get('evidence')!='review':check(valid_url(f.get('source')),str(key)+' unsourced nonprovisional form')
    for c in w.get('claims',[]):
        check(c.get('assessment') in ('dictionary','text','grammar','inference','unverified'),str(key)+' invalid claim')
        check(bool(c.get('note')),str(key)+' claim missing explanation')
        if c.get('assessment')!='unverified':
            check(valid_url(c.get('source')),str(key)+' claim missing source')
            check(bool(c.get('locator')),str(key)+' claim missing page/section locator')
models=p.get('paradigms',{})
for k,m in models.items():
    check(any(w.get('word')==k and 'verb' in w.get('pos','') for w in words),k+' verb missing headword')
    check(valid_url(m.get('lemmaSource')),k+' missing lexical reference')
    cells=m.get('cells',[])
    check(len(cells)==10 and all(len(row)==6 and all(isinstance(x,str) and x for x in row) for row in cells),k+' must have 10 by 6 cells')
class Parser(HTMLParser):
    def __init__(self):super().__init__();self.ids=[];self.scripts=[];self.inside=False
    def handle_starttag(self,tag,attrs):
        for key,val in attrs:
            if key=='id':self.ids.append(val)
        if tag=='script':self.scripts.append('');self.inside=True
    def handle_endtag(self,tag):
        if tag=='script':self.inside=False
    def handle_data(self,text):
        if self.inside:self.scripts[-1]+=text
h=Parser();h.feed((root/'index.html').read_text(encoding='utf-8'))
check(not [x for x,n in Counter(h.ids).items() if n>1],'Duplicate HTML IDs')
check(all(x in h.ids for x in ('tabStudy','studyView','studyCard','auditView','formProbeInput','concordanceInput','facetPOS','facetAnimacy','facetEvidence','concordanceMode','concordanceSource','drillCard','drillVerb','auditCoverageMatrix','quickLookup','quickLookupForm','workspaceTools','analyzerDetails','exportDetails')),'Study/research UI missing')
check('v2.3.1' in (root/'index.html').read_text(encoding='utf-8'),'App version header mismatch')
try:
    seed=json.loads(h.scripts[0].split('window.TLAHTOLLI_OFFLINE_SEED=',1)[1].strip().rstrip(';'))
    check(seed.get('words')==words,'Offline words differ from published words')
    check(seed.get('paradigms')==p.get('paradigms'),'Offline paradigms differ from published paradigms')
    check(seed.get('version')==release.get('version'),'Offline seed and release manifest versions differ')
except (ValueError,IndexError,TypeError) as e:errors.append('Offline seed error: '+str(e))
# Startup request policy and rendering guard invariants.
source_html=(root/'index.html').read_text(encoding='utf-8')
check("fetch('release.json',{cache:'no-cache'})" in source_html,'Missing conditional release check')
check("manifest.version===embedded.version" in source_html,'Bundled data are not reused for matching releases')
check("if(searchOnly&&previousSelected===selected)return;" in source_html,'Missing search-only detail preservation')
check("$('search').oninput=scheduleSearchRender" in source_html,'Missing batched dictionary search')
check("oldBase=publishedBaseline[key]" in source_html and "else if(oldBase&&entriesIdentical" in source_html,'User-edit-safe published-data merge is missing')
if errors:
    print('FAILED:\n'+'\n'.join(' - '+x for x in errors));sys.exit(1)
print('PASS:',len(words),'lemmas,',forms,'forms,',len(models),'verb paradigms; matched offline seed.')
print('Structural validation does NOT establish linguistic accuracy.')
