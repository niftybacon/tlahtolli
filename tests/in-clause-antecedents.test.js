/* Regression: explicit in-scope relatives, clausal dependents and safe
 * candidate antecedents across auh. Run: node tests/in-clause-antecedents.test.js
 * Artificial finite forms are fixtures, NOT attested Nahuatl words.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../translator-sentence.js'),'utf8');
const root={};vm.runInNewContext(source,{window:root});
const url='https://example.org/fixture';
const words=[
 {word:'cihuātl',pos:'noun',variety:'Classical Nahuatl',meaning:'woman',source:url},
 ...['nemi','chōca','mati'].map(word=>({
  word,pos:word==='mati'?'verb (transitive)':'verb (intransitive)',
  variety:'Classical Nahuatl',meaning:word,source:url}))
];
const paradigms={paradigms:Object.fromEntries(['nemi','chōca','mati'].map(lemma=>{
 const row=Array(6).fill('').map((_,i)=>lemma+'-fixture-'+i);
 return [lemma,{cells:[row,[],[],[]],trans:lemma==='mati',lemmaSource:url}];
}))};
const engine=root.TlahtolliSentence.create({words},paradigms,()=>[],null,null);
const v=(lemma,person=2)=>lemma+'-fixture-'+person;
const head='in cihuātl';
const first=head+' '+v('nemi');
const second=v('chōca');
const coordination=engine.analyze(first+' auh '+second);
assert.equal(coordination.multiClauseProposals.length,1);
assert.equal(coordination.antecedentProposals.length,1);
assert.equal(coordination.antecedentProposals[0].personConstraint,'3sg ↔ 3sg');
assert.match(coordination.antecedentProposals[0].status,/NOT resolved/);
assert.equal(engine.analyze(first+' auh '+v('chōca',0)).antecedentProposals.length,0);
assert.equal(engine.analyze(first+' auh in cihuātl '+second).antecedentProposals.length,0);
assert.equal(engine.analyze('intla '+first+', '+second).antecedentProposals.length,0);
const relative=engine.analyze(head+' in '+second).clauses[0].relativeClauseProposals;
assert.ok(relative.length>0);
assert.equal(relative[0].relative.headGapRole,'relative subject');
assert.equal(engine.analyze(head+' in '+v('chōca',0)).clauses[0].relativeClauseProposals.length,0);
const subordinate=engine.analyze(v('mati')+' in '+second).clauses[0].nominalInProposals;
assert.ok(subordinate.length>0);
assert.match(subordinate[0].note,/no clause type/);
console.log('in-clause, relative and constrained antecedent regressions passed');
