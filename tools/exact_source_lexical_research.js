'use strict';
/* Research-only adapter over TlahtolliSourceMorphology, NOT an alternative
 * parser/lexicon, generated dictionary, training dataset or deployed script.
 * Preserves exact original written evidence without promoting grammar/English.
 */
const KIND='Source-indexed exact lexical written form (NOT morphology)';
const expected=new Map([
  ["yehuan",{id:"odn-lockhart-yehuan-short-pronoun-form",lemma:"yehuantin",
   category:"independent-pronoun-form",source:"https://nahuatl.wired-humanities.org/content/yehuantin",
   locator:"Lockhart, Nahuatl as Written (2001), p. 242; Online Nahuatl Dictionary lists orthographic short form yehuan",corroboratingSource:"https://gdn.iib.unam.mx/diccionario/yehuan/188287",
   corroboratingLocator:"UNAM Gran Diccionario Nahuatl, Docs_México 1557 and historic index entries; separately records written yeuan, not an automatic equivalent",
   caveat:"The printed Brinton expression yehuan Dios has unresolved referent, scope and clause role; the dictionary form cannot itself license the English pronoun they for that stanza.",nonEquivalent:"yeuan"}],
  ["tepilhuan",{id:"odn-molina-tepilhuan-headword",lemma:"tepilhuan",
   category:"historical-lexicographic-noun-form",source:"https://nahuatl.wired-humanities.org/node/188794",
   locator:"Molina, Vocabulario (1571), Part II, fol. 103r, col. 1, via Online Nahuatl Dictionary (Joe Campbell transcription)",corroboratingSource:"https://nahuatl.wired-humanities.org/content/tepiltzin",
   corroboratingLocator:"Related honorific/kindred lemma entry is separate lexicographic context, not evidence of a global substitution or stem paradigm",
   caveat:"The cited noun has children/offspring senses, while an original poetic audience or social honorific interpretation requires separate contextual review; no automatic children English rendering.",nonEquivalent:"tepiltzin"}]
]);
const norm=s=>String(s||'').normalize('NFC').toLocaleLowerCase('en');
function create(existing,sourcePack){
 if(typeof existing?.analyze!=='function')throw Error('Original canonical source morphology adapter is required');
 const corpus=new Map();
 const doc=sourcePack;
 if(doc?.format==='tentli-exact-historical-lexical-leads-v1'&&doc.version===1&&
    doc.human_source_review_independently_authenticated===false&&
    doc.facsimile_collation_independently_done===false&&
    doc.new_canonical_dictionary_headwords===0&&
    doc.new_productive_morphological_rules===0&&
    doc.train_eligible===false&&doc.silver_approved===false&&doc.gold_approved===false&&
    Array.isArray(doc.records)&&doc.records.length===expected.size){
  let valid=true;
  for(const item of doc.records){
   const known=expected.get(item?.written_form);
   if(!known||corpus.has(item.written_form)||
      item.id!==known.id||item.lexicographic_lemma!==known.lemma||
      item.candidate_category!==known.category||
      item.source_url!==known.source||item.source_locator!==known.locator||
      item.corroborating_source_url!==known.corroboratingSource||
      item.corroborating_locator!==known.corroboratingLocator||
      item.contextual_caveat!==known.caveat||
      item.notable_non_equivalent_spelling!==known.nonEquivalent||
      item.status!=='source-indexed exact written-form hypothesis; not an independently adjudicated grammatical or contextual analysis'||
      item.lemma_meaning_newly_approved!==false||
      item.stanza_translation_verified!==false||
      item.grammatical_role_verified!==false||
      item.morphological_segmentation_verified!==false||
      item.whole_original_manuscript_reading_verified!==false){
    valid=false;break;
   }
   corpus.set(norm(item.written_form),{
    lemma:item.lexicographic_lemma,kind:KIND,grade:'unreviewed',score:0,
    features:{category:'unreviewed-lexical-surface-only',
     candidateCategory:item.candidate_category,
     grammarRole:'unresolved',referent:'unresolved',
     morphologicalSegmentation:'not-verified',
     originalManuscriptCollation:'not-verified'},
    parts:[{surface:item.written_form,
     role:'exact external lexicographic written form; no morpheme analysis'}],
    source:item.source_url,locator:item.source_locator,
    sources:[item.source_url,item.corroborating_source_url],
    note:item.contextual_caveat+' Exact original spelling only. No new canonical lemma, sentence meaning, person, noun possession, inflectional rule, macron restoration, or blanket historical spelling rewrite.'
   });
  }
  if(!valid||corpus.size!==expected.size)corpus.clear();
 }
 function analyze(token){
  const base=existing.analyze(token);
  const lex=typeof token==='string'&&token.length<=120?corpus.get(norm(token)):null;
  const result=[...(Array.isArray(base)?base:[]),...(lex?[lex]:[])];
  return result.map(m=>({...m,
    features:m.features?{...m.features}:m.features,
    parts:Array.isArray(m.parts)?m.parts.map(x=>({...x})):m.parts,
    sources:Array.isArray(m.sources)?m.sources.slice():m.sources}));
 }
 return {analyze,sourceCount:existing.sourceCount,
  exactLexicalFormCount:corpus.size,
  sourceClass:'read-only source-indexed lexical evidence wrapper; not canonical morphology'};
}
module.exports={create,KIND};
