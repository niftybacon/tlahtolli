'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),
 path=require('node:path'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),dir=fs.mkdtempSync(path.join(os.tmpdir(),'tentli-teacher-'));
try{
 const out=path.join(dir,'teacher.jsonl');
 const result=spawnSync(process.execPath,[path.join(root,'tools/export_tentli_neural_teacher.js'),out],
   {cwd:root,encoding:'utf8',timeout:120000});
 assert.equal(result.status,0,result.stderr+'\n'+result.stdout);
 const meta=JSON.parse(fs.readFileSync(out+'.meta.json','utf8'));
 const rows=fs.readFileSync(out,'utf8').trim().split('\n').map(JSON.parse);
 assert.equal(meta.format,'tentli-teacher-v1');
 assert.equal(meta.counts.cells,720);
 assert(meta.uniqueParadigmSurfaces>100);
 assert(meta.counts.lemmas>=150);
 assert(meta.counts.forms>=100);
 assert(meta.counts.hypotheses>0,'Canonical productive grammar must teach student');
 assert(meta.counts.english>0,'Need at least one unique IR-audited English teacher');
 assert.equal(rows.length,meta.examples);
 assert(rows.some(x=>x.grade==='grammar-paradigm'&&x.input==='nitlahtoa'));
 assert(rows.some(x=>x.grade==='source-checked-lexeme'));
 assert(rows.some(x=>x.grade==='source-listed-form'));
 assert(rows.some(x=>x.grade==='grammar-composed-English'));
 assert(rows.every(x=>x.split==='train'&&x.provenance.includes('synthetic teacher signal')));
 assert(!rows.some(x=>x.grade==='manuscript'||x.grade==='approved'||x.input==='xyzzy'));
 assert(rows.filter(x=>x.grade==='grammar-composed-English').every(x=>x.weight===0.2));
 console.log('PASS canonical neural teacher export '+JSON.stringify(meta));
}finally{
 fs.rmSync(dir,{recursive:true,force:true});
}
