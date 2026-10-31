'use strict';
// Source-graded productive morphology is NOT independently verified English,
// a historical manuscript reading, or an unrestricted nominal paradigm.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ROOT=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const dictionary=JSON.parse(read('dictionary.json'));
const paradigms=JSON.parse(read('paradigms.json'));
const morphSrc=read('tools/morphology_engine.js').split(
 'renderMorphologyBreakdown=TlahtolliMorphEngine.html;')[0];
function load(words=dictionary.words){
 const ctx={window:{},words,FULL_VERB_PARADIGMS:paradigms.paradigms,
  VERB_TENSES:paradigms.patterns,
  norm:s=>String(s||'').normalize('NFC').toLowerCase(),
  stripToken:s=>String(s||'').replace(/^[^\p{L}\p{M}]+|[^\p{L}\p{M}]+$/gu,''),
  historicalSpellings:w=>String(w.original||'').split(/[;,/]+/).map(x=>x.trim()).filter(Boolean),
  safe:String,validUrl:()=>true,safeLink:()=>''};
 vm.runInNewContext(morphSrc+'\nthis.morph=TlahtolliMorphEngine;',ctx);
 for(const file of ['translator-sentence.js','translator-english.js','translator-grammar-ir.js'])
  vm.runInNewContext(read(file),ctx);
 const morph=token=>ctx.morph.analyze(token);
 const sentence=ctx.window.TlahtolliSentence.create({...dictionary,words},paradigms,morph);
 const english=ctx.window.TlahtolliEnglish.create(sentence);
 const ir=ctx.window.TlahtolliGrammarIR.create({...dictionary,words},null,paradigms,sentence);
 return {morph,ctx,sentence,english,ir};
}
const {morph,sentence,english,ir}=load();
const KIND='Source-bounded plural nominal-predicate hypothesis';
for(const [token,person,recorded] of [
 ['antepilhuan','2pl',true],['titepilhuan','1pl',false]
]){
 const m=morph(token).filter(x=>x.kind===KIND);
 assert.equal(m.length,1,token);
 assert.equal(m[0].lemma,'tepilhuan');
 assert.equal(m[0].grade,'hypothesis');
 assert.equal(m[0].features.category,'nominal-predicate');
 assert.equal(m[0].features.subject,person);
 assert.equal(m[0].features.exactOriginalAttestation,recorded);
 assert.equal(m[0].parts.map(p=>p.surface).join(''),token);
 assert.deepEqual(Array.from(m[0].parts,x=>x.surface),
  [person==='2pl'?'an':'ti','te','pil','huan']);
 assert.match(m[0].source,/nahuatl\.wired-humanities\.org/);
}
for(const bad of [
 'antēpilhuan','antepilhuān','antepilhua','amtepilhuan',
 'antepilhuanx','anpilli','anpipiltin','nītepilhuan','noppilhuan'
]){
 assert.equal(morph(bad).filter(x=>x.kind===KIND).length,0,
  'Do not license spelling, suffix or unrelated noble noun: '+bad);
}
const singular=sentence.analyze('antepilhuan');
assert.equal(singular.complete,true);
assert.equal(singular.clauses.length,1);
const c=singular.clauses[0].candidates;
assert.equal(c.length,1);
assert.equal(c[0].frame.subjectPerson,4);
assert.equal(c[0].constructionId,'source-bounded-antepilhuan-nominal-predicate');
assert.equal(c[0].coverage,1);
assert.equal(c[0].frame.predicate,'tepilhuan');
assert.equal(c[0].grade,'grammar-derived candidate');
assert.equal(c[0].frame.morphologyEvidence.grade,'hypothesis');
assert(c[0].sources.some(x=>x.includes('188794')));
const composed=english.compose('antepilhuan',singular);
assert.equal(composed.available,true);
assert.equal(composed.verified,false);
assert.equal(english.render(composed),"You (plural) are someone's children.");
const graph=ir.build('antepilhuan',singular);
assert.equal(graph.schema,'tlahtolli-grammar-ir-v1');
assert.equal(graph.input,'antepilhuan');
assert.equal(graph.status,'candidate-only; not a translation');
const nomNode=graph.nodes.find(n=>n.kind==='nominal-predicate'&&
 n.written==='antepilhuan'&&n.subjectPerson==='2pl');
assert(nomNode,'Shared grammar representation must retain a nominal predicate');
assert.equal(nomNode.vocativeVsPredicativeDiscourseResolved,false);
assert(graph.nodes.some(n=>n.kind==='analysis-alternative'&&
 n.family==='source-bounded-plural-nominal-predicate'));
const audited=ir.auditEnglish(composed,singular,graph);
assert.equal(audited.available,true,'Nominal grammar must pass source-locked IR audit');
assert.equal(audited.verified,false);
assert.equal(audited.units[0].options[0].structure.kind,
 'source-bounded-nominal-predicate');
// Tampering with a person, predicate class or English cannot bypass the IR.
for(const corrupt of [
 a=>{a.units[0].options[0].structure.frame.subjectPerson=2},
 a=>{a.units[0].options[0].structure.frame.tense='present'},
 a=>{a.units[0].options[0].text='You are all princes'},
 a=>{a.units[0].options[0].sources=['https://example.org/forged']}
]){
 const modified=JSON.parse(JSON.stringify(composed));corrupt(modified);
 assert.equal(ir.auditEnglish(modified,singular,graph).available,false,
  'Do not accept unsupported nominal meaning/roles after IR audit');
}

// Constructed extension may be analyzed morphologically, but there is
// no exact attestation, hence no authorized complete English.
const unrecorded=sentence.analyze('titepilhuan');
assert.equal(unrecorded.complete,false);
assert.equal(unrecorded.clauses[0].candidates.length,0);
assert(unrecorded.clauses[0].morphologicalClues.some(x=>x.kind===KIND));
assert.equal(english.compose('titepilhuan',unrecorded).available,false);
for(const passage of [
 'Ma yan moyoliuh quimati in antepilhuan in anquauhtin amo celo ca',
 'in antepilhuan in anquauhtin',
 'ahmo antepilhuan',
 'antepilhuan in anquauhtin',
 'antepilhuan extra',
 'antepilhuan?',
 'antēpilhuan'
]){
 const a=sentence.analyze(passage);
 assert.equal(a.complete,false,'Full poetic context still unsupported: '+passage);
 assert.equal(english.compose(passage,a).available,false,
  'No silent translation of unreconciled vocatives/negation: '+passage);
}
// Manipulated editorial source claims invalidate both morphology and English.
const tainted=()=>JSON.parse(JSON.stringify(dictionary.words));
for(const field of ['headword','pos','meaning']){
 const ws=tainted(),w=ws.find(x=>x.word==='tepilhuan');
 assert(w);
 w.claims=w.claims.filter(c=>c.field!==field);
 const model=load(ws);
 assert.equal(model.morph('antepilhuan').filter(x=>x.kind===KIND).length,0);
 assert.equal(model.sentence.analyze('antepilhuan').complete,false);
}
{
 const ws=tainted(),w=ws.find(x=>x.word==='tepilhuan');
 w.source='https://example.com/forged';
 assert.equal(load(ws).sentence.analyze('antepilhuan').complete,false);
}
{
 const ws=tainted(),w=ws.find(x=>x.word==='tepilhuan');
 w.pluralStatus='attested';
 assert.equal(load(ws).sentence.analyze('antepilhuan').complete,false);
}
console.log('PASS antepilhuan: licensed nominal candidate through morphology -> sentence -> shared IR -> gated English, 1pl stays unverified, historical passage abstention, exact-source refusal');
