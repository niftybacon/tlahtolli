/* Florentine Codex — provisional morphological close reading.
 * Source attestations, editorial analyses, and machine training are distinct.
 * No Codex material is sent to outside services.
 */
(function(){
'use strict';
const root=document.getElementById('codexCloseReading');
if(!root)return;
const elem=(tag,text,css)=>{const e=document.createElement(tag);if(text!==undefined&&text!==null)e.textContent=String(text);if(css)e.className=css;return e;};
const href=(url,label)=>{if(!/^https:\/\//.test(url||''))return null;const e=elem('a',label);e.href=url;e.target='_blank';e.rel='noopener noreferrer';return e;};
const css=elem('style');
css.textContent='.codex-clr-row{padding:15px 0;border-bottom:1px solid #d3ddd3}.codex-clr-row:last-child{border-bottom:0}.codex-clr-row h4{margin:0 0 5px}.codex-clr-tokens{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;margin:13px 0}.codex-clr-token{border:1px solid #d9e0d5;border-radius:8px;padding:11px;background:#fff}.codex-clr-token strong{display:block}.codex-clr-token p{font-size:.83rem;margin:5px 0}.codex-clr-note{background:#fff5e8;border-left:4px solid #d2a35e;padding:10px 13px;font-size:.82rem}.codex-clr-actions{display:flex;flex-wrap:wrap;gap:12px}.codex-clr-actions button{padding:7px 12px;border:1px solid #527768;border-radius:7px;background:#f5faf4;color:#194436;cursor:pointer}.codex-clr-status{font-size:.78rem;color:#635a47;margin:7px 0}';
document.head.append(css);
const stat=elem('p','Loading independently labeled research records…');root.append(stat);
fetch('./research/florentine_codex/close_reading.json',{cache:'no-store'})
 .then(r=>{if(!r.ok)throw Error('Source file unavailable ('+r.status+')');return r.json();})
 .then(d=>{
  if(d.format!=='tlahtolli-codex-close-reading'||d.train_eligible!==false||!Array.isArray(d.passages))throw Error('Invalid research schema');
  root.replaceChildren();
  const header=elem('p',d.passages.length+' short source-linked excerpts · '+d.passages.reduce((n,p)=>n+p.tokens.length,0)+' analyzed word occurrences. All are preliminary. No manuscript line has yet been certified, no bilingual training pair is approved.','codex-clr-note');
  root.append(header);
  for(const p of d.passages){
   const row=elem('article',undefined,'codex-clr-row');
   row.append(elem('h4','Book '+p.book+', folio '+p.folio+' · '+p.locator));
   row.append(elem('div',p.source_reading,'readerbody'));
   row.append(elem('p','Editorial normalization: '+p.normalized,'ci-meta'));
   row.append(elem('p','Provisional sense: '+p.provisional_english));
   row.append(elem('p','Review: '+p.review_level.replace(/_/g,' ')+' · facsimile checked: '+(p.facsimile_checked?'yes':'NO')+' · training approved: NO','codex-clr-status'));
   const tokens=elem('div',undefined,'codex-clr-tokens');
   for(const t of p.tokens){
    const card=elem('div',undefined,'codex-clr-token');
    card.append(elem('strong',t.surface+' → '+t.lemma),elem('p',t.gloss),elem('p','Role: '+t.role),elem('p','Morphology: '+t.morph),elem('p','Evidence: '+t.certainty.replace(/_/g,' ')));
    if(t.dictionary_url){const l=href(t.dictionary_url,'Check lexicon ↗');if(l)card.append(l);}
    tokens.append(card);
   }
   row.append(tokens,elem('p','Review note: '+p.notes,'ci-meta'));
   const actions=elem('div',undefined,'codex-clr-actions');
   const folio=href(p.source_url,'View source folio ↗');if(folio)actions.append(folio);
   const fac=href(p.source_facsimile,'View original manuscript scan ↗');if(fac)actions.append(fac);
   const inspect=elem('button','Analyze this excerpt');inspect.type='button';
   inspect.onclick=()=>{
    const inp=document.getElementById('translatorInput'),orth=document.getElementById('translatorOrthography'),form=document.getElementById('translatorForm');
    if(inp&&form){inp.value=p.source_reading;if(orth)orth.value='codex';form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));document.getElementById('translatorForm').scrollIntoView({behavior:'smooth',block:'center'});}
   };
   actions.append(inspect);row.append(actions);root.append(row);
  }
 })
 .catch(err=>{root.replaceChildren(elem('p','Could not load Codex readings: '+err.message));});
})();