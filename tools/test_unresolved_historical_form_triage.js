'use strict';
/* No training on guessed morphological/string matches; source-only triage. */
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const cp=require('node:child_process');
const ROOT=path.resolve(__dirname,'..');
const {buildTriage,distanceAtMostOne,resemblanceLeads,orthographicAndAffixHints}=
 require('./triage_unresolved_historical_forms.js');
const data=fs.mkdtempSync(path.join(os.tmpdir(),'tentli-unresolved-triage-'));
try{
 const source=path.join(data,'source.json'),bridge=path.join(data,'bridge.json');
 cp.execFileSync('python',['-m','neural.paged_historical_investigator','--all',
  '--output',source],{cwd:ROOT,timeout:150000,encoding:'utf8'});
 cp.execFileSync('node',['tools/investigator_engine_bridge.js','--input',source,
  '--output',bridge],{cwd:ROOT,timeout:150000,encoding:'utf8'});
 const original=JSON.parse(fs.readFileSync(source,'utf8'));
 const current=JSON.parse(fs.readFileSync(bridge,'utf8'));
 const result=buildTriage(original,current);
 assert.equal(result.format,'tentli-unresolved-historical-form-triage-v1');
 assert.equal(result.unresolved_engine_miss_count,928);
 assert.equal(result.unresolved_forms.length,928);
 assert.equal(result.investigated_all_unresolved_not_translated,true);
 assert.equal(result.requires_human_for_every_form,false);
 assert.equal(result.no_model_training,true);
 assert.equal(result.no_new_dictionary_approvals,true);
 assert.equal(result.no_new_morphological_rules,true);
 assert.equal(result.english_translation_accuracy,null);
 assert.equal(result.untouched_gold_review_count,0);
 assert.equal(result.no_silver_or_gold_promotions,true);
 assert(result.source_checked_comparison_anchors>20);
 assert.equal(result.new_individually_source_indexed_high_frequency_leads,5);
 for(const form of ['yehuan','tepilhuan','noyollo','ipalnemohua','huiya']){
  const row=result.unresolved_forms.find(x=>x.written_surface===form);
  assert(row&&row.independent_dictionary_context_lead&&
   row.independent_dictionary_context_lead.exact_stanza_meaning_verified===false&&
   row.independent_dictionary_context_lead.source_based_dictionary_lemma_promotion===false);
 }
 for(const form of ['yehuan','tepilhuan','noyollo','ipalnemohua'])
  assert(!result.review_queue.some(x=>x.written_surface===form),
   form+' has independently located historical dictionary leads, not a new routine human task');
 assert(result.review_queue.some(x=>x.written_surface==='huiya'&&
  x.independent_external_dictionary_lead.director_attention_warranted===true),
  'Conflicting verbal vs poetic huiya requires optional genuine context discussion');
 assert(result.prioritized_new_human_questions_count<=12);
 assert(result.prioritized_new_human_questions_count>0);
 assert.equal(result.unresolved_forms.filter(x=>x.gold||x.silver_approved||x.training_eligible).length,0);
 assert.equal(result.unresolved_forms.filter(x=>x.grammatical_segmentation_newly_verified).length,0);
 assert.equal(result.unresolved_forms.filter(x=>x.original_clause_translation_verified).length,0);
 assert(result.unresolved_forms.every(x=>x.historical_edition_examples.every(e=>
  !/-(?:xxv|xxvi|xxvii)$/.test(e.work_id)&&
  e.short_context_not_independent_translation===true&&
  typeof e.original_language_short_context==='string'&&
  e.original_language_short_context.length>0&&
  e.original_language_short_context.length<=200)));
 assert(result.unresolved_forms.every(x=>x.source_checked_similar_lemma_leads_not_equivalent.every(e=>
  e.historical_spelling_equivalence_verified===false&&
  e.grammatical_derivation_verified===false&&e.source_url.startsWith('https://'))));
 const distinct=new Set(result.unresolved_forms.map(x=>x.written_surface));
 assert.equal(distinct.size,928);
 const rawUnresolved=new Set(current.token_engine_diagnostics.filter(x=>
  x.analysis_route==='no_linked_engine_surface_match').map(x=>x.written_surface));
 assert.equal(rawUnresolved.size,928);
 assert([...distinct].every(x=>rawUnresolved.has(x)));
 assert(result.review_queue.every(q=>!q.question_to_human_required&&q.reviewer_can_defer&&
  q.no_gold_or_silver_promoted===true&&!['zanio','ohuaya','zan','ye','ya'].includes(q.written_surface)));
 const list=result.review_queue.map(q=>q.written_surface);
 assert.equal(new Set(list).size,list.length);
 assert(result.already_investigated_poetic_or_director_cases_not_requeued>=0);
 assert(result.nonexclusive_lead_counts.no_specific_lexical_or_morphology_lead>=0);
 assert(result.nonexclusive_lead_counts.recurrent_across_same_edition_poem_units>=0);
 assert.equal(distanceAtMostOne('zaniyo','zanio'),1);
 assert.equal(distanceAtMostOne('xochitl','xochitl'),0);
 assert.equal(distanceAtMostOne('xochitl','completelydifferent'),2);
 assert(orthographicAndAffixHints('nimitzca').includes('initial_string_could_require_morpheme_boundary_review'));
 assert(!orthographicAndAffixHints('atl').length);
 // Prior research, project director attestations and dictionary strings MUST
 // never be automatically enrolled for another human question.
 for(const entry of result.review_queue){
  const sourceRow=result.unresolved_forms.find(x=>x.written_surface===entry.written_surface);
  assert(sourceRow&&!sourceRow.prior_source_research&&!sourceRow.director_feedback_previously_recorded);
 }
 for(const mutator of [
  x=>{x.evidence_fingerprints.canonical_lexicon='0'.repeat(64)},
  x=>{x.investigations[0].gold=true},
  x=>{x.investigations[0].written_surface='inventedform'},
 ]){
  const bad=JSON.parse(JSON.stringify(original));mutator(bad);
  assert.throws(()=>buildTriage(bad,current),/Reject|Invalid/i);
 }
 const wrong=JSON.parse(JSON.stringify(current));wrong.count_by_actual_existing_engine_route.no_linked_engine_surface_match=927;
 assert.throws(()=>buildTriage(original,wrong),/928/i);
 const injected=JSON.parse(JSON.stringify(current));
 const badRow=injected.token_engine_diagnostics.find(x=>x.analysis_route==='no_linked_engine_surface_match');
 badRow.advanced_browser_morphology_candidates=[{lemma:'madeup'}];
 assert.throws(()=>buildTriage(original,injected),/contradicts/i);
 assert.throws(()=>buildTriage(original,current,{maxHuman:0}),/bounded/i);
 assert.equal(JSON.stringify(result),JSON.stringify(buildTriage(original,current)),'Deterministic output required');
 const out=path.join(data,'triage.json');
 const message=cp.execFileSync('node',['tools/triage_unresolved_historical_forms.js',
  '--source',source,'--bridge',bridge,'--output',out],
  {cwd:ROOT,encoding:'utf8',timeout:120000});
 assert.equal(JSON.stringify(JSON.parse(fs.readFileSync(out,'utf8'))),JSON.stringify(result));
 console.log('PASS 928 complete forms, no duplicate review work, no invented morphology or gold.');
 console.log('RESEARCH SUMMARY '+JSON.stringify(result.nonexclusive_lead_counts));
 console.log('REVIEW QUEUE '+JSON.stringify(result.review_queue.slice(0,8)));
}finally{fs.rmSync(data,{recursive:true,force:true});}
