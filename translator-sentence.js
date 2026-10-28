/* Clause candidates from indexed grammar; neither attestations nor exhaustive parses. */
(function(root){
'use strict';
const norm=s=>String(s).normalize('NFC').toLowerCase();
const people=['I','you (singular)','he / she / it','we','you (plural)','they'];
// Editorial English sense options, tied to existing dictionary lemmas. Not sense rankings.
const verbs={
 'tlahtoā':[['speak','speaks'],['speak authoritatively','speaks authoritatively']],
 'chōca':[['cry','cries'],['weep','weeps']],
 'nemi':[['live','lives'],['reside','resides']],
 'chīhua':[['make','makes'],['do','does'],['produce','produces']],
 'mati':[['know','knows'],['perceive','perceives']],
 'itta':[['see','sees'],['inspect','inspects'],['look at','looks at']],
 'tlacuā':[['eat','eats']],
 'yōli':[['live','lives'],['come to life','comes to life'],['hatch','hatches']],
 'cui':[['take','takes'],['fetch','fetches'],['get','gets']],
 'pōhua':[['count','counts'],['read','reads'],['recount','recounts']],
 'tlapōhua':[['count','counts'],['read','reads'],['pray','prays']],
 'tlami':[['end','ends'],['finish','finishes'],['run out','runs out']]
};
// Readable selected senses; the full original meaning is always carried alongside.
const nouns={'cihuātl':'woman','tlācatl':'person','conetl':'child','calli':'house',
 'ātl':'water','āmatl':'document','tetl':'stone','xōchitl':'flower','cuīcatl':'song',
 'chimalli':'shield','tlaxcalli':'tortilla','tepētl':'hill'};
const grammar='https://api.pageplace.de/preview/DT0400.9780511985027_A23683606/preview-9780511985027_A23683606.pdf';
const tenseSource='https://pages.ucsd.edu/~dkjordan/nahuatl/nahugram.html';
function create(dictionary,paradigms,morphology){
 // Reuse existing source-sensitive morphology, never a new guessed conjugator.
 // This optional provider is the canonical morphology engine's analyze(token).
 const parseMorph=typeof morphology==='function'?morphology:()=>[];
 const PERSON_CODES=['1sg','2sg','3sg','1pl','2pl','3pl'];
 const EVIDENCE_GRADES=new Set(['manuscript','lexical','grammar','lemma','paradigm','hypothesis','analogy','unreviewed']);
 function exactMorphology(token){
  if(!/^[\p{L}\p{M}’'\-\u00AF]{1,120}$/u.test(token))return []; // spacing overbar is a source-recorded abbreviation, not vowel length
  try{
   const matches=parseMorph(token);
   return Array.isArray(matches)?matches.filter(m=>m&&EVIDENCE_GRADES.has(m.grade)&&
    typeof m.lemma==='string'&&typeof m.kind==='string'&&
    m.parts&&Array.isArray(m.parts)).slice(0,20):[];
  }catch{return [];} // A morphology failure must never manufacture a sentence reading.
 }
 function partialClues(tokens){
  return tokens.slice(0,24).flatMap((token,index)=>exactMorphology(token).slice(0,3)
   .map(m=>({token,index,lemma:m.lemma,kind:m.kind,grade:m.grade,
    source:m.source||'',sources:Array.isArray(m.sources)?m.sources.slice(0,6):[],
    features:m.features||{},parts:m.parts.slice(0,8)})));
 }
 // A partial construction is distinct from a complete sentence candidate.
 // It only connects a source-crosschecked verb to ONE fully consumed noun phrase
 // when the recorded subject/object agreement is explicit. Hypothetical morphological
 // person, editorial abbreviation and unattested word order remain unresolved.
 function sourceAgreement(tokens,negative){
  if(negative||tokens.length<2||tokens.length>12)return [];
  const canUse=m=>m?.grade==='unreviewed'&&
   typeof m.kind==='string'&&m.kind.startsWith('Source-crosschecked token hypothesis:')&&
   typeof m.source==='string'&&/^https?:\/\//.test(m.source)&&
   Array.isArray(m.sources)&&m.sources.length>0&&
   m.parts?.length>0&&typeof m.lemma==='string'&&
   m.parts.every(p=>typeof p?.surface==='string');
  const linked=(word,m)=>canUse(m)&&norm(m.parts.map(p=>p.surface).join(''))===norm(word);
  const nounAt=i=>{
   const sourceNouns=exactMorphology(tokens[i]).filter(m=>linked(tokens[i],m)&&
    m.features?.category==='noun'&&
    ['1sg','2sg','3sg','1pl','2pl','3pl'].includes(m.features.possessor));
   // A single source-backed possessed reading, or one unambiguous headword
   // in the existing curated lexicon. No guessed free noun from bound stems.
   if(sourceNouns.length===1)return [{
    lemma:sourceNouns[0].lemma,written:tokens[i],kind:'source-crosschecked possessed noun',
    possessor:sourceNouns[0].features.possessor,
    evidence:[sourceNouns[0].source,...sourceNouns[0].sources]}];
   if(sourceNouns.length>1)return [];
   const found=noun(tokens[i]);
   if(!found||!['noun'].includes(found.pos))return [];
   return [{lemma:found.word,written:tokens[i],kind:'unique curated noun headword',
    possessor:null,evidence:[found.source].filter(Boolean)}];
  };
  const markerAt=i=>{
   if(norm(tokens[i])==='in')return {written:tokens[i],status:'exact lexical particle',sources:[]};
   const abbreviated=exactMorphology(tokens[i]).filter(m=>linked(tokens[i],m)&&
    m.features?.category==='particle'&&
    m.features?.expansion==='yn/in proposed, NOT source-spelled');
   if(abbreviated.length!==1)return null;
   return {written:tokens[i],status:'editorial nasal expansion HYPOTHESIS (not source-spelled in)',
    sources:[abbreviated[0].source,...abbreviated[0].sources]};
  };
  const matches=[];
  for(let vi=0;vi<tokens.length;vi++){
   const verbs=exactMorphology(tokens[vi]).filter(m=>linked(tokens[vi],m)&&
    m.features?.category==='verb'&&m.features?.object==='3sg'&&
    ['1sg','2sg','1pl','2pl'].includes(m.features.subject));
   if(!verbs.length)continue;
   const leftover=[];
   for(let i=0;i<tokens.length;i++)if(i!==vi)leftover.push(i);
   // Precisely one NP: either a source-listed possessed noun by itself,
   // or an exact 'in'/sourced-abbreviation marker followed by one noun.
   let np=null,marker=null;
   if(leftover.length===1){
    const readings=nounAt(leftover[0]);
    if(readings.length===1&&readings[0].kind==='source-crosschecked possessed noun')
     np=readings[0];
   }else if(leftover.length===2&&leftover[1]===leftover[0]+1){
    marker=markerAt(leftover[0]);
    if(marker){
     const readings=nounAt(leftover[1]);
     if(readings.length===1)np=readings[0];
    }
   }
   if(!np)continue;
   for(const verb of verbs){
    const subject=verb.features.subject;
    const sources=[...new Set([...verb.sources,verb.source,...np.evidence,
     ...(marker?.sources||[])].filter(Boolean))];
    matches.push({
     grade:'source-backed agreement proposal (unverified; NOT a sentence translation)',
     verb:{written:tokens[vi],lemma:verb.lemma,subject,object:'3sg',
      personStatus:verb.features.person_resolution||'Not independently adjudicated'},
     nounPhrase:{written:(marker?marker.written+' ':'')+np.written,
      lemma:np.lemma,possessor:np.possessor,kind:np.kind,
      marker:marker?.written||null,markerStatus:marker?.status||'no particle written'},
     agreement:{overtVerbObject:'3sg',nominalRole:'possible direct object',
      constraint:'Non-third-person verb subject; one nominal NP compatible with 3sg object agreement'},
     coverage:tokens.length,sources:sources.slice(0,16),
     note:'All source-spelled tokens are consumed, but this is ONLY an argument-linking hypothesis. '+
      'The 1pl/2sg ti- ambiguity is preserved; possessed to- does NOT independently settle verb subject. '+
      (marker&&marker.status.includes('HYPOTHESIS')?
       'The y¯ → yn/in expansion is unverified. ':'')+
      'No historical sentence attestation, contextual sense, tense certainty or English translation is established.'
    });
   }
  }
  // Do not prioritize a more plausible interpretation based on the translation
  // or the historical context: that would introduce answer leakage.
  return matches.slice(0,8);
 }
 function exactFiniteReadings(token,morphs){
  const proposals=[];
  for(const m of morphs){
   // Never sentence-translate productive guesses, spelling repairs, headwords,
   // or a lexeme whose precise source-listed finite form is missing.
   if(!['lexical','manuscript'].includes(m.grade))continue;
   const w=words.filter(w=>w.word===m.lemma&&String(w.pos).includes('verb'));
   if(w.length!==1)continue;
   for(const f of w[0].inflections||[]){
    if(norm(f.form)!==norm(token)||m.kind!==f.category||
       !['dictionary','text'].includes(f.evidence)||!f.source||
       m.source!==f.source||m.features?.evidence!==f.evidence||
       typeof f.gloss!=='string'||!f.gloss.trim())continue;
    // Only explicit, source-labeled finite person/tense combinations.
    const match=/^(Preterite|Present|Future)\s+(1sg|2sg|3sg|1pl|2pl|3pl)\b/i.exec(f.category);
    const historic=/^Historical first-person completed writing(?:\s*\(|$)/i.test(f.category);
    if(!match&&!historic)continue;
    const person=historic?'1sg':match[2].toLowerCase();
    const tense=historic?'completed (source label)':match[1].toLowerCase();
    const code=PERSON_CODES.indexOf(person);
    if(code<0)continue;
    const frame={subject:people[code],subjectPerson:code,subjectNoun:null,
     predicate:w[0].word,tense,negative:false,object:null,objectNoun:null,
     lexicalMeaning:w[0].meaning,sourceForm:f.form};
    if(proposals.some(p=>p.frame.predicate===frame.predicate&&p.frame.tense===tense&&
      p.frame.subjectPerson===code&&p.english[0]===f.gloss))continue;
    proposals.push({frame,english:[f.gloss],coverage:1,nounSenses:[],
     sources:[...new Set([f.source,w[0].source,m.source].filter(Boolean))],
     grade:'source-listed finite-form gloss (unverified in context)',
     note:'An EXACT source-listed finite verb form and a matching source-graded morphology analysis. The English is the entry\'s recorded gloss, NOT a generated sentence translation, manuscript attestation or contextual judgment. No extra words, negation, or noun arguments are inferred.',
     evidenceKind:m.kind,morphologyParts:m.parts.slice(0,8)});
   }
  }
  return proposals.slice(0,5);
 }
 const words=dictionary.words.filter(w=>String(w.variety).startsWith('Classical Nahuatl'));
 const index=new Map();
 for(const [lemma,p] of Object.entries(paradigms.paradigms||{})){
  for(const [row,tense] of [[0,'present'],[3,'future']]){
   (p.cells[row]||[]).forEach((form,person)=>{
    const k=norm(form),list=index.get(k)||[];
    list.push({lemma,person,tense,transitive:p.trans,source:p.lemmaSource});index.set(k,list);
   });
  }
 }
 function noun(token){
  const hits=words.filter(w=>w.pos==='noun'&&[w.word,...String(w.original||'').split(/[;,/]/)].some(f=>norm(f.trim())===norm(token)));
  return hits.length===1?hits[0]:null;
 }
 const nounLabel=n=>'the '+(nouns[n.word]||'['+n.meaning+']');
 function assignments(parse,phrases){
  if(!phrases.length)return [[null,null]];
  if(!parse.transitive)return parse.person===2&&phrases.length===1?[[phrases[0],null]]:[];
  if(phrases.length===1){
   // Non-third-person subject agreement leaves the third-person noun as object.
   const result=[[null,phrases[0]]];
   if(parse.person===2)result.push([phrases[0],null]);
   return result;
  }
  // No positional preference when both participants are third-person singular.
  return parse.person===2&&phrases.length===2?[[phrases[0],phrases[1]],[phrases[1],phrases[0]]]:[];
 }
 function analyze(input){
  const raw=String(input||'');
  if(raw.length>7000)return {clauses:[],complete:false,reason:'Input exceeds 7000 characters.'};
  if(/[?¿]/u.test(raw))return {clauses:[{text:raw,tokens:[],candidates:[],complete:false,reason:'Question scope is not yet supported.'}],complete:false};
  const clauses=raw.split(/[.!;\n]+/u).filter(s=>s.trim()).map(text=>{
   const tokens=text.trim().split(/\s+/u),original=tokens.slice();
   let negative=false;
   if(['ahmo','ahmō'].includes(norm(tokens[0]))){negative=true;tokens.shift();}
   const candidates=[];
   for(let v=0;v<tokens.length;v++)for(const parse of index.get(norm(tokens[v]))||[]){
    // Consume contiguous noun phrases in their original positions: never bridge a verb.
    const phrases=[];let valid=true;
    for(let i=0;i<tokens.length;){
     if(i===v){i++;continue;}
     const n=i+1!==v&&norm(tokens[i])==='in'?noun(tokens[i+1]):null;
     if(!n){valid=false;break;}
     phrases.push(n);i+=2;
    }
    if(!valid||phrases.length>2)continue;
    const lexical=words.filter(w=>w.word===parse.lemma);
    if(lexical.length!==1)continue;
    for(const [subjectNoun,objectNoun] of assignments(parse,phrases)){
     const subject=subjectNoun?nounLabel(subjectNoun):people[parse.person];
     const object=objectNoun?nounLabel(objectNoun):parse.transitive?'him / her / it':null;
     const frame={subject,subjectPerson:parse.person,subjectNoun:subjectNoun?.word||null,
      predicate:parse.lemma,tense:parse.tense,negative,object,objectNoun:objectNoun?.word||null,
      lexicalMeaning:lexical[0].meaning};
     const english=(verbs[parse.lemma]||[]).map(([base,third])=>{
      const verb=parse.tense==='future'?'will '+(negative?'not ':'')+base:
       negative?(parse.person===2?'does':'do')+' not '+base:parse.person===2?third:base;
      const line=subject+' '+verb+(object?' '+object:'');
      return line[0].toUpperCase()+line.slice(1);
     });
     candidates.push({frame,english,coverage:original.length,
      nounSenses:[subjectNoun,objectNoun].filter(Boolean).map(n=>({lemma:n.word,selected:nouns[n.word]||null,fullMeaning:n.meaning,source:n.source})),
      sources:[...new Set([grammar,tenseSource,parse.source,lexical[0].source,subjectNoun?.source,objectNoun?.source].filter(Boolean))],
      grade:'grammar-derived candidate',
      note:'Illustrative English sense choices, not exhaustive translations. Noun articles, lexical senses, aspect and third-person referents require context; candidate order is not a ranking.'});
    }
   }
   // Only an isolated, explicitly source-labeled finite token can contribute
   // a new gloss. No words on either side may be silently discarded.
   if(!candidates.length&&!negative&&tokens.length===1){
    candidates.push(...exactFiniteReadings(tokens[0],exactMorphology(tokens[0])));
   }
   return {text,tokens:original,candidates,complete:candidates.length>0,
    agreementProposals:candidates.length?[]:sourceAgreement(original,negative),
    morphologicalClues:candidates.length?[]:partialClues(original),
    roleAmbiguous:new Set(candidates.map(c=>JSON.stringify([c.frame.subjectNoun,c.frame.objectNoun]))).size>1,
    reason:candidates.length?'':'Outside supported clause grammar; no words were silently discarded. Partial morphology below is not a complete reading.'};
  });
  return {clauses,complete:clauses.length>0&&clauses.every(c=>c.complete)};
 }
 return {analyze};
}
root.TlahtolliSentence={create};
})(window);
