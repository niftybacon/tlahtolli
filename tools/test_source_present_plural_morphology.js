'use strict';
// Dedicated NON-ATTESTED present-plural regressions. No corpus sample was used
// to choose stems; all source references come from canonical dictionary claims.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const dictionary=JSON.parse(read('dictionary.json'));
const paradigms=JSON.parse(read('paradigms.json'));
const src=read('tools/morphology_engine.js').split('renderMorphologyBreakdown=TlahtolliMorphEngine.html;')[0];
function load(words=dictionary.words){
 const ctx={window:{},words,FULL_VERB_PARADIGMS:paradigms.paradigms,VERB_TENSES:paradigms.patterns,
  norm:s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(),
  stripToken:s=>String(s||'').replace(/^[^\p{L}\p{M}]+|[^\p{L}\p{M}]+$/gu,''),
  historicalSpellings:w=>String(w.original||'').split(/[;,/]+/).map(x=>x.trim()).filter(Boolean),
  safe:String,validUrl:()=>true,safeLink:()=>''};
 vm.runInNewContext(src+'\nthis.morph=TlahtolliMorphEngine;',ctx);
 return ctx;
}
const ctx=load(),analyze=s=>ctx.morph.analyze(s);
const KIND='Source-stem-class plural present hypothesis';
const lemmas=['cochi','tēmi','huetzi','tlācati','nāhuati',
 'tlatzihui','patlāni','tlanahui','tlachia'];
let count=0;
for(const lemma of lemmas){
 const w=dictionary.words.find(x=>x.word===lemma);
 assert(w&&w.pos==='verb (intransitive)'&&!paradigms.paradigms[lemma],lemma);
 for(const field of ['headword','pos','stem'])
  assert(w.claims.some(c=>c.field===field&&['dictionary','grammar','text'].includes(c.assessment)&&c.locator),
   'Missing independent source for '+lemma+': '+field);
 for(const [prefix,person] of [['ti','1pl'],['an','2pl'],['','3pl']]){
  const token=prefix+lemma+'h';
  assert(!w.inflections.some(f=>f.form===token),'Test cannot rely on exact listed inflection: '+token);
  const readings=analyze(token).filter(x=>x.lemma===lemma&&x.kind===KIND);
  assert.equal(readings.length,1,'Expected unique source-gated present plural: '+token);
  const r=readings[0];
  assert.equal(r.grade,'hypothesis');
  assert.equal(r.features.tense,'Present');
  assert.equal(r.features.subject,person);
  assert.equal(r.features.object,'intransitive');
  assert(/^https:\/\//.test(r.source)&&r.locator);
  assert.equal(r.parts.filter(p=>p.surface!=='Ø').map(p=>p.surface).join(''),token);
  count++;
 }
}
assert.equal(count,27,'Exactly nine independently sourced intransitive lexemes x three plural persons');
for(const bad of [
 'nīcochih','ticochh','ticochīh','ticochihqueh','nicochih',
 'titlacaquih','titequih','titlamattinemih','antepoztiah',
 'tichōcahh'
]){
 assert(!analyze(bad).some(x=>x.kind===KIND),'Cannot invent plural: '+bad);
}
const copy=()=>JSON.parse(JSON.stringify(dictionary.words));
for(const field of ['headword','pos','stem']){
 const ws=copy(),w=ws.find(x=>x.word==='tēmi');
 w.claims=w.claims.filter(c=>c.field!==field);
 assert(!load(ws).morph.analyze('titēmih').some(x=>x.kind===KIND),
  'Removing required '+field+' evidence must disable plural present');
}
{
 const ws=copy(),w=ws.find(x=>x.word==='tēmi');
 w.inflections=w.inflections.filter(f=>!/^Preterite 1sg/.test(f.category));
 assert(!load(ws).morph.analyze('titēmih').some(x=>x.kind===KIND),
  'No independently recorded 1sg preterite, no class-licensed plural');
}
{
 const ws=copy(),w=ws.find(x=>x.word==='tēmi');
 w.stem='tēm-; tēmi-'; // Unlicensed replacement of independently recorded short base.
 assert(!load(ws).morph.analyze('titēmih').some(x=>x.kind===KIND),
  'Tampered stem-class boundary must fail closed');
}
{
 const ws=copy(),w=ws.find(x=>x.word==='tēmi');
 w.inflections.push({form:'titēmih',category:'Present 1pl',evidence:'dictionary',
  source:w.source,gloss:'source listed, not a generated example'});
 const found=load(ws).morph.analyze('titēmih');
 assert(found.some(x=>x.lemma==='tēmi'&&x.grade==='lexical'));
 assert(!found.some(x=>x.lemma==='tēmi'&&x.kind===KIND),
  'An exact source-listed form takes precedence over a hypothetical parse');
}
vm.runInNewContext(read('translator-sentence.js'),ctx);
const sentence=ctx.window.TlahtolliSentence.create(dictionary,paradigms,token=>analyze(token));
for(const token of ['ticochih','antēmih','huetzih']){
 const out=sentence.analyze(token);
 assert.equal(out.complete,false,'No English/sentence promotion for '+token);
 assert.equal(out.clauses[0].candidates.length,0);
 assert(out.clauses[0].morphologicalClues.some(x=>x.kind===KIND));
}
console.log('PASS Classical present plural: 27 independently gated, unlisted hypotheses; negative evidence, source priority, abstention');
