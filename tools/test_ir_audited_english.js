'use strict';
// Tests shared IR auditing of English CHOICES, not translation accuracy.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),ctx={window:{}};vm.createContext(ctx);
for(const f of ['translator-locative.js','translator-sentence.js','translator-english.js','translator-grammar-ir.js'])
 vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx,{filename:f});
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const dictionary=read('dictionary.json'),paradigms=read('paradigms.json');
const locative=ctx.window.TlahtolliLocative.create(dictionary,{entries:[]});
const sentence=ctx.window.TlahtolliSentence.create(dictionary,paradigms,null,null,locative);
const english=ctx.window.TlahtolliEnglish.create(sentence);
const ir=ctx.window.TlahtolliGrammarIR.create(dictionary);
const make=text=>{
 const analysis=sentence.analyze(text),graph=ir.build(text,analysis);
 const original=english.compose(text,analysis);
 const audited=ir.auditEnglish(original,analysis,graph);
 return {analysis,graph,original,audited};
};
const copy=x=>JSON.parse(JSON.stringify(x));
const roleText='quitta in cihuātl in quitta';
const role=make(roleText);
assert.equal(role.original.available,true);
assert.equal(role.audited.available,true);
assert.equal(role.audited.verified,false);
assert.equal(role.audited.audit.graphMatchedRelatives,role.original.units[0].options.length);
assert.deepEqual(Array.from(role.audited.units[0].options,x=>x.text),
 Array.from(role.original.units[0].options,x=>x.text));
assert.deepEqual(Array.from(new Set(role.audited.units[0].options.map(x=>x.structure.relativeGap))).sort(),
 ['relative object','relative subject']);
assert.deepEqual(Array.from(new Set(role.audited.units[0].options.map(x=>x.structure.matrixRole))).sort(),
 ['matrix object','matrix subject']);
assert(role.audited.units[0].options.every(o=>o.grammarAudit.status==='graph-consistent-relative-roles'));
assert.equal(english.render(role.audited),english.render(role.original));
assert.equal(role.original.units[0].options[0].grammarAudit,undefined,
 'Do not mutate the English composer result');
const contracted=make('niquitta in cihuātl in chōca');
assert.equal(contracted.audited.available,true);
assert(contracted.audited.audit.graphMatchedRelatives>0);
const paragraph=make('chōca in cihuātl. chōca');
assert.equal(paragraph.audited.available,true);
assert(paragraph.audited.audit.existingFinite>=2);
assert.equal(english.render(paragraph.audited),'The woman cries. He / she / it cries.');
assert(!english.render(paragraph.audited).includes('She cries'));
const location=make('nichōca in calli itic');
assert.equal(location.audited.available,true,'location readings remain separate supported candidates');
assert(location.audited.units[0].options.some(o=>
 o.grammarAudit.status==='existing-location-scope-not-ir-audited'));
assert.equal(location.audited.audit.graphMatchedRelatives,0);
assert.equal(english.render(location.audited),english.render(location.original));
const joined=make('niquitta in cihuātl in chōca auh nichōca in calli itic');
assert.equal(joined.audited.available,true);
assert.equal(english.render(joined.audited,[],[1]),english.render(joined.original,[],[1]));
assert(joined.audited.audit.graphMatchedRelatives>0&&joined.audited.audit.existingLocation>0);
// Every source-backed indexed present/future finite reading survives the audit.
let cells=0;
for(const p of Object.values(paradigms.paradigms))for(const row of [0,3])
 for(const token of p.cells[row])for(const negative of ['', 'ahmo ']){
  const t=negative+token,r=make(t);
  assert.equal(r.audited.available,true,t);
  assert.equal(english.render(r.audited),english.render(r.original));
  assert.equal(r.audited.audit.existingFinite,r.original.units[0].options.length);
  cells++;
 }
assert.equal(cells,288);
// A relative English option that the grammar role audit rejected cannot
// enter the choice list even if the English composer itself proposed it.
const altered=copy(role.analysis);
altered.clauses[0].relativeClauseProposals.forEach(p=>{
 if(p.relative.headGapRole==='relative subject')p.relative.subjectPerson='1sg';
});
const checked=ir.build(roleText,altered);
const gated=ir.auditEnglish(role.original,altered,checked);
assert.equal(gated.available,true);
assert(gated.audit.rejected>0);
assert(gated.units[0].options.every(x=>x.structure.relativeGap==='relative object'));
const forgedOption=copy(role.original);
forgedOption.units[0].options[0].structure.relativeGap='relative invented subject';
assert(ir.auditEnglish(forgedOption,role.analysis,role.graph).audit.rejected>0);
const badSource=copy(role.original);
badSource.units[0].options[0].sources=['https://example.org/forged-source'];
assert(ir.auditEnglish(badSource,role.analysis,role.graph).audit.rejected>0);
const graphBad=copy(role.graph);
graphBad.edges=graphBad.edges.filter(e=>e.relation!=='possible-relative-gap');
assert.equal(ir.auditEnglish(role.original,role.analysis,graphBad).available,false);
const untrusted=copy(role.graph);
for(const e of untrusted.edges)e.status='verified';
assert.equal(ir.auditEnglish(role.original,role.analysis,untrusted).available,false);
assert.equal(ir.auditEnglish(role.original,role.analysis,null).available,false);
const incomplete=make('in cihuātl in chōca');
assert.equal(incomplete.original.available,false);
assert.equal(incomplete.audited.available,false);
for(const unsupported of ['xyzzy','niquitta in cihuātl unknown','intla nichōca, nitlacua']){
 const t=make(unsupported);assert.equal(t.original.available,false);
 assert.equal(t.audited.available,false);
}
console.log('PASS: IR-audited English preserves '+cells+
 ' finite cells, location choices, all licensed relative roles, while filtering forged agreement/source alternatives and refusing unsupported passages.');
