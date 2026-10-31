'use strict';
// English lexical choices are distinct from licensed sentence translation.
// Uses only PR #120's Molina / Olmos sources, no new source interpretations.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ROOT=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const json=p=>JSON.parse(read(p));
const dictionary=json('dictionary.json'),context=json('research/translation_corpus/phase6_contextual_contrast_leads_2026_10_30.json');
const ctx={window:{},URL};vm.runInNewContext(read('translator-engine.js'),ctx,{filename:'translator-engine.js'});
const make=pack=>ctx.window.TlahtolliTranslator.create(dictionary,null,pack);
const m=make(context),clone=x=>JSON.parse(JSON.stringify(x));
const A='https://nahuatl.wired-humanities.org/content/yehua-0',B='https://nahuatl.wired-humanities.org/content/yehua';
for(const text of [
 'yehua','Yehua','noyollo yehua','In can on nemian noyollo yehua?',
 'Macazo tleon xoconyoyocoya ti noyollo, yehua cuix ic nepohualoyan in oncan nemohua yehua',
 'quen conchihuaz noyollo yehua onentacico'
]){
 const readings=m.sourceEnglishReadings(text);
 const n=(text.match(/\byehua\b/giu)||[]).length;
 assert.equal(readings.length,n,'One source reading PER original token: '+text);
 for(const v of readings){
  assert.equal(v.written.toLowerCase(),'yehua');
  assert.deepEqual(Array.from(v.options,o=>o.english),['that / that one','a little while ago / then']);
  assert.deepEqual(Array.from(v.options,o=>o.source),[A,B]);
  assert.deepEqual(Array.from(v.options,o=>o.function),['demonstrative or pronoun','temporal adverb']);
  assert.equal(v.selectedEnglish,null,'No automatic winner');
  assert.equal(v.verifiedTranslation,false);
  assert.equal(v.referent,null);
  assert.equal(v.clauseAttachment,null);
 }
 const parsed=m.analyze(text,'nh-en');
 assert.equal(parsed.sourceEnglishReadings.length,n);
 assert.deepEqual(clone(parsed.stats),clone(make(null).analyze(text,'nh-en').stats),
  'English alternatives must never increment canonical lexical or historical recognition');
 assert(parsed.gloss.includes('[that / that one | a little while ago / then]'));
}
const poem='Macazo tleon xoconyoyocoya ti noyollo, yehua cuix ic nepohualoyan in oncan nemohua yehua';
const poemReadings=m.sourceEnglishReadings(poem);
assert.equal(poemReadings.length,2);
assert.equal(poemReadings[0].editorialReading.english,'that');
assert.match(poemReadings[0].editorialReading.note,/does not prove/);
assert.equal(poemReadings[1].editorialReading,null,
 'Second written yehua does not inherit the first editorial reading');
for(const other of ['yehua','yehua cuix ic nepohualoyan','noyollo yehua',
 'In can on nemian noyollo yehua?','Yehua onentacico']){
 assert(m.sourceEnglishReadings(other).every(v=>v.editorialReading===null),
 'Only the printed Brinton VI.2 short original context licenses a contextual English comparison: '+other);
}
for(const rejected of [
 'yehuan','yehuān','yehuatl','yeua','yegua','yēhua','yehuā','yehuaya',
 'noyolloyehua','yehua-yehua','yehua123','yēhua yehua'
]){
 const found=m.sourceEnglishReadings(rejected);
 const legitimate=(rejected.match(/(?:^| )yehua(?:$| )/gu)||[]).length;
 assert.equal(found.length,legitimate,'No unrelated or re-spelled word gets source English: '+rejected);
}
assert.deepEqual(Array.from(m.sourceEnglishReadings('I cry','en-nh')),[]);
assert.equal(make(null).sourceEnglishReadings('yehua').length,0,
 'No source pack, no invented lexical evidence');
for(const mutate of [
 p=>{p.negative_guards.no_automatic_english=false;},
 p=>{p.cases[0].editorial_yehua_engine_note.hard_engine_constraints.no_single_default_gloss=false;},
 p=>{p.cases[0].editorial_yehua_engine_note.dictionary_supported_function_families[0].source_url='https://example.org/forged';},
 p=>{p.cases[0].editorial_yehua_engine_note.dictionary_supported_function_families[1].attested_spanish='invented';},
 p=>{p.cases[0].editorial_yehua_engine_note.published_original_contexts[0].source_url='https://evil.invalid';},
 p=>{p.cases[0].editorial_yehua_engine_note.independently_approved_sentence_translation=true;},
 p=>{p.cases[0].editorial_yehua_engine_note.hard_engine_constraints.abstain_on_unparsed_whole_clause=false;},
 p=>{p.cases[0].written_surface='yehuan';}
]){
 const c=clone(context);mutate(c);
 assert.equal(make(c).sourceEnglishReadings('yehua').length,0,
  'A corrupted evidence pack cannot authorize lexical English');
}
const original=poemReadings[0].editorialReading;
assert(original.source.includes('gutenberg.org'));
assert(m.analyze('yehua').gloss.includes('that / that one'));
console.log('PASS: cited English lexical alternatives displayed for original exact yehua, contextual Brinton VI.2 only, alternate spelling/source forgeries refused, canonical recognition unchanged.');
