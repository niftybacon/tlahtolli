/* Direct manuscript inspection — separate from normalized corpus and machine training.
   Partial visual comparisons are NOT full line certifications.
*/
(function(){
'use strict';
const root=document.getElementById('codexFacsimileReview');
if(!root)return;
function el(tag,value){const e=document.createElement(tag);if(value!==undefined)e.textContent=String(value);return e;}
function link(url,text){const e=el('a',text);if(!url?.startsWith('https://'))return null;e.href=url;e.target='_blank';e.rel='noopener noreferrer';return e;}
root.append(el('p','Loading facsimile observations…'));
fetch('./research/florentine_codex/folio_visual_collation.json',{cache:'no-store'})
.then(r=>{if(!r.ok)throw new Error('HTTP '+r.status);return r.json();})
.then(data=>{
 if(data.format!=='tlahtolli-manuscript-visual-collation'||data.train_eligible!==false||data.gold_standard!==false||data.certified_lines!==0)throw new Error('Unrecognized or overstated verification status');
 root.replaceChildren();
 const regions=data.folios.reduce((n,f)=>n+f.regions.length,0);
 const warning=el('p',data.folios.length+' actual folio images inspected; '+regions+' localized visual observations; ZERO certified diplomatic lines. No scholar sign-off or model training.');warning.className='codex-clr-note';root.append(warning);
 for(const f of data.folios){
   const section=el('section');section.className='codex-clr-row';
   section.append(el('h4','Book '+f.book+', folio '+f.folio+' · '+f.column));
   const scan=link(f.source_url,'Open manuscript page on Getty');
   if(scan)section.append(scan);
   for(const note of f.regions){
     const box=el('div');box.className='codex-clr-token';box.style.marginTop='10px';
     box.append(el('strong',note.locator));
     box.append(el('p',note.visual_observation));
     box.append(el('p','Published editorial comparison: '+note.editorial_comparison));
     box.append(el('p','Proposed normalization: '+note.normalization_candidate));
     box.append(el('p','Uncertainty: '+note.uncertain_characters));
     const status=el('p','Physical line and glyph check: PARTIAL · Grammar certified: NO · Translation certified: NO');
     status.className='codex-clr-status';box.append(status);section.append(box);
   }
   root.append(section);
 }
 const method=el('p',data.retraction_note);method.className='readerhint';root.append(method);
}).catch(err=>{root.replaceChildren(el('p','Visual evidence unavailable: '+err.message));});
})();