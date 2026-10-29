// Regression tests for the optional, unreviewed archive evidence layer.
// Does not depend on network access or a browser DOM.
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const script=fs.readFileSync(path.join(__dirname,'..','amoxcalli-archive.js'),'utf8');
const manifest={
 format:'tlahtolli-amoxcalli-archive-manifest-v1',
 source_rows:{simeon:2,kaikki:6,total:8},
 simeon:{files:['s.json'],source_url:'https://example.org/simeon'},
 kaikki:{files:['k.json'],source_url:'https://example.org/kaikki'}
};
const docs={
 'manifest.json':manifest,
 's.json':{format:'tlahtolli-amoxcalli-simeon-v1',rows:[
  ['tēztli','miroir','noun',[]],
  ['catl','exemple','noun',[]]
 ]},
 'k.json':{format:'tlahtolli-amoxcalli-kaikki-v1',rows:[
  ['cātl','noun','nci',[[['another sense'],[],['figurative']]],[],'','Classical Nahuatl'],
  ['tēztli','noun','nci',[[['mirror'],[],['figurative']]],[],'','Classical Nahuatl'],
  ['mila','noun','nhe',[[['field'],[],[]]],[],'','Eastern Huasteca Nahuatl'],
  ['alo','noun','nci',[[['scarlet macaw'],[],['animate']]],[['alomeh',['plural']]],'','Classical Nahuatl'],
  ['on','pron','nci',[[['that'],[],[]]],[['on',['canonical']],['ōn',['canonical']]],'','Classical Nahuatl'],
  ['in','particle','nci',[[['determiner fixture'],[],[]]],[],'','Classical Nahuatl']
 ]}
};
const context={
 window:{},
 document:{readyState:'loading',addEventListener(){}},
 fetch:async url=>{
  const name=String(url).split('/').pop();
  return {ok:Object.hasOwn(docs,name),status:Object.hasOwn(docs,name)?200:404,
   json:async()=>docs[name]};
 }
};
vm.runInNewContext(script,context,{filename:'amoxcalli-archive.js'});
(async()=>{
 const api=context.window.TlahtolliArchive;
 const loaded=await api.ensureLoaded();
 assert.equal(loaded.total,8);
 const exactAndAlternate=api.lookupEvidence('catl');
 assert.equal(exactAndAlternate.total,2);
 assert.equal(exactAndAlternate.hits[0].matchKind,'exact');
 assert.equal(exactAndAlternate.hits[1].matchKind,'diacritic-variant');
 const unmarked=api.lookupEvidence('teztli');
 assert.equal(unmarked.total,2);
 assert(unmarked.hits.every(hit=>hit.matchKind==='diacritic-variant'));
 assert(unmarked.hits.some(hit=>hit.senses?.[0]?.[2]?.includes('figurative')));
 assert.equal(api.lookup('catl').length,1,'legacy lookup must remain exact');
 assert.equal(api.lookupEvidence('mila').total,0,'modern variety must not leak into Classical lookup');
 assert.equal(api.lookupEvidence('mila',{classicalOnly:false}).total,1);
 // Existing historical variants only; the archive must NOT invent its own.
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..',
  'translator-historical-morphology.js'),'utf8'),context);
 const variants=context.window.TlahtolliHistoricalMorphology.variants;
 const historical=api.lookupHistoricalEvidence('yn',variants('yn','codex'));
 assert(historical.total>=1,'Tentative y→i must cross-reference exact Classical form');
 assert(historical.hits.some(h=>h.word==='in'&&h.matchedWritten==='in'&&
  h.originalWritten==='yn'&&
  h.matchKind==='tentative-historical-spelling'&&
  h.evidenceGrade==='unverified-orthographic-candidate'&&
  h.transformation.includes('tentative')));
 assert.equal(api.lookupEvidence('yn').total,0,
  'Tentative source candidate must not become a direct lexical lookup');
 assert.equal(api.lookupHistoricalEvidence('in',variants('in','codex')).total,0,
  'Do not invent variants when the written Classical form is already indexed');
 assert.equal(api.lookupHistoricalEvidence('yn',[{form:'in',changed:false,
  rule:'Initial y → i (tentative)'}]).total,0);
 assert.equal(api.lookupHistoricalEvidence('yn',[{form:'in',changed:true,
  rule:'Arbitrary guess'}]).total,0);
 assert.equal(api.lookupHistoricalEvidence('yn',[{form:'in',changed:true,
  rule:'Initial y → i (tentative)'}],{limit:1}).hits.length,1);
 assert.equal(api.lookupHistoricalEvidence('y',variants('y','codex')).total,0,
  'A one-letter historical y must not be equated automatically with lexical i');
 assert.equal(api.lookupHistoricalEvidence('y¯',variants('y¯','codex')).total,0,
  'Abbreviation overbars may not be dropped to find a fake lexical candidate');
 const truncated=api.lookupEvidence('catl',{limit:1});
 assert.equal(truncated.total,2);
 assert.equal(truncated.hits.length,1);
 assert.equal(truncated.truncated,true);
 assert.equal(api.lookupEvidence('unattested').total,0);
 const inflected=api.lookupEvidence('alomeh');
 assert.equal(inflected.total,1);

 // The same unreviewed archive source-form record can supply an exact,
 // tagged morphological clue. This must never backfill the curated lexicon.
 const archiveMorph=api.analyzeSourceForms('alomeh');
 assert.equal(archiveMorph.length,1);
 assert.equal(archiveMorph[0].lemma,'alo');
 assert.equal(archiveMorph[0].grade,'unreviewed');
 assert.equal(archiveMorph[0].kind,'Archive source-listed form (unreviewed)');
 assert(archiveMorph[0].features.sourceTags.includes('plural'));
 assert.equal(archiveMorph[0].parts.length,1,
  'Archive tag does not license invented morpheme boundaries');
 assert.equal(archiveMorph[0].parts[0].surface,'alomeh');
 assert(archiveMorph[0].note.includes('not a verified historical attestation'));
 assert.equal(api.analyzeSourceForms('on').length,0,
  'A canonical spelling variant is not an inflection');
 assert.equal(api.analyzeSourceForms('mila').length,0,
  'Modern Huasteca records cannot yield Classical morphology');
 assert.equal(api.analyzeSourceForms('alomeh!').length,0,
  'Punctuation cannot be silently discarded');
 assert.equal(api.analyzeSourceForms('aloméh').length,0,
  'No diacritic-only match or vowel-length normalization');
 assert.equal(api.analyzeSourceForms('alomeh',{limit:1}).length,1);
 assert.equal(inflected.hits[0].word,'alo');
 assert.equal(inflected.hits[0].matchedForms[0].role,'source-listed form');
 assert.equal(inflected.hits[0].matchedForms[0].form,'alomeh');
 assert(inflected.hits[0].matchedForms[0].tags.includes('plural'));
 assert.equal(api.lookup('alomeh')[0].word,'alo','legacy API retains matched lemma');
 const headword=api.lookupEvidence('on');
 assert.equal(headword.hits[0].matchedForms[0].role,'headword');
 assert(headword.hits[0].matchedForms[0].tags.includes('canonical'));
 const vowelLength=api.lookupEvidence('ōn');
 assert.equal(vowelLength.hits[0].matchKind,'exact');
 assert.equal(vowelLength.hits[0].matchedForms[0].role,'source-listed form');
 assert(vowelLength.hits[0].matchedForms[0].tags.includes('canonical'));
 assert.equal(api.lookupEvidence('alomeh',{limit:1}).truncated,false);

 // A morphological proposal can reference a source-listed inflection without
 // changing its grade; unmarked spelling is never silently normalized.
 const proposal=(lemma,surface,kind='Noun plural parse',changed=false)=>({
  lemma,surface,original:surface,kind,changed,grade:'hypothesis',features:{category:'noun'}
 });
 const pluralCheck=api.crossCheckMorphology('alomeh',[proposal('alo','alomeh')]);
 assert.equal(pluralCheck.length,1);
 assert.equal(pluralCheck[0].lemma,'alo');
 assert.equal(pluralCheck[0].role,'source-listed form');
 assert(pluralCheck[0].tags.includes('plural'));
 assert.equal(pluralCheck[0].grade,'hypothesis','archive overlap must not upgrade evidence');
 assert.equal(api.crossCheckMorphology('alomeh',[proposal('alo','alomeh','Indexed conjugation')]).length,0,
  'explicit noun feature must not be accepted as verb morphology');
 assert.equal(api.crossCheckMorphology('alomeh',[
  {...proposal('alo','alomeh','Indexed conjugation'),features:{category:'verb'}}
 ]).length,0,'noun source cannot validate verb morphology');
 assert.equal(api.crossCheckMorphology('alomeh',[proposal('alo','alomeh','Noun plural parse',true)]).length,0,
  'spelling substitutions are not exact form overlap');
 assert.equal(api.crossCheckMorphology('alomeh',[proposal('wrong','alomeh')]).length,0,
  'surface match alone cannot match a different lemma');
 assert.equal(api.crossCheckMorphology('alomeh',[proposal('alo','alomeh','Dictionary headword')]).length,0,
  'ordinary dictionary matching is not morphological cross-validation');
 assert.equal(api.crossCheckMorphology('alomeh',[{...proposal('alo','alomeh'),original:'alo'}]).length,0,
  'original token must match unchanged manuscript spelling');
 assert.equal(api.crossCheckMorphology('mila',[proposal('mila','mila')]).length,0,
  'modern dialect forms must be excluded');
 assert.equal(api.crossCheckMorphology('ōn',[{...proposal('on','ōn','Pronoun parse'),features:{}}])[0].tags[0],
  'canonical');


 // Validate against a shipped, unmodified Kaikki source shard rather than
 // relying only on hand-authored fixtures.
 const actual=JSON.parse(fs.readFileSync(path.join(__dirname,'..',
  'research/amoxcalli_archive/kaikki_00.json'),'utf8'));
 assert.equal(actual.format,'tlahtolli-amoxcalli-kaikki-v1');
 const actualDocs={
  'manifest.json':{
   format:'tlahtolli-amoxcalli-archive-manifest-v1',
   source_rows:{simeon:0,kaikki:actual.rows.length,total:actual.rows.length},
   simeon:{files:[],source_url:'https://example.org/simeon'},
   kaikki:{files:['kaikki_00.json'],source_url:'https://example.org/kaikki'}
  },
  'kaikki_00.json':actual
 };
 const actualContext={
  window:{},
  document:{readyState:'loading',addEventListener(){}},
  fetch:async url=>{
   const name=String(url).split('/').pop();
   return {ok:Object.hasOwn(actualDocs,name),status:Object.hasOwn(actualDocs,name)?200:404,
    json:async()=>actualDocs[name]};
  }
 };
 vm.runInNewContext(script,actualContext,{filename:'amoxcalli-archive.js'});
 const realApi=actualContext.window.TlahtolliArchive;
 const realLoaded=await realApi.ensureLoaded();
 assert.equal(realLoaded.total,actual.rows.length);
 const realMorph=realApi.analyzeSourceForms('alomeh');
 assert(realMorph.some(m=>m.lemma==='alo'&&m.grade==='unreviewed'&&m.features.sourceTags.includes('plural')),
  'Published Classical source form must supply only an unreviewed morph cue');
 assert(realMorph.every(m=>m.parts.length===1),
  'Source-form evidence never implies a segmentation');
 const realPlural=realApi.lookupEvidence('alomeh');
 assert(realPlural.hits.some(hit=>hit.word==='alo'&&
  hit.matchedForms.some(f=>f.role==='source-listed form'&&f.tags.includes('plural'))));
 assert(realPlural.hits.some(hit=>hit.word==='alomeh'&&
  hit.matchedForms.some(f=>f.role==='headword')),
  'A form-of relation and an independent lemma are separate analyses');
 const markedCanonical=realApi.lookupEvidence('ōn');
 assert(markedCanonical.hits.some(hit=>hit.matchedForms.some(
  f=>f.role==='source-listed form'&&f.tags.includes('canonical'))));
 const unmarkedCanonical=realApi.lookupEvidence('on');
 assert(unmarkedCanonical.hits.some(hit=>hit.matchedForms.some(
  f=>f.role==='headword'&&f.tags.includes('canonical'))));
 assert(realApi.lookupEvidence('in').total>1,'Retain homonymous source rows');

 // A real Kaikki shard has *both* the form-of analysis and a same-spelling
 // independent headword; only the same-lemma plural record may cross-reference.
 const archiveOverlap=realApi.crossCheckMorphology('alomeh',[proposal('alo','alomeh')]);
 assert.equal(archiveOverlap.length,1);
 assert.equal(archiveOverlap[0].role,'source-listed form');
 assert(archiveOverlap[0].tags.includes('plural'));
 assert.equal(realApi.crossCheckMorphology('alomeh',[{...proposal('alo','alomeh'),
  features:{category:'verb'}}]).length,0);
 assert.equal(realApi.crossCheckMorphology('alomeh',[proposal('tēpetl','alomeh')]).length,0);


 console.log('Archive evidence tests passed: grammatical cross-check, source forms, Classical-only POS matching, historical spelling safety, truncation and legacy compatibility.');
})().catch(error=>{console.error(error);process.exitCode=1;});
