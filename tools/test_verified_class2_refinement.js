'use strict';
/* Independently source-licensed Class 2 morphology; not new attestation or translation gold. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=x=>fs.readFileSync(path.join(root,x),'utf8');
const D=JSON.parse(read('dictionary.json')),P=JSON.parse(read('paradigms.json')),R=JSON.parse(read('release.json'));
assert.equal(D.version,R.version);assert.equal(D.version,'2026-10-29.4.2');assert.equal(D.words.length,210);
assert.equal(D.words.filter(w=>String(w.pos).includes('verb')).length,64,'Old substring count retained as false-positive control');
assert.equal(D.words.filter(w=>/^verb(?:\s*\(|$)/u.test(String(w.pos))).length,54,
 'Only grammatically labelled verb entries count; adverbs are not verbs');
assert.equal(D.words.reduce((n,w)=>n+w.inflections.length,0),272);
assert.equal(D.words.reduce((n,w)=>n+w.claims.length,0),1275);
assert.equal(Object.keys(P.paradigms).length,12);
const script=read('tools/morphology_engine.js').split('renderMorphologyBreakdown=TlahtolliMorphEngine.html;')[0];
function load(words=D.words){
 const ctx={window:{},words,FULL_VERB_PARADIGMS:P.paradigms,VERB_TENSES:P.patterns,
 norm:s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(),
 stripToken:s=>String(s||'').replace(/^[^\p{L}\p{M}]+|[^\p{L}\p{M}]+$/gu,''),
 historicalSpellings:w=>String(w.original||'').split(/[;,/]+/).map(v=>v.trim()).filter(Boolean),
 safe:String,validUrl:()=>true,safeLink:()=>''};
 vm.runInNewContext(script+'\nthis.morph=TlahtolliMorphEngine;',ctx);return ctx;
}
const cases=[
 {lemma:'quiza',short:'quiz',past:'oniquiz',source:'https://nahuatl.wired-humanities.org/content/quiza',
  generated:['otiquiz','oquiz','niquizaz','tiquizaz','quizaz','otiquizqueh','oanquizqueh','oquizqueh','tiquizazqueh','anquizazqueh','quizazqueh','tiquizah','anquizah','quizah']},
 {lemma:'polihui',short:'poliuh',past:'onipoliuh',source:'https://nahuatl.wired-humanities.org/content/polihui',
  generated:['otipoliuh','opoliuh','nipolihuiz','tipolihuiz','polihuiz','otipoliuhqueh','oanpoliuhqueh','opoliuhqueh','tipolihuizqueh','anpolihuizqueh','polihuizqueh','tipolihuih','anpolihuih','polihuih']}
];
assert.equal(cases.reduce((n,c)=>n+c.generated.length,0),28);
const ctx=load(),analyze=t=>ctx.morph.analyze(t);
for(const c of cases){
 const w=D.words.find(w=>w.word===c.lemma);
 assert(w&&w.pos==='verb (intransitive)'&&!P.paradigms[c.lemma]);
 assert.equal(w.stem,c.lemma+'-; '+c.short+'-');
 const claim=w.claims.find(x=>x.field==='stem');
 assert(claim&&claim.assessment==='dictionary'&&claim.locator.includes('Lockhart')&&claim.locator.includes('Molina'));
 assert.equal(w.inflections.filter(f=>f.form===c.past&&f.evidence==='dictionary').length,1);
 assert(analyze(c.past).some(x=>x.lemma===c.lemma&&x.grade==='lexical'),'Recorded 1sg is stronger than hypothesis');
 const kinds=new Set();
 for(const token of c.generated){
  assert(!w.inflections.some(f=>f.form===token),'New grammatical token must NOT be entered as a source form');
  const hits=analyze(token).filter(x=>x.lemma===c.lemma&&x.grade==='hypothesis');
  assert.equal(hits.length,1,'Expected one evidence-licensed form: '+token);
  const m=hits[0];kinds.add(m.kind);
  assert.equal(m.parts.filter(p=>p.surface!=='Ø').map(p=>p.surface).join(''),token);
  assert.equal(m.source,c.source);assert.match(m.note,/NOT independently attested/,'No claim of separate historical attestation');
 }
 assert.equal(kinds.size,6,'Six existing productive families must be reused, not duplicated');
 const mutate=()=>JSON.parse(JSON.stringify(D.words));
 for(const strip of ['stem','form','pos','headword']){
  const words=mutate(),item=words.find(x=>x.word===c.lemma);
  if(strip==='stem')item.claims=item.claims.filter(x=>x.field!=='stem');
  if(strip==='form')item.inflections=item.inflections.filter(x=>x.form!==c.past);
  if(strip==='pos')item.claims=item.claims.filter(x=>x.field!=='pos');
  if(strip==='headword')item.claims=item.claims.filter(x=>x.field!=='headword');
  for(const t of c.generated.filter(t=>!t.startsWith('oti')&&!t.startsWith('ōti')))
   assert(!load(words).morph.analyze(t).some(x=>x.lemma===c.lemma&&x.kind.startsWith('Source-stem-class')),
    strip+' missing must retract source-checked class for '+t);
 }
}
for(const token of ['niquizāz','nīquizaz','niquīzaz','oquīz','ōquiz','oquiza','niquizaaz',
 'nipoliuz','nipolihuīz','nipoliuhz','ōpoliuh','opoliuih','opoliuh extra',
 'oninonotzque','nitlānonotza']){
 assert(!analyze(token).some(x=>cases.some(c=>c.lemma===x.lemma)&&x.grade==='hypothesis'),
  'No unsourced vowel lengths, non-licensed short future, mistaken augment, or fused lexical classes: '+token);
}
vm.runInNewContext(read('translator-sentence.js'),ctx);
const sentence=ctx.window.TlahtolliSentence.create(D,P,analyze);
for(const c of cases)for(const token of [c.generated[2],c.generated[11]]){
 const parsed=sentence.analyze(token);
 assert.equal(parsed.complete,false);
 assert.equal(parsed.clauses[0].candidates.length,0);
 assert(parsed.clauses[0].morphologicalClues.some(m=>m.lemma===c.lemma&&m.grade==='hypothesis'));
}
// False verb-POS gate: 'adverb' contains the substring 'verb', but can never
// be elevated to a source-graded finite verb sentence by editorial record data.
const fake={word:'counterexample',variety:'Classical Nahuatl',pos:'adverb',
 meaning:'an adverb, never a verb',source:'https://example.org/fictional-fixture',
 inflections:[{form:'onicounterexample',category:'Preterite 1sg',gloss:'I pretended this was a verb',
 evidence:'dictionary',source:'https://example.org/fictional-fixture'}],claims:[]};
const words=[...D.words,fake],fixture=load(words);
const fakeSentence=ctx.window.TlahtolliSentence.create({...D,words},P,token=>fixture.morph.analyze(token));
assert(fixture.morph.analyze('onicounterexample').some(m=>m.grade==='lexical'));
const parsed=fakeSentence.analyze('onicounterexample');
assert.equal(parsed.complete,false);
assert(!parsed.clauses.some(c=>c.candidates.length),'Nonverbal source form must never be rendered as a finite sentence');
console.log('PASS: 0→28 new source-gated Class 2 hypotheses, two 1sg dictionary forms, no invented paradigm, adverb POS refusal, no English');
