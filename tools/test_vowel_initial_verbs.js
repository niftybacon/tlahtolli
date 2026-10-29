'use strict';
// Exhaustive canonical inventory; only source-checked frames license hypotheses.
// Launey (2011), 1.2: n-/t- before an adjacent vowel, ni-/ti- elsewhere.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const D=JSON.parse(read('dictionary.json'));
const P=JSON.parse(read('paradigms.json'));
const intake=JSON.parse(read('research/batches/classical_archive_verb_batch05_2026_10_29.json'));
const batch=JSON.parse(read('research/batches/source_stem_batch08_2026_10_29.json'));
const src=read('tools/morphology_engine.js').split('renderMorphologyBreakdown=TlahtolliMorphEngine.html;')[0];
function instantiate(words=D.words){
 const ctx={window:{},words,FULL_VERB_PARADIGMS:P.paradigms,VERB_TENSES:P.patterns,
  norm:s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(),
  stripToken:s=>String(s||'').replace(/^[^\p{L}\p{M}]+|[^\p{L}\p{M}]+$/gu,''),
  historicalSpellings:w=>String(w.original||'').split(/[;,/]+/).map(x=>x.trim()).filter(Boolean),
  safe:String,validUrl:()=>true,safeLink:()=>''};
 vm.runInNewContext(src+'\nthis.morph=TlahtolliMorphEngine;',ctx);
 return ctx.morph;
}
const morph=instantiate(),index=new Map(D.words.map(w=>[w.word,w]));
const vowel=/^[aeiouāēīōū]/iu;
const candidate=intake.entries.filter(w=>vowel.test(w.word));
assert.equal(candidate.length,48,'The frozen 268-verb intake must be audited in full');
assert.equal(new Set(candidate.map(x=>x.word)).size,48);
const all=D.words.filter(w=>vowel.test(w.word)&&String(w.pos).toLowerCase().startsWith('verb'));
assert(all.length>=48,'Current canonical set must include all Batch 05 vowel-initial verbs');
// All source-checked, explicitly intransitive candidate lemmas outside the 12
// indexed paradigms should follow the same prefix rule; no per-lemma hack.
const eligible=all.filter(w=>w.pos==='verb (intransitive)'&&
 !Object.prototype.hasOwnProperty.call(P.paradigms,w.word)&&
 ['headword','pos'].every(field=>w.claims.some(c=>c.field===field&&
  ['dictionary','text','grammar'].includes(c.assessment)&&/^https:\/\//.test(c.source||''))));
assert(eligible.length>=4,'Expected source-checked vowel-initial intransitives');
let present=0;
for(const w of eligible){
 for(const [prefix,person] of [['n','1sg'],['t','2sg']]){
  const token=prefix+w.word;
  const hits=morph.analyze(token).filter(a=>a.lemma===w.word&&
   a.kind==='Regular intransitive present hypothesis');
  // An exact historical/lexical match correctly outranks a hypothesis.
  const higher=morph.analyze(token).some(a=>a.lemma===w.word&&
   ['manuscript','lexical','grammar'].includes(a.grade));
  if(!higher){
   assert.equal(hits.length,1,w.word+': '+token);
   const h=hits[0];
   assert.equal(h.grade,'hypothesis');
   assert.equal(h.features.subject,person);
   assert.equal(h.parts[0].surface,prefix);
   assert.equal(h.parts.map(p=>p.surface).join(''),token);
   present++;
  }
  const falseToken=(person==='1sg'?'ni':'ti')+w.word;
  assert(!morph.analyze(falseToken).some(a=>a.lemma===w.word&&
   a.kind==='Regular intransitive present hypothesis'),
   'Must not invent extra epenthetic i: '+falseToken);
 }
}
// Independently recorded 1sg dictionary tokens permit bounded 2sg substitution,
// but do not imply an independently classified long/short stem.
const exact=[
 ['iztlacati','ōniztlacat','ōtiztlacat'],
 ['ichtequi','ōnichtec','ōtichtec'],
 ['iztaya','oniztaz','otiztaz'],
 ['ixhui','onixuic','otixuic']
];
for(const [lemma,first,second] of exact){
 const w=index.get(lemma);assert(w&&w.pos==='verb (intransitive)');
 assert(w.inflections.some(f=>f.form===first&&f.evidence==='dictionary'));
 assert(morph.analyze(first).some(a=>a.lemma===lemma&&a.grade==='lexical'),
  'Recorded historical form must stay lexical: '+first);
 const hits=morph.analyze(second).filter(a=>a.lemma===lemma&&
  a.kind==='Source-template singular preterite hypothesis');
 assert.equal(hits.length,1,lemma+': '+second);
 assert.equal(hits[0].grade,'hypothesis');
 assert.equal(hits[0].parts[1].surface,'t');
 assert.equal(hits[0].parts.map(p=>p.surface).join(''),second);
 for(const impossible of ['ōti'+first.replace(/^(?:o|ō)n/u,''),'ōni'+first.replace(/^(?:o|ō)n/u,'')]){
  assert(!morph.analyze(impossible).some(a=>a.lemma===lemma&&
   a.kind==='Source-template singular preterite hypothesis'),impossible);
 }
}
// New stem licenses are independent Lockhart Class 2 source claims, not
// deductions from the productive vowel allomorph. Test each real source pair.
for(const [lemma,base2,augment] of [
 ['iztlacati','iztlacat','ō'],['ichtequi','ichtec','ō']]){
 const w=index.get(lemma),claim=w.claims.find(c=>c.field==='stem');
 assert.equal(w.stem,lemma+'-; '+base2+'-');
 assert.equal(claim.assessment,'dictionary');
 assert.equal(claim.source,w.source);
 assert.match(claim.locator,/Lockhart 2001/);
 const positives=[
  ['n'+lemma+'z','Source-stem-class future hypothesis','1sg'],
  ['t'+lemma+'z','Source-stem-class future hypothesis','2sg'],
  [augment+'t'+base2+'queh','Source-stem-class plural preterite hypothesis','1pl'],
  ['t'+lemma+'zqueh','Source-stem-class plural future hypothesis','1pl'],
  ['t'+lemma+'h','Source-stem-class plural present hypothesis','1pl']
 ];
 for(const [token,kind,person] of positives){
  const a=morph.analyze(token).filter(x=>x.lemma===lemma&&x.kind===kind);
  assert.equal(a.length,1,lemma+' '+token+' '+kind);
  assert.equal(a[0].grade,'hypothesis');
  assert.equal(a[0].features.subject,person);
  assert.equal(a[0].parts.map(x=>x.surface==='Ø'?'':x.surface).join(''),token);
  assert(!w.inflections.some(x=>x.form===token),'Generated is NOT sourced '+token);
 }
 for(const bad of ['ni'+lemma+'z','ti'+lemma+'z',augment+'ti'+base2+'queh']){
  assert(!morph.analyze(bad).some(a=>a.lemma===lemma&&
   a.kind.startsWith('Source-stem-class')),lemma+' must reject '+bad);
 }
}
// Provisional archive candidates and mixed transitive/reflexive frames cannot
// inherit productive vowel-initial, intransitive hypotheses by orthography.
for(const w of all.filter(w=>w.pos==='verb (provisional archive index)'||
 w.pos==='verb (transitive/reflexive)'||w.pos==='verb (transitive)')){
 assert(!morph.analyze('n'+w.word).some(a=>a.lemma===w.word&&
  a.kind==='Regular intransitive present hypothesis'),w.word);
}
assert(batch.entries.some(x=>x.word==='iztlacati'&&!x.class));
assert(batch.entries.some(x=>x.word==='ichtequi'&&!x.class));
console.log('PASS vowel-boundary census: '+all.length+' canonical vowel-initial verb-labelled records ('+
 candidate.length+' frozen intake), '+eligible.length+' source-checked intransitives, '+
 present+' documented-gate present hypotheses, '+exact.length+
 ' source-template preterite tests; provisional/ambiguous stems remain unlicensed');
