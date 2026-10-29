'use strict';
// Headed in-relatives with exact source-listed possessed nouns.
// Structural hypotheses only: NO historical attestation or pronoun resolution.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
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
  result.push({
   lemma:w.word,kind:'Editorially listed possessed form',grade:'lexical',
   source:claim.source,locator:claim.locator,
   features:{partOfSpeech:'noun',evidence:claim.assessment},
   parts:[{surface:form.slice(0,owner.shape.length),role:'Likely '+owner.person+' possessive prefix'},
    {surface:form.slice(owner.shape.length),role:'Remaining possessed-noun base; morphophonology context-dependent'}]
  });
 }
 return result;
}
const mk=(morph=exactMorph,dict=dictionary,evidence=possessives)=>
 scope.window.TlahtolliSentence.create(dict,paradigms,morph,null,null,grammar,evidence);
const parse=(input,m=mk())=>m.analyze(input);
function expect(input,n,possessor,role){
 const data=parse(input),cl=data.clauses[0],items=cl.relativeClauseProposals;
 assert.equal(data.complete,false,'A relative-head proposal is never a complete verified sentence: '+input);
 assert.equal(cl.candidates.length,0);
 assert.equal(items.length,n,'Unexpected head/gap alternatives: '+input);
 for(const a of items){
  assert.equal(a.coverage,input.split(/\s+/).length);
  assert.equal(a.head.possessor,possessor);
  assert.equal(a.head.possessiveEvidence.written,input.split(' ')[input.startsWith('in ')?1:2]);
  assert(a.head.possessiveEvidence.locator.length>5);
  assert(a.head.possessiveEvidence.source.startsWith('https://'));
  assert(a.sources.includes(a.head.possessiveEvidence.source));
  assert(a.head.possessorStatus.includes('NOT the finite verb subject'));
  assert(a.note.includes('combined relative construction is an editorial hypothesis'));
  assert(!('english' in a));
 }
 if(role)assert(items.some(x=>x.relative.headGapRole===role));
 return items;
}
for(const [form,owner,lemma] of [
 ['nocal','1sg','calli'],
 ['nocuīc','1sg','cuīcatl'],
 ['noxōchiuh','1sg','xōchitl'],
 ['iicxi','3sg','icxitl'],
 ['itoca','3sg','tocaitl']
]){
 const head=expect('in '+form+' in chōca',1,owner,'relative subject');
 assert.equal(head[0].head.lemma,lemma);
 assert.equal(head[0].relative.subjectPerson,'3sg');
 assert.equal(head[0].relative.headGapRole,'relative subject');
 const object=expect('in '+form+' in niquitta',1,owner,'relative object');
 assert.equal(object[0].relative.subjectPerson,'1sg');
 const both=expect('in '+form+' in quitta',2,owner);
 assert.deepEqual(Array.from(both,x=>x.relative.headGapRole).sort(),['relative object','relative subject']);
 const matrix=expect('niquitta in '+form+' in chōca',1,owner,'relative subject');
 assert.equal(matrix[0].matrix.headRole,'matrix object');
 assert.equal(matrix[0].head.possessor,owner);
 assert.equal(matrix[0].matrix.subjectPerson,'1sg');
 assert.equal(matrix[0].relative.subjectPerson,'3sg');
}
// Possessor of noun and finite subject of relative/matrix must not unify.
const difference=expect('niquitta in iicxi in chōca',1,'3sg')[0];
assert.equal(difference.matrix.subjectPerson,'1sg');
assert.equal(difference.relative.subjectPerson,'3sg');
assert.equal(difference.head.possessor,'3sg');
// Existing unpossessed headed relatives remain unchanged.
const plain=parse('in cihuātl in chōca').clauses[0].relativeClauseProposals;
assert.equal(plain.length,1);
assert.equal(plain[0].head.lemma,'cihuātl');
assert.equal(plain[0].head.possessor,undefined);
assert.equal(plain[0].head.antecedentStatus,'explicit lexical head; referent identity NOT determined');
// Relative head is NOT a discourse antecedent automatically inherited into next clause.
assert.equal(parse('in nocal in chōca. nemi.').antecedentProposals.length,0);
for(const invalid of [
 'in iicxi in nichōca','in nocal in ninemi',
 'in nocal in unknown','in itoca in onicoch',
 'in inxiuh in chōca','in imitzcuinoan in chōca',
 'in itlatqui in chōca','in mocal in chōca',
 'in itoca in chōca extra','in itoca in chōca in conetl',
 'in iicxi in chōca?','in iicxi in chōca auh ninemi',
 'ahmo in iicxi in chōca','in itoca chōca',
 'in itoca in','iicxi in chōca'
])assert.equal(parse(invalid).clauses[0].relativeClauseProposals?.length||0,0,
 'Unlicensed head/verb/word order must be rejected: '+invalid);
const absent=mk(exactMorph,dictionary,null);
assert.equal(parse('in itoca in chōca',absent).clauses[0].relativeClauseProposals.length,0);
assert.equal(parse('in nocal in chōca',absent).clauses[0].relativeClauseProposals.length,1);
const duplicate=JSON.parse(JSON.stringify(dictionary));
duplicate.words.push({...duplicate.words.find(w=>w.word==='icxitl')});
assert.equal(parse('in iicxi in chōca',mk(exactMorph,duplicate)).clauses[0].relativeClauseProposals.length,0);
for(const tamper of [
 m=>{m.grade='analogy'},m=>{m.source='https://example.org/fake'},
 m=>{m.features.partOfSpeech='verb'},m=>{m.locator='fictional locator'},
 m=>{m.parts[0].role='wrong possessive person'}
]){
 const corrupted=token=>exactMorph(token).map(m=>{tamper(m);return m;});
 assert.equal(parse('in iicxi in chōca',mk(corrupted)).clauses[0].relativeClauseProposals.length,0);
}
const old=parse('ninemi auh nichōca');
assert.equal(old.multiClauseProposals.length,1);
assert.equal(parse('niquitta in cihuātl').complete,true);
assert.equal(parse('in cihuātl in chōca').clauses[0].relativeClauseProposals.length,1);
console.log('PASS: source-listed possessed heads linked to bounded in-relatives; independent nominal owner/matrix/relative persons, ambiguity, refusal and old-grammar parity.');
