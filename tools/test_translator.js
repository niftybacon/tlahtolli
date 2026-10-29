// Tlahtōlli translation engine regression tests (no dependencies).
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..');
const context={window:{},URL};
vm.runInNewContext(fs.readFileSync(path.join(root,'translator-engine.js'),'utf8'),context,{filename:'translator-engine.js'});
const source=JSON.parse(fs.readFileSync(path.join(root,'dictionary.json'),'utf8'));
const examples=JSON.parse(fs.readFileSync(path.join(root,'research/translation_corpus/research_examples.json'),'utf8'));
const model=context.window.TlahtolliTranslator.create(source,examples);
assert.equal(model.stats.headwords,210,'unexpected headword count; review source-driven dictionary changes');

const manuscriptParticles=[
 ['niman','https://nahuatl.wired-humanities.org/node/172499'],
 ['oncan','https://nahuatl.wired-humanities.org/content/oncan'],
 ['ompa','https://nahuatl.wired-humanities.org/content/ompa']
];
assert.equal(new Set(source.words.map(w=>w.word+'|'+w.variety)).size,source.words.length,
 'No duplicate canonical source-backed headwords');
for(const [word,sourceUrl] of manuscriptParticles){
 const w=source.words.find(w=>w.word===word);
 assert(w&&w.source===sourceUrl&&w.variety==='Classical Nahuatl');
 assert(w.pos.includes('particle')||w.pos.includes('adverb'));
 assert.equal(w.animacy,'not_applicable');
 assert.equal(w.number,'not_applicable');
 assert(w.claims.filter(c=>['headword','meaning','pos'].includes(c.field)&&
  c.assessment==='dictionary'&&c.locator.includes('1571')).length===3);
 assert.deepEqual(w.inflections,[],
  'The headword is already indexed; do not duplicate it as an inflection');
 const x=model.lookup(word);
 assert.equal(x.candidates.length,1);
 assert.equal(x.candidates[0].source,sourceUrl);
 assert.equal(x.candidates[0].form_type,'headword');
}
const particles=model.analyze('Niman oncan ompa','nh-en');
assert.equal(particles.stats.matched,3);
assert.equal(particles.stats.unknown,0);
assert(!particles.passages.length,'No composed sentence is invented by lexical additions');
assert.equal(model.lookup('nima').candidates.length,0,
 'No automatic stemming or false spelling equivalence from niman');

assert.equal(model.stats.passageCandidates,3);
const lookup=model.lookup('xōchitl','nh-en');
assert.equal(lookup.candidates[0].lemma,'xōchitl');
assert.match(lookup.candidates[0].meaning,/flower/i);
assert.equal(model.lookup('flower','en-nh').candidates[0].lemma,'xōchitl');
assert.equal(model.lookup('yhuan','nh-en').candidates[0].lemma,'īhuān');
const normalized=model.analyze('in mochīhua tēzcatl in mocuepa ca tetl','nh-en');
assert.equal(normalized.passages[0].id,'FC11-209v-mirror');
assert.equal(normalized.passages[0].trainEligible,false);
assert.equal(normalized.passages[0].status,'candidate');
const original=model.analyze('in mochioa tezcatl, in mocuepa ca tetl','nh-en');
assert.equal(original.passages[0].id,'FC11-209v-mirror');
const fragment=model.analyze('iuhqujn chimalli','nh-en');
assert.equal(fragment.passages[0].type,'comparison fragment, not finite sentence');
assert.equal(model.analyze('xōchitl','nh-en').passages.length,0,'Do not match the middle of an unrelated phrase');
const unknown=model.analyze('asfdghjk xyzwe','nh-en');
assert.equal(unknown.stats.unknown,2);
assert.match(unknown.gloss,/\[\?asfdghjk\]/);
const polysemy=model.analyze('in xōchitl in cuīcatl','nh-en');
assert.equal(polysemy.stats.unknown,0);
assert.equal(polysemy.passages.length,0,'Uncited idiomatic interpretation must not be inserted as historical text.');
assert.equal(model.analyze('xōchitl','en-nh').stats.unknown,1,'Reverse direction does not imply generation.');
assert.equal(model.lookup('nonsense','nh-en').candidates.length,0);
assert(!model.lookup('-āuh','nh-en').candidates.length,'Bound stems must not be standalone tokens.');
// A spacing overbar is part of a manuscript spelling, not disposable punctuation.
const written=model.analyze('ticnamaca y¯ totlal','nh-en');
assert.equal(written.parts.filter(x=>x.kind==='word').map(x=>x.value).join('|'),
 'ticnamaca|y¯|totlal','Keep the source-written abbreviation intact across lexical lookup');
assert.match(written.gloss,/y¯/u,'The working gloss must preserve the written mark');
assert.equal(context.window.TlahtolliTranslator.tokenize('y‾, y¯ ȳ')
 .filter(x=>x.includes('y')).join('|'),'y‾|y¯|ȳ',
 'Distinct overbar and combining-macron conventions must remain distinct');
assert.equal(context.window.TlahtolliTranslator.tokenize('¯ y').join('|'),'¯ |y',
 'An isolated mark is punctuation, not a fabricated word');
const fakeUnmarked=context.window.TlahtolliTranslator.create({words:[{
 word:'y',meaning:'fabricated control',variety:'Classical Nahuatl'
}]},{entries:[]});
assert.equal(fakeUnmarked.analyze('y¯','nh-en').stats.unknown,1,
 'A cited plain-y entry must never license a written y-overbar abbreviation');
const injected={words:[{word:'testa',meaning:'test',variety:'Eastern Huasteca Nahuatl'}]};
assert.equal(context.window.TlahtolliTranslator.create(injected,{entries:[]}).stats.headwords,0);
console.log('Translation tests passed: lexical lookup, historical passage provenance, unknowns, reverse boundaries and dialect isolation.');
