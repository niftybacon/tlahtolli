'use strict';
// Cross-class evidence audit for exactly the 80 index-only entries that predated this batch.
// Historical dictionary examples are not independent manuscript attestations or training gold.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const D=JSON.parse(read('dictionary.json')),P=JSON.parse(read('paradigms.json'));
const L=JSON.parse(read('data/lexicon.json')),M=JSON.parse(read('data/morphology.json'));
const E=JSON.parse(read('data/evidence.json')),R=JSON.parse(read('release.json'));
assert.equal(D.version,R.version);assert.equal(R.version,D.version);
assert.equal(D.words.length,210);
assert.equal(D.words.filter(w=>w.status==='Checked against source').length,144);
assert.equal(D.words.filter(w=>w.status.startsWith('Index-sourced')).length,66);
assert.equal(D.words.reduce((n,w)=>n+w.inflections.length,0),270+2,
 'Batch04 baseline plus two separately Molina-recorded Class 2 forms; verify those forms in dedicated regression');
assert.equal(D.words.reduce((n,w)=>n+w.claims.length,0),1275);
assert.equal(Object.keys(P.paradigms).length,12);
assert.deepEqual(L.words.map(w=>w.word),M.entries.map(w=>w.word));
assert.deepEqual(L.words.map(w=>w.word),E.entries.map(w=>w.word));
const previouslyReviewed=new Set(['tepoztia','tepoztehuia']);
const previous80=D.words.slice(128).filter(w=>!previouslyReviewed.has(w.word));
assert.equal(previous80.length,80);
const ledger=read('docs/BATCH04_REMAINING_80_VERB_CLASS_AUDIT_2026_10_29.md');
const rows=[...ledger.matchAll(/^\| `([^`]+)` \|/gm)].map(m=>m[1]);
assert.equal(rows.length,80,'Every original index-only headword must appear once in the audit ledger');
assert.deepEqual(rows,previous80.map(w=>w.word));
const verified=[
 ['nonotzalitlani','verb (transitive)','onitenonotzalitlan','nonotzalitlani'],
 ['nonotzalitlania','verb (transitive)',null,'nonotzalitlania'],
 ['nopalaquia','verb (intransitive)','oninopalaqui','nopalaquia'],
 ['nopalteca','verb (intransitive)',null,'nopalteca'],
 ['tecpancapohua','verb (transitive)','onictepancapouh','tecpancapoa'],
 ['tecpancatenehua','verb (transitive)','onictecpancateneuh','tecpancateneua'],
 ['tecpantlalia','verb (transitive)',null,'tecpantlalia'],
 ['tecpichoa','verb (transitive)','onitlatecpicho','tecpichoa'],
 ['tecpilitoa','verb (transitive)','onitetecpilito','tecpilitoa'],
 ['tecpillahtoa','verb (intransitive)','onitecpillato','tecpillatoa'],
 ['tecpillahuana','verb (intransitive)','onitecpillauan','tecpillauana'],
 ['tepozpitza','verb (intransitive)','onitepuzpitz','tepuzpitza'],
 ['tepozquechilia','verb (transitive)',null,'tepozquechilia'],
 ['tlamatzoa','verb (intransitive)','onitlamatzo','tlamatzoa']
];
const deferred=['aztayoa','nonotza','nopaltzonpa','tecpayoa','tepozotinemi','tlamattinemi','tlamauhtia'];
assert.equal(verified.length,14);assert.equal(deferred.length,7);
const proven=new Set(verified.map(x=>x[0])),unresolved=new Set(deferred);
assert.equal(previous80.filter(w=>!proven.has(w.word)&&!unresolved.has(w.word)).length,59);
for(const [lemma,pos,past,sourceSpelling] of verified){
 const w=D.words.find(x=>x.word===lemma);
 assert.equal(w.status,'Checked against source',lemma);
 assert.equal(w.pos,pos,lemma+' source class');
 assert.equal(w.original,sourceSpelling===lemma?'':sourceSpelling,lemma+' original spelling');
 assert.equal(w.stem,'',lemma+' no stem guessing');
 assert(!P.paradigms[lemma],lemma+' cannot be falsely added as a complete paradigm');
 for(const field of ['headword','pos','meaning']){
  assert(w.claims.some(c=>c.field===field&&c.assessment==='dictionary'&&
   c.source===w.source&&c.locator&&/^https:\/\//.test(c.source)),lemma+' missing '+field+' locator');
 }
 assert(w.claims.some(c=>c.field==='stem'&&c.assessment==='unverified'&&!c.locator),
  lemma+' bound base cannot be claimed from a 1sg surface');
 assert.equal(w.inflections.length,past?1:0,lemma+' no fabricated additional inflections');
 if(past){
  const f=w.inflections[0];
  assert.equal(f.form,past);assert.equal(f.evidence,'dictionary');
  assert.equal(f.source,w.source);
  assert.equal(f.gloss,'','No invented English translation attached to a 1sg form');
 }
}
for(const name of deferred){
 const w=D.words.find(x=>x.word===name);
 assert(w.status.startsWith('Index-sourced'),name+' cannot be silently promoted');
 assert(w.claims.some(c=>c.field==='pos'&&c.assessment==='inference'));
 assert.equal(w.stem,'');
 const unclassifiedSource={aztayoa:'oaztayoac',tecpayoa:'otecpayoac',
  tepozotinemi:'tepoçotinemiz'};
 if(unclassifiedSource[name]){
  assert.equal(w.inflections.length,1,name+' must have precisely one source-reported token');
  assert.equal(w.inflections[0].form,unclassifiedSource[name]);
  assert.equal(w.inflections[0].gloss,'','Source form must not supply invented English');
  assert(w.claims.some(c=>c.field==='other'&&c.locator),'Explicit exact-form provenance missing');
 }else assert.equal(w.inflections.length,0);
}
const eng=read('tools/morphology_engine.js').split('renderMorphologyBreakdown=TlahtolliMorphEngine.html;')[0];
function load(words=D.words){
 const ctx={window:{},words,FULL_VERB_PARADIGMS:P.paradigms,VERB_TENSES:P.patterns,
  norm:s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(),
  stripToken:s=>String(s||'').replace(/^[^\p{L}\p{M}]+|[^\p{L}\p{M}]+$/gu,''),
  historicalSpellings:w=>String(w.original||'').split(/[;,/]+/).map(x=>x.trim()).filter(Boolean),
  safe:String,validUrl:()=>true,safeLink:()=>''};
 vm.runInNewContext(eng+'\nthis.morph=TlahtolliMorphEngine;',ctx);
 return ctx;
}
const ctx=load(),analyze=x=>ctx.morph.analyze(x);
const examples=[
 ['otitenonotzalitlan','nonotzalitlani','Source-template singular preterite hypothesis'],
 ['nitenonotzalitlani','nonotzalitlani','Source-template transitive present hypothesis'],
 ['otitetecpilito','tecpilitoa','Source-template singular preterite hypothesis'],
 ['nitetecpilitoa','tecpilitoa','Source-template transitive present hypothesis'],
 ['otitlatecpicho','tecpichoa','Source-template singular preterite hypothesis'],
 ['otictepancapouh','tecpancapohua','Source-template singular preterite hypothesis'],
 ['ninopalteca','nopalteca','Regular intransitive present hypothesis'],
 ['nitlamatzoa','tlamatzoa','Regular intransitive present hypothesis'],
 ['otitepuzpitz','tepozpitza','Source-template singular preterite hypothesis']
];
for(const [token,lemma,kind] of examples){
 const w=D.words.find(w=>w.word===lemma);
 assert(!w.inflections.some(f=>f.form===token),'Generated candidate cannot already be source-listed '+token);
 const hits=analyze(token).filter(x=>x.lemma===lemma&&x.kind===kind);
 assert.equal(hits.length,1,token+' must have a single licensed proposal');
 assert.equal(hits[0].grade,'hypothesis',token);
 assert.equal(hits[0].parts.filter(p=>p.surface!=='Ø').map(p=>p.surface).join(''),token);
 assert(/^https:\/\//.test(hits[0].source));
}
for(const [lemma,pos,past] of verified)if(past){
 const found=analyze(past);
 assert(found.some(x=>x.lemma===lemma&&x.grade==='lexical'),past+' recorded form priority');
 assert(!found.some(x=>x.lemma===lemma&&x.kind==='Source-template singular preterite hypothesis'),
  'Recorded 1sg form cannot be re-labelled hypothetical');
}
for(const candidate of ['nitenonotzalitlania','nitecpantlalia','nictepozquechilia',
 'nitlatecpancapohua','otitenonotzalitlani','ōtitenonotzalitlan',
 'otitlatepancapouh','nitenonotza','ninopaltzonpa']){
 assert(!analyze(candidate).some(x=>x.kind.includes('Source-template')&&x.grade==='hypothesis'),
  'No unsupported stem, vowel, missing preterite, or object substitution '+candidate);
}
{
 const ws=JSON.parse(JSON.stringify(D.words)),w=ws.find(x=>x.word==='tecpilitoa');
 w.inflections=[];assert(!load(ws).morph.analyze('nitetecpilitoa').some(x=>x.lemma==='tecpilitoa'&&x.grade==='hypothesis'));
}
{
 const ws=JSON.parse(JSON.stringify(D.words)),w=ws.find(x=>x.word==='tecpilitoa');
 w.inflections[0].category='Preterite 1sg';
 assert(!load(ws).morph.analyze('nitetecpilitoa').some(x=>x.lemma==='tecpilitoa'&&x.grade==='hypothesis'),
  'Unlabelled te- must not generate indefinite-human object forms');
}
{
 const ws=JSON.parse(JSON.stringify(D.words)),w=ws.find(x=>x.word==='tecpilitoa');
 w.claims=w.claims.filter(c=>c.field!=='pos');
 assert(!load(ws).morph.analyze('nitetecpilitoa').some(x=>x.lemma==='tecpilitoa'&&x.grade==='hypothesis'),
  'Absent lexical POS source must fail closed');
}
vm.runInNewContext(read('translator-sentence.js'),ctx);
const sentence=ctx.window.TlahtolliSentence.create(D,P,analyze);
for(const [token] of examples.slice(0,7)){
 const out=sentence.analyze(token);
 assert.equal(out.complete,false,'No complete English translation from merely generated morphology');
 assert.equal(out.clauses[0].candidates.length,0);
}

for(const [lemma,spelling,grade] of [
 ['aztayoa','oaztayoac','lexical'],['tecpayoa','otecpayoac','lexical'],
 ['tepozotinemi','tepoçotinemiz','unreviewed']
]){
 const w=D.words.find(x=>x.word===lemma),listed=analyze(spelling);
 assert.equal(w.status,'Index-sourced; further lexical review pending');
 assert(listed.some(x=>x.lemma===lemma&&x.grade===grade),
  'Only the exact written surface receives its distinct source grade: '+spelling);
 assert(!listed.some(x=>x.lemma===lemma&&x.grade==='hypothesis'),
  'No productive inferred 3sg/future tense allowed from unclassified source token');
}
for(const unlicensed of ['oaztayoaz','oniaztayoac','otitecpayoac','nitepoçotinemiz']){
 assert(!analyze(unlicensed).some(x=>['aztayoa','tecpayoa','tepozotinemi'].includes(x.lemma)&&x.grade==='hypothesis'),
  'Unverified class must not produce person or tense analogies: '+unlicensed);
}
console.log('PASS 80-entry verb-class audit: 14 verified classes, 10 exact preterites, 7 unresolved, 59 nonverb; no false paradigms');
