'use strict';
/* Original edited colonial excerpts are SOURCE CONTEXTS, NOT approved grammar or Gold. */
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const doc=JSON.parse(read('research/translation_corpus/attested_ayac_speech_contexts_2026_10_30.json'));
const diagnostic=require('./diagnose_historical_sentences.js');
const scope={window:{}};
for(const js of ['translator-sentence.js','translator-grammar-ir.js','translator-english.js'])
 vm.runInNewContext(read(js),scope,{filename:js,timeout:20000});
const dict=JSON.parse(read('dictionary.json')),paradigms=JSON.parse(read('paradigms.json'));
const make=pack=>scope.window.TlahtolliSentence.create(dict,paradigms,
 null,null,null,null,null,null,null,null,null,pack);
const sentence=make(doc),ir=scope.window.TlahtolliGrammarIR.create(dict),
 english=scope.window.TlahtolliEnglish.create(sentence);
assert.equal(doc.format,'tentli-cross-document-negative-speech-research-v2');
assert.equal(doc.witnesses.length,3);
assert.equal(new Set(doc.witnesses.map(w=>w.work_id)).size,3);
assert.equal(doc.guardrails.approved_gold,0);
assert.equal(doc.guardrails.approved_silver,0);
assert.equal(doc.observed_contrast.no_inflection_rule_inferred,true);
const model=diagnostic.loadModels();
for(const w of doc.witnesses){
 const input=w.short_excerpt,r=sentence.analyze(input);
 assert.equal(r.attestedAyacObservations.length,1,'Exact matched source: '+w.id);
 assert.equal(r.complete,false,'Not a complete clause grammar or certified English');
 const o=r.attestedAyacObservations[0];
 assert.equal(o.witnessId,w.id);
 assert.equal(o.speechWritten,w.witnessed_speech_surface);
 for(const x of ['personResolved','tenseResolved','rolesResolved','negativeScopeResolved',
  'grammarRuleAdded','wholeEnglishReviewed','manuscriptCollated','trainingEligible','silverApproved','goldApproved'])
  assert.equal(o[x],false,x);
 const g=ir.build(input,r);
 assert.equal(g.counts.attestedAyacContexts,1);
 assert.equal(g.nodes.filter(n=>n.kind==='attested-ayac-token').length,3);
 assert.equal(g.edges.filter(e=>e.relation==='attested-original-order').length,3);
 assert.equal(g.alternatives.length,0,'Word order does not authorize complete parse');
 assert(g.nodes.some(n=>n.kind==='attested-ayac-speech-context'&&n.writtenSpeech===w.witnessed_speech_surface));
 assert.equal(english.compose(input,r).available,false);
 assert.match(english.compose(input,r).reason,/Cited ayac tle/);
 const a=diagnostic.analyzeText(input,model);
 assert.equal(a.sourceLinkedAyacContexts,1,'Real source consumed by existing analyzer');
 assert.equal(a.grammarIRAyacContexts,1,'Real grammar IR records source-only context');
 assert.equal(a.fullFiniteClauseAnalysis,false);
 assert.equal(a.englishDraftAvailable,false);
 assert(a.tokenCount>=5);
 assert.equal(sentence.analyze('tla '+input+' tlalli').attestedAyacObservations.length,1);
}
for(const input of [
 'ayac','ayac tle quitoz','ayac tle oquito',
 'aiaac tle quitoz oncan tlatoz','ayāc tle quitoz oncan tlatoz',
 'ayac tlen quitoz oncan tlatoz','ayac tle quitos oncan tlatoz',
 'ayac tle oquito oncan tlatoz','ayac tle quitoz ayac otlachallani',
 'ayac tle oquito yuh niquitohua','ayac-tle quitoz oncan tlatoz',
 'ayac tle quitoz, oncan tlatoz','ayac tle quitoz. oncan tlatoz',
 'omito ayac tle quitoz. yuh niquitohua',
 'yehuan Dios','tepilhuan','huiya','nichōca'
]){
 const r=sentence.analyze(input);
 assert.equal(r.attestedAyacObservations.length,0,'No generalized grammar: '+input);
 assert.equal(ir.build(input,r).counts.attestedAyacContexts,0);
}
for(const mutation of [
 x=>{x.guardrails.no_person_tense_inference=false},
 x=>{x.guardrails.approved_gold=1},
 x=>{x.observed_contrast.no_cross_witness_rewrites=false},
 x=>{x.witnesses[0].short_excerpt='ayac tle quitoz'},
 x=>{x.witnesses[1].source_url='https://example.org/forged'},
 x=>{x.witnesses[2].witnessed_speech_surface='quitoz'},
 x=>{x.witnesses[0].manuscript_collated=true},
 x=>{x.lexical_reference.source_url='https://example.org/fake'}
]){
 const edited=JSON.parse(JSON.stringify(doc));mutation(edited);
 assert.equal(make(edited).analyze(doc.witnesses[0].short_excerpt).attestedAyacObservations.length,0,
  'Fail closed on modified source and permissions');
}
for(const mutate of [
 o=>{o.sourceUrl='https://example.org/forged'},o=>{o.personResolved=true},
 o=>{o.tenseResolved=true},o=>{o.negativeScopeResolved=true},
 o=>{o.wholeEnglishReviewed=true},o=>{o.tokenStart=7},o=>{o.speechWritten='oquito'}
]){
 const input=doc.witnesses[0].short_excerpt,copy=JSON.parse(JSON.stringify(sentence.analyze(input)));
 mutate(copy.attestedAyacObservations[0]);
 assert.equal(ir.build(input,copy).counts.attestedAyacContexts,0,
  'IR must not trust injected/altered person, source, tense or scope');
}
assert.equal(make(null).analyze(doc.witnesses[0].short_excerpt).attestedAyacObservations.length,0);
assert.equal(sentence.analyze('nichōca').complete,true);
assert.equal(diagnostic.analyzeText('nichōca',model).englishDraftAvailable,true);
assert(read('translator-integrated.js').includes('ayacEvidence.status'));
assert(read('translator-integrated.js').includes('result.attestedAyacObservations?.length'));
console.log('PASS: 3 witnessed ayac speech contexts enter existing sentence/IR/English refusal; near-form/source tampering and ordinary finite regression.');
