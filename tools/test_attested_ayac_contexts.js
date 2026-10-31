'use strict';
/* Cross-document source research regression. No new productive grammar rule. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const evidence=JSON.parse(read('research/translation_corpus/attested_ayac_speech_contexts_2026_10_30.json'));
const diagnostic=require('./diagnose_historical_sentences.js');
assert.equal(evidence.format,'tentli-cross-document-negative-speech-research-v1');
assert.equal(evidence.witnesses.length,2);
assert.equal(new Set(evidence.witnesses.map(w=>w.work_id)).size,2);
assert.equal(evidence.shared_exact_surface,'ayac tle quitoz');
assert.equal(evidence.guardrails.approved_gold,0);
assert.equal(evidence.guardrails.approved_silver,0);
for(const [name,v] of Object.entries(evidence.guardrails)){
 if(name.startsWith('no_'))assert.equal(v,true,name);
}
const models=diagnostic.loadModels();
const results=[];
for(const witness of evidence.witnesses){
 const input=witness.short_excerpt;
 assert(input.includes(evidence.shared_exact_surface),'Exact historical witness');
 assert(witness.source_url.startsWith('https://'));
 assert(input.split(/\s+/u).length>=5,'No isolated three-word semantic overreach');
 const a=diagnostic.analyzeText(input,models);
 assert.equal(a.englishDraftAvailable,false,'No historical English may be invented for '+witness.id);
 assert.equal(a.fullFiniteClauseAnalysis,false,'Complete context is not grammatically resolved');
 assert(a.tokenCount>=5,'Account for written words');
 results.push({id:witness.id,tokens:a.tokenCount,matched:a.headwordMatched,unknown:a.unknownHeadwordTokens});
}
for(const bad of ['ayac tle quitoz','aiaac tle quitoz','ayāc tle quitoz','ayac tlen quitoz','ayac tle quitos']){
 assert(!evidence.witnesses.some(w=>w.short_excerpt===bad),
  'Do not treat near-forms or isolated core as source-licensed full clauses');
}
assert.equal(diagnostic.analyzeText('nichōca',models).englishDraftAvailable,true,
 'Existing English-positive finite control must remain functional');
console.log(JSON.stringify({status:'PASS: two historical clause-context audits; no unlicensed English',results}));
