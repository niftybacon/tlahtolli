'use strict';
// Adversarial structural agreement checks, NOT historical Nahuatl attestations.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),ctx={window:{}};
for(const file of ['translator-sentence.js','translator-grammar-ir.js'])
 vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8'),ctx,{filename:file});
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const d=read('dictionary.json'),p=read('paradigms.json');
const rules=read('data/clause_grammar.json'),poss=read('data/possessed_form_evidence.json');
function morphology(token){
 const ret=[];
 for(const x of d.words.filter(w=>w.pos==='noun')){
  const form=String(x.possessed||'').split('(')[0].trim();
  if(form.normalize('NFC').toLowerCase()!==String(token).normalize('NFC').toLowerCase())continue;
  const owner=form.startsWith('no')?{person:'1sg',shape:'no'}:
   poss.records.some(z=>z.form===form)?{person:'3sg',shape:'i'}:null;
  if(!owner)continue;
  const c=(x.claims||[]).find(k=>k.field==='possessed');
  if(!c)continue;
  ret.push({lemma:x.word,kind:'Editorially listed possessed form',grade:'lexical',
   source:c.source,locator:c.locator,features:{partOfSpeech:'noun',evidence:c.assessment},
   parts:[{surface:form.slice(0,owner.shape.length),role:'Likely '+owner.person+' possessive prefix'},
    {surface:form.slice(owner.shape.length),role:'Remaining possessed-noun base'}]});
 }
 return ret;
}
const sentence=ctx.window.TlahtolliSentence.create(d,p,morph,null,null,rules,poss);
const engine=ctx.window.TlahtolliGrammarIR.create(d),analyze=text=>sentence.analyze(text);
const graph=(text,result=analyze(text))=>engine.build(text,result);
const form=(lemma,who=2)=>p.paradigms[lemma].cells[0][who];
const view=(g,role)=>g.edges.filter(e=>e.relation===role);
const copy=x=>JSON.parse(JSON.stringify(x));
const rel3='in iicxi in '+form('itta',2);
const two=graph(rel3);
assert.deepEqual(Array.from(new Set(view(two,'possible-relative-gap').map(e=>e.gapRole))).sort(),
 ['relative object','relative subject']);
assert(two.agreementAudit.checked>=2);
assert.equal(two.agreementAudit.rejected.length,0);
assert.equal(two.agreementAudit.status,'source-bounded grammatical role checks; NOT reference resolution');
assert(two.edges.every(e=>e.status==='candidate-only'&&e.notIdentity));
assert(two.nodes.some(n=>n.kind==='nominal-mention'&&n.possessor==='3sg'));
const rel1='in iicxi in '+form('itta',0);
const one=graph(rel1);
assert.deepEqual(Array.from(view(one,'possible-relative-gap'),e=>e.gapRole),['relative object']);
const fakeSubject=copy(analyze(rel1));
fakeSubject.clauses[0].relativeClauseProposals[0].relative.headGapRole='relative subject';
const guarded=graph(rel1,fakeSubject);
assert.equal(view(guarded,'possible-relative-gap').length,0);
assert.equal(guarded.agreementAudit.rejected[0].kind,'relative');
assert.equal(guarded.agreementAudit.accepted,0);
const fakeObject=copy(analyze(rel1));
fakeObject.clauses[0].relativeClauseProposals[0].relative.transitive=false;
assert.equal(view(graph(rel1,fakeObject),'possible-relative-gap').length,0);
// The nominal possessor is not the finite verb subject, even when person labels coincide.
const transit='niquitta iicxi';
const object=graph(transit);
assert(view(object,'possible-grammatical-argument').some(e=>
 e.nominalPossessorPerson==='3sg'&&e.verbSubjectPerson==='1sg'&&
 e.subjectPossessorUnified===false));
const wrongSub=copy(analyze(transit));
wrongSub.clauses[0].possessedAgreement.items.forEach(x=>
 x.possessedNoun.role='possible grammatical subject');
const disallowed=graph(transit,wrongSub);
assert.equal(view(disallowed,'possible-grammatical-argument').length,0);
assert(disallowed.agreementAudit.rejected.some(x=>x.kind==='possessed'));
const intrans='nemi iicxi',subject=graph(intrans);
assert(view(subject,'possible-grammatical-argument').some(e=>e.role==='possible grammatical subject'));
const wrongObj=copy(analyze(intrans));
wrongObj.clauses[0].possessedAgreement.items.forEach(x=>
 x.possessedNoun.role='possible grammatical object');
assert.equal(view(graph(intrans,wrongObj),'possible-grammatical-argument').length,0);
const dif='in nocal in '+form('chōca',2);
const native=graph(dif);
assert(native.nodes.some(x=>x.kind==='nominal-mention'&&x.possessor==='1sg'));
assert(view(native,'possible-relative-gap').every(e=>e.notIdentity));
const valid='chōca in cihuātl. nemi.';
const good=graph(valid);
assert.equal(view(good,'antecedent-candidate').length,1);
assert.equal(good.unresolved.pronounIdentity,true);
// Forge a candidate from a relative HEAD (not an overt matrix subject).
const head='in cihuātl in '+form('chōca',2)+'. '+form('nemi',2)+'.';
const injected=copy(analyze(head));
const source=d.words.find(w=>w.word==='cihuātl').source;
injected.antecedentProposals=[{confidence:'candidate-only',fromClause:0,toClause:1,
 personConstraint:'3sg ↔ 3sg',antecedent:{written:'cihuātl',source}}];
assert.equal(view(graph(head,injected),'antecedent-candidate').length,0);
assert(graph(head,injected).agreementAudit.rejected.some(x=>x.kind==='discourse'));
// Unsupported intervening syntax blocks a forged cross-clause link.
const gap='chōca in cihuātl. unknown. nemi.';
const broken=copy(analyze(gap));
broken.discourseReferenceProposals=[{confidence:'candidate-only',toClause:2,
 candidates:[{fromClause:0,distance:2,agreement:'3sg ↔ 3sg',
  antecedent:{written:'cihuātl',source}}]}];
assert.equal(view(graph(gap,broken),'antecedent-candidate').length,0);
assert(graph(gap,broken).agreementAudit.rejected.some(x=>x.kind==='discourse'));
// An overt OBJECT must never seed the same discourse slot.
const obj='niquitta in cihuātl. nemi.';
const changed=copy(analyze(obj));
changed.antecedentProposals=[{confidence:'candidate-only',fromClause:0,toClause:1,
 personConstraint:'3sg ↔ 3sg',antecedent:{written:'cihuātl',source}}];
assert.equal(view(graph(obj,changed),'antecedent-candidate').length,0);
// Neither third-person grammatical compatibility nor same noun proves identity.
assert(view(good,'antecedent-candidate').every(e=>e.coReferenceResolved===false&&
 e.unmentionedReferentsPossible===true));
assert(!good.nodes.some(n=>n.kind==='nominal-mention'&&n.referentId!==null));
const repeat=graph(valid);
assert.equal(JSON.stringify(repeat),JSON.stringify(good));
console.log('PASS grammar IR agreement audit: local valency/person guardrails, owner/subject separation, explicit overt antecedent provenance, intervening-scope refusal and deterministic no-coreference graph.');
