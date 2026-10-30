#!/usr/bin/env node
'use strict';
/**
 * Wide, evidence-limited Bronze curriculum. Only accepts complete English
 * outputs produced by Tēntli's EXISTING source-gated canonical composer.
 * No invented forms, English targets or manuscript attestations.
 *
 * The ten indexed tense/mood rows and six persons are teacher-generated
 * paradigms, NOT evidence that every resulting text is historical.
 * Every form is independently run through canonical full-input grammar IR.
 */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const D=JSON.parse(fs.readFileSync(path.join(root,'paradigms.json'),'utf8'));
const {produce,createBatchProducer}=require('./source_gated_english_bridge.js');

function build(){
 const render=createBatchProducer();
 const surfaceOwners=new Map();
 const sourceRows=[];
 const stats={attempted:0,accepted:0,refused:0,uncited:0,tooLong:0,
              sharedSurface:0,unclearAlternatives:0,repeatedSurface:0,invalidSource:0};
 for(const [lemma,p] of Object.entries(D.paradigms)){
  if(!Array.isArray(p.cells)||p.cells.length!==D.patterns.length)
    throw Error('Indexed verb cells changed unexpectedly: '+lemma);
  for(let index=0;index<p.cells.length;index++){
   const row=p.cells[index];
   if(!Array.isArray(row)||row.length!==D.persons.length)
    throw Error('Person indexed row changed unexpectedly: '+lemma);
   for(let i=0;i<row.length;i++)for(const polarity of [false,true]){
    const written=row[i],source=(polarity?'ahmo ':'')+written;
    if(typeof written!=='string'||!written.trim())throw Error('Missing indexed verb form '+lemma);
    stats.attempted++;
    if(Buffer.byteLength(source,'utf8')>240){stats.tooLong++;continue;}
    const owners=surfaceOwners.get(source)||new Set();
    owners.add(lemma);surfaceOwners.set(source,owners);
    sourceRows.push({source,lemma,tense:D.patterns[index],person:D.persons[i],polarity:polarity?'negative':'affirmative'});
   }
  }
 }
 if(stats.attempted!==Object.keys(D.paradigms).length*D.patterns.length*D.persons.length*2)
  throw Error('Missing canonical paradigm grid');
 // Do not use a forced last-wins assignment if different lexical roots have
 // identical inflected surfaces; a surface may not supervise one target.
 const seen=new Map(),out=[];
 for(const row of sourceRows){
  if(surfaceOwners.get(row.source).size!==1){stats.sharedSurface++;continue;}
  if(seen.has(row.source)){stats.repeatedSurface++;continue;}
  seen.set(row.source,row);
  let result=render(row.source,32);
  if(result.status!=='candidates'||result.grammar_complete!==true||
     result.verified_translation!==false||!result.canonical_draft){
    stats.refused++;continue;
  }
  if(result.candidates_exhaustive!==true || !Array.isArray(result.candidates) ||
     result.candidates.length===0){stats.unclearAlternatives++;continue;}
  const sources=[...new Set(result.candidates.flatMap(c=>c.source_urls||[]))];
  if(sources.length===0||sources.some(s=>typeof s!=='string'||!s.startsWith('https://'))){
   stats.uncited++;continue;
  }
  if(Buffer.byteLength(result.canonical_draft,'utf8')>240){stats.tooLong++;continue;}
  const first=result.candidates[0];
  if(first.english!==result.canonical_draft ||
     result.candidates.some(c=>c.grade!=='grammar_source_bounded_draft_not_manuscript_translation')){
    stats.invalidSource++;continue;
  }
  out.push({
   "source":row.source,"target":result.canonical_draft,
   "work":"synthetic-lemma-"+row.lemma,"lemma":row.lemma,
   "source_urls":sources,"source_grade":"grammar_bounded_editorial_choice",
   "alternative_english_count":result.candidates.length,
   "training_status":"synthetic_teacher_only_not_historical_gold",
   "evidence_grade":"editorial_grammar_not_independently_reviewed",
   "human_reviewed":false,"historically_attested_sentence":false,
   "canonical_pattern":row.tense,
   "canonical_person":row.person,
   "canonical_polarity":row.polarity,
   "review_status":"constructed_only_no_independent_linguistic_review",
   "english_selection":"canonical_first_source_gated_alternative",
   "automatically_approved_for_public_translation":false
  });
  stats.accepted++;
 }
 out.sort((a,b)=>a.lemma.localeCompare(b.lemma)||a.source.localeCompare(b.source));
 if(out.some((r,i)=>i>0&&r.source===out[i-1].source))
  throw Error('Duplicate synthetic teacher surface');
 if(new Set(out.map(x=>x.source)).size!==out.length)
  throw Error('Nonconsecutive duplicate teacher surface');
 if(out.length<25||new Set(out.map(x=>x.lemma)).size<3)
  throw Error('Source-gated teacher could not produce a credible diverse curriculum');
 const hashes={};
 for(const name of [
   'dictionary.json','paradigms.json','translator-sentence.js',
   'translator-english.js','translator-grammar-ir.js',
   'tools/morphology_engine.js','tools/source_gated_english_bridge.js',
   'data/predicate_english.json','data/clause_grammar.json',
   'data/possessed_form_evidence.json','data/source_finite_context.json'
 ]){
   const file=path.join(root,name);
   if(!fs.existsSync(file))continue;
   hashes[name]=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
 }
 const byLemma={};const byPattern={};const byPolarity={};
 for(const row of out){
  byLemma[row.lemma]=(byLemma[row.lemma]||0)+1;
  byPattern[row.canonical_pattern]=(byPattern[row.canonical_pattern]||0)+1;
  byPolarity[row.canonical_polarity]=(byPolarity[row.canonical_polarity]||0)+1;
 }
 const meta={
  "format":"tentli-source-grammar-english-practice-v1",
  "extension":"wide-indexed-grammar-only-v2",
  "examples":out.length,
  "per_lemma":byLemma,
  "per_canonical_pattern":byPattern,
  "per_polarity":byPolarity,
  "attempted":stats.attempted,
  "refused":stats.refused,
  "rejected_unsafe":stats,
  "ambiguous_english":out.filter(x=>x.alternative_english_count>1).length,
  "source_sha256":hashes,
  "human_reviewed":false,
  "historical_gold":0,
  "train_eligible_for_historical_gold":false,
  "independent_accuracy":null,
  "note":"All English targets are grammatical editorial choices, NOT published historical translations. Lemma-disjoint dev only.",
 };
 return {out,meta};
}

function main(){
 const dest=process.argv[2];
 if(!dest)throw Error('Usage: node tools/export_wide_source_gated_english_practice.js /private/bronze-wide.jsonl');
 const {out,meta}=build();
 fs.mkdirSync(path.dirname(path.resolve(dest)),{recursive:true});
 fs.writeFileSync(dest,out.map(r=>JSON.stringify(r)).join('\n')+'\n','utf8');
 fs.writeFileSync(dest+'.meta.json',JSON.stringify(meta,null,2)+'\n','utf8');
 console.log('WIDE_SOURCE_GATED_BRONZE',JSON.stringify(meta));
}
if(require.main===module)main();
module.exports={build};
