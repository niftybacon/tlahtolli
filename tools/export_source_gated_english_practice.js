#!/usr/bin/env node
'use strict';
/**
 * Supervised English PRACTICE curriculum generated from already
 * source-gated Tēntli finite grammar. No model-based self-translation.
 *
 * The canonical composer sometimes gives MULTIPLE editorial English
 * senses. We retain ONLY its existing first/default draft per form,
 * explicitly label ambiguity and NEVER claim human-reviewed gold.
 */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const D=JSON.parse(fs.readFileSync(path.join(root,'paradigms.json'),'utf8'));
const {produce}=require('./source_gated_english_bridge.js');
const dest=process.argv[2];
if(!dest)throw Error('Usage: node tools/export_source_gated_english_practice.js /private/curriculum.jsonl');
const out=[],seen=new Map(),byLemma={},stats={attempted:0,admitted:0,refused:0,ambiguous:0,conflicts:0};
for(const [lemma,p] of Object.entries(D.paradigms)){
 const entries=[];
 for(const idx of [0,3]){
  const row=p.cells[idx];
  if(!row)throw Error('Missing canonical verb tense cells for '+lemma);
  for(const form of row)for(const neg of ['','ahmo ']){
   const source=neg+form;
   stats.attempted++;
   if(Buffer.byteLength(source,'utf8')>240){stats.refused++;continue;}
   const candidate=produce(source,12);
   if(candidate.status!=='candidates' || !candidate.canonical_draft ||
      !candidate.candidates.every(c=>c.source_urls.length)){
    stats.refused++;continue;
   }
   const incumbent=seen.get(source);
   if(incumbent){
    // Same surface across lemmas is ambiguous and cannot be used as
    // one supervised gloss; remove both copies after collection.
    if(incumbent!==lemma){stats.conflicts++;continue;}
    continue;
   }
   seen.set(source,lemma);
   const ambiguous=candidate.candidates.length>1;
   stats.ambiguous+=Number(ambiguous);
   const target=candidate.canonical_draft;
   const urls=candidate.candidates[0].source_urls;
   entries.push({
    "source":source,"target":target,
    "work":"synthetic-lemma-"+lemma,"lemma":lemma,
    "source_urls":urls,"source_grade":"grammar_bounded_editorial_choice",
    "alternative_english_count":candidate.candidates.length,
    "training_status":"synthetic_teacher_only_not_historical_gold",
    "evidence_grade":"editorial_grammar_not_independently_reviewed",
    "human_reviewed":false,"historically_attested_sentence":false
   });
  }
 }
 byLemma[lemma]=entries.length;
 out.push(...entries);
}
const duplicates=[...seen].filter(([s,l])=>[...seen].filter(([v])=>v===s).length>1);
if(duplicates.length)throw Error('Duplicate synthetic surface');
if(out.length<25 || Object.values(byLemma).filter(x=>x>0).length<3)
 throw Error('Insufficient genuine source-audited grammatical diversity: '+JSON.stringify(byLemma));
const ordered=out.sort((a,b)=>a.lemma.localeCompare(b.lemma)||a.source.localeCompare(b.source));
const hashfiles=['dictionary.json','paradigms.json','translator-sentence.js',
                 'translator-english.js','translator-grammar-ir.js',
                 'tools/morphology_engine.js','tools/source_gated_english_bridge.js'];
const files={};
for(const file of hashfiles)
 files[file]=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex');
const meta={
 "format":"tentli-source-grammar-english-practice-v1",
 "examples":ordered.length,"per_lemma":byLemma,"attempted":stats.attempted,
 "refused":stats.refused,"ambiguous_english":stats.ambiguous,
 "source_sha256":files,
 "human_reviewed":false,"historical_gold":0,
 "train_eligible_for_historical_gold":false,
 "independent_accuracy":null,
 "notice":"Source-backed grammatical practice, not historical English translation supervision"
};
fs.mkdirSync(path.dirname(dest),{recursive:true});
fs.writeFileSync(dest,ordered.map(x=>JSON.stringify(x)).join('\n')+'\n','utf8');
fs.writeFileSync(dest+'.meta.json',JSON.stringify(meta,null,2)+'\n','utf8');
console.log('SOURCE_GATED_ENGLISH_PRACTICE',JSON.stringify(meta));
