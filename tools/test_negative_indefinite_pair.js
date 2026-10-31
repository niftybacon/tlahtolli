'use strict';
/* Phase 3: grammar-derived paired negative-indefinite evidence, never Gold/English. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const scope={window:{}};
for(const file of ['translator-sentence.js','translator-grammar-ir.js','translator-english.js'])
 vm.runInNewContext(read(file),scope,{filename:file,timeout:20000});
const doc=JSON.parse(read('research/translation_corpus/attested_ayac_speech_contexts_2026_10_30.json'));
const dict=JSON.parse(read('dictionary.json')),paradigms=JSON.parse(read('paradigms.json'));
const mk=pack=>scope.window.TlahtolliSentence.create(dict,paradigms,
 null,null,null,null,null,null,null,null,null,pack);
const sentence=mk(doc),unpacked=mk(null),graph=scope.window.TlahtolliGrammarIR.create(dict),
 english=scope.window.TlahtolliEnglish.create(sentence);
const diagnostic=require('./diagnose_historical_sentences.js');
const model=diagnostic.loadModels();
const positives=[
 {input:'ayac tle quitoz oncan tlatoz',historical:'ENL BC19 Coyoacán donation 1621'},
 {input:'omito ayac tle quitoz yuh niquitohua',historical:'GDN Antonio Quauitencatl 1569'},
 {input:'ayac tle oquito ayac otlachallani',historical:'GDN Melchor de Parada 1585'},
 {input:'ayac otlachallani ayac tle oquito zan pacca yocoxca',
  historical:'GDN Lorenzo Diego and Juana Petronila 1587 [555]'},
 {input:'yn ipatiuh napohualli pesos ayac tle oquito yn ixpan in testigo',
  historical:'GDN Isabel María sale proclamation 1587 [657]'}
];
for(const {input,historical} of positives){
 const a=sentence.analyze(input);
 assert.equal(a.negativeIndefinitePairObservations.length,1,historical);
 const p=a.negativeIndefinitePairObservations[0];
 assert.equal(p.written.join(' '),'ayac tle');
 assert.equal(p.originalWritten.join(' '),'ayac tle');
 assert.equal(p.lexicallyNegativePersonIndefinite,true);
 assert.equal(p.secondIndefiniteUnderPotentialNegation,true);
 for(const f of ['scopeBeyondPairResolved','syntacticSubjectResolved','objectRoleResolved',
  'finitePredicateResolved','personResolved','tenseAspectResolved','englishReviewed',
  'trainingEligible','spellingVariantsInferred','wholeClauseComplete'])assert.equal(p[f],false,f);
 assert.equal(p.grammarSource,'https://languageinindia.com/nov2011/bedellnawatorugo.pdf');
 assert.equal(p.indexedGrammarSource,'https://gdn.iib.unam.mx/diccionario/ayac/41417');
 const g=graph.build(input,a);
 assert.equal(g.counts.negativeIndefinitePairs,1,historical);
 assert.equal(g.edges.filter(e=>e.relation==='candidate-shared-negative-domain').length,1);
 assert.equal(g.nodes.filter(n=>n.kind==='negative-indefinite-pair-candidate'&&
  n.fullScopeResolved===false&&n.grammaticalRolesResolved===false).length,1);
 assert.equal(english.compose(input,a).available,false);
 assert.equal(unpacked.analyze(input).negativeIndefinitePairObservations.length,1,
  'Independent grammar evidence must not rely on one short-witness source pack');
 const r=diagnostic.analyzeText(input,model);
 assert.equal(r.grammaticalNegativeIndefinitePairs,1);
 assert.equal(r.grammarIRNegativeIndefinitePairs,1);
 assert.equal(r.englishDraftAvailable,false);
}
for(const [input,count] of [
 ['ayac tle',1],['AYAC TLE',1],['ayac   tle quitoz',1],
 ['qui ayac tle quitoz',1],['ayac tle yancuic',1],
 ['ayac tle ayac tle',2],
 ['ayac',0],['tle',0],['ayac tleh',0],['ayāc tle',0],
 ['ayâc tle',0],['aiaac tle',0],['ayac tlē',0],
 ['ayac tlen',0],['ayac ahtleh',0],['ayac-tle',0],
 ['ayac, tle',0],['ayac. tle',0],['ayac / tle',0],
 ['ayac\ntle',0],['ayac\u00A0tle',0],['ayac tlequi',0],
 ['nichōca',0],['huiya',0],['yehuan Dios',0]
]){
 const a=unpacked.analyze(input),g=graph.build(input,a);
 assert.equal(a.negativeIndefinitePairObservations.length,count,'exact source morphology: '+JSON.stringify(input));
 assert.equal(g.counts.negativeIndefinitePairs,count,'independent IR: '+JSON.stringify(input));
}
{
 const a=unpacked.analyze('AYAC TLE').negativeIndefinitePairObservations[0];
 assert.equal(a.originalWritten.join(' '),'AYAC TLE');
 assert.equal(graph.build('AYAC TLE',unpacked.analyze('AYAC TLE'))
  .nodes.some(n=>n.kind==='negative-indefinite-pair-candidate'&&n.originalSpelling==='AYAC TLE'),true);
}
for(const mutate of [
 p=>p.tokenIndices[0]++,
 p=>p.tokenIndices[1]++,
 p=>p.originalWritten[0]='ayāc',
 p=>p.written[1]='tlen',
 p=>p.grammarSource='https://example.org/bogus',
 p=>p.indexedGrammarSource='https://example.org/bogus',
 p=>p.lexicalSource='https://example.org/bogus',
 p=>p.lexicallyNegativePersonIndefinite=false,
 p=>p.secondIndefiniteUnderPotentialNegation=false,
 p=>p.observedRelationship='fully verified negation',
 p=>p.scopeBeyondPairResolved=true,
 p=>p.syntacticSubjectResolved=true,
 p=>p.objectRoleResolved=true,
 p=>p.finitePredicateResolved=true,
 p=>p.personResolved=true,
 p=>p.tenseAspectResolved=true,
 p=>p.englishReviewed=true,
 p=>p.trainingEligible=true,
 p=>p.spellingVariantsInferred=true,
 p=>p.wholeClauseComplete=true
]){
 const r=JSON.parse(JSON.stringify(unpacked.analyze('ayac tle quitoz')));
 mutate(r.negativeIndefinitePairObservations[0]);
 assert.equal(graph.build('ayac tle quitoz',r).counts.negativeIndefinitePairs,0,
  'IR must not accept forged scope/roles/evidence');
}
assert.equal(english.compose('nichōca',unpacked.analyze('nichōca')).available,true,
 'Existing finite English control unchanged');
assert.equal(diagnostic.analyzeText('nichōca',model).englishDraftAvailable,true);
assert.equal(doc.guardrails.approved_gold,0);
assert.equal(doc.guardrails.approved_silver,0);
assert.equal(doc.observed_contrast.no_inflection_rule_inferred,true);
assert(read('translator-integrated.js').includes('negativeIndefinitePairObservations?.length'));
console.log('PASS: 5 indexed historical contexts plus productive local negative-indefinite pair recognition; 24+ orthographic/structural refusals; source/IR tampering, English abstention and finite positive control.');
