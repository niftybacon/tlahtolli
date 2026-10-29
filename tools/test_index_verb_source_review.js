'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const D=JSON.parse(read('dictionary.json')),P=JSON.parse(read('paradigms.json'));
const L=JSON.parse(read('data/lexicon.json')),M=JSON.parse(read('data/morphology.json')),E=JSON.parse(read('data/evidence.json'));
assert.equal(D.version,JSON.parse(read('release.json')).version);assert.equal(D.version,JSON.parse(read('release.json')).version);
assert.equal(D.words.length,210);assert.equal(D.words.filter(w=>w.status==='Checked against source').length,144);
assert.equal(D.words.filter(w=>w.status.startsWith('Index-sourced')).length,66);
assert.equal(D.words.reduce((n,w)=>n+w.inflections.length,0),270);
assert.equal(D.words.reduce((n,w)=>n+w.claims.length,0),1275);
assert.equal(Object.keys(P.paradigms).length,12);
assert.deepEqual(L.words.map(w=>w.word),M.entries.map(w=>w.word));
assert.deepEqual(L.words.map(w=>w.word),E.entries.map(w=>w.word));
const src=read('tools/morphology_engine.js').split('renderMorphologyBreakdown=TlahtolliMorphEngine.html;')[0];
function load(words=D.words){
 const c={window:{},words,FULL_VERB_PARADIGMS:P.paradigms,VERB_TENSES:P.patterns,
 norm:s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(),
 stripToken:s=>String(s||'').replace(/^[^\p{L}\p{M}]+|[^\p{L}\p{M}]+$/gu,''),
 historicalSpellings:w=>String(w.original||'').split(/[;,/]+/).map(s=>s.trim()).filter(Boolean),
 safe:String,validUrl:()=>true,safeLink:()=>''};
 vm.runInNewContext(src+'\nthis.morph=TlahtolliMorphEngine;',c);return c;
}
const c=load(),analyze=x=>c.morph.analyze(x);
const rows=[
 ['tepoztia','verb (intransitive)','tepuztia','onitepuztiac','otitepuztiac','nitepoztia'],
 ['tepoztehuia','verb (transitive)','tepuzteuia','onitlatepuzteui','otitlatepuzteui','nitlatepoztehuia']
];
for(const [lemma,pos,original,past,generated,present] of rows){
 const w=D.words.find(w=>w.word===lemma);assert(w,lemma);
 assert.equal(w.pos,pos);assert.equal(w.original,original);assert.equal(w.stem,'');
 assert.equal(w.status,'Checked against source');assert(!P.paradigms[lemma]);
 assert(w.source.startsWith('https://nahuatl.wired-humanities.org/content/'));
 assert(w.inflections.length===1&&w.inflections[0].form===past);
 assert.equal(w.inflections[0].evidence,'dictionary');
 for(const f of ['headword','meaning','pos'])assert(w.claims.some(c=>c.field===f&&c.assessment==='dictionary'&&/104r/.test(c.locator)),lemma+' '+f);
 assert(w.claims.some(c=>c.field==='stem'&&c.assessment==='unverified'&&!c.locator));
 assert(analyze(past).some(x=>x.lemma===lemma&&x.grade==='lexical'&&x.kind.startsWith('Preterite 1sg')),past+' exact source');
 assert(!analyze(past).some(x=>x.lemma===lemma&&x.kind.includes('hypothesis')),'Source form must stay stronger');
 for(const token of [generated,present]){
  const analyses=analyze(token).filter(x=>x.lemma===lemma&&x.grade==='hypothesis');
  assert(analyses.length>0,token+' proposed');
  assert(analyses.every(a=>a.parts.filter(p=>p.surface!=='Ø').map(p=>p.surface).join('')===token));
  assert(!w.inflections.some(f=>f.form===token),'Generated form must not be indexed');
 }
 const clone=JSON.parse(JSON.stringify(D.words)),v=clone.find(w=>w.word===lemma);v.inflections=[];
 assert(!load(clone).morph.analyze(generated).some(x=>x.lemma===lemma&&x.grade==='hypothesis'),'No example, no past hypothesis');
}
const ambiguous=D.words.find(w=>w.word==='nonotza');
assert(ambiguous.claims.some(c=>c.field==='pos'&&c.assessment==='inference'));
assert.equal(ambiguous.stem,'');assert.equal(ambiguous.inflections.length,0);
assert(!analyze('onitenonotz').some(x=>x.lemma==='nonotza'&&x.grade==='hypothesis'));
for(const wrong of ['nitlatepuzteui','otitlatepozteui','ōtitepuztiac','nitepoztiaz']){
 assert(!analyze(wrong).some(x=>['tepoztia','tepoztehuia'].includes(x.lemma)&&x.grade==='hypothesis'),'Unlicensed allomorph/future '+wrong);
}
vm.runInNewContext(read('translator-sentence.js'),c);
const sentence=c.window.TlahtolliSentence.create(D,P,analyze);
for(const [, , , ,past,present] of rows)for(const tok of [past,present]){
 const a=sentence.analyze(tok);assert.equal(a.complete,false);assert.equal(a.clauses[0].candidates.length,0);
}
console.log('PASS two Molina lexical reviews: source forms, conservative class evidence, abstention and preserved inventory');
