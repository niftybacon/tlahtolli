'use strict';
// Invariants for sentence diagnostics, not a target accuracy score.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const d=require('./diagnose_historical_sentences.js');
const ROOT=path.join(__dirname,'..');
const corpus=JSON.parse(fs.readFileSync(path.join(ROOT,'data/passages.json'),'utf8'));
const review=JSON.parse(fs.readFileSync(path.join(ROOT,'research/translation_corpus/source_reviews/ENL_BC16_1573.json'),'utf8'));
const rows=d.provenanceRows(corpus,review);
assert.equal(rows.length,9,'Eight cited edited passages plus one nonblind 1573 excerpt');
assert(!rows.some(r=>r.original==='in xochitl in cuicatl'),'Unsourced teaching formula is not attested evidence');
assert(rows.every(r=>r.trainingEligible===false&&r.independentGold===false));
assert(rows.every(r=>/^https?:\/\//.test(r.source)&&r.provenance));
assert.equal(new Set(rows.map(r=>r.id)).size,rows.length);
const report=d.run();
assert.equal(report.totalExcerpts,rows.length);
assert.equal(report.translationAccuracy,null);
assert.equal(report.independentGold,false);
assert.equal(report.trainEligible,false);
assert(report.passages.every(r=>r.originalAnalysis.tokenCount>0));
assert(report.passages.every(r=>r.originalAnalysis.tokenCount>=r.originalAnalysis.headwordMatched));
assert(report.passages.every(r=>r.originalAnalysis.englishDraftAvailable===
  (typeof r.originalAnalysis.englishDraft==='string'&&r.originalAnalysis.englishDraft.length>0)));
assert.equal(Object.values(report.counts).some(x=>!Number.isInteger(x)),false);
assert.equal(report.counts.englishDraftAvailable,report.passages.filter(r=>r.originalAnalysis.englishDraftAvailable).length);
assert(report.passages.some(r=>r.originalAnalysis.fullyCoveredByHeadwordLookup&&
 !r.originalAnalysis.englishDraftAvailable),
 'Must reveal structural gaps distinct from lexical lookup misses');
assert(report.passages.some(r=>r.originalAnalysis.unknownHeadwordTokens.length>0));
assert(report.passages.some(r=>r.editorialNormalizationComparison!==null));
for(const r of report.passages)if(r.normalized?.includes('['))
 assert.equal(r.editorialNormalizationComparison,null,'Bracketed editorial conjectures are not tokens');
const enl=report.passages.find(p=>p.sourceFamily==='Early Nahuatl Library');
assert(enl&&enl.original==='ticnamaca y¯ totlal');
assert(enl.originalAnalysis.proposalCounts.some(p=>p.agreementProposals>=2),
 'The source-graded ambiguity of ticnamaca must survive in a bounded argument proposal');
assert.equal(enl.originalAnalysis.englishDraftAvailable,false);
const model=d.loadModels();
const invented=d.analyzeText('nichōca totally-unattested',model);
assert.equal(invented.englishDraftAvailable,false,'No unknown material may disappear into English');
const unproven={...corpus,records:[{...corpus.records[1],id:'unproven',reader:{source:'Teaching example'},translator:null,close_readings:[]}]};
assert.equal(d.provenanceRows(unproven,null).length,0,'Do not include passage without a real source locator');
console.log('PASS historical sentence diagnostics: '+report.totalExcerpts+
 ' source-located editorial excerpts, nonblind ENL ambiguity, normalized-reading distinction,'+
 ' explicit non-gold status, lexical/grammar split, no fabricated accuracy.');
