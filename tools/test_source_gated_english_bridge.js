#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict');
const {produce}=require('./source_gated_english_bridge.js');

const supported=[
 ['nichōca','I cry.'],['nitlacua','I eat.'],
 ['niquitta in cihuātl','I see the woman.'],
 ['ahmo niquittaz in cihuātl','I will not see the woman.'],
 ['niquitta in cihuātl in chōca','I see the woman that cries.'],
 ['nichōca auh nitlacua','I cry. I eat.'],
 ['chōca in cihuātl. chōca','The woman cries. He / she / it cries.']
];
for(const [nahuatl,english] of supported){
 const got=produce(nahuatl);
 assert.equal(got.status,'candidates',nahuatl);
 assert.equal(got.canonical_draft,english,nahuatl);
 assert.equal(got.candidates[0].english,english,nahuatl);
 assert.equal(got.verified_translation,false);
 assert.equal(got.grammar_complete,true);
 assert(got.candidates.every(c=>c.source_urls.every(s=>s.startsWith('https://'))));
 assert(got.candidates.every(c=>c.grade==='grammar_source_bounded_draft_not_manuscript_translation'));
 assert.equal(new Set(got.candidates.map(c=>c.english)).size,got.candidates.length);
}
const ambiguous=produce('nichōca');
assert(ambiguous.candidates.some(c=>c.english==='I weep.'));
const unknown=[
 'asfdghjk xyzwe','xyzzy','nichōca auh xyzzy','xyzzy nichōca',
 'nichōca. xyzzy. nitlacua','nicochi in cihuātl', // person mismatch even when predicate pack is merged
 'intla nichōca; nitlacua.','nichōca?'
];
for(const text of unknown){
 const got=produce(text);
 assert.equal(got.status,'abstain',text);
 assert.equal(got.canonical_draft,null,text);
 assert.deepEqual(got.candidates,[],text);
}
assert.throws(()=>produce(''),/Text must be/);
assert.throws(()=>produce('nichōca',0),/maxCandidates/);
assert.throws(()=>produce('nichōca',100),/maxCandidates/);
assert.throws(()=>produce('nichōca\u0000'),/Text must be/);
assert.throws(()=>produce('a'.repeat(7001)),/Text must be/);
const limited=produce('niquitta in cihuātl in chōca',1);
assert.equal(limited.status,'candidates');
assert.equal(limited.candidates.length,1);
assert.equal(limited.candidates_exhaustive,false);
// Existing indexed grammar remains supported with or without the PR92 pack.
// When the pack later lands, the same bridge automatically uses it.
const predicate=produce('nicochi');
if(predicate.predicate_pack_available){
 assert.equal(predicate.canonical_draft,'I sleep.');
 assert.equal(predicate.status,'candidates');
 assert.equal(produce('ōnicoch').canonical_draft,'I slept.');
 assert.equal(produce('ahmo nimiquiz').canonical_draft,'I will not die.');
 assert.equal(produce('nicochi xyzzy').status,'abstain');
}else{
 assert.equal(predicate.status,'abstain');
}
console.log('PASS: hybrid canonical evidence bridge 7 constructed controls, alternatives, strict abstention, bounded enumeration, optional predicate pack');
