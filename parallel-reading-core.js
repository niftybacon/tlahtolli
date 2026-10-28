/* Manual, local-only parallel reading workspace data model.
 * Users paste any text they can legitimately read; this app ships no full
 * modern editorial translation or automatically generated alignments.
 */
(function(root,factory){
'use strict';
const api=factory();
root.TlahtolliParallelCore=api;
if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:{},function(){
'use strict';
const SOURCE_ID='ENL-BC16-1573';
const SOURCE_URL='https://enl.wired-humanities.org/bc16/elements/bc16a/000';
const FORMAT='tlahtolli-personal-parallel-reading-v1';
const MAX_CHARS=35000,MAX_LINES=150,MAX_LINE_LENGTH=4000,MAX_PAIRS=150;
function lines(value){
 if(typeof value!=='string')throw Error('Text must be a string.');
 if(value.length>MAX_CHARS)throw Error('Text exceeds 35,000 characters; choose a shorter excerpt.');
 const out=value.replace(/\r\n?/g,'\n').split('\n').map(s=>s.trim()).filter(Boolean);
 if(out.length>MAX_LINES)throw Error('Use no more than 150 manually divided lines.');
 if(out.some(s=>s.length>MAX_LINE_LENGTH))throw Error('A line exceeds 4,000 characters; divide it into smaller reading units.');
 return out;
}
function integerIndex(index,length,label){
 if(!Number.isInteger(index)||index<0||index>=length)throw Error(label+' selection is outside the pasted lines.');
 return index;
}
function normalizePair(pair,nahuatl,english){
 if(!pair||typeof pair!=='object')throw Error('Pair must be an object.');
 const n=integerIndex(pair.nahuatl_index,nahuatl.length,'Nahuatl');
 const e=integerIndex(pair.english_index,english.length,'English');
 if(typeof pair.note!=='string'||pair.note.length>500)throw Error('Pair note must be text of at most 500 characters.');
 return {nahuatl_index:n,english_index:e,nahuatl_text:nahuatl[n],
  english_text:english[e],note:pair.note.trim(),
  status:'user_proposed_alignment_unverified'};
}
function normalizePairs(pairs,nahuatl,english){
 if(!Array.isArray(pairs)||pairs.length>MAX_PAIRS)throw Error('Invalid number of manual alignments.');
 const used=new Set();
 return pairs.map(p=>{
  const normalized=normalizePair(p,nahuatl,english);
  const key=normalized.nahuatl_index+':'+normalized.english_index;
  if(used.has(key))throw Error('The same two lines were aligned twice.');
  used.add(key);
  // If imported, text must not be replaced independently of selected indices.
  if(Object.hasOwn(p,'nahuatl_text')&&p.nahuatl_text!==normalized.nahuatl_text)
   throw Error('Imported Nahuatl line does not match its selected source line.');
  if(Object.hasOwn(p,'english_text')&&p.english_text!==normalized.english_text)
   throw Error('Imported English line does not match its selected source line.');
  if(Object.hasOwn(p,'status')&&p.status!=='user_proposed_alignment_unverified')
   throw Error('Cannot import an automatically approved or training-ready alignment.');
  return normalized;
 });
}
function createProject(original,translated,pairs=[],timestamp=null){
 const nahuatl=lines(original),english=lines(translated);
 if(!nahuatl.length||!english.length)throw Error('Paste at least one Nahuatl line and one English line.');
 const entries=normalizePairs(pairs,nahuatl,english);
 return {
  format:FORMAT,source_id:SOURCE_ID,source_url:SOURCE_URL,
  manuscript_reference:'AGN Tierras 1735, exp. 2, f. 122 (1573)',
  original_pasted_text:original,english_pasted_text:translated,
  nahuatl_lines:nahuatl,english_lines:english,alignments:entries,
  source_basis:'User-pasted editorial transcription and published English translation; not independently collated to facsimile.',
  review_status:'personal_unverified',transcription_verified:false,
  translation_verified:false,alignment_verified:false,
  published_translation_rights:'not_verified',
  train_eligible:false,evaluation_eligible:false,independent_test_eligible:false,
  created_at:timestamp||new Date().toISOString(),
  caution:'Personal annotation only. Pairing two lines does not demonstrate literal equivalence, correct morphology, rights clearance or translation accuracy.'
 };
}
function importProject(value){
 if(!value||typeof value!=='object'||Array.isArray(value)||value.format!==FORMAT||
  value.source_id!==SOURCE_ID||value.source_url!==SOURCE_URL||
  value.train_eligible!==false||value.evaluation_eligible!==false||
  value.independent_test_eligible!==false||value.alignment_verified!==false||
  value.translation_verified!==false||value.transcription_verified!==false||
  value.review_status!=='personal_unverified'||value.published_translation_rights!=='not_verified')
  throw Error('This is not a compatible, unverified personal reading export.');
 const project=createProject(value.original_pasted_text,value.english_pasted_text,value.alignments,value.created_at);
 if(JSON.stringify(project.nahuatl_lines)!==JSON.stringify(value.nahuatl_lines)||
  JSON.stringify(project.english_lines)!==JSON.stringify(value.english_lines))
  throw Error('Imported line segmentation was changed or corrupted.');
 return project;
}
return {SOURCE_ID,SOURCE_URL,FORMAT,lines,normalizePairs,createProject,importProject};
});