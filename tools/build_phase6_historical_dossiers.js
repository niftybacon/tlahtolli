#!/usr/bin/env node
'use strict';
/* Phase 6: source-locked, reproducible research dossiers from the EXISTING
 * 928-form investigator/actual-engine triage. This script does not resolve
 * meanings, create lexemes, alter morphology or certify translations.
 */
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {buildTriage}=require('./triage_unresolved_historical_forms.js');

const FORMAT='tentli-phase6-source-locked-gap-dossiers-v1';
const MAX=100;
const ERR='Reject stale or unsupported Phase 6 source research packet';
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const json=x=>JSON.stringify(x);
const https=s=>typeof s==='string'&&/^https:\/\/[^\s/]+\//u.test(s)&&s.length<=750;
function insist(cond,why=ERR){if(!cond)throw Error(why);}
const matched=new Set([
 'source_located_lexical_lead_requires_only_contextual_engine_review',
 'two_song_occurrences_are_context_reviewed_other_uses_pending',
 'independent_dictionary_verb_reading_conflicts_with_poetic_context',
 'already_in_poetic_particle_source_triage',
 'compare_original_spellings_and_source_lexicon_entry',
 'reinspect_exact_historical_morpheme_boundaries',
 'compare_original_passages_across_poem_units',
 'inspect_exact_original_passage_before_any_morphology_claim',
 'already_has_director_feedback'
]);
const category=row=>row.independent_dictionary_context_lead?
 'source-indexed-lexical-context-needs-adjudication':
 row.prior_source_research||row.context_specific_poetic_occurrence_reviews.length?
 'already-studied-poetic-or-particle-context-not-global':
 row.source_checked_similar_lemma_leads_not_equivalent.length?
 'check-source-lemma-spelling-not-equivalent':
 row.unverified_morphological_surface_shape_hints.length?
 'check-historical-morpheme-boundaries':
 'read-source-context-no-proven-analysis';
const nextAction={
 'source-indexed-lexical-context-needs-adjudication':
  'Check the exact cited dictionary wording against separate original stanza contexts; do not infer the grammatical referent or English stanza from a headword',
 'already-studied-poetic-or-particle-context-not-global':
  'Reuse previously cited source-context research; distinguish each occurrence and verbal homographs without asking for repeated blanket approval',
 'check-source-lemma-spelling-not-equivalent':
  'Compare original spelling and independently cited lemma; record historical spelling evidence before altering canonical morphology',
 'check-historical-morpheme-boundaries':
  'Check segmentation from historical grammar and original manuscript/edition context, not from a prefix-looking string alone',
 'read-source-context-no-proven-analysis':
  'Inspect exact cited original-language passage, its grammatical neighbors and any editorial ambiguities before proposing a lemma or rule',
};
function validate(triage){
 insist(triage?.format==='tentli-unresolved-historical-form-triage-v1'&&
   triage.unresolved_engine_miss_count===928&&
   triage.unresolved_forms?.length===928&&
   triage.no_new_dictionary_approvals===true&&
   triage.no_new_morphological_rules===true&&
   triage.no_model_training===true&&
   triage.no_silver_or_gold_promotions===true&&
   triage.untouched_gold_review_count===0&&
   triage.english_translation_accuracy===null);
 insist(triage.source_fingerprints&&
   triage.previous_engine_report_format==='tentli-research-engine-bridge-v1');
 const ids=new Set();
 for(const r of triage.unresolved_forms){
  insist(typeof r.written_surface==='string'&&
   /^[\p{L}\p{M}'’\-]{1,120}$/u.test(r.written_surface)&&
   !ids.has(r.written_surface)&&
   Number.isInteger(r.source_poem_occurrences)&&r.source_poem_occurrences>=0&&
   Number.isInteger(r.separate_poem_units_in_same_brinton_edition)&&
   r.separate_poem_units_in_same_brinton_edition>=0&&
   Number.isFinite(r.research_priority_not_translation_confidence)&&
   matched.has(r.triage_route)&&
   r.dictionary_sense_newly_verified===false&&
   r.grammatical_segmentation_newly_verified===false&&
   r.original_clause_translation_verified===false&&
   r.gold===false&&r.silver_approved===false&&r.training_eligible===false&&
   r.is_all_occurrences_adjudicated===false);
  ids.add(r.written_surface);
  insist(Array.isArray(r.historical_edition_examples)&&
   Array.isArray(r.historical_document_context_leads)&&
   Array.isArray(r.source_checked_similar_lemma_leads_not_equivalent)&&
   Array.isArray(r.unverified_morphological_surface_shape_hints)&&
   Array.isArray(r.context_specific_poetic_occurrence_reviews));
  for(const e of r.historical_edition_examples){
   insist(https(e.printed_historical_source_url)&&
    typeof e.record_id==='string'&&typeof e.work_id==='string'&&
    typeof e.original_language_short_context==='string'&&
    e.original_language_short_context.length<=200&&
    e.short_context_not_independent_translation===true&&
    !/-(?:xxv|xxvi|xxvii)$/iu.test(e.work_id));
  }
  const lead=r.independent_dictionary_context_lead;
  if(lead)insist(https(lead.source_url)&&
   lead.exact_stanza_meaning_verified===false&&
   lead.source_based_dictionary_lemma_promotion===false);
  insist(r.context_specific_poetic_occurrence_reviews.every(x=>
   x.not_a_general_word_sense===true&&x.review_scope==='this_occurrence_only'&&
   x.verbal_homograph_still_available===true));
 }
}
function buildDossiers(triage,limit=80){
 validate(triage);
 insist(Number.isInteger(limit)&&limit>=1&&limit<=MAX,'Invalid bounded dossier limit');
 // The already source-indexed high-frequency forms are useful as cross-work
 // comparison seeds. Inclusion does NOT attest any individual contextual sense.
 const rows=triage.unresolved_forms;
 const eligible=rows.filter(r=>
  r.independent_dictionary_context_lead||
  r.separate_poem_units_in_same_brinton_edition>=2||
  r.historical_document_context_leads.length>0||
  r.source_checked_similar_lemma_leads_not_equivalent.length>0);
 const sorted=eligible.slice().sort((a,b)=>
  Number(!!b.independent_dictionary_context_lead)-Number(!!a.independent_dictionary_context_lead)||
  b.research_priority_not_translation_confidence-a.research_priority_not_translation_confidence||
  b.separate_poem_units_in_same_brinton_edition-a.separate_poem_units_in_same_brinton_edition||
  a.written_surface.localeCompare(b.written_surface,'en'));
 const picked=[],seen=new Set(),firstWork=new Map();
 // Two passes discourage one edited poem from monopolizing the batch.
 for(const perWorkCap of [3,Infinity]){
  for(const r of sorted){
   if(picked.length>=limit)break;
   if(seen.has(r.written_surface))continue;
   const work=r.historical_edition_examples[0]?.work_id||
     r.historical_document_context_leads[0]?.original_work_id||'unknown';
   if((firstWork.get(work)||0)>=perWorkCap)continue;
   seen.add(r.written_surface);
   firstWork.set(work,(firstWork.get(work)||0)+1);
   picked.push(r);
  }
 }
 const packets=picked.map((r,i)=>{
  const c=category(r),cited=r.historical_edition_examples.slice(0,4);
  return {
   dossier_number:i+1,written_surface:r.written_surface,
   original_form_not_a_lemma:true,
   classification:'research-priority-only-no-contextual-meaning-certified',
   priority_not_linguistic_confidence:r.research_priority_not_translation_confidence,
   same_edition_poem_occurrences:r.source_poem_occurrences,
   same_edition_distinct_poem_units:r.separate_poem_units_in_same_brinton_edition,
   same_edition_is_not_independent_manuscript_confirmation:true,
   triage_route:r.triage_route,
   research_category:c,
   suggested_next_source_check:nextAction[c],
   original_edition_examples:cited.map(e=>({
    original_record_id:e.record_id,work_id:e.work_id,
    source_url:e.printed_historical_source_url,
    exact_short_original_context:e.original_language_short_context,
    complete_stanza_english_reviewed:false,
    manuscript_image_independently_collated:false,
   })),
   additional_original_document_contexts:r.historical_document_context_leads,
   independent_historical_dictionary_lead:r.independent_dictionary_context_lead,
   cited_similar_headwords_are_not_proven_variants:r.source_checked_similar_lemma_leads_not_equivalent,
   superficial_morpheme_shape_hints_not_rules:r.unverified_morphological_surface_shape_hints,
   previous_historical_context_notes:r.context_specific_poetic_occurrence_reviews,
   already_prior_research:!!r.prior_source_research||
    r.director_feedback_previously_recorded||
    r.context_specific_poetic_occurrence_reviews.length>0,
   review_requires_new_primary_contextual_evidence:true,
   new_verified_meaning:null,approved_dictionary_rule:false,
   train_eligible:false,gold:false,silver_approved:false,
  };
 });
 return {
  format:FORMAT,source_fingerprints:triage.source_fingerprints,
  parent_triage_format:triage.format,
  triage_source_sha256:sha(json(triage)),
  candidate_count:eligible.length,source_engine_gap_count:928,
  requested_dossier_limit:limit,prepared_dossier_count:packets.length,
  selection:'source-indexed and repeated same-edition witnesses, source-lemma comparisons; source-work-diversified and priority ranked',
  reviewed_original_manuscript_images:0,new_human_approved_silver:0,new_human_approved_gold:0,
  verified_contextual_translations_added:0,canonical_grammar_rules_added:0,model_updates:0,
  no_automatic_promotion:true,
  cases:packets
 };
}
function main(){
 const args=process.argv.slice(2);
 const after=flag=>{const i=args.indexOf(flag);if(i<0||!args[i+1])throw Error('Expected '+flag);return args[i+1];};
 const source=JSON.parse(fs.readFileSync(after('--source'),'utf8'));
 const linked=JSON.parse(fs.readFileSync(after('--bridge'),'utf8'));
 const triage=buildTriage(source,linked);
 const limit=args.includes('--limit')?Number(after('--limit')):80;
 const dossier=buildDossiers(triage,limit);
 const output=path.resolve(after('--output'));
 fs.mkdirSync(path.dirname(output),{recursive:true});
 fs.writeFileSync(output,JSON.stringify(dossier,null,2)+'\n');
 console.log(json({prepared:dossier.prepared_dossier_count,eligible:dossier.candidate_count,
  original_engine_gaps:dossier.source_engine_gap_count,
  actual_approved_contextual_translations:dossier.verified_contextual_translations_added,
  canonical_grammar_rules_added:dossier.canonical_grammar_rules_added,
  source_fingerprint:dossier.triage_source_sha256}));
}
if(require.main===module)main();
module.exports={buildDossiers,validate};
