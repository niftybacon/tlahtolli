/* English realization of existing structural candidates, not a new Nahuatl parser. */
(function(root){
'use strict';
const normal=s=>String(s).normalize('NFC').trim().replace(/\s+/gu,' ').toLowerCase();
const capital=s=>s.charAt(0).toUpperCase()+s.slice(1);
const line=p=>[p.subject,p.verb,p.object].filter(Boolean).join(' ');
const sources=(...lists)=>[...new Set(lists.flat().filter(x=>typeof x==='string'&&/^https?:\/\//u.test(x)))];
const PERSONS=['1sg','2sg','3sg','1pl','2pl','3pl'];
const AUH='https://nahuatl.wired-humanities.org/content/auh';
function create(model){
 function finite(clause){
  return (clause?.candidates||[]).filter(c=>c.grade==='grammar-derived candidate'&&
   c.coverage===clause.tokens?.length&&Array.isArray(c.englishParts)&&
   c.englishParts.length>0&&c.englishParts.every(p=>typeof p.subject==='string'&&
    typeof p.verb==='string'&&p.verb.length>0&&(p.object===null||typeof p.object==='string')));
 }
 function probe(text){
  try{const r=model.analyze(text);return r.clauses?.length===1?finite(r.clauses[0]):[];}
  catch{return [];}
 }
 const match=(c,v)=>c.frame.predicate===v.lemma&&
  PERSONS[c.frame.subjectPerson]===v.subjectPerson&&c.frame.tense===v.tense;
 function locationOptions(clause){
  const options=[];
  const relations={
   itic:['inside','within','in the interior of'],
   'ītech':['on','by','in contact with','attached to','concerning','from']
  };
  for(const p of clause.complexClauseProposals||[]){
   if(p.grade!=='grammar-composed verb + relational location (unattested; NOT a verified translation)'||
    !p.verb||!p.arguments||!p.location||
    p.coverage+(p.verb.negative?1:0)!==clause.tokens?.length||
    p.location.relation?.lexicalPossessor!=='3sg')continue;
   const allowed=relations[p.location.relation.lemma];
   const senses=p.location.possibleSenses;
   if(!allowed||!Array.isArray(senses)||!senses.length||
    senses.some(s=>!allowed.includes(s))||new Set(senses).size!==senses.length)continue;
   // Citation wording only. A source-listed inflection does not automatically
   // authorize singular English or a newly generated plural/possessive.
   const place=model.describeNoun?.(p.location.place?.written);
   if(!place||place.lemma!==p.location.place.lemma)continue;
   const finiteInput=(p.verb.negative?'ahmo ':'')+p.verb.written+
    (p.arguments.overtNounPhrase?' '+p.arguments.overtNounPhrase:'');
   const readings=probe(finiteInput).filter(c=>match(c,p.verb)&&
    c.frame.negative===p.verb.negative&&
    c.frame.subjectNoun===p.arguments.subjectNoun&&
    c.frame.objectNoun===(p.arguments.object?.word||null));
   const attachments=p.location.attachmentAlternatives||[];
   for(const c of readings)for(const words of c.englishParts)for(const sense of senses){
    const phrase=sense+' '+place.text;
    const common={kind:'relational-location',frame:c.frame,
     place:place.lemma,relation:p.location.relation.lemma,selectedRelation:sense,
     referentStatus:'preceding place as relational possessor is proposed, not resolved'};
    const evidence={sources:sources(p.sources,c.sources,[place.sense.source]),
     nounSenses:[...(c.nounSenses||[]),place.sense]};
    if(attachments.includes('possible clause/event location')){
     options.push({text:capital(phrase)+', '+line(words),...evidence,
      choiceLabel:'Event relation: '+sense,
      structure:{...common,attachment:'event'}});
    }
    if(attachments.includes('possible modification of the overt noun phrase')){
     const slot=c.frame.subjectNoun?'subject':c.frame.objectNoun?'object':null;
     if(slot)options.push({text:capital(line({...words,[slot]:words[slot]+' '+phrase})),
      ...evidence,choiceLabel:'Describes the '+slot+': '+sense,
      structure:{...common,attachment:slot}});
    }
   }
  }
  return options;
 }
 function optionsFor(clause){
  const options=[];
  for(const c of finite(clause))for(const p of c.englishParts)
   options.push({text:capital(line(p)),structure:{kind:
    c.constructionId==='source-bounded-antepilhuan-nominal-predicate'?
     'source-bounded-nominal-predicate':'finite',frame:c.frame},
    sources:sources(c.sources),nounSenses:c.nounSenses||[]});
  if(options.length)return options;
  for(const r of clause.relativeClauseProposals||[]){
   if(r.coverage!==clause.tokens?.length||!r.head?.written||!r.matrix||
    !['relative subject','relative object'].includes(r.relative?.headGapRole)||
    !['matrix subject','matrix object'].includes(r.matrix.headRole))continue;
   // Reuse the existing NP/finite renderer to obtain structured English words.
   // This synthetic query supplies wording only; the ORIGINAL relative proposal
   // authorizes the gap and matrix attachment. It is never a source attestation.
   const relatives=probe(r.relative.written+' in '+r.head.written).filter(c=>
    match(c,r.relative)&&(r.relative.headGapRole==='relative subject'?
     c.frame.subjectNoun===r.head.lemma&&c.frame.objectNoun===null:
     c.frame.objectNoun===r.head.lemma&&c.frame.subjectNoun===null));
   const matrices=probe(r.matrix.written).filter(c=>match(c,r.matrix)&&
    (r.matrix.headRole==='matrix subject'?c.frame.subjectPerson===2:c.frame.object!==null));
   for(const rel of relatives)for(const rp of rel.englishParts){
    const subjectGap=r.relative.headGapRole==='relative subject';
    const head=subjectGap?rp.subject:rp.object;
    if(!head)continue;
    // English "that" avoids guessing personhood, gender, or who/which.
    const relative=subjectGap?line({...rp,subject:'that'}):
     'that '+line({...rp,object:null});
    const nounPhrase=head+' '+relative;
    for(const matrix of matrices)for(const mp of matrix.englishParts){
     const p={...mp,[r.matrix.headRole==='matrix subject'?'subject':'object']:nounPhrase};
     options.push({text:capital(line(p)),structure:{kind:'headed-relative',
      head:r.head.lemma,relativeGap:r.relative.headGapRole,matrixRole:r.matrix.headRole,
      relativeFrame:rel.frame,matrixFrame:matrix.frame},
      sources:sources(r.sources,rel.sources,matrix.sources),nounSenses:rel.nounSenses||[]});
    }
   }
  }
  return options.length?options:locationOptions(clause);
 }
 function compose(input,result){
  const fail=reason=>({available:false,reason,units:[],joins:[],verified:false});
  // A reviewed *poetic* huiya is still a written token. No English draft
  // may silently discard it or automatically render it as 'went'.
  if(Array.isArray(result?.poeticVocableObservations)&&
     result.poeticVocableObservations.some(x=>x?.originalWrittenForm==='huiya'&&
      x.englishDeletionPermitted===false&&x.universallyVocable===false))
   return fail('This original-language passage includes a cited poetic-vocable reading of huiya; English cannot omit it, choose the verbal homograph, or certify a whole-clause translation automatically.');

  if(typeof input!=='string'||input.length>7000||!result?.clauses?.length||
   result.clauses.length>24||/[?¿]/u.test(input))return fail('No supported complete passage structure.');
  const clauses=result.clauses;
  let joins=[],units;
  if(result.sentenceGroups){
   const texts=input.split(/[.!\n]+/u).filter(s=>s.trim());
   const groups=result.sentenceGroups;
   if(!Array.isArray(groups)||groups.length!==texts.length||
    groups.some((g,i)=>normal(g.text)!==normal(texts[i])||g.analysis?.sentenceGroups))
    return fail('Sentence boundaries do not account for the written passage.');
   const children=groups.map(g=>compose(g.text,g.analysis));
   if(children.some(c=>!c.available))return fail('A sentence still lacks supported English wording.');
   units=[];
   children.forEach((child,i)=>{
    if(i)joins.push({written:'punctuation',sources:[],options:[{label:'Sentence boundary',kind:'boundary'}]});
    joins.push(...child.joins);
    for(const unit of child.units)units.push({...unit,index:units.length});
   });
   if(units.length!==clauses.length||units.some((u,i)=>normal(u.written)!==normal(clauses[i].text)))
    return fail('Sentence and clause boundaries disagree.');
  }else if(result.multiClauseProposals?.length){
   if(result.multiClauseProposals.length!==1)return fail('Competing clause boundaries need review.');
   const m=result.multiClauseProposals[0];
   const split=input.trim().split(/\s*,?\s+auh\s+/iu);
   if(m.relation!=='explicit discourse / clause coordination'||
    m.markers?.length!==clauses.length-1||m.markers.some(x=>normal(x)!=='auh')||
    split.length!==clauses.length||split.some((s,i)=>normal(s)!==normal(clauses[i].text)))
    return fail('This clause relationship has no supported English realization.');
   joins=m.markers.map(()=>({written:'auh',sources:sources(m.sources,[AUH]),
    options:[{label:'New statement',kind:'boundary'},{label:'and',kind:'and'},{label:'but',kind:'but'}]}));
  }else{
   const split=input.split(/[.!;\n]+/u).filter(s=>s.trim());
   if(split.length!==clauses.length||split.some((s,i)=>normal(s)!==normal(clauses[i].text)))
    return fail('The analysis does not account for every input unit.');
   joins=clauses.slice(1).map(()=>({written:'punctuation',sources:[],
    options:[{label:'Sentence boundary',kind:'boundary'}]}));
  }
  units=units||clauses.map((c,i)=>({index:i,written:c.text.trim(),options:optionsFor(c)}));
  // Never make a partial passage look complete by dropping an unsupported unit.
  if(units.some(u=>!u.options.length||u.options.length>128))
   return fail('Some units still lack supported English wording; inspect their structural analysis below.');
  return {available:true,units,joins,verified:false,
   alternativeCount:units.reduce((n,u)=>n*u.options.length,1)*joins.reduce((n,j)=>n*j.options.length,1),
   note:'Draft readings of supported structures. The initial choices are not ranked. Select alternatives to compare roles and senses. Third-person references stay unresolved; changing a connector is an editorial reading, not verified context. Source-gated productive verb analyses keep their original hypothesis or recorded-form grade; composing English does not attest a sentence.'+
    (units.some(u=>u.options.some(o=>o.structure.kind==='relational-location'))?
     ' Location readings assume the relational possessor refers to the written place. Event versus noun attachment, relation sense, and negation scope remain hypotheses; no place is carried into another clause.':'')};
 }
 function render(composition,unitChoices=[],joinChoices=[]){
  if(!composition?.available)return null;
  const texts=composition.units.map((u,i)=>u.options[unitChoices[i]??0]?.text);
  const links=composition.joins.map((j,i)=>j.options[joinChoices[i]??0]?.kind);
  if(texts.some(t=>typeof t!=='string')||links.some(x=>!['boundary','and','but'].includes(x)))return null;
  let text=texts[0];
  for(let i=1;i<texts.length;i++){
   // Keeping the English subject in every clause avoids implied same-subject ellipsis.
   const next=texts[i].startsWith('I ')?texts[i]:texts[i].charAt(0).toLowerCase()+texts[i].slice(1);
   text+=links[i-1]==='boundary'?'. '+texts[i]:', '+links[i-1]+' '+next;
  }
  return text+'.';
 }
 return {compose,render};
}
root.TlahtolliEnglish={create};
})(window);

