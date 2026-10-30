#!/usr/bin/env node
'use strict';
/**
 * Source-gated English candidates from the EXISTING canonical grammar,
 * not another conjugator, lexicon, or unsourced translation generator.
 *
 * Reads {text:string,maxCandidates?:integer} via stdin, writes one JSON.
 * The optional predicate_english pack (PR #92) is used if and only if
 * it exists in this checkout; a missing pack cannot license new verbs.
 */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ROOT=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(ROOT,name),'utf8');
const data=name=>JSON.parse(read(name));
const DEFAULT_MAX=32,MAX_CANDIDATES=64;
function engines(){
 const dictionary=data('dictionary.json'),paradigms=data('paradigms.json');
 const context={window:{},words:dictionary.words,
  FULL_VERB_PARADIGMS:paradigms.paradigms,VERB_TENSES:paradigms.patterns,
  norm:s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(),
  stripToken:s=>String(s||'').replace(/^[^\p{L}\p{M}]+|[^\p{L}\p{M}]+$/gu,''),
  historicalSpellings:w=>String(w.original||'').split(/[;,/]+/).map(s=>s.trim()).filter(Boolean),
  safe:String,validUrl:()=>true,safeLink:()=>''};
 // Exactly the morphology provider used by canonical predicate-bridge tests.
 const morphSource=read('tools/morphology_engine.js').split('renderMorphologyBreakdown=TlahtolliMorphEngine.html;')[0];
 if(!morphSource.includes('const TlahtolliMorphEngine'))throw Error('Canonical morphology provider changed');
 vm.runInNewContext(morphSource+'\nthis.canonicalMorph=TlahtolliMorphEngine;',context);
 for(const name of ['translator-sentence.js','translator-locative.js','translator-english.js','translator-grammar-ir.js','translator-semantic-ir.js'])
  vm.runInNewContext(read(name),context,{filename:name});
 const original=data('research/translation_corpus/research_examples.json');
 const locative=context.window.TlahtolliLocative.create(dictionary,original);
 const packPath=path.join(ROOT,'data/predicate_english.json');
 const predicate=fs.existsSync(packPath)?data('data/predicate_english.json'):undefined;
 const sentence=context.window.TlahtolliSentence.create(dictionary,paradigms,
   context.canonicalMorph.analyze,original,locative,
   data('data/clause_grammar.json'),data('data/possessed_form_evidence.json'),
   data('data/source_finite_context.json'),data('data/passages.json'),predicate);
 const english=context.window.TlahtolliEnglish.create(sentence);
 const ir=context.window.TlahtolliGrammarIR.create(dictionary,
   data('data/passages.json'),paradigms,sentence);
 const semantic=context.window.TlahtolliSemanticIR.create(sentence,english,ir);
 return {sentence,english,ir,semantic,predicatePresent:!!predicate};
}
function produce(text,maxCandidates=DEFAULT_MAX,preloadedEngines=null){
 if(typeof text!=='string'||!text.trim()||text.length>7000||
  /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/u.test(text))
  throw Error('Text must be nonempty, control-free and at most 7000 characters');
 if(!Number.isInteger(maxCandidates)||maxCandidates<1||maxCandidates>MAX_CANDIDATES)
  throw Error('maxCandidates must be integer 1..64');
 const e=preloadedEngines||engines();
 const source=text.trim(),analysis=e.sentence.analyze(source),graph=e.ir.build(source,analysis);
 const audited=e.ir.auditEnglish(e.english.compose(source,analysis),analysis,graph);
 const complete=audited?.available===true && Array.isArray(audited.units) &&
  audited.units.length>0 && audited.units.every(u=>u.options?.length>0);
 if(!complete)return {
  status:'abstain',source_text:source,canonical_draft:null,candidates:[],
  grammar_complete:false,verified_translation:false,
  source_graded_morphology_only:(analysis.clauses||[]).flatMap(c=>(c.morphologicalClues||[])
   .slice(0,8).map(m=>({written:m.token,lemma:m.lemma,grade:m.grade}))).slice(0,16),
  reason:audited?.reason||'Not all written input is licensed by the English grammar composer',
  predicate_pack_available:e.predicatePresent
 };
 // Phase 1 semantic preservation: independently recompute the EXISTING
 // canonical analysis, IR and English options before scoring any candidates.
 // No automatic claims of historical semantic correctness are made.
 const semantic=e.semantic.verify(source,analysis,graph,audited);
 if(semantic.available!==true)return {
  status:'abstain',source_text:source,canonical_draft:null,candidates:[],
  grammar_complete:false,verified_translation:false,
  reason:semantic.reason||'Semantic preservation audit refused the English proposal',
  predicate_pack_available:e.predicatePresent,
  semantic_verifier:{version:'tentli-semantic-contract-v1',passed:false}
 };
 // The model NEVER invents/free-decodes English; it can score only
 // canonical alternatives that survived BOTH the grammar and semantic gates.
 const baseline=semantic.canonicalDraft;
 if(typeof baseline!=='string'||!baseline.trim())throw Error('Audited composer did not render its baseline');
 const optionBounds=audited.units.map(u=>u.options.length);
 const joins=(audited.joins||[]).map(j=>j.options?.length||1);
 const counts=[...optionBounds,...joins];
 const combinations=counts.reduce((n,c)=>Math.min(n*c,MAX_CANDIDATES+1),1);
 const enumerationComplete=combinations<=maxCandidates;
 const candidates=[],seen=new Set();
 function add(choices,joinChoices){
  const english=e.english.render(audited,choices,joinChoices);
  if(typeof english!=='string'||!english.trim()||seen.has(english))return;
  seen.add(english);
  const sourceUrls=[...new Set([
   ...audited.units.flatMap((u,i)=>u.options[choices[i]||0]?.sources||[]),
   ...(audited.joins||[]).flatMap((j,i)=>j.sources||[])
  ])].filter(s=>typeof s==='string'&&s.startsWith('https://')).slice(0,80);
  if(!sourceUrls.length)throw Error('Source-gated candidate had no evidence URLs');
  candidates.push({english,source_urls:sourceUrls,canonical_priority:candidates.length,
   grade:'grammar_source_bounded_draft_not_manuscript_translation'});
 }
 add([],[]);
 if(enumerationComplete){
  const choices=Array(optionBounds.length).fill(0),joinChoices=Array(joins.length).fill(0);
  function walk(k){
   if(k===counts.length){add(choices,joinChoices);return;}
   for(let v=0;v<counts[k];v++){
    if(k<optionBounds.length)choices[k]=v;else joinChoices[k-optionBounds.length]=v;
    walk(k+1);
   }
  }
  walk(0);
 }
 return {
  status:'candidates',source_text:source,canonical_draft:baseline,candidates,
  grammar_complete:true,verified_translation:false,
  candidates_exhaustive:enumerationComplete,
  possible_combinations_capped:combinations,
  partial_analysis_is_not_translation:true,
  predicate_pack_available:e.predicatePresent,
  audit_scope:audited.audit?.scope||'canonical-source-and-grammar',
  semantic_verifier:{version:semantic.version,passed:true,
   option_count:semantic.optionsChecked,verified_historical_translation:false}
 };
}
function main(){
 const arg=JSON.parse(fs.readFileSync(0,'utf8'));
 const result=produce(arg.text,arg.maxCandidates??DEFAULT_MAX);
 process.stdout.write(JSON.stringify(result)+'\n');
}
if(require.main===module)main();
// Research exporters can call thousands of forms through one frozen instance.
 // This does NOT change the public or single-input semantics of produce.
function createBatchProducer(){
 const e=engines();
 return (text,maxCandidates=DEFAULT_MAX)=>produce(text,maxCandidates,e);
}
module.exports={produce,createBatchProducer};
