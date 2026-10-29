/* Source-located possessed relative heads nested under overt in-subordination.
 * No approved manuscript translation or identified pronoun antecedent is inferred.
 * Run: node tools/test_nested_possessed_relatives.js
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),scope={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'translator-sentence.js'),'utf8'),scope);
const dictionary=JSON.parse(fs.readFileSync(path.join(root,'dictionary.json')));
const paradigms=JSON.parse(fs.readFileSync(path.join(root,'paradigms.json')));
const grammar=JSON.parse(fs.readFileSync(path.join(root,'data/clause_grammar.json')));
const possessives=JSON.parse(fs.readFileSync(path.join(root,'data/possessed_form_evidence.json')));
function exactMorph(token){
 const result=[];
 for(const w of dictionary.words.filter(x=>x.pos==='noun')){
  const form=String(w.possessed||'').split('(')[0].trim();
  if(form.normalize('NFC').toLowerCase()!==String(token).normalize('NFC').toLowerCase())continue;
  const owner=form.startsWith('no')?{shape:'no',person:'1sg'}:
   possessives.records.some(x=>x.form===form)?{shape:'i',person:'3sg'}:null;
  if(!owner)continue;
  const claim=(w.claims||[]).find(x=>x.field==='possessed');
  if(!claim)continue;
  result.push({lemma:w.word,kind:'Editorially listed possessed form',grade:'lexical',
   source:claim.source,locator:claim.locator,
   features:{partOfSpeech:'noun',evidence:claim.assessment},
   parts:[{surface:form.slice(0,owner.shape.length),role:'Likely '+owner.person+' possessive prefix'},
    {surface:form.slice(owner.shape.length),role:'Remaining possessed-noun base; morphophonology context-dependent'}]});
 }
 return result;
}
const make=(morph=exactMorph,dict=dictionary,evidence=possessives)=>
 scope.window.TlahtolliSentence.create(dict,paradigms,morph,null,null,grammar,evidence);
function check(noun,possessor,source){
 const text='nicmati in niquitta in '+noun+' in chōca';
 const result=make().analyze(text);
 const props=result.clauses[0].nestedInProposals;
 assert.equal(result.complete,false);
 assert.equal(result.clauses[0].candidates.length,0);
 assert.equal(props.length,1,text);
 const p=props[0];
 assert.equal(p.terminal.kind,'headed-relative');
 assert.equal(p.depth,2);
 assert.equal(p.coverage,7);
 assert.deepEqual(Array.from(p.layers,x=>x.subjectPerson),['1sg','1sg']);
 assert.equal(p.terminal.head.written,noun);
 assert.equal(p.terminal.head.possessor,possessor);
 assert.equal(p.terminal.head.possessiveEvidence.written,noun);
 assert.equal(p.terminal.relative.headGapRole,'relative subject');
 assert.equal(p.terminal.relative.subjectPerson,'3sg');
 assert(p.sources.includes(p.terminal.head.possessiveEvidence.source));
 assert(p.terminal.head.possessorStatus.includes('NOT the finite verb subject'));
 assert(p.note.includes('NOT resolved'));
 assert(!('english' in p));
 assert.equal(source, p.terminal.head.lemma);
}
check('iicxi','3sg','icxitl');
check('nocal','1sg','calli');
check('itoca','3sg','tocaitl');
assert.equal(make().analyze('ninemi in niquitta in iicxi in chōca').clauses[0].nestedInProposals.length,0);
assert.equal(make().analyze('nicmati in niquitta in iicxi in nichōca').clauses[0].nestedInProposals.length,0);
assert.equal(make().analyze('nicmati in niquitta in iicxi in chōca extra').clauses[0].nestedInProposals.length,0);
assert.equal(make().analyze('ahmo nicmati in niquitta in iicxi in chōca').clauses[0].nestedInProposals.length,0);
assert.equal(make(exactMorph,dictionary,null).analyze('nicmati in niquitta in iicxi in chōca').clauses[0].nestedInProposals.length,0);
const duplicated=JSON.parse(JSON.stringify(dictionary));
duplicated.words.push({...duplicated.words.find(w=>w.word==='icxitl')});
assert.equal(make(exactMorph,duplicated).analyze('nicmati in niquitta in iicxi in chōca').clauses[0].nestedInProposals.length,0);
const badMorph=token=>exactMorph(token).map(m=>({...m,source:'https://example.org/fake'}));
assert.equal(make(badMorph).analyze('nicmati in niquitta in iicxi in chōca').clauses[0].nestedInProposals.length,0);
// New coverage: a subordinate finite clause may contain an exact
// source-located possessed subject. This is NOT agreement-based identity.
for(const [written,person] of [['nocal','1sg'],['iicxi','3sg'],['itoca','3sg']]){
 const post=make().analyze('nicmati in chōca '+written);
 assert.equal(post.complete,false);
 const proposals=post.clauses[0].nestedInProposals.filter(p=>
  p.terminal.kind==='finite-with-arguments');
 assert.equal(proposals.length,1,written);
 assert.equal(proposals[0].depth,1);
 assert.equal(proposals[0].terminal.subjectArgument.written,written);
 assert.equal(proposals[0].terminal.subjectArgument.possessor,person);
 assert.equal(proposals[0].terminal.predicate.subjectPerson,'3sg');
 assert(proposals[0].sources.includes(proposals[0].terminal.subjectArgument.possessorSource));
 assert(!('english' in proposals[0]));
 const pre=make().analyze('nicmati in in '+written+' chōca');
 const front=pre.clauses[0].nestedInProposals.filter(p=>
  p.terminal.kind==='finite-with-arguments');
 assert.equal(front.length,1,written+' fronted');
 assert.equal(front[0].terminal.subjectArgument.possessor,person);
 assert.equal(front[0].terminal.predicate.tokenIndex,4);
}
assert.equal(make(exactMorph,dictionary,null).analyze('nicmati in chōca iicxi')
 .clauses[0].nestedInProposals.filter(p=>p.terminal.kind==='finite-with-arguments').length,0);
assert.equal(make(exactMorph,duplicated).analyze('nicmati in chōca iicxi')
 .clauses[0].nestedInProposals.filter(p=>p.terminal.kind==='finite-with-arguments').length,0);
assert.equal(make(badMorph).analyze('nicmati in chōca iicxi')
 .clauses[0].nestedInProposals.filter(p=>p.terminal.kind==='finite-with-arguments').length,0);
assert.equal(make().analyze('nicmati in chōca mocal')
 .clauses[0].nestedInProposals.filter(p=>p.terminal.kind==='finite-with-arguments').length,0);
console.log('PASS: nested in-dependency + source-attested possessed heads; preserve separate possessor/finite agreement and conservative abstention');
