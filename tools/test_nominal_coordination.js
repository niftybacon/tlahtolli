'use strict';
// Noun coordination: productive documented forms, but no fabricated clause
// translation, subject/object role, number agreement or historical attestation.
const assert=require('node:assert/strict'),fs=require('node:fs');
const path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..');
const read=n=>fs.readFileSync(path.join(root,n),'utf8');
const data=n=>JSON.parse(read(n));
const dictionary=data('dictionary.json'),paradigms=data('paradigms.json');
const passages=data('data/passages.json'),sourceFinite=data('data/source_finite_context.json');
const grammar=data('data/clause_grammar.json'),poss=data('data/possessed_form_evidence.json');
const ctx={window:{},URL,words:dictionary.words,
 FULL_VERB_PARADIGMS:paradigms.paradigms,VERB_TENSES:paradigms.patterns,
 norm:s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(),
 stripToken:s=>String(s).replace(/^[^\p{L}\p{M}]+|[^\p{L}\p{M}]+$/gu,'').toLowerCase(),
 historicalSpellings:w=>String(w.original||'').split(/[;,/]+/).map(x=>x.trim()).filter(Boolean),
 safe:x=>String(x),validUrl:x=>x,safeLink:(a,b)=>b};
vm.runInNewContext(read('tools/morphology_engine.js').split(
 'renderMorphologyBreakdown=TlahtolliMorphEngine.html;')[0]+
 '\nthis.canonicalMorph=TlahtolliMorphEngine;',ctx);
for(const f of ['translator-sentence.js','translator-grammar-ir.js','translator-english.js'])
 vm.runInNewContext(read(f),ctx);
const morph=t=>ctx.canonicalMorph.analyze(t);
const make=(doc=dictionary,corpus=passages)=>
 ctx.window.TlahtolliSentence.create(doc,paradigms,morph,{entries:[]},
 null,grammar,poss,sourceFinite,corpus);
const sentence=make(),ir=ctx.window.TlahtolliGrammarIR.create(dictionary,passages);
const english=ctx.window.TlahtolliEnglish.create(sentence);
function checked(input,expectedHeads,witness=false){
 const res=sentence.analyze(input),cl=res.clauses[0];
 assert.equal(res.complete,false,'Nominal phrase must not be promoted to full clause');
 assert.equal(cl.candidates.length,0,'No fabricated finite candidate');
 assert.equal(cl.nominalCoordinationProposals.length,1,input);
 const p=cl.nominalCoordinationProposals[0],g=ir.build(input,res);
 assert.equal(p.coverage,cl.tokens.length,'No silently dropped written words');
 assert.equal(p.nouns.map(h=>h.headword).join('|'),expectedHeads.join('|'));
 assert.equal(p.sourceWindow!==null,witness,'Only exact editorial window is attested');
 assert(p.note.includes('no English sentence is licensed'));
 assert(p.connector.meaningAlternatives.includes('together with'));
 assert(p.sources.length>=3&&p.sources.every(u=>u.startsWith('https://')));
 assert.equal(english.compose(input,res).available,false);
 assert.equal(g.alternatives.length,1,'Shared IR must accept sourced NP alternative');
 assert.equal(g.counts.nominalCoordinations,1);
 assert.equal(g.nodes.filter(n=>n.kind==='coordinated-noun-head').length,2);
 assert.equal(g.edges.filter(e=>e.relation==='possible-coordinated-noun-member').length,2);
 assert(g.edges.every(e=>e.notIdentity===true));
 assert(!g.nodes.some(n=>n.kind==='finite-predicate'));
 assert(g.nodes.filter(n=>n.kind==='coordinated-noun-head').every(n=>
  n.grammaticalRole===null&&n.number===null&&n.referentId===null));
 return {res,p,g};
}
const hist=checked('xochitl, ioan tlapalli',['xōchitl','tlapalli'],true);
assert.equal(hist.p.sourceWindow.passageId,'passage-3');
for(const input of [
 'xōchitl īhuān tlapalli',
 'xōchitl ihuan tlapalli',
 'xōchitl yhuan tlapalli',
 'xōchitl iuan tlapalli'
 ])checked(input,['xōchitl','tlapalli']);
for(const input of [
 'in cihuātl īhuān in conetl',
 'in cihuātl ihuan in conetl',
 'cihuātl yhuan conetl',
 'in cihuātl iuan conetl',
 'cihuātl īhuān in conetl',
 'in cihuātl īhuān conetl'
 ])checked(input,['cihuātl','conetl']);
// The historic spelling cannot be distributed to an unattested noun pair.
const refused=[
 'tlapalli, ioan xochitl','cihuātl ioan conetl',
 'xochitl ioan conetl','ioan xochitl tlapalli',
 'xochitl īhuān unknown','unknown īhuān tlapalli',
 'xochitl ihuan','ihuan xochitl','xochitl ihuan tlapalli extra',
 'in cihuātl in ihuan in conetl','in cihuātl ihuan unknown',
 'xochitl; ioan tlapalli','cihuātl īhuān conetl,',
 'ahmo xochitl īhuān tlapalli',
 'ninemi ihuan nichōca','cihuah ihuan cōconeh',
 'xochitl ihuan tlapalli ihuan conetl'
];
for(const input of refused)assert.equal(
 sentence.analyze(input).clauses[0].nominalCoordinationProposals?.length||0,0,
 'Unsupported spelling, attachment or words must abstain: '+input);
const invalidCorpora=[
 {...passages,records:[]},
 {...passages,records:passages.records.map(r=>r.id==='passage-3'?
  {...r,original:r.original.replace('xochitl, ioan tlapalli','xochitl, ihuan tlapalli')}:r)},
 {...passages,records:passages.records.map(r=>r.id==='passage-3'?
  {...r,train_eligible:true}:r)},
 {...passages,records:passages.records.map(r=>r.id==='passage-3'?
  {...r,reading_status:'verified_gold'}:r)},
 {...passages,records:passages.records.map(r=>r.id==='passage-3'?
  {...r,reader:{...r.reader,source:'https://example.org/forged'}}:r)}
];
for(const [i,corpus] of invalidCorpora.entries()){
 assert.equal(make(dictionary,corpus).analyze('xochitl, ioan tlapalli')
  .clauses[0].nominalCoordinationProposals.length,0,'Corpus forgery '+i);
 assert.equal(make(dictionary,corpus).analyze('in cihuātl īhuān in conetl')
  .clauses[0].nominalCoordinationProposals.length,1,
  'General dictionary forms must not depend on one Florentine passage');
}
for(const lemma of ['īhuān','in','cihuātl','conetl']){
 const doc={...dictionary,words:dictionary.words.filter(w=>w.word!==lemma)};
 assert.equal(make(doc).analyze('in cihuātl īhuān in conetl')
  .clauses[0].nominalCoordinationProposals.length,0,'Missing cited '+lemma);
}
const full='injn itoca itech qujça xochitl, ioan tlapalli';
const res=sentence.analyze(full),partial=res.clauses[0].partialSpans||[];
assert(!res.complete);
assert(partial.some(x=>x.start===4&&x.end===7&&
 x.families.includes('nominal-coordination')),
 'Historical 7-token excerpt should expose additional NP coordination at words 5–7');
assert(partial.some(x=>x.start===2&&x.end===5&&
 x.families.includes('source-finite')),
 'Existing source-finite evidence at words 3–5 must remain');
assert.equal(english.compose(full,res).available,false);
const sentenceGraph=ir.build(full,res);
assert.equal(sentenceGraph.alternatives.length,0,
 'Two overlapping partial spans cannot become a fictitious complete clause');
assert(sentenceGraph.counts.partialSpans>=2);
for(const tamper of [
 p=>{p.connector.source='https://example.org/forged';},
 p=>{p.connector.selectedMeaning='and';},
 p=>{p.connector.written='ihuan';},
 p=>{p.connector.tokenIndex=0;},
 p=>{p.nouns[0].headword='conetl';},
 p=>{p.nouns[0].headSource='https://example.org/forged';},
 p=>{p.nouns[1].tokenIndex=0;},
 p=>{p.sourceWindow.passageId='passage-2';},
 p=>{p.sourceWindow.status='verified gold';},
 p=>{p.sources=['https://example.org/forged'];}
]){
 const broken=JSON.parse(JSON.stringify(hist.res));
 tamper(broken.clauses[0].nominalCoordinationProposals[0]);
 assert.equal(ir.build('xochitl, ioan tlapalli',broken).counts.nominalCoordinations,0,
  'Forged noun-coordination evidence must be rejected');
}
const controlled='niquittaz in cihuātl';
const c=sentence.analyze(controlled);
assert.equal(c.complete,true,'No change to indexed finite grammar');
assert.equal(english.render(english.compose(controlled,c)),'I will see the woman.');
console.log('PASS nominal coordination: 11 positive phrases, 17 unsupported inputs, 5 hostile corpora, missing-source tests, 10 forged-IR cases, full historical passage dual-window coverage without invented English.');
