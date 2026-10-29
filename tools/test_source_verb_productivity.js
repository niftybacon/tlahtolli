'use strict';
// Canonical engine tests: source-backed finite templates, no fabricated matrix,
// unreviewed archive promotion or automatic English translation.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const dictionary=JSON.parse(read('dictionary.json')),paradigms=JSON.parse(read('paradigms.json'));
const source=read('tools/morphology_engine.js').split('renderMorphologyBreakdown=TlahtolliMorphEngine.html;')[0];
const PRET='Source-template singular preterite hypothesis';
const PRES='Source-template transitive present hypothesis';
function harness(words=dictionary.words){
 const ctx={window:{},words,FULL_VERB_PARADIGMS:paradigms.paradigms,VERB_TENSES:paradigms.patterns,
  norm:s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(),
  stripToken:s=>String(s||'').replace(/^[^\p{L}\p{M}]+|[^\p{L}\p{M}]+$/gu,''),
  historicalSpellings:w=>String(w.original||'').split(/[;,/]+/).map(s=>s.trim()).filter(Boolean),
  safe:String,validUrl:()=>true,safeLink:()=>''};
 vm.runInNewContext(source+'\nthis.morph=TlahtolliMorphEngine;',ctx);
 return ctx;
}
const ctx=harness(),morph=ctx.morph;
const cases=[
 ['oticoch','cochi',PRET,'2sg','intransitive'],
 ['ōticoch','cochi',PRET,'2sg','intransitive'],
 ['otitlacac','caqui',PRET,'2sg','nonhuman indefinite (source-labelled)'],
 ['ōticcac','caqui',PRET,'2sg','3sg object (source-labelled)'],
 ['otitlacuilo','cuiloa',PRET,'2sg','nonhuman indefinite (source-labelled)'],
 ['otitetlazotlac','tlazotla',PRET,'2sg','human indefinite (source spelling; vowel length unresolved)'],
 ['nitlacaqui','caqui',PRES,'1sg','nonhuman indefinite (source-labelled)'],
 ['titlacaqui','caqui',PRES,'2sg','nonhuman indefinite (source-labelled)'],
 ['nitlacuiloa','cuiloa',PRES,'1sg','nonhuman indefinite (source-labelled)'],
 ['titlacuiloa','cuiloa',PRES,'2sg','nonhuman indefinite (source-labelled)'],
 ['nitetlazotla','tlazotla',PRES,'1sg','human indefinite (source spelling; vowel length unresolved)'],
 ['titetlazotla','tlazotla',PRES,'2sg','human indefinite (source spelling; vowel length unresolved)']
];
for(const [form,lemma,kind,subject,object] of cases){
 const match=morph.analyze(form).filter(x=>x.kind===kind&&x.lemma===lemma);
 assert.equal(match.length,1,'One licensed reading needed: '+form);
 const a=match[0];
 assert.equal(a.grade,'hypothesis');
 assert.equal(a.features.subject,subject);
 assert.equal(a.features.object,object);
 assert.equal(a.parts.filter(x=>x.surface!=='Ø').map(x=>x.surface).join(''),form,
  'Exact source/citation segments must reconstruct token');
 assert(a.source.startsWith('https://'));
 assert.match(a.note,/NOT independently attested/);
 assert(!dictionary.words.find(w=>w.word===lemma).inflections?.some(f=>f.form===form),
  'Unseen positive form must not already be a curated full token');
}
for(const form of [
 'oticochh','ōtitlacac','otitlācac','otimitzcac',
 'otino tlazotlac','otinotlazotlac','otimotlazotlac',
 'niccaqui','timitzcaqui','nitlācaqui','nitlacāqui',
 'nitelazotla','nimocuiloa','onitetlazotlac',
 'ōtitlazotlac','otitlacuiloh','nitlacuilo',
 'nitlacuiloa extra','niyauh','niquiza'
]){
 assert.equal(morph.analyze(form).filter(x=>[PRET,PRES].includes(x.kind)).length,0,
  'Unlicensed form must not pass source finite template: '+form);
}
assert(!morph.analyze('otichōcac').some(x=>x.kind===PRET));
const copy=()=>JSON.parse(JSON.stringify(dictionary.words));
for(const field of ['headword','pos']){
 const words=copy();
 words.find(w=>w.word==='caqui').claims=words.find(w=>w.word==='caqui').claims.filter(c=>c.field!==field);
 assert(!harness(words).morph.analyze('nitlacaqui').some(x=>x.kind===PRES),
  'Independent source '+field+' claim is mandatory');
}
{
 const words=copy(),w=words.find(w=>w.word==='caqui');
 w.inflections=w.inflections.filter(f=>f.form!=='onitlacac');
 assert(!harness(words).morph.analyze('nitlacaqui').some(x=>x.kind===PRES),
  'Source recorded object+preterite is required');
 assert(!harness(words).morph.analyze('otitlacac').some(x=>x.kind===PRET));
}
{
 const words=copy(),w=words.find(w=>w.word==='cuiloa');
 w.inflections.find(f=>f.form==='onitlacuilo').source='not-an-evidence-url';
 assert(!harness(words).morph.analyze('nitlacuiloa').some(x=>x.kind===PRES),
  'A fabricated source locator cannot license productivity');
}
{
 const words=copy(),w=words.find(w=>w.word==='cochi');
 w.inflections.push({form:'oticoch',category:'Attested text',evidence:'text',
  source:'https://nahuatl.wired-humanities.org/content/cochi',note:'Controlled test fixture'});
 const found=harness(words).morph.analyze('oticoch');
 assert(found.some(x=>x.lemma==='cochi'&&x.grade==='manuscript'));
 assert(!found.some(x=>x.lemma==='cochi'&&x.kind===PRET),
  'Stronger exact attestation suppresses redundant speculation');
}
vm.runInNewContext(read('translator-sentence.js'),ctx);
const sentence=ctx.window.TlahtolliSentence.create(dictionary,paradigms,token=>morph.analyze(token));
for(const [form] of cases){
 const result=sentence.analyze(form);
 assert.equal(result.complete,false,form);
 assert.equal(result.clauses[0].candidates.length,0);
 assert(result.clauses[0].morphologicalClues.some(x=>x.grade==='hypothesis'&&
  [PRET,PRES].includes(x.kind)),'Candidate-only sentence clue: '+form);
}
console.log('PASS source-template finite morphology: '+cases.length+
 ' unseen forms across four located verb lexemes, source provenance, exact spelling, indexed exclusions and no English promotion');
