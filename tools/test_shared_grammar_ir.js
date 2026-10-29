'use strict';
// Engineering regressions for a SHARED, PROVISIONAL grammar graph.
// Synthetic compositions are not attested Nahuatl or verified translations.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),scope={window:{}};
for(const file of ['translator-sentence.js','translator-grammar-ir.js'])
 vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8'),scope,{filename:file});
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const dictionary=read('dictionary.json'),paradigms=read('paradigms.json');
const grammar=read('data/clause_grammar.json'),poss=read('data/possessed_form_evidence.json');
function morph(token){
 const result=[];
 for(const w of dictionary.words.filter(x=>x.pos==='noun')){
  const form=String(w.possessed||'').split('(')[0].trim();
  if(form.normalize('NFC').toLowerCase()!==String(token).normalize('NFC').toLowerCase())continue;
  const owner=form.startsWith('no')?{p:'1sg',shape:'no'}:
   poss.records.some(x=>x.form===form)?{p:'3sg',shape:'i'}:null;
  if(!owner)continue;
  const c=(w.claims||[]).find(x=>x.field==='possessed');if(!c)continue;
  result.push({lemma:w.word,kind:'Editorially listed possessed form',grade:'lexical',
   source:c.source,locator:c.locator,features:{partOfSpeech:'noun',evidence:c.assessment},
   parts:[{surface:form.slice(0,owner.shape.length),role:'Likely '+owner.p+' possessive prefix'},
    {surface:form.slice(owner.shape.length),role:'Remaining possessed-noun base'}]});
 }
 return result;
}
const grammarEngine=scope.window.TlahtolliSentence.create(
 dictionary,paradigms,morph,null,null,grammar,poss);
const graphEngine=scope.window.TlahtolliGrammarIR.create(dictionary);
const spell=(lemma,person=2)=>paradigms.paradigms[lemma].cells[0][person];
const v=spell('mati',0),rel=spell('chōca',2),cry=spell('chōca',2),live=spell('nemi',2);
const sentence=v+' in '+v+' in iicxi in '+rel;
const input=sentence+'. '+cry+' in cihuātl. '+live+'.';
const analyzed=grammarEngine.analyze(input);
assert(analyzed.clauses[0].nestedInProposals?.some(x=>x.terminal?.kind==='headed-relative'),
 'Underlying nested analyzer must support the exact cited possessed head');
assert.equal(analyzed.discourseReferenceProposals?.length,1);
const ir=graphEngine.build(input,analyzed);
assert.equal(ir.schema,'tlahtolli-grammar-ir-v1');
assert.equal(ir.clauseIds.length,3);
assert.equal(ir.counts.clauses,3);
assert(ir.counts.nestedDependencies>=1);
assert(ir.counts.antecedentCandidates>=1);
assert.equal(ir.unresolved.pronounIdentity,true);
assert.equal(ir.unresolved.possessorIdentity,true);
assert.equal(ir.unresolved.sourceAttestationOfComposedSentence,true);
const possessed=ir.nodes.filter(x=>x.kind==='nominal-mention'&&x.written==='iicxi');
assert.equal(possessed.length,1,'One stable token mention shared by structural alternatives');
assert.equal(possessed[0].possessor,'3sg');
assert(possessed[0].possessorEvidence.includes('icxitl'));
assert.equal(possessed[0].referentId,null);
assert(ir.edges.some(e=>e.relation==='possible-relative-gap'&&e.from===possessed[0].id));
assert(ir.edges.some(e=>e.relation==='in-subordinate-dependency'));
const nominal=ir.nodes.find(x=>x.kind==='nominal-mention'&&x.written==='cihuātl');
assert(nominal&&nominal.possessor===null);
const discourse=ir.edges.filter(e=>e.relation==='antecedent-candidate');
assert(discourse.length>=1);
assert(discourse.every(e=>e.from===nominal.id&&e.notIdentity&&e.coReferenceResolved===false));
assert(!discourse.some(e=>e.from===possessed[0].id));
assert(ir.edges.every(e=>e.status==='candidate-only'&&e.notIdentity));
assert(ir.nodes.filter(n=>n.kind==='finite-predicate').some(n=>n.subjectPerson==='1sg'));
assert(ir.nodes.filter(n=>n.kind==='finite-predicate').some(n=>n.subjectPerson==='3sg'));
const firstOnly=graphEngine.build(sentence,grammarEngine.analyze(sentence));
assert.equal(firstOnly.counts.antecedentCandidates,0);
assert(firstOnly.nodes.some(x=>x.kind==='nominal-mention'&&x.possessor==='3sg'));
const oneOwner=graphEngine.build('in nocal in '+rel,grammarEngine.analyze('in nocal in '+rel));
assert(oneOwner.nodes.some(n=>n.kind==='nominal-mention'&&n.possessor==='1sg'));
const plain=graphEngine.build('in cihuātl in '+rel,grammarEngine.analyze('in cihuātl in '+rel));
assert(plain.nodes.some(n=>n.kind==='nominal-mention'&&n.possessor===null));
for(const unsupported of ['in inxiuh in '+rel,'in itlatqui in '+rel,'in imitzcuinoan in '+rel]){
 const u=graphEngine.build(unsupported,grammarEngine.analyze(unsupported));
 assert.equal(u.nodes.filter(n=>n.kind==='nominal-mention').length,0);
 assert.equal(u.counts.antecedentCandidates,0);
}
const ambiguous=graphEngine.build('in iicxi in '+spell('itta',2),
 grammarEngine.analyze('in iicxi in '+spell('itta',2)));
const gap=ambiguous.edges.filter(e=>e.relation==='possible-relative-gap');
assert.deepEqual(Array.from(new Set(gap.map(e=>e.gapRole))).sort(),
 ['relative object','relative subject']);
const back=graphEngine.build(input,analyzed);
assert.equal(JSON.stringify(ir),JSON.stringify(back),'Deterministic IDs and non-mutating graph synthesis');
assert(!JSON.stringify(analyzed).includes('referentId'),'Never write identity IDs into original analysis');
const bad=JSON.parse(JSON.stringify(analyzed));
bad.discourseReferenceProposals[0].candidates[0].antecedent.source='javascript:alert(1)';
const rejected=graphEngine.build(input,bad);
assert.equal(rejected.counts.antecedentCandidates,0,'Malicious evidence source cannot grant reference link');
const invalidLink=JSON.parse(JSON.stringify(analyzed));
invalidLink.discourseReferenceProposals[0].candidates[0].agreement='1sg ↔ 3sg';
assert.equal(graphEngine.build(input,invalidLink).counts.antecedentCandidates,0);
const absent=graphEngine.build('in iicxi in '+rel,grammarEngine.analyze('in iicxi in '+rel));
assert(!absent.edges.some(e=>e.relation==='antecedent-candidate'));
const capped=graphEngine.build('x', {clauses:Array.from({length:60},(_,i)=>({
 text:'x',tokens:['x'],candidates:[],complete:false}))});
assert(capped.counts.clauses<=32);
console.log('PASS: shared grammar graph links actual nested-in, source-cited possessed heads, and discourse antecedent candidates without pronoun identity, extra words or invented translation.');
