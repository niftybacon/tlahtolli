'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const path=require('node:path'),root=path.join(__dirname,'..');
const context={window:{}};vm.createContext(context);
for(const file of ['translator-sentence.js','translator-english.js'])
 vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context);
const dictionary=JSON.parse(fs.readFileSync(path.join(root,'dictionary.json'),'utf8'));
const paradigms=JSON.parse(fs.readFileSync(path.join(root,'paradigms.json'),'utf8'));
const sentence=context.window.TlahtolliSentence.create(dictionary,paradigms);
const english=context.window.TlahtolliEnglish.create(sentence);
const compose=text=>english.compose(text,sentence.analyze(text));
const readings=text=>compose(text).units.flatMap(u=>u.options.map(o=>o.text));
assert.equal(english.render(compose('ahmo niquittaz in cihuātl')),'I will not see the woman.');
assert.ok(readings('niquitta in cihuātl in chōca').includes('I see the woman that cries'));
assert.ok(readings('chōca in cihuātl in niquitta').includes('The woman that I see cries'));
assert.ok(readings('niquittaz in cihuātl in chōcaz').includes('I will see the woman that will cry'));
assert.ok(readings('quitta in cihuātl in quitta').includes('The woman that sees him / her / it sees him / her / it'));
assert.ok(readings('quitta in cihuātl in quitta').includes('He / she / it sees the woman that he / she / it sees'));
const roles=new Set(compose('quitta in cihuātl in quitta').units[0].options.map(o=>
 o.structure.relativeGap+' / '+o.structure.matrixRole));
assert.equal(roles.size,4,'both relative gaps and both matrix roles must remain available');
const coordinated=compose('nichōca auh ahmo niquittaz in cihuātl auh nitlacua');
assert.equal(coordinated.available,true);
assert.equal(english.render(coordinated),'I cry. I will not see the woman. I eat.');
assert.equal(english.render(coordinated,[],[1,2]),'I cry, and I will not see the woman, but I eat.');
assert.equal(english.render(coordinated,[1,1,0],[2,1]),'I weep, but I will not inspect the woman, and I eat.');
assert.equal(english.render(coordinated,[999]),null,'invalid selection must not drop a clause');
assert.equal(coordinated.verified,false);
const paragraph=compose('chōca in cihuātl. chōca');
assert.equal(english.render(paragraph),'The woman cries. He / she / it cries.');
assert.ok(!english.render(paragraph).includes('She cries'),'antecedent suggestions must not resolve identity');
assert.equal(paragraph.units[0].options[0].nounSenses[0].fullMeaning.includes('wife'),true);
assert.ok(coordinated.joins[0].sources.includes('https://nahuatl.wired-humanities.org/content/auh'));
assert.ok(compose('niquitta in cihuātl in chōca').units[0].options.every(o=>o.sources.length>0));
// No completed passage may hide unknown text, unsupported scope, or structural-only evidence.
for(const text of [
 'nichōca. xyzzy. nitlacua','nichōca auh xyzzy','intla nichōca, nitlacua',
 'niquitta in cihuātl in chōca xyzzy','niquitta in cihuātl in nichōca',
 'niquitta in chōca','in cihuātl in chōca','ahmo niquitta in cihuātl in chōca',
 'niquitta in cihuātl in chōca?','nichōca ihuan nitlacua',
 'nichōca'.repeat(1001)
])assert.equal(compose(text).available,false,text);
const forged=sentence.analyze('nichōca');
assert.equal(english.compose('nichōca xyzzy',forged).available,false);
for(const c of forged.clauses[0].candidates)c.coverage=0;
assert.equal(english.compose('nichōca',forged).available,false);
// English parts preserve the existing renderer over every indexed present/future cell.
let cells=0;
for(const p of Object.values(paradigms.paradigms))for(const row of [0,3])
 for(const token of p.cells[row])for(const negative of ['', 'ahmo ']){
  const text=negative+token,c=compose(text),raw=sentence.analyze(text);
  assert.equal(c.available,true,text);
  assert.deepEqual(c.units[0].options.map(o=>o.text),raw.clauses[0].candidates.flatMap(o=>o.english));
  cells++;
 }
assert.equal(cells,288);
console.log('English composition: 288 finite-cell controls, relatives, coordination, role alternatives and negative controls passed.');
