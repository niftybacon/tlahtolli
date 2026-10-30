#!/usr/bin/env node
'use strict';
// Phase 1 verification tests: constructed grammar controls, NOT Gold accuracy.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const ctx={window:{}};vm.createContext(ctx);
for(const file of ['translator-locative.js','translator-sentence.js',
 'translator-english.js','translator-grammar-ir.js','translator-semantic-ir.js'])
 vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx,{filename:file});
const data=file=>JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
const dictionary=data('dictionary.json'),paradigms=data('paradigms.json');
const locative=ctx.window.TlahtolliLocative.create(dictionary,{entries:[]});
const sentence=ctx.window.TlahtolliSentence.create(dictionary,paradigms,null,null,locative);
const english=ctx.window.TlahtolliEnglish.create(sentence);
const grammar=ctx.window.TlahtolliGrammarIR.create(dictionary);
const semantic=ctx.window.TlahtolliSemanticIR.create(sentence,english,grammar);
const clone=x=>JSON.parse(JSON.stringify(x));
function make(text){
 const analysis=sentence.analyze(text);
 const graph=grammar.build(text,analysis);
 const options=grammar.auditEnglish(english.compose(text,analysis),analysis,graph);
 return {text,analysis,graph,options};
}
const supported=[
 ['nichōca','I cry.'],['nitlacua','I eat.'],
 ['niquitta in cihuātl','I see the woman.'],
 ['ahmo niquittaz in cihuātl','I will not see the woman.'],
 ['niquitta in cihuātl in chōca','I see the woman that cries.'],
 ['nichōca auh nitlacua','I cry. I eat.'],
 ['chōca in cihuātl. chōca','The woman cries. He / she / it cries.']
];
for(const [text,expected] of supported){
 const m=make(text),v=semantic.verify(text,m.analysis,m.graph,m.options);
 assert.equal(v.available,true,text+': '+v.reason);
 assert.equal(v.version,'tentli-semantic-contract-v1');
 assert.equal(v.canonicalDraft,expected,text);
 assert.equal(v.verifiedTranslation,false);
 assert.equal(v.independentHistoricalAccuracy,null);
 assert.equal(v.units.length,m.options.units.length);
 assert(v.optionsChecked>0);
 assert(v.units.every(u=>u.alternatives.every(a=>a.status.includes('NOT a verified translation'))));
 assert.equal(english.render(v.composition),expected);
}
const person=make('nichōca');
const okay=semantic.verify(person.text,person.analysis,person.graph,person.options);
assert.equal(okay.units[0].alternatives[0].events[0].person,'1sg');
assert.equal(okay.units[0].alternatives[0].events[0].polarity,'affirmative');
assert.equal(okay.units[0].alternatives[0].events[0].subject.referent,'unresolved');
const negative=make('ahmo niquittaz in cihuātl');
const neg=semantic.verify(negative.text,negative.analysis,negative.graph,negative.options);
assert.equal(neg.units[0].alternatives[0].events[0].polarity,'negative');
assert.equal(neg.units[0].alternatives[0].events[0].tense,'future');
assert.equal(neg.units[0].alternatives[0].events[0].object.kind,'overt-nominal');
const relative=make('niquitta in cihuātl in chōca');
const rel=semantic.verify(relative.text,relative.analysis,relative.graph,relative.options);
assert(rel.units[0].alternatives.some(a=>a.kind==='headed-relative'&&
 a.relative.gap==='relative subject'&&a.relative.antecedentIdentity==='not-inferred'));
let refused=0;
const deny=(m,mutation,reason)=>{
 const a=clone(m.analysis),g=clone(m.graph),o=clone(m.options);
 mutation(a,g,o);
 const got=semantic.verify(m.text,a,g,o);
 assert.equal(got.available,false,reason);
 assert.equal(got.composition,null);
 assert.equal(got.verifiedTranslation,false);
 refused++;
};
// The English words and their structured features must match a fresh,
// independent canonical rerender, not just a plausible but altered surface.
deny(person,(a,g,o)=>{o.units[0].options[0].text='He cries';},'person flip');
deny(person,(a,g,o)=>{o.units[0].options[0].text='I dance';},'invented meaning');
deny(person,(a,g,o)=>{o.units[0].options[0].structure.frame.subjectPerson=2;},'forged subject');
deny(person,(a,g,o)=>{o.units[0].options[0].structure.frame.tense='future';},'forged tense');
deny(person,(a,g,o)=>{o.units[0].options[0].structure.frame.negative=true;},'forged negation');
deny(person,(a,g,o)=>{o.units[0].options[0].sources=['https://example.org/not-a-citation'];},'forged source');
deny(person,(a,g,o)=>{o.units[0].options[0].grammarAudit.status='verified';},'forged audit');
deny(person,(a,g,o)=>{o.verified=true;},'fake translation verification');
deny(person,(a,g,o)=>{o.audit.scope='expert certified';},'fake audit scope');
deny(person,(a,g,o)=>{a.clauses[0].tokens=['other'];},'changed analysis tokens');
deny(relative,(a,g,o)=>{assert(g.edges.length>0);g.edges[0].status='verified';},'altered graph');
deny(negative,(a,g,o)=>{o.units[0].options[0].text='I will see the woman';},'dropped negation');
deny(negative,(a,g,o)=>{o.units[0].options[0].structure.frame.objectNoun=null;},'object reassignment');
deny(relative,(a,g,o)=>{o.units[0].options[0].structure.relativeGap='relative object';},'relative role changed');
deny(make('nichōca auh nitlacua'),(a,g,o)=>{o.joins[0].options=[{label:'if',kind:'conditional'}];},'invented connective');
assert.equal(semantic.verify('nichōca',person.analysis,person.graph,
 make('nichōca auh nitlacua').options).available,false,'mismatched whole passage');
for(const input of ['xyzzy','nichōca xyzzy','nichōca?']){
 const m=make(input);
 assert.equal(semantic.verify(input,m.analysis,m.graph,m.options).available,false,input);
}
const {produce}=require('./source_gated_english_bridge.js');
const actual=produce('niquitta in cihuātl');
assert.equal(actual.status,'candidates');
assert.equal(actual.semantic_verifier.version,'tentli-semantic-contract-v1');
assert.equal(actual.semantic_verifier.passed,true);
assert(actual.semantic_verifier.option_count>0);
assert.equal(actual.semantic_verifier.verified_historical_translation,false);
assert.equal(produce('xyzzy').status,'abstain');
console.log('PASS semantic contract: '+supported.length+
 ' complete constructed examples, '+refused+' deliberate tampering probes, real source-gated bridge, unverified semantic status and abstentions.');
