/* Tlahtōlli · Corpus Integrity & Florentine Codex Review Desk (2026-10-28)
   This is a local annotation workspace, not a trained machine translation model.
   No user-edited historical text is sent to GitHub or a server. */
(function(){
'use strict';
const mount=document.getElementById('corpusIntegrityMount');
if(!mount)return;
const KEY='tlahtolli_corpus_review_v1';
const el=(tag,content,cls)=>{const n=document.createElement(tag);if(content!==undefined&&content!==null)n.textContent=String(content);if(cls)n.className=cls;return n;};
const link=(url,caption)=>{if(!/^https:\/\//.test(url||''))return null;const a=el('a',caption);a.href=url;a.target='_blank';a.rel='noopener noreferrer';return a;};
const line=()=>el('div',null,'ci-divider');
let entries=[],active=null;
let saved={};
try{const value=JSON.parse(localStorage.getItem(KEY)||'{}');if(value&&typeof value==='object'&&!Array.isArray(value))saved=value;}catch{}
const style=el('style');
style.textContent='.ci-toolbar{display:flex;flex-wrap:wrap;align-items:center;gap:9px;margin:12px 0}.ci-entry{border:1px solid #ccd8cf;background:#fffefa;border-radius:10px;padding:13px;margin:10px 0}.ci-entry h4{margin:0 0 7px}.ci-entry p{margin:5px 0;font-size:.85rem}.ci-note{font-size:.85rem;color:#655d45}.ci-warning{background:#fff1df;border:1px solid #dec59c;border-radius:8px;padding:10px;margin:12px 0}.ci-fields{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:10px}.ci-field{display:flex;flex-direction:column;gap:4px;font-size:.85rem}.ci-field.wide{grid-column:1/-1}.ci-field textarea{min-height:76px;font:inherit}.ci-field input,.ci-field textarea,.ci-field select{padding:9px;border-radius:7px;border:1px solid #bdcbc0;background:white;color:#26342e;width:100%}.ci-divider{height:1px;background:#dce5dc;margin:11px 0}.ci-actions{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}.ci-meta{font-size:.75rem;color:#52645d}.ci-entry button,.ci-toolbar button,.ci-actions button{border:1px solid #375e52;border-radius:8px;padding:7px 11px;background:#fffefa;color:#234f42;font:inherit;font-size:.83rem;cursor:pointer}.ci-entry button:focus-visible,.ci-toolbar button:focus-visible{outline:3px solid #82ada0}';
document.head.append(style);
const panel=el('div');
mount.replaceChildren(panel);
function persist(){try{localStorage.setItem(KEY,JSON.stringify(saved));return true;}catch{return false;}}
function currentRecord(seed){
 return Object.assign({
  id:seed.id,source_title:seed.source_title||'Florentine Codex',source_url:seed.source_url||'',
  variety:'Classical Nahuatl',book:'',folio:'',original:seed.original||'',normalized:seed.normalized||'',
  morphology:'',english_interpretation:seed.english_interpretation||'',
  editorial_notes:seed.source_note||'',source_status:'candidate',translator_credit:'',
  transcription_rights:'unverified',translation_rights:'unverified',
  transcription_rights_evidence:'',translation_rights_evidence:'',
  checked_by:'',checked_at:'',train_eligible:false
 },saved[seed.id]||{});
}
function fieldForm(form,key,label,value,type,options){
 const box=el('label',null,'ci-field'+(['original','normalized','english_interpretation','morphology','editorial_notes'].includes(key)?' wide':''));
 box.append(el('strong',label));
 let inp;
 if(type==='area'){inp=el('textarea');inp.value=value||'';}
 else if(type==='select'){inp=el('select');for(const o of options){const opt=el('option',o[1]);opt.value=o[0];if(o[0]===value)opt.selected=true;inp.append(opt);}}
 else {inp=el('input');inp.type='text';inp.value=value||'';}
 inp.dataset.key=key;box.append(inp);form.append(box);return inp;
}
function showEditor(seed){
 active=seed.id;render();
}
function makeRow(seed,idx){
 const d=currentRecord(seed),art=el('article',null,'ci-entry');
 art.append(el('h4',(idx+1)+'. '+d.source_title));
 const state=el('p','Review: '+d.source_status+' · Rights: '+d.transcription_rights+' / '+d.translation_rights,'ci-meta');
 art.append(state);
 const reading=el('p','Witness: '+(d.original||'(not transcribed)'));
 art.append(reading);
 if(d.source_url){const a=link(d.source_url,'Open exact source / folio');if(a)art.append(a);}
 const actions=el('div',null,'ci-actions');
 const edit=el('button',active===seed.id?'Close editor':'Review passage');edit.type='button';edit.onclick=()=>{active=active===seed.id?null:seed.id;render();};actions.append(edit);
 const analyze=el('button','Inspect with translator');analyze.type='button';analyze.onclick=()=>{
  const tx=document.getElementById('translatorInput'),orth=document.getElementById('translatorOrthography'),fm=document.getElementById('translatorForm');
  if(tx&&fm){tx.value=d.normalized||d.original;if(orth)orth.value='codex';fm.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));document.getElementById('translatorView')?.scrollIntoView({behavior:'smooth',block:'start'});}
 };
 actions.append(analyze);art.append(actions);
 if(active!==seed.id)return art;
 const form=el('div',null,'ci-fields');
 fieldForm(form,'source_title','Source title',d.source_title);
 fieldForm(form,'source_url','Exact HTTPS folio / manuscript link',d.source_url);
 fieldForm(form,'book','Book',d.book);
 fieldForm(form,'folio','Folio or segment locator',d.folio);
 fieldForm(form,'original','Historical transcription (do not silently normalize)',d.original,'area');
 fieldForm(form,'normalized','Editorial normalization (a separate reading)',d.normalized,'area');
 fieldForm(form,'morphology','Morpheme-level analysis, hypotheses explicitly labeled',d.morphology,'area');
 fieldForm(form,'english_interpretation','English interpretation (identify translator)',d.english_interpretation,'area');
 fieldForm(form,'translator_credit','Translation/editor attribution',d.translator_credit);
 fieldForm(form,'source_status','Review stage',d.source_status,'select',[
 ['candidate','Candidate / not reviewed'],['facsimile_checked','Checked against source facsimile'],['linguistically_reviewed','Linguistically reviewed (identify reviewer)']
 ]);
 fieldForm(form,'transcription_rights','Nahuatl transcription reuse',d.transcription_rights,'select',[
 ['unverified','Unknown / restricted'],['permission_documented','Permission documented'],['self_transcribed_public_domain','Independent transcription of public-domain manuscript']
 ]);
 fieldForm(form,'translation_rights','English interpretation reuse',d.translation_rights,'select',[
 ['unverified','Unknown / restricted'],['original_authorized','Independently authored and authorized'],['permission_documented','Permission documented']
 ]);
 fieldForm(form,'transcription_rights_evidence','Evidence for transcription rights (URL or citation)',d.transcription_rights_evidence);
 fieldForm(form,'translation_rights_evidence','Evidence for translation rights (URL or citation)',d.translation_rights_evidence);
 fieldForm(form,'checked_by','Reviewer (do not claim expert review without one)',d.checked_by);
 fieldForm(form,'editorial_notes','Notes, alternatives and unresolved uncertainty',d.editorial_notes,'area');
 art.append(form);
 const save=el('button','Save local review');save.type='button';
 save.onclick=()=>{
  const next=Object.assign({},d);
  form.querySelectorAll('[data-key]').forEach(node=>{next[node.dataset.key]=node.value.trim();});
  if(!next.source_url.startsWith('https://')){alert('A source HTTPS link is required.');return;}
  const readingChanged=['original','normalized','morphology','english_interpretation'].some(k=>(next[k]||'')!==(d[k]||''));
  if(readingChanged&&next.source_status!=='candidate'){next.source_status='candidate';next.checked_at='';}
  if(next.source_status!=='candidate'&&!next.checked_by){alert('Name the person who checked this passage, or leave it as a candidate.');return;}
  if(next.source_status!=='candidate')next.checked_at=new Date().toISOString().slice(0,10);
  next.train_eligible=false;
  saved[seed.id]=next;
  const ok=persist();active=null;render();
  const message=document.getElementById('ciSaveStatus');if(message)message.textContent=ok?'Saved in this browser; not uploaded to GitHub.':'Could not save to browser storage. Export a JSON copy.';
 };
 const cancel=el('button','Cancel');cancel.type='button';cancel.onclick=()=>{active=null;render();};
 const acts=el('div',null,'ci-actions');acts.append(save,cancel);art.append(acts);
 return art;
}
function download(){
 const payload={
  format:'tlahtolli-corpus-review-export',schema:1,exported_at:new Date().toISOString(),
  copyright_note:'An export is a local review file, NOT an approved training dataset. Confirm licenses and independent linguistic review before training.',
  train_eligible:false,
  records:entries.map(e=>Object.assign({},currentRecord(e),{train_eligible:false}))
 };
 const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
 const u=URL.createObjectURL(blob);const a=el('a');a.href=u;a.download='tlahtolli-florentine-review.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),500);
}
function addRecord(){
 const id='local-fc-'+Date.now();
 const item={id,source_title:'Florentine Codex · new folio',source_url:'https://florentinecodex.getty.edu/',original:'',normalized:'',english_interpretation:'',source_note:'Locate exact folio; document manuscript transcription and editor separately.'};
 entries.push(item);active=id;render();
}
function render(){
 panel.replaceChildren();
 const intro=el('p','Keep the original written form, normalized spelling, grammatical parsing, and English interpretation separate. Changes to a previously reviewed reading reset its check status. Drafts stay in your browser.');
 panel.append(intro);
 const warning=el('p','Training gate: 0 approved examples. Copyright clearance and independent linguistic review are required before fitting a model. Getty Anderson–Dibble text and translation are rights-reserved; do not bulk-copy them.','ci-warning');
 panel.append(warning);
 const bar=el('div',null,'ci-toolbar');
 const add=el('button','Add sourced folio');add.type='button';add.onclick=addRecord;
 const exp=el('button','Export local review JSON');exp.type='button';exp.onclick=download;
 bar.append(add,exp,el('span','Research candidates: '+entries.length,'ci-meta'));panel.append(bar);
 const status=el('p','','ci-meta');status.id='ciSaveStatus';panel.append(status);
 for(let i=0;i<entries.length;i++)panel.append(makeRow(entries[i],i));
 const note=el('p','The twelve-book corpus atlas above is aggregate frequency evidence, not sentence-aligned training data. Three initial short examples come from the site’s research_examples.json. Import into machine-learning training only after a separate source, rights, segmentation and evaluation audit.','ci-note');
 panel.append(line(),note);
}
fetch('./research/translation_corpus/research_examples.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('source status '+r.status);return r.json();}).then(data=>{
 entries=(data.entries||[]).filter(e=>e.source_id==='FC').map(e=>Object.assign({},e,{source_status:e.review_status||'candidate'}));
 for(const id of Object.keys(saved)){if(id.startsWith('local-fc-')&&!entries.some(x=>x.id===id))entries.push(Object.assign({id},saved[id]));}
 render();
}).catch(err=>{entries=[];render();panel.prepend(el('p','Source examples could not be fetched: '+err.message+'. New sourced entries can still be recorded locally.','ci-warning'));});
})();