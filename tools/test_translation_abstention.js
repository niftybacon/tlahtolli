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
assert.equal(exact.gloss,'[water]! [water]? [?zzzz]');
const punct=mk([{word:'ah',meaning:'yes'}]).analyze('Ah,\nah.');
assert.equal(punct.gloss,'[yes],\n[yes].');
const target=mk([
 {word:'nēmi',original:'nemi',meaning:'resides'}
]).analyze('nemi');
assert.equal(target.stats.approximate,0,'Explicit documented historical spellings remain exact dictionary-form matches');
assert.equal(target.gloss,'[resides]');
console.log('PASS: exact historical forms, macron contrast, candidate ambiguity, reverse ambiguity, diacritic abstention, punctuation and unknown-word refusal.');
