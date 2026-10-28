/* Tlahtōlli · Manuscript reading aid, NOT image transcription or gold translation.
 * Loads only locally source-controlled source-review metadata: three already
 * published editorial-assisted written forms and provenance, no modern prose.
 */
(function(){
'use strict';
const host=document.getElementById('manuscriptReadingContent');
if(!host)return;
const el=(tag,cls,content)=>{
 const node=document.createElement(tag);
 if(cls)node.className=cls;
 if(content!==undefined)node.textContent=String(content);
 return node;
};
const citeLink=(url,title)=>{
 try{
  const parsed=new URL(url,location.href);
  if(!['https:','http:'].includes(parsed.protocol))return null;
  const a=el('a','',title);a.href=parsed.href;a.target='_blank';
  a.rel='noopener noreferrer';return a;
 }catch{return null;}
};
const button=(label,handler)=>{
 const b=el('button','btn',label);b.type='button';b.addEventListener('click',handler);return b;
};
function inspect(text){
 const area=document.getElementById('translatorInput');
 const form=document.getElementById('translatorForm');
 const dir=document.getElementById('translatorDirection');
 if(!area||!form)return;
 area.value=text;
 if(dir)dir.value='nh-en';
 const profile=document.getElementById('translatorOrthography');
 if(profile)profile.value='general';
 form.requestSubmit();
 area.scrollIntoView({block:'center',behavior:'smooth'});
}
function show(data){
 host.replaceChildren();
 if(data?.format!=='tlahtolli-source-review-v1'||data?.source_id!=='ENL-BC16-1573'||
    data?.train_eligible!==false||data?.evaluation_eligible!==false||
    data?.knowledge_contamination?.published_translation_consulted!==true){
  host.append(el('p','translator-caution','Source record incomplete or not safely marked as non-blind development evidence.'));
  return;
 }
 const meta=el('div','translator-analysis');
 meta.append(el('strong','',data.manuscript_title),
  el('p','translator-meta',data.archive+' · Original sixteenth-century manuscript'));
 meta.append(el('p','translator-caution',
  'Readable aid, NOT a decipherment: the online manuscript raster remains too small for a reliable letter-by-letter reading. The short string below comes from a published editorial transcription already consulted during development.'));
 const links=el('p','readerhint');
 const page=citeLink(data.library_record_url,'Read the editorial transcript on ENL');
 const image=citeLink(data.manuscript_image_url,'Open original manuscript image');
 if(page)links.append(page,document.createTextNode(' · '));
 if(image)links.append(image);
 meta.append(links);
 host.append(meta);
 const sample=data.image_inspection?.minimum_assisted_excerpt;
 if(typeof sample!=='string'||sample.length>120)return;
 host.append(el('p','translator-meta','Small editorial-assisted excerpt · original orthographic marks retained; expansions NOT supplied'));
 host.append(el('p','translator-gloss',sample));
 const actions=el('div','translator-actions');
 actions.append(button('Examine these forms (not a translation)',()=>inspect(sample)));
 host.append(actions);
 host.append(el('p','translator-caution',
  'The editor’s published English translation was already consulted; this manuscript is NOT independent evaluation data. No automatically inferred reading here is a verified historical word, sentence or modern translation.'));
 const observations=Array.isArray(data.provisional_morphological_observations)?
  data.provisional_morphological_observations:[];
 const container=el('div','');
 for(const rec of observations){
  if(typeof rec.surface!=='string')continue;
  const panel=el('details','translator-morph-panel');
  const summary=el('summary','',rec.surface+' · '+(rec.unverified_segmentation||'abbreviation unresolved'));
  panel.append(summary);
  const explanation=el('p','translator-caution',rec.uncertainty||'This written form is not independently verified.');
  panel.append(explanation);
  for(const idea of (Array.isArray(rec.possible_functions)?rec.possible_functions:[]).slice(0,5))
   panel.append(el('p','translator-meta','Possible: '+String(idea)));
  panel.append(el('p','translator-meta',rec.assessment||'Provisional interpretation only.'));
  const references=el('p','readerhint');
  for(const [i,url] of (Array.isArray(rec.source_links)?rec.source_links:[]).slice(0,3).entries()){
   const link=citeLink(url,'Evidence link '+(i+1));
   if(link){if(references.childNodes.length)references.append(document.createTextNode(' · '));references.append(link);}
  }
  panel.append(references);
  panel.append(button('Examine "'+rec.surface+'" in dictionary',()=>inspect(rec.surface)));
  container.append(panel);
 }
 host.append(container);
 host.append(el('p','translator-meta',
  'Source-review record is development-only, not a training or test pair. Ambiguous written abbreviations are deliberately preserved. No complete letter-by-letter facsimile collation has been done.'));
}
fetch('./research/translation_corpus/source_reviews/ENL_BC16_1573.json',{cache:'default'})
 .then(r=>{if(!r.ok)throw Error('HTTP '+r.status);return r.json();})
 .then(show)
 .catch(err=>{host.replaceChildren(el('p','translator-caution',
  'Manuscript review metadata unavailable ('+err.message+'). The ordinary translator remains usable.'));});
})();
