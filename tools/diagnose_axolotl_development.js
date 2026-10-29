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

// Pinned row IDs from the source-byte-verified 2026-10-29, 36-record
// DEVELOPMENT COHORT. This prevents later refactors from quietly changing
// the reported denominator. IDs are not a ground-truth sentence/translation set.
const DEVELOPMENT_36_ROW_IDS=[12592,9712,10818,13267,3962,4474,9869,5048,12629,4508,13342,990,5812,16060,6321,5241,8684,13664,4751,13452,7877,5011,12741,8228,902,13193,12894,5216,10014,6818,759,4519,5515,7245,11739,12395];


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
async function loadExistingEngines(){
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
 for(const file of ['translator-engine.js','translator-sentence.js','translator-historical-morphology.js',
  'translator-source-morphology.js','translator-locative.js','translator-english.js','translator-grammar-ir.js'])
  vm.runInNewContext(read(file),context,{filename:file});
 // Reuse the already-shipped Amoxcalli archive loader/index. This is evidence
 // of a possible external lexical match, never a verified translation.
 const archiveContext={
  window:{},document:{readyState:'loading',addEventListener(){}},
  fetch:async url=>{
   const rel=String(url).split('/').pop();
   if(!/^[a-zA-Z0-9_.-]+\.json$/u.test(rel))throw Error('Unsafe archive shard name');
   const file=path.join(ROOT,'research/amoxcalli_archive',rel);
   if(!fs.existsSync(file))return {ok:false,status:404};
   return {ok:true,status:200,json:async()=>JSON.parse(fs.readFileSync(file,'utf8'))};
  }
 };
 vm.runInNewContext(read('amoxcalli-archive.js'),archiveContext,
  {filename:'amoxcalli-archive.js'});
 const archive=archiveContext.window.TlahtolliArchive;
 const archiveLoaded=await archive.ensureLoaded();
 if(archiveLoaded.total!==36543)throw Error('Archive source row inventory changed');
 // Match the live desk's provider wiring. The old diagnostic omitted the
 // source-linked provider and the entire relational-location analyzer.
 const sourceMorphology=context.window.TlahtolliSourceMorphology.create(
  json('research/translation_corpus/source_reviews/ENL_BC16_1573.json'));
 const morph=token=>[...context.canonicalMorph.analyze(token),...sourceMorphology.analyze(token)];
 const research=json('research/translation_corpus/research_examples.json');
 const locative=context.window.TlahtolliLocative.create(dictionary,research);
 const archiveMorph=token=>archive.analyzeSourceForms(token,{limit:8});
 const sentenceMorph=token=>[...morph(token),...archiveMorph(token)];
 const sentence=context.window.TlahtolliSentence.create(dictionary,paradigms,sentenceMorph,
  research,locative,json('data/clause_grammar.json'),
  json('data/possessed_form_evidence.json'),json('data/source_finite_context.json'),
  json('data/passages.json'));
 // Crucial: NO stored bilingual sentence lookup passed to lexical model.
 const lex=context.window.TlahtolliTranslator.create(dictionary,{entries:[]});
 const english=context.window.TlahtolliEnglish.create(sentence);
 const ir=context.window.TlahtolliGrammarIR.create(dictionary,json('data/passages.json'),paradigms);
 return {lex,sentence,morph,archiveMorph,archive,english,ir,canonicalMorph:token=>context.canonicalMorph.analyze(token),
  historicalVariants:context.window.TlahtolliHistoricalMorphology.variants};
}
function diagnose(sample,engines,options={}){
 const byWork=new Map(),unknownForms=new Map(),orthographicForms=new Map(),perRow=[];
 const categoryForms=new Map(),categoryTotals=new Map();
 const stats={selected:0,nahuatlTokens:0,curatedMatches:0,unknownTokens:0,
  approximateMatches:0,lexicalAmbiguousTokens:0,sourceMorphologyUnknownTokens:0,
  archiveFormMorphologyUnknownTokens:0,
  unknownExactClassicalArchive:0,unknownOnlyApproxClassicalArchive:0,
  unknownSimeonOcrArchive:0,unknownNotInArchive:0,
  unknownWithTentativeHistoricalArchiveCandidates:0,
  fullSentenceGrammarCandidates:0,draftEnglishRows:0,partialGrammarWindowRows:0,
  conditionalStructuralRows:0,unresolvedSentenceRows:0};
 const structuralKeys=['historicalFiniteProposals','agreementProposals',
  'coordinatedSubjectProposals','nominalCoordinationProposals',
  'relativeClauseProposals','nestedInProposals',
  'complexClauseProposals','nominalInProposals','locativeInterpretations','fragmentInterpretations'];
 for(const row of sample){
  const lexical=engines.lex.analyze(row.nahuatl,'nh-en');
  const syntactic=engines.sentence.analyze(row.nahuatl);
  const clauses=syntactic.clauses||[];
  const parts=lexical.parts.filter(x=>x.kind==='word');
  const unknown=parts.filter(x=>x.status==='unknown'||x.status==='provisional');
  let plausibleMorph=0,archiveFormMorph=0;
  const unknownAudit=[];
  for(const token of unknown){
   const key=token.value.toLowerCase().normalize('NFC');
   unknownForms.set(key,(unknownForms.get(key)||0)+1);
   // A morphology proposal does NOT reclassify an unknown dictionary token
   // as securely analyzed or a translation.
   if(engines.morph(token.value)?.length)plausibleMorph++;
   // Exact source-listed inflection labels are an unreviewed tier, not
   // canonical morphology or a curated lexical recognition.
   const archiveClues=engines.archiveMorph?.(token.value)||[];
   if(archiveClues.length)archiveFormMorph++;
   if(engines.archive){
    const evidence=engines.archive.lookupEvidence(token.value,{limit:20});
    const exact=evidence.hits.some(h=>h.sourceKey==='kaikki'&&
     h.variety==='Classical Nahuatl'&&h.matchKind==='exact');
    const approximate=evidence.hits.some(h=>h.sourceKey==='kaikki'&&
     h.variety==='Classical Nahuatl'&&h.matchKind==='diacritic-variant');
    const simeon=evidence.hits.some(h=>h.sourceKey==='simeon');
    // This second bridge supplies separate possible spelling evidence, not a
    // new curated match; baseline coverage counts remain unchanged.
    if(engines.historicalVariants&&engines.archive.lookupHistoricalEvidence){
     const candidates=engines.archive.lookupHistoricalEvidence(token.value,
      engines.historicalVariants(token.value,'general'),{limit:12});
     if(candidates.total>0){
      stats.unknownWithTentativeHistoricalArchiveCandidates++;
      const prev=orthographicForms.get(key)||{form:key,occurrences:0,
       candidates:[]};
      prev.occurrences++;
      for(const hit of candidates.hits){
       if(!prev.candidates.includes(hit.matchedWritten)&&prev.candidates.length<4)
        prev.candidates.push(hit.matchedWritten);
      }
      orthographicForms.set(key,prev);
     }
    }
    const category=exact?'classical_exact':approximate?'classical_diacritic_only':
     simeon?'historical_ocr_only':'no_archive_evidence';
    const previous=categoryForms.get(key);
    if(previous&&previous!==category)throw Error('Inconsistent archival classification for '+key);
    categoryForms.set(key,category);
    categoryTotals.set(category,(categoryTotals.get(category)||0)+1);
    unknownAudit.push({written:token.value,category,
     canonicalMorphologyCandidates:engines.canonicalMorph?.(token.value)?.length||0,
     morphologyCandidates:engines.morph(token.value)?.length||0,
     sourceListedMorphologyClues:archiveClues.length,
     historicalArchivePossibility:!!(engines.historicalVariants&&
      engines.archive.lookupHistoricalEvidence?.(token.value,
       engines.historicalVariants(token.value,'general'),{limit:1}).total)});
    if(exact)stats.unknownExactClassicalArchive++;
    else if(approximate)stats.unknownOnlyApproxClassicalArchive++;
    else if(simeon)stats.unknownSimeonOcrArchive++;
    else stats.unknownNotInArchive++;
   }
  }
  const hasWindow=clauses.some(c=>c.partialSpans?.length>0);
  const structural=clauses.some(c=>structuralKeys.some(k=>c[k]?.length>0)||
   c.possessedAgreement?.items?.length>0||c.morphosyntactic?.items?.length>0)||
   !!syntactic.multiClauseProposals?.length||
   !!syntactic.sentenceGroups?.some(g=>g.analysis.multiClauseProposals?.length);
  const draft=engines.english&&engines.ir?engines.ir.auditEnglish(
   engines.english.compose(row.nahuatl,syntactic),syntactic,
   engines.ir.build(row.nahuatl,syntactic)):null;
  const full=syntactic.complete===true;
  stats.selected++;stats.nahuatlTokens+=lexical.stats.total;
  stats.curatedMatches+=lexical.stats.matched;
  stats.unknownTokens+=lexical.stats.unknown;
  stats.approximateMatches+=lexical.stats.approximate;
  stats.lexicalAmbiguousTokens+=lexical.stats.ambiguous;
  stats.sourceMorphologyUnknownTokens+=plausibleMorph;
  stats.archiveFormMorphologyUnknownTokens+=archiveFormMorph;
  if(full)stats.fullSentenceGrammarCandidates++;
  if(draft?.available)stats.draftEnglishRows++;
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
  const clauseReasons=clauses.map(c=>({wordTokens:c.tokens?.length||0,
   complete:!!c.complete,partialSpans:c.partialSpans?.length||0,
   sourceMorphologyHints:c.morphologicalClues?.length||0,
   reason:c.reason||''}));
  perRow.push({upstreamRow:row.sourceRow,work:row.work,tokens:lexical.stats.total,
   unknown:lexical.stats.unknown,grammarCandidate:full,draftEnglishAvailable:!!draft?.available,
   partialWindowPresent:hasWindow,structuralOnly:structural&&!full,
   sentenceHasQuestionMark:/[?¿]/u.test(row.nahuatl),
   sentenceHasParentheses:/[()\[\]{}<>]/u.test(row.nahuatl),
   clauses:clauseReasons,unknownAudit});
 }
 const unknown=[...unknownForms.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));
 return {format:'tlahtolli-parallel-development-diagnostic-v1',
  classification:'IN-SAMPLE DEVELOPMENT ONLY; not independent test, not translation accuracy',
  engine:'live sentence/English/IR wiring: canonical and source-linked morphology, relational locations; bilingual lookup excluded',
  inputPolicy:'Spanish paired source kept for later review; never used as model-generated gold or grammar rule',
  sampling:'SHA256-ranked within each document title, round-robin across works, de-duplicate pairs, 3-18 Nahuatl tokens',
  sourceGitBlobSha:options.sourceGitBlobSha||null,
  corpusInventory:options.inventory||null,counts:stats,
  byWork:[...byWork.values()].sort((a,b)=>a.work.localeCompare(b.work)),
  highFrequencyUnknownForms:unknown.slice(0,16).map(([form,occurrences])=>({form,occurrences})),
  tentativeHistoricalArchiveForms:[...orthographicForms.values()].sort((a,b)=>
   b.occurrences-a.occurrences||a.form.localeCompare(b.form)).slice(0,12),
  unknownCategoryTotals:Object.fromEntries([...categoryTotals.entries()].sort()),
  unknownDistinctForms:categoryForms.size,
  inspectedRowReferences:perRow,
  sourceRowsAreIndependentlySentenceVerified:false,
  individualSourceRowsMayBeNamesDatesOrFragments:true,
  accuracy:null,approvedHeldoutPairs:0,
  caveat:'Counts are mechanical lexical or grammar coverage on published development material; they are not correctness judgments. Morphological guesses remain guesses.'};
}
async function runCsv(buffer,limit=48,engines=null){
 if(!Buffer.isBuffer(buffer))throw Error('Expected source CSV bytes');
 if(buffer.length>12*1024*1024)throw Error('External CSV is above the 12 MiB bounded processing limit');
 if(gitBlobSha(buffer)!==manifest.upstream.blob_sha)
  throw Error('Pinned Axolotl blob SHA mismatch; refuses source drift');
 const rows=parseRows(buffer.toString('utf8'));
 if(rows.length!==manifest.upstream.verified_total_csv_rows)
  throw Error('Pinned Axolotl CSV row count mismatch');
 if(rows.filter(isClassical).length!==manifest.upstream.verified_classical_label_rows)
  throw Error('Pinned Classical label inventory mismatch');
 const {selected,inventory}=selectRows(rows,limit);
 const readyEngines=engines||await loadExistingEngines();
 const report=diagnose(selected,readyEngines,{inventory,
  sourceGitBlobSha:manifest.upstream.blob_sha});
 if(!report.counts.selected||report.counts.selected>limit)
  throw Error('No usable bounded corpus sample');
 return report;
}
async function main(){
 const input=process.argv[2],flagIndex=process.argv.indexOf('--limit');
 if(!input||input.startsWith('--')){
  console.error('Usage: node tools/diagnose_axolotl_development.js /local/pinned/axolotl.csv [--limit 48] [--json] [--audit-36]');
  process.exitCode=2;return;
 }
 let limit=48;
 if(flagIndex>=0){
  const value=process.argv[flagIndex+1];
  if(!/^\d{1,3}$/u.test(value||''))throw Error('Invalid --limit');
  limit=Number(value);
 }
 const report=await runCsv(fs.readFileSync(input),limit);
 if(process.argv.includes('--audit-36')){
  const observed=report.inspectedRowReferences.map(r=>r.upstreamRow);
  if(JSON.stringify(observed)!==JSON.stringify(DEVELOPMENT_36_ROW_IDS))
   throw Error('Pinned 36-row development cohort has changed: refuse incomparable audit');
 }
 if(process.argv.includes('--json'))return console.log(JSON.stringify(report,null,2));
 const c=report.counts;
 console.log('REAL AXOLOTL DEVELOPMENT SAMPLE: '+c.selected+' parallel rows across '+
  report.byWork.length+' source works');
 console.log('Pinned source blob: '+report.sourceGitBlobSha);
 console.log('Lexical tokens: '+c.nahuatlTokens+
  '; curated matches: '+c.curatedMatches+
  '; unknown: '+c.unknownTokens+'; approximate: '+c.approximateMatches+
  '; multiple-entry ambiguity: '+c.lexicalAmbiguousTokens);
 console.log('Unknown tokens with canonical morphology proposals (NOT verified): '+
  c.sourceMorphologyUnknownTokens);
 console.log('Unknown tokens with unreviewed Classical archive-form grammatical labels: '+
  c.archiveFormMorphologyUnknownTokens+' (may overlap; NOT curated recognition)');
 console.log('Unrecognized curated tokens with exact Classical archive evidence: '+
  c.unknownExactClassicalArchive+'; approximate Classical archive: '+
  c.unknownOnlyApproxClassicalArchive+'; Siméon OCR only: '+
  c.unknownSimeonOcrArchive+'; not found in archive: '+c.unknownNotInArchive);
 console.log('Full grammar candidates: '+c.fullSentenceGrammarCandidates+
  '; audited draft English rows: '+c.draftEnglishRows+
  '; partial grammar windows: '+c.partialGrammarWindowRows+
  '; conditional structural analysis: '+c.conditionalStructuralRows+
  '; unresolved sentences: '+c.unresolvedSentenceRows);
 console.log('Additional unverified historical spelling candidates with exact Classical archive evidence: '+
  c.unknownWithTentativeHistoricalArchiveCandidates+' unknown-token occurrences; examples: '+
  report.tentativeHistoricalArchiveForms.map(x=>x.form+' → '+x.candidates.join('/')+
   ' ('+x.occurrences+')').join(', '));
 console.log('Source-record unit warning: no row certified as a complete linguistic sentence; short name/date fragments may occur.');
 console.log('Distinct unknown spellings: '+report.unknownDistinctForms+
  '; category occurrence totals: '+JSON.stringify(report.unknownCategoryTotals));
 if(process.argv.includes('--audit-36'))for(const p of report.inspectedRowReferences){
  console.log('ROW AUDIT '+p.upstreamRow+' | '+p.work+' | '+p.tokens+' tokens, '+
   p.unknown+' unknown; clauses='+p.clauses.map(c=>c.wordTokens).join('/')+
   '; punctuationBlocks='+Number(p.sentenceHasQuestionMark)+'/'+Number(p.sentenceHasParentheses)+
   '; unknown='+p.unknownAudit.map(t=>t.written+':'+t.category+
    (t.morphologyCandidates?':M'+t.morphologyCandidates:'')+
    (t.sourceListedMorphologyClues?':A'+t.sourceListedMorphologyClues:'')+
    (t.historicalArchivePossibility?':H':'')).join(', '));
 }
 console.log('High-frequency unknown surface forms: '+
  report.highFrequencyUnknownForms.map(x=>x.form+' ('+x.occurrences+')').join(', '));
 for(const w of report.byWork)
  console.log('WORK '+w.work+': '+w.rows+' rows, lexical '+w.matched+'/'+w.tokens+
   ', full-grammar '+w.grammarCandidates+', partial-windows '+w.partialWindowRows);
 console.log('Translation accuracy: NOT MEASURED; no train/test use or copied bilingual sentences.');
}
if(require.main===module){
 main().catch(e=>{console.error('ERROR: '+e.message);process.exitCode=1;});
}
module.exports={selectRows,loadExistingEngines,diagnose,runCsv};
