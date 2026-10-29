'use strict';
// Source finite clause diagnostics: documented verb FORM != attested English sentence.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const data=name=>JSON.parse(read(name));
const dictionary=data('dictionary.json'),paradigms=data('paradigms.json');
const grammar=data('data/clause_grammar.json'),poss=data('data/possessed_form_evidence.json');
const pack=data('data/source_finite_context.json'),passages=data('data/passages.json');
const ctx={window:{},URL,words:dictionary.words,FULL_VERB_PARADIGMS:paradigms.paradigms,
 VERB_TENSES:paradigms.patterns,
 norm:s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(),
 stripToken:s=>String(s).replace(/^[^\p{L}\p{M}]+|[^\p{L}\p{M}]+$/gu,'').toLowerCase(),
 historicalSpellings:w=>String(w.original||'').split(/[;,/]+/).map(x=>x.trim()).filter(Boolean),
 safe:x=>String(x),validUrl:x=>x,safeLink:(a,b)=>b};
const morphSource=read('tools/morphology_engine.js').split(
 'renderMorphologyBreakdown=TlahtolliMorphEngine.html;')[0];
assert(morphSource.includes('const TlahtolliMorphEngine'));
vm.runInNewContext(morphSource+'\nthis.canonicalMorph=TlahtolliMorphEngine;',ctx);
for(const name of ['translator-sentence.js','translator-english.js','translator-grammar-ir.js'])
 vm.runInNewContext(read(name),ctx);
const morph=token=>ctx.canonicalMorph.analyze(token);
const make=(evidence=pack,doc=dictionary,provider=morph,rules=grammar,corpus=passages)=>
 ctx.window.TlahtolliSentence.create(doc,paradigms,provider,{entries:[]},
  null,rules,poss,evidence,corpus);
const model=make(),composer=ctx.window.TlahtolliEnglish.create(model);
const ir=ctx.window.TlahtolliGrammarIR.create(dictionary,passages);
const check=(input,kind)=>{
 const result=model.analyze(input),cl=result.clauses[0];
 assert.equal(result.complete,false,'Source structural hypothesis must not claim complete sentence');
 assert.equal(cl.candidates.length,0,'No fabricated finite English candidate');
 assert.equal(cl.historicalFiniteProposals.length,1,input);
 const p=cl.historicalFiniteProposals[0];
 assert.equal(p.construction,kind);
 assert.equal(p.coverage,cl.tokens.length,'No original word silently discarded');
 assert(p.sources.length>=2&&p.sources.every(url=>url.startsWith('https://')));
 assert(p.grade.includes('NOT an attested sentence'));
 assert(p.note.includes(p.sourceWindow?'NOT thereby verified':'NOT thereby attested'),
  'Exact editorial witness must not be confused with verified grammar');
 assert.equal(composer.compose(input,result).available,false);
 const graph=ir.build(input,result);
 assert.equal(graph.alternatives.length,1);
 assert(graph.nodes.some(n=>n.kind==='finite-predicate'&&n.agreementCertified===false));
 assert(graph.edges.every(e=>e.notIdentity===true));
 return {p,result,graph};
};
assert(ctx.canonicalMorph.analyze('qujça').some(m=>m.kind==='Historically transcribed finite form'&&m.grade==='manuscript'));
assert(ctx.canonicalMorph.analyze('tipolihui').some(m=>m.kind==='Historically transcribed finite form'&&m.grade==='manuscript'));
for(const input of ['qujça in xochitl','in xochitl qujça']){
 const {p,graph}=check(input,'source finite + overt noun; conditional 3sg subject unverified');
 assert.equal(p.verb.lemma,'quiza');
 assert.equal(p.verb.subjectPerson,'unresolved');
 assert.equal(p.nounPhrase.lemma,'xōchitl');
 assert(p.nounPhrase.roleStatus.includes('ONLY IF'));
 assert(graph.edges.some(x=>x.relation==='possible-conditional-argument'&&x.requiresUnverified3sg));
}
for(const input of ['itech qujça','qujça itech']){
 const {p,graph}=check(input,'source finite + unresolved relational adjunct');
 assert.equal(p.verb.lemma,'quiza');
 assert.equal(p.verb.subjectPerson,'unresolved');
 assert.equal(p.relational.written,'itech');
 assert.equal(p.relational.lemma,'ītech');
 assert(graph.edges.some(e=>e.relation==='possible-relational-attachment'&&
  e.attachmentResolved===false&&e.possessorResolved===false));
}
for(const input of ['cen tipolihui','tipolihui cen']){
 const {p,graph}=check(input,'source finite + unscoped adverb');
 assert.equal(p.verb.lemma,'polihui');
 assert.equal(p.verb.subjectPerson,'2sg');
 assert.equal(p.adverb.lemma,'cen');
 assert(graph.edges.some(x=>x.relation==='possible-adverbial-scope'&&x.scopeResolved===false));
}
// New full-coverage *witnessed word window*, not a certified syntactic parse.
const {p:witnessed,graph:witnessGraph}=check('itech qujça xochitl',
 'source finite + relational + witnessed bare noun (role unresolved)');
assert.equal(witnessed.sourceWindow.passageId,'passage-3');
assert.equal(witnessed.nounPhrase.lemma,'xōchitl');
assert(witnessed.nounPhrase.roleStatus.includes('UNRESOLVED'));
assert.equal(witnessed.relational.lemma,'ītech');
assert(witnessGraph.edges.some(e=>e.relation==='possible-unassigned-nominal'&&
 e.nominalRoleResolved===false&&e.requiresUnverified3sg===false));
assert(!witnessGraph.edges.some(e=>e.relation==='possible-conditional-argument'),
 'The cited bare noun must not silently become a grammatical subject');
// New four-token cross-product: known source finite + relational + *marked* NP.
for(const input of ['itech qujça in xochitl','in xochitl itech qujça']){
 const {p,graph}=check(input,
  'source finite + relational + marked noun (conditional 3sg role)');
 assert.equal(p.sourceWindow,null,'Composed four-token sequence is not attested');
 assert.equal(p.nounPhrase.lemma,'xōchitl');
 assert(p.nounPhrase.roleStatus.includes('ONLY IF'));
 assert.equal(p.relational.lemma,'ītech');
 assert(graph.edges.some(e=>e.relation==='possible-conditional-argument'&&
  e.requiresUnverified3sg===true));
 assert(graph.edges.some(e=>e.relation==='possible-relational-attachment'&&
  e.attachmentResolved===false));
}
const bareBlocked=[
 {...passages,records:[]},
 {...passages,records:passages.records.map(p=>p.id==='passage-3'?{...p,original:'injn itoca itech qujça tlapalli, ioan xochitl'}:p)},
 {...passages,records:passages.records.map(p=>p.id==='passage-3'?{...p,train_eligible:true}:p)},
 {...passages,records:passages.records.map(p=>p.id==='passage-3'?{...p,reading_status:'teaching_example'}:p)},
 {...passages,records:passages.records.map(p=>p.id==='passage-3'?{...p,reader:{...p.reader,source:'https://example.com/forgery'}}:p)}
];
for(const [i,corpus] of bareBlocked.entries()){
 assert.equal(make(pack,dictionary,morph,grammar,corpus).analyze('itech qujça xochitl')
  .clauses[0].historicalFiniteProposals.length,0,'Unlicensed bare noun window '+i);
}
// The sentence analyzer and graph independently check the cited source window.
for(const tamper of [
 p=>{p.sourceWindow.passageId='passage-1';},
 p=>{p.sourceWindow.source='https://example.org/fake';},
 p=>{p.sourceWindow.status='fully verified';},
 p=>{p.nounPhrase.lemma='calli';},
 p=>{p.relational.lemma='itic';}
]){
 const candidate=JSON.parse(JSON.stringify(model.analyze('itech qujça xochitl')));
 tamper(candidate.clauses[0].historicalFiniteProposals[0]);
 assert.equal(ir.build('itech qujça xochitl',candidate).alternatives.length,0,
  'Tampered witness or phrase role must not enter shared IR');
}
assert.equal(make(pack,dictionary,morph,grammar,null)
 .analyze('itech qujça xochitl').clauses[0].historicalFiniteProposals.length,0,
 'Missing canonical passages must refuse bare nouns');
assert.equal(make(pack,dictionary,morph,grammar,null)
 .analyze('itech qujça in xochitl').clauses[0].historicalFiniteProposals.length,1,
 'Explicit marked-NP construction does not require falsely claimed witness');
assert.equal(make(pack,dictionary,morph,{...grammar,rules:[]})
 .analyze('itech qujça in xochitl').clauses[0].historicalFiniteProposals.length,0,
 'Existing declarative agreement rule must license conditional four-token NP');

const refuses=[
 'tipolihui in cihuātl','quiza in xochitl','qujça in unknown',
 'qujça in xochitl extra','ahmo qujça in xochitl','cen unknown',
 'qujça tipolihui','qujça in xochitl cen','qujça itech extra','qujça in',
 'itech qujça cihuātl','itech qujça tlapalli','itech qujça in unknown',
 'itech tipolihui in xochitl','itech qujça xochitl extra',
 'qujça?','niquittaz in cihuātl','ticnamaca y¯ totlal'
];
for(const input of refuses)assert.equal(
 model.analyze(input).clauses[0].historicalFiniteProposals?.length||0,0,input);
assert.equal(model.analyze('niquittaz in cihuātl').complete,true,
 'Indexed English remains intact');
assert.equal(composer.render(composer.compose('niquittaz in cihuātl',
 model.analyze('niquittaz in cihuātl'))),'I will see the woman.');
const negativePacks=[
 {...pack,train_eligible:true},{...pack,evaluation_eligible:true},
 {...pack,version:2},{...pack,records:[...pack.records,pack.records[0]]},
 {...pack,records:pack.records.map((r,i)=>i? r:{...r,source_url:'https://example.org/not-source'})},
 {...pack,records:pack.records.map((r,i)=>i?r:{...r,subject_person:'2sg'})},
 {...pack,records:pack.records.map((r,i)=>i?{...r,subject_person:null}:r)},
 {...pack,records:pack.records.map((r,i)=>i?r:{...r,kind:'Unverified invented finite'})},
 {...pack,records:[...pack.records,{...pack.records[0],id:'forged-unreviewed',form:'quiza'}]}
];
for(const [i,invalid] of negativePacks.entries()){
 assert.equal(make(invalid).analyze('qujça in xochitl').clauses[0].historicalFiniteProposals.length,0,'Bad pack '+i);
 assert.equal(make(invalid).analyze('cen tipolihui').clauses[0].historicalFiniteProposals.length,0,'Bad pack '+i);
}
assert.equal(make(null).analyze('qujça in xochitl').clauses[0].historicalFiniteProposals.length,0);
assert.equal(make(pack,dictionary,()=>[]).analyze('qujça in xochitl')
 .clauses[0].historicalFiniteProposals.length,0,'Source morphological cross-check mandatory');
const noRules={...grammar,rules:[]};
assert.equal(make(pack,dictionary,morph,noRules).analyze('qujça in xochitl')
 .clauses[0].historicalFiniteProposals.length,0,'Source noun hypothesis needs actual grammar rule');
for(const [mutate,label] of [
 [p=>{p.verb.source='https://example.org/forged'},'false finite provenance'],
 [p=>{p.verb.subjectPerson='2sg'},'forged subject person'],
 [p=>{p.nounPhrase.lemma='calli'},'forged nominal lemma'],
 [p=>{p.nounPhrase.source='https://example.org/false'},'forged noun source']
 ]){
 const original=model.analyze('qujça in xochitl'),broken=JSON.parse(JSON.stringify(original));
 mutate(broken.clauses[0].historicalFiniteProposals[0]);
 assert.equal(ir.build('qujça in xochitl',broken).alternatives.length,0,label);
}
console.log('PASS source finite context: 2 cited finite forms; 6 existing plus 3 new source-finite structural cases; exact cited bare noun witness and marked-NP grammar; independent IR and hostile source guards; no invented English.');
