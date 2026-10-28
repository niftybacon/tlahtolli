/* Codex source-aware phrase bridge: annotates matching historical phrases only.
 * This never replaces the dictionary gloss or supplies unverified translations.
 */
(function(){
'use strict';
const form=document.getElementById('translatorForm'),host=document.getElementById('codexContextMatches');
if(!form||!host)return;
const input=document.getElementById('translatorInput'),mode=document.getElementById('translatorDirection');
const el=(tag,content)=>{const e=document.createElement(tag);if(content!==undefined)e.textContent=content;return e;};
const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[.,:;!?()[\]{}]/g,' ').replace(/\s+/g,' ').trim();
let entries=null;
const render=()=>{
 host.replaceChildren();
 if(mode?.value!=='nh-en'||!input?.value.trim()||!entries)return;
 const normalized=normalize(input.value);if(!normalized)return;
 const matched=entries.filter(item=>{
   const forms=[item.source_reading,item.normalized].map(normalize).filter(Boolean);
   return forms.some(p=>{
    if(p.split(' ').length===1)return normalized===p;
    return normalized===p||normalized.startsWith(p+' ')||normalized.endsWith(' '+p)||normalized.includes(' '+p+' ');
   });
 }).slice(0,4);
 if(!matched.length)return;
 host.append(el('h4','Codex contextual grammar notes — provisional source matches'));
 host.append(el('p','These are cited close-reading interpretations, not an independently checked manuscript transcription or AI-generated fluent translation.'));
 for(const p of matched){
   const card=el('div');card.className='translator-candidate';
   card.append(el('strong',p.source_reading+' — '+p.provisional_english));
   const intro=el('p','Book '+p.book+', fol. '+p.folio+' · source check pending · not training-approved');intro.className='translator-meta';card.append(intro);
   for(const t of p.tokens){const line=el('p',t.surface+' → '+t.lemma+': '+t.gloss+' ['+t.role+']; '+t.morph);line.className='translator-meta';card.append(line);}
   const a=el('a','Open located source');a.href=p.source_url;a.target='_blank';a.rel='noopener noreferrer';card.append(a);
   const note=el('p',p.notes);note.className='translator-caution';card.append(note);
   host.append(card);
 }
};
fetch('./research/florentine_codex/close_reading.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('HTTP '+r.status);return r.json();}).then(doc=>{
 if(doc.format!=='tlahtolli-codex-close-reading'||doc.train_eligible!==false||!Array.isArray(doc.passages))return;
 entries=doc.passages.filter(p=>!p.train_eligible&&p.facsimile_checked===false);
 render();
}).catch(()=>{});
form.addEventListener('submit',render);
input.addEventListener('change',render);
mode?.addEventListener('change',render);
})();