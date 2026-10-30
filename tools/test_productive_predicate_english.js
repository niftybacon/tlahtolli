'use strict';
// Constructed software cases, NOT historical examples or translation accuracy.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),json=p=>JSON.parse(read(p));
const D=json('dictionary.json'),P=json('paradigms.json'),E=json('data/predicate_english.json');
const morphSource=read('tools/morphology_engine.js').split('renderMorphologyBreakdown=TlahtolliMorphEngine.html;')[0];
function load(edit=()=>{},editPack=()=>{},provider=null){
 const d=structuredClone(D),pack=structuredClone(E);edit(d.words);editPack(pack);
 const ctx={window:{},words:d.words,FULL_VERB_PARADIGMS:P.paradigms,VERB_TENSES:P.patterns,
  norm:s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(),
  stripToken:s=>String(s||'').replace(/^[^\p{L}\p{M}]+|[^\p{L}\p{M}]+$/gu,''),
  historicalSpellings:w=>String(w.original||'').split(/[;,/]+/).map(s=>s.trim()).filter(Boolean),
  safe:String,validUrl:()=>true,safeLink:()=>''};
 vm.runInNewContext(morphSource+'\nthis.morph=TlahtolliMorphEngine;',ctx);
 for(const file of ['translator-sentence.js','translator-locative.js','translator-english.js','translator-grammar-ir.js'])
  vm.runInNewContext(read(file),ctx,{filename:file});
 const research=json('research/translation_corpus/research_examples.json');
 const sentence=ctx.window.TlahtolliSentence.create(d,P,provider||ctx.morph.analyze,research,
  ctx.window.TlahtolliLocative.create(d,research),json('data/clause_grammar.json'),
  json('data/possessed_form_evidence.json'),json('data/source_finite_context.json'),json('data/passages.json'),pack);
 const english=ctx.window.TlahtolliEnglish.create(sentence);
 const ir=ctx.window.TlahtolliGrammarIR.create(d,json('data/passages.json'),P,sentence);
 const run=text=>{
  const result=sentence.analyze(text),graph=ir.build(text,result),raw=english.compose(text,result);
  const composed=ir.auditEnglish(raw,result,graph);
  return {result,graph,raw,composed,text:composed.available?english.render(composed):null};
 };
 return {run,ctx,sentence,english,ir};
}
const e=load();
const cases=[
 ['nicochi','I sleep.'],['ticochi','You (singular) sleep.'],
 ['ahmo nicochi','I do not sleep.'],['ōnicoch','I slept.'],
 ['onicoch','I slept.'],['ōticoch','You (singular) slept.'],
 ['ahmo ōticoch','You (singular) did not sleep.'],
 ['cochiz in cihuātl','The woman will sleep.'],
 ['in cihuātl cochiz','The woman will sleep.'],
 ['ōcoch in cihuātl','The woman slept.'],
 ['nicochiz','I will sleep.'],['ticochiz','You (singular) will sleep.'],
 ['cochiz','He / she / it will sleep.'],['ticochizqueh','We will sleep.'],
 ['ancochizqueh','You (plural) will sleep.'],['cochizqueh','They will sleep.'],
 ['ōticochqueh','We slept.'],['ōancochqueh','You (plural) slept.'],['ōcochqueh','They slept.'],
 ['ticochih','We sleep.'],['ancochih','You (plural) sleep.'],['cochih','They sleep.'],
 ['nitēmi','I am full.'],['titēmi','You (singular) are full.'],
 ['ōnitēn','I was full.'],['ahmo ōnitēn','I was not full.'],
 ['tēmiz','He / she / it will be full.'],['ahmo nipāqui','I am not happy.'],
 ['ōnipāc','I was happy.'],['ahmo nimiquiz','I will not die.'],
 ['nitlapāca','I wash something.'],['onitlapacac','I washed something.'],
 ['nitetlazohtla','I love someone.'],['onitetlazotlac','I loved someone.'],
 ['nicochi in calli itic','Inside the house, I sleep.'],
 ['nitlapāca in calli itic','Inside the house, I wash something.'],
 ['niquitta in cihuātl in cochiz','I see the woman that will sleep.'],
 ['cochiz in cihuātl in chōca','The woman that cries will sleep.'],
 ['niquitta in cihuātl in ōcoch','I see the woman that slept.'],
 ['nicochi auh nitlapāca. ahmo nimiquiz.','I sleep. I wash something. I will not die.'],
 ['niquitta in cihuātl in cochiz auh nicochi in calli itic. ahmo nimiquiz.',
  'I see the woman that will sleep. Inside the house, I sleep. I will not die.']
];
for(const [input,expected] of cases){
 const got=e.run(input);assert.equal(got.text,expected,input);
 assert.equal(got.composed.verified,false);
 assert.equal(got.composed.audit.optionsRetained,true);
 assert(got.composed.units.every(u=>u.options.every(o=>o.sources.length&&o.sources.every(s=>s.startsWith('https://')))));
}
// An ambiguous English lexical entry remains a visible, unranked choice.
assert(e.run('niquiza').composed.units[0].options.some(o=>o.text==='I emerge'));
assert.equal(e.run('nicochi').result.clauses[0].candidates[0].frame.morphologyEvidence.grade,'hypothesis');
assert.equal(e.run('ōnicoch').result.clauses[0].candidates[0].frame.morphologyEvidence.grade,'lexical');
for(const input of [
 'nitlapāca in cihuātl','nitetlazohtla in cihuātl', // indefinite ≠ overt specific object
 'nicochi in cihuātl','nicochi in cihuātl in conetl', // 1sg subject ≠ third-person NP
 'niquitta in cihuātl in nitlapāca', // indefinite object ≠ relative head gap
 'ninotlazotla','oninotlazotlac', // reflexive person/object not licensed here
 'nitlapācaz','niccochi','nicochī','nicōchi','nitēmi in xyzzy',
 'nicochi xyzzy','xyzzy nicochi','nicochi. xyzzy. nitlapāca',
 'nicochi <script>alert(1)</script>','nicochi?',
 'intla nicochi nimiquiz', // conditional cannot silently become indicative coordination
 Array(25).fill('nicochi').join('. ')
])assert.equal(e.run(input).text,null,input);
assert(e.run(Array(24).fill('nicochi').join('. ')).text);
// No mutation to legacy indexed grammar, even when the optional data is absent.
assert.equal(load(()=>{},p=>p.entries=[]).run('nicochi').text,null);
assert.equal(load(()=>{},p=>p.entries=[]).run('nichōca').text,'I cry.');
const mutations=[
 w=>w.status='Provisional',w=>w.source='https://example.org/unrelated',
 w=>w.meaning+=' changed',w=>w.pos='verb (transitive)',
 ...['headword','meaning','pos'].map(field=>w=>w.claims=w.claims.filter(c=>c.field!==field)),
 w=>w.claims=w.claims.map(c=>({...c,locator:''})),
 w=>w.claims=w.claims.map(c=>({...c,assessment:'unverified'}))
];
for(const edit of mutations){
 const test=load(words=>edit(words.find(w=>w.word==='cochi')));
 assert.equal(test.run('nicochi').text,null,'missing/stale lexical evidence must fail closed');
 assert.equal(test.run('nichōca').text,'I cry.');
}
assert.equal(load(words=>words.push(structuredClone(words.find(w=>w.word==='cochi')))).run('nicochi').text,null);
assert.equal(load(()=>{},p=>p.entries.push(structuredClone(p.entries[0]))).run('nicochi').text,null);
assert.equal(load(()=>{},p=>p.version=999).run('nicochi').text,null);
assert.equal(load(()=>{},p=>p.entries[0].senses[0].base='<img src=x>').run('nicochi').text,null);
assert.equal(load(words=>words.find(w=>w.word==='cochi').inflections=[]).run('ōnicoch').text,null);
assert.equal(load(words=>words.find(w=>w.word==='cochi').claims=words.find(w=>w.word==='cochi').claims.filter(c=>c.field!=='stem')).run('cochiz').text,null);
for(const provider of [()=>[],()=>{throw Error('unavailable');},()=>[{lemma:'cochi',kind:'archive guess',grade:'unreviewed',parts:[]}]] )
 assert.equal(load(()=>{},()=>{},provider).run('nicochi').text,null);
// An English option cannot elevate/erase morphology or falsify its person/word.
for(const mutate of [
 f=>delete f.morphologyEvidence,f=>f.morphologyEvidence.grade='manuscript',
 f=>f.morphologyEvidence.written='xyzzy',f=>f.morphologyEvidence.source='https://example.org/forged',
 f=>f.morphologyEvidence.person=3,f=>f.tense='future',f=>f.subjectPerson=3
]){
 const r=e.run('nicochi');mutate(r.raw.units[0].options[0].structure.frame);
 assert.equal(e.ir.auditEnglish(r.raw,r.result,r.graph).available,false);
}
const missingVerifier=e.ctx.window.TlahtolliGrammarIR.create(D,json('data/passages.json'),P);
const r=e.run('nicochi');assert.equal(missingVerifier.auditEnglish(r.raw,r.result,r.graph).available,false);
// Broad integration coverage: every admitted source-listed exact past and
// every analyzer-supported 1sg present must reach audited English. Forms are
// diagnostic probes; this does not claim their independent attestation.
let lexical=0,hypotheses=0,productiveCells=0;const reached=new Set();
for(const spec of E.entries){
 const w=D.words.find(w=>w.word===spec.lemma);
 for(const f of w.inflections||[]){
  if(!/^Preterite 1sg\b/u.test(f.category)||!/intransitive/.test(w.pos)&&
   !/animate indefinite object|unspecified object/.test(f.category))continue;
  if(!['dictionary','text'].includes(f.evidence))continue;
  const result=e.run(f.form);
  assert(result.text,`${spec.lemma}: admitted recorded past ${f.form} must compose`);
  lexical++;reached.add(spec.lemma);
 }
 for(const prefix of ['ni','n','nitla','nite']){
  const form=prefix+spec.lemma;
  if(!e.ctx.morph.analyze(form).some(m=>m.lemma===spec.lemma&&m.grade==='hypothesis'&&
   /^(Regular intransitive present|Source-template transitive present) hypothesis$/.test(m.kind)))continue;
  assert(e.run(form).text,`${spec.lemma}: analyzer-supported present ${form} must compose`);
  hypotheses++;reached.add(spec.lemma);
 }
 // Try the six-person future and present-plural cells against the existing
 // analyzer. Only licensed, feature-labelled cells enter the coverage count.
 for(const prefix of ['ni','ti','','an'])for(const object of ['', 'tla','te'])
  for(const ending of ['z','zqueh','h']){
   const form=prefix+object+spec.lemma+ending;
   const licensed=e.ctx.morph.analyze(form).some(m=>m.lemma===spec.lemma&&m.grade==='hypothesis'&&
    /^(Source-class1|Source-stem-class) (future|plural future|plural present) hypothesis$/.test(m.kind)&&
    (m.features.object==='intransitive'||/^(nonhuman|human) indefinite \(/.test(m.features.object||'')));
   if(!licensed)continue;
   assert(e.run(form).text,`${spec.lemma}: licensed tense/person cell ${form} must compose`);
   productiveCells++;
  }
}
assert(reached.size>=70,'accidental return to a tiny hand-selected paradigm list');
console.log(`PASS productive predicate English: ${cases.length} sentence/paragraph cases, evidence/role negative controls; ${reached.size}/${E.entries.length} editorial entries reached, ${lexical} exact recorded past probes, ${hypotheses} canonical present hypotheses and ${productiveCells} further licensed tense/person cells (NOT accuracy).`);
