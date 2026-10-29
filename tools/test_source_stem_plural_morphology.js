'use strict';
// No benchmark words, no fabricated source attestations. Tests use full
// forms NOT recorded as lexical inflections in the existing curated ledger.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const dictionary=JSON.parse(read('dictionary.json')),paradigms=JSON.parse(read('paradigms.json'));
const source=read('tools/morphology_engine.js').split('renderMorphologyBreakdown=TlahtolliMorphEngine.html;')[0];
const PAST='Source-stem-class plural preterite hypothesis';
const FUTURE='Source-stem-class plural future hypothesis';
function load(words=dictionary.words){
 const scope={window:{},words,FULL_VERB_PARADIGMS:paradigms.paradigms,VERB_TENSES:paradigms.patterns,
  norm:s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(),
  stripToken:s=>String(s||'').replace(/^[^\p{L}\p{M}]+|[^\p{L}\p{M}]+$/gu,''),
  historicalSpellings:w=>String(w.original||'').split(/[;,/]+/).map(s=>s.trim()).filter(Boolean),
  safe:String,validUrl:()=>true,safeLink:()=>''};
 vm.runInNewContext(source+'\nthis.morph=TlahtolliMorphEngine;',scope);return scope;
}
const ctx=load(),morph=ctx.morph,positives=[
 ['oticochqueh','cochi',PAST,'1pl'],
 ['oancochqueh','cochi',PAST,'2pl'],
 ['ocochqueh','cochi',PAST,'3pl'],
 ['ōticochqueh','cochi',PAST,'1pl'],
 ['ōancochqueh','cochi',PAST,'2pl'],
 ['ōcochqueh','cochi',PAST,'3pl'],
 ['otitlacacqueh','caqui',PAST,'1pl'],
 ['oantlacacqueh','caqui',PAST,'2pl'],
 ['otlacacqueh','caqui',PAST,'3pl'],
 ['ticochizqueh','cochi',FUTURE,'1pl'],
 ['ancochizqueh','cochi',FUTURE,'2pl'],
 ['cochizqueh','cochi',FUTURE,'3pl'],
 ['titlacaquizqueh','caqui',FUTURE,'1pl'],
 ['antlacaquizqueh','caqui',FUTURE,'2pl'],
 ['tlacaquizqueh','caqui',FUTURE,'3pl']
];
for(const [token,lemma,kind,subject] of positives){
 const hits=morph.analyze(token).filter(c=>c.lemma===lemma&&c.kind===kind);
 assert.equal(hits.length,1,'Expected one sourced stem-class morphology proposal for '+token);
 const c=hits[0];assert.equal(c.grade,'hypothesis');
 assert.equal(c.features.subject,subject);
 assert.equal(c.features.tense,kind===PAST?'Preterite':'Future');
 assert.equal(c.parts.filter(p=>p.surface!=='Ø').map(p=>p.surface).join(''),token);
 assert(c.source.startsWith('https://')&&c.locator.length>4);
 assert.match(c.note,/NOT independently attested/);
 assert(!dictionary.words.find(w=>w.word===lemma).inflections.some(f=>f.form===token),
  'A supposedly unseen form was already in the indexed lexicon');
}
for(const token of [
 'oticochqui','oticochque','ōticochque','ōncochqueh',
 'oanticōchqueh','oticochi queh','oticochquehh',
 'oquicacqueh','oancacqueh','otitlacacqui',
 'titlacaquizque','antlacaquīzqueh','antlacaqizqueh',
 'anicocizqueh','nīcochizqueh','ticochizzqueh',
 'nitemacaquizqueh','niquizaqueh','ōnemiqeh',
 'chōcazqueh extra'
]){
 assert(!morph.analyze(token).some(c=>[PAST,FUTURE].includes(c.kind)),
  'Unsupported plural candidate must be refused: '+token);
}
const copy=()=>JSON.parse(JSON.stringify(dictionary.words));
for(const field of ['headword','pos','stem']){
 const words=copy(),w=words.find(x=>x.word==='cochi');
 w.claims=w.claims.filter(c=>c.field!==field);
 for(const token of ['oticochqueh','ticochizqueh'])
  assert(!load(words).morph.analyze(token).some(c=>[PAST,FUTURE].includes(c.kind)),
   'Cannot infer productive form absent source-checked '+field);
}
{
 const words=copy(),w=words.find(x=>x.word==='caqui');
 w.inflections=w.inflections.filter(f=>f.form!=='onitlacac');
 assert(!load(words).morph.analyze('titlacaquizqueh').some(c=>c.kind===FUTURE),
  'No recorded indefinite object evidence, no future indefinite-object hypothesis');
}
{
 const words=copy(),w=words.find(x=>x.word==='cochi');
 w.stem='coch-; cochī-';
 assert(!load(words).morph.analyze('ticochizqueh').some(c=>c.kind===FUTURE),
  'Modified cited base may not be silently folded to ordinary spelling');
}
{
 const words=copy(),w=words.find(x=>x.word==='cochi');
 w.inflections.push({form:'cochizqueh',evidence:'text',category:'Source recorded',
  source:'https://nahuatl.wired-humanities.org/content/cochi',
  note:'Test fixture, not true cited manuscript'});
 const matches=load(words).morph.analyze('cochizqueh');
 assert(matches.some(c=>c.grade==='manuscript'));
 assert(!matches.some(c=>c.kind===FUTURE),
  'A stronger recorded exact token suppresses a hypothetical reading');
}
vm.runInNewContext(read('translator-sentence.js'),ctx);
const sentence=ctx.window.TlahtolliSentence.create(dictionary,paradigms,
 token=>morph.analyze(token));
for(const [token,lemma,kind] of positives){
 const parsed=sentence.analyze(token);
 assert.equal(parsed.complete,false,token);
 assert.equal(parsed.clauses[0].candidates.length,0);
 assert(parsed.clauses[0].morphologicalClues.some(c=>c.kind===kind&&c.lemma===lemma));
}
console.log('PASS source-verified stem-class plural morphology: 15 unseen forms, 2 independently sourced base pairs, 3 plural persons, source/diacritic refusals, no English promotion');
