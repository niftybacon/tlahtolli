'use strict';
// Source finite clause diagnostics: documented verb FORM != attested English sentence.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const data=name=>JSON.parse(read(name));
const dictionary=data('dictionary.json'),paradigms=data('paradigms.json');
const grammar=data('data/clause_grammar.json'),poss=data('data/possessed_form_evidence.json');
const pack=data('data/source_finite_context.json');
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
const make=(evidence=pack,doc=dictionary,provider=morph,rules=grammar)=>
 ctx.window.TlahtolliSentence.create(doc,paradigms,provider,{entries:[]},
  null,rules,poss,evidence);
const model=make(),composer=ctx.window.TlahtolliEnglish.create(model);
const ir=ctx.window.TlahtolliGrammarIR.create(dictionary);
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
 assert(p.note.includes('NOT thereby attested'));
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
const refuses=[
 'tipolihui in cihuātl','quiza in xochitl','qujça in unknown',
 'qujça in xochitl extra','ahmo qujça in xochitl','cen unknown',
 'qujça tipolihui','qujça in xochitl cen','qujça itech extra','qujça in',
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
console.log('PASS source finite context: two cited non-paradigm predicates, six multi-token structural proposals, including attested itech qujça window, graph evidence, hostile provenance and syntax refusals, no invented English or certified agreement.');
