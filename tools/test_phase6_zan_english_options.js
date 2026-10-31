'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),json=p=>JSON.parse(read(p));
const lex=json('dictionary.json'),pack=json('research/translation_corpus/phase6_zan_english_context_2026_10_31.json');
const oldYehua=json('research/translation_corpus/phase6_contextual_contrast_leads_2026_10_30.json');
const scope={window:{},URL};vm.runInNewContext(read('translator-engine.js'),scope,{filename:'translator-engine.js'});
const make=(p=pack)=>scope.window.TlahtolliTranslator.create(lex,null,oldYehua,p);
const model=make(),base=make(null),plain=x=>JSON.parse(JSON.stringify(x));
const OD='https://nahuatl.wired-humanities.org/content/zan',YE='https://nahuatl.wired-humanities.org/content/zan-ye';
const NO='https://nahuatl.wired-humanities.org/content/zan-ye-no';
for(const input of ['zan','Zan','çan','Çan','zan tontemiqui','amo tlatla, zan quintocaya',
  'zan ye','zan ye no','zan ye nō','zan ye in cuicatlin',
  'Zan ye tocontemaca ye tocontotoma','zan toncochitlehuaco',
  'Ma xiuhquechol xochi, zan in tzinitzcan malintoca zan miqui huaqui xochitl zan ic tonmoquimiloa']){
 const results=model.sourceZanReadings(input),n=(input.match(/(?:^|[^\p{L}\p{M}])(?:zan|çan)(?=[^\p{L}\p{M}]|$)/giu)||[]).length;
 assert.equal(results.length,n,'Original written token count: '+input);
 for(const x of results){
  assert(['zan','çan'].includes(x.written.toLowerCase()));
  assert.deepEqual(Array.from(x.options,o=>o.english),['only / just / merely','but / however']);
  assert.deepEqual(Array.from(x.options,o=>o.source),[OD,OD]);
  assert.equal(x.selectedEnglish,null);assert.equal(x.scope,null);assert.equal(x.verifiedTranslation,false);
 }
 assert.deepEqual(plain(model.analyze(input).stats),plain(base.analyze(input).stats),
  'English options must not fabricate lexical recognition: '+input);
 assert.equal(model.analyze(input).sourceZanReadings.length,n);
 assert(model.analyze(input).gloss.includes('[only / just / merely | but / however]'));
}
const phrase=(s)=>model.sourceZanReadings(s)[0]?.documentedPhrase||null;
assert.equal(phrase('zan ye').english,'but / however / yet');
assert.equal(phrase('zan ye').source,YE);
assert.equal(phrase('çan ye').english,'but / however / yet');
assert.equal(phrase('zan ye no').english,'likewise / the same');
assert.equal(phrase('zan ye no').source,NO);
assert.equal(phrase('zan ye nō').source,NO);
assert.equal(phrase('zan ye no').wordCount,3,'longest lexical cluster wins');
assert.equal(phrase('zan ye in cuicatlin').english,'but / however / yet');
assert.equal(phrase('zan, ye'),null,'Comma cannot be ignored when proposing phrase');
assert.equal(phrase('zan. ye'),null);
assert.equal(phrase('zan-ye'),null);
assert.equal(phrase('zan yē'),null);
assert.equal(phrase('zan yehuan'),null);
const ed=s=>model.sourceZanReadings(s)[0]?.editorialReading||null;
assert.equal(ed('zan tontemiqui').english,'we only dream');
assert.equal(ed('zan ye in cuicatlin').english,'the only songs');
assert.equal(ed('zan ye in cuicatlin').source,'https://www.gutenberg.org/files/12219/12219-h/12219-h.htm');
assert.equal(ed('zan ye'),null,'Dictionary adversative cannot trump Brinton only songs');
assert.equal(ed('zan ye no'),null);
assert.equal(ed('amo tlatla, zan quintocaya'),null,'ODN cited semantic example is not Brinton stanza');
for(const t of ['zanio','zaniyo','zanye','zān','sān','san','za','ça','zancuel','zancuelachitzincan',
  'zanzan','zazan','nazan','zan123','2zan','çanio','çan-ye','zan ye nozan']){
 const vals=model.sourceZanReadings(t);
 const count=(t==='zan ye nozan')?1:0;
 assert.equal(vals.length,count,'No false exact-match source English: '+t);
}
assert.equal(model.sourceZanReadings('zan','en-nh').length,0);
assert.equal(base.sourceZanReadings('zan').length,0);
assert.equal(model.sourceEnglishReadings('yehua').length,1,'PR #124 yehua must survive');
assert.equal(model.sourceZanReadings('yehua').length,0);
assert.deepEqual(plain(model.analyze('nichōca').stats),plain(base.analyze('nichōca').stats));
for(const mut of [
 p=>{p.research_only=false;},p=>{p.canonical_headwords_added=1;},
 p=>{p.policies.no_forced_zan_ye_adversative=false;},
 p=>{p.sources.zan.spanish_adversative='new gloss';},
 p=>{p.sources.zan.url='https://example.org/fake';},
 p=>{p.sources.zanye.url='javascript:unsafe';},
 p=>{p.sources.zanyeno.source_phrase='zan ye yehua';},
 p=>{p.sources.brinton.url='https://example.org/fake';},
 p=>{p.documented_phrases[0].english='only';},
 p=>{p.documented_phrases[1].tokens=['zan','ye'];},
 p=>{p.source_specific_editorial_comparisons[1].editorial_english='but';},
 p=>{p.source_example.verified_complete_historical_translation=true;},
 p=>{p.options[1].function='global clause connector';}
]){
 const copy=plain(pack);mut(copy);
 assert.equal(make(copy).sourceZanReadings('zan ye in cuicatlin').length,0,
  'Forged source pack must fail closed');
}
console.log('PASS: zan/çan bilingual English, exact Molina adversative and Carochi sameness clusters, Brinton only contrasts; source corruptions and false spellings refused; no lexical recognition or historical translation promotion.');
