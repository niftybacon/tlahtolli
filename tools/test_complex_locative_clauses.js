// Source-grounded finite verb + locative composition and strictly observable discourse context.
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'..');
const d=JSON.parse(fs.readFileSync(path.join(root,'dictionary.json'),'utf8'));
const paradigms=JSON.parse(fs.readFileSync(path.join(root,'paradigms.json'),'utf8'));
const examples=JSON.parse(fs.readFileSync(path.join(root,'research/translation_corpus/research_examples.json'),'utf8'));
const c={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'translator-locative.js'),'utf8'),c);
vm.runInNewContext(fs.readFileSync(path.join(root,'translator-sentence.js'),'utf8'),c);
const locative=c.window.TlahtolliLocative.create(d,examples);
const make=(l=locative,doc=d,par=paradigms)=>
 c.window.TlahtolliSentence.create(doc,par,()=>[],examples,l);
const engine=make(),analyze=s=>engine.analyze(s);
function proposed(input,count=1){
 const result=analyze(input),clause=result.clauses[0];
 assert.equal(result.complete,false,'Novel grammar composition is NOT a verified complete sentence: '+input);
 assert.equal(clause.complete,false);
 assert.equal(clause.candidates.length,0,'No fabricated fluent English sentence: '+input);
 assert.equal(clause.complexClauseProposals.length,count,input);
 for(const p of clause.complexClauseProposals){
  assert.equal(p.coverage,input.replace(/^ahmo /,'').trim().split(/\s+/u).length,
   'Every grammar token must be consumed (negation is separately indexed): '+input);
  assert.equal(p.grade,'grammar-composed verb + relational location (unattested; NOT a verified translation)');
  assert.equal(p.location.relation.lexicalPossessor,'3sg');
  assert(p.sources.some(url=>url.includes('nahuatl.wired-humanities.org')));
  assert(p.sources.some(url=>url.includes('nahugram.html')));
  assert(p.note.includes('No third-person pronoun resolution'));
 }
 return result.clauses[0].complexClauseProposals;
}
for(const [input,verb,person,location] of [
 ['ninemi calli itic','nemi','1sg','calli itic'],
 ['calli itic ninemi','nemi','1sg','calli itic'],
 ['ninemi in calli itic','nemi','1sg','in calli itic'],
 ['in calli itic ninemi','nemi','1sg','in calli itic'],
 ['nichōca ātl itic','chōca','1sg','ātl itic'],
 ['tinemih calli itic','nemi','1pl','calli itic'],
 ['ninemi cihuātl ītech','nemi','1sg','cihuātl ītech'],
 ['ninemi atl yitic','nemi','1sg','atl yitic'],
 ['tinemi xōchitl itech','nemi','2sg','xōchitl itech'],
 ['ahmo ninemi calli itic','nemi','1sg','calli itic'],
 ['niquitta calli itic','itta','1sg','calli itic'],
 ['niquittaz in cihuātl calli itic','itta','1sg','calli itic'],
 ['calli itic niquittaz in cihuātl','itta','1sg','calli itic'],
 ['in cihuātl niquittaz calli itic','itta','1sg','calli itic'],
 ['niquittaz calli itic in cihuātl','itta','1sg','calli itic']
]){
 const p=proposed(input)[0];
 assert.equal(p.verb.lemma,verb,input);
 assert.equal(p.verb.subjectPerson,person,input);
 assert.equal(p.location.written,location,input);
 assert.equal(p.verb.negative,input.startsWith('ahmo '),input);
 if(input.includes('in cihuātl')){
  assert.equal(p.arguments.object.word,'cihuātl',input);
  assert.deepEqual(Array.from(p.location.attachmentAlternatives),
   ['possible clause/event location','possible modification of the overt noun phrase'],input);
 }else{
  assert.equal(p.location.attachmentAlternatives.length,1,input);
 }
}
const ambiguous=proposed('quitta in cihuātl calli itic',2);
assert.deepEqual(Array.from(ambiguous,p=>p.arguments.subjectNoun).sort(),
 [null,'cihuātl'].sort(),'Third-person subject or object roles must remain unranked');
assert(ambiguous.some(p=>p.arguments.object.word==='cihuātl'&&p.arguments.subjectNoun===null));
assert(ambiguous.some(p=>p.arguments.subjectNoun==='cihuātl'&&p.arguments.object.word===null));
assert(ambiguous.every(p=>p.location.attachmentAlternatives.length===2));
const intr=proposed('nemi in cihuātl calli itic')[0];
assert.equal(intr.arguments.subjectNoun,'cihuātl');
assert.equal(intr.arguments.object.type,'intransitive predicate; no object licensed');
assert.equal(proposed('ahmo niquittaz in cihuātl calli itic')[0].verb.negative,true);
const noSupport=[
 'ninemi','calli itic','atl yitic nemjnj',
 'ninemi atl yitic nemjnj', // unresolved agentive/verbal final form
 'ninemi in calli itic nemini','ninemi calli ytech',
 'ninemi calli itec','ninemi unknown itic',
 'ninemi calli itic other','ninemi calli itic calli',
 'ninemi calli itic in unknown','ninemi in unknown itic',
 'ninemi in in calli itic','ninemi calli itic in cihuātl',
 'niquitta cihuātl calli itic', // bare unmarked overt argument
 'niquitta in cihuātl in conetl calli itic', // two arguments
 'ninemi in cihuātl calli itic', // 1sg intransitive cannot take overt subject
 'nemi in cihuātl in conetl calli itic',
 'quitta in cihuātl in conetl calli itic',
 'ahmo ahmo ninemi calli itic','in ninemi calli itic',
 'ninemi itic calli','ninemi calli itic?',
 'atl yitic ninemi nemjnj'
];
for(const input of noSupport){
 const result=analyze(input);
 if(input!=='ninemi')assert.equal(result.complete,false,input);
 else assert.equal(result.complete,true,'Retain the existing complete simple-verb grammar');
 assert.equal(result.clauses[0].complexClauseProposals?.length||0,0,
  'Never skip an unsupported token, extra argument, or manuscript-form role: '+input);
}
const repeated=analyze('ninemi calli itic. nichōca calli itic.');
assert.equal(repeated.clauses.length,2);
assert.equal(repeated.complete,false);
assert.equal(repeated.contextLinks.length,1);
assert.equal(repeated.contextLinks[0].locationWritten,'calli itic');
assert.equal(repeated.contextLinks[0].fromClause,0);
assert.equal(repeated.contextLinks[0].toClause,1);
assert.match(repeated.contextLinks[0].subjectAgreement,/same indexed grammatical person/);
assert.match(repeated.contextLinks[0].note,/not proof/);
const differing=analyze('ninemi calli itic. tinemi calli itic.');
assert.equal(differing.contextLinks.length,1);
assert.match(differing.contextLinks[0].subjectAgreement,/distinct or ambiguous/);
for(const input of [
 'ninemi calli itic. nichōca.',
 'ninemi calli itic. nichōca in ātl itic.',
 'ninemi calli itic. extra nichōca calli itic.',
 'ninemi calli itic. unknown calli itic.',
 'ninemi calli itic. ninemi calli itic extra'
])assert.equal(analyze(input).contextLinks.length,0,
 'Context must not invent inherited location or participant: '+input);
assert.equal(analyze('niquitta in cihuātl').clauses[0].candidates[0].english[0],
 'I see the woman','Original simple sentence behavior preserved');
assert.equal(analyze('iuhqujn chimalli').clauses[0].fragmentInterpretations.length,1);
assert.equal(analyze('atl yitic nemjnj').clauses[0].locativeInterpretations.length,1);
assert.equal(analyze('ticnamaca y¯ totlal').clauses[0].complexClauseProposals.length,0);
assert.equal(make(null).analyze('ninemi calli itic').clauses[0].complexClauseProposals.length,0,
 'Without locative source provider, composition must not become guessed syntax');
const tampered={analyze:()=>[{coverage:2,extra:null,sources:[],relation:{lemma:'itic',lexicalPossessor:'3sg'},place:{}}]};
assert.equal(make(tampered).analyze('ninemi calli itic').clauses[0].complexClauseProposals.length,0);
console.log('PASS: finite indexed verbs + independently sourced relational locations, 3sg role ambiguity, marked objects, varied order, negative, explicit repeated-place context, strict abstention.');
