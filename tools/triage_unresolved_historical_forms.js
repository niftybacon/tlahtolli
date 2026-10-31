#!/usr/bin/env node
'use strict';
/* Source-preserving, NON-semantic classification of ALL 926 currently unmatched historical
 * surfaces that remain unrecognized by currently connected engines.
 * This is the NEXT stage of the existing investigator/engine bridge, not
 * another morphology/grammar engine or an automatic source approval process.
 */
const fs=require('node:fs'),path=require('node:path');
const ROOT=path.resolve(__dirname,'..');
const {validateResearch,currentEvidence}=require('./investigator_engine_bridge.js');
const FORMAT='tentli-unresolved-historical-form-triage-v1';
const PENDING='no_linked_engine_surface_match';
const norm=x=>String(x||'').normalize('NFC').toLocaleLowerCase('en');
const folded=x=>norm(x).normalize('NFD').replace(/\p{M}/gu,'');
const fromRepo=p=>JSON.parse(fs.readFileSync(path.join(ROOT,p),'utf8'));
const formTokens=x=>String(x).match(/\p{L}+/gu)||[];
function distanceAtMostOne(a,b){
 if(a===b)return 0;
 if(Math.abs(a.length-b.length)>1)return 2;
 if(a.length===b.length){
  let diff=0;for(let i=0;i<a.length;i++)if(a[i]!==b[i]&&++diff>1)return 2;
  return diff;
 }
 const small=a.length<b.length?a:b,large=a.length<b.length?b:a;
 let i=0,j=0,d=0;
 while(i<small.length&&j<large.length){
  if(small[i]===large[j]){i++;j++;continue;}
  if(++d>1)return 2;
  j++;
 }
 return 1;
}
function locatedSourceAnchors(dictionary){
 if(!Array.isArray(dictionary?.words))throw Error('Missing canonical dictionary source words');
 const out=[],seen=new Set();
 for(const w of dictionary.words){
  const surface=norm(w.word);
  const claim=(w.claims||[]).find(c=>c.field==='headword'&&
   ['dictionary','grammar','text'].includes(c.assessment)&&
   c.locator&&typeof c.source==='string'&&c.source.startsWith('https://'));
  if(!claim||surface.length<4||seen.has(surface))continue;
  seen.add(surface);
  out.push({surface,source_url:claim.source,source_locator:String(claim.locator).slice(0,200)});
 }
 return out;
}
function resemblanceLeads(written,anchors,max=3){
 if(written.length<4)return [];
 const w=folded(written),found=[];
 for(const a of anchors){
  if(Math.abs(w.length-folded(a.surface).length)>1)continue;
  if(norm(written)===a.surface)continue;
  const candidate=folded(a.surface);
  const dist=distanceAtMostOne(w,candidate);
  if(dist>1)continue;
  found.push({
   existing_source_checked_lemma:a.surface,
   reason:dist===0?'diacritic_quantity_insensitive_comparison_only':'one_letter_comparison_only',
   edit_distance_after_losing_quantity:dist,
   source_url:a.source_url,source_locator:a.source_locator,
   historical_spelling_equivalence_verified:false,
   grammatical_derivation_verified:false,
  });
 }
 found.sort((a,b)=>a.edit_distance_after_losing_quantity-b.edit_distance_after_losing_quantity||
  a.existing_source_checked_lemma.localeCompare(b.existing_source_checked_lemma));
 return found.slice(0,max);
}
// Common *surface shapes* are diagnostics ONLY. They do not parse or license
// a conjugation, nor does an apparent -tl turn a poetic form into a noun.
function orthographicAndAffixHints(s){
 const out=[];
 if(s.length>3&&/^(?:ni|ti|no|mo|to|qui|tla|te|on|ic)/u.test(s))
  out.push('initial_string_could_require_morpheme_boundary_review');
 if(s.length>4&&/(?:tli|tl|li|tin|meh|me|queh|huan|yocan)$/u.test(s))
  out.push('terminal_string_could_require_noun_or_locative_morphology_review');
 if(s.length>4&&/(?:huia|aya|ohuaya|ohuaye|huaye)$/u.test(s))
  out.push('poetic_refrain_like_surface_only');
 return out;
}
function originalLanguageStanzaContexts(){
 const raw=fs.readFileSync(path.join(ROOT,'research/neural_training/brinton_1890_poetry_weak_en.jsonl'),'utf8');
 const byId=new Map();
 for(const line of raw.split(/\r?\n/u).filter(Boolean)){
  const r=JSON.parse(line);
  if(r.split!=='train')continue;
  if(r.translation?.alignment!=='candidate')throw Error('No human-reviewed training parallel permitted');
  if(typeof r.original!=='string'||!r.original||byId.has(r.record_id))
   throw Error('Bad or duplicate Brinton original-language reference');
  byId.set(r.record_id,r.original);
 }
 if(byId.size!==133)throw Error('Expected unchanged 133 original-language TRAIN stanzas only');
 return byId;
}
function shortOriginalSourceWindow(source,word){
 if(typeof source!=='string')return null;
 const words=source.match(/\p{L}+/gu)||[];
 const at=words.findIndex(w=>norm(w)===word);
 if(at<0)return null;
 return words.slice(Math.max(0,at-5),Math.min(words.length,at+6)).join(' ').slice(0,200);
}
function formIsScopedNominalCandidate(written,c){
 return written==='antepilhuan'&&
  c?.kind==='Source-bounded plural nominal-predicate hypothesis'&&
  c.grade==='hypothesis'&&c.lemma==='tepilhuan'&&
  c.source==='https://nahuatl.wired-humanities.org/node/188794';
}
function unreviewedNoyolloClue(written,c){
 return written==='noyollo'&&
  c?.kind==='Exact Brinton first-person possessed heart research reading'&&
  c.lemma==='yollotl'&&c.grade==='unreviewed'&&
  c.features?.category==='noun'&&c.features?.possessor==='1sg'&&
  c.features?.originalEditionSpellingAttested===true&&
  c.features?.segmentationReviewedIndependently===false&&
  c.features?.contextualHeartSoulIntentionSenseResolved===false&&
  c.features?.fullHistoricalClauseTranslated===false&&
  c.parts?.map(p=>p.surface).join('')==='noyollo'&&
  c.source==='https://www.gutenberg.org/files/12219/12219-h/12219-h.htm'&&
  c.sources?.includes('https://nahuatl.wired-humanities.org/content/yollotl');
}
function buildTriage(source,linked,{maxHuman=12}={}){
 validateResearch(source);
 if(linked?.format!=='tentli-research-engine-bridge-v1'||
    linked.research_investigation_count!==source.investigations.length||
    linked.source_gold_or_silver_approved!==0||
    linked.no_persistent_learning_or_model_update!==true||
    linked.english_meaning_accuracy!==null||
    JSON.stringify(linked.input_evidence_fingerprints)!==JSON.stringify(source.evidence_fingerprints))
    throw Error('Stale or unsafe bridge report');
 if(!Number.isInteger(maxHuman)||maxHuman<1||maxHuman>30)
    throw Error('Review queue must remain bounded');
 const bySource=new Map(source.investigations.map(x=>[x.written_surface,x]));
 const byLink=new Map(linked.token_engine_diagnostics.map(x=>[x.written_surface,x]));
 if(bySource.size!==source.investigations.length||
    byLink.size!==linked.token_engine_diagnostics.length||
    byLink.size!==bySource.size)throw Error('Duplicate or missing full source form');
 const poetic=fromRepo('research/translation_corpus/brinton_contextual_form_leads_2026_10_30.json');
 if(poetic.format!=='tentli-brinton-contextual-form-leads-v1'||
   poetic.independent_human_review_count!==0||poetic.approved_training_examples_added!==0)
   throw Error('Poetic reference catalog not research-only');
 const prior=new Map(poetic.forms.map(x=>[x.surface,x]));
 if(prior.size!==10||[...prior.values()].some(x=>
   x.training_eligible!==false||x.lexicon_promotion!==false||
   x.fixed_english_target!==null||x.contextual_translation_verified!==false))
   throw Error('Poetic reference leads not independently verified training');
 const feedback=fromRepo('research/translation_corpus/project_director_provisional_feedback.json');
 if(feedback.format!=='tentli-human-feedback-provisional-v1')
   throw Error('Director feedback reference changed');
 const previouslyReviewed=new Set(feedback.entries.map(x=>norm(x.exact_written_form)));
 const anchors=locatedSourceAnchors(fromRepo('dictionary.json'));
 const sourceStanzas=originalLanguageStanzaContexts();
 const loc=fromRepo('research/translation_corpus/unresolved_high_frequency_source_leads_2026_10_30.json');
 if(loc.format!=='tentli-unresolved-lexicographic-context-leads-v1'||
    loc.recorded?.length!==5||loc.gold_approved!==0||loc.silver_approved!==0||
    loc.new_training_examples!==0||loc.approved_dictionary_edits!==0||
    loc.verified_whole_clause_translations!==0||
    loc.rule_generation_allowed!==false||loc.model_training_allowed!==false)
   throw Error('Source-graded contextual leads cannot become new approved training');
 const externalLeads=new Map();
 const allowed=new Set(['yehuan','tepilhuan','noyollo','ipalnemohua','huiya']);
 for(const r of loc.recorded){
  if(!allowed.has(r.form)||externalLeads.has(r.form)||
     !/^https:\/\/(?:nahuatl\.wired-humanities\.org|gdn\.iib\.unam\.mx)\//u.test(r.source_url)||
     !r.source_locator||!r.lead||!r.contextual_caveat||
     typeof r.ask_director_now!=='boolean'||!r.candidate_category)
    throw Error('Invalid historical external dictionary source for recurring word');
  externalLeads.set(r.form,r);
 }
 if(externalLeads.size!==5)throw Error('High-frequency source-research batch incomplete');
 // A user's contextual judgment is evidence for TWO specified manuscript/song
 // occurrences. It does not authorize a blanket morphological stopword rule.
 const song=fromRepo('research/translation_corpus/huiya_context_specific_song_vocable_2026_10_30.json');
 const expectedSongIds=new Set(['brinton-xv-02-huiya','cantares-18v-304-huiya']);
 const guard=song.guardrails||{};
 const requiredTrue=['no_global_huiya_to_vocable_rewrite','no_global_huiya_to_go_rewrite',
   'no_global_interjection_stopword_set','retain_original_poetic_refrains',
   'retain_grapheme_spellings_and_diacritics','no_automatic_word_deletion',
   'do_not_exclude_from_source_counts','no_new_grammar_rules',
   'other_huiya_occurrences_pending_context_review'];
 if(song.format!=='tentli-huiya-contextual-poetic-evidence-v1'||
    song.method_source?.year!==1972||song.method_source?.printed_pages!=='53-54'||
    !Array.isArray(song.method_source?.potential_vocable_spellings)||
    !song.method_source.potential_vocable_spellings.includes('huiya')||
    song.method_source.all_potential_spellings_context_dependent!==true||
    song.method_source.verbal_and_particle_homographs_preserved!==true||
    !Array.isArray(song.observations)||song.observations.length!==2||
    song.observations.some(o=>!expectedSongIds.has(o.id)||o.exact_written_form!=='huiya'||
       o.review_scope!=='this_occurrence_only'||o.interpretation_not_global!==true||
       o.context_role!=='sung_interjection_or_poetic_vocable_in_this_stanza'||
       !/^https:\/\//u.test(o.source_url)||o.manuscript_image_collated!==false||
       o.whole_stanza_english_semantics_reviewed!==false||
       o.reviewer_independence!=='not_independently_authenticated')||
    new Set(song.observations.map(x=>x.id)).size!==2||
    song.observations[0].record_id!=='brinton-1890-poetry-xv-02'||
    song.observations[1].record_id!=='cantares-mexicanos-18v-304'||
    !sourceStanzas.get('brinton-1890-poetry-xv-02')?.includes('in colcahuahtecpillotl huiya nican milacatzoa')||
    song.separate_lexical_sense?.lexeme!=='yauh'||
    song.separate_lexical_sense?.remains_allowed!==true||
    !requiredTrue.every(k=>guard[k]===true)||
    guard.approved_gold!==0||guard.approved_silver!==0||
    guard.training_eligible!==false||guard.new_dictionary_edits!==0||
    guard.model_weights_updated!==false)
   throw Error('Cannot generalize context-sensitive sung huiya into a new universal word rule');
 const reviewedSong=new Map([['huiya',song]]);

 const unresolved=[];
 const classes={
  prior_poetic_or_particle_research_lead:0,
  near_source_checked_headword_not_equivalent:0,
  initial_or_terminal_morphology_shape_only:0,
  recurrent_across_same_edition_poem_units:0,
  no_specific_lexical_or_morphology_lead:0,
  director_feedback_already_recorded:0,
  individually_cited_external_historical_dictionary_lead:0,
  contextual_poetic_vocable_occurrence_review_complete_not_global:0,
 };
 for(const [surface,linkedRow] of byLink){
  const original=bySource.get(surface);
  if(!original)throw Error('Engine bridge contains a missing original historical form');
  if(linkedRow.analysis_route!==PENDING)continue;
  if(linkedRow.source_cited_archival_candidate_count!==0||
    linkedRow.curated_lexical_surface_count!==0||
    linkedRow.exact_verb_paradigm_candidates.length!==0||
    linkedRow.source_reviewed_morphology_candidates.length!==0||
    linkedRow.advanced_browser_morphology_candidates.some(c=>
     !(formIsScopedNominalCandidate(linkedRow.written_surface,c)||
       unreviewedNoyolloClue(linkedRow.written_surface,c)))||
    original.source_families_exact_headword_matched!=='neither')
   throw Error('Unresolved claim contradicts existing morphology or dictionary engine');
  const pre=prior.get(surface);
  const old=previouslyReviewed.has(surface);
  const sourced=externalLeads.get(surface)||null;
  const contextReviewed=reviewedSong.get(surface)||null;
  const near=resemblanceLeads(surface,anchors);
  const shapes=orthographicAndAffixHints(surface);
  const repeats=original.historical_train_work_count>=2;
  if(pre)classes.prior_poetic_or_particle_research_lead++;
  if(near.length)classes.near_source_checked_headword_not_equivalent++;
  if(shapes.length)classes.initial_or_terminal_morphology_shape_only++;
  if(repeats)classes.recurrent_across_same_edition_poem_units++;
  if(old)classes.director_feedback_already_recorded++;
  if(sourced)classes.individually_cited_external_historical_dictionary_lead++;
  if(contextReviewed)classes.contextual_poetic_vocable_occurrence_review_complete_not_global++;
  if(!pre&&!sourced&&!near.length&&!shapes.length&&!repeats)
    classes.no_specific_lexical_or_morphology_lead++;
  const sources=original.historic_brinton_source_examples;
  if(sources.some(x=>!x.record_id||!x.work_id||
    !/^https:\/\//u.test(x.printed_historical_source_url)||
    /-(?:xxv|xxvi|xxvii)$/u.test(x.work_id)))
   throw Error('Dev-poem or unlinked historical excerpt in evidence review');
  // Score measures the *value of a follow-up investigation*, not linguistic
  // confidence. Known earlier findings and project-director feedback are
  // prioritized for reuse, NEVER redundantly sent as another human task.
  const priority=
    Math.min(12,original.historical_training_token_occurrences)*2+
    Math.min(5,original.historical_train_work_count)*4+
    Math.min(3,near.length)*2+
    Math.min(2,shapes.length)+
    (original.contextual_primary_edition_evidence.length?8:0)+
    (original.human_contextual_review_priority?5:0)+
    (sourced?.ask_director_now?12:0);
  const route=pre?'already_in_poetic_particle_source_triage':
   contextReviewed?'two_song_occurrences_are_context_reviewed_other_uses_pending':
   sourced?.ask_director_now?'independent_dictionary_verb_reading_conflicts_with_poetic_context':
   sourced?'source_located_lexical_lead_requires_only_contextual_engine_review':
   old?'already_has_director_feedback':
   near.length?'compare_original_spellings_and_source_lexicon_entry':
   shapes.length?'reinspect_exact_historical_morpheme_boundaries':
   repeats?'compare_original_passages_across_poem_units':
   'inspect_exact_original_passage_before_any_morphology_claim';
  unresolved.push({
   written_surface:surface,
   source_poem_occurrences:original.historical_training_token_occurrences,
   separate_poem_units_in_same_brinton_edition:original.historical_train_work_count,
   historical_edition_examples:sources.map(entry=>({
    ...entry,
    original_language_short_context:shortOriginalSourceWindow(
     sourceStanzas.get(entry.record_id),surface),
    short_context_not_independent_translation:true,
   })),
   historical_document_context_leads:original.original_edition_contexts,
   prior_source_research:pre?{
    evidence_class:pre.class,
    source_url:pre.sources[0].url,
    evidence_grade:pre.evidence,
    context_independent_gloss_verified:false,
   }:null,
   director_feedback_previously_recorded:old,
   context_specific_poetic_occurrence_reviews:contextReviewed?contextReviewed.observations.map(o=>({
    review_work_id:o.historical_work_id,review_passage_id:o.record_id,
    source_url:o.source_url,short_source_fragment:o.short_source_fragment,
    grammatical_function_hypothesis:o.context_role,
    manuscript_image_collated:false,review_scope:'this_occurrence_only',
    not_a_general_word_sense:true,verbal_homograph_still_available:true,
   })):[],
   is_all_occurrences_adjudicated:false,
   independent_dictionary_context_lead:sourced?{
    source_url:sourced.source_url,source_locator:sourced.source_locator,
    proposed_contextual_lead:sourced.lead,caveat:sourced.contextual_caveat,
    category:sourced.candidate_category,
    director_attention_warranted:sourced.ask_director_now,
    exact_stanza_meaning_verified:false,source_based_dictionary_lemma_promotion:false,
   }:null,
   source_checked_similar_lemma_leads_not_equivalent:near,
   unverified_morphological_surface_shape_hints:shapes,
   triage_route:route,
   research_priority_not_translation_confidence:priority,
   previous_investigation_escalation:original.human_contextual_review_priority,
   dictionary_sense_newly_verified:false,
   grammatical_segmentation_newly_verified:false,
   original_clause_translation_verified:false,
   gold:false,silver_approved:false,training_eligible:false,
  });
 }
 if(unresolved.length!==linked.count_by_actual_existing_engine_route.no_linked_engine_surface_match||
    unresolved.length!==926)throw Error('Not the current exact 926 forms; rebase and rerun');
 unresolved.sort((a,b)=>b.research_priority_not_translation_confidence-
  a.research_priority_not_translation_confidence||a.written_surface.localeCompare(b.written_surface));
 // Existing 10 poetic-form cases and director feedback are not needlessly
 // sent to a person again. Limit one initial user question to a few distinct
 // source-linked words, while machine follow-up can run across all 926.
 const eligible=unresolved.filter(r=>!r.prior_source_research&&!r.director_feedback_previously_recorded&&
   r.context_specific_poetic_occurrence_reviews.length===0&&
   (!r.independent_dictionary_context_lead||r.independent_dictionary_context_lead.director_attention_warranted)&&
   (r.separate_poem_units_in_same_brinton_edition>=2||
    r.source_checked_similar_lemma_leads_not_equivalent.length||
    r.historical_document_context_leads.length));
 const queue=[],workCaps=new Map();
 for(const item of eligible){
  const work=item.historical_edition_examples[0]?.work_id||
    item.historical_document_context_leads[0]?.original_work_id||'unknown';
  if((workCaps.get(work)||0)>=2)continue;
  workCaps.set(work,(workCaps.get(work)||0)+1);
  queue.push({
    written_surface:item.written_surface,priority_not_confidence:item.research_priority_not_translation_confidence,
    first_example:item.historical_edition_examples[0]||
     item.historical_document_context_leads[0]||null,
    potential_cited_headwords:item.source_checked_similar_lemma_leads_not_equivalent,
    independent_external_dictionary_lead:item.independent_dictionary_context_lead,
    followup:item.triage_route,
    question_to_human_required:false,
    reviewer_can_defer:true,
    no_gold_or_silver_promoted:true,
  });
  if(queue.length===maxHuman)break;
 }
 return {
  format:FORMAT, source_fingerprints:source.evidence_fingerprints,
  previous_engine_report_format:linked.format,
  unresolved_engine_miss_count:unresolved.length,
  previous_release_unresolved_baseline:928,
  dictionary_only_exact_forms_newly_connected:2,
  investigated_all_unresolved_not_translated:unresolved.length===926,
  nonexclusive_lead_counts:classes,
  source_checked_comparison_anchors:anchors.length,
  already_investigated_poetic_or_director_cases_not_requeued:
   unresolved.filter(x=>!!x.prior_source_research||x.director_feedback_previously_recorded).length,
  new_individually_source_indexed_high_frequency_leads:classes.individually_cited_external_historical_dictionary_lead,
  previously_asked_huiya_song_contexts_recorded_not_universally_resolved:classes.contextual_poetic_vocable_occurrence_review_complete_not_global,
  prioritized_new_human_questions_count:queue.length,
  requires_human_for_every_form:false,
  no_new_dictionary_approvals:true,
  no_new_morphological_rules:true,
  no_model_training:true,
  english_translation_accuracy:null,
  untouched_gold_review_count:0,
  no_silver_or_gold_promotions:true,
  review_queue:queue,
  unresolved_forms:unresolved,
 };
}
function main(){
 const args=process.argv.slice(2);
 function after(flag){const i=args.indexOf(flag);if(i<0||!args[i+1])throw Error('Need '+flag);return args[i+1];}
 const raw=JSON.parse(fs.readFileSync(after('--source'),'utf8'));
 const linked=JSON.parse(fs.readFileSync(after('--bridge'),'utf8'));
 const out=buildTriage(raw,linked);
 const dest=path.resolve(after('--output'));
 fs.mkdirSync(path.dirname(dest),{recursive:true});
 fs.writeFileSync(dest,JSON.stringify(out,null,2)+'\n');
 console.log(JSON.stringify(Object.fromEntries(Object.entries(out).filter(([k])=>!['review_queue','unresolved_forms'].includes(k))),null,2));
 console.log('SOURCE-LINKED FIRST REVIEW LEADS (NOT CLAIMS OF MEANING):');
 for(const row of out.review_queue.slice(0,12)){
  console.log(JSON.stringify({form:row.written_surface,score:row.priority_not_confidence,
   source:row.first_example,possible_lemmas:row.potential_cited_headwords.map(x=>x.existing_source_checked_lemma),
   next:row.followup}));
 }
}
if(require.main===module)main();
module.exports={buildTriage,distanceAtMostOne,resemblanceLeads,orthographicAndAffixHints,locatedSourceAnchors};
