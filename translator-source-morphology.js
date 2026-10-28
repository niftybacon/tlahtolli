/* Tlahtōlli research morphology adapter.
 * Converts EXPLICIT, source-linked editor-reviewed-by-reference token records
 * into UNVERIFIED morphology proposals. This is not productive morphology,
 * independent paleography, a training corpus, or an English translator.
 */
(function(root){
'use strict';
const norm=x=>String(x||'').normalize('NFC').toLocaleLowerCase('en');
const validURL=s=>{try{let u=new URL(s);return ['https:','http:'].includes(u.protocol)&&!!u.hostname;}catch{return false;}};
function create(review){
 const audit=review?.source_crosschecked_morphology;
 const empty=()=>[];
 if(review?.format!=='tlahtolli-source-review-v1'||
   review?.train_eligible!==false||review?.evaluation_eligible!==false||
   review?.admission!=='development_reference_only'||
   review?.knowledge_contamination?.independent_test_eligible!==false||
   audit?.schema!=='tlahtolli-morpheme-evidence-v1'||
   audit?.evidence_level!=='external_source_crosscheck_not_expert_or_facsimile_verified'||
   audit?.training_eligible!==false||audit?.heldout_evaluation_eligible!==false||
   audit?.independent_facsimile_collation!==false||
   audit?.reviewed_by_human_scholar!==false||
   !Array.isArray(audit.claims)||!Array.isArray(audit.token_analyses)||
   audit.claims.length>24||audit.token_analyses.length>40||
   typeof audit.excerpt!=='string'||audit.excerpt.length>8000||
   !validURL(review.library_record_url))return {analyze:empty,sourceCount:0};
 const observed=new Set(audit.excerpt.split(/\s+/u).map(norm).filter(Boolean));
 const claims=new Map();
 for(const claim of audit.claims){
  if(typeof claim?.surface!=='string'||!claim.surface||claims.has(claim.surface)||
   !Array.isArray(claim.evidence)||!claim.evidence.length||
   claim.evidence.some(e=>!validURL(e.url)||typeof e.basis!=='string'||!e.basis.trim()))
   return {analyze:empty,sourceCount:0};
  claims.set(claim.surface,claim);
 }
 const forms=new Map();
 for(const rec of audit.token_analyses){
  if(!rec||typeof rec.surface!=='string'||rec.surface.length>120||
    !observed.has(norm(rec.surface))||typeof rec.lemma!=='string'||!rec.lemma.trim()||
    !Array.isArray(rec.parts)||!rec.parts.length||rec.parts.length>8||
    !Array.isArray(rec.claim_ids)||rec.claim_ids.length!==rec.parts.length||
    rec.parts.join('')!==rec.surface||
    rec.parts.some((v,i)=>typeof v!=='string'||v!==rec.claim_ids[i]||!claims.has(v))||
    typeof rec.reading!=='string'||!rec.reading.trim()||
    typeof rec.note!=='string'||!rec.note.trim()||
    !rec.features||typeof rec.features!=='object'||Array.isArray(rec.features)||
    Object.values(rec.features).some(v=>typeof v!=='string'||v.length>250))
    return {analyze:empty,sourceCount:0}; // fail closed: no half-loaded unverified source
  const sources=[...new Set(rec.claim_ids.flatMap(id=>claims.get(id).evidence.map(e=>e.url)))];
  const candidate={
   lemma:rec.lemma,kind:'Source-crosschecked token hypothesis: '+rec.reading,
   grade:'unreviewed',score:0,
   features:{...rec.features,sourceStatus:'externally compared; not facsimile-verified'},
   parts:rec.parts.map((piece,i)=>({surface:piece,role:claims.get(rec.claim_ids[i]).role+' · '+claims.get(rec.claim_ids[i]).confidence})),
   source:review.library_record_url,locator:review.archive+' · '+review.manuscript_page,
   sources,note:rec.note+' Exact observed printed form only. This is NOT a verified historical segmentation or a sentence translation; no alternate spellings or unseen inflections are generated.'
  };
  const key=norm(rec.surface),list=forms.get(key)||[];list.push(candidate);forms.set(key,list);
 }
 function analyze(token){
  if(typeof token!=='string'||token.length>120)return [];
  return (forms.get(norm(token))||[]).map(p=>({
   ...p,features:{...p.features},parts:p.parts.map(x=>({...x})),sources:p.sources.slice()
  }));
 }
 return {analyze,sourceCount:forms.size};
}
root.TlahtolliSourceMorphology={create};
})(window);
