import copy,json
from pathlib import Path
from build_passages import run,outputs
R=Path(__file__).resolve().parents[1]
def read(p):return json.loads((R/p).read_text(encoding='utf8'))
run()
reviews=read('research/orthography_review.json')['entries']
assert len(reviews)==25 and len({r['word'] for r in reviews})==25
assert next(r for r in reviews if r['word']=='in')['normalized_citation'] is None
assert all(r['source'] and r['locator'] and r['decision'] for r in reviews)
p=read('paradigms.json');ids={r['id'] for r in p['rule_sources']}
assert len(ids)==10 and all(not r['cells_certified'] for r in p['rule_sources'])
assert all(set(m['rule_refs'])==ids for m in p['paradigms'].values())
d=read('data/passages.json');r,t,c=outputs(d)
assert len(r)==6 and len(t['entries'])==3 and len(c['passages'])==6
assert all(x['status']=='Draft' for x in r)
water=next(x for x in d['records'] if x.get('translator') and x['translator']['id']=='FC11-62r-fish-water')
assert water['close_readings'] and water['prior_readings']
# A single canonical edit propagates to all three views without editing analyses.
changed=copy.deepcopy(d);w=next(x for x in changed['records'] if x['id']==water['id']);w['normalized']='test reading'
rr,tt,cc=outputs(changed)
assert any(x['normalized']=='test reading' for x in rr)
assert any(x['normalized']=='test reading' for x in tt['entries'])
assert any(x['normalized']=='test reading' for x in cc['passages'])
print('PASS: 25 orthographic decisions, scoped rule citations, canonical passage propagation and uncertainty')
