'use strict';
// Batch 08: source-graded lexical admissions, Class 1 vs Class 2 and abstention.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const D=JSON.parse(read('dictionary.json')),M=JSON.parse(read('research/batches/source_stem_batch08_2026_10_29.json'));
const R=JSON.parse(read('release.json')),P=JSON.parse(read('paradigms.json'));
assert.equal(D.version,R.version);assert.equal(M.target_version,'2026-10-29.8.0');
assert(['2026-10-29.8.0','2026-10-29.9.0','2026-10-30.1.0'].includes(D.version));
assert.equal(D.words.length,2144);assert.equal(R.headwords,2144);assert.equal(M.entries.length,38);
assert.equal(M.entries.filter(x=>!!x.class).length,13);assert.equal(M.older.length,4);
assert.equal(D.words.filter(w=>w.status==='Checked against source').length,227);
assert.equal(D.words.filter(w=>w.status==='Archive-indexed; lexical review pending'&&w.pos.startsWith('verb')).length,187);
assert.equal(Object.keys(P.paradigms).length,12);
assert.equal(D.words.reduce((n,w)=>n+w.inflections.length,0),341);
const index=new Map(D.words.map(w=>[w.word,w]));
const source=read('tools/morphology_engine.js').split('renderMorphologyBreakdown=TlahtolliMorphEngine.html;')[0];
function engine(words=D.words){
 const ctx={window:{},words,FULL_VERB_PARADIGMS:P.paradigms,VERB_TENSES:P.patterns,
  norm:s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(),
  stripToken:s=>String(s).replace(/^[^\p{L}\p{M}]+|[^\p{L}\p{M}]+$/gu,'').toLowerCase(),
  historicalSpellings:w=>String(w.original||'').split(/[;,/]+/).map(x=>x.trim()).filter(Boolean),
  safe:String,validUrl:x=>x,safeLink:()=>''};
 vm.runInNewContext(source+'\nthis.Morph=TlahtolliMorphEngine;',ctx);
 return ctx.Morph;
}
const analyze=s=>engine().analyze(s);
const grade=['lexical','manuscript','grammar','paradigm'];
let licensed=0,graded=0,withheld=0,exact=0;
for(const spec of M.entries){
 const w=index.get(spec.word);assert(w,w?.word||spec.word);
 assert.equal(w.status,'Checked against source');
 assert.equal(w.pos,spec.pos);
 assert.equal(w.source,spec.source);
 for(const f of ['headword','meaning','pos'])
  assert(w.claims.some(c=>c.field===f&&c.assessment==='dictionary'&&
    c.source===spec.source&&c.locator===spec.locator),spec.word+': '+f);
 if(spec.preterite){
  assert(w.inflections.some(f=>f.form===spec.preterite&&f.evidence==='dictionary'&&f.source===spec.source),spec.word);
  assert(analyze(spec.preterite).some(a=>a.lemma===spec.word&&grade.includes(a.grade)),spec.word+': exact source form');
  exact++;
 }
 const stem=w.claims.find(c=>c.field==='stem');
 if(!spec.class){
  // The historical Batch 08 manifest stays immutable; Batch 09 independently
  // licenses exactly two formerly refused intransitive Class 2 verbs.
  if(['2026-10-29.9.0','2026-10-30.1.0'].includes(D.version)&&['iztlacati','ichtequi'].includes(spec.word)){
   assert.equal(stem.assessment,'dictionary');
   assert.equal(stem.source,spec.source);
   assert.equal(w.stem,spec.word+'-; '+(spec.word==='iztlacati'?'iztlacat':'ichtec')+'-');
  }else assert(!w.stem&&stem.assessment==='unverified',spec.word+' cannot be fully classified');
  withheld++;
  continue;
 }
 licensed++;
 assert(stem.source===spec.source&&stem.locator===spec.locator);
 if(spec.class==='1'){
  assert.equal(w.stem,spec.word+'-');
  assert.equal(stem.assessment,'grammar');
  const past3=spec.preterite.slice(0,1)+spec.preterite.slice(3);
  if(spec.pos==='verb (intransitive)')
   assert(analyze(past3).some(a=>a.lemma===spec.word&&a.kind==='Source-class1 third-person preterite hypothesis'&&a.grade==='hypothesis'),past3);
  const future='ni'+(spec.pos==='verb (transitive)'?'tla':'')+spec.word+'z';
  assert(analyze(future).some(a=>a.lemma===spec.word&&a.kind==='Source-class1 future hypothesis'&&a.grade==='hypothesis'),future);
  const plural=spec.preterite.slice(0,1)+'ti'+(spec.pos==='verb (transitive)'?'tla':'')+spec.word+'queh';
  assert(analyze(plural).some(a=>a.lemma===spec.word&&a.kind==='Source-class1 plural preterite hypothesis'&&a.grade==='hypothesis'),plural);
  assert(!analyze(spec.preterite.slice(0,1)+'ti'+spec.word+'cqueh').some(a=>a.lemma===spec.word&&a.kind.startsWith('Source-class1')),spec.word+': no false -cqueh');
 }else{
  assert.equal(spec.class,'2');
  assert.equal(w.stem,spec.word+'-; '+spec.short_base+'-');
  assert.equal(stem.assessment,'dictionary');
  const plural=spec.preterite.slice(0,1)+'ti'+(spec.pos==='verb (transitive)'?'tla':'')+spec.short_base+'queh';
  if(spec.pos==='verb (intransitive)'||spec.category.includes('unspecified object'))
   assert(analyze(plural).some(a=>a.lemma===spec.word&&a.kind==='Source-stem-class plural preterite hypothesis'&&a.grade==='hypothesis'),plural);
 }
 graded++;
}
for(const spec of M.older){
 const w=index.get(spec.word);assert(w);
 assert.equal(w.stem,spec.word+'-');
 assert(w.claims.some(c=>c.field==='stem'&&c.assessment==='grammar'&&c.source===spec.source));
 assert(w.inflections.some(f=>f.form===spec.preterite&&f.evidence==='dictionary'));
 const future='ni'+spec.word+'z';
 assert(analyze(future).some(a=>a.lemma===spec.word&&a.kind==='Source-class1 future hypothesis'&&a.grade==='hypothesis'),future);
}
for(const item of M.refusals){
 const w=index.get(item.word);assert(w);
 if(['2026-10-29.9.0','2026-10-30.1.0'].includes(D.version)&&['iztlacati','ichtequi'].includes(item.word)){
  assert(w.claims.some(c=>c.field==='stem'&&c.assessment==='dictionary'));
 }else assert(!w.claims.some(c=>c.field==='stem'&&['dictionary','grammar'].includes(c.assessment)),item.word);
}
// Never promote merely from a single source-listed preterite or changed stem without its claim.
{
 const ws=JSON.parse(JSON.stringify(D.words)),w=ws.find(x=>x.word==='huetzca');
 w.claims=w.claims.filter(c=>c.field!=='stem');
 assert(!engine(ws).analyze('nihuetzcaz').some(a=>a.lemma==='huetzca'&&a.kind.startsWith('Source-class1')));
}
{
 const ws=JSON.parse(JSON.stringify(D.words)),w=ws.find(x=>x.word==='huetzca');
 w.inflections=[];
 assert(!engine(ws).analyze('nihuetzcaz').some(a=>a.lemma==='huetzca'&&a.kind.startsWith('Source-class1')));
}
{
 const ws=JSON.parse(JSON.stringify(D.words)),w=ws.find(x=>x.word==='huetzca');
 w.stem='huetzca-; huetzc-';
 assert(!engine(ws).analyze('nihuetzcaz').some(a=>a.lemma==='huetzca'&&a.kind.startsWith('Source-class1')));
}
assert.equal(licensed,13);assert.equal(withheld,25);assert.equal(exact,34);
console.log('PASS Batch 08: '+M.entries.length+' historical lexical dispositions, 17 source-licensed classes, 34+2 exact forms; 6 refusals');
