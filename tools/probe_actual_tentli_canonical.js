#!/usr/bin/env node
'use strict';
// Run current canonical sentence/English/grammar-IR source on EXACTLY
// the same probes already supplied to the ACTUAL neural checkpoint.
// The Tēntli canonical grammar is NOT the neural research model. A
// refusal is valuable evidence and should NEVER become a fabricated
// default translation.
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const input=process.argv[2],output=process.argv[3];
if(!input||!output)throw Error('Usage: node tools/probe_actual_tentli_canonical.js neural-probes.json canonical-results.json');
const root=path.resolve(__dirname,'..');
const j=JSON.parse(fs.readFileSync(input,'utf8'));
const ctx={window:{}};
for(const filename of ['translator-sentence.js','translator-english.js','translator-grammar-ir.js']){
  vm.runInNewContext(fs.readFileSync(path.join(root,filename),'utf8'),ctx,{filename});
}
const dictionary=JSON.parse(fs.readFileSync(path.join(root,'dictionary.json'),'utf8'));
const paradigms=JSON.parse(fs.readFileSync(path.join(root,'paradigms.json'),'utf8'));
const sentence=ctx.window.TlahtolliSentence.create(dictionary,paradigms);
const english=ctx.window.TlahtolliEnglish.create(sentence);
const grammar=ctx.window.TlahtolliGrammarIR.create(dictionary);
const rows=[];
for(const r of j.english_probes){
  let available=false,proposal=null,error=null,options=0;
  try {
    const analysis=sentence.analyze(r.source);
    const graph=grammar.build(r.source,analysis);
    const composition=grammar.auditEnglish(english.compose(r.source,analysis),analysis,graph);
    available=composition.available===true;
    options=(composition.units||[]).reduce((n,u)=>n+(u.options||[]).length,0);
    proposal=available?english.render(composition):null;
  }catch(e){
    error=String(e?.message||e);
    // Fail closed instead of hallucinating any grammar parse.
  }
  const match=typeof proposal==='string' && typeof r.reference==='string' &&
    proposal.toLowerCase().trim()===r.reference.toLowerCase().trim();
  const entry={id:r.id,group:r.group,input:r.source,reference:r.reference,
    available,canonical_rendering:proposal,canonical_options:options,
    exact_reference_string:match,
    neural_latest:r.latest_neural_en,
    canonical_error:error};
  rows.push(entry);
  console.log('CANONICAL_VS_NEURAL',JSON.stringify(entry));
}
const constructed=rows.filter(r=>r.group==='software_constructed_development');
const sourceAnchors=rows.filter(r=>r.group==='enl_short_edited_anchor_development');
const negatives=rows.filter(r=>r.group==='out_of_domain_negative');
if(constructed.length!==8||sourceAnchors.length!==7||negatives.length!==2)
  throw Error('Source probe counts changed');
const summary={
  format:'tentli-canonical-vs-actual-trained-neural-v1',
  canonical_system:'existing source-graded grammar composer, built-in rules; not all website integrations',
  note:'Software-designed references are development controls and ENL source anchors are NOT blind human gold',
  constructed_grammar_probes:constructed.length,
  grammar_available:constructed.filter(r=>r.available).length,
  grammar_exact_reference_strings:constructed.filter(r=>r.exact_reference_string).length,
  historical_enl_anchor_probes:sourceAnchors.length,
  historical_enl_available:sourceAnchors.filter(r=>r.available).length,
  historically_reviewed_gold_pairs:0,
  negatives:negatives.length,
  negatives_correctly_refused:negatives.filter(r=>!r.available).length,
  human_translation_accuracy:null,
  change_to_canonical_engine:false,
};
const report={summary,results:rows};
fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n','utf8');
console.log('CANONICAL_NEURAL_COMPARISON_SUMMARY',JSON.stringify(summary));
