'use strict';
/* No training on guessed morphological/string matches; source-only triage. */
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const cp=require('node:child_process');
const ROOT=path.resolve(__dirname,'..');
const {buildTriage,distanceAtMostOne,resemblanceLeads,orthographicAndAffixHints}=
 require('./triage_unresolved_historical_forms.js');
const {buildDossiers,validateContextContrasts}=require('./build_phase6_historical_dossiers.js');
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
 // Newly source-indexed contrasts remain unresolved; corruptions cannot
 // impersonate independent evaluation, historical folio review or grammar.
 const contextLeads=JSON.parse(fs.readFileSync(path.join(ROOT,
  'research/translation_corpus/phase6_contextual_contrast_leads_2026_10_30.json'),'utf8'));
 const index=validateContextContrasts(contextLeads,result);
 assert.deepEqual(new Set(index.keys()),new Set(['yehua','antepilhuan','huel']));
 const directorAnte=index.get('antepilhuan').project_director_contextual_assessment;
 assert.deepEqual(directorAnte.proposed_segmentation,['an-','te-','pil-','-huan']);
 assert.equal(directorAnte.person,'second-person plural');
 assert.equal(directorAnte.contextual_english,'O you princes');
 assert.deepEqual(directorAnte.sense_family,['children','nobles','princes']);
 assert.equal(directorAnte.no_global_grammar_promotion,true);
 assert.equal(directorAnte.independently_reviewed,false);
 assert.equal(directorAnte.do_not_reask_without_new_evidence,true);

 for(const row of contextLeads.cases){
  const orig=result.unresolved_forms.find(x=>x.written_surface===row.written_surface);
  assert(orig&&orig.original_clause_translation_verified===false);
  assert(row.historical_dictionary_contrasts.every(e=>
   e.independent_original_clausal_interpretation===false));
  assert(row.other_exact_original_document_contexts.every(e=>
   e.original_transcription_not_folio_image_collated&&e.existing_editorial_translation_not_gold));
 }
 const cloneContext=x=>JSON.parse(JSON.stringify(x));
 for(const tamper of [
  d=>{d.independent_gold=1},
  d=>{d.negative_guards.no_automatic_english=false},
  d=>{d.cases[0].pinned_brinton_original_excerpt='yehua invented exact colonial text'},
  d=>{d.cases[0].historical_dictionary_contrasts[0].url='https://example.org/unsupported-sense'},
  d=>{d.cases[1].other_exact_original_document_contexts[0].original_transcription_not_folio_image_collated=false},
  d=>{d.cases[2].historical_dictionary_contrasts[0].independent_original_clausal_interpretation=true},
  d=>{d.cases[2].pinned_brinton_work_id='brinton-1890-poetry-xxvi'},
  d=>{d.cases[1].written_surface='tepilhuan'},
  d=>{d.cases[1].project_director_contextual_assessment.independently_reviewed=true},
  d=>{d.cases[1].project_director_contextual_assessment.no_global_grammar_promotion=false},
  d=>{d.cases[1].project_director_contextual_assessment.review_scope='every historical poem'},
  d=>{d.cases[1].project_director_contextual_assessment.proposed_segmentation=['tepilhuan']},

 ]){
  const changed=cloneContext(contextLeads);tamper(changed);
  assert.throws(()=>validateContextContrasts(changed,result),/Reject/i);
 }
 // Historical complete-passage development controls: use only Brinton
 // research-train originals, never human-reviewed Gold or invented English.
 // Reuse the EXISTING canonical source-gated English bridge; this is NOT
 // a separate translation engine or a morphology-derived answer key.
 const originalStanzas=fs.readFileSync(path.join(ROOT,
  'research/neural_training/brinton_1890_poetry_weak_en.jsonl'),'utf8')
  .split(/\r?\n/u).filter(Boolean).map(x=>JSON.parse(x));
 const byOriginalStanza=new Map(originalStanzas.map(x=>[x.record_id,x]));
 const uniqueIds=new Set(contextLeads.cases.map(x=>x.pinned_brinton_record_id));
 assert.equal(uniqueIds.size,2,'The three contrast forms occur in two pinned Brinton research stanzas');
 const makeEnglish=require('./source_gated_english_bridge.js').createBatchProducer();
 for(const recordId of uniqueIds){
  const originalRow=byOriginalStanza.get(recordId);
  assert(originalRow&&originalRow.split==='train'&&originalRow.translation?.alignment==='candidate');
  const inspected=makeEnglish(originalRow.original);
  assert.equal(inspected.status,'abstain',
   'Unsupported complete original stanza must not be passed as semantically approved: '+recordId);
  assert.equal(inspected.verified_translation,false);
  assert.deepEqual(inspected.candidates,[]);
 }
 const packet=buildDossiers(result,80);
 assert.equal(packet.format,'tentli-phase6-source-locked-gap-dossiers-v1');
 assert.equal(packet.source_engine_gap_count,926);
 assert(packet.candidate_count>=80,'Historical source evidence should supply a significant recurring case pool');
 assert.equal(packet.prepared_dossier_count,80,'Phase 6 target is 80 real written surfaces, not 80 verified meanings');
 assert.equal(packet.contextual_contrast_source_pack_sha256.length,64);
 assert.equal(packet.source_indexed_context_contrasts_without_grammatical_approval,3);
 assert(packet.contextual_contrasts_in_selected_dossiers>=1);
 assert.equal(packet.dictionary_context_lead_is_not_sentence_translation,true);
 for(const item of packet.cases){
  const c=item.source_indexed_context_contrast_not_approved;
  if(!c)continue;
  assert(index.has(item.written_surface));
  assert.deepEqual(c,index.get(item.written_surface));
  assert.equal(c.historical_dictionary_contrasts.every(x=>
   x.independent_original_clausal_interpretation===false),true);
 }
 assert.equal(packet.cases.length,80);
 const wholeSignalCounts=packet.diagnostic_signals_in_all_unmatched_forms_counted_with_overlap;
 const selectedSignalCounts=packet.diagnostic_signals_in_selected_dossiers_counted_with_overlap;
 assert.equal(Object.keys(wholeSignalCounts).length,7);
 assert.deepEqual(Object.keys(wholeSignalCounts),Object.keys(selectedSignalCounts));
 assert(Object.values(wholeSignalCounts).every(n=>Number.isInteger(n)&&n>=0&&n<=926));
 assert(Object.values(selectedSignalCounts).every(n=>Number.isInteger(n)&&n>=0&&n<=80));
 assert.equal(packet.diagnostic_groups_are_not_independently_verified_grammatical_errors,true);
 assert.equal(wholeSignalCounts['unreviewed-source-indexed-lexical-sense'],3);
 assert.equal(selectedSignalCounts['unreviewed-source-indexed-lexical-sense'],3);
 assert(wholeSignalCounts['recurrence-only-within-one-printed-Brinton-edition']>0);
 assert(wholeSignalCounts['possible-morpheme-boundary-not-established']>0);
 assert.equal(new Set(packet.cases.map(x=>x.written_surface)).size,80);
 assert.deepEqual(new Set(packet.cases.filter(x=>x.independent_historical_dictionary_lead)
  .map(x=>x.written_surface)),new Set(['noyollo','ipalnemohua','huiya']));
 for(const row of packet.cases){
  const origin=result.unresolved_forms.find(x=>x.written_surface===row.written_surface);
  assert(origin,'Every packet must come from actual 926 current exact-engine misses');
  assert.equal(row.new_verified_meaning,null);
  assert.equal(row.grammatical_failure_type_independently_verified,false);
  assert.equal(row.whole_clause_role_and_negation_scope_still_require_evidence,true);
  assert(row.overlapping_diagnostic_review_signals.length>=1);
  assert(row.overlapping_diagnostic_review_signals.every(s=>
   s.is_grammatical_diagnosis===false&&s.independently_reviewed===false));
  assert.equal(row.review_source_independence.brinton_is_one_editorial_collection_not_independent_manuscript_witnesses,true);
  assert.equal(row.review_source_independence.other_documents_are_source_register_leads_not_verified_independent_witnesses,true);
  assert.equal(row.review_source_independence.independently_collated_original_manuscript_witnesses_in_this_batch,0);
  assert.equal(row.review_source_independence.contextually_approved_english_alignments_in_this_batch,0);
  assert.equal(row.review_source_independence.brinton_distinct_poem_units_same_printed_edition,row.same_edition_distinct_poem_units);
  assert.equal(row.approved_dictionary_rule,false);
  assert.equal(row.train_eligible,false);
  assert.equal(row.silver_approved,false);
  assert.equal(row.gold,false);
  assert.equal(row.original_form_not_a_lemma,true);
  assert.equal(row.same_edition_is_not_independent_manuscript_confirmation,true);
  assert(row.original_edition_examples.every(e=>
   e.complete_stanza_english_reviewed===false&&
   e.manuscript_image_independently_collated===false&&
   e.source_url.startsWith('https://')&&
   !/-(?:xxv|xxvi|xxvii)$/u.test(e.work_id)));
 }
 assert.equal(packet.verified_contextual_translations_added,0);
 assert.equal(packet.canonical_grammar_rules_added,0);
 assert.equal(packet.new_human_approved_gold,0);
 assert.equal(packet.new_human_approved_silver,0);
 assert.equal(packet.model_updates,0);
 const songCase=packet.cases.find(x=>x.written_surface==='huiya');
 assert(songCase&&songCase.overlapping_diagnostic_review_signals.some(s=>
  s.potential_failure_or_evidence_signal==='unreviewed-source-indexed-lexical-sense')&&
  songCase.overlapping_diagnostic_review_signals.some(s=>
   s.potential_failure_or_evidence_signal==='poetic-vocable-or-particle-context-needs-disambiguation')&&
  songCase.previous_historical_context_notes.length===2&&
   songCase.previous_historical_context_notes.every(x=>x.not_a_general_word_sense));
 assert.equal(JSON.stringify(packet),JSON.stringify(buildDossiers(result,80)),
   'Fixed source fingerprints and evidence must produce deterministic dossier order');
 assert.throws(()=>buildDossiers(result,101),/bounded/i);
 for(const mutation of [
  x=>{x.no_model_training=false},
  x=>{x.unresolved_forms[0].gold=true},
  x=>{x.unresolved_forms[0].training_eligible=true},
  x=>{x.unresolved_forms[0].written_surface='invented$urface'},
  x=>{x.unresolved_forms[0].source_checked_similar_lemma_leads_not_equivalent.push({
   source_url:'https://example.org/fake',historical_spelling_equivalence_verified:true,grammatical_derivation_verified:false
  })},
  x=>{x.unresolved_forms[0].historical_document_context_leads.push({
   source_url:'https://example.org/fake',original_work_id:'fabricated',
   source_grade:'expert_reviewed_whole_clause',context_id:'fiction'
  })},
  x=>{x.unresolved_forms[0].research_priority_not_translation_confidence=Infinity},
  x=>{x.unresolved_forms[0].historical_edition_examples[0].printed_historical_source_url='http://unverified.test/'},
  x=>{x.unresolved_forms[0].independent_dictionary_context_lead=
   {source_url:'http://unverified.test/',exact_stanza_meaning_verified:true,
    source_based_dictionary_lemma_promotion:true}},
 ]){
  const bad=JSON.parse(JSON.stringify(result));
  mutation(bad);
  assert.throws(()=>buildDossiers(bad),/Reject/i);
 }
 const dossierFile=path.join(data,'dossiers.json');
 cp.execFileSync('node',['tools/build_phase6_historical_dossiers.js','--source',source,
  '--bridge',bridge,'--output',dossierFile,'--limit','80'],
  {cwd:ROOT,encoding:'utf8',timeout:120000});
 assert.deepEqual(JSON.parse(fs.readFileSync(dossierFile,'utf8')),packet);
 console.log('PASS Phase 6: 80 source-locked dossiers, three independently indexed unapproved contextual contrast leads, tampering refusals and no Gold.');
 assert.equal(result.unresolved_engine_miss_count,926);
 assert.equal(result.unresolved_forms.length,926);
 assert.equal(result.investigated_all_unresolved_not_translated,true);
 assert.equal(result.requires_human_for_every_form,false);
 assert.equal(result.no_model_training,true);
 assert.equal(result.no_new_dictionary_approvals,true);
 assert.equal(result.no_new_morphological_rules,true);
 assert.equal(result.english_translation_accuracy,null);
 assert.equal(result.untouched_gold_review_count,0);
 assert.equal(result.no_silver_or_gold_promotions,true);
 assert(result.source_checked_comparison_anchors>20);
 assert.equal(result.new_individually_source_indexed_high_frequency_leads,3);
 for(const form of ['noyollo','ipalnemohua','huiya']){
  const row=result.unresolved_forms.find(x=>x.written_surface===form);
  assert(row&&row.independent_dictionary_context_lead&&
   row.independent_dictionary_context_lead.exact_stanza_meaning_verified===false&&
   row.independent_dictionary_context_lead.source_based_dictionary_lemma_promotion===false);
 }
 for(const form of ['yehuan','tepilhuan','noyollo','ipalnemohua'])
  assert(!result.review_queue.some(x=>x.written_surface===form),
   form+' has independently located historical dictionary leads, not a new routine human task');
 assert.equal(result.previously_asked_huiya_song_contexts_recorded_not_universally_resolved,1);
 const huiya=result.unresolved_forms.find(x=>x.written_surface==='huiya');
 assert(huiya,'huiya must remain an unresolved general form, even with two context reviews');
 assert.equal(huiya.triage_route,'two_song_occurrences_are_context_reviewed_other_uses_pending');
 assert.equal(huiya.context_specific_poetic_occurrence_reviews.length,2);
 assert.equal(huiya.is_all_occurrences_adjudicated,false);
 assert(huiya.context_specific_poetic_occurrence_reviews.every(x=>
  x.not_a_general_word_sense===true&&x.verbal_homograph_still_available===true&&
  x.review_scope==='this_occurrence_only'&&x.manuscript_image_collated===false));
 assert(!result.review_queue.some(x=>x.written_surface==='huiya'),
  'Director answered the two cited huiya contexts; do not re-ask or globally decide other stanzas');
 assert(result.nonexclusive_lead_counts.contextual_poetic_vocable_occurrence_review_complete_not_global===1);
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
 assert.equal(distinct.size,926);
 const rawUnresolved=new Set(current.token_engine_diagnostics.filter(x=>
  x.analysis_route==='no_linked_engine_surface_match').map(x=>x.written_surface));
 assert.equal(rawUnresolved.size,926);
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
  assert(sourceRow&&!sourceRow.prior_source_research&&!sourceRow.director_feedback_previously_recorded&&
   sourceRow.context_specific_poetic_occurrence_reviews.length===0);
 }
 for(const mutator of [
  x=>{x.evidence_fingerprints.canonical_lexicon='0'.repeat(64)},
  x=>{x.investigations[0].gold=true},
  x=>{x.investigations[0].written_surface='inventedform'},
 ]){
  const bad=JSON.parse(JSON.stringify(original));mutator(bad);
  assert.throws(()=>buildTriage(bad,current),/Reject|Invalid/i);
 }
 const wrong=JSON.parse(JSON.stringify(current));wrong.count_by_actual_existing_engine_route.no_linked_engine_surface_match=925;
 assert.throws(()=>buildTriage(original,wrong),/926/i);
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
