'use strict';
// Phase 1/6 source-evidence conservation regression (not human semantic Gold).
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const d=JSON.parse(read('dictionary.json')),p=JSON.parse(read('paradigms.json'));
const ctx={window:{},words:d.words,FULL_VERB_PARADIGMS:p.paradigms,VERB_TENSES:p.patterns,
 norm:s=>String(s||'').normalize('NFC').toLowerCase(),
 stripToken:s=>String(s||'').replace(/^[^\p{L}\p{M}]+|[^\p{L}\p{M}]+$/gu,''),
 historicalSpellings:w=>String(w.original||'').split(/[;,/]+/).map(x=>x.trim()).filter(Boolean),
 safe:String,validUrl:()=>true,safeLink:()=>''};
vm.createContext(ctx);
vm.runInContext(read('tools/morphology_engine.js').split(
 'renderMorphologyBreakdown=TlahtolliMorphEngine.html;')[0]+
 '\nthis.morph=TlahtolliMorphEngine;',ctx);
for(const file of ['translator-sentence.js','translator-english.js','translator-grammar-ir.js'])
 vm.runInContext(read(file),ctx,{filename:file});
const sentence=ctx.window.TlahtolliSentence.create(d,p,t=>ctx.morph.analyze(t));
const english=ctx.window.TlahtolliEnglish.create(sentence);
const ir=ctx.window.TlahtolliGrammarIR.create(d,null,p,sentence);
const clone=x=>JSON.parse(JSON.stringify(x));
const observe=(input,engine=ir,analysis=sentence.analyze(input))=>{
 const graph=engine.build(input,analysis);
 return {analysis,graph,observations:graph.nodes.filter(n=>
  n.kind==='source-possessed-form-observation')};
};
const positives=[
 'noyollo','noyollo yehua','In can on nemian noyollo yehua?',
 'Macazo tleon xoconyoyocoya ti noyollo, yehua cuix ic nepohualoyan',
 'quen conchihuaz noyollo yehua onentacico',
 'noyollo noyollo yehua','noyollo,','noyollo, yehua'
];
for(const input of positives){
 const {analysis,graph,observations}=observe(input);
 const expected=(input.match(/\bnoyollo\b/gu)||[]).length;
 assert.equal(observations.length,expected,'Exact observed token count: '+input);
 assert.equal(graph.counts.sourcePossessedFormObservations,expected);
 assert(observations.every(o=>o.originalWrittenToken===(input.includes('noyollo,')?'noyollo,':'noyollo')&&o.lemma==='yollotl'&&
   o.possessionHypothesis==='1sg'&&o.morphologyGrade==='unreviewed'&&
   o.grammaticalRole===null&&o.referentId===null&&
   o.antecedentResolved===false&&o.contextualSenseResolved===false&&
   o.englishAvailable===false));
 assert.equal(graph.counts.nominalMentions,0,
  'A morphology-only proposal is NOT a resolved nominal grammatical argument');
 assert(graph.edges.filter(e=>e.relation==='contains-unresolved-source-morphology')
  .length===expected);
 assert.equal(analysis.complete,false);
 assert.equal(english.compose(input,analysis).available,false,
  'No historical phrase automatically receives English');
 assert.equal(graph.alternatives.length,0,'No invented grammatical alternative');
}
for(const input of [
 'noyōllo','noyöllo','nōyollo','moyollo','iyollo',
 'noyollotl','noyolloya','noyollo-yehua','noyolloyehua',
 'antepilhuan','huiya','nichōca','xyzzy','noyollo,,',
 'in noyōllo yehua','noyollox yehua'
]){
 assert.equal(observe(input).observations.length,0,
  'No analogous, malformed or punctuated candidate promoted: '+input);
}
// No independent source-check means no change to the shared graph.
const noSentenceModel=ctx.window.TlahtolliGrammarIR.create(d);
assert.equal(observe('noyollo yehua',noSentenceModel).observations.length,0);
// Forged provenance/role or token clobbering never enters IR.
const original=sentence.analyze('noyollo yehua');
const corruptions=[
 a=>{a.clauses[0].morphologicalClues.find(c=>c.kind.includes('Exact Brinton')).grade='manuscript';},
 a=>{a.clauses[0].morphologicalClues.find(c=>c.kind.includes('Exact Brinton')).source='https://example.org/forged';},
 a=>{a.clauses[0].morphologicalClues.find(c=>c.kind.includes('Exact Brinton')).features.possessor='3sg';},
 a=>{a.clauses[0].morphologicalClues.find(c=>c.kind.includes('Exact Brinton')).features.contextualHeartSoulIntentionSenseResolved=true;},
 a=>{a.clauses[0].morphologicalClues.find(c=>c.kind.includes('Exact Brinton')).index=1;},
 a=>{a.clauses[0].tokens[0]='moyollo';},
 a=>{a.clauses[0].morphologicalClues.find(c=>c.kind.includes('Exact Brinton')).parts[0].surface='mo';}
];
for(const corrupt of corruptions){
 const fake=clone(original);corrupt(fake);
 assert.equal(observe('noyollo yehua',ir,fake).observations.length,0);
}
const sourceDestroyed=clone(d);
sourceDestroyed.words.find(w=>w.word==='yollotl').possessed='-other';
const forged=ctx.window.TlahtolliGrammarIR.create(sourceDestroyed,null,p,sentence);
assert.equal(observe('noyollo yehua',forged).observations.length,0);
// Existing supported grammatical English and its IR checks are unchanged.
for(const [original,expected] of [
 ['nichōca','I cry.'],['niquitta in cihuātl','I see the woman.'],
 ['antepilhuan',"You (plural) are someone's children."]
]){
 const a=sentence.analyze(original),graph=ir.build(original,a);
 const composed=ir.auditEnglish(english.compose(original,a),a,graph);
 assert.equal(composed.available,true,original);
 assert.equal(english.render(composed),expected,original);
 assert.equal(graph.counts.sourcePossessedFormObservations,0);
}
console.log('PASS: 8 Brinton/constructed original-word contexts (including editorial comma), 16 refusal contexts, 7 injected-evidence controls, unchanged existing English; zero invented translation.');
