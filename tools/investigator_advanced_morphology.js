'use strict';
/* Execute EXACT browser supplementary morphology source in an isolated Node VM.
 * It remains a candidate analyzer. Dictionary 'grade' and source are retained;
 * no accepted paradigm, morphology or source spelling is created here.
 * It never calls the UI renderers or applies unsourced normalization.
 */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ROOT=path.resolve(__dirname,'..');
function create(){
 const dictionary=JSON.parse(fs.readFileSync(path.join(ROOT,'dictionary.json'),'utf8'));
 const paradigms=JSON.parse(fs.readFileSync(path.join(ROOT,'paradigms.json'),'utf8'));
 if(paradigms.format!=='tlahtolli-verb-paradigms'||
    !Array.isArray(dictionary.words)||!Array.isArray(paradigms.patterns)||
    paradigms.patterns.length!==10)throw Error('Unexpected canonical morphology input source');
 const src=fs.readFileSync(path.join(ROOT,'tools/morphology_engine.js'),'utf8');
 if(!src.includes('const TlahtolliMorphEngine = (() => {')||
    !src.includes('return {analyze,html,splitVerbCell'))
   throw Error('Actual browser advanced morphology engine source has changed');
 const scope={
    // The browser UI's lexical/global state is supplied from the matching
    // ORIGINAL canonical files, with no invented stem data.
    words:dictionary.words,
    FULL_VERB_PARADIGMS:paradigms.paradigms,
    VERB_TENSES:paradigms.patterns.map(x=>({name:String(x)})),
    // Conservative NFC+case match; never remove macrons globally.
    norm:x=>String(x||'').normalize('NFC').toLocaleLowerCase('en'),
    stripToken:x=>String(x||'').replace(/^[.,;:!?\s]+|[.,;:!?\s]+$/gu,''),
    // The browser's historicalSpellings() UI helper is not independently
    // source-graded here. No variants are manufactured by this VM; source-
    // attested witnesses remain separately indexed by Python research.
    historicalSpellings:()=>[],
    // These functions are only for html() and the browser UI, which are
    // deliberately not called in evidence research.
    safe:x=>String(x),
    validUrl:x=>typeof x==='string'&&x.startsWith('https://'),
    safeLink:()=>'',renderFormProbe:()=>{},renderMorphologyBreakdown:()=>{},
    $:()=>null,
 };
 vm.createContext(scope);
 vm.runInContext(src+'\n;this.__actualMorphEngine=TlahtolliMorphEngine;',scope,
  {filename:'tools/morphology_engine.js',timeout:12000});
 const api=scope.__actualMorphEngine;
 if(!api||typeof api.analyze!=='function')throw Error('No actual browser morphology analyzer available');
 return {
  analyze(written){
   if(typeof written!=='string'||written.length>120)return [];
   const result=api.analyze(written);
   if(!Array.isArray(result)||result.length>40)throw Error('Unbounded browser morphology');
   return result.map(item=>({
    lemma:String(item.lemma||'').slice(0,120),
    kind:String(item.kind||'').slice(0,140),
    grade:String(item.grade||'').slice(0,35),
    source:typeof item.source==='string'&&item.source.startsWith('https://')?item.source:null,
    locator:String(item.locator||'').slice(0,160),
    note:'Existing supplementary browser hypothesis. Source grade is not a historical sentence attestation.',
   }));
  },
  matchingInputVersion:{dictionary:dictionary.version,paradigms:paradigms.version,
   source:'tools/morphology_engine.js exact original browser implementation',
   normalization:'NFC lowercase; vowel length not stripped'},
 };
}
module.exports={create};
