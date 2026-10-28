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
 source_rows:{simeon:2,kaikki:5,total:7},
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
  ['on','pron','nci',[[['that'],[],[]]],[['on',['canonical']],['ōn',['canonical']]],'','Classical Nahuatl']
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
 assert.equal(loaded.total,7);
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
 const truncated=api.lookupEvidence('catl',{limit:1});
 assert.equal(truncated.total,2);
 assert.equal(truncated.hits.length,1);
 assert.equal(truncated.truncated,true);
 assert.equal(api.lookupEvidence('unattested').total,0);
 const inflected=api.lookupEvidence('alomeh');
 assert.equal(inflected.total,1);
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
 console.log('Archive evidence tests passed: form tags, headwords vs listed plurals, exact/diacritic contrast, dialect isolation, truncation and compatibility.');
})().catch(error=>{console.error(error);process.exitCode=1;});
