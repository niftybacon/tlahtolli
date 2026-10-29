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
 function segmentRecordedNounPlural(w,form){
  if(!String(w.pos||'').toLowerCase().includes('noun'))return null;
  // A documented plural token may be internally segmented when a matching
  // entry-specific stem plus an overt ending exactly reconstructs that token.
  // Never assume this ending applies to every noun of the same noun class.
  const surface=normalize(form);
  for(const stem of lexicalStems(w)){
   const normalizedStem=normalize(stem);
   if(!surface.startsWith(normalizedStem))continue;
   const suffix=surface.slice(normalizedStem.length);
   if(!['tin','meh','me','queh','h'].includes(suffix))continue;
   return [
    {surface:String(form).slice(0,normalizedStem.length),role:'Recorded noun stem; segmentation proposed'},
    {surface:String(form).slice(normalizedStem.length),role:'Ending in this source-linked plural token; NOT a universal productive suffix'}
   ];
  }
  return null;
 }
 // Explicit source-licensed surface tokens from expansion 01. These segment
 // only the IDENTIFIED token. Boundaries are scholarly interpretations, not
 // claims that every constituent is separately manuscript-attested.
 const SOURCE_BOUND_VERB_SEGMENTS={
  'cochi':{
   'onicoch':[['o','Proposed preterite augment'],['ni','1sg subject'],['coch','Lexeme-specific preterite base (Karttunen p.36 / Lockhart p.215)']]
  },
  'caqui':{
   'onitlacac':[['o','Proposed preterite augment'],['ni','1sg subject'],['tla','Unspecified nonhuman object marker'],['cac','Recorded irregular preterite base (Karttunen p.25)']],
   'oniccac':[['ō','Preterite augment'],['ni','1sg subject'],['c','Third-person object prefix'],['cac','Preterite lexical remainder; exact spelling checked in Lockhart p.213']]
  },
  'tlazotla':{
   'oninotlazotlac':[['o','Proposed preterite augment'],['ni','1sg subject'],['no','Reflexive object prefix'],['tlazotlac','Recorded finite remainder; internal morphological boundary unverified']],
   'onitetlazotlac':[['o','Proposed preterite augment'],['ni','1sg subject'],['te','Human nonspecific object prefix'],['tlazotlac','Recorded finite remainder; do not generalize the verb stem']]
  },
  'cuiloa':{
   'onitlacuilo':[['o','Proposed preterite augment'],['ni','1sg subject'],['tla','Nonspecific object marker'],['cuilo','Recorded preterite remainder, not a freely productive stem']]
  },
  'tlacuiloa':{
   'onitlahcuiloh':[['o','Proposed preterite augment'],['ni','1sg subject'],['tlahcuiloh','Lexicalized writing-verb remainder; initial tla- NOT separated from this lemma']]
  },
  'yauh':{
   'onia':[['o','Proposed preterite augment'],['ni','1sg subject'],['a','Irregular motion-verb remainder; original morphology uncertain']],
   'oniyah':[['ō','Preterite augment'],['ni','1sg subject'],['yah','Suppletive past form recorded by Lockhart p.242']],
   'niauh':[['ni','1sg subject'],['auh','Irregular present-tense remainder; do not infer a uniform root']],
   'tihui':[['ti','1pl subject'],['hui','Suppletive present plural base']],
   'niyaz':[['ni','1sg subject'],['yāz','Suppletive future base and tense material; internal suffix boundary not independently verified']]
  }
 };
 function locatedVerbParts(w,form){
  if(!String(w.pos||'').includes('verb'))return null;
  const spec=SOURCE_BOUND_VERB_SEGMENTS[w.word]?.[normalize(form)];
  if(!spec)return null;
  return spec.map(([surface,role])=>({surface,role:'Source-linked token; '+role+'. Segmentation is analytical.'}));
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
   const plural=String(f.category||'').toLowerCase().includes('plural');
   const parts=locatedVerbParts(w,f.form)||(plural?segmentRecordedNounPlural(w,f.form):null);
   all.push(make(w.word,f.category||'Indexed form',grade,{partOfSpeech:w.pos,evidence:f.evidence},
    parts||[{surface:f.form,role:f.category||'Indexed form; internal segmentation not established'}],
    f.source,'',(f.note||'')+(parts?' The plural segmentation describes only this recorded token.':'')));
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
       'This generated surface form is NOT independently attested here. It is an analogy from an indexed verb cell; object allomorphy, person restrictions, phonotactics and historical variety require independent checking.'));
     }
    }
   }
  }
 }
 // Reuse source-checked regular intransitive citation forms as the complete
 // present stem for singular ni-/ti- subject agreement. This extends analysis
 // beyond the 12 curated *full* paradigm matrices without creating a second
 // conjugator or inferring a whole past/future paradigm.
 // Exact NFC spelling is required: no silent loss of vowel-length contrast.
 function fromRegularIntransitivePresent(raw,all){
  const written=String(raw||'').normalize('NFC').toLocaleLowerCase('en');
  for(const w of words){
   if(String(w.pos||'').trim().toLowerCase()!=='verb (intransitive)'||
      Object.prototype.hasOwnProperty.call(FULL_VERB_PARADIGMS,w.word))continue;
   const head=sourceClaim(w,'headword'),category=sourceClaim(w,'pos');
   if(!head||!category||!/^https:\/\//u.test(head.source||'')||
      !/^https:\/\//u.test(category.source||''))continue;
   const lemma=String(w.word||'').normalize('NFC').toLocaleLowerCase('en');
   if(!/^[\p{L}\p{M}]{3,120}$/u.test(lemma))continue;
   for(const subject of PEOPLE.slice(0,2)){
    // Only 1sg ni- and 2sg ti-; 1pl/2pl/3pl require distinct
    // suffix/number treatment. Do not derive a transitive without an object.
    if(written!==subject.surface+lemma)continue;
    if(all.some(c=>c.lemma===w.word&&
       ['manuscript','lexical','grammar'].includes(c.grade)))continue;
    all.push(make(w.word,'Regular intransitive present hypothesis','hypothesis',
     {tense:'Present',subject:subject.person,category:'verb',
      sourceStatus:'Curated intransitive headword + general singular subject rule'},
     [{surface:raw.slice(0,subject.surface.length),role:'Subject '+subject.person+' prefix; grammar-derived'},
      {surface:raw.slice(subject.surface.length),role:'Source-listed intransitive citation form; proposed present base'}],
     head.source,head.locator||'',
     'Analytical ni-/ti- plus source-checked intransitive citation form. This exact finite word is NOT independently attested by the source, and no plural, nonpresent, incorporated or transitive forms are inferred.'));
   }
  }
 }
 // A source-located bound *possessed* base is different from an absolutive
 // combining stem. Only a single explicitly listed bound lexical form can
 // license prefix substitutions; multi-part relations and semantic exceptions
 // cannot be generalized safely.
 function sourceBoundPossessedBase(w){
  if(String(w.pos||'').trim().toLowerCase()!=='noun')return null;
  const claim=sourceClaim(w,'possessed');
  if(!claim||!sourceClaim(w,'headword')||!sourceClaim(w,'pos')||
     !/^https:\/\//u.test(claim.source||''))return null;
  const specified=String(w.possessed||'').trim().normalize('NFC');
  const match=/^-([\p{L}\p{M}]{2,80})\s*\(([^()]*)\)$/u.exec(specified);
  if(!match)return null;
  const note=match[2].trim();
  if(!/^(?:possessed stem|bound stem|bound form)(?:\s*[;,]|$)/iu.test(note)||
     /special semantics|only|alternativ|reverential|plural|for noble/iu.test(note))return null;
  return {base:match[1],claim};
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
 function fromSourceBoundPossessives(raw,all){
  // Exact surface spelling matters: normalize() folds vowel quantity and
  // would incorrectly license a different macron-bearing possessive base.
  const written=String(raw||'').normalize('NFC').toLocaleLowerCase('en');
  for(const w of words){
   const licensed=sourceBoundPossessedBase(w);
   if(!licensed)continue;
   const {base,claim}=licensed;
   const canonical=base.toLocaleLowerCase('en');
   for(const p of NOUN_PREFIXES){
    const expected=p.shape+canonical;
    if(written!==expected)continue;
    // Stronger *exact* source-recorded forms take precedence. The
    // bibliography for a bound base does not attest this prefixed token.
    if(all.some(c=>c.lemma===w.word&&
       ['manuscript','lexical','grammar'].includes(c.grade)&&
       c.kind!=='Noun citation-form segmentation'))continue;
    all.push(make(w.word,'Source-bound possessed noun analogy','analogy',
     {category:'noun',possessor:p.person,
      sourceStatus:'Source-located possessed base + grammar-derived person prefix'},
     [{surface:raw.slice(0,p.shape.length),role:p.person+' possessive prefix ('+p.gloss+')'},
      {surface:raw.slice(p.shape.length),role:'Exact source-located bound possessed base; no guessed stem alternation'}],
     claim.source,claim.locator,
     'Analogy from an independently source-located bound possessed noun base, NOT an attested whole token. Contextual sense, vowel contact, alienability, register, allomorphy and co-reference are unresolved; no productive plural or sentence translation is licensed.'));
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
  fromRegularIntransitivePresent(raw,out);
  fromPossessiveAnalogy(q,out);
  fromSourceBoundPossessives(raw,out);
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
   '<p>Reverse analysis of indexed historical/lexical forms and all 720 grammar-derived verb cells, plus strictly bounded regular singular intransitive present, transitive object, source-bound possessed-noun and separately cited possessive analogies. Higher-ranked analyses have more specific documentary support, <strong>not</strong> greater grammatical certainty in every context.</p>'+
   (hasQuantityAmbiguity?'<p class="analysis-caution">Macron-insensitive matching may collapse historically meaningful vowel length differences. Check the original orthography and context.</p>':'')+
   columns+(matches.length>24?'<p>Showing 24 of '+matches.length+' candidates.</p>':'')+
   '<p class="analysis-caution"><strong>Research boundary:</strong> no analysis proves a manuscript occurrence, contextual interpretation, or unmodeled allomorph. No unattested proposal is added to the public dictionary or evidence ledger.</p></section>';
 }
 return {analyze,html,splitVerbCell,lexicalStems,nounSegmentation,subjectSpecs:PEOPLE,objectSpecs:OBJECTS};
})();
renderMorphologyBreakdown=TlahtolliMorphEngine.html;

const previousAdvancedProbe=renderFormProbe;
renderFormProbe=function(){
 previousAdvancedProbe();
 const q=$('formProbeInput').value.trim(),box=$('formProbeOutput');
 if(!q||/\s/.test(q)||!TlahtolliMorphEngine.analyze(q).length)return;
 // A form without its own dictionary/paradigm index may still have an explicitly
 // unverified rule-based proposal. Keep the two categories distinct.
 const warning=box.querySelector('.analysis-unknown');
 if(warning&&warning.textContent.includes('No indexed analysis.'))
  warning.textContent='No separately indexed form. The possibilities below are ANALYTICAL HYPOTHESES, not attestations.';
};

