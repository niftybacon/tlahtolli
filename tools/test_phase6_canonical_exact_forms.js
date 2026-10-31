'use strict';
/* Phase 6 exact source-led canonical lexical promotion, NOT Gold or grammar. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const d=JSON.parse(read('dictionary.json')),release=JSON.parse(read('release.json'));
const refs=JSON.parse(read('references.json')),paradigms=JSON.parse(read('paradigms.json'));
const leads=JSON.parse(read('research/translation_corpus/exact_source_lexical_surface_leads_2026_10_30.json'));
assert.equal(d.version,'2026-10-30.1.0');
assert.equal(d.version,release.version);
assert.equal(d.version,refs.version);
assert.equal(d.version,paradigms.version);
assert.equal(release.headwords,2144);
assert.equal(d.words.length,2144);
const tests=[
 ['yehuan','pronoun','https://nahuatl.wired-humanities.org/content/yehuantin'],
 ['tepilhuan','noun','https://nahuatl.wired-humanities.org/node/188794']
];
for(const [written,pos,url]of tests){
 const items=d.words.filter(w=>w.word===written&&w.variety==='Classical Nahuatl');
 assert.equal(items.length,1,'One canonical entry, not spelling-derived duplicates');
 const w=items[0];
 assert.equal(w.pos,pos);
 assert.equal(w.source,url);
 assert.equal(w.status,'Checked against source');
 assert.deepEqual(Array.from(w.inflections),[]);
 assert.equal(w.stem,'');
 assert.equal(w.possessed,'');
 assert.equal(w.plural,'');
 assert.equal(w.translation,'');
 assert.equal(w.example,'');
 assert(!w.grammarSource,'No invented productive inflection or source grammar');
 assert.deepEqual(Array.from(w.claims,c=>c.field).sort(),['headword','meaning','pos']);
 assert(w.claims.every(c=>c.assessment==='dictionary'&&c.source===url&&
  c.locator.length>25&&/no independent human specialist approval/.test(c.reviewer)));
 assert(w.notes.includes('NOT independently human-reviewed'));
 assert.equal(leads.records.find(x=>x.written_form===written)?.source_url,url);
}
const scope={window:{},URL};
vm.runInNewContext(read('translator-engine.js'),scope);
const lexical=scope.window.TlahtolliTranslator.create(d,{entries:[]});
for(const [written]of tests){
 const l=lexical.lookup(written);
 assert.equal(l.approximate,false);
 assert.equal(l.candidates.length,1);
 assert.equal(l.candidates[0].confidence,'lexicon');
 assert.equal(l.candidates[0].form,written);
 assert.equal(l.candidates[0].evidence,'lexicon');
}
// A quantity-only spelling comparison may return an explicitly approximate
// dictionary SEARCH HINT. It is neither an attested variant nor an exact
// source-approved wordform. Do not confuse confidence=approximate with
// confidence=lexicon in the source-grade regression.
for(const form of ['yeuan','yehuantin','yehuān','yēhuan',
 'tepilhuantzin','tepiltzin','tepilhuān','nītepilhuan']){
 const result=lexical.lookup(form);
 const related=result.candidates.filter(x=>
  x.lemma==='yehuan'||x.lemma==='tepilhuan');
 assert(!related.some(x=>x.confidence!=='approximate'),
  'Unsupported exact/source-licensed promotion of a historical variant: '+form);
 if(related.length){
  assert.equal(result.approximate,true,
   'Spelling-related dictionary clue must be marked approximate: '+form);
  assert(related.every(x=>x.form!==form&&
   /Macrons\/diacritics differ/.test(x.context)),
   'Approximate historical spelling may not impersonate direct source evidence: '+form);
  const word=lexical.analyze(form).parts.find(x=>x.kind==='word');
  assert.equal(word.status,'approximate',
   'Approximate lookup must remain labeled approximate in analysis: '+form);
 }
}
const lexicalOnly=lexical.analyze('yehuan tepilhuan');
assert.equal(lexicalOnly.stats.matched,2);
assert(lexicalOnly.parts.filter(x=>x.kind==='word').every(x=>x.senseAmbiguous),
 'Multiple dictionary senses should not collapse into a single certain English gloss');
const printed=lexical.analyze('yehuan Dios');
assert.match(printed.gloss,/\[\?yehuan: multiple dictionary senses\]/);
const pron=lexical.lookup('yehuan').candidates[0];
assert(pron.meaning.includes('contextual referent'));
const kin=lexical.lookup('tepilhuan').candidates[0];
assert(kin.meaning.includes('poetic social context unreviewed'));
vm.runInNewContext(read('translator-sentence.js'),scope);
vm.runInNewContext(read('translator-english.js'),scope);
const sentence=scope.window.TlahtolliSentence.create(d,paradigms);
const english=scope.window.TlahtolliEnglish.create(sentence);
for(const text of ['yehuan Dios','tepilhuan','in yehuan Dios']){
 const analysis=sentence.analyze(text);
 assert.equal(analysis.complete,false,'Dictionary headword does not certify stanza syntax');
 assert.equal(analysis.clauses[0].candidates.length,0,'No invented predicate or source-specific referent');
 assert.equal(english.compose(text,analysis).available,false,'English must abstain on incomplete grammar');
}
console.log('PASS canonical historical exact forms: 2 new source-cited headwords, 928 → 926 disconnected lexical/grammar surfaces (measured in investigator), zero invented variants/inflections, zero Gold or contextual English claims.');
