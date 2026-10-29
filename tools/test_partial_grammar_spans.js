'use strict';
// Partial grammar recovery must reuse existing analyzers without making claims
// about whole-passage syntax, historical attestation or English translation.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const json=p=>JSON.parse(read(p));
const dictionary=json('dictionary.json'),paradigms=json('paradigms.json');
const examples=json('research/translation_corpus/research_examples.json');
const passages=json('data/passages.json'),finite=json('data/source_finite_context.json');
const ctx={window:{},URL,words:dictionary.words,FULL_VERB_PARADIGMS:paradigms.paradigms,
 VERB_TENSES:paradigms.patterns,
 norm:s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(),
 stripToken:s=>String(s).replace(/^[^\p{L}\p{M}]+|[^\p{L}\p{M}]+$/gu,'').toLowerCase(),
 historicalSpellings:w=>String(w.original||'').split(/[;,/]+/).map(s=>s.trim()).filter(Boolean),
 safe:x=>String(x),validUrl:x=>x,safeLink:(a,b)=>b};
vm.runInNewContext(read('tools/morphology_engine.js').split(
 'renderMorphologyBreakdown=TlahtolliMorphEngine.html;')[0]+
 '\nthis.canonicalMorph=TlahtolliMorphEngine;',ctx);
for(const path of ['translator-locative.js','translator-sentence.js',
 'translator-english.js','translator-grammar-ir.js'])
 vm.runInNewContext(read(path),ctx);
const loc=ctx.window.TlahtolliLocative.create(dictionary,examples);
const grammar=json('data/clause_grammar.json'),poss=json('data/possessed_form_evidence.json');
const sentence=ctx.window.TlahtolliSentence.create(dictionary,paradigms,
 t=>ctx.canonicalMorph.analyze(t),examples,loc,grammar,poss,finite,passages);
const english=ctx.window.TlahtolliEnglish.create(sentence);
const graph=ctx.window.TlahtolliGrammarIR.create(dictionary,passages);
const recover=input=>{
 const result=sentence.analyze(input),cl=result.clauses?.[0];
 assert(cl,input);
 assert.equal(result.complete,false,'Full sentence still not supported');
 assert.equal(english.compose(input,result).available,false,
  'Partial window must never license English of the whole input');
 return {result,cl,spans:cl.partialSpans||[],ir:graph.build(input,result)};
};
const fc='injn itoca itech qujça xochitl, ioan tlapalli';
const {cl,spans,ir}=recover(fc);
assert.equal(cl.tokens.length,7);
const witnessed=spans.find(s=>s.start===2&&s.end===5);
assert(witnessed,'Already-supported three-token historical window must be recovered');
assert.equal(witnessed.analyzedSpelling,'itech qujça xochitl');
assert.equal(witnessed.written[2],'xochitl,','Preserve original punctuation');
assert(witnessed.families.includes('source-finite'));
assert(witnessed.sources.some(url=>url.includes('/book/11/folio/217r')));
assert(spans.every(s=>s.englishAvailableForWholeInput===false&&
 s.referentResolved===false&&s.status.includes('NOT a whole-clause')));
assert.equal(ir.counts.partialSpans,spans.length);
const graphNode=ir.nodes.find(n=>n.kind==='partial-grammatical-span'&&
 n.tokenStart===2&&n.tokenEnd===5);
assert(graphNode);
assert(ir.edges.some(e=>e.to===graphNode.id&&
 e.relation==='contains-partial-grammatical-evidence'&&
 e.boundaryAttachmentsResolved===false));
assert(!ir.alternatives.length,
 'Window nodes must not masquerade as full-clause IR alternatives');
const known='niquitta in cihuātl extra';
const indexed=recover(known);
const recognized=indexed.spans.find(s=>s.start===0&&s.end===3);
assert(recognized&&recognized.families.includes('indexed-finite'),
 'Use the existing finite grammar, not a special FC rule');
assert.equal(indexed.ir.counts.partialSpans,indexed.spans.length);
const compare=recover('iuhqujn chimalli desconocido más');
assert(compare.spans.some(s=>s.start===0&&s.end===2&&s.families.includes('comparison')));
const located=recover('atl yitic nemjnj extra');
assert(located.spans.some(s=>s.start===0&&s.end===3&&s.families.includes('locative')));
const negative=recover('ahmo niquittaz in cihuātl extra');
assert(negative.spans.some(s=>s.start===0&&s.end===4&&
 s.families.includes('indexed-finite')));
const source=recover('qujça in xochitl extra');
assert(source.spans.some(s=>s.start===0&&s.end===3&&s.families.includes('source-finite')));
for(const unsupported of [
 'injn itoca itech qujça cihuātl, ioan tlapalli',
 'zzz aaa bbb ccc',
 'zzzz zzzz zzzz zzzz',
 'in (a) qujça xochitl extra'
]){
 const cl=recover(unsupported).cl;
 assert(!cl.partialSpans?.some(s=>s.analyzedSpelling==='itech qujça xochitl'),
  'Unverified replacements must not be silently repaired');
}
// Only bounded windows are probed. Long input cannot cause a grammar explosion.
const tooLong=recover(Array(19).fill('unknown').join(' '));
assert.equal(tooLong.spans.length,0);
for(const text of ['niquittaz in cihuātl','iuhqujn chimalli','qujça in xochitl']){
 assert.equal(sentence.analyze(text).clauses[0].partialSpans?.length||0,0,
  'Already-full construction must not be redundantly rediscovered: '+text);
}
assert.equal(sentence.analyze('niquittaz in cihuātl').complete,true);
const supported=english.compose('niquittaz in cihuātl',
 sentence.analyze('niquittaz in cihuātl'));
assert.equal(english.render(supported),'I will see the woman.');
// A forged reported offset or source must not enter the shared graph.
const mutations=[
 p=>{p.start=1;},p=>{p.end=7;},
 p=>{p.written=['wrong',...p.written.slice(1)];},
 p=>{p.sources=['javascript:alert(1)'];},
 p=>{p.families=['invented-parser'];},
 p=>{p.status='verified English';},
 p=>{p.englishAvailableForWholeInput=true;},
 p=>{p.referentResolved=true;}
];
for(const mutate of mutations){
 const broken=JSON.parse(JSON.stringify(sentence.analyze(fc)));
 broken.clauses[0].partialSpans=[JSON.parse(JSON.stringify(witnessed))];
 mutate(broken.clauses[0].partialSpans[0]);
 assert.equal(graph.build(fc,broken).counts.partialSpans,0,
  'Graph must refuse forged partial-window evidence');
}
console.log('PASS bounded grammar windows: FC source span + indexed/comparison/locative/negative/source finite generalization, original word offsets, unsupported replacement refusals, no full English, graph provenance guards.');
