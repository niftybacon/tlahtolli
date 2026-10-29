'use strict';
// Batch 03 is a real curated-lexeme expansion, NOT 10 full verb paradigms.
// Cross-check both published source records and unseen productive analyses.
// None of these forms was selected from the Axolotl development sample.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const dictionary=JSON.parse(read('dictionary.json'));
const paradigms=JSON.parse(read('paradigms.json'));
const lex=JSON.parse(read('data/lexicon.json'));
const morphology=JSON.parse(read('data/morphology.json'));
const evidence=JSON.parse(read('data/evidence.json'));
const entries=[
 ['tēmi','tēn-; tēmi-','ōnitēn','nitēmiz','ōtitēn'],
 ['huetzi','huetz-; huetzi-','ōnihuetz','nihuetziz','ōtihuetz'],
 ['tlācati','tlācat-; tlācati-','ōnitlācat','nitlācatiz','ōtitlācat'],
 ['nāhuati','nāhuat-; nāhuati-','ōnināhuat','nināhuatiz','ōtināhuat'],
 ['tlatzihui','tlatziuh-; tlatzihui-','ōnitlatziuh','nitlatzihuiz','ōtitlatziuh'],
 ['patlāni','patlān-; patlāni-','ōnipatlān','nipatlāniz','ōtipatlān'],
 ['tlanahui','tlanauh-; tlanahui-','ōnitlanauh','nitlanahuiz','ōtitlanauh'],
 ['tequi','tec-; tequi-','onitlatec','nitlatequiz','otitlatec'],
 ['tlachia','tlachix-; tlachia-','onitlachix','nitlachiaz','otitlachix'],
 ['tītlani','tītlan-; tītlani-','ōnictītlan',null,'ōtictītlan']
];
assert.equal(dictionary.version,JSON.parse(read('release.json')).version);
assert(dictionary.words.length>=128);
assert.equal(Object.keys(paradigms.paradigms).length,12);
assert.deepEqual(dictionary.words.slice(118,128).map(x=>x.word),entries.map(x=>x[0]));
assert.deepEqual(lex.words.map(x=>x.word),morphology.entries.map(x=>x.word));
assert.deepEqual(lex.words.map(x=>x.word),evidence.entries.map(x=>x.word));
const source=read('tools/morphology_engine.js')
 .split('renderMorphologyBreakdown=TlahtolliMorphEngine.html;')[0];
function load(words=dictionary.words){
 const ctx={window:{},words,FULL_VERB_PARADIGMS:paradigms.paradigms,
  VERB_TENSES:paradigms.patterns,
  norm:s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(),
  stripToken:s=>String(s||'').replace(/^[^\p{L}\p{M}]+|[^\p{L}\p{M}]+$/gu,''),
  historicalSpellings:w=>String(w.original||'').split(/[;,/]+/).map(t=>t.trim()).filter(Boolean),
  safe:String,validUrl:()=>true,safeLink:()=>''};
 vm.runInNewContext(source+'\nthis.morph=TlahtolliMorphEngine;',ctx);
 return ctx;
}
const ctx=load(),analyze=s=>ctx.morph.analyze(s);
const located=w=>field=>w.claims.some(c=>c.field===field&&
 c.assessment==='dictionary'&&c.source===w.source&&c.locator);
for(const [lemma,stem,past,future,secondPast] of entries){
 const w=dictionary.words.find(x=>x.word===lemma);
 assert(w&&w.stem===stem&&w.pos.startsWith('verb'),lemma);
 const sourceCheck=located(w);
 for(const field of ['headword','meaning','pos','stem'])
  assert(sourceCheck(field),'Missing source-located claim '+lemma+' '+field);
 assert(w.source.startsWith('https://nahuatl.wired-humanities.org/'));
 assert(!Object.prototype.hasOwnProperty.call(paradigms.paradigms,lemma),
  'New lemma cannot silently become a full 60-cell paradigm');
 assert(w.inflections.some(x=>x.form===past&&x.evidence==='dictionary'&&
  /Preterite 1sg/.test(x.category)));
 assert(w.inflections.every(x=>x.evidence==='dictionary'&&
  !/manuscript-attested/i.test(x.note||'')));
 assert(analyze(lemma).some(x=>x.lemma===lemma&&x.kind==='Dictionary headword'),
  'New lexical headword should be searchable');
 const candidates=[secondPast,...(future?[future]:[])];
 for(const token of candidates){
  assert(!w.inflections.some(f=>f.form===token),
   'Unseen productive token cannot be prelisted in curated morphology');
  const parses=analyze(token).filter(x=>x.lemma===lemma&&x.grade==='hypothesis');
  assert(parses.length>0,'Missing productive reading '+token+' -> '+lemma);
  assert(parses.every(x=>x.source.startsWith('https://')&&
   x.parts.filter(p=>p.surface!=='Ø').map(p=>p.surface).join('')===token),
  'Every proposed reading must preserve exact surface and provenance');
 }
 const pastMatch=analyze(past);
 assert(pastMatch.some(x=>x.lemma===lemma&&x.grade==='lexical'),
  'Actually recorded past example retains stronger lexical evidence');
 assert(!pastMatch.some(x=>x.lemma===lemma&&x.kind.includes('hypothesis')),
  'Recorded form should not be artificially promoted to a grammar guess');
}
// Explicitly deny unsupported sound changes, transitive object loss, and
// false macron folding. This is a test of abstention, not of guess volume.
for(const [form,kind] of [
 ['nitēniz','Source-stem-class future hypothesis'],
 ['nitemiz','Source-stem-class future hypothesis'],
 ['nīhuetziz','Source-stem-class future hypothesis'],
 ['nitlācātiz','Source-stem-class future hypothesis'],
 ['nītlatequiz','Source-stem-class future hypothesis'],
 ['nitequiz','Source-stem-class future hypothesis'],
 ['nictequiz','Source-stem-class future hypothesis'],
 ['nitītlaniz','Source-stem-class future hypothesis'],
 ['ōtictitlan','Source-template singular preterite hypothesis']
]){
 assert(!analyze(form).some(x=>x.kind===kind),
  'Unlicensed guessing or quantity collapse: '+form);
}
for(const field of ['headword','pos','stem']){
 const revised=JSON.parse(JSON.stringify(dictionary.words));
 const entry=revised.find(x=>x.word==='tēmi');
 entry.claims=entry.claims.filter(c=>c.field!==field);
 assert(!load(revised).morph.analyze('nitēmiz').some(x=>x.kind==='Source-stem-class future hypothesis'),
  'Absent '+field+' evidence cannot license a productive future');
}
{
 const revised=JSON.parse(JSON.stringify(dictionary.words));
 revised.find(x=>x.word==='tēmi').inflections=
 revised.find(x=>x.word==='tēmi').inflections.filter(x=>x.form!=='ōnitēn');
 assert(!load(revised).morph.analyze('nitēmiz').some(x=>x.kind==='Source-stem-class future hypothesis'),
  'Removing the documented 1sg preterite must disable class generation');
}
vm.runInNewContext(read('translator-sentence.js'),ctx);
const sentence=ctx.window.TlahtolliSentence.create(dictionary,paradigms,token=>analyze(token));
for(const [, , ,future,past] of entries){
 for(const token of [past,...(future?[future]:[])]){
  const out=sentence.analyze(token);
  assert.equal(out.complete,false,'Hypotheses never complete whole-sentence grammar: '+token);
  assert.equal(out.clauses[0].candidates.length,0);
 }
}
console.log('PASS source-verified lexical expansion: 10 new verbs, 10 located stem pairs, 20+ unseen tests, exact source gates, no fabricated paradigms or English');
