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
 // Launey (2011), §1.2: n-/t- before an immediately adjacent vowel;
 // ni-/ti- before consonants. Object prefixes intervene when present.
 // Preserve original NFC spelling; do not guess weak-i stem deletions.
 function subjectPrefix(who,following){
  if(/^[aeiouāēīōū]/u.test(following)&&
     ['1sg','2sg','1pl'].includes(who.person))
   return who.person==='1sg'?'n':'t';
  return who.surface;
 }
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
    // Source-checked intransitives only: n-/t- before a vowel, ni-/ti-
    // before a consonant. No change to valency, plurals or tense.
    const prefix=subjectPrefix(subject,lemma);
    if(written!==prefix+lemma)continue;
    if(all.some(c=>c.lemma===w.word&&
       ['manuscript','lexical','grammar'].includes(c.grade)))continue;
    all.push(make(w.word,'Regular intransitive present hypothesis','hypothesis',
     {tense:'Present',subject:subject.person,category:'verb',
      sourceStatus:'Curated intransitive headword + general singular subject rule'},
     [{surface:raw.slice(0,prefix.length),role:'Subject '+subject.person+' prefix; grammar-derived'},
      {surface:raw.slice(prefix.length),role:'Source-listed intransitive citation form; proposed present base'}],
     head.source,head.locator||'',
     'Analytical n-/t- before vowels, ni-/ti- otherwise, plus source-checked intransitive citation form. This exact finite word is NOT independently attested by the source, and no plural, nonpresent, incorporated or transitive forms are inferred.'));
   }
  }
 }
 // A source-located bound *possessed* base is different from an absolutive
 // combining stem. Only a single explicitly listed bound lexical form can
 // license prefix substitutions; multi-part relations and semantic exceptions
 // cannot be generalized safely.
 // Extend finite morphology beyond the 12 complete 10×6 matrices by
 // composing ONLY independently recorded 1sg preterite examples and source-
 // checked citation bases. No new stem dictionary, analyzer, or matrix exists.
 // Never compare a generated candidate through normalize(): vowel length and
 // original source spelling must stay exact for speculative forms.
 function fromSourceLocatedFiniteTemplates(raw,all){
  const written=String(raw||'').normalize('NFC').toLocaleLowerCase('en');
  if(!/^[\p{L}\p{M}]{4,120}$/u.test(written))return;
  for(const w of words){
   if(Object.prototype.hasOwnProperty.call(FULL_VERB_PARADIGMS,w.word))continue;
   const pos=String(w.pos||'').trim().toLowerCase();
   if(!['verb (intransitive)','verb (transitive)','verb (transitive/reflexive)'].includes(pos))continue;
   const head=sourceClaim(w,'headword'),category=sourceClaim(w,'pos');
   if(!head||!category||!/^https:\/\//u.test(head.source||'')||
      !/^https:\/\//u.test(category.source||''))continue;
   const lemma=String(w.word||'').normalize('NFC').toLocaleLowerCase('en');
   if(!/^[\p{L}\p{M}]{3,110}$/u.test(lemma))continue;
   for(const example of w.inflections||[]){
    if(!['dictionary','text'].includes(example.evidence)||
       !/^https:\/\//u.test(example.source||'')||
       !/^Preterite 1sg(?:\b|[,(])/iu.test(String(example.category||'')))continue;
    const recorded=String(example.form||'').normalize('NFC').toLocaleLowerCase('en');
    // Only a recorded o-/ō- augment followed by the actual 1sg ni-
    // licenses a change of singular SUBJECT. Other preterites, reflexives,
    // plural allomorphs and bare dictionary stems have different licensing.
    // Vowel-initial intransitives take n- (not ni-) immediately before
    // their short stem. Reconstruct only when that exact written initial
    // vowel agrees with the independently checked citation spelling.
    let vowelSubject=false;
    let m=null;
    if(pos==='verb (intransitive)'&&/^[aeiouāēīōū]/u.test(lemma)){
     const candidate=/^(o|ō)n([\p{L}\p{M}]{2,110})$/u.exec(recorded);
     if(candidate&&candidate[2].startsWith(lemma[0])){
      m=candidate;vowelSubject=true;
     }
    }
    if(!m)m=/^(o|ō)ni([\p{L}\p{M}]{3,110})$/u.exec(recorded);
    if(!m)continue;
    const [augment,remainder]=[m[1],m[2]];
    let object='',objectRole='';
    if(pos==='verb (intransitive)'){
     // There is no object slot; source-listed 1sg stem is preserved intact.
     if(/object|reflexive/iu.test(example.category))continue;
    }else if(pos==='verb (transitive)'){
     if(/unspecified object/iu.test(example.category)&&remainder.startsWith('tla')){
      object='tla';objectRole='nonhuman indefinite (source-labelled)';
     }else if(/animate indefinite object/iu.test(example.category)&&remainder.startsWith('te')){
      // Molina's independently labelled nite- transitive class; no guessed vowel-length variation.
      object='te';objectRole='human indefinite (exact source-spelled prefix)';
     }else if(/specific object/iu.test(example.category)&&remainder.startsWith('c')){
      object='c';objectRole='3sg object (source-labelled)';
     }else continue;
    }else{
     // Mixed transitive/reflexive lexical classes are accepted ONLY for a
     // separately labelled non-reflexive, animate indefinite object.
     if(!/animate indefinite object/iu.test(example.category)||!remainder.startsWith('te'))continue;
     object='te';objectRole='human indefinite (source spelling; vowel length unresolved)';
    }
    if(remainder.length-object.length<2)continue;
    const partsFor=person=>[
     {surface:augment,role:'Augment exactly as recorded in a 1sg preterite example'},
     {surface:person,role:'2sg '+person+'- subject prefix (grammar substitution)'},
     ...(object?[{surface:object,role:objectRole+'; exact object sequence retained'}]:[]),
     {surface:remainder.slice(object.length),
      role:'Unaltered remainder of source-listed 1sg preterite; no inferred internal stem boundaries'}
    ];
    const secondPrefix=vowelSubject?'t':'ti';
    const preterite=augment+secondPrefix+remainder;
    if(written===preterite&&!all.some(a=>a.lemma===w.word&&
       ['manuscript','lexical','grammar','paradigm'].includes(a.grade))){
     const parts=partsFor(secondPrefix);
     all.push(make(w.word,'Source-template singular preterite hypothesis','hypothesis',
      {tense:'Preterite',subject:'2sg',object:objectRole||'intransitive',
       sourceStatus:'Independent 1sg dictionary/example token + regular singular subject agreement'},
      parts,example.source,head.locator||'',
      'The 1sg preterite is source-listed; this 2sg substitution is NOT independently attested. No person-plural agreement, irregular-base inference, context-specific tense force or English translation is established.'));
    }
    // The source may independently specify DIFFERENT present (base 1) and
    // preterite (base 2) stems. Use them only when this exact documented
    // preterite validates the shorter stem: never infer an arbitrary class
    // from a citation headword or from the 36K unreviewed archive.
    const stemClaim=sourceClaim(w,'stem');
    const stemBases=String(w.stem||'').split(';')
     .map(x=>x.trim().match(/^([\p{L}\p{M}]{2,110})-$/u))
     .filter(Boolean).map(x=>x[1].normalize('NFC').toLocaleLowerCase('en'));
    const shortBase=remainder.slice(object.length);
    const classLicensed=stemClaim&&/^https:\/\//u.test(stemClaim.source||'')&&
     stemBases.length===2&&stemBases.includes(lemma)&&
     stemBases.includes(shortBase)&&lemma!==shortBase&&
     // Exact short-base evidence belongs to this lexeme and finite cell.
     ['verb (intransitive)','verb (transitive)'].includes(pos);
    const stronger=()=>all.some(a=>a.lemma===w.word&&
     ['manuscript','lexical','grammar','paradigm'].includes(a.grade));
    // Batch 08: Class 1 is NOT a Class 2 short-stem alternation.
    // The historical 1sg must show exactly this lemma plus the -c suffix.
    // Keep the sole attested base and source-located Class 1 note separate.
    const class1Licensed=stemClaim&&
     /^Batch 08 documented Class 1 singular -c:/u.test(stemClaim.note||'')&&
     stemBases.length===1&&stemBases[0]===lemma&&
     shortBase===lemma+'c'&&
     ['verb (intransitive)','verb (transitive)'].includes(pos)&&
     (pos==='verb (intransitive)'||object==='tla');
    if(class1Licensed){
     const class1=(form,kind,tense,subject,parts)=>{
      if(written!==form||all.some(a=>a.lemma===w.word&&
       ['manuscript','lexical','grammar','paradigm'].includes(a.grade)))return;
      all.push(make(w.word,kind,'hypothesis',
       {tense,subject,object:objectRole||'intransitive',
        stemClass:'Source-listed 1sg + unchanged Class 1 lexical base; -c singular, -queh plural'},
       parts,stemClaim.source,stemClaim.locator,
       'Historical source lists ONLY the 1sg -c form. This is a grammar-derived Class 1 word hypothesis, NOT an independently attested historical form, an additional valency, or a verified English reading.'));
     };
     if(pos==='verb (intransitive)'){
      class1(augment+lemma+'c','Source-class1 third-person preterite hypothesis','Preterite','3sg',
       [{surface:augment,role:'Exact source-listed past augment'},
        {surface:'Ø',role:'3sg subject (zero prefix)'},
        {surface:lemma,role:'Class 1 unchanged lexical base'},
        {surface:'c',role:'Singular preterite -c from cited 1sg example'}]);
     }
     if(pos==='verb (intransitive)'||object==='tla'){
      const singular=pos==='verb (intransitive)'?PEOPLE.slice(0,3):PEOPLE.slice(0,2);
      for(const who of singular){
       class1(subjectPrefix(who,object+lemma)+object+lemma+'z','Source-class1 future hypothesis','Future',who.person,
        [{surface:subjectPrefix(who,object+lemma)||'Ø',role:'Subject '+who.person},
         ...(object?[{surface:object,role:objectRole+' from the exact source finite form'}]:[]),
         {surface:lemma,role:'Source-checked Class 1 citation base'},
         {surface:'z',role:'Grammatical future ending (hypothesis)'}]);
      }
      for(const who of PEOPLE.slice(3)){
       class1(augment+subjectPrefix(who,object+lemma)+object+lemma+'queh','Source-class1 plural preterite hypothesis','Preterite',who.person,
        [{surface:augment,role:'Exact source-listed past augment'},
         {surface:subjectPrefix(who,object+lemma)||'Ø',role:'Plural subject '+who.person},
         ...(object?[{surface:object,role:'Recorded object sequence'}]:[]),
         {surface:lemma,role:'Unchanged Class 1 base, NOT Class 2 short stem'},
         {surface:'queh',role:'Plural preterite -queh (no singular -c)'}]);
       class1(subjectPrefix(who,object+lemma)+object+lemma+'zqueh','Source-class1 plural future hypothesis','Future',who.person,
        [{surface:subjectPrefix(who,object+lemma)||'Ø',role:'Plural subject '+who.person},
         ...(object?[{surface:object,role:'Recorded object sequence'}]:[]),
         {surface:lemma,role:'Unchanged Class 1 lexical base'},
         {surface:'z',role:'Grammatical future -z'},
         {surface:'queh',role:'Grammatical nonpresent plural -queh'}]);
       if(pos==='verb (intransitive)')
        class1(subjectPrefix(who,lemma)+lemma+'h','Source-class1 plural present hypothesis','Present',who.person,
         [{surface:subjectPrefix(who,object+lemma)||'Ø',role:'Plural subject '+who.person},
          {surface:lemma,role:'Unchanged Class 1 base'},
          {surface:'h',role:'Classical present plural -h (hypothesis)'}]);
      }
     }
    }

    if(classLicensed){
     // The zero-subject 3sg preterite keeps the *whole* short base and
     // augment. Object agreement can alternate for transitive third person:
     // refuse it rather than invent a c-/qui- allomorph.
     if(pos==='verb (intransitive)'&&written===augment+shortBase&&!stronger())
      all.push(make(w.word,'Source-stem-class third-person preterite hypothesis','hypothesis',
       {tense:'Preterite',subject:'3sg',object:'intransitive',
        stemClass:'Independently located long/short lexical bases'},
       [{surface:augment,role:'Source-listed preterite augment'},
        {surface:'Ø',role:'Third-person singular subject (zero prefix)'},
        {surface:shortBase,role:'Exact source-checked preterite short base'}],
       stemClaim.source,stemClaim.locator,
       'The source establishes this lexical short base, not this complete third-person token. Grammatical combination is a NOT independently attested hypothesis, not translated English.'));
     // Future singular uses the *present* base followed by -z, not the
     // short preterite base. Only the same explicitly recorded indefinite
     // object is retained; do NOT extrapolate specific c-/qui- forms.
     if(pos==='verb (intransitive)'||object==='tla'){
      const subjects=pos==='verb (intransitive)'?
       [PEOPLE[0],PEOPLE[1],PEOPLE[2]]:[PEOPLE[0],PEOPLE[1]];
      for(const who of subjects){
       const surface=subjectPrefix(who,object+lemma)+object+lemma+'z';
       if(written!==surface||stronger())continue;
       all.push(make(w.word,'Source-stem-class future hypothesis','hypothesis',
        {tense:'Future',subject:who.person,object:objectRole||'intransitive',
         stemClass:'Source-checked present base with -z future'},
        [{surface:subjectPrefix(who,object+lemma)||'Ø',role:'Singular subject '+who.person+' (zero for 3sg)'},
         ...(object?[{surface:object,role:objectRole+'; retained from exact preterite evidence'}]:[]),
         {surface:lemma,role:'Source-checked long/present lexical base'},
         {surface:'z',role:'Singular future -z; grammatical rule, not attestation'}],
        stemClaim.source,stemClaim.locator,
        'The lexical bases and source-listed 1sg preterite justify a class-limited future hypothesis. The generated whole word is NOT independently attested or a verified contextual translation.'));
      }
     }
    }
    // A verified base-2 (preterite) and base-1 (present) also permit
    // narrowly bounded plural morphology: -queh follows the short past
    // base and -zqueh follows the long future base. The PERSON prefix is
    // the already indexed Tēntli plural inventory (ti-/an-/Ø).
    // Do not generate other tense/aspect classes, reflexives, or c-/qui-
    // object allomorphs; an explicit tla- example is required for transitives.
    if(classLicensed&&(pos==='verb (intransitive)'||object==='tla')){
     for(const who of PEOPLE.slice(3)){
      const preterite=augment+subjectPrefix(who,object+shortBase)+object+shortBase+'queh';
      if(written===preterite&&!stronger())
       all.push(make(w.word,'Source-stem-class plural preterite hypothesis','hypothesis',
        {tense:'Preterite',subject:who.person,object:objectRole||'intransitive',
         stemClass:'Source-checked short base + nonpresent plural -queh'},
        [{surface:augment,role:'Augment exactly as source-recorded'},
         {surface:subjectPrefix(who,object+shortBase)||'Ø',role:'Plural subject '+who.person},
         ...(object?[{surface:object,role:'Recorded indefinite object prefix'}]:[]),
         {surface:shortBase,role:'Independently checked preterite short base'},
         {surface:'queh',role:'Classical nonpresent plural -queh'}],
        stemClaim.source,stemClaim.locator,
        'Classical plural preterite construction from sourced base 2 and a recorded 1sg form. Generated token is NOT independently attested; number, dialectal suffix variants and English remain unverified.'));
      const future=subjectPrefix(who,object+lemma)+object+lemma+'zqueh';
      if(written===future&&!stronger())
       all.push(make(w.word,'Source-stem-class plural future hypothesis','hypothesis',
        {tense:'Future',subject:who.person,object:objectRole||'intransitive',
         stemClass:'Source-checked present base + -zqueh'},
        [{surface:subjectPrefix(who,object+lemma)||'Ø',role:'Plural subject '+who.person},
         ...(object?[{surface:object,role:'Recorded indefinite object prefix'}]:[]),
         {surface:lemma,role:'Independently checked long/present base'},
         {surface:'z',role:'Classical future marker -z'},
         {surface:'queh',role:'Classical nonpresent plural -queh'}],
        stemClaim.source,stemClaim.locator,
        'Classical plural future construction from sourced base 1 and recorded valency. Generated token is NOT independently attested or a complete English translation.'));
     }
    }
    // Present plural in Classical Nahuatl has the separately documented -h
    // ending (Launey, Lesson 1; Sullivan, indicative). Reuse ONLY the same
    // source-verified base-1/base-2 class already required for past/future.
    // A headword or an unreviewed archive record alone cannot license this.
    if(classLicensed&&pos==='verb (intransitive)'){
     for(const who of PEOPLE.slice(3)){
      const present=subjectPrefix(who,lemma)+lemma+'h';
      if(written!==present||stronger())continue;
      all.push(make(w.word,'Source-stem-class plural present hypothesis','hypothesis',
       {tense:'Present',subject:who.person,object:'intransitive',
        stemClass:'Independently checked present base + Classical plural -h'},
       [{surface:subjectPrefix(who,object+lemma)||'Ø',role:'Plural subject '+who.person},
        {surface:lemma,role:'Source-checked long/present lexical base'},
        {surface:'h',role:'Classical present plural -h; grammatical rule, not an attestation'}],
       stemClaim.source,stemClaim.locator,
       'Present plural hypothesis from independently sourced verb bases, a located 1sg preterite, and published Classical number agreement. This whole written form is NOT independently attested or a complete translation.'));
     }
    }
    // The citation form is the source-checked present base, but only an
    // INDEPENDENTLY documented object slot (tla or te) licenses transitive
    // present agreement. We do NOT infer arbitrary objects, c/qui
    // allomorphy, or reflexives from a bare lexical transitivity label.
    if(object!=='tla'&&object!=='te')continue;
    for(const person of PEOPLE.slice(0,2)){
     const present=person.surface+object+lemma;
     if(written!==present||all.some(a=>a.lemma===w.word&&
        ['manuscript','lexical','grammar','paradigm'].includes(a.grade)))continue;
     all.push(make(w.word,'Source-template transitive present hypothesis','hypothesis',
      {tense:'Present',subject:person.person,object:objectRole,
       sourceStatus:'Curated citation base and exact source-reported indefinite object slot'},
      [{surface:person.surface,role:person.person+' subject prefix (grammar-derived)'},
       {surface:object,role:objectRole+'; attested as a slot in the source-listed 1sg preterite'},
       {surface:lemma,role:'Curated dictionary citation base; not independently attested with these prefixes'}],
      example.source,head.locator||'',
      'Productive singular present interpretation from source-supported citation base and object pattern. This whole token is NOT independently attested; no alternate stem, additional object, number, sense, or verified English is inferred.'));
    }
   }
  }
 }
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
  fromSourceLocatedFiniteTemplates(raw,out);
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
   '<p>Reverse analysis of indexed historical/lexical forms and all 720 grammar-derived verb cells, plus strictly bounded regular singular present, independently checked long/short stem-class singular and plural present/future/preterite hypotheses, source-template second-person preterite, source-recorded indefinite objects, transitive objects, and source-bound possession analogies. Higher-ranked analyses have more specific documentary support, <strong>not</strong> greater grammatical certainty in every context.</p>'+
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

