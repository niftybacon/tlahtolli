"""Validate exact source-row inventory without promoting imported records to curated claims."""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT/'research/amoxcalli_archive'
manifest=json.loads((BASE/'manifest.json').read_text(encoding='utf8'))
assert manifest['format']=='tlahtolli-amoxcalli-archive-manifest-v1'
assert manifest['master_database_imported'] is False
assert manifest['source_rows']=={'simeon':28709,'kaikki':7834,'total':36543}
assert len(manifest['simeon']['files'])==15 and len(manifest['kaikki']['files'])==4
counts={'simeon':0,'kaikki':0}
varieties={'nci':0,'nhn':0,'nch':0,'nhe':0}
atl=[]
for source in ('simeon','kaikki'):
    for part,path in enumerate(manifest[source]['files']):
        d=json.loads((BASE/path).read_text(encoding='utf8'))
        assert d['format']=='tlahtolli-amoxcalli-'+source+'-v1'
        assert d['start']==part*2000
        assert len(d['rows'])>0
        for row in d['rows']:
            assert isinstance(row,list) and isinstance(row[0],str) and row[0].strip()
            if source=='simeon':
                assert len(row)>=4 and isinstance(row[1],str)
                if row[0]=='ATL': atl.append(row[1])
            else:
                assert len(row)>=7 and isinstance(row[3],list) and isinstance(row[4],list)
                assert row[2] in varieties
                varieties[row[2]]+=1
        counts[source]+=len(d['rows'])
assert counts=={'simeon':28709,'kaikki':7834}
assert sum(counts.values())==manifest['source_rows']['total']
assert len(atl)>1, 'Homographs must remain separate records.'
assert all(varieties.values()), 'Dialect-labelled source rows must be preserved.'
print('PASS Amoxcalli source archive:',counts,'varieties:',varieties,'ATL homographs:',len(atl))
