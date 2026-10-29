'use strict';
// Constructed software controls; none of these passages are manuscript attestations.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),ctx={window:{}};
for(const f of ['translator-locative.js','translator-sentence.js','translator-english.js','translator-grammar-ir.js'])
 vm.runInNewContext(fs.readFileSync(path.join(root,f),'utf8'),ctx,{filename:f});
const json=f=>JSON.parse(fs.readFileSync(path.join(root,f),'utf8'));
const dictionary=json('dictionary.json'),paradigms=json('paradigms.json');
const locative=ctx.window.TlahtolliLocative.create(dictionary,{entries:[]});
const sentence=ctx.window.TlahtolliSentence.create(dictionary,paradigms,null,null,locative);
const english=ctx.window.TlahtolliEnglish.create(sentence),ir=ctx.window.TlahtolliGrammarIR.create(dictionary);
const make=text=>{
 const analysis=sentence.analyze(text),graph=ir.build(text,analysis);
 return {analysis,graph,composition:ir.auditEnglish(english.compose(text,analysis),analysis,graph)};
};
const base='nichōca auh nitlacua';
for(const ending of ['.','!','\n','...']){
 const {composition,graph}=make(base+ending);
 assert.equal(english.render(composition),'I cry. I eat.');
 assert.equal(english.render(composition,[],[1]),'I cry, and I eat.');
 assert.equal(graph.edges.filter(e=>e.relation==='explicit-clause-connection').length,1);
}
const text='niquitta in cihuātl in chōca auh nichōca in calli itic. ahmo nitlacuāz auh ninemi.';
const mixed=make(text);
assert.equal(english.render(mixed.composition),'I see the woman that cries. Inside the house, I cry. I will not eat. I live.');
assert.equal(mixed.composition.units.length,4);
assert.deepEqual(Array.from(mixed.composition.joins,j=>j.written),['auh','punctuation','auh']);
assert.equal(mixed.graph.edges.filter(e=>e.relation==='explicit-clause-connection').length,2);
assert.equal(english.render(mixed.composition,[],[1,0,2]),'I see the woman that cries, and inside the house, I cry. I will not eat, but I live.');
for(const n of [4,12,24]){
 const r=make(Array(n).fill('nichōca').join(' auh ')+'.');
 assert.equal(r.composition.available,true);
 assert.equal(r.composition.units.length,n);
 assert.equal(r.composition.joins.length,n-1);
}
for(const input of [Array(25).fill('nichōca').join(' auh '),Array(25).fill('nichōca.').join(' '),
 'nichōca auh xyzzy. nitlacua.', 'nichōca auh nitlacua. xyzzy.',
 'nichōca. auh nitlacua.', 'nichōca auh nitlacua?',
 'intla nichōca; nitlacua.', 'nichōca ihuan nitlacua.',
 'nichōca auh nitlacua. <script>bad</script>', 'nichōca auh nitlacua,'])
 assert.equal(make(input).composition.available,false,input);
const conditional=sentence.analyze('intla nichōca; nitlacua.');
assert.equal(conditional.sentenceGroups[0].analysis.multiClauseProposals[0].clauseCount,2,
 'Semicolon must remain inside the conditional; no invented English conditional');
const altered=JSON.parse(JSON.stringify(mixed.analysis));
altered.sentenceGroups.pop();
assert.equal(english.compose(text,altered).available,false,'Cannot omit an input sentence');
assert.equal(english.compose(text+' xyzzy',mixed.analysis).available,false);
// Every indexed cell remains available inside a punctuated coordination.
let cells=0;
for(const p of Object.values(paradigms.paradigms))for(const row of [0,3])
 for(const token of p.cells[row])for(const neg of ['', 'ahmo ']){
  assert.equal(make(neg+token+' auh nichōca.').composition.available,true,neg+token);cells++;
 }
assert.equal(cells,288);
// Repeated grammar probes share EXACT spellings only within one request.
const calls=new Map();
const provider=token=>{calls.set(token,(calls.get(token)||0)+1);return [];};
const memo=ctx.window.TlahtolliSentence.create(dictionary,paradigms,provider);
memo.analyze('unknown mystery unknown mystery unknown mystery');
assert.deepEqual([...calls.entries()].sort(),[['mystery',1],['unknown',1]]);
memo.analyze('unknown mystery unknown mystery unknown mystery');
assert.equal(calls.get('unknown'),2,'A later request must reconsult the evidence provider');
calls.clear();memo.analyze('unknown ūnknown Unknown mystery');
assert(calls.has('unknown')&&calls.has('ūnknown')&&calls.has('Unknown'));
assert.throws(()=>memo.analyze({toString(){throw Error('input failure');}}));
calls.clear();memo.analyze('unknown mystery unknown mystery');assert.equal(calls.get('unknown'),1);
console.log('PASS: 288 punctuated finite cells, mixed relative/location paragraphs, 24-clause boundary, exact request-scoped memoization and negative controls.');
