// Tests evaluation integrity, not translation adequacy or grammatical accuracy.
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const mod=require('./evaluate_translation_readiness.js');
const base=path.join(__dirname,'..','research','translation_corpus');
const examples=JSON.parse(fs.readFileSync(path.join(base,'research_examples.json'),'utf8'));
const raw=fs.readFileSync(path.join(base,'pairs.csv'),'utf8');
const pairs=mod.parseCsv(raw);
const reviews=mod.loadSourceReviews();
assert.equal(reviews.length,1,'Expected one inspectable, non-gold source intake as of 2026-10-28');
const reviewedSource=reviews[0];
assert.equal(reviewedSource.source_id,'ENL-BC16-1573');
assert.equal(reviewedSource.evaluation_eligible,false);
assert.equal(reviewedSource.train_eligible,false);
assert.equal(reviewedSource.knowledge_contamination.published_translation_consulted,true);
assert.equal(reviewedSource.knowledge_contamination.independent_test_eligible,false);
assert.equal(reviewedSource.image_inspection.snippet_translation,null);
const crosscheck=reviewedSource.source_crosschecked_morphology;
assert.equal(crosscheck.excerpt,'ticnamaca y¯ totlal');
assert.equal(crosscheck.reviewed_by_human_scholar,false);
assert.equal(crosscheck.independent_facsimile_collation,false);
assert.equal(crosscheck.training_eligible,false);
assert.equal(crosscheck.heldout_evaluation_eligible,false);
assert.equal(crosscheck.claims.length,6);
assert.deepEqual(crosscheck.claims.map(x=>x.surface),['ti','c','namaca','y¯','to','tlal']);
assert(crosscheck.claims.find(x=>x.surface==='ti').functions.includes('2sg'),
 'Never silently eliminate second-person possibility from the original spelling');
assert(crosscheck.claims.find(x=>x.surface==='ti').functions.includes('1pl'));
assert(crosscheck.claims.find(x=>x.surface==='y¯').unresolved.includes('overbar'),
 'Abbreviation expansion must remain explicitly proposed');
assert(crosscheck.claims.find(x=>x.surface==='tlal').evidence.some(x=>
 x.url.includes('gdn.iib.unam.mx')&&x.basis.includes('1563')),
 'Evidence must include independent historical attestation of the possessed form');
assert(crosscheck.claims.every(x=>x.evidence.every(c=>
 c.url.startsWith('https://')&&c.basis.length>20)), 'Every claim needs an external source');
for(const patch of [
 {training_eligible:true},
 {heldout_evaluation_eligible:true},
 {independent_facsimile_collation:true},
 {reviewed_by_human_scholar:true},
 {excerpt:'normalized without provenance'},
 {claims:[{surface:'y¯',role:'Particle',confidence:'proved',functions:['yn'],
   unresolved:'none',evidence:[{url:'badurl',basis:'claimed'}]}]}
]){
 const bad={...reviewedSource,source_crosschecked_morphology:{...crosscheck,...patch}};
 assert(mod.audit([],examples,[bad]).errors.length>0,
  'Never admit altered source-evidence claims: '+JSON.stringify(patch));
}

const sourceProbe=mod.probeDevelopmentSources(reviews);
assert.equal(sourceProbe.length,1);
assert.equal(sourceProbe[0].translation_accuracy,null);
assert.equal(sourceProbe[0].abbreviation_unresolved,true);
assert(sourceProbe[0].classification.includes('NOT BLIND'));
assert(sourceProbe[0].tokenization.some(t=>t.written_token==='ticnamaca'));
assert(sourceProbe[0].tokenization.some(t=>t.written_token==='totlal'));
const scribalAbbreviation=sourceProbe[0].tokenization.find(t=>t.written_token==='y¯');
assert(scribalAbbreviation,'The original scribal overbar must survive lexical tokenization');
assert.equal(scribalAbbreviation.lookup_status,'unknown',
 'Preserving a written token is not a verified segmentation or lexical interpretation');
assert.equal(scribalAbbreviation.candidate_count,0,
 'A scribal overbar may not inherit unsupported dictionary readings');
assert(sourceProbe[0].dictionary_matches+sourceProbe[0].dictionary_unknown>=2);
assert.equal(pairs.length,0,'If actual reviewed pairs are added, update the evaluation test expectations');
const clean=mod.audit(pairs,examples,reviews);
assert.deepEqual(clean.errors,[]);
assert.equal(clean.readiness,'no_heldout_gold');
assert.equal(clean.translation_accuracy,null);
assert.equal(clean.counts.public_preview_examples,3);
const exploratory=mod.probeExamples(examples);
assert.equal(exploratory.length,3);
for(const r of exploratory){
 assert.equal(r.classification.includes('IN-SAMPLE DIAGNOSTIC ONLY'),true);
 assert.equal(r.stored_passage_match_count,0,'Never use memorized passage examples during evaluation');
 assert.equal(r.curated_matched+r.unknown,r.lexical_total);
 assert.equal(typeof r.grammar_candidate_available,'boolean');
}
assert(!Object.prototype.hasOwnProperty.call(clean,'accuracy_score'));
function record(overrides={}){
 return {
  pair_id:'independent-1',source_id:'INDEPENDENT-MANUSCRIPT-1',
  source_title:'Test-only independent manuscript',source_url:'https://example.org/manuscript',
  folio_or_segment:'f. 2r',source_date:'1570',source_region:'Central Mexico',
  nahuatl_variety:'Classical Nahuatl',original_orthography:'Ticchihua tlacatl',
  normalized_nahuatl:'ticchīhua tlācatl',translation_text:'Synthetic fixture only',
  translation_language:'English',translator_or_editor:'Editor of synthetic fixture',
  translation_source_url:'https://example.org/translation',alignment_type:'sentence',
  original_rights:'public_domain',translation_rights:'permission_documented',
  transcription_reviewed_by:'Reviewer Alpha',translation_reviewed_by:'Reviewer Beta',
  review_status:'approved',split_group:'INDEPENDENT-MANUSCRIPT-1',split:'test',
  notes:'Fabricated engineering fixture, never historical evidence',
  ...overrides
 };
}
function invalid(rows,needle){
 const result=mod.audit(rows,examples,reviews);
 assert(result.errors.some(e=>e.includes(needle)),needle+': '+result.errors.join(' | '));
 assert.equal(result.translation_accuracy,null);
}
const admitted=mod.audit([record()],examples,reviews);
assert.equal(admitted.errors.length,0);
assert.equal(admitted.readiness,'metadata_eligible_unscored');
assert.equal(admitted.counts.approved_test,1);
assert.equal(admitted.translation_accuracy,null,'Even metadata-approved pairs do NOT imply assessed quality');
invalid([record({original_rights:'unknown'})],'original_rights not cleared');
invalid([record({translation_rights:'unknown'})],'translation_rights not cleared');
invalid([record({translation_reviewed_by:'AI-only'})],'named independent human');
invalid([record({transcription_reviewed_by:'model'})],'named independent human');
invalid([record({nahuatl_variety:'Eastern Huasteca Nahuatl'})],'non-Classical variety');
invalid([record({review_status:'candidate'})],'unapproved record assigned');
invalid([record({source_id:'FC'})],'test source_id occurs in public');
invalid([record({source_id:'ENL-BC16-1573'})],'already inspected and contaminated as a development source');
assert(mod.audit(pairs,examples,[{...reviewedSource,train_eligible:true}]).errors.some(
 e=>e.includes('cannot be promoted')));
assert(mod.audit(pairs,examples,[{...reviewedSource,knowledge_contamination:{
 ...reviewedSource.knowledge_contamination,published_translation_consulted:false
}}]).errors.some(e=>e.includes('published translation')));
invalid([record({original_orthography:'iuhqujn chimalli'})],'test input overlaps public');
invalid([record({original_orthography:'Iuhqujn, CHIMALLI!'})],'test input overlaps public');
invalid([record(),record({pair_id:'second',split:'train',split_group:'other',
  original_orthography:'unique input',normalized_nahuatl:'unique normalized'})],'source_id crosses train/dev/test');
invalid([record(),record({pair_id:'second',split:'train',source_id:'OTHER',
  original_orthography:'unique input',normalized_nahuatl:'unique normalized'})],'split_group crosses train/dev/test');
invalid([record(),record({pair_id:'second',split:'train',source_id:'OTHER',split_group:'OTHER',
  original_orthography:'Ticchihua tlacatl',normalized_nahuatl:'unrelated token'})],'original surface crosses train/dev/test');
invalid([record(),record({pair_id:'independent-1'})],'missing or duplicate ID');
const csvHeader=raw.split(/\r?\n/u)[0];
const values=csvHeader.split(',').map(x=>record()[x]);
const quoted=values.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',');
// Explicitly exercise an embedded comma, escaped quote, and newline in a field.
const noteIndex=csvHeader.split(',').indexOf('notes');
values[noteIndex]='test, "quoted"\nline';
const complex=values.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',');
const parsed=mod.parseCsv('\uFEFF'+csvHeader+'\r\n'+complex+'\r\n');
assert.equal(parsed.length,1);
assert.equal(parsed[0].notes,'test, "quoted"\nline');
assert.throws(()=>mod.parseCsv(csvHeader+'\n"broken'),/Unclosed CSV/);
assert.throws(()=>mod.parseCsv(csvHeader+'\n1,2'),/columns/);
assert.equal(mod.fingerprint('īuhquīn, Chimalli!'),'iuhquin chimalli');
console.log('PASS evaluation readiness: non-blind 1573 source quarantined, no invented accuracy, 3 in-sample-only diagnostics, source-heldout and provenance gates, rights/review failures, CSV edge cases and leakage negatives.');
