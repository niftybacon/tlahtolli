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
