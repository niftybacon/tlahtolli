'use strict';
// Source-grounded productive rules are hypotheses, never manuscript citations.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const dictionary=JSON.parse(read('dictionary.json'));
const paradigms=JSON.parse(read('paradigms.json'));
const src=read('tools/morphology_engine.js').split('renderMorphologyBreakdown=TlahtolliMorphEngine.html;')[0];
const FUTURE='Source-stem-class future hypothesis';
const PAST='Source-stem-class third-person preterite hypothesis';
function instantiate(words=dictionary.words){
 const scope={window:{},words,FULL_VERB_PARADIGMS:paradigms.paradigms,VERB_TENSES:paradigms.patterns,
  norm:s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(),
  stripToken:s=>String(s||'').replace(/^[^\p{L}\p{M}]+|[^\p{L}\p{M}]+$/gu,''),
  historicalSpellings:w=>String(w.original||'').split(/[;,/]+/).map(s=>s.trim()).filter(Boolean),
  safe:String,validUrl:()=>true,safeLink:()=>''};
 vm.runInNewContext(src+'\nthis.morph=TlahtolliMorphEngine;',scope);
 return scope;
}
const ctx=instantiate(),analyze=x=>ctx.morph.analyze(x);
const positives=[
 ['nicochiz','cochi',FUTURE,'1sg','intransitive'],
 ['ticochiz','cochi',FUTURE,'2sg','intransitive'],
 ['cochiz','cochi',FUTURE,'3sg','intransitive'],
 ['nitlacaquiz','caqui',FUTURE,'1sg','nonhuman indefinite (source-labelled)'],
 ['titlacaquiz','caqui',FUTURE,'2sg','nonhuman indefinite (source-labelled)'],
 ['ococh','cochi',PAST,'3sg','intransitive'],
 ['ōcoch','cochi',PAST,'3sg','intransitive']
];
for(const [token,lemma,kind,subject,object] of positives){
 const match=analyze(token).filter(x=>x.lemma===lemma&&x.kind===kind);
 assert.equal(match.length,1,'Unique supported hypothesis for '+token);
 const c=match[0];
 assert.equal(c.grade,'hypothesis');
 assert.equal(c.features.subject,subject);
 assert.equal(c.features.object,object);
 assert.equal(c.parts.filter(p=>p.surface!=='Ø').map(p=>p.surface).join(''),token);
 assert(c.source.startsWith('https://'));
 assert(c.locator.length>6);
 assert.match(c.note,/NOT independently attested/);
 const word=dictionary.words.find(w=>w.word===lemma);
 assert(!word.inflections.some(f=>f.form===token),
  'Positive testing must use unlisted finite tokens');
 assert(word.claims.some(v=>v.field==='stem'&&v.assessment==='dictionary'&&v.locator),
  'Original source-backed lexical class is a requirement');
}
// Unlicensed augment, class, object, diacritic, stem spelling, whitespace,
// and transitive third-person all fail closed.
for(const token of [
 'nicochīz','nīcochiz','nicōchiz','nicochizz',
 'ococ','ōcochi','ocochi','otcoch','cochizz','ncochiz',
 'niquizaaz','niyāz','nitemacaquiz','nitlācaquiz',
 'nitlacaquīz','ōcacc','ocac','ōcac','ococh extra',
 'niccaquiz','quicaquiz','niquicaquiz','nitlacaquizz'
]){
 const hits=analyze(token).filter(x=>[FUTURE,PAST].includes(x.kind));
 assert.equal(hits.length,0,'Unlicensed stem-class form must not match '+token);
}
// No 12-matrix leakage from the new rule.
assert(!analyze('nichōcaz').some(x=>x.kind===FUTURE),
 'The existing full-paradigm reader has exclusive custody of indexed lemmas');
const clone=()=>JSON.parse(JSON.stringify(dictionary.words));
for(const field of ['headword','pos','stem']){
 const ws=clone(),w=ws.find(x=>x.word==='cochi');
 w.claims=w.claims.filter(x=>x.field!==field);
 for(const t of ['nicochiz','ōcoch'])
  assert(!instantiate(ws).morph.analyze(t).some(c=>[FUTURE,PAST].includes(c.kind)),
   'Cannot recognize '+t+' without sourced '+field);
}
{
 const ws=clone(),w=ws.find(x=>x.word==='caqui');
 w.stem='caqu-; caqui-'; // unattested short stem, even if superficially plausible
 assert(!instantiate(ws).morph.analyze('nitlacaquiz').some(x=>x.kind===FUTURE));
}
{
 const ws=clone(),w=ws.find(x=>x.word==='caqui');
 w.inflections=w.inflections.filter(f=>f.form!=='onitlacac');
 assert(!instantiate(ws).morph.analyze('nitlacaquiz').some(x=>x.kind===FUTURE),
  'No finite source exemplar means no productive object prefix');
}
{
 const ws=clone(),w=ws.find(x=>x.word==='cochi');
 w.inflections.push({form:'cochiz',evidence:'text',category:'Manuscript form',
  source:'https://nahuatl.wired-humanities.org/content/cochi',note:'Synthetic fixture'});
 const observed=instantiate(ws).morph.analyze('cochiz');
 assert(observed.some(x=>x.grade==='manuscript'));
 assert(!observed.some(x=>x.kind===FUTURE),
  'A listed exact historical form suppresses a lower-grade form hypothesis');
}
// Even genuine grammatical possibilities cannot turn unsupported tokens into
// completed source-backed sentences.
vm.runInNewContext(read('translator-sentence.js'),ctx);
const sentence=ctx.window.TlahtolliSentence.create(dictionary,paradigms,token=>ctx.morph.analyze(token));
for(const [token,lemma,kind] of positives){
 const parsed=sentence.analyze(token);
 assert.equal(parsed.complete,false,token);
 assert.equal(parsed.clauses[0].candidates.length,0);
 assert(parsed.clauses[0].morphologicalClues.some(c=>c.lemma===lemma&&c.kind===kind));
}
// Every positive token is computed from sourced claim fields, not the 365
// historical benchmark, which this test never loads.
console.log('PASS source-verified verb stems: 7 unindexed 3sg preterite/future hypotheses, 2 independently sourced stem classes, 5+ negative evidence gates, no English promotion');
