'use strict';
// Software regression: source-checked Classical lexical forms and grammatical
// ni-/ti- hypotheses are not independently attested finite translations.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const dictionary=JSON.parse(read('dictionary.json'));
const paradigms=JSON.parse(read('paradigms.json'));
const engineSource=read('tools/morphology_engine.js')
 .split('renderMorphologyBreakdown=TlahtolliMorphEngine.html;')[0];
assert(engineSource.includes('fromRegularIntransitivePresent'));
function load(words=dictionary.words){
 const ctx={window:{},words,FULL_VERB_PARADIGMS:paradigms.paradigms,
  VERB_TENSES:paradigms.patterns,
  norm:s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(),
  stripToken:s=>String(s||'').replace(/^[^\p{L}\p{M}]+|[^\p{L}\p{M}]+$/gu,''),
  historicalSpellings:w=>String(w.original||'').split(/[;,/]+/).map(x=>x.trim()).filter(Boolean),
  safe:String,validUrl:()=>true,safeLink:()=>''};
 vm.runInNewContext(engineSource+'\nthis.morph=TlahtolliMorphEngine;',ctx);
 return ctx;
}
const ctx=load(), morph=ctx.morph;
for(const [form,lemma,subject] of [
 ['niquiza','quiza','1sg'],['tiquiza','quiza','2sg'],
 ['nicochi','cochi','1sg'],['ticochi','cochi','2sg'],
 ['nipolihui','polihui','1sg']
]){
 const a=morph.analyze(form).filter(c=>c.kind==='Regular intransitive present hypothesis');
 assert.equal(a.length,1,form);
 assert.equal(a[0].lemma,lemma);
 assert.equal(a[0].grade,'hypothesis');
 assert.equal(a[0].features.subject,subject);
 assert.equal(a[0].features.tense,'Present');
 assert.equal(a[0].parts.map(x=>x.surface).join(''),form);
 assert.equal(a[0].parts[0].surface,subject==='1sg'?'ni':'ti');
 assert(a[0].source.startsWith('https://'));
 assert.match(a[0].note,/NOT independently attested/);
}
// Recorded text evidence wins; no redundant lower-grade guess for this token.
const documented=morph.analyze('tipolihui');
assert(documented.some(x=>x.lemma==='polihui'&&x.grade==='manuscript'));
assert(!documented.some(x=>x.kind==='Regular intransitive present hypothesis'));
// Do not infer forms of irregular, transitive, lexicalized or already-indexed
// verbs. No conjectured long-vowel spelling is silently promoted.
for(const token of ['niyauh','niquīza','nicuepa','nitlacuiloa',
 'nixxyyzz','niquiza extra','tiquiza-niquiza']){
 assert.equal(morph.analyze(token).filter(x=>x.kind==='Regular intransitive present hypothesis').length,
  0,'Unsafe productive form '+token);
}
assert(!morph.analyze('ninemi').some(x=>x.kind==='Regular intransitive present hypothesis'),
 'Existing 12 indexed paradigms retain priority; no duplicated conjugation');
// Deny grammar hypotheses if the independent source-located POS claim
// disappears: English-only lexical glosses are never enough to license rules.
const tainted=JSON.parse(JSON.stringify(dictionary.words));
const q=tainted.find(x=>x.word==='quiza');
q.claims=q.claims.filter(c=>c.field!=='pos');
assert.equal(load(tainted).morph.analyze('niquiza').length,0,
 'Missing verified-source grammatical category must fail closed');
// Existing sentence engine must not upgrade hypothetical morphology to a
// complete syntactic sentence or generate source-unsanctioned English.
vm.runInNewContext(read('translator-sentence.js'),ctx);
const s=ctx.window.TlahtolliSentence.create(dictionary,paradigms,
 token=>morph.analyze(token));
for(const token of ['niquiza','nicochi','nipolihui']){
 const analysis=s.analyze(token);
 assert.equal(analysis.complete,false,token);
 assert.equal(analysis.clauses[0].candidates.length,0);
 assert(analysis.clauses[0].morphologicalClues.some(x=>
  x.lemma===morph.analyze(token)[0].lemma&&x.grade==='hypothesis'));
}
console.log('PASS canonical Tēntli: five new regular singular present token hypotheses, source gates, exact spelling, no guessing or grammar promotion');
