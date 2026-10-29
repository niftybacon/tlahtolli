/* Artificial finite-form fixtures: these are grammar-engine regressions,
 * not independently attested Nahuatl examples or translation gold.
 * Run: node tools/test_translator_nested_in_discourse.js
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../translator-sentence.js'),'utf8');
const window={};
vm.runInNewContext(source,{window},{filename:'translator-sentence.js'});
const url='https://example.org/synthetic-fixture';
const words=['cihuātl','tlācatl'].map(word=>({
 word,pos:'noun',meaning:word,variety:'Classical Nahuatl',source:url
})).concat(['nemi','chōca','mati','itta'].map(word=>({
 word,pos:'verb',meaning:word,variety:'Classical Nahuatl',source:url
})));
const paradigms={paradigms:Object.fromEntries(
 ['nemi','chōca','mati','itta'].map(lemma=>[lemma,{
  trans:lemma==='mati'||lemma==='itta',lemmaSource:url,
  cells:[Array.from({length:6},(_,i)=>lemma+'-fixture-'+i),[],[],[]]
 }])
)};
const analyze=window.TlahtolliSentence.create({words},paradigms,()=>[],null,null).analyze;
const v=(lemma,person=2)=>lemma+'-fixture-'+person;
const overt=n=>'in '+n+' '+v('nemi');
const implicit=v('chōca');
const nested=[v('mati',0),'in',v('mati'),'in',v('nemi')].join(' ');
const p=analyze(nested);
assert.equal(p.complete,false);
assert.equal(p.clauses[0].nestedInProposals.length,1);
assert.equal(p.clauses[0].nestedInProposals[0].coverage,5);
assert.equal(p.clauses[0].nestedInProposals[0].depth,2);
assert.equal(p.clauses[0].candidates.length,0);
const deepest=analyze([v('mati'),'in',v('mati'),'in',v('mati'),'in',v('nemi')].join(' '));
assert.equal(deepest.clauses[0].nestedInProposals[0].depth,3);
const tooDeep=analyze([v('mati'),'in',v('mati'),'in',v('mati'),'in',v('mati'),'in',v('nemi')].join(' '));
assert.equal(tooDeep.clauses[0].nestedInProposals.length,0);
const nonLicensor=analyze(v('nemi')+' in '+v('mati')+' in '+v('nemi'));
assert.equal(nonLicensor.clauses[0].nestedInProposals.length,0);
const missingMarker=analyze(v('mati')+' '+v('mati')+' in '+v('nemi'));
assert.equal(missingMarker.clauses[0].nestedInProposals.length,0);
const embeddedRelative=analyze(v('mati',0)+' in '+v('mati')+' in cihuātl in '+v('chōca'));
assert.ok(embeddedRelative.clauses[0].nestedInProposals.some(x=>
 x.terminal.kind==='headed-relative'&&x.terminal.relative.headGapRole==='relative subject'));
const invalidRelative=analyze(v('mati')+' in '+v('mati')+' in cihuātl in '+v('chōca',0));
assert.equal(invalidRelative.clauses[0].nestedInProposals.length,0);
const trRelative=analyze(v('mati')+' in '+v('mati')+' in cihuātl in '+v('itta'));
assert.deepEqual([...new Set(trRelative.clauses[0].nestedInProposals.map(p=>p.terminal.relative.headGapRole))].sort(),
 ['relative object','relative subject']);
const across=analyze([overt('cihuātl'),implicit,v('nemi'),implicit].join('. '));
assert.deepEqual(across.discourseReferenceProposals.map(x=>x.candidates[0].distance),[1,2,3]);
assert.equal(analyze([overt('cihuātl'),implicit,implicit,implicit,implicit].join('. ')).discourseReferenceProposals.length,3);
const competing=analyze([overt('cihuātl'),overt('tlācatl'),implicit].join('. '));
assert.equal(competing.discourseReferenceProposals.length,1);
assert.equal(competing.discourseReferenceProposals[0].candidates.length,2);
assert.match(competing.discourseReferenceProposals[0].status,/multiple/);
assert.equal(analyze(overt('cihuātl')+'. unknown-word. '+implicit).discourseReferenceProposals.length,0);
assert.equal(analyze('intla '+overt('cihuātl')+', '+implicit).discourseReferenceProposals.length,0);
const auh=analyze([overt('cihuātl'),implicit,v('nemi')].join(' auh '));
assert.equal(auh.multiClauseProposals.length,1);
assert.equal(auh.discourseReferenceProposals.length,2);
assert.equal(analyze(overt('cihuātl')+' auh '+nested).discourseReferenceProposals.length,0);
assert.equal(analyze(overt('cihuātl')+' auh '+nested).multiClauseProposals.length,1);
console.log('Nested in-subordination and bounded discourse reference checks passed');
