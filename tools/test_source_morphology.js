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
// Two exact historically INDEXED LEXICAL written forms: no agreement,
 // productive morphology, inferred English sense or original-text reading.
const lexicalPack=JSON.parse(fs.readFileSync(path.join(root,
 'research/translation_corpus/exact_source_lexical_surface_leads_2026_10_30.json'),'utf8'));
const cited=make(review,lexicalPack);
assert.equal(cited.sourceCount,3,'Existing morphology must remain unchanged');
assert.equal(cited.exactLexicalFormCount,2);
for(const [form,lemma,url] of [
 ['yehuan','yehuantin','https://nahuatl.wired-humanities.org/content/yehuantin'],
 ['tepilhuan','tepilhuan','https://nahuatl.wired-humanities.org/node/188794']
]){
 const observed=cited.analyze(form);
 assert.equal(observed.length,1,form);
 const m=observed[0];
 assert.equal(m.lemma,lemma);
 assert.equal(m.kind,'Source-indexed exact lexical written form (NOT morphology)');
 assert.equal(m.grade,'unreviewed');
 assert.equal(m.score,0);
 assert.equal(m.parts.length,1);
 assert.equal(m.parts[0].surface,form);
 assert.equal(m.source,url);
 assert.equal(m.features.grammarRole,'unresolved');
 assert.equal(m.features.referent,'unresolved');
 assert.equal(m.features.morphologicalSegmentation,'not-verified');
 assert(m.note.includes('No new canonical lemma'));
 assert(m.note.includes('English'));
 assert(m.sources.length===2);
}
for(const fake of [
 'yeuan','yehuantin','yehuāntin','yēhuan','yehuān','yehuan Dios',
 'tepīlhuan','tepilhuān','tepiltzin','tepilhuantzin','nitepilhuan',
 'huiya','ohuaya','noyollo','ipalnemohua'
])assert.equal(cited.analyze(fake).length,0,
 'Evidence never licenses variant spelling, poetic gloss or productive form: '+fake);
const ye=cited.analyze('YEHUAN')[0];assert.equal(ye.lemma,'yehuantin');
ye.features.referent='forged';
assert.equal(cited.analyze('yehuan')[0].features.referent,'unresolved');
const corrupt=[
 p=>{p.train_eligible=true},
 p=>{p.gold_approved=true},
 p=>{p.silver_approved=true},
 p=>{p.human_source_review_independently_authenticated=true},
 p=>{p.facsimile_collation_independently_done=true},
 p=>{p.new_canonical_dictionary_headwords=2},
 p=>{p.records[0].written_form='yeuan'},
 p=>{p.records[0].lexicographic_lemma='Dios'},
 p=>{p.records[0].source_url='https://example.org/fake'},
 p=>{p.records[0].grammatical_role_verified=true},
 p=>{p.records[0].lemma_meaning_newly_approved=true},
 p=>{p.records[0].stanza_translation_verified=true},
 p=>{p.records[1].morphological_segmentation_verified=true},
 p=>{p.records[1].source_locator='invented'},
 p=>{p.records[1].corroborating_source_url='javascript:forged'},
 p=>{p.records.push({...p.records[1],id:'fabricated'})}
];
for(const mut of corrupt){
 const copy=JSON.parse(JSON.stringify(lexicalPack));mut(copy);
 const blocked=make(review,copy);
 assert.equal(blocked.exactLexicalFormCount,0,
  'All lexical source proposals must fail closed if any item or policy is forged');
 assert.equal(blocked.analyze('yehuan').length,0);
 assert.equal(blocked.analyze('tepilhuan').length,0);
 assert.equal(blocked.analyze('ticnamaca').length,2,
  'Invalid optional lexical leads must not break original ENL morphological evidence');
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
// One unranked source-backed finite verb + one fully consumed NP. This
// intentionally does NOT create a complete/English sentence candidate.
const sample=phrase.clauses[0];
assert.equal(sample.agreementProposals.length,2,'Must preserve BOTH ti- persons');
assert.deepEqual(Array.from(sample.agreementProposals,p=>p.verb.subject).sort(),['1pl','2sg']);
for(const proposal of sample.agreementProposals){
 assert.equal(proposal.grade,'source-backed agreement proposal (unverified; NOT a sentence translation)');
 assert.equal(proposal.coverage,3,'Every source-spelled token must be consumed');
 assert.equal(proposal.verb.object,'3sg');
 assert.equal(proposal.nounPhrase.lemma,'tlalli');
 assert.equal(proposal.nounPhrase.possessor,'1pl');
 assert.equal(proposal.nounPhrase.marker,'y¯');
 assert.match(proposal.nounPhrase.markerStatus,/HYPOTHESIS/);
 assert.equal(proposal.agreement.nominalRole,'possible direct object');
 assert(proposal.sources.some(url=>url.includes('gdn.iib.unam.mx')),'The noun form must carry independent 1563 evidence');
 assert(proposal.sources.some(url=>url.includes('nahugram.html')),'The agreement must cite historical grammar');
 assert.match(proposal.note,/does NOT independently settle verb subject/);
}
for(const text of [
 'ticnamaca totlal','totlal ticnamaca','y¯ totlal ticnamaca',
 'ticnamaca in totlal','in totlal ticnamaca',
 'ticnamaca in cihuātl','in cihuātl ticnamaca'
]){
 const result=sent.analyze(text);
 assert.equal(result.complete,false,'No complete translation for source-linked proposal: '+text);
 assert.equal(result.clauses[0].candidates.length,0);
 assert.deepEqual(Array.from(result.clauses[0].agreementProposals,p=>p.verb.subject).sort(),['1pl','2sg'],text);
 if(text.includes('cihuātl'))assert(result.clauses[0].agreementProposals.every(p=>
  p.nounPhrase.lemma==='cihuātl'&&p.nounPhrase.kind==='unique curated noun headword'));
}
for(const text of [
 'ticnamaca in unknown','ticnamaca cihuātl','ticnamaca y¯ totlal extra',
 'ticnamaca y¯ totlal in conetl','ticnamaca in cihuātl in conetl',
 'ticnamaca in caltin','ticnamacas y¯ totlal','ticnamaca yn totlal',
 'ticnamaca y¯ totlalli','ticnamaca y¯','ticnamaca totlal totlal',
 'in ticnamaca cihuātl','ahmo ticnamaca y¯ totlal','ahmo ticnamaca in cihuātl',
 'ticnamaca, y¯ totlal','ticnamaca ticnamaca totlal'
]){
 const result=sent.analyze(text);
 assert.equal(result.complete,false,text);
 assert.equal(result.clauses[0].agreementProposals?.length||0,0,'Refuse unsupported NP/agreement: '+text);
}
const incompatible=sent=>sent.analyze('ticnamaca y¯ totlal').clauses[0].agreementProposals;
for(const patch of [
 {grade:'hypothesis'},
 {kind:'Productive transitive parse'},
 {features:{category:'verb',subject:'1pl',object:'3pl'}},
 {features:{category:'verb',subject:'3sg',object:'3sg'}},
 {sources:[]},
 {parts:[{surface:'unrecorded',role:'fake'}]},
]){
 const alteredToken={...analyze('ticnamaca')[0],...patch};
 const strictModel=win.window.TlahtolliSentence.create(d,paradigms,token=>
  token==='ticnamaca'?[alteredToken]:analyze(token));
 assert.equal(incompatible(strictModel).length,0,'Do not trust mismatched morphology: '+JSON.stringify(patch));
}
const ambiguousNounModel=win.window.TlahtolliSentence.create(d,paradigms,token=>
 token==='totlal'?[...analyze(token),...analyze(token)]:analyze(token));
assert.equal(incompatible(ambiguousNounModel).length,0,'Duplicate noun parses must not imply a single NP');
assert.equal(sent.analyze('ticnamaca').complete,false);
assert.equal(sent.analyze('totlal').complete,false);
assert.equal(sent.analyze('ticnamaca y¯ totlal extra').complete,false);
const lexScope={window:{},URL};
vm.runInNewContext(fs.readFileSync(path.join(root,'translator-engine.js'),'utf8'),lexScope);
const lex=lexScope.window.TlahtolliTranslator.create(d,{entries:[]});
assert.equal(lex.analyze('yehuan tepilhuan').stats.matched,0,
 'Two external source leads cannot be counted as approved curated headwords');
const sentenceSource=win.window.TlahtolliSentence.create(d,paradigms,t=>cited.analyze(t));
for(const example of ['yehuan Dios','tepilhuan','yehuan in tepilhuan']){
 const analysis=sentenceSource.analyze(example);
 assert.equal(analysis.complete,false,'Unreviewed source lexical evidence cannot certify a sentence');
 assert.equal(analysis.clauses[0].candidates.length,0);
 const original=(example.match(/yehuan|tepilhuan/gu)||[]);
 assert(original.some(t=>analysis.clauses[0].morphologicalClues.some(p=>p.token===t&&p.grade==='unreviewed')),
  'Existing sentence analyzer must expose exact source-graded clues');
}

const word=lex.analyze('ticnamaca y¯ totlal','nh-en');
assert.equal(word.stats.matched,0,'Research-only proposals cannot change curated lexical glosses');
assert(word.gloss.includes('[?ticnamaca]'));
assert(word.gloss.includes('[?totlal]'));
console.log('PASS source-checked morphology adapter: 4 unreviewed analyses, exact-form/no-spelling generation, 11 hostile provenance cases, 4 bounded sentence clues, no fabricated translation.');
