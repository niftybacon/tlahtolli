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
// The canonical editable grammar is data/clause_grammar.json. Builtins preserve
// the two-argument/offline API; both execute through the SAME rule interpreter.
// Construction patterns are hypotheses, never claims of manuscript occurrence.
const DEFAULT_CLAUSE_ROWS=[
 ['finite-alone','V','any',[0,1,2,3,4,5],'none'],
 ['intransitive-subject-post','V NP','intransitive',[2],'subject'],
 ['intransitive-subject-pre','NP V','intransitive',[2],'subject'],
 ['transitive-explicit-object-post','V NP','transitive',[0,1,3,4,5],'object'],
 ['transitive-explicit-object-pre','NP V','transitive',[0,1,3,4,5],'object'],
 ['transitive-third-role-ambiguous-post','V NP','transitive',[2],'either'],
 ['transitive-third-role-ambiguous-pre','NP V','transitive',[2],'either'],
 ['transitive-two-nps-verb-first','V NP NP','transitive',[2],'both'],
 ['transitive-two-nps-verb-middle','NP V NP','transitive',[2],'both'],
 ['transitive-two-nps-verb-last','NP NP V','transitive',[2],'both'],
 ['possessed-intrans-subject-post','V PNP','intransitive',[2],'subject'],
 ['possessed-intrans-subject-pre','PNP V','intransitive',[2],'subject'],
 ['possessed-trans-object-post','V PNP','transitive',[0,1,3,4,5],'object'],
 ['possessed-trans-object-pre','PNP V','transitive',[0,1,3,4,5],'object'],
 ['possessed-trans-third-post','V PNP','transitive',[2],'either'],
 ['possessed-trans-third-pre','PNP V','transitive',[2],'either']
];
const DEFAULT_CLAUSE_PACK={format:'tlahtolli-classical-clause-rules-v1',version:1,
 rules:DEFAULT_CLAUSE_ROWS.map(([id,sequence,valency,persons,roles])=>({
  id,sequence:sequence.split(' '),valency,persons,roles,source_url:grammar,
  evidence_status:'editorial formalization of cited Classical grammar; not individual manuscript attestation'
 }))};
function compileClauseRules(pack){
 if(!pack||pack.format!=='tlahtolli-classical-clause-rules-v1'||pack.version!==1||
  !Array.isArray(pack.rules)||pack.rules.length<1||pack.rules.length>48)return [];
 const ids=new Set(),signatures=new Set(),valid=[];
 const specs={
  none:{count:0,valency:'any',persons:'0,1,2,3,4,5'},
  subject:{count:1,valency:'intransitive',persons:'2'},
  object:{count:1,valency:'transitive',persons:'0,1,3,4,5'},
  either:{count:1,valency:'transitive',persons:'2'},
  both:{count:2,valency:'transitive',persons:'2'}
 };
 for(const r of pack.rules){
  if(!r||typeof r.id!=='string'||!/^[a-z0-9-]{3,72}$/.test(r.id)||
   ids.has(r.id)||!Array.isArray(r.sequence)||r.sequence.length<1||
   r.sequence.length>3||r.sequence.filter(x=>x==='V').length!==1||
   r.sequence.some(x=>x!=='V'&&x!=='NP'&&x!=='PNP')||
   !Array.isArray(r.persons)||r.persons.some(x=>!Number.isInteger(x))||
   typeof r.source_url!=='string'||!/^https:\/\/[^/\s]+/u.test(r.source_url)||
   r.evidence_status!=='editorial formalization of cited Classical grammar; not individual manuscript attestation')
   return [];
  const spec=specs[r.roles];
  const possessed=r.sequence.filter(x=>x==='PNP').length;
  if(!spec||r.sequence.filter(x=>x==='NP'||x==='PNP').length!==spec.count||
   (possessed&&(possessed!==1||spec.count!==1||!r.id.startsWith('possessed-')))||
   (!possessed&&r.id.startsWith('possessed-'))||
   r.valency!==spec.valency||r.persons.join(',')!==spec.persons)return [];
  const signature=[r.sequence.join(' '),r.valency,r.persons.join(','),r.roles].join('|');
  if(signatures.has(signature))return [];
  signatures.add(signature);ids.add(r.id);
  valid.push({...r,sequence:r.sequence.slice(),persons:r.persons.slice()});
 }
 return valid;
}

function create(dictionary,paradigms,morphology,researchExamples,locative,grammarRules){
 // Reuse existing source-sensitive morphology, never a new guessed conjugator.
 // This optional provider is the canonical morphology engine's analyze(token).
 const parseMorph=typeof morphology==='function'?morphology:()=>[];
 const PERSON_CODES=['1sg','2sg','3sg','1pl','2pl','3pl'];
 const locativeAnalyze=typeof locative?.analyze==='function'?locative.analyze:()=>[];
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

 // General Classical-period comparative-fragment rule. The morphological
 // composition is reusable for *unique curated nouns*, not restricted to the
 // one Florentine Codex example that first motivated it. It is not a clause.
 // Explicitly source-listed historical cue spellings may participate without
 // silently treating arbitrary j/i substitutions as orthographic equivalents.
 const comparisonCue=words.filter(w=>w.word==='iuhquin'&&
  w.pos==='particle / comparative adverb'&&
  w.source==='https://nahuatl.wired-humanities.org/content/iuhquin');
 const comparisonExamples=Array.isArray(researchExamples?.entries)?
  researchExamples.entries.filter(e=>e&&e.review_status==='candidate'&&
   e.train_eligible===false&&e.variety==='Classical Nahuatl'&&
   String(e.passage_type||'').startsWith('comparison fragment')&&
   /^https:\/\/florentinecodex\.getty\.edu\/(?:es\/)?book\/11\/folio\/62r$/.test(e.source_url||'')&&
   typeof e.original==='string'&&typeof e.english_interpretation==='string'): [];
 function comparativeCue(token){
  if(comparisonCue.length!==1)return null;
  const w=comparisonCue[0];
  if(norm(token)===norm(w.word))
   return {word:w,exactHeadword:true,source:w.source};
  const forms=(w.inflections||[]).filter(f=>norm(f.form)===norm(token)&&
   f.evidence==='text'&&
   /^https:\/\/florentinecodex\.getty\.edu\/(?:es\/)?book\/11\/folio\/62r$/.test(f.source||''));
  if(forms.length!==1)return null;
  return {word:w,exactHeadword:false,source:forms[0].source};
 }
 function fragmentInterpretations(tokens,negative){
  // Even a well-supported nonfinite comparison must not be fed to the
  // sentence constructor as a finite verb or evaluated as translation gold.
  if(negative||tokens.length!==2)return [];
  const cue=comparativeCue(tokens[0]);
  if(!cue)return [];
  const n=noun(tokens[1]);
  if(!n||n.pos!=='noun'||!/^https:\/\//.test(n.source||'')||
   typeof n.meaning!=='string'||!n.meaning.trim())return [];
  const exactAttestation=comparisonExamples.filter(e=>
   norm(e.original.trim().replace(/\s+/gu,' '))===norm(tokens.join(' '))&&
   e.source_url.replace('/es/','/')===cue.source.replace('/es/','/'));
  // An attested example is editorial, in-sample, and non-gold, never an
  // independent model-performance result.
  const attested=exactAttestation.length===1?exactAttestation[0]:null;
  return [{
   construction:'Comparative particle + source-checked noun phrase',
   grade:attested?'source-attested editorial comparison (not blind)':
    'compositional comparison hypothesis (not independently attested)',
   sourceSpelling:tokens.join(' '),
   cue:{written:tokens[0],lemma:cue.word.word,meaning:cue.word.meaning,
    evidence:cue.exactHeadword?'curated headword':'source-located historical spelling'},
   noun:{written:tokens[1],lemma:n.word,meaning:n.meaning,
    senseStatus:'dictionary sense(s) not resolved from context'},
   compositionalReading:'like / as if + ['+n.meaning+']',
   editorialComparison:attested?{
    reading:attested.english_interpretation,source_id:attested.source_id,
    source_url:attested.source_url,review_status:'candidate; not independently evaluated'}:null,
   coverage:2,
   sources:[...new Set([cue.word.source,cue.source,n.source,
    ...(attested?[attested.source_url]:[])].filter(Boolean))],
   note:'A reusable comparative-fragment relation, not a finite sentence. '+
    'The bracketed meanings come from a cited dictionary, with senses unresolved. '+
    'The source-aligned editorial reading is shown only when the EXACT source-spelled '+
    'two-word fragment matches an existing non-training candidate. '+
    'All other combinations are grammar hypotheses; no historical attestation or accuracy is implied.'
  }];
 }

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
 // Complex-but-incomplete clause structure: a finite indexed verb, one
 // independently source-backed locative construction, optionally one overt
 // in + noun argument. There are no missing-token repairs or guessed nouns.
 // We preserve both third-person roles and competing locative attachments.
 function finiteLocativeProposals(tokens,negative){
  if(tokens.length<3||tokens.length>8)return [];
  const proposals=[];
  for(let vi=0;vi<tokens.length;vi++){
   const verbReadings=index.get(norm(tokens[vi]))||[];
   if(!verbReadings.length)continue;
   for(let li=0;li<tokens.length;li++)for(const ln of [2,3]){
    if(li+ln>tokens.length||vi>=li&&vi<li+ln)continue;
    const locationTokens=tokens.slice(li,li+ln);
    let locations=[];
    try{locations=locativeAnalyze(locationTokens,false);}catch{continue;}
    if(!Array.isArray(locations)||locations.length!==1)continue;
    const location=locations[0];
    // An optional nominal or verbal word after the relational form is NOT
    // a locative adjunct: its clause role is unresolved in the prior parser.
    if(location.extra||location.coverage!==ln||
     location.relation?.lexicalPossessor!=='3sg'||
     !['itic','ītech'].includes(location.relation?.lemma)||
     !Array.isArray(location.sources)||location.sources.length<2||
     location.place?.article&&norm(locationTokens[0])!=='in')continue;
    const leftovers=[];
    for(let i=0;i<tokens.length;i++)if(i!==vi&&(i<li||i>=li+ln))leftovers.push(i);
    const phrases=[];
    if(leftovers.length){
     if(leftovers.length!==2||leftovers[1]!==leftovers[0]+1||
      norm(tokens[leftovers[0]])!=='in')continue;
     const n=noun(tokens[leftovers[1]]);
     if(!n||n.pos!=='noun'||!/^https:\/\//.test(n.source||''))continue;
     phrases.push(n);
    }
    for(const parse of verbReadings){
     const lex=words.filter(w=>w.word===parse.lemma&&
      String(w.pos).startsWith('verb')&&/^https:\/\//.test(w.source||''));
     if(lex.length!==1||!/^https:\/\//.test(parse.source||''))continue;
     const semantic=verbs[parse.lemma];
     if(!Array.isArray(semantic)||!semantic.length)continue;
     for(const [subjectNoun,objectNoun] of assignments(parse,phrases)){
      const locativeWritten=locationTokens.join(' ');
      const attachmentAlternatives=phrases.length?
       ['possible clause/event location','possible modification of the overt noun phrase']:
       ['possible clause/event location'];
      const subj=subjectNoun?nounLabel(subjectNoun):people[parse.person];
      const role=parse.transitive?
       objectNoun?{type:'overt third-person object',word:objectNoun.word,meaning:objectNoun.meaning}:
       {type:'implicit third-person object; referent unresolved',word:null,meaning:null}:
       {type:'intransitive predicate; no object licensed',word:null,meaning:null};
      const sources=[...new Set([grammar,tenseSource,parse.source,lex[0].source,
       ...location.sources,...phrases.map(p=>p.source)].filter(Boolean))].slice(0,18);
      proposals.push({
       grade:'grammar-composed verb + relational location (unattested; NOT a verified translation)',
       coverage:tokens.length,
       verb:{written:tokens[vi],lemma:parse.lemma,tense:parse.tense,
        subjectPerson:PERSON_CODES[parse.person],subject:subj,negative,
        transitive:!!parse.transitive,meaning:lex[0].meaning,
        indexedEvidence:'generated present/future paradigm, not independently attested'},
       arguments:{subjectNoun:subjectNoun?.word||null,object:role,
        overtNounPhrase:phrases.length?'in '+tokens[leftovers[1]]:null},
       location:{written:locativeWritten,place:location.place,
        relation:location.relation,possibleSenses:location.relation.possibleSenses,
        attachmentAlternatives,antecedentStatus:'relational 3sg possessor; coreference to the place noun is a hypothesis',
        grade:location.grade},
       sources,
       note:'Every original clause token is consumed by a licensed finite verb, one source-checked locative phrase '+
        'and at most one explicit in + noun argument. English predicate senses, the locative sense, the '+
        'possessor referent and attachment to event vs noun remain unresolved. '+
        'No third-person pronoun resolution, tense verification or new manuscript attestation is claimed.'
      });
      if(proposals.length>=20)return proposals;
     }
    }
   }
  }
  // Distinct structural analyses remain unranked; they are not English answers.
  return proposals;
 }
 function explicitContextLinks(clauses){
  const links=[];
  for(let i=1;i<clauses.length;i++){
   const prior=clauses[i-1]?.complexClauseProposals||[];
   const current=clauses[i]?.complexClauseProposals||[];
   if(!prior.length||!current.length)continue;
   const priorLocations=new Set(prior.map(p=>norm(p.location.written)));
   const currentLocations=new Set(current.map(p=>norm(p.location.written)));
   const overlap=[...priorLocations].filter(x=>currentLocations.has(x));
   // Repeated written location is explicit; implicit location inheritance,
   // pronominal coreference, and discourse participants are NOT resolved.
   if(overlap.length!==1)continue;
   const ps=new Set(prior.map(p=>p.verb.subjectPerson));
   const cs=new Set(current.map(p=>p.verb.subjectPerson));
   links.push({fromClause:i-1,toClause:i,
    locationWritten:current[0].location.written,
    relation:'same location phrase explicitly repeated in adjacent clauses',
    subjectAgreement:ps.size===1&&cs.size===1&&[...ps][0]===[...cs][0]?
     'same indexed grammatical person (NOT verified person identity)':
     'distinct or ambiguous subject-person marking; no participant identity inferred',
    note:'This is an observable repeated written locative, not proof that the events, people or locations in the historical world are identical.'});
  }
  return links;
 }
 // Only overt, independently documented clause-linking markers. "auh" can
 // mean and/but/new discourse turn, so this yields a structural link, never a
 // selected English conjunction. Conditional intla needs an explicit boundary.
 const MULTICLAUSE_GRAMMAR={
  auh:'https://nahuatl.wired-humanities.org/node/171956',
  intla:'https://nahuatl.wired-humanities.org/content/intla',
  conditions:'https://www.cambridge.org/core/books/abs/an-introduction-to-classical-nahuatl/conditions-more-particles/76A81C0D005DA60A951D4B578416020A'
 };
 // Every licensed pattern is a declarative sequence of exact finite verbs and
 // written in + unique curated noun. Entire token consumption is mandatory.
 const activeClauseRules=compileClauseRules(grammarRules===undefined||grammarRules===null?
  DEFAULT_CLAUSE_PACK:grammarRules);
 function matchClauseRules(tokens,readVerbs,options){
  const getVerbs=typeof readVerbs==='function'?readVerbs:key=>index.get(norm(key))||[];
  const proposals=[];
  for(const rule of activeClauseRules){
   let cursor=0,verbsAt=null,phrases=[],valid=true;
   for(const slot of rule.sequence){
    if(slot==='V'){
     verbsAt=getVerbs(tokens[cursor]||'')||[];
     if(!verbsAt.length){valid=false;break;}
     cursor++;
    }else if(slot==='PNP'){
     // No default possessed-noun interpretation is licensed in English output.
     // Only a caller that provides an exact, source-gated resolver may use PNP.
     if(typeof options?.possessed!=='function'){valid=false;break;}
     const marked=norm(tokens[cursor]||'')==='in';
     const pos=cursor+(marked?1:0);
     const n=options.possessed(tokens[pos]||'');
     if(!n){valid=false;break;}
     phrases.push(n);cursor=pos+1;
    }else{
     if(norm(tokens[cursor]||'')!=='in'||cursor+1>=tokens.length){
      valid=false;break;
     }
     const n=noun(tokens[cursor+1]);
     if(!n){valid=false;break;}
     phrases.push(n);cursor+=2;
    }
   }
   if(!valid||cursor!==tokens.length)continue;
   for(const parse of verbsAt){
    if((rule.valency==='transitive'&&!parse.transitive)||
       (rule.valency==='intransitive'&&parse.transitive)||
       !rule.persons.includes(parse.person))continue;
    let assignments=[];
    if(rule.roles==='none')assignments=[[null,null]];
    else if(rule.roles==='subject')assignments=[[phrases[0],null]];
    else if(rule.roles==='object')assignments=[[null,phrases[0]]];
    else if(rule.roles==='either')assignments=[[null,phrases[0]],[phrases[0],null]];
    else if(rule.roles==='both')assignments=[
      [phrases[0],phrases[1]],[phrases[1],phrases[0]]
    ];
    for(const [subjectNoun,objectNoun] of assignments)
     proposals.push({parse,rule,subjectNoun,objectNoun});
   }
  }
  return proposals;
 }
 // Only indexed, *grammar-derived* canonical morphology is permitted here.
 // Past and modal rows below are NOT sufficiently vetted to generate English.
 // This bridge produces structural hypotheses exclusively: complete:false.
 const MORPH_CLAUSE_ROWS=new Set([1,2,4,5,6]); // preterite, imperfect, conditional, pluperfect, habitual
 function indexedMorphologyReadings(token){
  if(typeof token!=='string'||!/^[\p{L}\p{M}’'-]{1,120}$/u.test(token))return [];
  const proposals=[];
  for(const m of exactMorphology(token)){
   if(m.kind!=='Indexed conjugation'||m.grade!=='paradigm'||
    typeof m.source!=='string'||!/^https:\/\/[^/\s]+/u.test(m.source))continue;
   const row=m.features?.patternIndex;
   if(!Number.isInteger(row)||!MORPH_CLAUSE_ROWS.has(row))continue;
   const model=paradigms?.paradigms?.[m.lemma],who=PERSON_CODES.indexOf(m.features.subject);
   if(!model||who<0||!Array.isArray(model.cells?.[row])||
    norm(model.cells[row][who])!==norm(token)||
    m.source!==model.lemmaSource||m.features.paradigmClass!==model.cls||
    m.features.object!==(model.trans?'fixed third-person singular':'intransitive'))continue;
   // The canonical analyzer and verb matrix must independently agree on exact
   // spelling, lemma, person, row, class, transitivity and source. Orthographic
   // repairs, augment variants and productive hypothetical forms do NOT qualify.
   const lexical=words.filter(w=>w.word===m.lemma&&
    String(w.pos).startsWith('verb')&&/^https:\/\/[^/\s]+/u.test(w.source||''));
   if(lexical.length!==1)continue;
   proposals.push({lemma:m.lemma,person:who,transitive:!!model.trans,
    tense:paradigms.patterns?.[row]||('indexed row '+row),patternIndex:row,
    source:m.source,lexicalSource:lexical[0].source,lexicalMeaning:lexical[0].meaning,
    morphology:m});
  }
  return proposals;
 }
 function morphologyClauseCandidates(tokens,negative){
  if(negative||tokens.length<3||tokens.length>5)return {items:[],truncated:false};
  // Reuse the SAME declarative construction, agreement, valency, NP and
  // full-token-consumption constraints as the supported present/future parser.
  const combined=matchClauseRules(tokens,indexedMorphologyReadings);
  const out=[];
  for(const {parse,rule,subjectNoun,objectNoun} of combined){
   if(rule.roles==='none')continue;
   const roles=[subjectNoun,objectNoun].filter(Boolean);
   if(roles.some(n=>!/^https:\/\/[^/\s]+/u.test(n.source||'')))continue;
   out.push({
    grade:'indexed-morphology clause hypothesis (NOT a translation)',
    constructionId:rule.id,coverage:tokens.length,
    verb:{written:tokens.find(t=>norm(t)===norm(
     paradigms.paradigms[parse.lemma].cells[parse.patternIndex][parse.person]))||'',
     lemma:parse.lemma,patternIndex:parse.patternIndex,
     pattern:parse.tense,subjectPerson:PERSON_CODES[parse.person],
     lexicalMeaning:parse.lexicalMeaning,transitive:parse.transitive,
     evidence:'exact grammar-derived matrix cell; NOT manuscript-attested'},
    argumentRoles:{subjectNoun:subjectNoun?.word||null,
     objectNoun:objectNoun?.word||null,
     implicitObject:parse.transitive&&!objectNoun?'unresolved third-person object':null,
     nominalMeanings:roles.map(n=>({lemma:n.word,meaning:n.meaning,source:n.source}))},
    sources:[...new Set([rule.source_url,grammar,tenseSource,parse.source,
     parse.lexicalSource,...roles.map(n=>n.source)].filter(Boolean))],
    note:'Entire written input is accounted for by a source-cited editorial construction and '+
     'an exact grammar-derived finite form. This is NOT a complete translation, '+
     'historical attestation, tense/aspect certification, or contextual sense judgment. '+
     'Alternatives are not ranked. No unknown word, new tense rendering, '+
     'unverified person/object substitution, or manuscript spelling is invented.'
   });
  }
  return {items:out.slice(0,32),truncated:out.length>32};
 }
 // Source-linked possessed noun forms are NEVER freely generated from prefixes.
 // This bounded first phase recognizes only exact cited first-person no- forms
 // already in the dictionary; it does not infer a whole possessive paradigm.
 function resolveRecordedPossessed(token){
  if(typeof token!=='string'||!/^[\p{L}\p{M}’'-]{3,120}$/u.test(token)||
   !norm(token).startsWith('no'))return null;
  const rows=words.filter(w=>String(w.pos).includes('noun')&&
   norm(String(w.possessed||'').split('(')[0].trim())===norm(token));
  if(rows.length!==1)return null;
  const w=rows[0],claim=(w.claims||[]).filter(c=>c.field==='possessed'&&
   ['dictionary','grammar','text'].includes(c.assessment)&&
   typeof c.locator==='string'&&c.locator.trim()&&
   typeof c.source==='string'&&/^https:\/\/[^/\s]+/u.test(c.source));
  if(claim.length!==1||!/^https:\/\/[^/\s]+/u.test(w.source||''))return null;
  const hits=exactMorphology(token).filter(m=>
   m.kind==='Editorially listed possessed form'&&m.grade==='lexical'&&
   m.lemma===w.word&&m.source===claim[0].source&&
   m.features?.partOfSpeech==='noun'&&m.features?.evidence===claim[0].assessment&&
   m.locator===claim[0].locator&&
   m.parts?.length===2&&norm(m.parts[0].surface)==='no'&&
   m.parts[0].role.includes('1sg possessive prefix')&&
   norm(m.parts.map(p=>p.surface).join(''))===norm(token));
  if(hits.length!==1)return null;
  return {word:w.word,meaning:w.meaning,source:w.source,written:token,
   possessor:'1sg',possessorSource:claim[0].source,possessorLocator:claim[0].locator,
   kind:'exact source-located possessed noun (1sg no-)',morphSource:hits[0].source};
 }
 function possessedAgreementProposals(tokens,negative){
  if(negative||tokens.length<2||tokens.length>4)return {items:[],truncated:false};
  const readVerb=token=>[...(index.get(norm(token))||[]),
   ...indexedMorphologyReadings(token)];
  const matches=matchClauseRules(tokens,readVerb,{possessed:resolveRecordedPossessed})
   .filter(x=>x.rule.sequence.includes('PNP'));
  const result=[];
  for(const {parse,rule,subjectNoun,objectNoun} of matches){
   const possessed=subjectNoun||objectNoun;
   if(!possessed?.possessorSource)continue;
   const subject=PERSON_CODES[parse.person],verbIndex=parse.patternIndex;
   const isIndexedNonpresent=Number.isInteger(verbIndex);
   const verbSurface= isIndexedNonpresent?
    paradigms.paradigms[parse.lemma]?.cells?.[verbIndex]?.[parse.person]:
    [...index.entries()].find(([k,entries])=>entries.some(
     e=>e===parse))?.[0];
   if(!verbSurface)continue;
   result.push({
    grade:'source-located possession + grammatical role hypothesis (NOT a translation)',
    constructionId:rule.id,coverage:tokens.length,
    verb:{written:tokens.find(t=>norm(t)===norm(verbSurface))||verbSurface,
     lemma:parse.lemma,subject,objectAgreement:parse.transitive?'indexed fixed 3sg':'intransitive',
     pattern:parse.tense,patternIndex:isIndexedNonpresent?verbIndex:null,
     evidence:isIndexedNonpresent?'exact grammar-derived nonpresent matrix cell':'exact indexed present/future cell'},
    possessedNoun:{written:possessed.written,lemma:possessed.word,
     fullMeaning:possessed.meaning,possessor:possessed.possessor,
     role:subjectNoun?'possible grammatical subject':'possible grammatical object',
     source:possessed.possessorSource,locator:possessed.possessorLocator},
    sourceLinks:[...new Set([rule.source_url,parse.source,possessed.source,
     possessed.possessorSource,grammar,tenseSource].filter(Boolean))],
    note:'The nominal 1sg possessor and finite verb subject are independent grammatical features. '+
     'Do NOT infer that they refer to the same person or reject different persons. '+
     'All source-spelled tokens are consumed; the noun form is exact and source-located, '+
     'but sentence meaning, historical attestation, actual subject/object attachment '+
     'and tense/aspect are NOT verified. No English sentence is generated.'
   });
  }
  return {items:result.slice(0,24),truncated:result.length>24};
 }
 function analyzeMultiClause(raw){
  if(typeof raw!=='string'||raw.length>7000||raw.length<8||
   /[?¿!¡."“”()\n]/u.test(raw))return null;
  const input=raw.trim(),parts=[];
  let relation,marker,markers=[];
  if(/^intla\s/iu.test(input)){
   // Require a visible comma or semicolon separating condition and outcome.
   // No nested connectives, conditional-negative contractions or unknown mood.
   const match=/^intla\s+([^,;]+?)\s*[,;]\s*([^,;]+?)$/iu.exec(input);
   if(!match)return null;
   if(/\bauh\b|\bintla\b|\bihuan\b/iu.test(match[1]+' '+match[2])||
    /^ahm[oō]\s/iu.test(match[1].trim()))return null;
   // Negative protasis is historically marked with a different conjunction
   // (intlācamo), not an automatically generated "intla ahmo" sequence.
   parts.push(match[1].trim(),match[2].trim());
   relation='conditional antecedent and consequent';
   marker='intla';markers=['intla'];
  }else{
   if(!/\bauh\b/iu.test(input))return null;
   // "auh" only: other conjunctives such as ihuan can connect nouns or
   // differently scoped constituents; don't silently reclassify them.
   if(/\bintla\b|\bihuan\b/iu.test(input))return null;
   const split=input.split(/\s*,?\s+auh\s+/iu).map(x=>x.trim());
   if(split.length<2||split.length>3||split.some(x=>!x||/[,;]/u.test(x)))return null;
   parts.push(...split);relation='explicit discourse / clause coordination';
   marker='auh';markers=split.slice(1).map(()=>marker);
  }
  if(parts.some(x=>x.length>500||/[\p{C}]/u.test(x)))return null;
  const children=[];
  for(const part of parts){
   const r=analyze(part);
   if(r.clauses?.length!==1||r.multiClauseProposals?.length)return null;
   const clause=r.clauses[0];
   // Accept only grammar-indexed finite forms (not a merely recorded
   // isolated gloss) or the already bounded finite+locative composition.
   const complete=(clause.candidates||[]).filter(c=>
    c.grade==='grammar-derived candidate'&&c.coverage===clause.tokens.length);
   const complex=(clause.complexClauseProposals||[]).filter(c=>
    c.grade==='grammar-composed verb + relational location (unattested; NOT a verified translation)'&&
    c.coverage===clause.tokens.length);
   if(!complete.length&&!complex.length)return null;
   children.push({clause,finiteReadings:complete,complexReadings:complex});
  }
  const clauses=children.map(c=>c.clause);
  const segments=children.map((item,i)=>{
   const finite=item.finiteReadings.length?item.finiteReadings:item.complexReadings;
   const subjectPersons=[...new Set(finite.map(c=>
    item.finiteReadings.length?PERSON_CODES[c.frame.subjectPerson]:c.verb.subjectPerson))];
   return {
    index:i,text:parts[i],
    role:relation==='conditional antecedent and consequent'?
     i===0?'conditional antecedent (mood/force NOT independently verified)':
      'proposed consequent (consequence type NOT independently verified)':
     'independent clause / discourse unit',
    finiteAnalysisKind:item.finiteReadings.length?'indexed complete clause grammar':
     'finite+locative structural proposals only',
    alternativeCount:finite.length,
    subjectPersons,
    locationExpressions:[...new Set(item.complexReadings.map(c=>c.location.written))],
    unresolved:item.finiteReadings.length?
     'Grammar-derived English sense candidates are NOT exhaustive or independently verified':
     'Locative attachment and lexical senses remain unresolved; not a completed sentence translation'
   };
  });
  return {
   clauses,complete:false,
   contextLinks:explicitContextLinks(clauses),
   multiClauseProposals:[{
    relation,markers,segments,
    clauseCount:parts.length,
    coverage:parts.reduce((total,x)=>total+x.split(/\s+/u).length,0)+markers.length,
    grade:'overt Classical clause-linking hypothesis (NOT an independently verified translation)',
    sources:[MULTICLAUSE_GRAMMAR[marker],...(marker==='intla'?[MULTICLAUSE_GRAMMAR.conditions]:[]),
     grammar,tenseSource],
    note:marker==='auh'?
     'Auh marks a clause or discourse transition and may have continuative or contrastive force. Its English value (and/but/well) is NOT selected. No omitted subject, logical entailment or shared speaker is inferred.':
     'Intla introduces a conditional antecedent in historical grammar, but verb mood, type of condition, truth, causal relation and English if/then realization are NOT established by this bounded pattern. The comma/semicolon is a user-provided segmentation cue, not verified manuscript punctuation.'
   }],
   reason:'Two or more finite-containing units linked by an explicit historical marker. Their relationship is only a bounded structural hypothesis.'
  };
 }
 function analyze(input){
  const raw=String(input||'');
  if(raw.length>7000)return {clauses:[],complete:false,reason:'Input exceeds 7000 characters.'};
  if(/[?¿]/u.test(raw))return {clauses:[{text:raw,tokens:[],candidates:[],complete:false,reason:'Question scope is not yet supported.'}],complete:false};
  const multi=analyzeMultiClause(raw);
  if(multi)return multi;
  const clauses=raw.split(/[.!;\n]+/u).filter(s=>s.trim()).map(text=>{
   const tokens=text.trim().split(/\s+/u),original=tokens.slice();
   let negative=false;
   if(['ahmo','ahmō'].includes(norm(tokens[0]))){negative=true;tokens.shift();}
   const candidates=[];
   for(const {parse,rule,subjectNoun,objectNoun} of matchClauseRules(tokens)){
    const lexical=words.filter(w=>w.word===parse.lemma);
    if(lexical.length!==1)continue;
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
     constructionId:rule.id,constructionSource:rule.source_url,
     nounSenses:[subjectNoun,objectNoun].filter(Boolean).map(n=>({
      lemma:n.word,selected:nouns[n.word]||null,fullMeaning:n.meaning,source:n.source})),
     sources:[...new Set([grammar,tenseSource,rule.source_url,parse.source,lexical[0].source,
      subjectNoun?.source,objectNoun?.source].filter(Boolean))],
     grade:'grammar-derived candidate',
     note:'Illustrative English sense choices, not exhaustive translations. Noun articles, lexical senses, aspect and third-person referents require context; candidate order is not a ranking. Construction '+rule.id+' is editorial grammar formalization, not individually attested.'});
   }
   // Only an isolated, explicitly source-labeled finite token can contribute
   // a new gloss. No words on either side may be silently discarded.
   if(!candidates.length&&!negative&&tokens.length===1){
    candidates.push(...exactFiniteReadings(tokens[0],exactMorphology(tokens[0])));
   }
   return {text,tokens:original,candidates,complete:candidates.length>0,
    fragmentInterpretations:candidates.length?[]:fragmentInterpretations(tokens,negative),
    locativeInterpretations:candidates.length?[]:locativeAnalyze(tokens,negative),
    complexClauseProposals:candidates.length?[]:finiteLocativeProposals(tokens,negative),
    morphosyntactic: morphologyClauseCandidates(tokens,negative),
    possessedAgreement: possessedAgreementProposals(tokens,negative),
    agreementProposals:candidates.length?[]:sourceAgreement(original,negative),
    morphologicalClues:candidates.length?[]:partialClues(original),
    roleAmbiguous:new Set(candidates.map(c=>JSON.stringify([c.frame.subjectNoun,c.frame.objectNoun]))).size>1,
    reason:candidates.length?'':'Outside supported clause grammar; no words were silently discarded. Partial morphology below is not a complete reading.'};
  });
  return {clauses,complete:clauses.length>0&&clauses.every(c=>c.complete),
   contextLinks:explicitContextLinks(clauses)};
 }
 return {analyze};
}
root.TlahtolliSentence={create};
})(window);
