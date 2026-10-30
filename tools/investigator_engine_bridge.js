#!/usr/bin/env node
'use strict';
/* Connect SOURCE-LOCKED autonomous investigator results to existing actual
 * Tēntli lexicon, indexed verb paradigms, source morphology adapter,
 * sentence analyzer, English composer and shared grammar IR.
 * Diagnostic ONLY: no new rules, no approved English, no training/Gold,
 * no assumed noun/verb segmentations from a dictionary miss.
 */
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const ROOT=path.resolve(__dirname,'..');
const {loadModels,analyzeText}=require('./diagnose_historical_sentences.js');
const {create:createAdvancedMorphology}=require('./investigator_advanced_morphology.js');
const FORMAT='tentli-research-engine-bridge-v1';
const INPUT='tentli-paged-historical-evidence-batch-v1';
const sources=[
 'research/neural_training/brinton_1890_poetry_weak_en.jsonl',
 'data/lexicon.json',
 'data/evidence.json',
 'references.json',
 'research/translation_corpus/primary_context_findings_2026_10_30.json',
 'research/translation_corpus/multidocument_context_probes_2026_10_30.json',
 'research/translation_corpus/project_director_provisional_feedback.json',
 'research/translation_corpus/huiya_context_specific_song_vocable_2026_10_30.json',
];
const sha=filename=>crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT,filename))).digest('hex');
const readJSON=filename=>JSON.parse(fs.readFileSync(path.join(ROOT,filename),'utf8'));
const norm=x=>String(x||'').normalize('NFC').toLocaleLowerCase('en');
const clip=x=>String(x||'').slice(0,120);
const checkedURL=u=>typeof u==='string'&&/^https:\/\/[^\s/]+\/[^\s]*$/u.test(u);
function currentEvidence(){
 const out={historical_brinton_train_dev_manifest:sha(sources[0]),
  canonical_lexicon:sha(sources[1]),source_checked_claims:sha(sources[2]),
  witness_atlas:sha(sources[3]),original_context_registry:sha(sources[4]),
  added_historical_documents:sha(sources[5]),
  project_director_observations:sha(sources[6]),
  contextual_poetic_vocable_evidence:sha(sources[7])};
 const manifest=readJSON('research/amoxcalli_archive/manifest.json');
 out.archive_manifest=sha('research/amoxcalli_archive/manifest.json');
 const files={};
 for(const group of ['simeon','kaikki']){
  for(const f of manifest[group].files){
   if(!new RegExp('^'+group+'_[0-9]+\\.json$','u').test(f))throw Error('Untrusted archive path');
   files[f]=sha('research/amoxcalli_archive/'+f);
  }
 }
 out.individual_archived_lexical_source_sha256=files;
 return out;
}
function independentlyAttestedResearchSurfaces(){
 const labels=new Set();
 const historical=fs.readFileSync(path.join(ROOT,sources[0]),'utf8').split(/\r?\n/u).filter(Boolean);
 for(const line of historical){
  const row=JSON.parse(line);
  if(!['train','dev'].includes(row.split))throw Error('Unapproved research train/dev split');
  if(row.split!=='train')continue;
  for(const token of String(row.original).normalize('NFC').match(/\p{L}+/gu)||[])
   labels.add(norm(token));
 }
 for(const row of readJSON(sources[4]).contexts)labels.add(norm(row.form));
 for(const row of readJSON(sources[5]).probes)labels.add(norm(row.form));
 for(const row of readJSON(sources[6]).entries)labels.add(norm(row.exact_written_form));
 return labels;
}
function validateResearch(report){
 if(!report||report.format!==INPUT||
    !Array.isArray(report.investigations)||
    report.processed_form_count!==report.investigations.length||
    report.processed_form_count<1||report.processed_form_count>10000||
    report.historical_train_stanzas!==133||
    report.historical_dev_stanzas_excluded!==17||
    report.distinct_written_forms_available!==1181||
    report.human_silver_added!==0||report.gold_added!==0||
    report.model_updated!==false||report.dictionary_updated!==false||
    JSON.stringify(Object.entries(report.evidence_fingerprints||{}).sort(([a],[b])=>a.localeCompare(b)))!==
    JSON.stringify(Object.entries(currentEvidence()).sort(([a],[b])=>a.localeCompare(b))))
   throw Error('Reject stale, incomplete or non-research-only investigator report');
 const seen=new Set(), independent=independentlyAttestedResearchSurfaces();
 for(const r of report.investigations){
  if(typeof r.written_surface!=='string'||r.written_surface.length>120||
      !r.written_surface||!independent.has(r.written_surface)||seen.has(r.written_surface)||
      r.written_surface!==norm(r.written_surface)||
      r.gold!==false||r.silver_approved!==false||r.training_eligible!==false||
      r.automatically_certified_meaning!==false||
      r.historically_verified_whole_clause_translation!==false||
      r.canonical_lexicon_modified!==false||
      r.cross_language_semantic_agreement!==null||
      !Array.isArray(r.historic_brinton_source_examples)||
      !Array.isArray(r.original_edition_contexts)||
      r.historic_brinton_source_examples.some(x=>!checkedURL(x.printed_historical_source_url)||
       /-(?:xxv|xxvi|xxvii)$/u.test(x.work_id))||
      r.original_edition_contexts.some(x=>!checkedURL(x.source_url)))
     throw Error('Invalid unverified token/source record in historical evidence');
  seen.add(r.written_surface);
 }
 return seen;
}
function buildParadigmIndex(){
 const data=readJSON('paradigms.json'),found=new Map();
 for(const [lemma,paradigm] of Object.entries(data.paradigms)){
  for(let tense=0;tense<paradigm.cells.length;tense++)
   for(let person=0;person<paradigm.cells[tense].length;person++){
    const written=paradigm.cells[tense][person],key=norm(written);
    if(!key)continue;
    const prior=found.get(key)||[];
    prior.push({lemma,cell_tense_index:tense,cell_person_index:person,
     evidence:'indexed_grammar_paradigm_not_manuscript_occurrence',
     source_url:paradigm.lemmaSource});
    found.set(key,prior);
   }
 }
 return found;
}
function recordSourceContexts(){
 const old=readJSON(sources[4]),newer=readJSON(sources[5]);
 if(old.format!=='tentli-controlled-primary-context-evidence-v1'||
    newer.format!=='tentli-multi-document-short-edition-probes-v1')
   throw Error('Unknown source-edition context schema');
 const rows=[
  ...old.contexts.map(r=>({id:r.id,original:r.exact_short_source_phrase,
   source:r.source_url,role:r.role,work:r.primary_collection_id,
   primaryEditionStatus:'catalog_limited_short_context_not_independent_gold',
   staticEditionCheck:r.id.startsWith('dfc-')?'not_verified_static_html':'verified_in_separate_live_workflow'})),
  ...newer.probes.map(r=>({id:r.id,original:r.exact_short_nahuatl,
   source:newer.works.find(w=>w.id===r.work_id)?.source_url,role:r.context_role,
   work:r.work_id,primaryEditionStatus:'catalog_limited_short_context_not_independent_gold',
   staticEditionCheck:'verified_in_separate_live_workflow'}))
 ];
 if(rows.length!==7||new Set(rows.map(r=>r.id)).size!==7||rows.some(r=>
     !checkedURL(r.source)||!r.original||r.original.split(/\s+/u).length>10||
     r.original.length>180))throw Error('Source context limit/attribution changed');
 return rows;
}
function bridge(report,{models=loadModels()}={}){
 validateResearch(report);
 const dictionary=readJSON('dictionary.json');
 const paradigms=buildParadigmIndex();
 const advanced=createAdvancedMorphology();
 const tally={curated_lexical_headword_surface:0,
  exact_indexed_grammar_paradigm_surface:0,
  exact_source_review_morphology_surface:0,
  advanced_browser_morphology_surface:0,
  only_archival_dictionary_headword:0,
  no_linked_engine_surface_match:0,
  context_engine_english_draft_proposals:0,
  context_engine_full_finite_clause_proposals:0,
  context_with_lexical_gaps:0,
  source_indexed_exact_lexical_surface_research_leads:0};
 const records=[];
 for(const row of report.investigations){
  const form=row.written_surface;
  // Use REAL existing engines. A lexical matching form is not proof of
  // original-source morphology; source morphology is exact record only.
  const lex=models.lexical.analyze(form,'nh-en');
  const lexicalHits=(Array.isArray(lex?.parts)?lex.parts:[]).filter(p=>p.kind==='word'&&p.status!=='unknown');
  const sourceCandidates=models.sourceMorphology.analyze(form);
  const lexicalSourceCandidates=sourceCandidates.filter(m=>
   m.kind==='Source-indexed exact lexical written form (NOT morphology)');
  // Lexical dictionary citations cannot become source-reviewed morphology.
  // These two source leads are orthogonal to the original exclusive 928
  // actual parser/morphology coverage routes; do not reduce that baseline.
  const morph=sourceCandidates.filter(m=>
   m.kind!=='Source-indexed exact lexical written form (NOT morphology)');
  if(lexicalSourceCandidates.length)tally.source_indexed_exact_lexical_surface_research_leads++;
  const indexed=paradigms.get(norm(form))||[];
  const advancedCandidates=advanced.analyze(form);
  const archive=(row.source_families_exact_headword_matched!=='neither');
  const category=lexicalHits.length?'curated_lexical_headword_surface':
   indexed.length?'exact_indexed_grammar_paradigm_surface':
   morph.length?'exact_source_review_morphology_surface':
   advancedCandidates.length?'advanced_browser_morphology_surface':
   archive?'only_archival_dictionary_headword':'no_linked_engine_surface_match';
  tally[category]++;
  records.push({
   written_surface:form,
   analysis_route:category,
   curated_lexical_surface_count:lexicalHits.length,
   exact_verb_paradigm_candidates:indexed.slice(0,4),
   advanced_browser_morphology_candidates:advancedCandidates.slice(0,5),
   advanced_browser_morphology_grades:[...new Set(advancedCandidates.map(c=>c.grade))],
   source_indexed_exact_lexical_form_candidates:lexicalSourceCandidates.slice(0,4).map(m=>({
    form,lemma:m.lemma,grade:'unreviewed',source:m.source,
    secondary_sources:m.sources,note:m.note,
    role_not_inferred:true,not_productive_morphology:true,
    not_canonical_lexicon_hit:lexicalHits.length===0,original_manuscript_not_collated:true,
    contextual_english_not_verified:true,
    approved_silver:false,approved_gold:false,training_eligible:false
   })),
   source_reviewed_morphology_candidates:morph.slice(0,4).map(m=>({
    lemma:m.lemma,grade:m.grade,source:m.source,
    note:'Research source-review adapter only; not independently source-approved whole text'
   })),
   source_cited_archival_candidate_count:
     row.historical_dictionary_1885_unreviewed_OCR.length+
     row.kaikki_nci_community_index.length,
   source_historical_context_count:row.contextual_primary_edition_evidence.length,
   uncertainty_priority:row.human_contextual_review_priority,
   proposed_engine_followup:lexicalHits.length?'check_historical_contextual_sense_and_grammar':
    indexed.length?'test_indexed_finite_structure_in_context':
    morph.length?'inspect_external_source_morphology_analysis':
    advancedCandidates.length?'evaluate_existing_browser_morphology_candidate_in_original_historical_context':
    archive?'evaluate_source_dictionary_and_inflection_context':
    'investigate_original_spelling_segment_compound_vocable_or_unmodeled_inflection',
   semantic_agreement_verified:false,
   sentence_english_certified:false,
   approved_lexicon_morpheme_added:false,
   silver:false,gold:false,training_eligible:false,
  });
 }
 const sources=recordSourceContexts();
 const contextResults=[];
 // Unlike the 7 short dictionary-context probes, these two scholarly song
 // passages are entered as *context-scoped poetic evidence*, never finite
 // clause English labels or Gold translations.
 const songEvidence=readJSON('research/translation_corpus/huiya_context_specific_song_vocable_2026_10_30.json');
 if(songEvidence.format!=='tentli-huiya-contextual-poetic-evidence-v1'||
    songEvidence.observations?.length!==2||
    songEvidence.guardrails?.no_global_huiya_to_vocable_rewrite!==true||
    songEvidence.guardrails?.no_automatic_word_deletion!==true||
    songEvidence.separate_lexical_sense?.remains_allowed!==true)
   throw Error('Rejected malformed contextual poetic evidence');
 const poeticContextResults=songEvidence.observations.map(song=>{
  const a=analyzeText(song.short_source_fragment,models);
  if(a.sourceLinkedSongVocableObservations!==1||
     a.grammarIRSongVocableNodes!==1||a.englishDraftAvailable!==false||
     !String(a.englishRefusal).includes('huiya'))
   throw Error('Current grammar/IR/English engines are not ingesting cited sung huiya');
  return {
   context_id:song.id,source_url:song.source_url,
   original_short_cited_nahuatl:song.short_source_fragment,
   sentence_engine_poetic_context_matches:a.sourceLinkedSongVocableObservations,
   shared_grammar_ir_poetic_context_nodes:a.grammarIRSongVocableNodes,
   english_composition_abstained:true,verbal_yauh_homograph_preserved:true,
   grammatical_sense_globally_approved:false,
   independent_manuscript_image_checked:false,
   silver:false,gold:false,training_eligible:false
  };
 });
 for(const row of sources){
  const a=analyzeText(row.original,models);
  if(a.tokenCount<1)throw Error('Source context discarded by existing engine');
  if(a.englishDraftAvailable)tally.context_engine_english_draft_proposals++;
  if(a.fullFiniteClauseAnalysis)tally.context_engine_full_finite_clause_proposals++;
  if(a.unknownHeadwordTokens.length)tally.context_with_lexical_gaps++;
  contextResults.push({
   context_id:row.id,work_id:row.work,source_url:row.source,
   original_edition_short_phrase:row.original,
   original_edition_check_provenance:row.staticEditionCheck,
   contextual_role_lead:row.role,
   analyzed_by_existing_engines:true,
   lexical_engine_token_count:a.tokenCount,
   lexical_engine_unknown_written_tokens:a.unknownHeadwordTokens.map(clip),
   source_tokenization_disagreements:a.tokenSurfaceDifferences,
   sentence_engine_full_finite_clause_proposal:a.fullFiniteClauseAnalysis,
   sentence_engine_finite_candidates:a.finiteCandidates,
   shared_grammar_ir_nodes:a.grammarNodes,
   shared_grammar_ir_alternatives:a.grammarAlternatives,
   english_composer_draft_available:a.englishDraftAvailable,
   english_composer_refusal:a.englishRefusal,
   english_draft_not_published:true,
   sentence_meaning_independently_verified:false,
   silver:false,gold:false,training_eligible:false,
  });
 }
 return {
  format:FORMAT,
  input_evidence_fingerprints:report.evidence_fingerprints,
  research_investigation_count:records.length,
  source_historical_contexts_run_through_engines:contextResults.length,
  source_cited_song_vocable_contexts_run_through_engines:poeticContextResults.length,
  engine_wiring:{
   lexical:'translator-engine.js actual curated browser lexical analyzer',
   indexed_verb_morphology:'paradigms.json all cells exact surface only',
   source_morphology:'translator-source-morphology.js exact source-review tokens',
   exact_source_indexed_lexical_forms:'translator-source-morphology.js optional original-spelling research-only lexical candidates, excluded from actual grammar recognition route',
   sentence:'translator-sentence.js source-gated grammar rules and exact source-cited poetic-vocable observations',
   english:'translator-english.js abstention-preserving composer',
   grammar_ir:'translator-grammar-ir.js shared candidate graph',
   advanced_browser_supplementary_morphology:'tools/morphology_engine.js source executed in isolated Node VM; proposals separately graded and never attested',
  },
  source_indexed_lexical_leads_source_sha256:sha('research/translation_corpus/exact_source_lexical_surface_leads_2026_10_30.json'),
  actual_grammar_or_full_english_coverage_from_lexical_leads:0,
  count_by_actual_existing_engine_route:tally,
  advanced_browser_morphology_source_revision:advanced.matchingInputVersion,
  no_persistent_learning_or_model_update:true,
  no_auto_grammatical_rule_creation:true,
  source_gold_or_silver_approved:0,
  english_meaning_accuracy:null,
  no_gold_reference_exposure:true,
  token_engine_diagnostics:records,
  historical_context_engine_diagnostics:contextResults,
  poetic_context_grammar_engine_diagnostics:poeticContextResults,
 };
}
function main(){
 const args=process.argv.slice(2);
 const input=args.indexOf('--input'),output=args.indexOf('--output');
 if(input<0||!args[input+1]||output<0||!args[output+1])
  throw Error('Usage: node tools/investigator_engine_bridge.js --input /tmp/full-report.json --output /tmp/bridge.json');
 const report=bridge(JSON.parse(fs.readFileSync(args[input+1],'utf8')));
 fs.mkdirSync(path.dirname(path.resolve(args[output+1])),{recursive:true});
 fs.writeFileSync(args[output+1],JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(Object.fromEntries(Object.entries(report).filter(([k])=>
  !['token_engine_diagnostics','historical_context_engine_diagnostics'].includes(k))),null,2));
}
if(require.main===module)main();
module.exports={bridge,validateResearch,currentEvidence,buildParadigmIndex,recordSourceContexts};
