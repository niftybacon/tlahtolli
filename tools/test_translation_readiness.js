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
// The former audit allowed a fake NEW source ID and a different FC folio URL.
// Reject the whole codex as previously consulted, not only the three example IDs.
invalid([record({source_id:'UNSEEN-ALIAS',split_group:'UNSEEN-ALIAS',
 source_url:'https://florentinecodex.getty.edu/en/book/9/folio/12r?foo=1#passage'})],
 'test document/work already consulted');
invalid([record({source_id:'NEW-BC16-SUBUNIT',split_group:'NEW-BC16-SUBUNIT',
 source_url:'https://enl.wired-humanities.org/bc16/elements/bc16a/001'})],
 'test document/work already consulted');
invalid([record({source_id:'NEW-BC16-IMAGE',split_group:'NEW-BC16-IMAGE',
 source_url:'https://enl.wired-humanities.org/sites/default/files/mapaImages/BC16a001.png'})],
 'test document/work already consulted');
invalid([record({source_id:'SAME-1833-BOOK',split_group:'SAME-1833-BOOK',
 source_url:'https://archive.org/details/elevangeliodeslu00pazy?view=theater'})],
 'test document/work already consulted');
// PR #53's Florentine excerpt is in data/passages.json, not the three
// research_examples.json entries. Renaming the source or extending its words
// cannot turn it into an independent held-out translation pair.
invalid([record({original_orthography:
 'preface injn itoca itech qujça xochitl, ioan tlapalli ending'})],
 'test text overlaps existing-manuscript-reading');
invalid([record({original_orthography:'ticnamaca y¯ totlal'})],
 'test text overlaps consulted-source-review');
invalid([record({source_id:'LUKE-1833-PAZ-SANCHEZ'})],
 'test source ID was already used in another development resource');
invalid([record({source_id:'FICTITIOUS-ALIAS',split_group:'FICTITIOUS-ALIAS',
 source_title:'Anales de Tlatelolco',source_url:'https://example.org/another-archive'})],
 'test work is present in inspected external parallel-pair development pointers');
invalid([record({source_id:'AXO-NCI-00235',split_group:'FAKE-OTHER-WORK',
 source_title:'Made-up different title'})],
 'test source ID was already used in another development resource');
// Newly located short paired anchors from five different historical works
// are independent of the six Axolotl titles, but NOT blind after inspection.
const enl=mod.loadInspectedEnlPointers();
assert.equal(enl.rows.length,7,'Seven SHORT source-linked pairs, not gold sentences');
assert.equal(new Set(enl.rows.map(r=>r.source_id)).size,5);
assert.equal(new Set(enl.rows.map(r=>r.url)).size,7);
assert(enl.rows.every(r=>r.gold_translation===false&&
 r.train_eligible===false&&r.independent_evaluation_eligible===false));
assert(enl.rows.every(r=>r.url.startsWith('https://enl.wired-humanities.org/')));
assert.equal(mod.audit(pairs,examples,reviews).counts.approved_test,0);
for(const row of enl.rows){
 invalid([record({source_id:row.source_id,split_group:'counterfeit-'+row.id,
   source_url:'https://example.org/different-folder'})],
 'test source ID was already used in another development resource');
 invalid([record({source_id:'RENAMED-'+row.id,split_group:'RENAMED-'+row.id,
   source_url:row.url})],'test document/work already consulted');
}
// A different page of the SAME land-sale/will must not be misreported unseen.
for(const url of [
 'https://enl.wired-humanities.org/bc17/elements/bc17d/000',
 'https://enl.wired-humanities.org/bc03/elements/bc03b/000',
 'https://enl.wired-humanities.org/1607hask/elements/1607hask423v/000'
]){
 invalid([record({source_id:'FRESH-ALIAS',split_group:'FRESH-GROUP',
  source_url:url})],'test document/work already consulted');
}
assert.notEqual(mod.sourceWorkKey('https://enl.wired-humanities.org/bc17/elements/bc17e/000'),
 mod.sourceWorkKey('https://enl.wired-humanities.org/bc16/elements/bc16a/000'));
assert.equal(mod.sourceWorkKey('https://enl.wired-humanities.org/bc17/elements/bc17b/000'),
 mod.sourceWorkKey('https://enl.wired-humanities.org/bc17/elements/bc17e/000'));
assert.equal(mod.sourceWorkKey('https://enl.wired-humanities.org/1559hask/elements/1559hask99r/000'),
 mod.sourceWorkKey('https://enl.wired-humanities.org/1559hask/elements/1559hask98v/000'));
// Different manuscripts at the same ENL host must never be conflated.
assert.notEqual(mod.sourceWorkKey('https://enl.wired-humanities.org/bc16/elements/bc16a/001'),
 mod.sourceWorkKey('https://enl.wired-humanities.org/bc16/elements/bc16b/001'));
assert.equal(mod.sourceWorkKey('https://florentinecodex.getty.edu/es/book/11/folio/209v'),
 mod.sourceWorkKey('https://florentinecodex.getty.edu/book/4/folio/80r'));
assert.equal(mod.sourceWorkKey('https://example.org/document?v=1#x'),
 mod.sourceWorkKey('https://example.org/document?v=2#y'));
invalid([record({source_url:'https://example.org/unseen-work',split_group:'group-A'}),
 record({pair_id:'second',source_id:'OTHER',split_group:'group-B',
  source_url:'https://example.org/unseen-work?alias=2',split:'train',
  original_orthography:'different unrelated text',normalized_nahuatl:'also different'})],
 'source work crosses train/dev/test');
// An unrelated new source with independently reviewed metadata remains
// metadata-eligible, but never automatically receives an accuracy score.
assert.equal(mod.audit([record({source_url:'https://example.org/other-manuscript'})],
 examples,reviews).readiness,'metadata_eligible_unscored');
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
console.log('PASS evaluation readiness: non-blind 1573 source quarantined, no invented accuracy, 3 in-sample-only diagnostics, document-wide held-out quarantine including new ENL parallel source anchors, passage-window overlap, URL alias and provenance gates, rights/review failures, CSV edge cases and leakage negatives.');
