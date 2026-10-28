/* Historical orthography -> existing Tlahtōlli morphology engine.
   No corpus sentences are copied and no rules are counted as attestations.
   Orthographic variants are candidates, not replacements for manuscript spellings. */
(function(root){
'use strict';
const allowed=new Set(['codex','luke1833','general']);
const grades={manuscript:'Cited historical-text example',lexical:'Source-located lexical form',
 grammar:'Grammar-recorded form',lemma:'Dictionary lemma',paradigm:'Generated indexed paradigm',
 hypothesis:'Unverified productive hypothesis',analogy:'Unverified possessive analogy',
 unreviewed:'Unverified form candidate'};
const WORD=/^[\p{L}\p{M}’'-]{1,120}$/u;
function variants(token,profile='general'){
 if(!allowed.has(profile))profile='general';
 const form=String(token||'').normalize('NFC').toLocaleLowerCase('en');
 if(!WORD.test(form))return [];
 const out=[{form,rule:'Original spelling',changed:false}];
 const seen=new Set([form]);
 function add(candidate,rule){
  if(candidate!==form&&WORD.test(candidate)&&!seen.has(candidate)&&out.length<12){
   seen.add(candidate);out.push({form:candidate,rule,changed:true});
  }
 }
 const rules=[
  {pattern:/ç/g,replacement:'z',label:'Historical ç → z (tentative)'},
  {pattern:/quj/g,replacement:'qui',label:'Print quj → qui (tentative)'},
  {pattern:/nj/g,replacement:'ni',label:'Print nj → ni (tentative)'},
  {pattern:/j/g,replacement:'i',label:'Historical j → i (tentative)'},
  {pattern:/v/g,replacement:'u',label:'Historical v → u (tentative)'},
  {pattern:/^y/g,replacement:'i',label:'Initial y → i (tentative)'}
 ];
 // Use only the general early print variants for the original text.
 // A Luke profile is a separate historical variety, not evidence of
 // exact Classical Nahuatl equivalence.
 if(profile==='codex'||profile==='general'||profile==='luke1833'){
  for(const rule of rules){if(rule.pattern.test(form))add(form.replace(rule.pattern,rule.replacement),rule.label);
   rule.pattern.lastIndex=0;}
 }
 // Conservative two-step combinations; never silently mutate the original.
 const first=out.slice(1,7);
 for(const prev of first){
  for(const rule of rules){
   if(rule.pattern.test(prev.form))add(prev.form.replace(rule.pattern,rule.replacement),
    prev.rule+'; '+rule.label);
   rule.pattern.lastIndex=0;
  }
 }
 return out;
}
function makeEngine(parser,lookup,corpus){
 const corpusIndex=new Map();
 if(corpus?.format==='tlahtolli-codex-aggregate-analysis'&&
    corpus.verbatim_source_text_in_output===false&&Array.isArray(corpus.books)){
  for(const book of corpus.books){
   if(!Number.isInteger(book.book)||book.book<1||book.book>12)continue;
   for(const pair of book.top_orthographic_forms||[]){
    const form=String(pair[0]||'').toLocaleLowerCase('en');
    const count=Number(pair[1]);
    if(!form||!Number.isInteger(count)||count<1)continue;
    if(!corpusIndex.has(form))corpusIndex.set(form,[]);
    corpusIndex.get(form).push({book:book.book,count});
   }
  }
 }
 const cache=new Map();
 const morph=typeof parser==='function'?parser:()=>[];
 const dictionary=typeof lookup==='function'?lookup:()=>({candidates:[]});
 function examine(token,profile='general'){
  const key=profile+'|'+token;
  if(cache.has(key))return cache.get(key);
  const forms=variants(token,profile);
  const found=[],seen=new Set();
  for(const item of forms){
   const direct=dictionary(item.form);
   // A proposed historical spelling is still only an orthographic
   // candidate until an independently indexed lemma or form matches it.
   const matches=Array.isArray(direct?.candidates)?direct.candidates:[];
   for(const w of matches.slice(0,3)){
    const k='lexical|'+w.lemma+'|'+item.form;
    if(seen.has(k))continue;seen.add(k);
    found.push({lemma:w.lemma,meaning:w.meaning||'',kind:'Dictionary matching form',
     grade:item.changed?'orthographic':'lemma',source:w.source||'',
     surface:item.form,original:token,rule:item.rule,changed:item.changed,
     parts:[],features:{},note:item.changed?
     'Tentative spelling interpretation only; not proof of this exact source occurrence.':
     'Indexed dictionary match; context not determined.'});
   }
   const analyses=morph(item.form);
   for(const a of (Array.isArray(analyses)?analyses:[]).slice(0,5)){
    const k='morph|'+a.lemma+'|'+a.kind+'|'+item.form+'|'+a.grade;
    if(seen.has(k))continue;seen.add(k);
    found.push({lemma:a.lemma||'',kind:a.kind||'Morphological proposal',
     grade:a.grade||'unreviewed',source:a.source||'',locator:a.locator||'',
     features:a.features||{},parts:Array.isArray(a.parts)?a.parts:[],
     surface:item.form,original:token,rule:item.rule,changed:item.changed,
     note:a.note||'',meaning:''});
   }
  }
  const rank={manuscript:100,lexical:90,grammar:80,lemma:70,orthographic:55,
    paradigm:50,hypothesis:20,analogy:15,unreviewed:10};
  found.sort((a,b)=>(rank[b.grade]||0)-(rank[a.grade]||0)||
    Number(a.changed)-Number(b.changed));
  const observed=[];
  for(const entry of forms){
   const books=corpusIndex.get(entry.form)||[];
   for(const hit of books)observed.push({form:entry.form,original:token,
    book:hit.book,count:hit.count,changed:entry.changed});
  }
  const result={original:token,profile,variants:forms,
   corpusObservations:observed.slice(0,24),
   analyses:found.slice(0,8),analyzed:found.length>0,
   uncertain:found.some(x=>x.changed||['hypothesis','analogy','paradigm','unreviewed','orthographic'].includes(x.grade))};
  if(cache.size>300)cache.clear();
  cache.set(key,result);return result;
 }
 return {examine,variants,gradeLabels:grades,clearCache:()=>cache.clear()};
}
root.TlahtolliHistoricalMorphology={create:makeEngine,variants,gradeLabels:grades};
})(window);
