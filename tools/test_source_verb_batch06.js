'use strict';
// Batch 06: sourced lexical/finite admissions; grammar-generated cells remain hypotheses.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const D=JSON.parse(read('dictionary.json')),M=JSON.parse(read('research/batches/source_reviewed_verb_batch06_2026_10_29.json'));
const P=JSON.parse(read('paradigms.json')),R=JSON.parse(read('release.json'));
assert.equal(D.version,R.version);
// This dated source-reviewed cohort must remain valid after later lexical-only editions.
assert.equal(D.words.length,R.headwords);assert(D.words.length>=478);assert.equal(M.entries.length,43);
assert.equal(D.words.filter(w=>w.status==='Checked against source').length,187);
assert.equal(D.words.filter(w=>w.status==='Archive-indexed; lexical review pending'&&w.pos.startsWith('verb')).length,225);
assert.equal(Object.keys(P.paradigms).length,12);
assert.equal(D.words.reduce((n,w)=>n+w.inflections.length,0),305);
const src=read('tools/morphology_engine.js').split('renderMorphologyBreakdown=TlahtolliMorphEngine.html;')[0];
function loader(words=D.words){
 const ctx={window:{},words,FULL_VERB_PARADIGMS:P.paradigms,VERB_TENSES:P.patterns,
  norm:s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(),
  stripToken:s=>String(s).replace(/^[^\p{L}\p{M}]+|[^\p{L}\p{M}]+$/gu,'').toLowerCase(),
  historicalSpellings:w=>String(w.original||'').split(/[;,/]+/).map(x=>x.trim()).filter(Boolean),
  safe:String,validUrl:x=>x,safeLink:()=>''};
 vm.runInNewContext(src+'\nthis.morph=TlahtolliMorphEngine;',ctx);
 return ctx;
}
const ctx=loader(),analyze=x=>ctx.morph.analyze(x);
const cls='Source-stem-class';
const gradable=new Set(['Source-stem-class third-person preterite hypothesis',
 'Source-stem-class future hypothesis','Source-stem-class plural preterite hypothesis',
 'Source-stem-class plural future hypothesis','Source-stem-class plural present hypothesis']);
const noClass=new Set(['temo','panō','cuīca','popoca','choloa','tzinti','mayana',
 'āmiqui','āpīzmiqui','tōna','tzacui','mani']);
let recorded=0,sourcePairs=0,synthetic=0,strictPos=0;
for(const spec of M.entries){
 const w=D.words.find(z=>z.word===spec.word);
 assert(w&&w.pos===spec.pos&&w.status==='Checked against source',spec.word);
 assert.equal(w.source,spec.source);
 for(const field of ['headword','meaning','pos']){
  const claims=w.claims.filter(c=>c.field===field&&c.assessment==='dictionary'&&
   c.source===spec.source&&c.locator===spec.locator);
  assert.equal(claims.length,1,spec.word+': '+field);
 }
 const fin=w.inflections.filter(x=>/^Preterite 1sg/.test(x.category));
 if(spec.preterite){
  assert(fin.some(x=>x.form===spec.preterite&&x.source===spec.source&&x.evidence==='dictionary'),spec.word);
  assert(analyze(spec.preterite).some(x=>x.lemma===spec.word&&x.grade==='lexical'),'Indexed source form: '+spec.word);
  recorded++;
 }else assert(!fin.length,'No imaginary 1sg: '+spec.word);
 if(!spec.short_base){
  assert(!w.claims.some(c=>c.field==='stem'&&c.assessment==='dictionary'),spec.word);
  if(noClass.has(spec.word))strictPos++;
  continue;
 }
 sourcePairs++;
 assert.equal(w.stem,spec.word+'-; '+spec.short_base+'-');
 const claim=w.claims.find(c=>c.field==='stem');
 assert(claim&&claim.assessment==='dictionary'&&claim.source===spec.source&&claim.locator===spec.stem_locator);
 assert.equal(w.pos,'verb (intransitive)');
 const augment=spec.preterite.startsWith('ō')?'ō':'o';
 assert.equal(spec.preterite,augment+'ni'+spec.short_base,'Short base must RECONSTRUCT recorded finite');
 const cases=[
  [augment+'ti'+spec.short_base,'Source-template singular preterite hypothesis'],
  [augment+spec.short_base,'Source-stem-class third-person preterite hypothesis'],
  ...['ni','ti',''].map(p=>[p+spec.word+'z','Source-stem-class future hypothesis']),
  ...['ti','an',''].map(p=>[augment+p+spec.short_base+'queh','Source-stem-class plural preterite hypothesis']),
  ...['ti','an',''].map(p=>[p+spec.word+'zqueh','Source-stem-class plural future hypothesis']),
  ...['ti','an',''].map(p=>[p+spec.word+'h','Source-stem-class plural present hypothesis'])
 ];
 assert.equal(cases.length,14);
 for(const [form,kind] of cases){
  assert(!w.inflections.some(x=>x.form===form),'A derived test surface must NOT be listed as attested');
  const hits=analyze(form).filter(x=>x.lemma===spec.word&&x.kind===kind);
  assert(hits.length>0,'Expected licensed hypothesis '+form+' / '+kind);
  assert(hits.every(x=>x.grade==='hypothesis'&&x.source.startsWith('https://')&&x.parts
   .filter(p=>p.surface!=='Ø').map(p=>p.surface).join('')===form),form);
  synthetic++;
 }
}
assert.equal(recorded,33);assert.equal(sourcePairs,6);assert.equal(synthetic,84);
assert(strictPos>=10);
for(const lemma of noClass){
 const w=D.words.find(z=>z.word===lemma);
 assert(!w.claims.some(c=>c.field==='stem'&&c.assessment==='dictionary'),
  'Unresolved verb must not have class evidence: '+lemma);
}
const copy=()=>JSON.parse(JSON.stringify(D.words));
for(const field of ['headword','pos','stem']){
 const ws=copy(),w=ws.find(x=>x.word==='miqui');
 w.claims=w.claims.filter(c=>c.field!==field);
 assert(!loader(ws).morph.analyze('otimic').some(x=>x.lemma==='miqui'&&x.kind.startsWith(cls)),
  'Removal of '+field+' must disable the sourced class');
}
{
 const ws=copy(),w=ws.find(x=>x.word==='miqui');
 w.inflections=[];assert(!loader(ws).morph.analyze('otimic')
  .some(x=>x.lemma==='miqui'&&x.kind.startsWith(cls)),
  'Removal of source-recorded preterite must disable productivity');
}
{
 const ws=copy(),w=ws.find(x=>x.word==='miqui');
 w.stem='miqui-; mīc-';
 assert(!loader(ws).morph.analyze('otimic')
  .some(x=>x.lemma==='miqui'&&x.kind.startsWith(cls)),
  'Unlicensed macron/base change must be refused');
}
for(const form of ['ōtimic','ōtimīc','ōtipoyomic','ōtitēn','nitēmoz','ōtinonamic','nicotōnh']){
 assert(!analyze(form).some(x=>x.lemma==='miqui'&&gradable.has(x.kind)),
  'Do not force unrelated/diacritic-near words into miqui');
}
vm.runInNewContext(read('translator-sentence.js'),ctx);
const sentence=ctx.window.TlahtolliSentence.create(D,P,x=>analyze(x));
for(const s of ['ōtimic','miquiz','nitēmoz','ōticotōn','ōtipoyōmic','titzāhuah']){
 const result=sentence.analyze(s);
 assert.equal(result.complete,false,'Morphology alone cannot assert a complete translation for '+s);
 assert.equal(result.clauses[0].candidates.length,0);
}
console.log('PASS batch06: 43 independently source-located lexical reviews, 33 exact past forms, 6 productive class pairs, 84 unseen hypothesis probes; no fabricated paradigms or English');
