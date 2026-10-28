'use strict';
// Explicit negative and positive controls for lexical lookup, not translator accuracy.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const context={window:{},URL};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','translator-engine.js'),'utf8'),context,{filename:'translator-engine.js'});
const create=context.window.TlahtolliTranslator.create;
const mk=(words)=>create({words:words.map(x=>({variety:'Classical Nahuatl',source:'https://example.org/lexicon',pos:'noun',...x}))},{entries:[]});
const vowel=mk([
 {word:'toca',meaning:'to follow',pos:'verb'},
 {word:'tōca',meaning:'to plant',pos:'verb'}
]);
const undotted=vowel.analyze('toca');
assert.equal(undotted.stats.matched,1);
assert.equal(undotted.stats.orthographyConflicts,1);
assert.equal(undotted.parts[0].orthographyConflict,true);
assert.equal(undotted.parts[0].alternatives[0].lemma,'tōca');
assert.match(undotted.gloss,/vowel length ambiguous/);
assert(!undotted.gloss.includes('[to follow]'),'Unmarked orthography must not silently choose a sense');
const explicit=vowel.analyze('tōca');
assert.equal(explicit.parts[0].orthographyConflict,false);
assert.equal(explicit.gloss,'[to plant]');
const approximate=mk([{word:'tōca',meaning:'to plant',pos:'verb'}]).analyze('toca');
assert.equal(approximate.stats.approximate,1);
assert.match(approximate.gloss,/spelling uncertain/);
assert(!approximate.gloss.includes('[to plant]'),'Approximate diacritics must not invent an exact reading');
const homographs=mk([
 {word:'one',original:'common',meaning:'meaning A'},
 {word:'two',original:'common',meaning:'meaning B'}
]);
const ambiguous=homographs.analyze('common');
assert.equal(ambiguous.stats.ambiguous,1);
assert.equal(ambiguous.parts[0].ambiguous,true);
assert.equal(ambiguous.parts[0].candidates.length,2);
assert.match(ambiguous.gloss,/multiple entries/);
assert(!ambiguous.gloss.includes('meaning A'),'Ambiguous dictionary senses cannot be silently resolved');
const reverse=mk([
 {word:'one',meaning:'water'},
 {word:'two',meaning:'water'}
]).analyze('water','en-nh');
assert.equal(reverse.stats.ambiguous,1);
assert.match(reverse.gloss,/multiple entries/);
const exact=mk([
 {word:'ātl',original:'atl',meaning:'water; liquid'}
]).analyze('atl! ātl? zzzz');
assert.equal(exact.stats.matched,2);
assert.equal(exact.stats.unknown,1);
assert.equal(exact.stats.orthographyConflicts,0);
assert.equal(exact.gloss,'[?atl: multiple dictionary senses]! [?ātl: multiple dictionary senses]? [?zzzz]');
const punct=mk([{word:'ah',meaning:'yes'}]).analyze('Ah,\nah.');
assert.equal(punct.gloss,'[yes],\n[yes].');
const target=mk([
 {word:'nēmi',original:'nemi',meaning:'resides'}
]).analyze('nemi');
assert.equal(target.stats.approximate,0,'Explicit documented historical spellings remain exact dictionary-form matches');
assert.equal(target.gloss,'[resides]');
console.log('PASS: exact historical forms, macron contrast, candidate ambiguity, reverse ambiguity, diacritic abstention, punctuation and unknown-word refusal.');
// Sense-list controls are synthetic software fixtures, not linguistic attestations.
const senses=mk([{word:'sample',meaning:'first sense; contextual sense, another sense'}]);
assert.equal(senses.analyze('sample').parts[0].senseAmbiguous,true);
assert.equal(senses.analyze('sample').stats.senseAmbiguities,1);
assert.equal(senses.analyze('sample').gloss,'[?sample: multiple dictionary senses]');
assert.equal(senses.lookup('sample').candidates[0].senses.join('|'),'first sense|contextual sense|another sense');
assert.equal(senses.analyze('first sense','en-nh').stats.senseAmbiguities,0);
assert.equal(mk([{word:'sample',meaning:'single sense'}]).analyze('sample').gloss,'[single sense]');
assert.equal(mk([{word:'sample',meaning:'same; same'}]).analyze('sample').gloss,'[same]');
const collisionWords=[
 {word:'same',original:'alias',meaning:'sense A',source:'https://example.org/a'},
 {word:'same',original:'alias',meaning:'sense B',source:'https://example.org/b'}
];
for(const words of [collisionWords,[...collisionWords].reverse()]){
 const collision=mk(words);
 for(const form of ['same','alias']){
  assert.equal(collision.lookup(form).candidates.length,2);
  assert.equal(collision.analyze(form).gloss,'[?'+form+': multiple entries]');
 }
}
const duplicate=mk([collisionWords[0],collisionWords[0]]);
assert.equal(duplicate.lookup('same').candidates.length,1);
assert.equal(duplicate.analyze('same').gloss,'[sense A]');
const corroborated=mk([collisionWords[0],{...collisionWords[0],source:'https://example.org/independent'}]);
assert.equal(corroborated.lookup('same').candidates.length,2,'Keep separate source records visible');
assert.equal(corroborated.analyze('same').gloss,'[sense A]','Same lexical claim from two sources is not a competing sense');
const pos=mk([{word:'same',meaning:'one',pos:'noun'},{word:'same',meaning:'one',pos:'verb'}]);
assert.match(pos.analyze('same').gloss,/multiple entries/);
const crowded=mk(Array.from({length:10},(_,i)=>({word:'same',meaning:'sense '+i})));
assert.equal(crowded.lookup('same').totalCandidates,10);
assert.equal(crowded.lookup('same').truncated,true);
assert.match(crowded.analyze('same').gloss,/multiple entries/);
console.log('PASS: unresolved sense lists, input-order independence, same-headword collisions, provenance preservation, duplicate and single-sense controls.');
// Context rule controls: constructed examples, not manuscript attestations.
const comparison=mk([{word:'iuhquin',original:'iuhqujn',meaning:'like; as if',pos:'particle'},
 {word:'object',meaning:'stone; hard object'},{word:'verb',meaning:'run',pos:'verb'}]);
assert.equal(comparison.analyze('iuhquin object').contextReadings[0].readings.join('|'),'like stone|like hard object');
assert.equal(comparison.analyze('IUHQUJN object.').contextReadings.length,1);
for(const text of ['object iuhquin','iuhquin verb','iuhquin unknown','iuhquin, object','iuhquin\nobject','iuhquin object extra','extra iuhquin object']){
 assert.equal(comparison.analyze(text).contextReadings.length,0,text);
}
assert.equal(comparison.analyze('iuhquin object','en-nh').contextReadings.length,0);
const ambiguousComparison=mk([{word:'iuhquin',meaning:'like',pos:'particle'},
 {word:'object',meaning:'one'},{word:'object',meaning:'two'}]);
assert.equal(ambiguousComparison.analyze('iuhquin object').contextReadings.length,0);
console.log('PASS: bounded comparison composition, alternatives, order, punctuation, clause extent and lexical conflict controls.');
