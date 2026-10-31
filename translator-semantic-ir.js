/* Tlahtōlli · source-gated semantic preservation contract (Phase 1, Issue #95).
 *
 * This is a read-only audit of the EXISTING source-aware sentence parser,
 * grammar IR and English realizer. Not a second parser, semantic oracle or
 * independent expert translation scorer. Recomputes source-authorized options
 * and refuses to bless stale/edited English, roles or provenance.
 */
(function(root){
'use strict';
const PERSONS=['1sg','2sg','3sg','1pl','2pl','3pl'];
const ALLOWED=new Set(['finite','headed-relative','relational-location']);
function create(sentence,english,grammarIR){
 if(typeof sentence?.analyze!=='function'||typeof english?.compose!=='function'||
    typeof english?.render!=='function'||typeof grammarIR?.build!=='function'||
    typeof grammarIR?.auditEnglish!=='function')throw Error('Existing canonical engines required');
 const serialize=x=>JSON.stringify(x);
 // Independent lexical-surface ledger: reanalysis alone cannot detect a
 // shared parser/composer mistake that silently drops an original word.
 // This does NOT resolve punctuation, lexical senses or contextual meaning.
 const sourceWords=text=>String(text||'').normalize('NFC')
  .match(/[\\p{L}\\p{M}’'\\-\\u00AF]+/gu)||[];
 function allSourceWordsAccountedFor(input,units,joins){
  const expected=sourceWords(input),accounted=[];
  for(let i=0;i<units.length;i++){
   accounted.push(...sourceWords(units[i]?.written));
   if(i<joins.length&&joins[i]?.written!=='punctuation')
    accounted.push(...sourceWords(joins[i]?.written));
  }
  return expected.length>0&&serialize(expected)===serialize(accounted);
 }
 const fail=reason=>({available:false,version:'tentli-semantic-contract-v1',
  verifiedTranslation:false,reason,composition:null,units:[],optionsChecked:0});
 function event(frame,sourceUrls){
  if(!frame||typeof frame.predicate!=='string'||!frame.predicate||
     !Number.isInteger(frame.subjectPerson)||frame.subjectPerson<0||
     frame.subjectPerson>=PERSONS.length||
     typeof frame.tense!=='string'||typeof frame.negative!=='boolean')
   return null;
  if(typeof frame.subject!=='string'||!frame.subject.trim()||
     (frame.object!==null&&typeof frame.object!=='string'))return null;
  const objectKind=frame.objectNoun!==null&&frame.objectNoun!==undefined?
   'overt-nominal':frame.object==='someone'||frame.object==='something'?
   'indefinite':frame.object?'unresolved-third-person-or-other':'none';
  return Object.freeze({
   predicateLemma:frame.predicate,
   person:PERSONS[frame.subjectPerson],
   tense:frame.tense,
   polarity:frame.negative?'negative':'affirmative',
   subject:{person:PERSONS[frame.subjectPerson],overtNoun:frame.subjectNoun||null,
    referent:'unresolved',gender:'unresolved'},
   object:{kind:objectKind,overtNoun:frame.objectNoun||null,
    existingEnglishSurface:frame.object,referent:'unresolved'},
   morphologicalGrade:frame.morphologyEvidence?.grade||'indexed-source-grammar',
   evidenceSources:sourceUrls.slice(0,32),
   status:'canonical structural proposal, not a verified historical interpretation'
  });
 }
 function describe(option){
  const st=option?.structure;
  if(!st||!ALLOWED.has(st.kind)||!Array.isArray(option.sources)||
     !option.sources.length||option.sources.some(u=>typeof u!=='string'||!/^https:\/\/[^\s/]+/u.test(u)))
   return null;
  const positions=st.kind==='headed-relative'?
   [['relative',st.relativeFrame],['matrix',st.matrixFrame]]:
   [['matrix',st.frame]];
  const events=[];
  for(const [role,frame] of positions){
   const e=event(frame,option.sources);
   if(!e)return null;
   events.push({role,...e});
  }
  if(st.kind==='headed-relative'&&
    (!['relative subject','relative object'].includes(st.relativeGap)||
     !['matrix subject','matrix object'].includes(st.matrixRole)||
     typeof st.head!=='string'||!st.head))return null;
  if(st.kind==='relational-location'&&
    (!['event','subject','object'].includes(st.attachment)||
     typeof st.place!=='string'||typeof st.relation!=='string'||
     typeof st.selectedRelation!=='string'))return null;
  return {kind:st.kind,events,
   relative:st.kind==='headed-relative'?{
    head:st.head,gap:st.relativeGap,matrixRole:st.matrixRole,
    antecedentIdentity:'not-inferred'}:null,
   location:st.kind==='relational-location'?{
    place:st.place,relation:st.relation,selectedSense:st.selectedRelation,
    attachment:st.attachment,referentIdentity:'not-inferred',
    attachmentIndependentlySemanticallyVerified:false}:null,
   english:option.text,
   sourcedChoices:option.sources.slice(),
   status:'source-gated grammatical alternative, NOT a verified translation'};
 }
 function verify(input,analysis,graph,composition){
  if(typeof input!=='string'||!input.trim()||input.length>7000||
    /[\u0000-\u001f]/u.test(input)||composition?.available!==true)
   return fail('No complete source-audited English composition was supplied');
  let freshAnalysis,freshGraph,fresh;
  try{
   freshAnalysis=sentence.analyze(input);
   freshGraph=grammarIR.build(input,freshAnalysis);
   fresh=grammarIR.auditEnglish(english.compose(input,freshAnalysis),
    freshAnalysis,freshGraph);
  }catch{return fail('Canonical source/grammar reanalysis failed');}
  if(fresh?.available!==true||fresh.verified!==false||
     !Array.isArray(fresh.units)||!fresh.units.length||fresh.units.length>24||
     !Array.isArray(fresh.joins)||fresh.joins.length!==fresh.units.length-1)
   return fail('Canonical grammar did not license a complete English passage');
  if(!Array.isArray(freshAnalysis.clauses)||
     freshAnalysis.clauses.length!==fresh.units.length||
     !allSourceWordsAccountedFor(input,fresh.units,fresh.joins))
   return fail('Original written words were omitted, reordered or added across clauses and connectors');
  // Compare the entire bounded analysis/graph: a forged lexical rule or graph
  // edge cannot authorize a superficially plausible English option.
  if(!analysis||!graph||serialize(analysis)!==serialize(freshAnalysis)||
     serialize(graph)!==serialize(freshGraph))
   return fail('Supplied morphological/grammatical evidence diverged from canonical reanalysis');
  if(composition.verified!==false||serialize(composition.audit)!==serialize(fresh.audit)||
     !Array.isArray(composition.units)||!Array.isArray(composition.joins)||
     serialize(composition.units)!==serialize(fresh.units)||
     serialize(composition.joins)!==serialize(fresh.joins))
   return fail('English options, roles, wording, source locators or joins diverged from canonical realization');
  const units=[];
  let optionsChecked=0;
  for(let i=0;i<fresh.units.length;i++){
   const unit=fresh.units[i],clause=freshAnalysis.clauses?.[i];
   if(unit.index!==i||unit.written!==String(clause?.text||'').trim()||
      !Array.isArray(unit.options)||!unit.options.length||unit.options.length>128)
    return fail('Source text or clause coverage changed during analysis');
   const proposals=[];
   for(const option of unit.options){
    const sem=describe(option);
    if(!sem)return fail('Unsupported or unsourced semantic structure in English candidate');
    proposals.push(sem);
    optionsChecked++;
   }
   units.push({unit:i,originalWrittenClause:unit.written,
    writtenTokens:Array.isArray(clause.tokens)?clause.tokens.slice():[],
    alternatives:proposals,referentResolution:'not-inferred'});
  }
  const baseline=english.render(fresh);
  if(typeof baseline!=='string'||!baseline.trim())
   return fail('Canonical English realizer could not render the complete passage');
  return {available:true,version:'tentli-semantic-contract-v1',
   verifiedTranslation:false,independentHistoricalAccuracy:null,
   composition:fresh,units,optionsChecked,canonicalDraft:baseline,
   sourceText:input,scope:'cross-checked canonical morphology, grammar IR, English options and exact evidence; NOT independent semantic truth',
   note:'Third-person identity, lexical sense choice, locative scope and historical interpretation remain unverified.'};
 }
 return {verify};
}
root.TlahtolliSemanticIR={create};
})(typeof window==='undefined'?globalThis:window);
