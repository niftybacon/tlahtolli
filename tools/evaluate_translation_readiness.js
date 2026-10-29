#!/usr/bin/env node
// Tlahtōlli: evaluation-readiness audit, NOT a translation accuracy benchmark.
// Source-controlled corpus candidates are not independent ground truth.
// No source-linked example is used as a known-answer translation.
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ROOT=path.join(__dirname,'..');
const BASE=path.join(ROOT,'research','translation_corpus');
const REVIEWS=path.join(BASE,'source_reviews');
const FIELDS=['pair_id','source_id','source_title','source_url','folio_or_segment',
 'source_date','source_region','nahuatl_variety','original_orthography','normalized_nahuatl',
 'translation_text','translation_language','translator_or_editor','translation_source_url',
 'alignment_type','original_rights','translation_rights','transcription_reviewed_by',
 'translation_reviewed_by','review_status','split_group','split','notes'];
const RIGHTS=new Set(['public_domain','cc0','cc_by_4_0','permission_documented']);
const SPLITS=new Set(['train','dev','test']);
function parseCsv(source){
 const s=String(source).replace(/^\uFEFF/,'');
 const rows=[];let row=[],field='',quoted=false,closing=false;
 for(let i=0;i<s.length;i++){
  const c=s[i];
  if(quoted){
   if(c==='"'){
    if(s[i+1]==='"'){field+='"';i++;}
    else {quoted=false;closing=true;}
   }else field+=c;
  }else if(c===','||c==='\n'||c==='\r'){
   row.push(field);field='';closing=false;
   if(c!==','){
    if(c==='\r'&&s[i+1]==='\n')i++;
    if(row.some(x=>x!==''))rows.push(row);
    row=[];
   }
  }else if(c==='"'&&!field&&!closing)quoted=true;
  else if(closing&&c!==' '&&c!=='\t')throw Error('Unexpected characters after CSV closing quote');
  else if(!closing)field+=c;
 }
 if(quoted)throw Error('Unclosed CSV quoted field');
 if(field||row.length){row.push(field);rows.push(row);}
 if(!rows.length)throw Error('Empty CSV');
 const headings=rows.shift();
 if(headings.length!==FIELDS.length||headings.some((h,i)=>h!==FIELDS[i]))throw Error('pairs.csv schema mismatch');
 return rows.map((r,i)=>{
  if(r.length!==headings.length)throw Error('CSV row '+(i+2)+' has '+r.length+' columns instead of '+headings.length);
  return Object.fromEntries(headings.map((h,j)=>[h,r[j]]));
 });
}
function clean(s){return String(s||'').normalize('NFC').trim();}
function fingerprint(s){
 return clean(s).toLocaleLowerCase('en').normalize('NFD')
  .replace(/[\u0300-\u036f]/g,'')
  .replace(/[^\p{L}\p{M}]+/gu,' ').trim().replace(/\s+/g,' ');
}
function isUrl(s){try{const u=new URL(s);return ['https:','http:'].includes(u.protocol)&&!!u.hostname&&!u.username&&!u.password;}catch{return false;}}
function humanReview(s){const v=clean(s);return v.length>=2&&!/^(?:ai|ai-only|automated|machine|model|chatgpt|gpt|unknown|pending|unreviewed|n\/a)$/i.test(v);}
function loadSourceReviews(dir=REVIEWS){
 if(!fs.existsSync(dir))return [];
 return fs.readdirSync(dir).filter(name=>name.endsWith('.json')).sort()
  .map(name=>JSON.parse(fs.readFileSync(path.join(dir,name),'utf8')));
}
// The repository already stores development excerpts outside research_examples.json.
// Excluding only known pair IDs was not enough: a different folio/alias from a
// previously consulted work could be falsely advertised as independent gold.
function sourceWorkKey(input){
 if(!isUrl(input))return null;
 const u=new URL(input),host=u.hostname.toLowerCase().replace(/^www\./u,'');
 const p=decodeURI(u.pathname).toLowerCase().replace(/\/+$/u,'');
 // The twelve Florentine books are one heavily used development work.
 // Language-prefixed /es/ and /en/ routes are still the same codex.
 if(host==='florentinecodex.getty.edu'&&
    /^(?:\/(?:en|es))?\/book\/\d+(?:\/|$)/u.test(p))
  return 'work:florentine-codex';
 // ENL is an archive of many DISTINCT manuscripts: group only the specific
 // BC16a unit, never every manuscript on the ENL host.
 if(host==='enl.wired-humanities.org'){
  const id=p.match(/\/bc\d+\/elements\/(bc\d+[a-z])\/\d+(?:\/|$)/u)||
   p.match(/\/mapaimages\/(bc\d+[a-z])\d+\.png$/u);
  if(id)return 'enl-manuscript:'+id[1];
 }
 // General fallback: explicit URL identity, ignoring query and fragment.
 // Mirrors and unknown document aliases still need independent human checking.
 return host+p;
}
function loadDevelopmentPassages(){
 const file=path.join(ROOT,'data','passages.json');
 return fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):{records:[]};
}
function loadKnownHistoricalEditions(){
 const file=path.join(BASE,'luke_1833_source.json');
 return fs.existsSync(file)?[JSON.parse(fs.readFileSync(file,'utf8'))]:[];
}
function developmentSourceIndex(examples,sourceReviews,
 passages=loadDevelopmentPassages(),editions=loadKnownHistoricalEditions()){
 const sourceIds=new Set(),works=new Set(),windows=[];
 const addText=(text,origin)=>{
  if(typeof text!=='string'||!text.trim()||/[\[\]]/u.test(text))return;
  const key=fingerprint(text);
  if(key)windows.push({key,tokens:key.split(' '),origin});
 };
 const addSource=(id,url)=>{
  if(typeof id==='string'&&id.trim())sourceIds.add(id.trim().toLowerCase());
  const key=sourceWorkKey(url);if(key)works.add(key);
 };
 for(const e of Array.isArray(examples?.entries)?examples.entries:[]){
  addSource(e?.source_id,e?.source_url);
  addText(e?.original,'public-research-example');addText(e?.normalized,'public-research-example');
 }
 for(const e of Array.isArray(passages?.records)?passages.records:[]){
  addSource(e?.source_id,e?.reader?.source);
  addText(e?.original,'existing-manuscript-reading');
  addText(e?.normalized,'existing-manuscript-reading');
 }
 for(const e of sourceReviews||[]){
  addSource(e?.source_id,e?.library_record_url);
  addSource(e?.source_id,e?.manuscript_image_url);
  addSource(e?.source_id,e?.library_document_url);
  addText(e?.image_inspection?.minimum_assisted_excerpt,'consulted-source-review');
  addText(e?.source_crosschecked_morphology?.excerpt,'consulted-source-review');
 }
 for(const e of editions||[]){
  addSource(e?.id,e?.primary_scan);addSource(e?.id,e?.archive_source);
  addText(e?.example_original_title_tokens,'used-historical-edition');
 }
 return {sourceIds,works,windows};
}
function overlapsConsultedText(input,windows){
 const key=fingerprint(input);if(!key)return null;
 const tokens=key.split(' ');
 for(const row of windows){
  if(key===row.key)return row.origin;
  // Four consecutive normalized source words reveal a copied/excerpted
  // development window even after extra surrounding words are added.
  // Shorter sequences require an EXACT match to limit false positives.
  if(tokens.length<4||row.tokens.length<4)continue;
  const shorter=tokens.length<=row.tokens.length?tokens:row.tokens;
  const longer=tokens.length<=row.tokens.length?row.tokens:tokens;
  for(let i=0;i+4<=shorter.length;i++){
   const chunk=shorter.slice(i,i+4).join(' ');
   for(let j=0;j+4<=longer.length;j++)
    if(longer.slice(j,j+4).join(' ')===chunk)return row.origin;
  }
 }
 return null;
}
function audit(pairs,examples,sourceReviews=[],developmentPassages=loadDevelopmentPassages(),editions=loadKnownHistoricalEditions()){

 const errors=[],seen=new Set(),sourceSplits=new Map(),groupSplits=new Map(),textSplits=new Map(),workSplits=new Map();
 const development=developmentSourceIndex(examples,sourceReviews,developmentPassages,editions);
 const candidates=Array.isArray(examples?.entries)?examples.entries:[];
 const knownSources=new Set(),knownText=new Set();
 const inspectedSources=new Set();
 for(const review of sourceReviews){
  if(review?.format!=='tlahtolli-source-review-v1'||!clean(review.source_id))
   errors.push('Development source review lacks recognized format or source ID');
  const id=clean(review?.source_id);
  if(inspectedSources.has(id))errors.push('Duplicate development source review '+id);
  if(id)inspectedSources.add(id);
  if(review?.train_eligible!==false||review?.evaluation_eligible!==false||
    review?.knowledge_contamination?.independent_test_eligible!==false||
    review?.admission!=='development_reference_only')
   errors.push('Inspected development source cannot be promoted to gold/training without independent reassessment: '+id);
  if(!isUrl(review?.manuscript_image_url)||!isUrl(review?.library_record_url))
   errors.push('Development source must link manuscript image and archival record: '+id);
  if(!review?.archive||!review?.manuscript_page||!review?.historical_date)
   errors.push('Development source lacks stable archive, folio, or date: '+id);
  if(review?.image_inspection?.snippet_translation!==null)
   errors.push('Development source snippet must not contain an unreviewed translation: '+id);
  if(review?.knowledge_contamination?.published_translation_consulted!==true)
   errors.push('Document explicitly whether the published translation has been consulted: '+id);
  const checked=review?.source_crosschecked_morphology;
  if(checked){
   if(checked.schema!=='tlahtolli-morpheme-evidence-v1'||
    checked.excerpt!==review.image_inspection?.minimum_assisted_excerpt||
    checked.training_eligible!==false||checked.heldout_evaluation_eligible!==false||
    checked.independent_facsimile_collation!==false||
    checked.reviewed_by_human_scholar!==false||
    checked.evidence_level!=='external_source_crosscheck_not_expert_or_facsimile_verified')
    errors.push('External morphology record must preserve unverified, non-gold source status: '+id);
   if(!Array.isArray(checked.claims)||!checked.claims.length||checked.claims.length>20)
    errors.push('External morphology requires bounded, cited morpheme claims: '+id);
   else for(const [j,claim] of checked.claims.entries()){
    if(!clean(claim?.surface)||!clean(claim?.role)||!clean(claim?.confidence)||
     !clean(claim?.unresolved)||!Array.isArray(claim?.functions)||!claim.functions.length||
     !Array.isArray(claim?.evidence)||!claim.evidence.length||claim.evidence.length>5||
     claim.evidence.some(e=>!isUrl(e?.url)||!clean(e?.basis)))
     errors.push('External morphology claim lacks provenance or unresolved constraints: '+id+' claim '+(j+1));
   }
   const tokenAnalyses=checked.token_analyses;
   const witnessed=new Set(String(checked.excerpt||'').split(/\s+/u).map(x=>x.normalize('NFC').toLowerCase()));
   const claimIds=new Set((Array.isArray(checked.claims)?checked.claims:[]).map(x=>x.surface));
   if(!Array.isArray(tokenAnalyses)||!tokenAnalyses.length||tokenAnalyses.length>40)
    errors.push('External source must declare bounded, incomplete token-level morphology: '+id);
   else for(const [j,analysis] of tokenAnalyses.entries()){
    const fragments=analysis?.parts,refs=analysis?.claim_ids;
    if(!clean(analysis?.surface)||!witnessed.has(clean(analysis.surface).normalize('NFC').toLowerCase())||
     !clean(analysis?.lemma)||!clean(analysis?.reading)||!clean(analysis?.note)||
     !Array.isArray(fragments)||!fragments.length||fragments.length>8||
     !Array.isArray(refs)||refs.length!==fragments?.length||
     fragments.join('')!==analysis.surface||fragments.some((part,k)=>refs[k]!==part||!claimIds.has(part))||
     !analysis.features||typeof analysis.features!=='object'||Array.isArray(analysis.features)||
     Object.values(analysis.features).some(v=>typeof v!=='string'||v.length>250))
     errors.push('Morphological token proposal is ungrounded in source spellings or morpheme claims: '+id+' analysis '+(j+1));
   }
  }
 }
 for(const e of candidates){
  if(e?.source_id)knownSources.add(clean(e.source_id));
  for(const v of [e?.original,e?.normalized]){const k=fingerprint(v);if(k)knownText.add(k);}
  if(e?.train_eligible!==false||e?.review_status==='approved')errors.push('A display-only research example is incorrectly marked approved');
 }
 let approvedTest=0,approvedNonTest=0,unapproved=0;
 for(const [i,row] of pairs.entries()){
  const label='pair '+(clean(row.pair_id)||('#'+(i+1)));
  if(!clean(row.pair_id)||seen.has(row.pair_id))errors.push(label+': missing or duplicate ID');
  seen.add(row.pair_id);
  const split=clean(row.split),source=clean(row.source_id),group=clean(row.split_group);
  const original=fingerprint(row.original_orthography),normalized=fingerprint(row.normalized_nahuatl);
  if(split&&!SPLITS.has(split))errors.push(label+': unsupported split');
  if(row.review_status!=='approved'){
   unapproved++;
   if(split)errors.push(label+': unapproved record assigned to '+split);
   continue;
  }
  if(split==='test')approvedTest++;else approvedNonTest++;
  if(!split)errors.push(label+': approved record missing split');
  if(!source||!group)errors.push(label+': approved record needs source_id and split_group');
  if(row.nahuatl_variety!=='Classical Nahuatl')errors.push(label+': non-Classical variety cannot be benchmarked');
  for(const key of ['original_rights','translation_rights']){
   if(!RIGHTS.has(clean(row[key])))errors.push(label+': '+key+' not cleared');
  }
  for(const key of ['source_url','translation_source_url']){
   if(!isUrl(row[key]))errors.push(label+': invalid '+key);
  }
  for(const key of ['source_title','source_date','source_region','folio_or_segment','original_orthography',
   'normalized_nahuatl','translation_text','translation_language','translator_or_editor','alignment_type']){
   if(!clean(row[key]))errors.push(label+': missing '+key);
  }
  if(!humanReview(row.transcription_reviewed_by)||!humanReview(row.translation_reviewed_by))
   errors.push(label+': named independent human transcription/translation reviews required');
  const work=sourceWorkKey(row.source_url);
  if(work&&split){
   if(workSplits.has(work)&&workSplits.get(work)!==split)
    errors.push(label+': source work crosses train/dev/test even with renamed source_id or split_group');
   workSplits.set(work,split);
  }
  // Preserve the *whole manuscript/source* in one split, not a random folio.
  for(const [map,key,name] of [[sourceSplits,source,'source_id'],[groupSplits,group,'split_group'],
   [textSplits,original,'original surface'],[textSplits,normalized,'normalized surface']]){
   if(!key||!split)continue;
   if(map.has(key)&&map.get(key)!==split)errors.push(label+': '+name+' crosses train/dev/test');
   map.set(key,split);
  }
  if(split==='test'){
   if(knownSources.has(source))errors.push(label+': test source_id occurs in public translator research examples');
   if(inspectedSources.has(source))errors.push(label+': test source_id already inspected and contaminated as a development source');
   if(knownText.has(original)||knownText.has(normalized))
    errors.push(label+': test input overlaps public research examples');
   if(development.sourceIds.has(source.toLowerCase()))
    errors.push(label+': test source ID was already used in another development resource');
   if(work&&development.works.has(work))
    errors.push(label+': test document/work already consulted in Tlahtōlli development');
   const contaminated=overlapsConsultedText(row.original_orthography,development.windows)||
    overlapsConsultedText(row.normalized_nahuatl,development.windows);
   if(contaminated)
    errors.push(label+': test text overlaps '+contaminated+' (not independent held-out evidence)');
  }
 }
 return {errors,counts:{pairs:pairs.length,approved_test:approvedTest,approved_other:approvedNonTest,
  pending:unapproved,public_preview_examples:candidates.length,
  inspected_development_sources:sourceReviews.length},
  readiness:errors.length?'invalid':approvedTest?'metadata_eligible_unscored':'no_heldout_gold',
  translation_accuracy:null,
  accuracy_reason:'No independently collected human judgments of the engine output exist. Lexical/sentence candidate coverage is not translation accuracy.'};
}
function loadModel(file,name){
 const scope={window:{},URL};
 vm.runInNewContext(fs.readFileSync(path.join(ROOT,file),'utf8'),scope,{filename:file});
 if(!scope.window[name])throw Error(file+' did not expose '+name);
 return scope.window[name];
}
function probeExamples(examples){
 // Remove known historical phrase candidates from the translator model:
 // otherwise recognizing one of our own stored examples would be leakage.
 const dictionary=JSON.parse(fs.readFileSync(path.join(ROOT,'dictionary.json'),'utf8'));
 const paradigms=JSON.parse(fs.readFileSync(path.join(ROOT,'paradigms.json'),'utf8'));
 const lex=loadModel('translator-engine.js','TlahtolliTranslator').create(dictionary,{entries:[]});
 const sentences=loadModel('translator-sentence.js','TlahtolliSentence').create(dictionary,paradigms);
 return examples.entries.map(e=>{
  const result=lex.analyze(e.original,'nh-en');
  const sent=sentences.analyze(e.original);
  return {id:e.id,source_id:e.source_id,
   classification:'IN-SAMPLE DIAGNOSTIC ONLY: public source-linked candidate; not ground truth',
   original_input:e.original,
   lexical_total:result.stats.total,curated_matched:result.stats.matched,
   unknown:result.stats.unknown,approximate:result.stats.approximate,
   ambiguous_entries:result.stats.ambiguous,
   unresolved_senses:result.stats.senseAmbiguities,
   vowel_length_conflicts:result.stats.orthographyConflicts,
   grammar_candidate_available:sent.complete,
   stored_passage_match_count:result.passages.length};
 });
}
function probeDevelopmentSources(reviews){
 // Orthographic tokenization and lookup only. We have already seen published
 // commentary for these sources; none is independent sentence-level gold.
 const dictionary=JSON.parse(fs.readFileSync(path.join(ROOT,'dictionary.json'),'utf8'));
 const lex=loadModel('translator-engine.js','TlahtolliTranslator').create(dictionary,{entries:[]});
 return reviews.map(r=>{
  const fragment=r.image_inspection?.minimum_assisted_excerpt||'';
  const result=lex.analyze(fragment,'nh-en');
  return {id:r.id,source_id:r.source_id,
   classification:'EDITORIAL-ASSISTED DEVELOPMENT DIAGNOSTIC; NOT BLIND; NEVER GOLD',
   excerpt_basis:r.image_inspection?.excerpt_basis||'',
   abbreviation_unresolved:/[¯\u0304]/u.test(fragment),
   fragment,
   tokenization:result.parts.filter(part=>part.kind==='word')
    .map(part=>({written_token:part.value,lookup_status:part.status,
     candidate_count:part.candidates.length,orthographyConflict:!!part.orthographyConflict})),
   dictionary_matches:result.stats.matched,
   dictionary_unknown:result.stats.unknown,
   translation_accuracy:null,
   caution:'The shorthand y¯ has unresolved abbreviation/segmentation. Token counts are mechanical, not verified word or grammatical coverage. Translation not assessed.'};
 });
}
function main(){
 const pairs=parseCsv(fs.readFileSync(path.join(BASE,'pairs.csv'),'utf8'));
 const examples=JSON.parse(fs.readFileSync(path.join(BASE,'research_examples.json'),'utf8'));
 const reviews=loadSourceReviews();
 const report={format:'tlahtolli-evaluation-readiness-v1',...audit(pairs,examples,reviews)};
 if(!report.errors.length){
  report.in_sample_diagnostics=probeExamples(examples);
  report.development_source_diagnostics=probeDevelopmentSources(reviews);
 }
 if(process.argv.includes('--json'))console.log(JSON.stringify(report,null,2));
 else {
  console.log('Independent translation-quality readiness: '+report.readiness);
  console.log('Approved held-out pairs: '+report.counts.approved_test+
   '; public, non-gold display examples: '+report.counts.public_preview_examples+
   '; inspected non-blind development sources: '+report.counts.inspected_development_sources);
  console.log('Translation accuracy: NOT MEASURABLE (null).');
  if(report.in_sample_diagnostics)for(const r of report.in_sample_diagnostics)
   console.log('Preview-only '+r.id+': curated lexical matches '+r.curated_matched+'/'+r.lexical_total+
    ', grammar candidate '+r.grammar_candidate_available+'; NOT a translation-quality score');
  if(report.development_source_diagnostics)for(const r of report.development_source_diagnostics)
   console.log('Editorial-assisted, non-blind '+r.source_id+': mechanical dictionary matches '+
    r.dictionary_matches+'/'+(r.dictionary_matches+r.dictionary_unknown)+
    ', abbreviation unresolved '+r.abbreviation_unresolved+'; NOT translation accuracy');
  for(const err of report.errors)console.error('ERROR: '+err);
 }
 if(report.errors.length)process.exitCode=1;
 return report;
}
if(require.main===module)main();
module.exports={parseCsv,fingerprint,audit,probeExamples,probeDevelopmentSources,loadSourceReviews,
 sourceWorkKey,developmentSourceIndex,overlapsConsultedText};
