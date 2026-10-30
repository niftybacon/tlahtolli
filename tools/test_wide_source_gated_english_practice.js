#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict');
const {produce,createBatchProducer}=require('./source_gated_english_bridge.js');
const {build}=require('./export_wide_source_gated_english_practice.js');

const batch=createBatchProducer();
for(const source of [
  'nichōca','nitlacua','niquitta in cihuātl',
  'ahmo niquittaz in cihuātl','nichōca auh nitlacua','xyzzy',
  'nicochi','ōnicoch','ahmo nimiquiz'
]){
 const single=produce(source,32);
 const cached=batch(source,32);
 // Array prototypes may come from separate Node VM contexts. Compare
 // JSON representations rather than nonsemantic cross-realm prototypes.
 assert.equal(JSON.stringify(cached),JSON.stringify(single),
              'Batch grammar provider must match single-source audited bridge on '+source);
}
const {out,meta}=build();
assert(out.length>0);
assert.equal(meta.examples,out.length);
assert.equal(meta.human_reviewed,false);
assert.equal(meta.historical_gold,0);
assert.equal(meta.independent_accuracy,null);
assert.equal(meta.train_eligible_for_historical_gold,false);
assert.equal(meta.attempted,1440,'12 paradigms × 10 indexed patterns × 6 persons × 2 polarities');
assert.equal(Object.keys(meta.per_lemma).length,12);
assert(out.some(x=>x.canonical_polarity==='negative'));
assert(out.some(x=>x.canonical_polarity==='affirmative'));
assert(out.some(x=>x.canonical_pattern==='future'));
assert(out.some(x=>x.canonical_pattern==='present'));
const seen=new Set();
for(const row of out){
 assert(!seen.has(row.source),'No ambiguous or conflicting surface duplicate');
 seen.add(row.source);
 assert.equal(row.human_reviewed,false);
 assert.equal(row.historically_attested_sentence,false);
 assert.equal(row.automatically_approved_for_public_translation,false);
 assert.equal(row.training_status,'synthetic_teacher_only_not_historical_gold');
 assert.equal(row.evidence_grade,'editorial_grammar_not_independently_reviewed');
 assert.equal(row.review_status,'constructed_only_no_independent_linguistic_review');
 assert(row.source_urls.length);
 assert(row.source_urls.every(s=>s.startsWith('https://')));
 assert(row.alternative_english_count>=1);
 assert(row.work==='synthetic-lemma-'+row.lemma);
}
console.log('PASS: indexed Bronze teacher, '+out.length+
 ' source-audited examples from 1440 attempts, '+Object.keys(meta.per_canonical_pattern).length+
 ' distinct tense/mood patterns; none independently reviewed or Gold');
