/* Local review interface for an UNREVIEWED machine-prepared public-domain OCR draft.
   Review decisions live only on this device, not in the published corpus. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const box=$('lukeReviewWorkspace');if(!box)return;
const button=$('lukeReviewLoad'),status=$('lukeReviewStatus');
const stats=$('lukeReviewCounts'),items=$('lukeReviewItems');
const select=$('lukeReviewType'),verse=$('lukeVersePicker');
const verseText=$('lukeVersePreview'),exportBtn=$('lukeReviewExport');
let report=null,position=0,choices={};
const KEY='tlahtolli_luke1833_local_reviews_v1';
function el(tag,text,css){
 const x=document.createElement(tag);
 if(text!==undefined)x.textContent=String(text);
 if(css)x.className=css;
 return x;
}
const fmt=n=>Number(n||0).toLocaleString('en-US');
function readSaved(){
 try{const value=JSON.parse(localStorage.getItem(KEY)||'{}');return value&&typeof value==='object'?value:{}}catch{return {}}
}
function writeSaved(){
 try{localStorage.setItem(KEY,JSON.stringify(choices))}catch{status.textContent='Browser storage blocked: export your reviews to preserve them.'}
}
function getCandidates(){
 if(!report)return [];
 const type=select.value;
 return report.review_queue.filter(x=>type==='all'||type===x.kind);
}
function renderQueue(){
 items.replaceChildren();
 const entries=getCandidates();
 position=Math.max(0,Math.min(position,Math.max(0,entries.length-1)));
 const shown=entries.slice(position,position+15);
 for(const entry of shown){
  const card=el('article',undefined,'luke-review-card');
  card.append(el('strong',entry.kind==='line_hyphen_join'?'Printed line-break candidate':'Possible split word'));
  const form=el('div',undefined,'luke-review-comparison');
  form.append(el('code',entry.original),el('span','→'),el('code',entry.proposed));
  card.append(form);
  card.append(el('p',entry.status==='mechanical_applied'?'Working draft already contains this mechanical join; source-page confirmation is still needed.':'Not applied automatically. The original spelling remains in the working draft.','readerhint'));
  for(const ref of entry.lexical_references||[]){
   if(!/^https?:\/\//.test(ref.source||''))continue;
   const link=el('a',ref.lemma+' · '+ref.evidence);
   link.href=ref.source;link.target='_blank';link.rel='noopener noreferrer';
   card.append(link);break;
  }
  const loc=el('p','OCR character offset '+fmt(entry.offset)+' · '+entry.reason,'readerhint');
  card.append(loc);
  const choice=choices[String(entry.offset)+':'+entry.kind];
  const outcome=el('p',choice?'Local review: '+choice.decision:'Not reviewed','readerhint');
  card.append(outcome);
  const actions=el('div',undefined,'translator-actions');
  for(const [decision,label] of [['accept','Accept candidate locally'],['reject','Reject candidate locally']]){
   const b=el('button',label,'btn');
   b.type='button';b.addEventListener('click',()=>{
    choices[String(entry.offset)+':'+entry.kind]={decision,when:new Date().toISOString(),
     source:entry.original,candidate:entry.proposed,offset:entry.offset,kind:entry.kind,
     status:'user_choice_not_specialist_verified'};
    writeSaved();outcome.textContent='Local review: '+decision+
     '. This has not changed the published corpus.';
   });
   actions.append(b);
  }
  card.append(actions);
  items.append(card);
 }
 $('lukeReviewPage').textContent=(entries.length?fmt(position+1)+'–'+fmt(Math.min(entries.length,position+15)):'0')+
  ' of '+fmt(entries.length)+' review examples';
 $('lukeReviewBack').disabled=position===0;
 $('lukeReviewForward').disabled=position+15>=entries.length;
}
function renderVerse(){
 if(!report)return;
 const index=Number(verse.value),item=report.verse_candidates?.[index];
 verseText.replaceChildren();
 if(!item)return;
 verseText.append(el('p','OCR number '+item.number_candidate+
  ' · character offset '+fmt(item.raw_offset)+
  ' · preceding header '+(item.preceding_heading||'unknown')+
  ' (header and verse identification unverified).','readerhint'));
 const p=el('p',item.text_preview);p.style.whiteSpace='pre-wrap';
 verseText.append(p);
 verseText.append(el('p','Preview only. Verify the chapter, verse boundary, wording, and orthography against the scanned source.','translator-caution'));
}
select.addEventListener('change',()=>{position=0;renderQueue()});
$('lukeReviewBack').addEventListener('click',()=>{position=Math.max(0,position-15);renderQueue()});
$('lukeReviewForward').addEventListener('click',()=>{position+=15;renderQueue()});
verse.addEventListener('change',renderVerse);
exportBtn.addEventListener('click',()=>{
 const output={format:'tlahtolli-luke1833-user-review',schema:1,source:report?.source||'',
  original_ocr_hash:report?.original_ocr_hash,decisions:choices,
  status:'local_user_annotations_only_not_verified_translation_data',
  warning:'Compare each entry with the facsimile. Exporting does not automatically approve training.'};
 const blob=new Blob([JSON.stringify(output,null,2)],{type:'application/json'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='luke1833-my-ocr-review.json';a.click();
 setTimeout(()=>URL.revokeObjectURL(url),1200);
 status.textContent='Local reviewer decisions exported; no corpus changes were uploaded.';
});
button.addEventListener('click',async()=>{
 button.disabled=true;status.textContent='Loading candidate segmentation and correction evidence…';
 try{
  const r=await fetch('./research/translation_corpus/luke_1833_review_queue.json',{cache:'no-cache'});
  if(!r.ok)throw Error('HTTP '+r.status);
  const value=await r.json();
  if(value.format!=='tlahtolli-luke1833-ocr-segmentation'||value.training_approved!==false)throw Error('Unsupported review file');
  report=value;choices=readSaved();box.hidden=false;button.hidden=true;
  stats.textContent=fmt(value.counts.applied_hyphen)+' mechanically joined line-breaks · '+
   fmt(value.counts.unresolved_hyphen)+' unresolved line-breaks · '+
   fmt(value.counts.possible_space_joins)+' spacing matches for inspection · '+
   fmt(value.counts.verse_start_candidates)+' potential verse markers';
  const verses=value.verse_candidates||[];
  for(let i=0;i<verses.length;i++){
   const v=verses[i],o=el('option','#'+(i+1)+' · possible verse '+v.number_candidate+' (offset '+v.raw_offset+')');
   o.value=String(i);verse.append(o);
  }
  renderQueue();renderVerse();
  status.textContent='Automatic corrections are proposals, not linguistic approvals. Review against the 1833 facsimile.';
 }catch(e){button.disabled=false;status.textContent='Unable to load OCR review: '+(e?.message||String(e))}
});
})();
