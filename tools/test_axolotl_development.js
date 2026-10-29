'use strict';
// Software fixtures test accounting/selection; they are NOT historical pairs.
const assert=require('node:assert/strict');
const {selectRows,loadExistingEngines,diagnose,runCsv}=
 require('./diagnose_axolotl_development.js');
(async()=>{
const original='Classical Nahuatl',iso='nci';
const rows=[
 ['La mujer llora','chōca in cihuātl',original,'Work A',iso],
 ['Los niños viven','nemi in conetl',original,'Work B',iso],
 ['Otra descripción aquí','zzzz yyy xxxx',original,'Work C',iso],
 ['LA MUJER LLORA!','Chōca, in cihuātl!',original,'Work C',iso],
 ['Un dicho moderno','Modern dialect string', 'Modern Nahuatl','Work Modern','azz'],
 ['Muy largo','x '.repeat(19).trim(),original,'Work A',iso],
 ['Solo','zz',original,'Work A',iso],
 ['Lema uno dos','zzzz yyy xxxx',original,'Work D',iso]
];
const a=selectRows(rows,10),b=selectRows(rows,10);
assert.deepEqual(a,b,'Sample selection must be reproducible');
assert.equal(a.inventory.classicalLabeled,7);
assert.equal(a.inventory.discardedIdenticalPairs,2);
assert.equal(a.inventory.discardedLength,2);
assert.equal(a.selected.length,3);
assert.equal(new Set(a.selected.map(x=>x.work)).size,3);
assert(a.selected.every(x=>x.sourceRow!==5),'Modern variation must be excluded');
assert.throws(()=>selectRows(rows,201),/limit/);
await assert.rejects(runCsv(Buffer.from('fake'),2,{
 lex:{},sentence:{},morph:()=>[]
}),/Pinned Axolotl blob SHA mismatch/);

const engines=await loadExistingEngines();
assert.equal(engines.archive.ready,true,'Already-shipped 36K archive is reused');
assert(engines.archive.lookupEvidence('on').total>0,
 'Classical lexical evidence must be accessible from the existing archive');
assert.equal(engines.lex.stats.passageCandidates,0,
 'No saved sentence translations may be imported into the lexical lookup');
assert.equal(engines.sentence.analyze('chōca in cihuātl').complete,true,
 'Existing sentence grammar still works; no new constructed parser');
const sample=[
 {sourceRow:1,work:'Software fixture A',nahuatl:'chōca in cihuātl',spanish:'La mujer llora'},
 {sourceRow:2,work:'Software fixture B',nahuatl:'zzzz yyy xxxx',spanish:'Sin análisis válido'}
];
const r=diagnose(sample,engines);
assert.equal(r.format,'tlahtolli-parallel-development-diagnostic-v1');
assert.equal(r.classification.includes('IN-SAMPLE DEVELOPMENT ONLY'),true);
assert.equal(r.counts.selected,2);
assert(r.counts.curatedMatches>=1);
assert(r.counts.unknownTokens>=3);
assert.equal(r.counts.fullSentenceGrammarCandidates,1);
assert.equal(r.counts.unresolvedSentenceRows,1);
assert.equal(r.accuracy,null);
assert.equal(r.approvedHeldoutPairs,0);
assert.equal(r.byWork.length,2);
assert.equal(r.highFrequencyUnknownForms.length>=3,true);
const serialized=JSON.stringify(r);
assert(!serialized.includes('La mujer llora'));
assert(!serialized.includes('Sin análisis válido'));
assert(!serialized.includes('chōca in cihuātl'));
assert(serialized.includes('Software fixture A'));
assert.equal(r.inspectedRowReferences.length,2);
assert(r.inspectedRowReferences.every(x=>typeof x.grammarCandidate==='boolean'));
assert(r.inspectedRowReferences.every(x=>!('spanish' in x)&&!('nahuatl' in x)));
assert(!('translationScore' in r));
console.log('PASS Axolotl real-development diagnostics: deterministic unique source-work sample, Classical-only gate, pinned blob refusal, existing engines, missing-lexicon/grammar distinctions and no Spanish/gold leakage.');
})().catch(e=>{console.error(e);process.exitCode=1;});

