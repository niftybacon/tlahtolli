// Historical orthography and main-site morphology bridge contract.
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..'),context={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'translator-historical-morphology.js'),'utf8'),context);
const B=context.window.TlahtolliHistoricalMorphology;
assert(B,'Historical morphology bridge missing');
function found(original,expected,profile='general'){
 const v=B.variants(original,profile);
 assert(v[0].form===original.toLocaleLowerCase('en'));
 assert(v.some(x=>x.form===expected&&x.changed),'Missing tentative variant: '+original+' => '+expected);
}
found('qujtoa','quitoa','codex');
found('njman','niman','codex');
found('yvān','iuān','luke1833');
found('çan','zan','codex');
found('vmpa','umpa','codex');
assert(B.variants('xōchitl').length===1,'Unrelated spelling should not be altered');
assert(B.variants('...').length===0);
const observed=[];
const parse=s=>{observed.push(s);
 if(s==='quitoa')return [{lemma:'ihtoa',kind:'Verb hypothesis',grade:'hypothesis',
 features:{subject:'3sg'},parts:[{surface:'qui',role:'object'},{surface:'toa',role:'stem'}]}];
 return [];
};
const lookup=s=>({candidates:s==='quitoa'?[{lemma:'ihtoa',meaning:'to say',source:'https://example.org/source'}]:[]});
const miniature={format:'tlahtolli-codex-aggregate-analysis',
 verbatim_source_text_in_output:false,
 books:[{book:11,top_orthographic_forms:[['qujtoa',12],['quitoa',5]]}]};
const bridge=B.create(parse,lookup,miniature);
const a=bridge.examine('qujtoa','codex');
assert(a.analyses.some(x=>x.lemma==='ihtoa'&&x.changed));
assert(a.corpusObservations.some(x=>x.book===11&&x.form==='qujtoa'&&x.count===12));
assert(a.analyses.some(x=>x.grade==='hypothesis'&&x.changed));
assert(a.analyses.every(x=>x.changed),'An unmatched original should not invent an attestation');
assert(a.analyses.every(x=>x.rule.includes('tentative')));
const count=observed.length;bridge.examine('qujtoa','codex');
assert.equal(observed.length,count,'Repeated words should use the analysis cache');
bridge.clearCache();bridge.examine('qujtoa','codex');
assert(observed.length>count,'Cache clear should reparse after dictionary update');
assert(bridge.examine('unrelated','luke1833').analyses.length===0);
console.log('PASS: tentative historical spelling profiles and morphological hypotheses remain distinct from attestations');
