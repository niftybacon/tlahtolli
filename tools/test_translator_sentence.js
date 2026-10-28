'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'..'),context={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'translator-sentence.js'),'utf8'),context);
const d=JSON.parse(fs.readFileSync(path.join(root,'dictionary.json'))),p=JSON.parse(fs.readFileSync(path.join(root,'paradigms.json')));
const model=context.window.TlahtolliSentence.create(d,p),analyze=s=>model.analyze(s);
let checked=0;
for(const [lemma,entry] of Object.entries(p.paradigms))entry.cells[0].forEach((form,person)=>{
 const result=analyze(form);assert(result.complete,form);
 assert(result.clauses[0].candidates.some(c=>c.frame.predicate===lemma&&c.frame.subjectPerson===person));checked++;
});
const negative=analyze('ahmo nichōca').clauses[0].candidates[0];
assert.equal(negative.english[0],'I do not cry');assert.equal(negative.frame.negative,true);
for(const text of ['chōca in cihuātl','in cihuātl chōca']){
 const c=analyze(text).clauses[0].candidates[0];assert.equal(c.frame.subjectNoun,'cihuātl');assert.equal(c.coverage,3);
}
assert.equal(analyze('niquitta').clauses[0].candidates[0].frame.object,'him / her / it');
assert.equal(analyze('ahmo nichōca. nitlacua.').clauses[1].candidates[0].frame.negative,false);
for(const text of ['nichōca extra','nichōca in cihuātl','chōca cihuātl','chōca in unknown','chōca, in cihuātl','cuix nichōca','nichōca?','in cihuātl','ahmo','zzzz'])assert.equal(analyze(text).complete,false,text);
const partial=analyze('nichōca. unknown.');assert.equal(partial.complete,false);assert.equal(partial.clauses[0].complete,true);
assert.equal(analyze('x'.repeat(7001)).complete,false);
assert.equal(analyze('').complete,false);
assert(negative.sources.length>=2);assert.equal(negative.grade,'grammar-derived candidate');
console.log('PASS sentence analysis: '+checked+' present paradigm cells, agreement, word order, polarity, object roles, full coverage and negative controls.');

// All supported cells generate English without borrowing a tense from another row.
let rendered=0;
for(const [lemma,entry] of Object.entries(p.paradigms))for(const [row,tense] of [[0,'present'],[3,'future']]){
 entry.cells[row].forEach((form,person)=>{
  for(const neg of [false,true]){
   const hits=analyze((neg?'ahmo ':'')+form).clauses[0].candidates;
   const hit=hits.find(c=>c.frame.predicate===lemma&&c.frame.subjectPerson===person&&c.frame.tense===tense);
   assert(hit,form);assert(hit.english.length>0,lemma);
   assert.equal(hit.frame.negative,neg);
   if(tense==='future')assert(hit.english.every(e=>e.includes(neg?'will not ':'will ')));
   if(neg&&tense==='present')assert(hit.english.every(e=>e.includes(person===2?'does not ':'do not ')));
   rendered++;
  }
 });
}
assert.equal(analyze('nichōca').clauses[0].candidates[0].english[0],'I cry');
assert.equal(analyze('chōca').clauses[0].candidates[0].english[0],'He / she / it cries');
assert.equal(analyze('nitlami').clauses[0].candidates[0].english[2],'I run out');
assert.equal(analyze('niquittaz in cihuātl').clauses[0].candidates[0].english[0],'I will see the woman');
assert.equal(analyze('ahmo niquittaz in cihuātl').clauses[0].candidates[0].english[0],'I will not see the woman');
for(const text of ['niquitta in cihuātl','in cihuātl niquitta']){
 const clause=analyze(text).clauses[0];assert.equal(clause.candidates.length,1);
 assert.equal(clause.candidates[0].frame.objectNoun,'cihuātl');assert.equal(clause.roleAmbiguous,false);
 assert.equal(clause.candidates[0].english[0],'I see the woman');
 assert(clause.candidates[0].nounSenses[0].fullMeaning.includes('wife'));
}
const one=analyze('quitta in cihuātl').clauses[0];
assert.equal(one.candidates.length,2);assert(one.roleAmbiguous);
assert(one.candidates.some(c=>c.frame.subjectNoun==='cihuātl'&&c.frame.objectNoun===null));
assert(one.candidates.some(c=>c.frame.objectNoun==='cihuātl'&&c.frame.subjectNoun===null));
const roleSet=c=>c.candidates.map(a=>a.frame.subjectNoun+'>'+a.frame.objectNoun).sort().join('|');
for(const text of ['quitta in cihuātl in conetl','in cihuātl quitta in conetl','in cihuātl in conetl quitta','in conetl quitta in cihuātl']){
 const clause=analyze(text).clauses[0];assert(clause.roleAmbiguous);
 assert.equal(roleSet(clause),'cihuātl>conetl|conetl>cihuātl');
 assert(clause.candidates.every(c=>c.coverage===5));
}
for(const text of ['in quitta cihuātl','niquitta in cihuātl in conetl','chōca in cihuātl in conetl',
 'niquitta in unknown','niquitta cihuātl','niquitta in cihuātl extra','niquitta nichōca',
 'ahmo ahmo niquitta','in cihuātl ahmo niquitta','niquittaz?'])assert.equal(analyze(text).complete,false,text);
const clone=JSON.parse(JSON.stringify(d));clone.words.push({...clone.words.find(w=>w.word==='cihuātl'),meaning:'conflicting lexical meaning'});
assert.equal(context.window.TlahtolliSentence.create(clone,p).analyze('niquitta in cihuātl').complete,false);
const separate=analyze('ahmo niquittaz in cihuātl. nitlacua.');
assert(separate.complete);assert.equal(separate.clauses[1].candidates[0].frame.negative,false);
console.log('PASS: '+rendered+' affirmative/negative tense renderings, named objects, reversible third-person roles, source and sense retention, phrase boundaries.');


// Source-graded morphological bridge tests. Existing sentence model remains
// unchanged unless the canonical morphological provider is explicitly passed.
const locatedForm=(lemma,form)=>{
 const word=d.words.find(w=>w.word===lemma);
 const item=word?.inflections?.find(f=>f.form===form);
 assert(word&&item,lemma+' '+form);
 return {lemma,kind:item.category,grade:item.evidence==='text'?'manuscript':'lexical',
  features:{partOfSpeech:word.pos,evidence:item.evidence},
  source:item.source,parts:[{surface:form,role:'Source-listed complete form'}]};
};
const finiteList=[
 ['cochi','onicoch'],['cochi','ōnicoch'],
 ['caqui','onitlacac'],['caqui','ōniccac'],
 ['yauh','onia'],['yauh','ōniyah'],['yauh','niauh'],
 ['tlacuiloa','onitlahcuiloh']
];
const finiteLookup=Object.fromEntries(finiteList.map(([lemma,form])=>[form,locatedForm(lemma,form)]));
const provider=token=>finiteLookup[token]?[finiteLookup[token]]:[];
const bridged=context.window.TlahtolliSentence.create(d,p,provider);
const isolated=form=>bridged.analyze(form).clauses[0];
for(const [lemma,form] of finiteList){
 const c=isolated(form);
 assert(c.complete,'Source-recorded isolated finite form should show a gloss: '+form);
 assert.equal(c.candidates.length,1);
 const interpretation=c.candidates[0];
 assert.equal(interpretation.frame.predicate,lemma);
 assert.equal(interpretation.frame.sourceForm,form);
 assert.equal(interpretation.english[0],d.words.find(w=>w.word===lemma).inflections.find(f=>f.form===form).gloss);
 assert.equal(interpretation.grade,'source-listed finite-form gloss (unverified in context)');
 assert.match(interpretation.note,/NOT a generated sentence translation/);
 assert.equal(interpretation.coverage,1);
 assert.equal(interpretation.sources.includes(finiteLookup[form].source),true);
 assert.equal(analyze(form).complete,false,'Default sentence engine must not silently expand when no morphology provider exists');
}
assert.equal(isolated('onicoch').candidates[0].frame.tense,'preterite');
assert.equal(isolated('niauh').candidates[0].frame.subjectPerson,0);
assert.equal(isolated('onitlahcuiloh').candidates[0].frame.tense,'completed (source label)');
for(const input of ['ahmo onicoch','onicoch in cihuātl','onicoch zzz','onicoch,','onicoch?','onicoch onia']){
 const result=bridged.analyze(input);
 assert.equal(result.complete,false,'No unsupported extra words or negative source-form reinterpretation: '+input);
}
const partiallyBridged=bridged.analyze('onicoch in cihuātl').clauses[0];
assert(partiallyBridged.morphologicalClues.some(x=>x.token==='onicoch'&&x.lemma==='cochi'));
assert.equal(partiallyBridged.candidates.length,0);
assert.equal(bridged.analyze('onicoch. zzz').complete,false);
const noProofs=[
 {kind:'Dictionary headword'},
 {kind:'Spelling variant'},
 {kind:'Productive transitive parse',grade:'hypothesis'},
 {grade:'paradigm'},
 {grade:'analogy'},
 {grade:'unreviewed'},
 {lemma:'itta'},
 {source:'https://invalid.example'},
 {features:{evidence:'generated'}},
 {kind:'Preterite 2sg (fake)'},
 {parts:null},
];
for(const edited of noProofs){
 const item={...locatedForm('cochi','onicoch'),...edited};
 assert.equal(context.window.TlahtolliSentence.create(d,p,()=>[item]).analyze('onicoch').complete,false,
  'Reject unverified source/morphological mismatch: '+JSON.stringify(edited));
}
const corrupt=JSON.parse(JSON.stringify(d));
corrupt.words.find(w=>w.word==='cochi').inflections.find(x=>x.form==='onicoch').source='';
assert.equal(context.window.TlahtolliSentence.create(corrupt,p,provider).analyze('onicoch').complete,false);
const unrelated=JSON.parse(JSON.stringify(d));
unrelated.words.find(w=>w.word==='cochi').inflections.find(x=>x.form==='onicoch').category='Dictionary headword';
assert.equal(context.window.TlahtolliSentence.create(unrelated,p,provider).analyze('onicoch').complete,false);
assert.equal(bridged.analyze('nichōca').clauses[0].candidates[0].english[0],'I cry');
console.log('PASS: source-graded morphology bridge, '+finiteList.length+
 ' isolated historical finite forms, exact recorded glosses, honest incomplete clauses and 11 mismatch/uncertainty safeguards.');
