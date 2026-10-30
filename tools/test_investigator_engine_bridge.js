'use strict';
/* Regression for source-to-existing-engines bridge. No invented Silver labels
 * or independent Gold, and raw editorial English never used as target. */
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const cp=require('node:child_process');
const root=path.resolve(__dirname,'..');
const bridge=require('./investigator_engine_bridge.js');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'tentli-engine-bridge-'));
let report;
try{
 const input=path.join(temp,'investigator-all.json');
 cp.execFileSync('python',['-m','neural.paged_historical_investigator',
  '--all','--output',input],{cwd:root,encoding:'utf8',timeout:150000});
 report=JSON.parse(fs.readFileSync(input,'utf8'));
 const result=bridge.bridge(report);
 assert.equal(result.format,'tentli-research-engine-bridge-v1');
 assert.equal(result.research_investigation_count,1181);
 assert.equal(result.source_historical_contexts_run_through_engines,7);
 assert.equal(result.source_cited_song_vocable_contexts_run_through_engines,2);
 assert.equal(result.poetic_context_grammar_engine_diagnostics.length,2);
 for(const o of result.poetic_context_grammar_engine_diagnostics){
  assert.equal(o.sentence_engine_poetic_context_matches,1);
  assert.equal(o.shared_grammar_ir_poetic_context_nodes,1);
  assert.equal(o.english_composition_abstained,true);
  assert.equal(o.verbal_yauh_homograph_preserved,true);
  assert.equal(o.grammatical_sense_globally_approved,false);
  assert.equal(o.silver,false);assert.equal(o.gold,false);
 }
 assert.equal(result.source_gold_or_silver_approved,0);
 assert.equal(result.no_persistent_learning_or_model_update,true);
 assert.equal(result.no_auto_grammatical_rule_creation,true);
 assert.equal(result.english_meaning_accuracy,null);
 assert.equal(result.no_gold_reference_exposure,true);
 assert(result.engine_wiring.advanced_browser_supplementary_morphology.includes('source executed in isolated Node VM'));
 assert(result.advanced_browser_morphology_source_revision.source.includes('tools/morphology_engine.js'));
 assert.equal(result.token_engine_diagnostics.length,1181);
 assert.equal(result.historical_context_engine_diagnostics.length,7);
 const cat=result.count_by_actual_existing_engine_route;
 assert.equal(cat.curated_lexical_headword_surface+
  cat.exact_indexed_grammar_paradigm_surface+
  cat.exact_source_review_morphology_surface+
  cat.advanced_browser_morphology_surface+
  cat.only_archival_dictionary_headword+
  cat.no_linked_engine_surface_match,1181);
 const forms=new Set(result.token_engine_diagnostics.map(x=>x.written_surface));
 assert.equal(forms.size,1181);
 const byForm=Object.fromEntries(result.token_engine_diagnostics.map(x=>[x.written_surface,x]));
 for(const word of ['zanio','can','ayac','cuicatl','tecpancalli','necoc'])
  assert(byForm[word],word+' not included in engine-bridge 1181-form scan');
 assert(result.token_engine_diagnostics.some(x=>x.advanced_browser_morphology_candidates.length>0),
  'Actual advanced morphology engine must produce some candidate readings');
 assert(result.token_engine_diagnostics.every(x=>
  x.silver===false&&x.gold===false&&x.training_eligible===false&&
  x.semantic_agreement_verified===false&&
  x.sentence_english_certified===false&&
  x.approved_lexicon_morpheme_added===false&&
  x.advanced_browser_morphology_candidates.every(c=>c.source===null||c.source.startsWith('https://'))));
 assert(result.historical_context_engine_diagnostics.every(x=>
  x.analyzed_by_existing_engines===true&&
  x.lexical_engine_token_count>=1&&
  x.english_draft_not_published===true&&
  x.sentence_meaning_independently_verified===false&&
  x.training_eligible===false&&x.silver===false&&x.gold===false));
 const getty=result.historical_context_engine_diagnostics.find(x=>x.context_id==='dfc-book10-cujcatl');
 assert.equal(getty.original_edition_check_provenance,'not_verified_static_html');
 const inputs=result.historical_context_engine_diagnostics.map(x=>x.context_id);
 assert.equal(new Set(inputs).size,7);
 assert(result.historical_context_engine_diagnostics.some(x=>
  x.context_id==='bc16-sale-ticnamaca'&&
  x.original_edition_short_phrase.includes('y¯')&&
  x.lexical_engine_unknown_written_tokens.includes('y¯')),
  'Preserve unresolved scribal overbar, not silent normalization');
 for(const tamper of [
  x=>{x.investigations[0].silver_approved=true},
  x=>{x.investigations[0].gold=true},
  x=>{x.investigations[0].training_eligible=true},
  x=>{x.investigations[0].written_surface='injected'},
  x=>{x.investigations[0].original_edition_contexts.push({source_url:'http://unsafe'})},
  x=>{x.evidence_fingerprints.canonical_lexicon='0'.repeat(64)},
  x=>{x.evidence_fingerprints.individual_archived_lexical_source_sha256['simeon_00.json']='0'.repeat(64)},
  x=>{x.historical_dev_stanzas_excluded=0},
 ]){const candidate=JSON.parse(JSON.stringify(report));tamper(candidate);
  assert.throws(()=>bridge.bridge(candidate),/Reject|Invalid|historical/i);}
 const limited=JSON.parse(JSON.stringify(report));
 limited.investigations=limited.investigations.slice(0,20);
 limited.processed_form_count=20;
 const part=bridge.bridge(limited);
 assert.equal(part.research_investigation_count,20);
 assert.equal(part.source_historical_contexts_run_through_engines,7);
 assert.equal(JSON.stringify(result),JSON.stringify(bridge.bridge(report)),
  'Re-run must produce identical JSON diagnostic; browser VM prototypes may differ');
 const out=path.join(temp,'from-cli.json');
 cp.execFileSync('node',['tools/investigator_engine_bridge.js',
  '--input',input,'--output',out],{cwd:root,encoding:'utf8',timeout:150000});
 assert.equal(JSON.stringify(JSON.parse(fs.readFileSync(out,'utf8'))),JSON.stringify(result));
 console.log('PASS: 1181 real evidence forms analyzed through existing lexical / indexed paradigm / exact-source morphology,');
 console.log('      7 historical source contexts through current clause grammar + English composer + shared IR;');
 console.log('      stale archive SHA, Gold, Silver, training and forged-source failures guarded. Routes: '+JSON.stringify(cat));
}finally{
 fs.rmSync(temp,{recursive:true,force:true});
}
