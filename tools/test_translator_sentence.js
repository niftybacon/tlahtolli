'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'..'),context={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'translator-sentence.js'),'utf8'),context);
const d=JSON.parse(fs.readFileSync(path.join(root,'dictionary.json'))),p=JSON.parse(fs.readFileSync(path.join(root,'paradigms.json')));
const model=context.window.TlahtolliSentence.create(d,p),analyze=s=>model.analyze(s);
let checked=0;
for(const [lemma,entry] of Object.entries(p.paradigms))entry.cells[0].forEach((form,person)=>{
 const result=analyze(form);assert(result.complete,form);
 assert(result.clauses[0].candidates.some(c=>c.frame.predicate===lemma&&c.frame.subjectPerson===person));checked++;
});
const negative=analyze('ahmo nichōca').clauses[0].candidates[0];
assert.equal(negative.english[0],'I do not cry');assert.equal(negative.frame.negative,true);
for(const text of ['chōca in cihuātl','in cihuātl chōca']){
 const c=analyze(text).clauses[0].candidates[0];assert.equal(c.frame.subjectNoun,'cihuātl');assert.equal(c.coverage,3);
}
assert.equal(analyze('niquitta').clauses[0].candidates[0].frame.object,'him / her / it');
assert.equal(analyze('ahmo nichōca. nitlacua.').clauses[1].candidates[0].frame.negative,false);
for(const text of ['nichōca extra','nichōca in cihuātl','chōca cihuātl','chōca in unknown','niquitta in cihuātl','chōca, in cihuātl','cuix nichōca','nichōca?','in cihuātl','ahmo','zzzz'])assert.equal(analyze(text).complete,false,text);
const partial=analyze('nichōca. unknown.');assert.equal(partial.complete,false);assert.equal(partial.clauses[0].complete,true);
assert.equal(analyze('x'.repeat(7001)).complete,false);
assert.equal(analyze('').complete,false);
assert(negative.sources.length>=2);assert.equal(negative.grade,'grammar-derived candidate');
console.log('PASS sentence analysis: '+checked+' present paradigm cells, agreement, word order, polarity, object roles, full coverage and negative controls.');
