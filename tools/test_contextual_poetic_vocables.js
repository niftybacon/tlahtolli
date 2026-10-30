'use strict';
/* Scholarly and project-director context evidence must actually enter the
 * SAME production sentence, English and shared grammar-IR engines.
 * It must NEVER turn a poetic vocable into a universal stopword.
 */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const data=p=>JSON.parse(read(p));
const scope={window:{}};
for(const file of ['translator-sentence.js','translator-english.js','translator-grammar-ir.js'])
 vm.runInNewContext(read(file),scope,{filename:file,timeout:25000});
const dictionary=data('dictionary.json'),paradigms=data('paradigms.json'),evidence=data('research/translation_corpus/huiya_context_specific_song_vocable_2026_10_30.json');
const config=data('data/clause_grammar.json');
const make=proof=>scope.window.TlahtolliSentence.create(dictionary,paradigms,
 null,null,null,config,null,null,null,null,proof);
const sentence=make(evidence),english=scope.window.TlahtolliEnglish.create(sentence),
 ir=scope.window.TlahtolliGrammarIR.create(dictionary);
const songs=[
 ['brinton-xv-02-huiya','Nican momalinaco in colcahuahtecpillotl huiya nican milacatzoa in Colhuaca Chichimecayotl'],
 ['cantares-18v-304-huiya','O anca yuhqui. ye niYohyontzin. Huiya! ha noyol quimati, ohuaya ohuaya'],
];
for(const [id,original] of songs){
 const result=sentence.analyze(original);
 assert.equal(result.poeticVocableObservations.length,1,id);
 const observation=result.poeticVocableObservations[0];
 assert.equal(observation.sourceId,id);
 assert.equal(observation.originalWrittenForm,'huiya');
 assert.equal(observation.universallyVocable,false);
 assert.equal(observation.englishDeletionPermitted,false);
 assert.equal(observation.competingVerbalLemma,'yauh');
 assert.equal(observation.wholeClauseTranslationVerified,false);
 assert.equal(observation.sourceManuscriptImageChecked,false);
 assert.equal(observation.remainingSongOccurrencesUnreviewed,true);
 assert(observation.originalSourceUrl.startsWith('https://'));
 assert(observation.methodologyUrl.includes('Birgitta_Leander.pdf'));
 assert.equal(english.compose(original,result).available,false,'No English dropping original sung syllable');
 assert.match(english.compose(original,result).reason,/huiya/);
 const graph=ir.build(original,result);
 assert.equal(graph.counts.poeticVocableContexts,1);
 const node=graph.nodes.find(n=>n.kind==='poetic-vocable-context');
 assert(node&&node.historicalContextId===id);
 assert.equal(node.grammaticalRuleAdded,false);
 assert.equal(graph.unresolved.semanticScope,true);
 assert.equal(result.complete,false,'Song excerpts are NOT completed clause translations');
}
for(const txt of [
 'huiya','Huiya!','Ye!', 'a ah ye yan iya yya ayyah huiya ohuiya',
 'Nican momalinaco in colcahuahtecpillotl huiya oncan',
 'ye niYohyontzin. Huiya! Ha noyol quimati, ohuay',
 'nihuia in calli', 'huiya niauh', 'ōniyah', 'nichōca',
 'noyollo huiya ma yauh', 'in colcahuahtecpillotl huīya nican milacatzoa'
]){
 const r=sentence.analyze(txt);
 assert.equal(r.poeticVocableObservations.length,0,'Do not generalize to: '+txt);
 const graph=ir.build(txt,r);
 assert.equal(graph.counts.poeticVocableContexts,0);
}
const finite=sentence.analyze('nichōca');
assert.equal(finite.complete,true,'Preserve previous indexed verb analysis');
assert.equal(finite.clauses[0].candidates[0].english[0],'I cry');
for(const mutation of [
 x=>{x.guardrails.no_global_huiya_to_vocable_rewrite=false;},
 x=>{x.guardrails.no_automatic_word_deletion=false;},
 x=>{x.separate_lexical_sense.lexeme='unknown';},
 x=>{x.observations[0].review_scope='whole_corpus';},
 x=>{x.observations[0].manuscript_image_collated=true;},
 x=>{x.observations[0].short_source_fragment='huiya';},
 x=>{x.method_source.year=2026;},
 x=>{x.observations[0].source_url='javascript:attack';},
]){
 const clone=JSON.parse(JSON.stringify(evidence));mutation(clone);
 assert.equal(make(clone).analyze(songs[0][1]).poeticVocableObservations.length,0,
  'Unsafe or unsourced evidence cannot turn into production poetry grammar');
}
const noData=make(null).analyze(songs[0][1]);
assert.equal(noData.poeticVocableObservations.length,0,'No config = no invented attestation');
const web=read('translator-integrated.js');
assert(web.includes("fetch('./research/translation_corpus/huiya_context_specific_song_vocable_2026_10_30.json'"),
 'The public browser must load the historical record rather than only the research investigator');
assert(web.includes("poeticEvidence.status==='fulfilled'?poeticEvidence.value:null"));
assert(web.includes("result.poeticVocableObservations?.length"),
 'The browser must visibly identify matched quoted song vocables');
const diagnostic=read('tools/diagnose_historical_sentences.js');
assert(diagnostic.includes("'research/translation_corpus/huiya_context_specific_song_vocable_2026_10_30.json'"));
console.log('PASS: original two sung huiya contexts enter website sentence grammar / shared IR / English refusal; standalone huiya and ye remain ambiguous; historical finite verbs unchanged.');
