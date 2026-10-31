'use strict';
/* Source-indexed itoa morphology SHAPES: not complete historical tense/English. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const data=p=>JSON.parse(read(p));
const evidence=data('research/translation_corpus/source_graded_itoa_speech_morphology_2026_10_30.json');
const documentEvidence=data('research/translation_corpus/attested_ayac_speech_contexts_2026_10_30.json');
const scope={window:{}};
for(const path of ['translator-sentence.js','translator-grammar-ir.js','translator-english.js'])
 vm.runInNewContext(read(path),scope,{filename:path,timeout:20000});
const dict=data('dictionary.json'),paradigms=data('paradigms.json');
const mk=pack=>scope.window.TlahtolliSentence.create(dict,paradigms,
 null,null,null,null,null,null,null,null,null,documentEvidence,pack);
const sentence=mk(evidence),unpacked=mk(null);
const graph=scope.window.TlahtolliGrammarIR.create(dict);
const english=scope.window.TlahtolliEnglish.create(sentence);
const diag=require('./diagnose_historical_sentences.js');
const models=diag.loadModels();
assert.equal(evidence.format,'tlahtolli-source-graded-itoa-speech-morphology-v1');
assert.equal(evidence.forms.length,2);
assert.equal(evidence.guardrails.approved_silver,0);
assert.equal(evidence.guardrails.approved_gold,0);
for(const [k,v] of Object.entries(evidence.guardrails))if(k.startsWith('no_'))assert.equal(v,true,k);
assert.deepEqual(evidence.forms.map(x=>x.written),['quitoz','oquito']);
const originalContexts=[
 ['ayac tle quitoz oncan tlatoz','quitoz','future-z surface-shape candidate'],
 ['omito ayac tle quitoz yuh niquitohua','quitoz','future-z surface-shape candidate'],
 ['ayac tle oquito ayac otlachallani','oquito','preterite-augment surface-shape candidate'],
 ['ayac otlachallani ayac tle oquito zan pacca yocoxca','oquito','preterite-augment surface-shape candidate'],
 ['yn ipatiuh napohualli pesos ayac tle oquito yn ixpan in testigo','oquito','preterite-augment surface-shape candidate']
];
for(const [input,written,shape] of originalContexts){
 const a=sentence.analyze(input),pairs=a.negativeIndefinitePairObservations;
 assert.equal(pairs.length,1,'one source-grade pair for historical context: '+input);
 assert(pairs[0].finiteSpeechCandidate,'Source-graded finite surface must reach canonical sentence');
 const f=pairs[0].finiteSpeechCandidate;
 assert.equal(f.originalWritten,written);
 assert.equal(f.writtenForm,written);
 assert.equal(f.surfaceShape,shape);
 assert.equal(f.lemmaCandidate,'itoa');
 assert.equal(f.finiteMorphologyCandidateOnly,true);
 assert.equal(f.grammaticalIndicator,written==='quitoz'?'-z':'o-');
 for(const prop of ['completeSegmentationVerified','contextualTenseAspectVerified',
  'personNumberVerified','objectIdentityVerified','negativeScopeVerified',
  'semanticArgumentRolesVerified','englishAlignmentVerified',
  'trainingAllowed','variantRewritingAllowed'])assert.equal(f[prop],false,prop);
 assert.equal(english.compose(input,a).available,false);
 assert.equal(a.complete,false,'No invented historical whole clause');
 const g=graph.build(input,a);
 assert.equal(g.counts.negativeIndefinitePairs,1);
 assert.equal(g.counts.sourceGradedSpeechShapes,1);
 assert(g.nodes.some(n=>n.kind==='source-graded-itoa-speech-shape'&&
  n.originalWritten===written&&n.shape===shape&&n.temporalSemanticsResolved===false));
 assert.equal(g.edges.filter(e=>e.relation==='possible-source-graded-finite-speech-form').length,1);
 const d=diag.analyzeText(input,models);
 assert.equal(d.sourceGradedSpeechFiniteShapes,1);
 assert.equal(d.grammarIRSpeechFiniteShapes,1);
 assert.equal(d.englishDraftAvailable,false);
 assert.equal(d.fullFiniteClauseAnalysis,false);
 assert(d.tokenCount>=5);
}
for(const [input,expect,firstSurface] of [
 ['ayac tle quitoz',1,'quitoz'],
 ['AYAC TLE QUITOZ',1,'QUITOZ'],
 ['ayac tle oquito',1,'oquito'],
 ['ayac tle quitoz ayac tle oquito',2,'quitoz'],
 ['ayac tle',0,null],['ayac tle quito',0,null],
 ['ayac tle oquittō',0,null],['ayac tle quitozque',0,null],
 ['ayac tle oquitoque',0,null],['ayac tle quitoza',0,null],
 ['ayac tle oquitō',0,null],['ayac tlen quitoz',0,null],
 ['ayac tla quitoz',0,null],['ayâc tle quitoz',0,null],
 ['aiaac tle quitoz',0,null],['ayac tlē quitoz',0,null],
 ['ayac tle, quitoz',0,null],['ayac tle. quitoz',0,null],
 ['ayac tle/oquito',0,null],['ayac tle-oquito',0,null],
 ['ayac tle\noquito',0,null],['ayac tle\u00A0oquito',0,null],
 ['yehuan Dios',0,null],['tepilhuan',0,null],['huiya',0,null],['nichōca',0,null]
]){
 const a=sentence.analyze(input);
 const fs=a.negativeIndefinitePairObservations.filter(x=>x.finiteSpeechCandidate);
 assert.equal(fs.length,expect,'No spelling or punctuation guessing: '+JSON.stringify(input));
 assert.equal(graph.build(input,a).counts.sourceGradedSpeechShapes,expect,input);
 if(expect)assert.equal(fs[0].finiteSpeechCandidate.originalWritten,firstSurface);
}
for(const edit of [
 d=>{d.format='not-speech'},
 d=>{d.attested_lemma.candidate='tlahtoa'},
 d=>{d.attested_lemma.part_of_speech_in_source='v.i.'},
 d=>{d.attested_lemma.source_url='https://example.org/forgery'},
 d=>{d.grammar_sources.future='https://example.org/forgery'},
 d=>{d.grammar_sources.preterite='https://example.org/forgery'},
 d=>{d.grammar_sources.preterite_stem='https://example.org/forgery'},
 d=>{d.witnessed_pair_context='ayac tlen'},
 d=>{d.forms[0].written='quisoz'},
 d=>{d.forms[1].source_url='https://example.org/forgery'},
 d=>{d.forms[0].context_ids[0]='forged-doc'},
 d=>{d.forms[1].grammatical_indicator='-z'},
 d=>{d.forms[1].morphological_segmentation_adjudicated=true},
 d=>{d.guardrails.no_past_vs_perfect_decision=false},
 d=>{d.guardrails.approved_gold=1}
]){
 const modified=JSON.parse(JSON.stringify(evidence));edit(modified);
 const a=mk(modified).analyze('ayac tle quitoz');
 assert.equal(a.negativeIndefinitePairObservations.length,1,'Pair grammar independent of lexeme form pack');
 assert.equal(a.negativeIndefinitePairObservations[0].finiteSpeechCandidate,null,
  'Any damaged source pack invalidates ALL finite shapes');
}
for(const edit of [
 f=>{f.tokenIndex=7},f=>{f.lemmaCandidate='tlahtoa'},
 f=>{f.writtenForm='oquito'},f=>{f.originalWritten='oquito'},
 f=>{f.surfaceShape='preterite-augment surface-shape candidate'},
 f=>{f.grammaticalIndicator='-c'},f=>{f.sourceUrl='https://example.org/forged'},
 f=>{f.dictionarySource='https://example.org/forged'},
 f=>{f.lexicalCrosscheck='https://example.org/forged'},
 f=>{f.futureGrammar='https://example.org/forged'},
 f=>{f.preteriteGrammar='https://example.org/forged'},
 f=>{f.stemGrammar='https://example.org/forged'},
 f=>{f.editedWitnessIds[0]='alien-witness'},
 f=>{f.finiteMorphologyCandidateOnly=false},
 f=>{f.completeSegmentationVerified=true},
 f=>{f.contextualTenseAspectVerified=true},
 f=>{f.personNumberVerified=true},
 f=>{f.objectIdentityVerified=true},
 f=>{f.negativeScopeVerified=true},
 f=>{f.semanticArgumentRolesVerified=true},
 f=>{f.englishAlignmentVerified=true},
 f=>{f.trainingAllowed=true},
 f=>{f.variantRewritingAllowed=true}
]){
 const a=JSON.parse(JSON.stringify(sentence.analyze('ayac tle quitoz')));
 edit(a.negativeIndefinitePairObservations[0].finiteSpeechCandidate);
 const g=graph.build('ayac tle quitoz',a);
 assert.equal(g.counts.negativeIndefinitePairs,1,'Do not accidentally remove independently sound pair');
 assert.equal(g.counts.sourceGradedSpeechShapes,0,'Reject forged finite source/tense/roles');
}
assert.equal(unpacked.analyze('ayac tle quitoz').negativeIndefinitePairObservations[0].finiteSpeechCandidate,null);
assert.equal(english.compose('nichōca',sentence.analyze('nichōca')).available,true);
assert.equal(diag.analyzeText('nichōca',models).englishDraftAvailable,true);
assert(read('translator-integrated.js').includes('speechMorphEvidence.status'));
console.log('PASS 2 distinct source-backed itoa finite surface shapes through 5 original historical contexts, canonical sentence/IR/browser/diagnostic; 20+ source/claim/near-spelling refusal cases; ordinary English finite control retained.');
