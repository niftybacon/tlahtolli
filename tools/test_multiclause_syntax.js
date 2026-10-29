// Classical Nahuatl multi-clause syntax: overt auh coordination and intla condition.
// This is a bounded structural analysis test, not historical translation accuracy.
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..');
const dictionary=JSON.parse(fs.readFileSync(path.join(root,'dictionary.json'),'utf8'));
const paradigms=JSON.parse(fs.readFileSync(path.join(root,'paradigms.json'),'utf8'));
const research=JSON.parse(fs.readFileSync(path.join(root,'research/translation_corpus/research_examples.json'),'utf8'));
const scope={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'translator-locative.js'),'utf8'),scope);
vm.runInNewContext(fs.readFileSync(path.join(root,'translator-sentence.js'),'utf8'),scope);
const locative=scope.window.TlahtolliLocative.create(dictionary,research);
const model=scope.window.TlahtolliSentence.create(dictionary,paradigms,()=>[],research,locative);
const analyze=s=>model.analyze(s);
function linked(input,kind,count){
 const result=analyze(input);
 assert.equal(result.complete,false,'Multi-clause relations are not verified translations: '+input);
 assert.equal(result.clauses.length,count,'Expected each marked unit to stay separate: '+input);
 assert.equal(result.multiClauseProposals.length,1,'Expected one overt-link analysis: '+input);
 const link=result.multiClauseProposals[0];
 assert.equal(link.relation,kind);
 assert.equal(link.clauseCount,count);
 assert.equal(link.markers.length,kind==='conditional antecedent and consequent'?1:count-1);
 assert.equal(link.segments.length,count);
 assert(link.sources.every(s=>s.startsWith('https://')));
 assert(link.grade.includes('NOT an independently verified translation'));
 assert(link.segments.every(s=>s.alternativeCount>0));
 assert(!('english' in link));
 return {result,link};
}
const coordinated=linked('ninemi auh nichōca','explicit discourse / clause coordination',2).link;
assert.deepEqual(Array.from(coordinated.markers),['auh']);
assert(coordinated.sources.includes('https://nahuatl.wired-humanities.org/node/171956'));
assert(coordinated.note.includes('and/but/well'));
assert.deepEqual(Array.from(coordinated.segments,s=>s.subjectPersons[0]),['1sg','1sg']);
assert.equal(coordinated.segments[0].finiteAnalysisKind,'indexed complete clause grammar');
assert.equal(coordinated.segments[1].finiteAnalysisKind,'indexed complete clause grammar');
assert.equal(linked('ninemi, auh nichōca','explicit discourse / clause coordination',2)
 .link.segments[0].text,'ninemi');
const three=linked('ninemi auh nichōca auh niquitta in cihuātl',
 'explicit discourse / clause coordination',3).link;
assert.deepEqual(Array.from(three.markers),['auh','auh']);
assert.equal(three.coverage,7);
assert.equal(linked('ahmo ninemi auh niquittaz in cihuātl',
 'explicit discourse / clause coordination',2).link.segments[0].text,'ahmo ninemi');
const conditional=linked('intla ninemi, nichōca','conditional antecedent and consequent',2).link;
assert.equal(conditional.markers[0],'intla');
assert(conditional.sources.includes('https://nahuatl.wired-humanities.org/content/intla'));
assert(conditional.sources.some(url=>url.includes('/conditions-more-particles/')));
assert.equal(conditional.segments[0].role,'conditional antecedent (mood/force NOT independently verified)');
assert.equal(conditional.segments[1].role,'proposed consequent (consequence type NOT independently verified)');
assert.match(conditional.note,/verb mood/);
const conditionalSemicolon=linked('intla ninemi; nichōca',
 'conditional antecedent and consequent',2).link;
assert.equal(conditionalSemicolon.coverage,3);
const complex=linked('ninemi calli itic auh nichōca calli itic',
 'explicit discourse / clause coordination',2);
assert(complex.link.segments.every(s=>
 s.finiteAnalysisKind==='finite+locative structural proposals only'));
assert.deepEqual(Array.from(complex.link.segments,s=>s.locationExpressions[0]),
 ['calli itic','calli itic']);
assert.equal(complex.result.contextLinks.length,1,
 'Existing repeated-location detector must continue working with parsed clauses');
assert.equal(complex.result.contextLinks[0].locationWritten,'calli itic');
const differentLocations=linked('ninemi calli itic auh nichōca ātl itic',
 'explicit discourse / clause coordination',2);
assert.equal(differentLocations.result.contextLinks.length,0);
linked('intla ninemi calli itic, nichōca calli itic',
 'conditional antecedent and consequent',2);
const complexConsequence=linked('intla ninemi, niquittaz in cihuātl calli itic',
 'conditional antecedent and consequent',2).link;
assert.equal(complexConsequence.segments[1].finiteAnalysisKind,
 'finite+locative structural proposals only');
const alt=linked('quitta in cihuātl calli itic auh nichōca',
 'explicit discourse / clause coordination',2).link;
assert.equal(alt.segments[0].alternativeCount,2,
 'Third-person grammatical subject/object options must not collapse');
assert(alt.segments[0].subjectPersons.includes('3sg'));
for(const [lemma,entry] of Object.entries(paradigms.paradigms)){
 for(const row of [0,3]){
  const input=entry.cells[row][0]+' auh '+entry.cells[row][1];
  const link=linked(input,'explicit discourse / clause coordination',2).link;
  assert.equal(link.segments[0].subjectPersons[0],'1sg');
  assert.equal(link.segments[1].subjectPersons[0],'2sg');
 }
}
for(const input of [
 'auh ninemi','ninemi auh','ninemi auh fake','fake auh ninemi',
 'ninemi ihuan nichōca','ninemi yhuan nichōca','ninemi ahu nichōca',
 'ninemi āuh nichōca', // overlong-vowel sense must not be folded
 'ninemi nichōca', // juxtaposition can be coordination historically, but scope unknown
 'ninemi auh onicoch', // source-listed isolated gloss != independently parsed finite clause
 'ninemi auh ticnamaca y¯ totlal', // only partial morphology
 'ninemi auh calli itic', // locative fragment != finite clause
 'ninemi auh nichōca auh niquitta in cihuātl auh ninemi', // too many linked clauses
 'ninemi, auh nichōca,',
 'ninemi; auh nichōca', // unsupported punctuation scope
 'intla ninemi nichōca', // requires a visible subordinate boundary
 'intla ninemi, unknown',
 'intla ninemi,', 'intla , nichōca',
 'intla ninemi, nichōca, niquitta in cihuātl',
 'intla ahmo ninemi, nichōca', // historical negative form is intlācamo
 'intla ninemi, auh nichōca', // nested marker structure not implemented
 'intla ninemi, nichōca auh ninemi',
 'intla ninemi, in cihuātl', // noun phrase isn't a finite consequent
 'intla ninemi, atl yitic nemjnj', // last source is nonfinite, unresolved
 'intla niquitta in cihuātl, ninemi?',
 'ninemi. auh nichōca', // sentence punctuation is not a single linked construct
 'ninemi auh niquitta cihuātl', // unmarked object
 'ninemi auh ninemi calli itic extra'
]){
 const result=analyze(input);
 assert.equal(result.multiClauseProposals?.length||0,0,
  'Must not manufacture coordination/condition from incomplete or invalid grammar: '+input);
}
const basic=analyze('niquitta in cihuātl');
assert.equal(basic.complete,true);
assert.equal(basic.clauses[0].candidates[0].english[0],'I see the woman');
assert.equal(basic.multiClauseProposals,undefined);
const loc=analyze('ninemi calli itic');
assert.equal(loc.complete,false);
assert.equal(loc.clauses[0].complexClauseProposals.length,1);
assert.equal(loc.multiClauseProposals,undefined);
const preserved=analyze('ninemi calli itic. nichōca calli itic.');
assert.equal(preserved.contextLinks.length,1);
assert.equal(preserved.multiClauseProposals,undefined);
console.log('PASS: overt auh (including 12 verbs × present/future), segmented intla, finite+locative linking, 3sg role ambiguity, conservative refusal and no automatic English translation.');
