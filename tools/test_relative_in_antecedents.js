// Classical Nahuatl in: bounded headed relative, finite subordinate,
 // and cautiously proposed (never resolved) antecedents.
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'..');
const dict=JSON.parse(fs.readFileSync(path.join(root,'dictionary.json'),'utf8'));
const paradigms=JSON.parse(fs.readFileSync(path.join(root,'paradigms.json'),'utf8'));
const research=JSON.parse(fs.readFileSync(path.join(root,'research/translation_corpus/research_examples.json'),'utf8'));
const scope={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'translator-locative.js'),'utf8'),scope);
vm.runInNewContext(fs.readFileSync(path.join(root,'translator-sentence.js'),'utf8'),scope);
const make=(d=dict,p=paradigms)=>scope.window.TlahtolliSentence.create(
 d,p,()=>[],research,scope.window.TlahtolliLocative.create(d,research));
const analyze=s=>make().analyze(s);
function relative(input,n,roles){
 const result=analyze(input),clause=result.clauses[0];
 assert.equal(result.complete,false,input);
 assert.equal(clause.candidates.length,0,input);
 assert.equal(clause.relativeClauseProposals.length,n,input);
 assert.deepEqual(Array.from(clause.relativeClauseProposals,p=>p.relative.headGapRole).sort(),
  roles.slice().sort(),input);
 for(const c of clause.relativeClauseProposals){
  assert.equal(c.head.antecedentStatus,'explicit lexical head; referent identity NOT determined');
  assert.equal(c.coverage,input.split(/\s+/u).length);
  assert.equal(c.head.article,'in');
  assert.equal(c.relative.marker,'in');
  assert(c.grade.includes('NOT an attested sentence translation'));
  assert(c.sources.some(u=>u.includes('noun-clauses')||u.includes('attributives-relative')));
  assert.match(c.note,/does not identify a pronoun/);
 }
 return clause.relativeClauseProposals;
}
const intrans=relative('in cihuātl in chōca',1,['relative subject'])[0];
assert.equal(intrans.head.lemma,'cihuātl');
assert.equal(intrans.relative.lemma,'chōca');
assert.equal(intrans.relative.subjectPerson,'3sg');
assert.equal(intrans.matrix,null);
const transOne=relative('in cihuātl in niquitta',1,['relative object'])[0];
assert.equal(transOne.relative.subjectPerson,'1sg');
assert.equal(transOne.relative.transitive,true);
relative('in cihuātl in quitta',2,['relative subject','relative object']);
relative('in conetl in chōca',1,['relative subject']);
relative('in calli in niquitta',1,['relative object']);
relative('in cihuātl in tiquitta',1,['relative object']);
for(const [text,role,gap] of [
 ['niquitta in cihuātl in chōca','matrix object','relative subject'],
 ['nemi in cihuātl in chōca','matrix subject','relative subject'],
 ['niquitta in cihuātl in niquitta','matrix object','relative object']
]){
 const r=relative(text,1,[gap])[0];
 assert.equal(r.matrix.headRole,role);
 assert.equal(r.matrix.written,text.split(' ')[0]);
}
const ambiguous=relative('quitta in cihuātl in quitta',4,
 ['relative subject','relative object','relative subject','relative object']);
assert.deepEqual(Array.from(new Set(ambiguous.map(x=>x.matrix.headRole))).sort(),
 ['matrix object','matrix subject']);
const reject=[
 'in cihuātl','in cihuātl chōca','cihuātl in chōca',
 'in cihuātl in','in cihuātl in xyz','in unknown in chōca',
 'in cihuātl in nichōca','in cihuātl in tinemi',
 'in cihuātl in onicoch','in cihuātl in niquitta in conetl',
 'in cihuātl in chōca extra','in cihuātl in chōca auh nemi',
 'ninemi in cihuātl in chōca','ninemi in cihuātl in niquitta',
 'niquitta in cihuātl in xyz','niquitta in unknown in chōca',
 'niquitta in cihuātl in chōca extra',
 'in cihuātl in chōca?','ahmo in cihuātl in chōca'
];
for(const text of reject){
 const c=analyze(text).clauses[0];
 assert.equal(c.relativeClauseProposals?.length||0,0,'Must refuse unsupported relative: '+text);
}
function dependent(input,matrix,dep){
 const a=analyze(input),c=a.clauses[0];
 assert.equal(a.complete,false);
 assert.equal(c.candidates.length,0);
 assert.equal(c.nominalInProposals.length,1,input);
 const x=c.nominalInProposals[0];
 assert.equal(x.matrix.lemma,matrix);
 assert.equal(x.dependent.lemma,dep);
 assert.equal(x.coverage,3);
 assert.equal(x.dependent.marker,'in');
 assert.match(x.construction,/possible nominalized complement/);
 assert.match(x.note,/causal\/purpose\/temporal sense/);
 assert(x.sources.some(url=>url.includes('/noun-clauses/')));
 return x;
}
dependent('nicmati in nichōca','mati','chōca');
dependent('niquitta in ninemi','itta','nemi');
dependent('quimati in chōca','mati','chōca');
dependent('niquittaz in chōcaz','itta','chōca');
for(const text of [
 'ninemi in chōca', // matrix intransitive
 'nichōca in ninemi', // matrix intransitive
 'nicchīhua in chōca', // source has not yet established matrix valency
 'nicmati in cihuātl', // article + noun, NOT dependent verb
 'niquitta in cihuātl',
 'nicmati in unknown','nicmati yn nichōca','nicmati in onicoch',
 'nicmati in niquitta extra','ahmo nicmati in nichōca',
 'nicmati in nichōca in conetl',
 'nicmati in chōca?'
])assert.equal(analyze(text).clauses[0].nominalInProposals?.length||0,0,text);
const ref=analyze('chōca in cihuātl. nemi.');
assert.equal(ref.antecedentProposals.length,1);
const proposal=ref.antecedentProposals[0];
assert.equal(proposal.antecedent.written,'cihuātl');
assert.equal(proposal.pronounSlot,'unexpressed 3sg subject indexed on subsequent finite verb');
assert.match(proposal.status,/NOT resolved reference/);
assert.match(proposal.alternatives,/Unmentioned third-person/);
assert.match(proposal.note,/DOES NOT prove/);
for(const text of [
 'niquitta in cihuātl. nemi.', // overt noun is object, not unambiguous subject
 'quitta in cihuātl. nemi.', // 3sg subject/object assignment ambiguous
 'chōca in cihuātl. nichōca.', // 1sg next verb
 'chōca in cihuātl. nemi in conetl.', // next has explicit subject
 'chōca in cihuātl. niquitta in conetl.',
 'chōca in cihuātl. ninemi. nemi.', // non-adjacent antecedent not inherited
 'in cihuātl in chōca. nemi.', // relative fragment not matrix assertion
 'niquitta in cihuātl in chōca. nemi.',
 'chōca in cihuātl. unknown.',
 'chōca in cihuātl. nemi. nichōca.'
]){
 const r=analyze(text);
 assert.equal(r.antecedentProposals?.length||0,0,'Do not guess participant identity: '+text);
}
const normal=analyze('niquitta in cihuātl');
assert.equal(normal.complete,true);
assert.equal(normal.clauses[0].candidates[0].english[0],'I see the woman');
assert.equal(normal.clauses[0].relativeClauseProposals.length,0);
assert.equal(normal.clauses[0].nominalInProposals.length,0);
assert.equal(analyze('ninemi auh nichōca').multiClauseProposals.length,1);
assert.equal(analyze('intla ninemi, nichōca').multiClauseProposals.length,1);
assert.equal(analyze('ninemi calli itic').clauses[0].complexClauseProposals.length,1);
const corrupted=JSON.parse(JSON.stringify(dict));
corrupted.words.find(x=>x.word==='cihuātl').source='javascript:alert(1)';
assert.equal(make(corrupted).analyze('in cihuātl in chōca').clauses[0].relativeClauseProposals.length,0);
console.log('PASS: headed in-relatives, 3sg role ambiguity, constrained clausal dependency, source-safe head candidates, no cross-sentence identity or unsupported grammar.');
