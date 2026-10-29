#!/usr/bin/env node
'use strict';
// Development diagnostics on source-located EDITORIAL excerpts, not a gold benchmark.
// No source sentence is treated as expert-certified; do not report translation accuracy.
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ROOT=path.resolve(__dirname,'..');
const read=filename=>fs.readFileSync(path.join(ROOT,filename),'utf8');
const json=filename=>JSON.parse(read(filename));
const truthyList=x=>Array.isArray(x)?x:[];
function provenanceRows(passages,review){
 const rows=[];
 for(const p of truthyList(passages.records)){
  // The poetic formula without an identified source occurrence is NOT an attested passage.
  if(p.reading_status!=='edited_transcription_candidate'||p.train_eligible!==false)continue;
  const source=p.reader?.source||p.translator?.source_url||p.close_readings?.[0]?.source_url;
  if(typeof source!=='string'||!/^https?:\/\//.test(source))continue;
  const context=p.translator?.passage_type||p.close_readings?.[0]?.type||p.reader?.title||'excerpt; clause status unreviewed';
  const original=String(p.original||'');
  if(!original||original.length>500)continue;
  rows.push({id:p.id,source,sourceFamily:source.includes('florentinecodex')?'Florentine Codex':'historical edited citation',
   original,normalized:typeof p.normalized==='string'?p.normalized:null,
   editorialKind:context,provenance:'edited transcription candidate; not a certified diplomatic line',
   trainingEligible:false,independentGold:false});
 }
 if(review?.format==='tlahtolli-source-review-v1'&&review.train_eligible===false&&
    review.evaluation_eligible===false&&review.knowledge_contamination?.independent_test_eligible===false){
  const original=review.image_inspection?.minimum_assisted_excerpt;
  if(typeof original==='string'&&original.trim()&&/^https?:\/\//.test(review.library_record_url||'')){
   rows.push({id:review.id,source:review.library_record_url,sourceFamily:'Early Nahuatl Library',
    original,normalized:null,editorialKind:'published-transcription-assisted manuscript excerpt',
    provenance:'source transcription and reference translation already consulted; not independently transcribed',
    trainingEligible:false,independentGold:false});
  }
 }
 return rows;
}
function createModels(files){
 const scope={window:{},URL};
 for(const file of ['translator-engine.js','translator-locative.js','translator-source-morphology.js',
  'translator-sentence.js','translator-english.js','translator-grammar-ir.js'])
  vm.runInNewContext(files[file],scope,{filename:file});
 const api=scope.window,dictionary=JSON.parse(files['dictionary.json']);
 const examples=JSON.parse(files['research/translation_corpus/research_examples.json']);
 const sourceReview=JSON.parse(files['research/translation_corpus/source_reviews/ENL_BC16_1573.json']);
 const canonicalSource=api.TlahtolliSourceMorphology.create(sourceReview);
 const lexical=api.TlahtolliTranslator.create(dictionary,examples);
 const locative=api.TlahtolliLocative.create(dictionary,examples);
 // Source-reviewed exact-token adapter only: browser's embedded Tēntli supplementary
 // morphology is not available in this Node diagnostic. Clause rules and indexed
 // paradigms ARE loaded. Do not call this a complete browser morphology test.
 const sentence=api.TlahtolliSentence.create(dictionary,JSON.parse(files['paradigms.json']),
  token=>canonicalSource.analyze(token),examples,locative,JSON.parse(files['data/clause_grammar.json']),
  JSON.parse(files['data/possessed_form_evidence.json']));
 return {lexical,sentence,english:api.TlahtolliEnglish.create(sentence),
  graph:api.TlahtolliGrammarIR.create(dictionary),sourceMorphology:canonicalSource};
}
const MODEL_FILES=[
 'dictionary.json','paradigms.json','translator-engine.js','translator-locative.js',
 'translator-source-morphology.js','translator-sentence.js','translator-english.js',
 'translator-grammar-ir.js','data/clause_grammar.json','data/possessed_form_evidence.json',
 'research/translation_corpus/research_examples.json',
 'research/translation_corpus/source_reviews/ENL_BC16_1573.json'];
function loadModels(){return createModels(Object.fromEntries(MODEL_FILES.map(f=>[f,read(f)])));}
const proposalCounts=clause=>Object.fromEntries(Object.entries(clause||{})
 .filter(([key,value])=>key.endsWith('Proposals')&&Array.isArray(value)&&value.length>0)
 .map(([key,value])=>[key,value.length]));
function analyzeText(input,models){
 const lexical=models.lexical.analyze(input,'nh-en');
 const syntax=models.sentence.analyze(input);
 const wording=models.english.compose(input,syntax);
 const graph=models.graph.build(input,syntax);
 const clauses=truthyList(syntax.clauses);
 const tokens=truthyList(lexical.parts).filter(p=>p.kind==='word');
 const unknown=tokens.filter(t=>t.status==='unknown').map(t=>t.value);
 const proposals=clauses.map(proposalCounts);
 const graphAlt=truthyList(graph.alternatives).length;
 const structured=graphAlt>0||proposals.some(x=>Object.keys(x).length>0);
 const finiteCandidates=clauses.reduce((n,c)=>n+truthyList(c.candidates).length,0);
 const status=wording.available?'english-draft-unverified':
  structured?'structural-proposals-no-english':
  unknown.length===0?'lexical-headwords-covered-no-composition':
  'lexical-headword-gaps-and-no-composition';
 return {tokenCount:tokens.length,headwordMatched:tokens.length-unknown.length,
  unknownHeadwordTokens:unknown,fullyCoveredByHeadwordLookup:tokens.length>0&&!unknown.length,
  finiteCandidates,fullFiniteClauseAnalysis:syntax.complete===true,
  grammarAlternatives:graphAlt,grammarNodes:truthyList(graph.nodes).length,
  proposalCounts:proposals,englishDraftAvailable:wording.available===true,
  // Diagnostic illustration ONLY: never compare automatically with an editorial reference.
  englishDraft:wording.available?models.english.render(wording):null,
  englishRefusal:wording.available?null:wording.reason||'No supported wording',
  clauseReasons:clauses.map(c=>c.reason).filter(Boolean),status};
}
function diagnose(rows,models){
 const out=[];
 for(const row of rows){
  const original=analyzeText(row.original,models);
  // This is explicitly an EDITORIAL spelling experiment. Bracketed hypotheses
  // in canonical normalized fields must never be submitted as genuine words.
  const comparable=typeof row.normalized==='string'&&row.normalized!==row.original&&
   !/[\[\]]/u.test(row.normalized)&&row.normalized.trim().length>0;
  const normalized=comparable?analyzeText(row.normalized,models):null;
  out.push({...row,originalAnalysis:original,
   editorialNormalizationComparison:normalized,
   normalizationKind:normalized?'editorial-only; NOT original manuscript text':null});
 }
 const all=out.map(r=>r.originalAnalysis);
 const tally=name=>all.filter(r=>r.status===name).length;
 return {format:'tlahtolli-historical-sentence-diagnostics-v1',
  evaluatedVersion:'current local checkout; no independent manuscript validation',
  corpusStatus:'already inspected development material only; never held-out gold',
  modelScope:'curated lexical lookup + indexed sentence grammar + exact ENL morphology + relational parser + English composer + grammar IR; excludes standalone embedded Tēntli supplementary morphology',
  translationAccuracy:null,trainEligible:false,independentGold:false,
  totalExcerpts:out.length,
  counts:{englishDraftAvailable:all.filter(r=>r.englishDraftAvailable).length,
   fullFiniteClauseAnalysis:all.filter(r=>r.fullFiniteClauseAnalysis).length,
   fullLexicalHeadwordCoverage:all.filter(r=>r.fullyCoveredByHeadwordLookup).length,
   structurallyProposedNoEnglish:tally('structural-proposals-no-english'),
   lexicalCoverageNoEnglish:tally('lexical-headwords-covered-no-composition'),
   lexicalAndSyntaxGap:tally('lexical-headword-gaps-and-no-composition')},
  passages:out};
}
function print(report){
 const x=report.counts;
 console.log('Historical excerpt diagnostics (development-only): '+report.totalExcerpts+
  ' source-located editorial excerpts; '+x.englishDraftAvailable+' English drafts (unverified).');
 console.log('Full lexical headword coverage: '+x.fullLexicalHeadwordCoverage+
  '; structure without English: '+x.structurallyProposedNoEnglish+
  '; lexical-full yet uncomposed: '+x.lexicalCoverageNoEnglish+
  '; lexical+syntax gap: '+x.lexicalAndSyntaxGap+'.');
 for(const p of report.passages){
  const a=p.originalAnalysis;
  console.log('\n'+p.id+' ['+p.sourceFamily+'] '+p.original);
  console.log('  '+a.status+' | headwords '+a.headwordMatched+'/'+a.tokenCount+
   ' | grammar alternatives '+a.grammarAlternatives+
   ' | finite '+a.finiteCandidates+' | draft '+(a.englishDraft||'none'));
  if(a.unknownHeadwordTokens.length)console.log('  headword lookup misses: '+a.unknownHeadwordTokens.join(', '));
  if(p.editorialNormalizationComparison)
   console.log('  editorial normalization only: '+p.normalized+
    ' | headwords '+p.editorialNormalizationComparison.headwordMatched+
    '/'+p.editorialNormalizationComparison.tokenCount+
    ' | '+p.editorialNormalizationComparison.status);
 }
 console.log('\nAccuracy NOT MEASURED. These are edited, previously studied excerpts, many are fragments.');
}
function run(){
 const models=loadModels();
 const passages=json('data/passages.json');
 const review=json('research/translation_corpus/source_reviews/ENL_BC16_1573.json');
 return diagnose(provenanceRows(passages,review),models);
}
if(require.main===module){
 const report=run();
 if(process.argv.includes('--json'))process.stdout.write(JSON.stringify(report,null,2)+'\n');
 else print(report);
}
module.exports={provenanceRows,createModels,analyzeText,diagnose,loadModels,run};
