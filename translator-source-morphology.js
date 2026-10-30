/* Tlahtōlli research morphology adapter.
 * Converts EXPLICIT, source-linked editor-reviewed-by-reference token records
 * into UNVERIFIED morphology proposals. This is not productive morphology,
 * independent paleography, a training corpus, or an English translator.
 */
(function(root){
'use strict';
const norm=x=>String(x||'').normalize('NFC').toLocaleLowerCase('en');
const validURL=s=>{try{let u=new URL(s);return ['https:','http:'].includes(u.protocol)&&!!u.hostname;}catch{return false;}};
function create(review,exactLexicalEvidence){
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

 // Optional, source-located LEXICAL written-form leads. These are not
 // productive morphology and never certify a headword, contextual syntax,
 // individual manuscript transcription, translation pair or English sense.
 // A rejected optional pack does not disrupt the existing ENL morphology.
 const exactLexical=new Map();
 const expected=new Map([
  ["yehuan",{id:"odn-lockhart-yehuan-short-pronoun-form",
   lemma:"yehuantin",category:"independent-pronoun-form",
   url:"https://nahuatl.wired-humanities.org/content/yehuantin",
   sourceLocator:"Lockhart, Nahuatl as Written (2001), p. 242; Online Nahuatl Dictionary lists orthographic short form yehuan",
   corroboratingURL:"https://gdn.iib.unam.mx/diccionario/yehuan/188287",
   corroboratingLocator:"UNAM Gran Diccionario Nahuatl, Docs_México 1557 and historic index entries; separately records written yeuan, not an automatic equivalent",
   caveat:"The printed Brinton expression yehuan Dios has unresolved referent, scope and clause role; the dictionary form cannot itself license the English pronoun they for that stanza.",
   alternate:"yeuan"}],
  ["tepilhuan",{id:"odn-molina-tepilhuan-headword",
   lemma:"tepilhuan",category:"historical-lexicographic-noun-form",
   url:"https://nahuatl.wired-humanities.org/node/188794",
   sourceLocator:"Molina, Vocabulario (1571), Part II, fol. 103r, col. 1, via Online Nahuatl Dictionary (Joe Campbell transcription)",
   corroboratingURL:"https://nahuatl.wired-humanities.org/content/tepiltzin",
   corroboratingLocator:"Related honorific/kindred lemma entry is separate lexicographic context, not evidence of a global substitution or stem paradigm",
   caveat:"The cited noun has children/offspring senses, while an original poetic audience or social honorific interpretation requires separate contextual review; no automatic children English rendering.",
   alternate:"tepiltzin"}]
 ]);
 const pack=exactLexicalEvidence;
 if(pack?.format==='tentli-exact-historical-lexical-leads-v1'&&
    pack.version===1&&pack.human_source_review_independently_authenticated===false&&
    pack.facsimile_collation_independently_done===false&&
    pack.new_canonical_dictionary_headwords===0&&
    pack.new_productive_morphological_rules===0&&
    pack.train_eligible===false&&pack.silver_approved===false&&
    pack.gold_approved===false&&Array.isArray(pack.records)&&
    pack.records.length===expected.size){
  let admissible=true;
  for(const item of pack.records){
   const known=expected.get(item?.written_form);
   if(!known||exactLexical.has(item.written_form)||
     item.id!==known.id||item.lexicographic_lemma!==known.lemma||
     item.candidate_category!==known.category||
     item.source_url!==known.url||
     item.notable_non_equivalent_spelling!==known.alternate||
     item.source_locator!==known.sourceLocator||
     item.corroborating_source_url!==known.corroboratingURL||
     item.corroborating_locator!==known.corroboratingLocator||
     item.contextual_caveat!==known.caveat||
     item.status!=='source-indexed exact written-form hypothesis; not an independently adjudicated grammatical or contextual analysis'||
     item.lemma_meaning_newly_approved!==false||
     item.stanza_translation_verified!==false||
     item.grammatical_role_verified!==false||
     item.morphological_segmentation_verified!==false||
     item.whole_original_manuscript_reading_verified!==false){
    admissible=false;break;
   }
   exactLexical.set(norm(item.written_form),{
    lemma:item.lexicographic_lemma,
    kind:'Source-indexed exact lexical written form (NOT morphology)',
    grade:'unreviewed',score:0,
    features:{category:'unreviewed-lexical-surface-only',
     candidateCategory:item.candidate_category,
     grammarRole:'unresolved',referent:'unresolved',
     morphologicalSegmentation:'not-verified',
     originalManuscriptCollation:'not-verified'},
    parts:[{surface:item.written_form,role:'exact external lexicographic written form; no morpheme analysis'}],
    source:item.source_url,locator:item.source_locator,
    sources:[item.source_url,item.corroborating_source_url],
    note:item.contextual_caveat+' Exact original spelling only. No new canonical lemma, sentence meaning, person, noun possession, inflectional rule, macron restoration, or blanket historical spelling rewrite.'
   });
  }
  if(!admissible||exactLexical.size!==expected.size)exactLexical.clear();
 }
 function analyze(token){
  if(typeof token!=='string'||token.length>120)return [];
  return [...(forms.get(norm(token))||[]),...(exactLexical.has(norm(token))?[exactLexical.get(norm(token))]:[])]
   .map(p=>({...p,features:{...p.features},parts:p.parts.map(x=>({...x})),sources:p.sources.slice()}));
 }
 return {analyze,sourceCount:forms.size,exactLexicalFormCount:exactLexical.size};
}
root.TlahtolliSourceMorphology={create};
})(window);
