"""Generate compatibility views from canonical passage records; never certify readings."""
import argparse,copy,json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def outputs(data):
    readers=[];trans=[];close=[]
    for r in data['records']:
        assert r['train_eligible'] is False
        if r['reader']:
            v=copy.deepcopy(r['reader'])
            v.update(original=r['original'],normalized=r['normalized'])
            if r['reading_status']!='teaching_example':
                v['status']='Draft'
                v['notes']+=' Edited transcription candidate; no independently certified manuscript line. Interpretations and token analyses remain provisional.'
            readers.append(v)
        if r['translator']:
            v=copy.deepcopy(r['translator']);v.update(original=r['original'],normalized=r['normalized'],train_eligible=False)
            trans.append(v)
        for item in r['close_readings']:
            v=copy.deepcopy(item);v.update(source_reading=r['original'],normalized=r['normalized'],train_eligible=False,canonical_passage_id=r['id'])
            surfaces=re.findall(r"[^\W\d_]+",r['original'],re.UNICODE)
            assert len(surfaces)==len(v['tokens']), 'Token alignment requires editorial review'
            for token,surface in zip(v['tokens'],surfaces):
                if token['surface']!=surface:token['prior_editorial_surface']=token['surface']
                token['surface']=surface
            close.append(v)
    # Preserve established API ordering, independently of reader presentation order.
    trans.sort(key=lambda x:['FC11-209v-mirror','FC11-62r-fish-water','FC11-62r-chimalli'].index(x['id']))
    return readers,{**data['translator_metadata'],'entries':trans},{**data['close_metadata'],'passages':close}
def run(write=False):
    data=json.loads((ROOT/'data/passages.json').read_text(encoding='utf8'))
    readers,trans,close=outputs(data)
    html=(ROOT/'index.html').read_text(encoding='utf8')
    updated,n=re.subn(r'^const passageExamples=.*;$','const passageExamples='+json.dumps(readers,ensure_ascii=False,separators=(',',':'))+';',html,flags=re.M)
    assert n==1
    targets={'index.html':updated,'research/translation_corpus/research_examples.json':json.dumps(trans,ensure_ascii=False,indent=2)+'\n','research/florentine_codex/close_reading.json':json.dumps(close,ensure_ascii=False,indent=2)+'\n'}
    for name,text in targets.items():
        path=ROOT/name
        if write:path.write_text(text,encoding='utf8')
        else:assert path.read_text(encoding='utf8')==text,'Stale passage view: '+name
    print('PASS: canonical passage views agree; no training certification')
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--write',action='store_true');p.add_argument('--check',action='store_true');run(p.parse_args().write)
