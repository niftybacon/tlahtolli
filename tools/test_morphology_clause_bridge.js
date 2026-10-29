'use strict';
// Behavior tests only. Pattern-matrix agreement is NOT a historical
// translation benchmark, licensed manuscript reading, or speaker judgment.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const scope={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'translator-sentence.js'),'utf8'),scope);
const d=JSON.parse(fs.readFileSync(path.join(root,'dictionary.json')));
const p=JSON.parse(fs.readFileSync(path.join(root,'paradigms.json')));
const rules=JSON.parse(fs.readFileSync(path.join(root,'data/clause_grammar.json')));
const allowedRows=[1,2,4,5,6],people=p.persons;
function mockCanonical(token) {
 const output=[];
 for(const [lemma,model] of Object.entries(p.paradigms))
  for(const row of allowedRows)for(let person=0;person<6;person++)
   if(model.cells[row][person].normalize('NFC').toLowerCase()===
      String(token).normalize('NFC').toLowerCase())
    output.push({
     lemma,kind:'Indexed conjugation',grade:'paradigm',
     source:model.lemmaSource,
     features:{patternIndex:row,subject:people[person],
      object:model.trans?'fixed third-person singular':'intransitive',
      paradigmClass:model.cls},
     parts:[{surface:token,role:'Exact matrix cell; not a historical witness'}]
    });
 return output;
}
const mk=(provider=mockCanonical,dict=d,pack=rules)=>
 scope.window.TlahtolliSentence.create(dict,p,provider,{entries:[]},null,pack);
const model=mk(),without=mk(()=>[]);
const extract=(sentence,m=model)=>m.analyze(sentence).clauses[0];
let checked=0;
for(const [lemma,par] of Object.entries(p.paradigms))
 for(const row of allowedRows)for(let person=0;person<6;person++){
  // One in + noun can be linked to a transitive predicate (possible
  // direct object) or a third-person intransitive predicate (subject).
  if(!par.trans&&person!==2)continue;
  const form=par.cells[row][person],clause=extract(form+' in cihuātl');
  const analyses=clause.morphosyntactic.items;
  assert(analyses.some(a=>a.verb.lemma===lemma&&
   a.verb.patternIndex===row&&a.verb.subjectPerson===people[person]&&
   a.coverage===3),'Missing exact indexed finite-verb link: '+lemma+'/'+row+'/'+person+'/'+form);
  for(const a of analyses){
   assert.equal(a.grade,'indexed-morphology clause hypothesis (NOT a translation)');
   assert(a.sources.some(u=>u===p.paradigms[a.verb.lemma].lemmaSource));
   assert(a.note.includes('NOT a complete translation'));
   assert.equal(a.coverage,3);
   assert(a.constructionId);
  }
  checked++;
 }
const sample=p.paradigms.itta.cells[1][0],third=p.paradigms.itta.cells[1][2];
const source=extract(sample+' in cihuātl');
assert(source.morphosyntactic.items.some(a=>
 a.verb.lemma==='itta'&&a.argumentRoles.objectNoun==='cihuātl'&&
 a.argumentRoles.subjectNoun===null));
assert.equal(source.complete,false,'Prior grammar must not claim complete past-tense English');
assert.equal(source.candidates.length,0,'No past-tense English is generated');
assert.equal(extract(sample+' in cihuātl',without).morphosyntactic.items.length,0,
 'No canonical provider means no morphologically linked clause');
const ambiguous=extract(third+' in cihuātl').morphosyntactic.items
 .filter(a=>a.verb.lemma==='itta'&&a.verb.patternIndex===1);
assert(ambiguous.some(a=>a.argumentRoles.subjectNoun==='cihuātl'));
assert(ambiguous.some(a=>a.argumentRoles.objectNoun==='cihuātl'));
const two=extract(third+' in cihuātl in conetl').morphosyntactic.items
 .filter(a=>a.verb.lemma==='itta'&&a.verb.patternIndex===1);
assert(two.some(a=>a.argumentRoles.subjectNoun==='cihuātl'&&a.argumentRoles.objectNoun==='conetl'));
assert(two.some(a=>a.argumentRoles.subjectNoun==='conetl'&&a.argumentRoles.objectNoun==='cihuātl'));
for(const rejected of [
 sample,sample+' cihuātl',sample+' in cihuātl extra',sample+' in unknown',
 sample+' in cihuātl in conetl','ahmo '+sample+' in cihuātl',
 sample+' in cihuātl,',sample+' in cihuātl in unknown'
])assert.equal(extract(rejected).morphosyntactic.items.length,0,
 'Unsupported tokens, punctuation, negation or roles must not compose: '+rejected);
const imperative=p.paradigms.itta.cells[7][0];
assert.equal(extract(imperative+' in cihuātl').morphosyntactic.items.length,0,
 'Imperatives/optatives have distinct subject and polarity semantics');
const invalids=[
 m=>{m.grade='hypothesis'},
 m=>{m.grade='lexical'},
 m=>{m.kind='Productive transitive parse'},
 m=>{m.lemma='chōca'},
 m=>{m.features.subject='2pl'},
 m=>{m.features.patternIndex=7},
 m=>{m.features.object='2sg'},
 m=>{m.features.paradigmClass='bogus'},
 m=>{m.source='https://example.org/forged'}
];
for(const alter of invalids){
 const tampered=token=>mockCanonical(token).map(m=>{alter(m);return m});
 assert.equal(extract(sample+' in cihuātl',mk(tampered)).morphosyntactic.items.length,0,
  'Changed canonical metadata must fail closed: '+alter.toString());
}
const notNoun=JSON.parse(JSON.stringify(d));
notNoun.words.push({...notNoun.words.find(w=>w.word==='cihuātl'),meaning:'competing entry'});
assert.equal(extract(sample+' in cihuātl',mk(mockCanonical,notNoun)).morphosyntactic.items.length,0);
const none=JSON.parse(JSON.stringify(rules));none.rules=[];
assert.equal(extract(sample+' in cihuātl',mk(mockCanonical,d,none)).morphosyntactic.items.length,0);
assert.equal(extract('niquitta in cihuātl').candidates[0].english[0],'I see the woman',
 'Present-tense English and grammar must stay intact');
assert.equal(extract('ahmo niquittaz in cihuātl').candidates[0].english[0],
 'I will not see the woman','Existing future/negation must remain intact');
console.log('PASS morphology+declarative grammar: '+checked+
 ' exact indexed nonpresent finite-role proposals, alternative roles, strict metadata guards, ambiguous nouns, negative cases and old-sentence parity.');
