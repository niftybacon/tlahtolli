// Historical, source-gated locatives: nonfinite interpretation, not gold translation.
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'..');
const dict=JSON.parse(fs.readFileSync(path.join(root,'dictionary.json'),'utf8'));
const paradigms=JSON.parse(fs.readFileSync(path.join(root,'paradigms.json'),'utf8'));
const examples=JSON.parse(fs.readFileSync(path.join(root,'research/translation_corpus/research_examples.json'),'utf8'));
const scope={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'translator-locative.js'),'utf8'),scope);
vm.runInNewContext(fs.readFileSync(path.join(root,'translator-sentence.js'),'utf8'),scope);
const create=(d=dict,e=examples)=>scope.window.TlahtolliLocative.create(d,e);
const analyze=create().analyze;
const parsed=t=>scope.window.TlahtolliSentence.create(dict,paradigms,()=>[],examples,create()).analyze(t);
function expectProposal(text){
 const result=parsed(text),clause=result.clauses[0];
 assert.equal(result.complete,false,'Locative fragment is never a complete sentence: '+text);
 assert.equal(clause.complete,false);
 assert.equal(clause.candidates.length,0);
 assert.equal(clause.locativeInterpretations.length,1,'Required source-located relation: '+text);
 return clause.locativeInterpretations[0];
}
const historic=expectProposal('atl yitic nemjnj');
assert.equal(historic.construction,'Nominal location + possessed relational + unresolved agentive/verb form');
assert.equal(historic.sourceSpelling,'atl yitic nemjnj');
assert.equal(historic.place.lemma,'ātl');
assert.equal(historic.place.evidence,'recorded original spelling (dictionary)');
assert.equal(historic.relation.lemma,'itic');
assert.equal(historic.relation.written,'yitic');
assert.equal(historic.relation.lexicalPossessor,'3sg');
assert.equal(historic.relation.referenceWord,'atl');
assert(historic.relation.possessorStatus.includes('proposed'));
assert.equal(historic.extra.lemma,'nemini');
assert.equal(historic.extra.written,'nemjnj');
assert(historic.extra.syntacticRole.includes('UNRESOLVED'));
assert.equal(historic.coverage,3);
assert.equal(historic.grade,'historical fragment (nonblind, editorially consulted)');
assert(historic.editorialComparison.reading.includes('nemini requires contextual interpretation'));
assert.equal(historic.editorialComparison.review_status,'candidate, consulted; NOT test gold');
assert(historic.sources.some(s=>s.includes('/book/11/folio/62r')));
assert(historic.sources.some(s=>s.includes('/content/itic-0')));
assert(historic.sources.some(s=>s.includes('/content/atl')));
assert(historic.sources.some(s=>s.includes('/content/nemini')));
assert.equal(create().analyze(['atl','yitic','nemjnj'],true).length,0);
for(const item of [
 ['ātl itic','ātl','itic','itic'],
 ['calli itic','calli','itic','itic'],
 ['cihuātl ītech','cihuātl','ītech','ītech'],
 ['xōchitl itech','xōchitl','itech','ītech'],
 ['in calli itic','calli','itic','itic'],
 ['in ātl ītech','ātl','ītech','ītech'],
 ['calli itic nemini','calli','itic','itic'],
 ['in calli itic nemini','calli','itic','itic']
]){
 const [text,place,relation,lemma]=item,proposal=expectProposal(text);
 assert.equal(proposal.place.lemma,place);
 assert.equal(proposal.relation.written,relation);
 assert.equal(proposal.relation.lemma,lemma);
 assert.equal(proposal.editorialComparison,null,'Do not reuse editorial English on a novel clause');
 assert.equal(proposal.grade,'grammar-composed locative proposal (not independently attested)');
 assert.equal(proposal.coverage,text.split(/\s+/).length);
 assert.equal(proposal.sources.length>=2,true);
 if(text.includes('nemini'))assert(proposal.extra.syntacticRole.includes('UNRESOLVED'));
}
const unknowns=[
 'atl itec','atl ihtic','atl ytech','atl yītic','atl itic extra',
 'atl yitic notaword','atl yitic nemjnnj','atl yitic in nemjnj',
 'in in ātl itic','ātl in itic','itic atl','yitic atl',
 'in ātl','ātl','atl yitic nemjnj plus','atl yitic nemjnj.',
 'ahmo atl yitic nemjnj','calli itic in cihuātl',
 'atl yitic nemjnj cihuātl','atl yitic nemjnj nemini',
 'atl yitic chōca'
];
for(const text of unknowns){
 const raw=text.replace(/\.$/,'');
 const result=parsed(text);
 assert.equal(result.complete,false,text);
 if(text.endsWith('.'))continue; // Sentence-level punctuation is a clause boundary.
 assert.equal(result.clauses[0].locativeInterpretations?.length||0,0,
  'Unsupported variant, particle, or extra word must be refused: '+text);
}
assert.equal(create(dict,{entries:[]}).analyze(['atl','yitic','nemjnj'])[0].editorialComparison,null);
const noGold=[
 {train_eligible:true},{review_status:'approved'},{variety:'Modern Huasteca Nahuatl'},
 {source_url:'https://example.org/not-florentine'},
 {original:'ātl yitic nemini'},{passage_type:'complete sentence'}
];
for(const m of noGold){
 const x=JSON.parse(JSON.stringify(examples));
 Object.assign(x.entries.find(e=>e.id==='FC11-62r-fish-water'),m);
 const hit=create(dict,x).analyze(['atl','yitic','nemjnj'])[0];
 assert(hit);
 assert.equal(hit.editorialComparison,null,'Historical example is not gold or transferable: '+JSON.stringify(m));
}
for(const mutate of [
 w=>{w.variety='Modern Nahuatl';},
 w=>{w.source='https://example.net/fabricated';},
 w=>{w.pos='noun';},
 w=>{w.inflections=[];}
]){
 const d=JSON.parse(JSON.stringify(dict)),rel=d.words.find(w=>w.word==='itic');
 mutate(rel);
 assert.equal(create(d).analyze(['atl','yitic','nemjnj']).length,0,
  'Altered relational headword must not be promoted into a proposal');
}
for(const mutate of [
 w=>{w.variety='Modern Huasteca Nahuatl';},
 w=>{w.pos='verb';},
 w=>{w.source='javascript:alert(1)';}
]){
 const d=JSON.parse(JSON.stringify(dict));
 mutate(d.words.find(w=>w.word==='ātl'));
 assert.equal(create(d).analyze(['atl','yitic','nemjnj']).length,0);
}
let duplicate=JSON.parse(JSON.stringify(dict));
duplicate.words.push({...duplicate.words.find(w=>w.word==='calli'),word:'otherhouse',original:'calli'});
assert.equal(create(duplicate).analyze(['calli','itic']).length,0,'Unresolved dictionary collision must refuse');
const model=scope.window.TlahtolliSentence.create(dict,paradigms,()=>[],examples,create());
assert.equal(model.analyze('iuhqujn chimalli').clauses[0].fragmentInterpretations.length,1);
assert.equal(model.analyze('niquitta in cihuātl').clauses[0].candidates[0].english[0],'I see the woman');
assert.equal(model.analyze('ticnamaca y¯ totlal').complete,false);
console.log('PASS: independently sourced itic/ītech, FC 62r yitic/nemjnj, 8 compositional cases, novel noun relations, no-gold/foreign-variety and 20+ abstention cases.');
