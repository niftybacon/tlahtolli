'use strict';
// Coordinated NP + finite intransitive subject, only under separately cited
// Classical agreement and unique curated noun-animacy metadata. NOT translation.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=n=>fs.readFileSync(path.join(root,n),'utf8');
const data=n=>JSON.parse(read(n));
const d=data('dictionary.json'),paradigms=data('paradigms.json'),
 passages=data('data/passages.json');
const context={window:{},URL};
for(const f of ['translator-sentence.js','translator-grammar-ir.js','translator-english.js'])
 vm.runInNewContext(read(f),context,{filename:f});
const make=(dict=d,patterns=paradigms,corpus=passages)=>
 context.window.TlahtolliSentence.create(dict,patterns,()=>[],{entries:[]},
 null,data('data/clause_grammar.json'),data('data/possessed_form_evidence.json'),
 data('data/source_finite_context.json'),corpus);
const sentence=make();
const graph=context.window.TlahtolliGrammarIR.create(d,passages,paradigms);
const english=context.window.TlahtolliEnglish.create(sentence);
const agreement='https://gdn.iib.unam.mx/diccionario/ihuan/50956';
function check(input,animacy,person,order){
 const result=sentence.analyze(input),cl=result.clauses[0];
 assert.equal(result.complete,false,'No English sentence from coordinated argument');
 assert.equal(cl.candidates.length,0);
 assert.equal(cl.coordinatedSubjectProposals.length,1,input);
 const p=cl.coordinatedSubjectProposals[0];
 assert.equal(p.coverage,cl.tokens.length);
 assert.equal(p.nominal.coverage,cl.tokens.length-1);
 assert.equal(p.nominalAnimacy,animacy);
 assert.equal(p.subjectAgreement,person);
 assert.equal(p.nominalStart,order==='post'?1:0);
 assert.equal(p.predicate.tokenIndex,order==='post'?0:cl.tokens.length-1);
 assert.equal(p.predicate.transitive,false);
 assert.equal(p.numberAgreementSource,agreement);
 assert(p.sources.includes(agreement));
 assert(p.nominal.connector.selectedMeaning===null);
 assert(p.note.includes('NOT an independently attested'));
 assert.equal(english.compose(input,result).available,false);
 const ir=graph.build(input,result);
 assert.equal(ir.counts.coordinatedSubjectAttachments,1,
  'Shared IR must independently validate indexed form and source-gated NP');
 assert.equal(ir.edges.filter(e=>e.relation==='possible-coordinated-subject-attachment').length,1);
 assert.equal(ir.nodes.filter(n=>n.kind==='finite-predicate').length,1);
 assert.equal(ir.nodes.filter(n=>n.kind==='coordinated-noun-head').length,2);
 assert(ir.nodes.filter(n=>n.kind==='coordinated-noun-head').every(n=>
  n.grammaticalRole===null&&n.number===null&&n.referentId===null));
 assert(!ir.nodes.some(n=>n.referentId));
 return result;
}
// Animate singulars: singular or plural indexed third-person predicate is licensed.
const base=check('chōca in cihuātl īhuān in conetl','animate','3sg','post');
check('chōcah in cihuātl īhuān in conetl','animate','3pl','post');
check('in cihuātl īhuān in conetl chōcah','animate','3pl','pre');
check('cihuātl yhuan conetl chōca','animate','3sg','pre');
// Inanimates: singular agreement only (semantic plausibility remains unverified).
check('tlami in xōchitl īhuān in tetl','inanimate','3sg','post');
// Exact manuscript spelling ioan is never a global spelling rule, even next to a verb.
check('tlami xochitl, ioan tlapalli','inanimate','3sg','post');
for(const input of [
 'tlamih xochitl, ioan tlapalli',  // plural inanimates
 'chōcah xōchitl īhuān tetl',  // plural inanimates
 'chōcah in cihuātl īhuān in xōchitl', // mixed classes, no licensed rule
 'nichōca in cihuātl īhuān in conetl', // 1sg subject conflicts
 'niquitta in cihuātl īhuān in conetl', // 3sg indexed object cannot license both
 'chōcah cihuātl ioan conetl', // ioan unattested with substituted words
 'chōcah in cihuātl īhuān in unknown',
 'chōcah cihuātl ihuan conetl extra',
 'ahmo chōcah in cihuātl īhuān in conetl',
 'chōcah in cihuātl auh in conetl',
 'chōcah in cihuātl īhuān in conetl ihuan xōchitl',
 'chōcah in cihuātl īhuān in conetl?'
]){
 const c=sentence.analyze(input).clauses[0];
 assert.equal(c.coordinatedSubjectProposals?.length||0,0,'Should refuse '+input);
 assert(!english.compose(input,sentence.analyze(input)).available,
  'No English for unsupported coordinating phrase: '+input);
}
// Altering source/animacy can NEVER quietly widen licensed verb-role coverage.
for(const lemma of ['cihuātl','conetl','īhuān','in','chōca']){
 const alt={...d,words:d.words.filter(x=>x.word!==lemma)};
 const q=make(alt).analyze('chōcah in cihuātl īhuān in conetl');
 assert.equal(q.clauses[0].coordinatedSubjectProposals.length,0,'Missing lexical '+lemma);
}
const undecided={...d,words:d.words.map(w=>w.word==='conetl'?{...w,animacy:'unresolved'}:w)};
assert.equal(make(undecided).analyze('chōcah in cihuātl īhuān in conetl')
 .clauses[0].coordinatedSubjectProposals.length,0);
const forged=JSON.parse(JSON.stringify(base));
for(const mutator of [
 p=>p.numberAgreementSource='https://example.org/forged',
 p=>p.predicate.subjectPerson='3pl',
 p=>p.predicate.written='chōcah',
 p=>p.predicate.source='https://example.org/forged',
 p=>p.nominalAnimacy='inanimate',
 p=>p.nominal.nouns[0].headword='xōchitl',
 p=>p.nominal.nouns[1].headSource='https://example.org/forged',
 p=>p.nominal.connector.selectedMeaning='and',
 p=>p.nominal.connector.tokenIndex=1,
 p=>p.nominalStart=0,
 p=>p.sources=['https://example.org/forged'],
 p=>p.written[0]='chōcah'
]){
 const altered=JSON.parse(JSON.stringify(forged));
 mutator(altered.clauses[0].coordinatedSubjectProposals[0]);
 assert.equal(graph.build('chōca in cihuātl īhuān in conetl',altered)
 .counts.coordinatedSubjectAttachments,0,'Forged grammatical claim accepted');
}
// Independent graph must see the actual indexed paradigm: poisoned matrix rejected.
const invalid=JSON.parse(JSON.stringify(paradigms));
invalid.paradigms['chōca'].cells[0][2]='counterfeit';
assert.equal(context.window.TlahtolliGrammarIR.create(d,passages,invalid)
 .build('chōca in cihuātl īhuān in conetl',base)
 .counts.coordinatedSubjectAttachments,0);
const historical='injn itoca itech qujça xochitl, ioan tlapalli';
const longer=sentence.analyze(historical);
assert.equal(longer.complete,false);
assert.equal(longer.clauses[0].coordinatedSubjectProposals.length,0);
assert(longer.clauses[0].partialSpans.some(p=>p.families.includes('source-finite')));
assert(longer.clauses[0].partialSpans.some(p=>p.families.includes('nominal-coordination')));
assert.equal(english.compose(historical,longer).available,false);
console.log('PASS coordinated subject: 6 sourced-pattern positive controls, 12 unsupported controls, missing lexicon/animacy/forged IR refusals, unchanged Florentine abstention, no English or gold claims.');
