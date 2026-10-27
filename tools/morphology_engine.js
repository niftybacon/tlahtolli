/* Tlahtōlli research morphology engine, canonical source.
 * Embedded into index.html by tools/build_morphology_engine.py for file:// use.
 * A grammar-licensed FORM HYPOTHESIS is not a historical attestation.
 * Operates only on the browser's published + personal lexical workspace.
 */
const TlahtolliMorphEngine = (() => {
 'use strict';
 const PEOPLE=[
  {person:'1sg',surface:'ni',plural:false},
  {person:'2sg',surface:'ti',plural:false},
  {person:'3sg',surface:'',plural:false},
  {person:'1pl',surface:'ti',plural:true},
  {person:'2pl',surface:'an',plural:true},
  {person:'3pl',surface:'',plural:true}
 ];
 const OBJECTS=[
  {person:'1sg',shape:'nēch',gloss:'me'},
  {person:'2sg',shape:'mitz',gloss:'you (singular)'},
  {person:'1pl',shape:'tēch',gloss:'us'},
  {person:'2pl',shape:'amēch',gloss:'you (plural)'},
  {person:'3pl',shape:'quim',gloss:'them'},
  {person:'human.indef',shape:'tē',gloss:'an unspecified person'},
  {person:'nonhuman.indef',shape:'tla',gloss:'an unspecified thing'}
 ];
 const NOUN_PREFIXES=[
  {person:'1sg',shape:'no',gloss:'my'},
  {person:'2sg',shape:'mo',gloss:'your (singular)'},
  {person:'3sg',shape:'i',gloss:'his / her / its'},
  {person:'1pl',shape:'to',gloss:'our'},
  {person:'2pl',shape:'amo',gloss:'your (plural)'}
 ];
 const GRADES={
  manuscript:96,lexical:92,grammar:80,lemma:87,paradigm:68,
  hypothesis:35,analogy:29,unreviewed:22
 };
 function normalize(s){return norm(String(s||'')).trim();}
 function finiteText(s,max=120){return String(s||'').slice(0,max);}
 function make(lemma,kind,grade,features,parts,source='',locator='',note=''){
  return {lemma,kind,grade,features,parts,source,locator,note,score:GRADES[grade]||20};
 }
 function uniqForms(v){
  const result=[],keys=new Set();
  for(const item of v){const k=normalize(item);if(item&&!keys.has(k)){result.push(item);keys.add(k);}}
  return result;
 }
 function lexicalStems(w){
  const v=String(w.stem||'').split(/[;,]/);
  const hits=v.map(s=>s.trim().match(/^([\p{L}]+)-/u)).filter(Boolean).map(x=>x[1]);
  return uniqForms(hits);
 }
 function nounSegmentation(w){
  const name=normalize(w.word);
  for(const stem of lexicalStems(w)){
   const suffix=['tli','tl','li','in'].find(s=>name===normalize(stem+s));
   if(!suffix)continue;
   const claim=(w.claims||[]).find(c=>c.field==='stem');
   const isLocated=claim&&['dictionary','grammar','text'].includes(claim.assessment)&&claim.locator;
   const grade=isLocated?'lexical':'hypothesis';
   const desc=suffix==='in'?'Special noun -in ending':'Absolutive '+suffix;
   return make(w.word,'Noun citation-form segmentation',grade,
    {category:'noun',sourceStatus:claim?.assessment||'unreviewed'},
    [{surface:stem,role:'Combining stem; '+(claim?.assessment||'status unreviewed')},
     {surface:suffix,role:desc}],
    claim?.source||w.source,claim?.locator||'',
    'The division describes this one citation form; it does not generate a productive plural or guarantee a free stem.');
  }
  return null;
 }
 function verbBases(model){
  return uniqForms([model.b1,model.b2s,model.b2p,model.b3])
   .sort((a,b)=>normalize(b).length-normalize(a).length);
 }
 function splitVerbCell(model,tense,person,cell){
  const raw=String(cell),normalized=normalize(cell),who=PEOPLE[person];
  let prefix=who.surface,imperative=false;
  if((tense===7||tense===8)&&(person===1||person===4)&&normalized.startsWith('xi')){
   prefix='xi';imperative=true;
  }
  if(prefix&&!normalized.startsWith(prefix))return null;
  let cursor=prefix.length,rest=normalized.slice(cursor);
  let chosen=null;
  for(const base of verbBases(model)){
   const position=rest.indexOf(normalize(base));
   const leading=rest.slice(0,position);
   if(position<0||position>6)continue;
   if(!model.trans&&position!==0)continue;
   if(model.trans&&(!['c','qui','qu'].includes(leading)))continue;
   chosen={base,leading,position};break;
  }
  if(!chosen)return null;
  const baseNorm=normalize(chosen.base);
  const following=rest.slice(chosen.position+baseNorm.length);
  const parts=[];
  if(prefix)parts.push({surface:raw.slice(0,prefix.length),role:imperative?'Indexed imperative/optative marker':'Subject '+who.person+' prefix'});
  else parts.push({surface:'Ø',role:'Subject '+who.person+' (zero prefix)'});
  if(chosen.leading)parts.push({surface:raw.slice(cursor,cursor+chosen.position),
    role:'Fixed third-person-singular object prefix; lexical allomorph'});
  parts.push({surface:raw.slice(cursor+chosen.position,cursor+chosen.position+baseNorm.length),
    role:'Indexed lexical base of class '+model.cls});
  if(following)parts.push({surface:raw.slice(cursor+chosen.position+baseNorm.length),
    role:'Tense/mood and/or subject-number material for '+VERB_TENSES[tense].name+'; internal segmentation not fully resolved'});
  return {parts,prefix,object:chosen.leading,base:chosen.base,suffix:following,person:who.person,
   subjectPlural:who.plural,imperative,tense,cell:raw};
 }
 function sourceClaim(w,field){
  return (w.claims||[]).find(c=>c.field===field&&['dictionary','grammar','text'].includes(c.assessment)&&c.locator);
 }
 function fromForms(q,w,all){
  if(normalize(w.word)===q){
   all.push(make(w.word,'Dictionary headword','lemma',{partOfSpeech:w.pos},
    [{surface:w.word,role:'Headword; lexical item, not a full contextual parse'}],w.source,'',
    'Headword matching is lexical identification, not contextual analysis.'));
   const noun=nounSegmentation(w);if(noun)all.push(noun);
  }
  for(const variant of historicalSpellings(w)){
   if(normalize(variant)!==q||normalize(variant)===normalize(w.word))continue;
   all.push(make(w.word,'Spelling variant','unreviewed',{partOfSpeech:w.pos},
    [{surface:variant,role:'Recorded alternate spelling'}],w.source,'',
    'Variant orthography does not by itself establish syntax, sense or manuscript occurrence.'));
  }
  for(const f of w.inflections||[]){
   if(f.evidence==='stem'||normalize(f.form)!==q)continue;
   const grade=f.evidence==='text'?'manuscript':f.evidence==='dictionary'?'lexical':
    f.evidence==='paradigm'?'paradigm':'unreviewed';
   all.push(make(w.word,f.category||'Indexed form',grade,{partOfSpeech:w.pos,evidence:f.evidence},
    [{surface:f.form,role:f.category||'Indexed form'}],f.source,'',f.note||''));
  }
  // Complete possessed tokens in the editorial field are indexed separately.
  // A quoted bound stem (e.g., -tepēuh) is NOT a complete token.
  if(w.pos.toLowerCase().includes('noun')){
   const example=String(w.possessed||'').split('(')[0].trim();
   if(example&&!example.startsWith('-')&&!/\s/.test(example)&&normalize(example)===q){
    const claim=sourceClaim(w,'possessed');
    const owner=NOUN_PREFIXES.filter(p=>normalize(example).startsWith(normalize(p.shape)))
      .sort((a,b)=>b.shape.length-a.shape.length)[0];
    const parts=owner?[{surface:owner.shape,role:'Likely '+owner.person+' possessive prefix'},
      {surface:example.slice(owner.shape.length),role:'Remaining possessed-noun base; morphophonology context-dependent'}]:
      [{surface:example,role:'Editorially listed possessed form; segmentation unresolved'}];
    all.push(make(w.word,'Editorially listed possessed form',claim?'lexical':'unreviewed',
     {partOfSpeech:'noun',evidence:claim?.assessment||'unverified'},parts,
     claim?.source||w.source,claim?.locator||'',
     'This particular example is documented in the entry; a full possessive paradigm is not thereby established.'));
   }
  }
 }
 function fromParadigms(q,all){
  for(const [lemma,model] of Object.entries(FULL_VERB_PARADIGMS)){
   for(let t=0;t<model.cells.length;t++)for(let p=0;p<6;p++){
    const cell=model.cells[t][p],augPossible=(t===1||t===5);
    if(normalize(cell)!==q&&!(augPossible&&normalize('ō'+cell)===q))continue;
    const useAug=normalize(cell)!==q;
    const split=splitVerbCell(model,t,p,cell);
    const parts=split?split.parts:[{surface:cell,role:'Full indexed cell; internal morpheme boundaries uncertain'}];
    if(useAug)parts.unshift({surface:'ō',role:'Optional preterite/pluperfect augment'});
    all.push(make(lemma,'Indexed conjugation','paradigm',
     {tense:VERB_TENSES[t].name,subject:PEOPLE[p].person,
      object:model.trans?'fixed third-person singular':'intransitive',patternIndex:t,
      paradigmClass:model.cls},parts,model.lemmaSource,'',
     'This 10×6 matrix is grammar-derived; matching a cell is not evidence that it occurs in an archival source.'));
   }
  }
 }
 function fromProductiveVerb(q,all){
  // Reuse actual indexed person/tense/base/allomorph cells as morphotactic
  // templates. This avoids reconstructing irregular preterite bases by guess.
  // Productive changes are ANALYTICAL possibilities, never corpus attestations.
  if(q.length>140)return;
  const collisions=new Set();
  for(const [lemma,model] of Object.entries(FULL_VERB_PARADIGMS)){
   if(!model.trans)continue;
   for(let t=0;t<model.cells.length;t++){
    if(t===7||t===8||t===9)continue; // imperative/vetitive require separate argument analysis
    for(let p=0;p<6;p++){
     const baseCell=model.cells[t][p],parsed=splitVerbCell(model,t,p,baseCell);
     if(!parsed||!parsed.object||parsed.imperative)continue;
     const prefix=parsed.prefix,root=parsed.base,ending=parsed.suffix;
     for(const obj of OBJECTS){
      if(obj.person===parsed.person)continue; // reflexives need dedicated prefixes
      const surface=prefix+obj.shape+root+ending;
      if(normalize(surface)!==q)continue;
      const key=lemma+'|'+t+'|'+p+'|'+obj.person+'|'+normalize(surface);
      if(collisions.has(key))continue;collisions.add(key);
      const head=prefix?prefix:'Ø';
      const parts=[{surface:head,role:'Subject '+parsed.person+(parsed.subjectPlural?' plural':' singular')},
       {surface:obj.shape,role:obj.person+' object ('+obj.gloss+')'},
       {surface:root,role:'Class '+model.cls+' indexed lexical base'}];
      if(ending)parts.push({surface:ending,role:'Template remainder of '+VERB_TENSES[t].name+'; suffix boundaries not independently verified'});
      all.push(make(lemma,'Productive transitive parse','hypothesis',
       {tense:VERB_TENSES[t].name,subject:parsed.person,object:obj.person,
        lexicalClass:model.cls,template:baseCell},parts,model.lemmaSource,'',
       'Analogy from an indexed finite verb cell. Prefix allomorphy, person/object restrictions, phonotactics and historical variety are not comprehensively verified.'));
     }
    }
   }
  }
 }
 function fromPossessiveAnalogy(q,all){
  // Only an actual source-located complete no- form can license an analogy.
  // Never extrapolate from naked -possessed stems or from a generic noun.
  for(const w of words){
   if(!w.pos.toLowerCase().includes('noun'))continue;
   const claim=sourceClaim(w,'possessed');
   if(!claim)continue;
   const example=String(w.possessed||'').split('(')[0].trim();
   if(!example||!/^no[\p{L}]+$/u.test(example))continue;
   const base=example.slice(2);
   for(const p of NOUN_PREFIXES.slice(1)){
    const surface=p.shape+base;
    if(normalize(surface)!==q)continue;
    all.push(make(w.word,'Analogical possessed noun','analogy',{possessor:p.person},
     [{surface:p.shape,role:p.person+' possessive prefix ('+p.gloss+')'},
      {surface:base,role:'Base from the cited first-person possessed example'}],
     claim.source,claim.locator,
     'Generated only by replacing no- in a source-located example. This exact new token is NOT independently attested; vowel deletion, class, semantic change and allomorphy require checking.'));
   }
  }
 }
 function analyze(input){
  const raw=finiteText(stripToken(input),160).trim(),q=normalize(raw);
  if(!q||q.length>120||/\s/.test(raw))return [];
  const out=[];
  for(const w of words)fromForms(q,w,out);
  fromParadigms(q,out);
  fromProductiveVerb(q,out);
  fromPossessiveAnalogy(q,out);
  const seen=new Set(),clean=[];
  for(const candidate of out){
   const key=JSON.stringify([candidate.lemma,candidate.kind,candidate.grade,candidate.features,candidate.parts]);
   if(seen.has(key))continue;seen.add(key);clean.push(candidate);
  }
  clean.sort((a,b)=>b.score-a.score||a.lemma.localeCompare(b.lemma)||a.kind.localeCompare(b.kind));
  return clean.slice(0,40);
 }
 const GRADE_NAMES={
  manuscript:'Cited historical-text example (check edition)',
  lexical:'Lexicon / grammar source-located',
  grammar:'Grammar-recorded construction',
  lemma:'Dictionary lemma (not sentence analysis)',
  paradigm:'Indexed grammar-derived paradigm — not text-attested',
  hypothesis:'Productive grammatical hypothesis — unverified',
  analogy:'Possessive analogy — unverified',
  unreviewed:'Unverified or orthographic candidate'
 };
 function html(raw){
  const matches=analyze(raw);
  if(!matches.length)return '';
  const rawFold=normalize(raw);
  const quantityWarning=String(raw||'').normalize('NFC')!==String(raw||'').normalize('NFC').toLowerCase()?
   '' : ''; // only a visual comparison after lexical candidates is meaningful
  const hasQuantityAmbiguity=matches.some(m=>normalize(m.lemma)===rawFold&&m.lemma!==raw);
  const columns=matches.slice(0,24).map(m=>{
   const chips=m.parts.map(piece=>'<div class="morpheme"><b>'+safe(piece.surface)+
    '</b><small>'+safe(piece.role)+'</small></div>').join('');
   const features=Object.entries(m.features||{}).filter(([k,v])=>v!==''&&v!=null&&k!=='template')
    .map(([k,v])=>safe(k)+': '+safe(v)).join(' · ');
   const link=validUrl(m.source)?'<p>'+safeLink(m.source,'Inspect linked source ↗')+
    (m.locator?'<small> '+safe(m.locator)+'</small>':'')+'</p>':'';
   return '<div class="analysis-card"><small>'+safe(GRADE_NAMES[m.grade])+
    '</small><h4>'+safe(m.lemma)+' · '+safe(m.kind)+'</h4>'+
    (features?'<p>'+features+'</p>':'')+'<div class="morpheme-list">'+chips+'</div>'+
    (m.note?'<p class="readerhint">'+safe(m.note)+'</p>':'')+link+'</div>';
  }).join('');
  return '<section class="analysis-proposal"><h4>Advanced morphology · '+matches.length+
   ' candidate analysis'+(matches.length===1?'':'es')+'</h4>'+
   '<p>Reverse analysis of indexed historical/lexical forms and all 720 grammar-derived verb cells, plus guarded productive transitive and possessed-noun hypotheses. Higher-ranked analyses have more specific documentary support, <strong>not</strong> greater grammatical certainty in every context.</p>'+
   (hasQuantityAmbiguity?'<p class="analysis-caution">Macron-insensitive matching may collapse historically meaningful vowel length differences. Check the original orthography and context.</p>':'')+
   columns+(matches.length>24?'<p>Showing 24 of '+matches.length+' candidates.</p>':'')+
   '<p class="analysis-caution"><strong>Research boundary:</strong> no analysis proves a manuscript occurrence, contextual interpretation, or unmodeled allomorph. No unattested proposal is added to the public dictionary or evidence ledger.</p></section>';
 }
 return {analyze,html,splitVerbCell,lexicalStems,nounSegmentation,subjectSpecs:PEOPLE,objectSpecs:OBJECTS};
})();
renderMorphologyBreakdown=TlahtolliMorphEngine.html;
