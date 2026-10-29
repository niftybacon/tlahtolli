'use strict';
// Source-licensed bound possessed bases: grammar proposals, never attested
// whole forms, curated dictionary hits, or verified sentence translations.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const dictionary=JSON.parse(read('dictionary.json'));
const paradigms=JSON.parse(read('paradigms.json'));
const source=read('tools/morphology_engine.js')
 .split('renderMorphologyBreakdown=TlahtolliMorphEngine.html;')[0];
const kind='Source-bound possessed noun analogy';
function load(words=dictionary.words){
 const ctx={window:{},words,FULL_VERB_PARADIGMS:paradigms.paradigms,
  VERB_TENSES:paradigms.patterns,
  norm:s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(),
  stripToken:s=>String(s||'').replace(/^[^\p{L}\p{M}]+|[^\p{L}\p{M}]+$/gu,''),
  historicalSpellings:w=>String(w.original||'').split(/[;,/]+/).map(s=>s.trim()).filter(Boolean),
  safe:String,validUrl:()=>true,safeLink:()=>''};
 vm.runInNewContext(source+'\nthis.morph=TlahtolliMorphEngine;',ctx);
 return ctx;
}
const ctx=load(),morph=ctx.morph,analyses=s=>morph.analyze(s).filter(m=>m.kind===kind);
const productive=[
 ['noāuh','ātl','1sg'],
 ['motepēuh','tepētl','2sg'],
 ['iteuh','tetl','3sg'],
 ['toāmauh','āmatl','1pl'],
 ['amocihuāuh','cihuātl','2pl'],
 ['notequiuh','tequitl','1sg'],
 ['mochān','chantli','2sg'],
 ['inamic','namictli','3sg'],
 ['noyōllo','yollotl','1sg']
];
const categories=new Set(),persons=new Set();
for(const [form,lemma,person] of productive){
 const matches=analyses(form);
 assert.equal(matches.length,1,'Missing exactly one source-licensed bound-base reading: '+form);
 const c=matches[0];
 assert.equal(c.lemma,lemma);
 assert.equal(c.grade,'analogy');
 assert.equal(c.features.possessor,person);
 assert.equal(c.features.category,'noun');
 assert.equal(c.parts.map(p=>p.surface).join(''),form,'No guessed insertion/deletion');
 assert(c.source.startsWith('https://'));
 assert(c.locator?.length>3);
 assert.match(c.note,/NOT an attested whole token/);
 categories.add(c.lemma);persons.add(person);
 const entry=dictionary.words.find(w=>w.word===lemma);
 assert(entry.claims.some(x=>x.field==='possessed'&&
  ['dictionary','grammar','text'].includes(x.assessment)&&x.locator),
  'Independent located grammatical claim required');
 assert(!entry.inflections?.some(f=>f.form===form),
  'Positive test must be unseen within the indexed forms');
}
assert.equal(categories.size,9,'Productivity must generalize across nine independently sourced lemmas');
assert.equal(persons.size,5,'All five independently indexed possessor prefixes must be tested');
// A bound-base correspondence is not an attested whole token, nor a license
// to remove macrons, reinterpret semantic exceptions, split compounds or
// generate arbitrary plural stems.
for(const rejected of [
 'noauh','motepēu','nōāuh','nōtepēuh','motepēuhh',
 'noāuh noāuh','no-āuh','notlāllō','notlācauh','nopillō',
 'noāuhtepēuh','nocan','nonacayō','nocihuātl','nicāuh'
]){
 assert.equal(analyses(rejected).length,0,'Unlicensed bound-base form: '+rejected);
}
// Existing explicit no- examples remain the older separate analogy;
// no new source-bound claim is retroactively assigned to them.
assert(analyses('noxōchiuh').length===0);
assert(analyses('moxōchiuh').length===0);
assert(morph.analyze('noxōchiuh').some(x=>x.grade==='lexical'));
assert(morph.analyze('moxōchiuh').some(x=>x.kind==='Analogical possessed noun'));
// No forged source or bare stem-only record can authorize an analogy.
for(const removed of ['possessed','headword','pos']){
 const copy=JSON.parse(JSON.stringify(dictionary.words));
 copy.find(w=>w.word==='tepētl').claims=copy.find(w=>w.word==='tepētl').claims.filter(c=>c.field!==removed);
 assert(!load(copy).morph.analyze('motepēuh').some(c=>c.kind===kind),
  'Removing independently located '+removed+' must disallow productivity');
}
const wrong=JSON.parse(JSON.stringify(dictionary.words));
wrong.find(w=>w.word==='tepētl').possessed='-tepēuh … -āuh (two bound possessed components)';
assert(!load(wrong).morph.analyze('motepēuh').some(c=>c.kind===kind));
const unlocated=JSON.parse(JSON.stringify(dictionary.words));
unlocated.find(w=>w.word==='tepētl').claims.find(c=>c.field==='possessed').assessment='inference';
assert(!load(unlocated).morph.analyze('motepēuh').some(c=>c.kind===kind));
// Even a plausible morphological word remains incomplete for sentence grammar.
vm.runInNewContext(read('translator-sentence.js'),ctx);
const sentence=ctx.window.TlahtolliSentence.create(dictionary,paradigms,s=>morph.analyze(s));
for(const [form,lemma] of productive.slice(0,4)){
 const result=sentence.analyze(form);
 assert.equal(result.complete,false,form);
 assert.equal(result.clauses[0].candidates.length,0);
 assert(result.clauses[0].morphologicalClues.some(x=>x.lemma===lemma&&x.grade==='analogy'));
}
console.log('PASS Tēntli source-bound noun morphology: nine unseen forms/nine located lemmas/five persons; abstention, exact spelling, source gates and negative tests');
