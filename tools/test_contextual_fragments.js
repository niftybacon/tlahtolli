// Comparative contextual fragments, not complete-sentence translation accuracy.
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const base=path.join(__dirname,'..');
const d=JSON.parse(fs.readFileSync(path.join(base,'dictionary.json'),'utf8'));
const p=JSON.parse(fs.readFileSync(path.join(base,'paradigms.json'),'utf8'));
const examples=JSON.parse(fs.readFileSync(path.join(base,'research/translation_corpus/research_examples.json'),'utf8'));
const ctx={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(base,'translator-sentence.js'),'utf8'),ctx);
const make=(dictionary=d,research=examples)=>ctx.window.TlahtolliSentence.create(dictionary,p,()=>[],research);
const model=make(),analyze=t=>model.analyze(t);
const original=analyze('iuhqujn chimalli');
assert.equal(original.complete,false,'The Florentine excerpt is a comparative fragment, not a finite clause');
assert.equal(original.clauses[0].candidates.length,0);
assert.equal(original.clauses[0].fragmentInterpretations.length,1);
const exact=original.clauses[0].fragmentInterpretations[0];
assert.equal(exact.sourceSpelling,'iuhqujn chimalli');
assert.equal(exact.construction,'Comparative particle + source-checked noun phrase');
assert.equal(exact.cue.lemma,'iuhquin');
assert.equal(exact.cue.evidence,'source-located historical spelling');
assert.equal(exact.noun.lemma,'chimalli');
assert.equal(exact.noun.meaning,'shield; metaphor for war');
assert.equal(exact.compositionalReading,'like / as if + [shield; metaphor for war]');
assert.equal(exact.grade,'source-attested editorial comparison (not blind)');
assert.equal(exact.editorialComparison.reading,'Like a shield.');
assert.equal(exact.editorialComparison.source_id,'FC');
assert(exact.sources.some(u=>u.includes('/folio/62r')));
assert(exact.sources.some(u=>u.includes('/content/iuhquin')));
assert(exact.sources.some(u=>u.includes('/content/chimalli')));
assert.match(exact.note,/EXACT source-spelled/);
const plain=analyze('iuhquin chimalli');
assert.equal(plain.complete,false);
assert.equal(plain.clauses[0].fragmentInterpretations.length,1);
assert.equal(plain.clauses[0].fragmentInterpretations[0].editorialComparison,null,
 'Editorial reading must not be copied onto an alternate token spelling');
assert.equal(plain.clauses[0].fragmentInterpretations[0].grade,
 'compositional comparison hypothesis (not independently attested)');
for(const word of ['calli','conetl','cihuātl','xōchitl','ātl']){
 const r=analyze('iuhquin '+word),f=r.clauses[0].fragmentInterpretations;
 assert.equal(r.complete,false,word);
 assert.equal(r.clauses[0].candidates.length,0);
 assert.equal(f.length,1,'Rule must generalize across curated Classical Nahuatl nouns: '+word);
 assert.equal(f[0].noun.lemma,word);
 assert.equal(f[0].editorialComparison,null);
 assert(f[0].compositionalReading.includes('['+d.words.find(w=>w.word===word).meaning+']'));
 assert.equal(f[0].coverage,2);
}
for(const text of [
 'iuhqujn unknown','iuhquin nonword','iuhquin nimitzchīhua',
 'iuhquin iuhquin','iuhqujn chimalli extra','iuhqujn in chimalli',
 'iuhquin xochitll','iuhqujn. chimalli','ahmo iuhqujn chimalli',
 'iuhqujn chimalli atl','atl yitic nemjnj','in mochioa tezcatl in mocuepa ca tetl'
]){
 const c=analyze(text).clauses;
 assert(c.every(cl=>cl.fragmentInterpretations.length===0),text+
  ' must not hallucinate a source-supported comparative construction');
}
assert.equal(make(d,{entries:[]}).analyze('iuhqujn chimalli').clauses[0]
 .fragmentInterpretations[0].editorialComparison,null,'Non-gold source example optional');
for(const value of [
 {review_status:'approved'},
 {train_eligible:true},
 {original:'iuhquin chimalli'},
 {source_url:'https://example.com/fiction'},
 {variety:'Modern Huasteca Nahuatl'},
 {passage_type:'imagined sentence'}
]){
 const clone=JSON.parse(JSON.stringify(examples));
 Object.assign(clone.entries.find(e=>e.id==='FC11-62r-chimalli'),value);
 assert.equal(make(d,clone).analyze('iuhqujn chimalli').clauses[0]
  .fragmentInterpretations[0].editorialComparison,null,
  'Never upgrade a changed, cross-variety or training-approved source record');
}
for(const mutate of [
 word=>{word.source='https://example.org/other';},
 word=>{word.pos='verb';},
 word=>{word.original='iuhqujn';word.word='different';},
 word=>{word.inflections=word.inflections.filter(x=>x.form!=='iuhqujn');}
]){
 const clone=JSON.parse(JSON.stringify(d)),word=clone.words.find(x=>x.word==='iuhquin');
 mutate(word);
 assert.equal(make(clone).analyze('iuhqujn chimalli').clauses[0]
  .fragmentInterpretations.length,0,'Do not infer an unverified historical comparative cue');
}
const clone=JSON.parse(JSON.stringify(d));
clone.words.push({...clone.words.find(x=>x.word==='chimalli'),meaning:'conflicting sense'});
assert.equal(make(clone).analyze('iuhqujn chimalli').clauses[0]
 .fragmentInterpretations.length,0,'Collision must not force a noun reading');
assert.equal(analyze('niquitta in cihuātl').clauses[0].candidates[0].english[0],
 'I see the woman','Previous clause grammar must remain unchanged');
console.log('PASS Classical comparative-fragment composition: FC Book 11 exact source, general noun substitutions, lexical sense abstention, historical spelling and unsafe-source refusals.');
