#!/usr/bin/env node
'use strict';
/*
 * Reproducible REAL-CORPUS development diagnostic.
 * Uses the existing Tlahtōlli lexical, morphology, and sentence analyzers.
 * Source-provided Spanish is not used to guess Nahuatl structure or train rules.
 * Never writes parallel sentences, gold rows, or a claimed accuracy score.
 */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const crypto=require('node:crypto');
const {parseRows,gitBlobSha,fingerprint}=require('./inspect_axolotl_candidates.js');
const ROOT=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const json=p=>JSON.parse(read(p));
const manifest=json('research/translation_corpus/axolotl_classical_pair_pointers.json');
const isClassical=r=>r.length===5&&r[2]==='Classical Nahuatl'&&r[4]==='nci';
const count=s=>String(s||'').trim().split(/\s+/u).filter(Boolean).length;
const digest=s=>crypto.createHash('sha256').update(s).digest('hex');

function selectRows(rows,limit=48){
 if(!Number.isInteger(limit)||limit<1||limit>200)throw Error('limit must be 1..200');
 const works=new Map(),seenNh=new Set(),seenEs=new Set();
 let eligible=0,skippedDuplicates=0,skippedLength=0;
 for(const [idx,r] of rows.entries()){
  if(!isClassical(r))continue;
  if(!r[0]?.trim()||!r[1]?.trim()||!r[3]?.trim())continue;
  const nh=count(r[1]),es=count(r[0]);
  // Too-short material is usually a name, caption, or ambiguous token;
  // very long OCR paragraphs distort sentence-level diagnostics.
  if(nh<3||nh>18||es<3||es>36){skippedLength++;continue;}
  eligible++;
  const nkey=fingerprint(r[1]),ekey=fingerprint(r[0]);
  if(!nkey||!ekey||seenNh.has(nkey)||seenEs.has(ekey)){
   skippedDuplicates++;continue;
  }
  seenNh.add(nkey);seenEs.add(ekey);
  const item={sourceRow:idx+1,spanish:r[0],nahuatl:r[1],work:r[3],
   tokens:nh,spanishTokens:es,
   rank:digest(r[3]+'\0'+String(idx+1)+'\0'+r[1])};
  if(!works.has(r[3]))works.set(r[3],[]);
  works.get(r[3]).push(item);
 }
 for(const items of works.values())items.sort((a,b)=>a.rank.localeCompare(b.rank));
 const names=[...works.keys()].sort(),selected=[];
 let step=0;
 while(selected.length<limit){
  let found=false;
  for(const name of names){
   const item=works.get(name)[step];
   if(!item)continue;found=true;selected.push(item);
   if(selected.length>=limit)break;
  }
  if(!found)break;
  step++;
 }
 return {selected,inventory:{classicalLabeled:rows.filter(isClassical).length,
  eligibleLength:eligible,discardedIdenticalPairs:skippedDuplicates,
  discardedLength:skippedLength,distinctEligibleWorks:names.length}};
}
function loadExistingEngines(){
 const dictionary=json('dictionary.json'),paradigms=json('paradigms.json');
 const context={window:{},URL,words:dictionary.words,
  FULL_VERB_PARADIGMS:paradigms.paradigms,VERB_TENSES:paradigms.patterns,
  norm:s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(),
  stripToken:s=>String(s).replace(/^[^\p{L}\p{M}]+|[^\p{L}\p{M}]+$/gu,'').toLowerCase(),
  historicalSpellings:w=>String(w.original||'').split(/[;,/]+/).map(s=>s.trim()).filter(Boolean),
  safe:x=>String(x),validUrl:x=>x,safeLink:(a,b)=>b};
 const morphSource=read('tools/morphology_engine.js').split(
  'renderMorphologyBreakdown=TlahtolliMorphEngine.html;')[0];
 if(!morphSource.includes('const TlahtolliMorphEngine'))
  throw Error('Canonical morphology module format changed');
 vm.runInNewContext(morphSource+'\nthis.canonicalMorph=TlahtolliMorphEngine;',context);
 for(const file of ['translator-engine.js','translator-sentence.js'])
  vm.runInNewContext(read(file),context,{filename:file});
 const morph=token=>context.canonicalMorph.analyze(token);
 const sentence=context.window.TlahtolliSentence.create(dictionary,paradigms,morph,
  {entries:[]},null,json('data/clause_grammar.json'),
  json('data/possessed_form_evidence.json'),json('data/source_finite_context.json'),
  json('data/passages.json'));
 // Crucial: NO stored bilingual sentence lookup passed to lexical model.
 const lex=context.window.TlahtolliTranslator.create(dictionary,{entries:[]});
 return {lex,sentence,morph};
}
function diagnose(sample,engines,options={}){
 const byWork=new Map(),unknownForms=new Map(),perRow=[];
 const stats={selected:0,nahuatlTokens:0,curatedMatches:0,unknownTokens:0,
  approximateMatches:0,lexicalAmbiguousTokens:0,sourceMorphologyUnknownTokens:0,
  fullSentenceGrammarCandidates:0,partialGrammarWindowRows:0,
  conditionalStructuralRows:0,unresolvedSentenceRows:0};
 const structuralKeys=['historicalFiniteProposals','sourceAgreementProposals',
  'coordinatedSubjectProposals','nominalCoordinationProposals',
  'relativeClauseProposals','nestedInProposals',
  'complexClauseProposals','possessedArgumentProposals'];
 for(const row of sample){
  const lexical=engines.lex.analyze(row.nahuatl,'nh-en');
  const syntactic=engines.sentence.analyze(row.nahuatl);
  const clauses=syntactic.clauses||[];
  const parts=lexical.parts.filter(x=>x.kind==='word');
  const unknown=parts.filter(x=>x.status==='unknown');
  let plausibleMorph=0;
  for(const token of unknown){
   const key=token.value.toLowerCase().normalize('NFC');
   unknownForms.set(key,(unknownForms.get(key)||0)+1);
   // A morphology proposal does NOT reclassify an unknown dictionary token
   // as securely analyzed or a translation.
   if(engines.morph(token.value)?.length)plausibleMorph++;
  }
  const hasWindow=clauses.some(c=>c.partialSpans?.length>0);
  const structural=clauses.some(c=>structuralKeys.some(k=>c[k]?.length>0));
  const full=syntactic.complete===true;
  stats.selected++;stats.nahuatlTokens+=lexical.stats.total;
  stats.curatedMatches+=lexical.stats.matched;
  stats.unknownTokens+=lexical.stats.unknown;
  stats.approximateMatches+=lexical.stats.approximate;
  stats.lexicalAmbiguousTokens+=lexical.stats.ambiguous;
  stats.sourceMorphologyUnknownTokens+=plausibleMorph;
  if(full)stats.fullSentenceGrammarCandidates++;
  if(hasWindow)stats.partialGrammarWindowRows++;
  if(structural)stats.conditionalStructuralRows++;
  if(!full)stats.unresolvedSentenceRows++;
  const w=byWork.get(row.work)||{work:row.work,rows:0,tokens:0,
   matched:0,unknown:0,grammarCandidates:0,partialWindowRows:0};
  w.rows++;w.tokens+=lexical.stats.total;w.matched+=lexical.stats.matched;
  w.unknown+=lexical.stats.unknown;
  if(full)w.grammarCandidates++;
  if(hasWindow)w.partialWindowRows++;
  byWork.set(row.work,w);
  perRow.push({upstreamRow:row.sourceRow,work:row.work,tokens:lexical.stats.total,
   unknown:lexical.stats.unknown,grammarCandidate:full,
   partialWindowPresent:hasWindow,structuralOnly:structural&&!full});
 }
 const unknown=[...unknownForms.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));
 return {format:'tlahtolli-parallel-development-diagnostic-v1',
  classification:'IN-SAMPLE DEVELOPMENT ONLY; not independent test, not translation accuracy',
  engine:'existing TlahtolliTranslator + TlahtolliSentence + canonical morphology',
  inputPolicy:'Spanish paired source kept for later review; never used as model-generated gold or grammar rule',
  sampling:'SHA256-ranked within each document title, round-robin across works, de-duplicate pairs, 3-18 Nahuatl tokens',
  sourceGitBlobSha:options.sourceGitBlobSha||null,
  corpusInventory:options.inventory||null,counts:stats,
  byWork:[...byWork.values()].sort((a,b)=>a.work.localeCompare(b.work)),
  highFrequencyUnknownForms:unknown.slice(0,16).map(([form,occurrences])=>({form,occurrences})),
  inspectedRowReferences:perRow,
  accuracy:null,approvedHeldoutPairs:0,
  caveat:'Counts are mechanical lexical or grammar coverage on published development material; they are not correctness judgments. Morphological guesses remain guesses.'};
}
function runCsv(buffer,limit=48,engines=loadExistingEngines()){
 if(!Buffer.isBuffer(buffer))throw Error('Expected source CSV bytes');
 if(gitBlobSha(buffer)!==manifest.upstream.blob_sha)
  throw Error('Pinned Axolotl blob SHA mismatch; refuses source drift');
 const rows=parseRows(buffer.toString('utf8'));
 if(rows.length!==manifest.upstream.verified_total_csv_rows)
  throw Error('Pinned Axolotl CSV row count mismatch');
 if(rows.filter(isClassical).length!==manifest.upstream.verified_classical_label_rows)
  throw Error('Pinned Classical label inventory mismatch');
 const {selected,inventory}=selectRows(rows,limit);
 const report=diagnose(selected,engines,{inventory,
  sourceGitBlobSha:manifest.upstream.blob_sha});
 if(!report.counts.selected||report.counts.selected>limit)
  throw Error('No usable bounded corpus sample');
 return report;
}
function main(){
 const input=process.argv[2],flagIndex=process.argv.indexOf('--limit');
 if(!input||input.startsWith('--')){
  console.error('Usage: node tools/diagnose_axolotl_development.js /local/pinned/axolotl.csv [--limit 48] [--json]');
  process.exitCode=2;return;
 }
 let limit=48;
 if(flagIndex>=0){
  const value=process.argv[flagIndex+1];
  if(!/^\d{1,3}$/u.test(value||''))throw Error('Invalid --limit');
  limit=Number(value);
 }
 const report=runCsv(fs.readFileSync(input),limit);
 if(process.argv.includes('--json'))return console.log(JSON.stringify(report,null,2));
 const c=report.counts;
 console.log('REAL AXOLOTL DEVELOPMENT SAMPLE: '+c.selected+' parallel rows across '+
  report.byWork.length+' source works');
 console.log('Pinned source blob: '+report.sourceGitBlobSha);
 console.log('Lexical tokens: '+c.nahuatlTokens+
  '; curated matches: '+c.curatedMatches+
  '; unknown: '+c.unknownTokens+'; approximate: '+c.approximateMatches+
  '; multiple-entry ambiguity: '+c.lexicalAmbiguousTokens);
 console.log('Unknown tokens with morphology proposals (NOT verified): '+
  c.sourceMorphologyUnknownTokens);
 console.log('Full grammar candidates: '+c.fullSentenceGrammarCandidates+
  '; partial grammar windows: '+c.partialGrammarWindowRows+
  '; conditional structural analysis: '+c.conditionalStructuralRows+
  '; unresolved sentences: '+c.unresolvedSentenceRows);
 console.log('High-frequency unknown surface forms: '+
  report.highFrequencyUnknownForms.map(x=>x.form+' ('+x.occurrences+')').join(', '));
 for(const w of report.byWork)
  console.log('WORK '+w.work+': '+w.rows+' rows, lexical '+w.matched+'/'+w.tokens+
   ', full-grammar '+w.grammarCandidates+', partial-windows '+w.partialWindowRows);
 console.log('Translation accuracy: NOT MEASURED; no train/test use or copied bilingual sentences.');
}
if(require.main===module){
 try{main()}catch(e){console.error('ERROR: '+e.message);process.exitCode=1;}
}
module.exports={selectRows,loadExistingEngines,diagnose,runCsv};
