#!/usr/bin/env node
'use strict';
// Read-only development coverage audit; no copied bilingual source passages.
// All samples are source-byte pinned; no translation accuracy inference.
const fs=require('node:fs'),assert=require('node:assert/strict');
const {loadExistingEngines,runCsv}=require('./diagnose_axolotl_development.js');
const {run:historical}=require('./diagnose_historical_sentences.js');
async function main(){
 const path=process.argv[2];
 if(!path)throw Error('Usage: node tools/diagnose_translation_coverage_batch.js /path/to/pinned/axolotl.csv');
 const bytes=fs.readFileSync(path);
 const engines=await loadExistingEngines();
 const sizes=[36,48,96,200];
 let expected36=null;
 for(const limit of sizes){
  const r=await runCsv(bytes,limit,engines);
  const c=r.counts;
  assert.equal(c.nahuatlTokens,c.curatedMatches+c.unknownTokens,'Token conservation');
  assert.equal(c.unknownTokens,
   c.unknownExactClassicalArchive+c.unknownOnlyApproxClassicalArchive+
   c.unknownSimeonOcrArchive+c.unknownNotInArchive,'Unknown category conservation');
  const unknowns=r.inspectedRowReferences.flatMap(x=>x.unknownAudit.map(y=>({...y,row:x.upstreamRow,work:x.work})));
  const canonicalMorphUnknown=unknowns.filter(x=>x.canonicalMorphologyCandidates>0);
  const anyMorphUnknown=unknowns.filter(x=>x.morphologyCandidates>0);
  const stats={
   selected:c.selected,works:r.byWork.length,tokens:c.nahuatlTokens,
   recognized:c.curatedMatches,recognizedPct:Math.round(1000*c.curatedMatches/c.nahuatlTokens)/10,
   unknown:c.unknownTokens,
   unknownCategories:{
    exactClassical:c.unknownExactClassicalArchive,
    diacriticOnly:c.unknownOnlyApproxClassicalArchive,
    SimeonOcrOnly:c.unknownSimeonOcrArchive,
    noArchive:c.unknownNotInArchive
   },
   unknownWithCanonicalMorph:canonicalMorphUnknown.length,
   unknownWithAnyMorph:anyMorphUnknown.length,
   morphologicalCandidateOccurrences:c.sourceMorphologyUnknownTokens,
   archiveFormMorphologyUnknown:c.archiveFormMorphologyUnknownTokens,
   partialGrammarRows:c.partialGrammarWindowRows,
   structuralOnlyRows:c.conditionalStructuralRows,
   fullGrammarRows:c.fullSentenceGrammarCandidates,
   EnglishDraftRows:c.draftEnglishRows,
   noCuratedTokensRows:r.inspectedRowReferences.filter(x=>x.unknown===x.tokens).length,
   zeroUnknownRows:r.inspectedRowReferences.filter(x=>x.unknown===0).length,
   questionMarkRows:r.inspectedRowReferences.filter(x=>x.sentenceHasQuestionMark).length,
   percentRowsUnresolved:Math.round(1000*c.unresolvedSentenceRows/c.selected)/10,
   highFrequencyUnknown:r.highFrequencyUnknownForms.slice(0,12),
   examplesOfMorphologyOnly:canonicalMorphUnknown.slice(0,16).map(x=>({written:x.written,category:x.category,canonicalMorphologyCandidates:x.canonicalMorphologyCandidates})),
   topWorkCoverage:r.byWork
    .map(x=>({work:x.work,rows:x.rows,recognized:x.matched,tokens:x.tokens,pct:Math.round(1000*x.matched/x.tokens)/10}))
    .sort((a,b)=>b.pct-a.pct).slice(0,5),
   bottomWorkCoverage:r.byWork
    .map(x=>({work:x.work,rows:x.rows,recognized:x.matched,tokens:x.tokens,pct:Math.round(1000*x.matched/x.tokens)/10}))
    .sort((a,b)=>a.pct-b.pct).slice(0,5)
  };
  if(limit===36){
   assert.equal(c.nahuatlTokens,365,'Pinned historical development-36 sample changed');
   expected36=stats;
  }
  console.log('DIAGNOSTIC '+limit+' '+JSON.stringify(stats));
 }
 const h=historical();
 console.log('HISTORICAL_EDITORIAL '+JSON.stringify({counts:h.counts,total:h.totalExcerpts,accuracy:h.translationAccuracy,
  perPassage:h.passages.map(x=>({
   id:x.id,tokens:x.originalAnalysis.tokenCount,headwords:x.originalAnalysis.headwordMatched,
   finite:x.originalAnalysis.finiteCandidates,
   grammarAlternatives:x.originalAnalysis.grammarAlternatives,
   status:x.originalAnalysis.status,
   missing:x.originalAnalysis.unknownHeadwordTokens.slice(0,8)
  }))}));
 console.log('POLICY '+JSON.stringify({source:'Pinned published Axolotl development corpus',sourceBlobSha:(
  await runCsv(bytes,36,engines)).sourceGitBlobSha,
  heldOutGold:0,translationAccuracy:null,sourceTextStored:false,
  note:'Metrics concern retrieval and grammar proposals, not semantic translation accuracy. Editorial fragments are not certified sentences.'}));
}
main().catch(e=>{console.error(e.stack||e);process.exit(1)});
