/* Finite in-subordinates with overt noun arguments, using the SAME
 * declarative grammar as independent clauses. Synthetic morphology is NOT
 * a historical attestation or validated English translation.
 * Run: node tools/test_subordinate_clause_arguments.js
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),scope={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'translator-sentence.js'),'utf8'),scope);
vm.runInNewContext(fs.readFileSync(path.join(root,'translator-grammar-ir.js'),'utf8'),scope);
const url='https://example.org/synthetic-grammar-fixture';
const words=['cihuātl','tlācatl'].map(word=>({
 word,pos:'noun',meaning:word,variety:'Classical Nahuatl',source:url
})).concat(['nemi','chōca','mati','itta'].map(word=>({
 word,pos:'verb',meaning:word,variety:'Classical Nahuatl',source:url
}));
const dictionary={words};
const paradigms={paradigms:Object.fromEntries(
 ['nemi','chōca','mati','itta'].map(lemma=>[lemma,{
  trans:['mati','itta'].includes(lemma),lemmaSource:url,
  cells:[Array.from({length:6},(_,i)=>lemma+'-fixture-'+i),[],[],[]]
 }]))};
const v=(lemma,person=2)=>lemma+'-fixture-'+person;
const analyze=scope.window.TlahtolliSentence.create(dictionary,paradigms,()=>[],null,null).analyze;
const ir=scope.window.TlahtolliGrammarIR.create(dictionary);
const terminal=text=>{
 const result=analyze(text),clause=result.clauses[0];
 assert.equal(result.complete,false,'No composed subordinate is verified English: '+text);
 assert.equal(clause.candidates.length,0);
 const proposals=clause.nestedInProposals.filter(x=>x.terminal.kind==='finite-with-arguments');
 for(const p of proposals){
  assert.equal(p.coverage,text.split(/\s+/u).length);
  assert(p.sources.includes(url));
  assert(p.note.includes('no independently verified English'));
  assert(!('english' in p));
 }
 return {result,proposals};
};
const subject=terminal(v('mati',0)+' in '+v('chōca')+' in cihuātl');
assert.equal(subject.proposals.length,1);
assert.equal(subject.proposals[0].depth,1);
assert.equal(subject.proposals[0].terminal.subjectArgument.lemma,'cihuātl');
assert.equal(subject.proposals[0].terminal.objectArgument,null);
assert.equal(subject.proposals[0].terminal.predicate.subjectPerson,'3sg');
const pre=terminal(v('mati',0)+' in in cihuātl '+v('chōca'));
assert.equal(pre.proposals.length,1);
assert.equal(pre.proposals[0].terminal.predicate.tokenIndex,4);
assert.equal(pre.proposals[0].terminal.subjectArgument.lemma,'cihuātl');
const postObject=terminal(v('mati',0)+' in '+v('itta',0)+' in cihuātl');
assert.equal(postObject.proposals.length,1);
assert.equal(postObject.proposals[0].terminal.objectArgument.lemma,'cihuātl');
const ambiguous=terminal(v('mati',0)+' in '+v('itta')+' in cihuātl');
assert.equal(ambiguous.proposals.length,2);
assert.deepEqual(Array.from(ambiguous.proposals,x=>
 x.terminal.subjectArgument?'subject':'object').sort(),['object','subject']);
const twoNouns=terminal(v('mati',0)+' in '+v('itta')+' in cihuātl in tlācatl');
assert.equal(twoNouns.proposals.length,2);
assert.deepEqual(Array.from(twoNouns.proposals,x=>x.terminal.subjectArgument.lemma).sort(),
 ['cihuātl','tlācatl']);
const deeper=terminal(v('mati',0)+' in '+v('mati')+' in '+v('chōca')+' in cihuātl');
assert.equal(deeper.proposals.length,1);
assert.equal(deeper.proposals[0].depth,2);
const tooDeep=terminal(v('mati')+' in '+v('mati')+' in '+v('mati')+' in '+v('mati')+' in '+v('chōca')+' in cihuātl');
assert.equal(tooDeep.proposals.length,0);
const refuse=[
 v('nemi',0)+' in '+v('chōca')+' in cihuātl', // intransitive matrix
 v('mati',0)+' '+v('chōca')+' in cihuātl', // missing subordinator
 v('mati',0)+' in '+v('chōca')+' cihuātl', // bare noun, no in
 v('mati',0)+' in '+v('chōca',0)+' in cihuātl', // 1sg intransitive cannot take a 3sg noun subject
 v('mati',0)+' in '+v('chōca')+' in unknown', // no source-backed noun
 v('mati',0)+' in '+v('chōca')+' in cihuātl extra',
 'ahmo '+v('mati',0)+' in '+v('chōca')+' in cihuātl'
];
for(const input of refuse)assert.equal(terminal(input).proposals.length,0,input);
const graph=ir.build(v('mati',0)+' in in cihuātl '+v('chōca'),pre.result);
const leaf=graph.nodes.find(n=>n.kind==='finite-predicate'&&n.lemma==='chōca');
assert.equal(leaf.tokenIndex,4,'The embedded verb follows a preposed in+noun');
const mentions=graph.nodes.filter(n=>n.kind==='nominal-mention'&&n.lemma==='cihuātl');
assert.equal(mentions.length,1);
assert.equal(mentions[0].referentId,null);
assert.equal(graph.edges.filter(e=>e.relation==='possible-grammatical-argument'&&
 e.embedded&&e.role==='subject').length,1);
assert(graph.edges.every(e=>e.notIdentity===true));
const ambiguousGraph=ir.build(v('mati',0)+' in '+v('itta')+' in cihuātl',ambiguous.result);
assert.equal(ambiguousGraph.edges.filter(e=>
 e.relation==='possible-grammatical-argument'&&e.embedded).length,2);
assert.equal(ambiguousGraph.nodes.filter(n=>n.kind==='nominal-mention').length,1);
console.log('PASS: 1–3-level in-subordinates with overt arguments, role ambiguity, full coverage and shared-IR token positions');
