// Exact source-crosschecked morphology: evidence-backed *hypotheses*, not gold.
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const review=JSON.parse(fs.readFileSync(path.join(root,'research/translation_corpus/source_reviews/ENL_BC16_1573.json'),'utf8'));
const scope={window:{},URL};
vm.runInNewContext(fs.readFileSync(path.join(root,'translator-source-morphology.js'),'utf8'),scope);
const make=scope.window.TlahtolliSourceMorphology.create;
const model=make(review),analyze=model.analyze;
assert.equal(model.sourceCount,3,'No automatic inference beyond the 3 source-spelled tokens');
const verb=analyze('ticnamaca');
assert.equal(verb.length,2,'Retain both subject-person readings, with no priority winner');
assert.deepEqual(Array.from(verb,x=>x.features.subject).sort(),['1pl','2sg']);
assert(verb.every(x=>x.lemma==='namaca'&&x.grade==='unreviewed'));
assert(verb.every(x=>x.features.object==='3sg'));
assert(verb.every(x=>x.parts.map(p=>p.surface).join('')==='ticnamaca'));
assert(verb.every(x=>x.note.includes('NOT a verified historical segmentation')));
assert(verb.every(x=>x.sources.some(u=>u.includes('nahugram.html'))));
const possessed=analyze('totlal');
assert.equal(possessed.length,1);
assert.equal(possessed[0].lemma,'tlalli');
assert.equal(possessed[0].grade,'unreviewed');
assert.equal(possessed[0].features.possessor,'1pl');
assert.deepEqual(Array.from(possessed[0].parts,p=>p.surface),['to','tlal']);
assert(possessed[0].sources.some(u=>u.includes('gdn.iib.unam.mx')));
const abbreviation=analyze('y¯');
assert.equal(abbreviation.length,1);
assert.equal(abbreviation[0].grade,'unreviewed');
assert.equal(abbreviation[0].features.expansion,'yn/in proposed, NOT source-spelled');
assert.equal(abbreviation[0].parts[0].surface,'y¯');
assert(abbreviation[0].note.includes('Bar is an abbreviation hypothesis'));
for(const token of ['ticnamacas','icnamaca','tīcnamaca','ticnamaca-h','totlalli','n0tlal','yn','in','ȳ','namaca','tlalli','loose','y¯¯','ti c namaca'])
 assert.equal(analyze(token).length,0,'Do not extrapolate a reviewed source into a new form: '+token);
// NFC/case-only matching is permitted; no macron-folding or token generation.
assert.equal(analyze('TICNAMACA').length,2);
const received=analyze('ticnamaca');received[0].features.subject='tampered';
assert.equal(analyze('ticnamaca')[0].features.subject,'1pl','Return defensive feature copies');
const invalids=[
 {train_eligible:true},
 {evaluation_eligible:true},
 {admission:'approved'},
 {knowledge_contamination:{independent_test_eligible:true}},
 {source_crosschecked_morphology:{...review.source_crosschecked_morphology,training_eligible:true}},
 {source_crosschecked_morphology:{...review.source_crosschecked_morphology,heldout_evaluation_eligible:true}},
 {source_crosschecked_morphology:{...review.source_crosschecked_morphology,reviewed_by_human_scholar:true}},
 {source_crosschecked_morphology:{...review.source_crosschecked_morphology,independent_facsimile_collation:true}},
 {source_crosschecked_morphology:{...review.source_crosschecked_morphology,excerpt:'completely different'}},
 {source_crosschecked_morphology:{...review.source_crosschecked_morphology,token_analyses:[
  {...review.source_crosschecked_morphology.token_analyses[0],parts:['ti','c','namaca-h']}] }},
 {source_crosschecked_morphology:{...review.source_crosschecked_morphology,claims:[
  {...review.source_crosschecked_morphology.claims[0],evidence:[{url:'javascript:alert(1)',basis:'bad'}]},
  ...review.source_crosschecked_morphology.claims.slice(1)]}}
];
for(const patch of invalids){
 const m=make({...review,...patch});
 assert.equal(m.sourceCount,0,'Malformed or promoted evidence must fail closed');
 assert.equal(m.analyze('ticnamaca').length,0);
}
const d=JSON.parse(fs.readFileSync(path.join(root,'dictionary.json'),'utf8'));
const paradigms=JSON.parse(fs.readFileSync(path.join(root,'paradigms.json'),'utf8'));
const win={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'translator-sentence.js'),'utf8'),win);
const sent=win.window.TlahtolliSentence.create(d,paradigms,analyze);
const phrase=sent.analyze('ticnamaca y¯ totlal');
assert.equal(phrase.complete,false,'Source research is NOT a full-sentence grammar proof');
assert.equal(phrase.clauses[0].candidates.length,0);
const clues=phrase.clauses[0].morphologicalClues;
assert.equal(clues.length,4,'Both subject alternatives + abbreviation + possessed noun');
assert.equal(clues.filter(c=>c.token==='ticnamaca').length,2);
assert(clues.some(c=>c.token==='y¯'&&c.lemma==='in'&&c.grade==='unreviewed'));
assert(clues.some(c=>c.token==='totlal'&&c.lemma==='tlalli'));
assert.equal(sent.analyze('ticnamaca').complete,false);
assert.equal(sent.analyze('totlal').complete,false);
assert.equal(sent.analyze('ticnamaca y¯ totlal extra').complete,false);
const lexScope={window:{},URL};
vm.runInNewContext(fs.readFileSync(path.join(root,'translator-engine.js'),'utf8'),lexScope);
const lex=lexScope.window.TlahtolliTranslator.create(d,{entries:[]});
const word=lex.analyze('ticnamaca y¯ totlal','nh-en');
assert.equal(word.stats.matched,0,'Research-only proposals cannot change curated lexical glosses');
assert(word.gloss.includes('[?ticnamaca]'));
assert(word.gloss.includes('[?totlal]'));
console.log('PASS source-checked morphology adapter: 4 unreviewed analyses, exact-form/no-spelling generation, 11 hostile provenance cases, 4 bounded sentence clues, no fabricated translation.');
