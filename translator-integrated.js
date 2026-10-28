/* Tlahtōlli · Integrated Historical Translation Desk
 * Native workspace inside the main app, powered by translator-engine.js.
 * Lexical glosses and candidate passage interpretations are NOT machine translations.
 */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const el=(tag,cls,value)=>{
 const node=document.createElement(tag);
 if(cls)node.className=cls;
 if(value!==undefined)node.textContent=String(value);
 return node;
};
const safeLink=(value,title)=>{
 try{
  const url=new URL(value,location.href);
  if(!['http:','https:'].includes(url.protocol))return null;
  const link=el('a','',title);
  link.href=url.href;link.target='_blank';link.rel='noopener noreferrer';
  return link;
 }catch{return null;}
};
const form=$('translatorForm');
if(!form)return;
let model=null,latest=null,dataMode='none';
const input=$('translatorInput'),direction=$('translatorDirection');
const note=$('translatorStatus'),gloss=$('translatorGloss');
const parts=$('translatorAnalyses'),passages=$('translatorPassages');
function status(message){note.textContent=message;}
function showResult(){
 parts.replaceChildren();passages.replaceChildren();latest=null;
 if(!model){gloss.textContent='Dictionary is loading or unavailable.';return;}
 const content=input.value.trim();
 if(!content){gloss.textContent='Enter a word or a short passage and choose Analyze.';status(model.stats.headwords+' Classical Nahuatl headwords ready.');return;}
 latest=model.analyze(content,direction.value);
 gloss.textContent=latest.gloss;
 status(latest.stats.matched+' recognized · '+latest.stats.unknown+' unknown · '+
  latest.stats.ambiguous+' ambiguous · '+latest.stats.approximate+
  ' approximate. Research gloss, not a complete grammatical translation.'+
  (dataMode==='offline'?' (Offline dictionary fallback.)':''));
 if(latest.passages.length){
  passages.append(el('h4','','Historical passage interpretation candidates'));
  for(const item of latest.passages){
   const block=el('article','translator-candidate');
   block.append(el('strong','',item.source),el('p','',item.interpretation),
    el('p','translator-meta',item.type),
    el('p','translator-caution','Not an approved translation training pair. Editorial wording requires review.'));
   if(item.approximate)block.append(el('p','translator-caution','Approximate spelling match; check the source spelling.'));
   if(item.note)block.append(el('p','translator-meta',item.note));
   const link=safeLink(item.url,'View cited source');
   if(link)block.append(link);
   passages.append(block);
  }
 }
 for(const entry of latest.parts){
  if(entry.kind!=='word')continue;
  const block=el('article','translator-word');
  block.append(el('strong','translator-headword',entry.value));
  if(entry.status==='unknown'){
   block.append(el('p','translator-caution','Unindexed form: no meaning is proposed.'));
  }else{
   if(entry.status==='approximate')block.append(el('p','translator-caution','Approximate orthography only. Vowel length or spelling may change the interpretation.'));
   if(entry.candidates.length>1)block.append(el('p','translator-meta','Multiple lexical analyses possible; context required.'));
   for(const candidate of entry.candidates){
    const line=el('div','translator-analysis');
    line.append(el('span','',candidate.lemma+' — '+candidate.meaning),
     el('small','translator-meta',candidate.form_type+' · '+candidate.evidence+' · '+candidate.pos));
    const source=safeLink(candidate.source,'Lexical / grammatical source');
    if(source)line.append(source);
    block.append(line);
   }
  }
  parts.append(block);
 }
}
async function init(){
 if(!window.TlahtolliTranslator){
  status('Translation engine not available. Try reloading the website.');
  return;
 }
 try{
  const requests=[
   fetch('./dictionary.json',{cache:'no-cache'}).then(async r=>{
    if(!r.ok)throw Error('Dictionary fetch '+r.status);return r.json();
   }),
   fetch('./research/translation_corpus/research_examples.json',{cache:'no-cache'})
    .then(r=>r.ok?r.json():{entries:[]}).catch(()=>({entries:[]}))
  ];
  const [dictionary,candidates]=await Promise.allSettled(requests);
  let document;
  if(dictionary.status==='fulfilled'&&Array.isArray(dictionary.value.words)){
   document=dictionary.value;dataMode='published';
  }else if(window.TLAHTOLLI_OFFLINE_SEED&&Array.isArray(window.TLAHTOLLI_OFFLINE_SEED.words)){
   document=window.TLAHTOLLI_OFFLINE_SEED;dataMode='offline';
  }else throw Error('No published or bundled dictionary data found');
  const corpus=candidates.status==='fulfilled'?candidates.value:{entries:[]};
  model=window.TlahtolliTranslator.create(document,corpus);
  status(model.stats.headwords+' Classical Nahuatl headwords · '+
   model.stats.wordForms+' index keys · '+
   model.stats.passageCandidates+' sourced passage candidates.'+
   (dataMode==='offline'?' Using bundled offline dictionary.':''));
 }catch(err){status('Could not initialize translation research desk: '+String(err.message||err));}
}
form.addEventListener('submit',event=>{event.preventDefault();showResult();});
direction.addEventListener('change',()=>{if(input.value.trim())showResult();});
$('translatorExample').addEventListener('click',()=>{
 input.value='in mochioa tezcatl, in mocuepa ca tetl';
 direction.value='nh-en';showResult();
});
$('translatorClear').addEventListener('click',()=>{
 input.value='';parts.replaceChildren();passages.replaceChildren();latest=null;
 gloss.textContent='Enter a word or a short passage and choose Analyze.';
 input.focus();
});
$('translatorCopy').addEventListener('click',async()=>{
 if(!latest){status('Analyze some text first.');return;}
 try{await navigator.clipboard.writeText(gloss.textContent);status('Working gloss copied.');}
 catch{status('Clipboard unavailable; select the gloss and copy manually.');}
});
$('translatorExport').addEventListener('click',()=>{
 if(!latest){status('Analyze a passage before exporting a research note.');return;}
 const json={
  format:'tlahtolli-translation-research-note',schema:1,
  created_at:new Date().toISOString(),direction:direction.value,
  original_text:input.value.slice(0,7000),working_gloss:latest.gloss,
  stats:latest.stats,source_passage_candidates:latest.passages,
  review_status:'unreviewed',train_eligible:false,
  note:'This is a personal research export, not reviewed corpus data or a machine translation.'
 };
 const blob=new Blob([JSON.stringify(json,null,2)],{type:'application/json'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='tlahtolli-translation-note.json';a.click();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
 status('Research note downloaded. It has not been submitted to a model.');
});
init();
})();
