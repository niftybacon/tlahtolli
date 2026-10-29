'use strict';
// Source-located possessed noun + finite agreement: structural SOFTWARE test,
// not a translation benchmark or a license to synthesize unattested forms.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),scope={window:{}};
for(const file of ['translator-locative.js','translator-sentence.js'])
 vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8'),scope);
const d=JSON.parse(fs.readFileSync(path.join(root,'dictionary.json')));
const p=JSON.parse(fs.readFileSync(path.join(root,'paradigms.json')));
const rules=JSON.parse(fs.readFileSync(path.join(root,'data/clause_grammar.json')));
const research=JSON.parse(fs.readFileSync(path.join(root,'research/translation_corpus/research_examples.json')));
const loc=scope.window.TlahtolliLocative.create(d,research);
function fromRecorded(token){
 const matches=[];
 for(const w of d.words.filter(w=>String(w.pos).includes('noun'))){
  const recorded=String(w.possessed||'').split('(')[0].trim();
  if(recorded.normalize('NFC').toLowerCase()!==String(token).normalize('NFC').toLowerCase()||
     !recorded.startsWith('no'))continue;
  const c=(w.claims||[]).find(c=>c.field==='possessed');
  if(!c)continue;
  matches.push({lemma:w.word,kind:'Editorially listed possessed form',grade:'lexical',
   features:{partOfSpeech:'noun',evidence:c.assessment},locator:c.locator,source:c.source,
   parts:[{surface:recorded.slice(0,2),role:'Likely 1sg possessive prefix'},
    {surface:recorded.slice(2),role:'Remaining possessed-noun base; morphophonology context-dependent'}]});
 }
 return matches;
}
const make=(morph=fromRecorded,dict=d,pack=rules)=>
 scope.window.TlahtolliSentence.create(dict,p,morph,research,loc,pack);
const model=make(),probe=s=>model.analyze(s);
const cases=['nocal','nocuīc','noxōchiuh','notlaxcal','noteuh','noconeuh','nomā','nomil','noztauh','noquetzale'];
let passed=0;
for(const form of cases){
 const w=d.words.find(w=>String(w.possessed||'').split('(')[0].trim()===form);
 if(!w)continue;
 for(const sample of ['niquitta '+form,form+' niquitta',
  'niquitta in '+form,'in '+form+' niquitta']){
  const c=probe(sample).clauses[0];
  assert.equal(c.complete,false,'Source noun does not license a new complete English sentence: '+sample);
  const props=c.possessedAgreement.items;
  assert(props.length>0,'Missing general PNP interpretation: '+sample);
  assert(props.some(x=>x.possessedNoun.lemma===w.word&&
   x.possessedNoun.possessor==='1sg'&&x.possessedNoun.role==='possible grammatical object'));
  assert(props.every(x=>x.verb.subject==='1sg'&&x.verb.objectAgreement==='indexed fixed 3sg'));
  assert(props.every(x=>x.sourceLinks.some(u=>u===w.claims.find(c=>c.field==='possessed').source)));
  passed++;
 }
}
const subject=probe('nocal chōca').clauses[0].possessedAgreement.items;
assert(subject.some(x=>x.verb.subject==='3sg'&&
 x.possessedNoun.role==='possible grammatical subject'));
assert.equal(probe('nichōca nocal').clauses[0].possessedAgreement.items.length,0,
 'Intransitive non-third-person finite form does not license overt third-person NP subject');
const ambiguous=probe('quitta nocal').clauses[0].possessedAgreement.items;
assert(ambiguous.some(x=>x.possessedNoun.role==='possible grammatical object'));
assert(ambiguous.some(x=>x.possessedNoun.role==='possible grammatical subject'));
const second=probe('tiquitta nocal').clauses[0].possessedAgreement.items;
assert(second.some(x=>x.verb.subject==='2sg'&&x.possessedNoun.possessor==='1sg'),
 'Possessor person cannot be forced to equal the finite verbal subject');
const first=probe('niquitta nocal').clauses[0].possessedAgreement.items;
assert(first.every(x=>x.possessedNoun.possessor==='1sg'), 'Keep noun possessor independent');
assert(probe('ninemi auh nichōca').multiClauseProposals?.length===1,
 'Preserve main multi-clause work');
assert(probe('ninemi calli itic').clauses[0].complexClauseProposals?.length===1,
 'Preserve main finite+locative work');
assert.equal(probe('niquitta in cihuātl').clauses[0].candidates[0].english[0],'I see the woman');
for(const bad of ['niquitta mocal','niquitta totlal','niquitta nocal unknown','niquitta nocal in cihuātl',
 'ahmo niquitta nocal','nichōca nocal','niquitta nocal,','niquitta nocal?','nocal','niquitta nofake',
 'niquitta noxōchiuh nocal']){
 const p=probe(bad);
 assert.equal(p.clauses[0]?.possessedAgreement?.items?.length||0,0,
  'No generated analogies, invented agreement, extra words or punctuation: '+bad);
}
for(const mut of [
 m=>{m.grade='analogy'},m=>{m.grade='unreviewed'},
 m=>{m.kind='Productive possessed form'},m=>{m.lemma='conetl'},
 m=>{m.source='https://example.org/not-the-claim'},
 m=>{m.locator='wrong locator'},m=>{m.features.evidence='unverified'},
 m=>{m.features.partOfSpeech='verb'},m=>{m.parts[0].role='unknown person'},
 m=>{m.parts[0].surface='na'}
]){
 const corrupted=token=>fromRecorded(token).map(x=>{mut(x);return x;});
 assert.equal(make(corrupted).analyze('niquitta nocal').clauses[0].possessedAgreement.items.length,0,
 'Reject forged or mismatched lexical morphology: '+mut.toString());
}
const duplicated=JSON.parse(JSON.stringify(d));
duplicated.words.push({...duplicated.words.find(w=>w.word==='calli')});
assert.equal(make(fromRecorded,duplicated).analyze('niquitta nocal').clauses[0].possessedAgreement.items.length,0,
 'Conflicting/multiple lexeme records cannot license a unique PNP');
const fewer=JSON.parse(JSON.stringify(rules));fewer.rules=fewer.rules.filter(r=>!r.id.startsWith('possessed-'));
assert.equal(make(fromRecorded,d,fewer).analyze('niquitta nocal').clauses[0].possessedAgreement.items.length,0);
assert.equal(make(()=>[]).analyze('niquitta nocal').clauses[0].possessedAgreement.items.length,0);
console.log('PASS source-located PNP grammar: '+passed+
 ' exact possessed forms and positions, independent possessor/verb subject, reversibility, invalid-source refusals and concurrent main features.');
