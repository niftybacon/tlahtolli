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
 function optionsFor(clause){
  const options=[];
  for(const c of finite(clause))for(const p of c.englishParts)
   options.push({text:capital(line(p)),structure:{kind:'finite',frame:c.frame},
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
  return options;
 }
 function compose(input,result){
  const fail=reason=>({available:false,reason,units:[],joins:[],verified:false});
  if(typeof input!=='string'||input.length>7000||!result?.clauses?.length||
   result.clauses.length>24||/[?¿]/u.test(input))return fail('No supported complete passage structure.');
  const clauses=result.clauses;
  let joins=[];
  if(result.multiClauseProposals?.length){
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
  const units=clauses.map((c,i)=>({index:i,written:c.text.trim(),options:optionsFor(c)}));
  // Never make a partial passage look complete by dropping an unsupported unit.
  if(units.some(u=>!u.options.length||u.options.length>128))
   return fail('Some units still lack supported English wording; inspect their structural analysis below.');
  return {available:true,units,joins,verified:false,
   alternativeCount:units.reduce((n,u)=>n*u.options.length,1)*joins.reduce((n,j)=>n*j.options.length,1),
   note:'Draft readings of supported structures. The initial choices are not ranked. Select alternatives to compare roles and senses. Third-person references stay unresolved; changing a connector is an editorial reading, not verified context.'};
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
