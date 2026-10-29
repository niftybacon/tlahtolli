'use strict';
// Behavioral parity and fail-closed checks for the editable Classical clause grammar.
// THESE ARE SOFTWARE REGRESSIONS, NOT HISTORICAL LANGUAGE VALIDATION.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),context={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'translator-sentence.js'),'utf8'),context);
const dictionary=JSON.parse(fs.readFileSync(path.join(root,'dictionary.json')));
const paradigms=JSON.parse(fs.readFileSync(path.join(root,'paradigms.json')));
const rules=JSON.parse(fs.readFileSync(path.join(root,'data/clause_grammar.json')));
const create=pack=>context.window.TlahtolliSentence.create(dictionary,paradigms,null,null,null,pack);
const configured=create(rules),offline=create();
assert.equal(rules.format,'tlahtolli-classical-clause-rules-v1');
assert.equal(rules.rules.length,10);
const cases=[
 'nichōca','ahmo nichōca','niquitta','niquitta in cihuātl',
 'in cihuātl niquitta','chōca in cihuātl','in cihuātl chōca',
 'quitta in cihuātl','in cihuātl quitta',
 'quitta in cihuātl in conetl','in cihuātl quitta in conetl',
 'in cihuātl in conetl quitta','quitta in conetl in cihuātl',
 'ahmo niquittaz in cihuātl',
 'niquitta cihuātl','chōca in cihuātl in conetl',
 'niquitta in cihuātl extra','ahmo ahmo niquitta','in cihuātl',
 'onicoch in cihuātl','zzz','niquitta?'
];
for(const [lemma,model] of Object.entries(paradigms.paradigms))
 for(const row of [0,3])
  for(const surface of model.cells[row])
   cases.push(surface,'ahmo '+surface);
function extract(s){
 const result=s.clauses.map(c=>({
  complete:c.complete,english:c.candidates.map(e=>e.english),
  subject:c.candidates.map(e=>e.frame.subjectNoun),
  object:c.candidates.map(e=>e.frame.objectNoun),
  person:c.candidates.map(e=>e.frame.subjectPerson)
 }));
 return JSON.stringify({complete:s.complete,clauses:result});
}
for(const sentence of cases){
 const observed=configured.analyze(sentence),baseline=offline.analyze(sentence);
 assert.equal(extract(observed),extract(baseline),'Configured grammar must preserve original offline behavior: '+sentence);
 for(const clause of observed.clauses)
  for(const candidate of clause.candidates){
   assert(rules.rules.some(r=>r.id===candidate.constructionId));
   assert.equal(candidate.constructionSource.startsWith('https://'),true);
   assert(candidate.note.includes('not individually attested'));
  }
}
const remove=JSON.parse(JSON.stringify(rules));
remove.rules=remove.rules.filter(r=>r.id!=='transitive-explicit-object-post');
const changed=create(remove);
assert.equal(changed.analyze('niquitta in cihuātl').complete,false,
 'Removing a rule must remove its licensed interpretation, not trigger an imperative fallback');
assert.equal(changed.analyze('in cihuātl niquitta').complete,true,
 'An independent declarative ordering should remain licensed');
const invalid=[
 {...rules,format:'unreviewed-grammar-guess'},
 {...rules,version:2},
 {...rules,rules:[]},
 {...rules,rules:[...rules.rules,rules.rules[0]]},
 {...rules,rules:rules.rules.map((r,i)=>i? r:{...r,sequence:['NP','V','NP','NP']})},
 {...rules,rules:rules.rules.map((r,i)=>i?r:{...r,persons:[0,1,2,3,4,5],roles:'both'})},
 {...rules,rules:rules.rules.map((r,i)=>i?r:{...r,source_url:'javascript:alert(1)'})},
 {...rules,rules:rules.rules.map((r,i)=>i?r:{...r,evidence_status:'manuscript verified'})},
 {...rules,rules:rules.rules.map((r,i)=>i?r:{...r,sequence:['V','unknown']})}
];
for(const [i,pack] of invalid.entries()){
 const r=create(pack).analyze('niquitta');
 assert.equal(r.complete,false,'Invalid rule pack must fail closed without partial grammar fallback: '+i);
 assert.equal(r.clauses[0].candidates.length,0);
}
const last=JSON.parse(JSON.stringify(rules));
const test= create(last);
last.rules[0].sequence[0]='INVALID';
assert.equal(test.analyze('nichōca').complete,true,
 'Parser should use defensively copied rule data');
console.log('PASS: '+cases.length+' configured vs offline clause comparisons, declarative rule removal, complete-token checks, metadata provenance, fail-closed and defensive-copy tests.');
