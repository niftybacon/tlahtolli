#!/usr/bin/env node
'use strict';
/* Phase 6: source-locked, reproducible research dossiers from the EXISTING
 * 926-form investigator/actual-engine triage. This script does not resolve
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
// Overlapping REVIEW LEADS, not automatic failure diagnoses. One word can
// require lexical, morphology, orthography AND poetic/sentence investigation.
// Never turn a surface resemblance or citation into a productive parse.
const SIGNALS=[
 {id:'unreviewed-source-indexed-lexical-sense',
  test:r=>!!r.independent_dictionary_context_lead,
  action:'Check the cited lexical entry and each original clause separately; do not choose an English meaning from a headword alone'},
 {id:'poetic-vocable-or-particle-context-needs-disambiguation',
  test:r=>!!r.prior_source_research||r.context_specific_poetic_occurrence_reviews.length>0,
  action:'Compare each exact original song or particle context against verbal alternatives; do not delete a written vocable'},
 {id:'possible-spelling-relationship-not-established',
  test:r=>r.source_checked_similar_lemma_leads_not_equivalent.length>0,
  action:'Collate distinct original spellings and cited lexeme witnesses before asserting any historical equivalence'},
 {id:'possible-morpheme-boundary-not-established',
  test:r=>r.unverified_morphological_surface_shape_hints.length>0,
  action:'Check the finite form, argument morphology and source-based segmentation in a full original-language clause'},
 {id:'other-colonial-document-context-leads-to-inspect',
  test:r=>r.historical_document_context_leads.length>0,
  action:'Recheck the located non-Brinton document excerpts and original work identifiers; do not call them independent manuscript confirmations'},
 {id:'recurrence-only-within-one-printed-Brinton-edition',
  test:r=>r.separate_poem_units_in_same_brinton_edition>=2,
  action:'Compare full clauses across distinct poem units; their shared printed edition is not independent source corroboration'}
];
function diagnosticSignals(r){
 const out=SIGNALS.filter(x=>x.test(r)).map(x=>({
  potential_failure_or_evidence_signal:x.id,
  next_check:x.action,
  is_grammatical_diagnosis:false,
  independently_reviewed:false
 }));
 if(!out.length)out.push({
  potential_failure_or_evidence_signal:'no-classified-lead-read-original-context-first',
  next_check:'Locate and analyze the exact historical clause before even proposing a lexical or morphological hypothesis',
  is_grammatical_diagnosis:false,independently_reviewed:false
 });
 return out;
}
function countSignals(rows){
 const totals=Object.fromEntries([...SIGNALS.map(x=>x.id),
  'no-classified-lead-read-original-context-first'].map(x=>[x,0]));
 for(const r of rows)for(const s of diagnosticSignals(r))
  totals[s.potential_failure_or_evidence_signal]++;
 return totals; // Overlapping; sums need not equal the number of surfaces.
}
function witnessScope(r){
 const documentLeads=r.historical_document_context_leads;
 return {
  brinton_distinct_poem_units_same_printed_edition:r.separate_poem_units_in_same_brinton_edition,
  brinton_is_one_editorial_collection_not_independent_manuscript_witnesses:true,
  other_original_document_context_lead_count:documentLeads.length,
  other_document_work_ids_to_verify:[...new Set(documentLeads.map(x=>x.original_work_id))].sort(),
  other_documents_are_source_register_leads_not_verified_independent_witnesses:true,
  historical_dictionary_reference_is_not_contextual_manuscript_confirmation:true,
  independently_collated_original_manuscript_witnesses_in_this_batch:0,
  contextually_approved_english_alignments_in_this_batch:0
 };
}
const CONTRAST_PATH=path.resolve(__dirname,'../research/translation_corpus/phase6_contextual_contrast_leads_2026_10_30.json');
const CONTRAST_FORMAT='tentli-phase6-exact-contextual-contrast-leads-v1';
const EXACT_CONTRAST_FORMS=new Set(['yehua','antepilhuan','huel']);
const TRUSTED_CONTEXT_DOMAINS=new Set([
 'www.gutenberg.org','nahuatl.wired-humanities.org','gdn.iib.unam.mx','temoa.iib.unam.mx'
]);
function trustedUrl(url){
 if(!https(url))return false;
 try{return TRUSTED_CONTEXT_DOMAINS.has(new URL(url).hostname)}catch{return false}
}
function validateContextContrasts(doc,triage){
 insist(doc?.format===CONTRAST_FORMAT&&doc.research_only===true&&
   doc.approved_lexical_edits===0&&doc.productive_grammar_rules_added===0&&
   doc.independently_reviewed_silver===0&&doc.independent_gold===0&&
   doc.verified_complete_english_clauses===0&&doc.model_updates===0&&
   typeof doc.status==='string'&&doc.status.includes('neither independent human review')&&
   typeof doc.historical_source_cohort==='string'&&
   Object.values(doc.negative_guards||{}).length===6&&
   Object.values(doc.negative_guards).every(x=>x===true)&&
   Array.isArray(doc.cases)&&doc.cases.length===3);
 const known=new Map(triage.unresolved_forms.map(x=>[x.written_surface,x]));
 const seen=new Set();
 for(const row of doc.cases){
  insist(EXACT_CONTRAST_FORMS.has(row.written_surface)&&!seen.has(row.written_surface));
  seen.add(row.written_surface);
  const existing=known.get(row.written_surface);
  insist(!!existing&&Array.isArray(existing.historical_edition_examples)&&
   typeof row.pinned_brinton_original_excerpt==='string'&&
   row.pinned_brinton_original_excerpt.includes(row.written_surface)&&
   row.pinned_brinton_original_excerpt.length<=160&&
   row.pinned_brinton_work_id.startsWith('brinton-1890-poetry-')&&
   trustedUrl(row.original_printed_source_url)&&
   new URL(row.original_printed_source_url).hostname==='www.gutenberg.org');
  // The original excerpt MUST match a source-pinned original-language window,
  // not a generated English alignment, near-spelling or modern token.
  const tokenized=x=>String(x||'').normalize('NFC').toLocaleLowerCase('en').replace(/\s+/gu,' ').trim();
  insist(existing.historical_edition_examples.some(x=>
   x.record_id===row.pinned_brinton_record_id&&
   x.work_id===row.pinned_brinton_work_id&&
   tokenized(x.original_language_short_context).includes(tokenized(row.pinned_brinton_original_excerpt))));
  insist(Array.isArray(row.historical_dictionary_contrasts)&&
   row.historical_dictionary_contrasts.length>=2&&row.historical_dictionary_contrasts.length<=4&&
   row.historical_dictionary_contrasts.every(x=>trustedUrl(x.url)&&
    /^(?:nahuatl\.wired-humanities\.org|gdn\.iib\.unam\.mx)$/u.test(new URL(x.url).hostname)&&
    typeof x.locator==='string'&&x.locator.length>=10&&
    typeof x.lead==='string'&&x.lead.length>=15&&
    x.independent_original_clausal_interpretation===false));
  insist(Array.isArray(row.other_exact_original_document_contexts)&&
   row.other_exact_original_document_contexts.length<=2&&
   row.other_exact_original_document_contexts.every(x=>trustedUrl(x.url)&&
    x.historical_work_id?.length>8&&
    typeof x.exact_short_original_excerpt==='string'&&
    x.exact_short_original_excerpt.includes(row.written_surface)&&
    x.exact_short_original_excerpt.length<=145&&
    x.different_from_brinton_printed_work===true&&
    x.original_transcription_not_folio_image_collated===true&&
    x.existing_editorial_translation_not_gold===true));
  // Project-director statements are preserved exactly as scoped feedback.
  // A linguistic proposal is never an independent Silver/Gold evaluation.
  if(row.written_surface==='antepilhuan'){
   const d=row.project_director_contextual_assessment;
   insist(d?.review_scope==='Brinton poem V, stanza 4 only'&&
    JSON.stringify(d.proposed_segmentation)===JSON.stringify(['an-','te-','pil-','-huan'])&&
    d.person==='second-person plural'&&
    d.contextual_english==='O you princes'&&
    JSON.stringify(d.sense_family)===JSON.stringify(['children','nobles','princes'])&&
    d.interpretation_class==='source-cited project-director contextual analysis, not independently certified translation'&&
    d.no_global_grammar_promotion===true&&d.independently_reviewed===false&&
    d.whole_stanza_meaning_verified===false&&d.do_not_reask_without_new_evidence===true);
  }else insist(row.project_director_contextual_assessment===undefined);
  insist(Array.isArray(row.competing_contextual_questions)&&
   row.competing_contextual_questions.length>=2&&
   row.competing_contextual_questions.every(q=>typeof q==='string'&&q.length>=20)&&
   Array.isArray(row.non_equivalence_controls)&&row.non_equivalence_controls.length>=2&&
   !row.non_equivalence_controls.includes(row.written_surface)&&
   typeof row.risk==='string'&&row.risk.length>=45&&
   typeof row.evidence_trust==='string'&&row.evidence_trust.length>=30);
 }
 insist(seen.size===EXACT_CONTRAST_FORMS.size);
 return new Map(doc.cases.map(c=>[c.written_surface,c]));
}
function validate(triage){
 insist(triage?.format==='tentli-unresolved-historical-form-triage-v1'&&
   triage.unresolved_engine_miss_count===926&&
   triage.unresolved_forms?.length===926&&
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
  for(const context of r.historical_document_context_leads)
   insist(https(context.source_url)&&
    typeof context.original_work_id==='string'&&context.original_work_id.length>0&&
    context.source_grade==='short_original_edition_context_not_independent_english_translation'&&
    typeof context.context_id==='string'&&context.context_id.length>0);
  for(const comparison of r.source_checked_similar_lemma_leads_not_equivalent)
   insist(https(comparison.source_url)&&
    comparison.historical_spelling_equivalence_verified===false&&
    comparison.grammatical_derivation_verified===false);
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
 const contrastSource=fs.readFileSync(CONTRAST_PATH,'utf8');
 const contrastDoc=JSON.parse(contrastSource);
 const contextContrastIndex=validateContextContrasts(contrastDoc,triage);
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
   overlapping_diagnostic_review_signals:diagnosticSignals(r),
   source_indexed_context_contrast_not_approved:
    contextContrastIndex.get(r.written_surface)||null,
   grammatical_failure_type_independently_verified:false,
   review_source_independence:witnessScope(r),
   whole_clause_role_and_negation_scope_still_require_evidence:true,
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
  candidate_count:eligible.length,source_engine_gap_count:926,
  requested_dossier_limit:limit,prepared_dossier_count:packets.length,
  contextual_contrast_source_pack_sha256:sha(contrastSource),
  source_indexed_context_contrasts_without_grammatical_approval:contextContrastIndex.size,
  contextual_contrasts_in_selected_dossiers:
   packets.filter(x=>x.source_indexed_context_contrast_not_approved!==null).length,
  dictionary_context_lead_is_not_sentence_translation:true,
  diagnostic_signals_in_all_unmatched_forms_counted_with_overlap:countSignals(rows),
  diagnostic_signals_in_selected_dossiers_counted_with_overlap:
   countSignals(picked),
  diagnostic_groups_are_not_independently_verified_grammatical_errors:true,
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
module.exports={buildDossiers,validate,validateContextContrasts};
