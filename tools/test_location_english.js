'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'..'),ctx={window:{}};vm.createContext(ctx);
for(const f of ['translator-locative.js','translator-sentence.js','translator-english.js'])
 vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx);
const dictionary=JSON.parse(fs.readFileSync(path.join(root,'dictionary.json'),'utf8'));
const paradigms=JSON.parse(fs.readFileSync(path.join(root,'paradigms.json'),'utf8'));
function setup(d=dictionary){
 const locative=ctx.window.TlahtolliLocative.create(d,{entries:[]});
 const model=ctx.window.TlahtolliSentence.create(d,paradigms,null,null,locative);
 const english=ctx.window.TlahtolliEnglish.create(model);
 return {model,english,compose:text=>english.compose(text,model.analyze(text))};
}
const {model,english,compose}=setup();
const options=text=>compose(text).units.flatMap(u=>u.options);
assert.ok(options('nichōca in calli itic').some(o=>o.text==='Inside the house, I cry'));
assert.ok(options('in calli itic nichōca').some(o=>o.text==='Within the house, I weep'));
assert.ok(options('ahmo nichōcaz in calli itic').some(o=>o.text==='Inside the house, I will not cry'));
const overt=options('niquitta in cihuātl in calli itic');
assert.ok(overt.some(o=>o.text==='Inside the house, I see the woman'&&o.structure.attachment==='event'));
assert.ok(overt.some(o=>o.text==='I see the woman inside the house'&&o.structure.attachment==='object'));
const roles=options('quitta in cihuātl in calli itic');
assert.deepEqual([...new Set(roles.map(o=>o.structure.attachment))].sort(),['event','object','subject']);
assert.ok(roles.some(o=>o.text==='The woman inside the house sees him / her / it'));
assert.ok(roles.some(o=>o.text==='He / she / it sees the woman inside the house'));
assert.ok(roles.every(o=>o.sources.includes('https://nahuatl.wired-humanities.org/content/itic')));
assert.ok(overt.every(o=>o.nounSenses.some(n=>n.lemma==='cihuātl'&&n.fullMeaning.includes('wife'))));
assert.ok(overt.every(o=>o.nounSenses.some(n=>n.lemma==='calli'&&n.fullMeaning.includes('dwelling'))));
assert.equal(roles.filter(o=>o.structure.attachment==='event').length,18);
assert.equal(roles.filter(o=>o.structure.attachment==='object').length,9);
assert.equal(roles.filter(o=>o.structure.attachment==='subject').length,9);
assert.deepEqual([...new Set(options('nichōca in calli ītech').map(o=>o.structure.selectedRelation))].sort(),
 ['on','by','in contact with','attached to','concerning','from'].sort());
const sequence=compose('nichōca in calli itic auh ahmo niquittaz in cihuātl');
assert.equal(sequence.available,true);
assert.equal(english.render(sequence,[],[1]),'Inside the house, I cry, and I will not see the woman.');
assert.ok(!sequence.units[1].options.some(o=>o.text.includes('house')),'no silent location inheritance');
assert.equal(english.render(compose('ahmo nichōca in calli itic auh nitlacua'),[],[1]),
 'Inside the house, I do not cry, and I eat.');
assert.equal(sequence.verified,false);
assert.ok(sequence.note.includes('relational possessor'));
assert.equal(model.analyze('nichōca in calli itic').complete,false,'rendering must not promote parser evidence');
// Every indexed finite cell composes with an explicit location in both polarities.
let controls=0;
for(const p of Object.values(paradigms.paradigms))for(const row of [0,3])
 for(const form of p.cells[row])for(const negative of ['', 'ahmo ']){
  const text=negative+form+' in calli itic',result=compose(text);
  assert.equal(result.available,true,text);
  assert.ok(result.units[0].options.every(o=>o.structure.attachment==='event'));
  controls++;
 }
assert.equal(controls,288);
for(const text of ['nichōca in calli itic xyzzy','nichōca in calli itic in ātl itic',
 'nichōca in xyzzy itic','nichōca in calli xyzzy','in calli itic nemini',
 'nichōca. xyzzy in calli itic','nichōca in calli itic?',
 'intla nichōca in calli itic, nitlacua'])
 assert.equal(compose(text).available,false,text);
// Duplicate/conflicting dictionary nouns and unlicensed location spellings stay unresolved.
const duplicate=JSON.parse(JSON.stringify(dictionary));
duplicate.words.push({...duplicate.words.find(w=>w.word==='calli')});
assert.equal(setup(duplicate).compose('nichōca in calli itic').available,false);
assert.equal(compose('nichōca in calli ihtic').available,false);
const inflected=JSON.parse(JSON.stringify(dictionary));
inflected.words.find(w=>w.word==='calli').inflections.push({
 form:'testplural',evidence:'dictionary',source:'https://example.test/source'});
assert.equal(setup(inflected).compose('nichōca in testplural itic').available,false,
 'source-listed form cannot inherit singular citation wording');
// A malformed adapter cannot authorize unrelated wording or silently omit negation.
const result=model.analyze('ahmo nichōca in calli itic');
result.clauses[0].complexClauseProposals[0].coverage--;
assert.equal(english.compose('ahmo nichōca in calli itic',result).available,false);
const bad=model.analyze('nichōca in calli itic');
bad.clauses[0].complexClauseProposals[0].location.possibleSenses=['because of'];
assert.equal(english.compose('nichōca in calli itic',bad).available,false);
console.log('Location English: 288 finite controls, attachment/sense alternatives, provenance, negation and negative controls passed.');
