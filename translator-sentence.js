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

function create(dictionary,paradigms,morphology,researchExamples,locative,grammarRules,possessiveEvidence,sourceFiniteEvidence,historicalPassages,predicateEnglish,poeticEvidence){
 // Reuse existing source-sensitive morphology, never a new guessed conjugator.
 // This optional provider is the canonical morphology engine's analyze(token).
 const parseMorph=typeof morphology==='function'?morphology:()=>[];
 const PERSON_CODES=['1sg','2sg','3sg','1pl','2pl','3pl'];
 // Research-grade *passage-specific* analysis, not a new spelling normalizer
 // or lexical rewrite. Only the two explicitly reviewed snippets in a trusted
 // source file may be marked as likely sung vocables. The homographic yauh
 // 'went' remains possible in all other sentences and is never hidden.
 function poeticVocableObservations(input){
  const doc=poeticEvidence;
  const guard=doc?.guardrails;
  if(doc?.format!=='tentli-huiya-contextual-poetic-evidence-v1'||
   doc.method_source?.author!=='Birgitta Leander'||
   doc.method_source?.year!==1972||
   doc.method_source?.printed_pages!=='53-54'||
   doc.method_source?.all_potential_spellings_context_dependent!==true||
   doc.method_source?.verbal_and_particle_homographs_preserved!==true||
   doc.separate_lexical_sense?.lexeme!=='yauh'||
   doc.separate_lexical_sense?.exact_written_form!=='huiya'||
   doc.separate_lexical_sense?.remains_allowed!==true||
   !Array.isArray(doc.observations)||doc.observations.length!==2||
   !['no_global_huiya_to_vocable_rewrite','no_global_huiya_to_go_rewrite',
     'no_global_interjection_stopword_set','retain_original_poetic_refrains',
     'retain_grapheme_spellings_and_diacritics','no_automatic_word_deletion',
     'do_not_exclude_from_source_counts','other_huiya_occurrences_pending_context_review']
      .every(key=>guard?.[key]===true)||
   guard.approved_gold!==0||guard.approved_silver!==0||
   guard.training_eligible!==false||guard.new_dictionary_edits!==0||
   guard.model_weights_updated!==false)return [];
  const expected=['brinton-xv-02-huiya','cantares-18v-304-huiya'];
  const original=String(input||'').normalize('NFC').toLowerCase()
   .match(/[\p{L}\p{M}]+/gu)||[];
  if(original.length>512)return [];
  const matched=[];
  for(const [i,row] of doc.observations.entries()){
   if(row?.id!==expected[i]||row.exact_written_form!=='huiya'||
    row.review_scope!=='this_occurrence_only'||
    row.interpretation_not_global!==true||
    row.context_role!=='sung_interjection_or_poetic_vocable_in_this_stanza'||
    row.manuscript_image_collated!==false||
    row.whole_stanza_english_semantics_reviewed!==false||
    row.reviewer_independence!=='not_independently_authenticated'||
    typeof row.source_url!=='string'||!/^https:\/\/[^\s/]+\//u.test(row.source_url)||
    typeof row.short_source_fragment!=='string'||row.short_source_fragment.length>180)continue;
   const pattern=row.short_source_fragment.normalize('NFC').toLowerCase()
    .match(/[\p{L}\p{M}]+/gu)||[];
   if(pattern.length<5||pattern.filter(x=>x==='huiya').length!==1)continue;
   for(let start=0;start+pattern.length<=original.length;start++){
    if(!pattern.every((t,k)=>t===original[start+k]))continue;
    matched.push({
     originalWrittenForm:'huiya',
     originalTokenIndex:start+pattern.indexOf('huiya'),
     sourceId:row.id,historicalWorkId:row.historical_work_id,
     originalSourceUrl:row.source_url,printedContext:row.short_source_fragment,
     methodologyUrl:doc.method_source.source_url,
     possibleRole:'sung-poetic-vocable-in-this-cited-passage',
     competingVerbalLemma:'yauh',
     competingVerbalSource:doc.separate_lexical_sense.source_url,
     evidenceTier:'project-director-context-assessment-plus-scholarly-vocable-category',
     wholeClauseTranslationVerified:false,
     sourceManuscriptImageChecked:false,
     universallyVocable:false,
     englishDeletionPermitted:false,
     remainingSongOccurrencesUnreviewed:true
    });
    break;
   }
  }
  return matched;
 }

 const locativeAnalyze=typeof locative?.analyze==='function'?locative.analyze:()=>[];
 const EVIDENCE_GRADES=new Set(['manuscript','lexical','grammar','lemma','paradigm','hypothesis','analogy','unreviewed']);
 let morphologyMemo=null;
 function exactMorphology(token){
  if(!/^[\p{L}\p{M}’'\-\u00AF]{1,120}$/u.test(token))return []; // spacing overbar is a source-recorded abbreviation, not vowel length
  if(morphologyMemo?.has(token))return morphologyMemo.get(token);
  try{
   const matches=parseMorph(token);
   const accepted=Array.isArray(matches)?matches.filter(m=>m&&EVIDENCE_GRADES.has(m.grade)&&
    typeof m.lemma==='string'&&typeof m.kind==='string'&&
    m.parts&&Array.isArray(m.parts)).slice(0,20):[];
   if(morphologyMemo&&morphologyMemo.size<2048)morphologyMemo.set(token,accepted);
   return accepted;
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
   const w=words.filter(w=>w.word===m.lemma&&/^verb(?:\s*\(|$)/u.test(String(w.pos)));
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
 // Optional editorial English lexicon. This licenses wording only; every
 // finite surface must still come from the existing canonical analyzer.
 // Missing/stale data leaves legacy indexed grammar available.
 const predicateLexicon=new Map(),duplicatePredicates=new Set();
 const claim=(w,field)=>(w.claims||[]).filter(c=>c.field===field&&
  ['dictionary','grammar','text'].includes(c.assessment)&&
  /^https:\/\//u.test(c.source||'')&&typeof c.locator==='string'&&c.locator.trim());
 if(predicateEnglish?.format==='tlahtolli-predicate-english-v1'&&predicateEnglish.version===1)
  for(const e of Array.isArray(predicateEnglish.entries)?predicateEnglish.entries:[]){
   if(predicateLexicon.has(e?.lemma)){duplicatePredicates.add(e.lemma);continue;}
   const matches=words.filter(w=>w.word===e?.lemma);
   if(matches.length!==1)continue;
   const w=matches[0];
   if(w.status!=='Checked against source'||w.source!==e.source||w.pos!==e.pos||
    w.meaning!==e.dictionaryMeaning||!['verb (intransitive)','verb (transitive)',
     'verb (transitive/reflexive)'].includes(w.pos)||
    !['headword','meaning','pos'].every(f=>claim(w,f).some(c=>c.source===e.source))||
    !Array.isArray(e.senses)||!e.senses.length||e.senses.length>8||
    !e.senses.every(s=>['base','third','past'].every(k=>typeof s[k]==='string'&&
     /^[a-z]+(?: [a-z]+){0,9}$/u.test(s[k]))))continue;
   predicateLexicon.set(e.lemma,{...e,word:w});
  }
 for(const lemma of duplicatePredicates)predicateLexicon.delete(lemma);
 const productiveKinds=new Set(['Regular intransitive present hypothesis',
  'Source-template singular preterite hypothesis','Source-template transitive present hypothesis',
  ...['Source-class1','Source-stem-class'].flatMap(prefix=>[
   'third-person preterite','future','plural preterite','plural future','plural present'
  ].map(kind=>prefix+' '+kind+' hypothesis'))]);
 function productiveReadings(token){
  if(!predicateLexicon.size)return [];
  const readings=[],seen=new Set();
  for(const m of exactMorphology(token)){
   const e=predicateLexicon.get(m.lemma);
   if(!e||paradigms.paradigms?.[m.lemma])continue;
   const w=e.word;
   let person=PERSON_CODES.indexOf(m.features?.subject),tense=String(m.features?.tense||'').toLowerCase();
   let object=m.features?.object||null,recorded=null;
   if(m.grade==='hypothesis'&&productiveKinds.has(m.kind)){
    if(norm(m.parts.filter(p=>p.surface!=='Ø').map(p=>p.surface).join(''))!==norm(token)||
     ![...w.claims,...(w.inflections||[])].some(c=>c.source===m.source)||
     !m.locator||!['present','future','preterite'].includes(tense)||person<0)continue;
    if(m.kind==='Regular intransitive present hypothesis'){
     if(w.pos!=='verb (intransitive)'||tense!=='present'||person>1)continue;
     object='intransitive';
    }else{
     if(!(w.inflections||[]).some(f=>/^Preterite 1sg\b/u.test(f.category)&&
      ['dictionary','text'].includes(f.evidence)&&/^https:\/\//u.test(f.source||'')))continue;
     if(/^Source-(class1|stem-class)/u.test(m.kind)&&!claim(w,'stem').length)continue;
    }
   }else if(['lexical','manuscript'].includes(m.grade)){
    // Never use the morphology engine's diacritic-folded match as an exact
    // historical form. Person/tense must be explicitly in the recorded label.
    recorded=(w.inflections||[]).find(f=>norm(f.form)===norm(token)&&
     f.category===m.kind&&f.source===m.source&&['dictionary','text'].includes(f.evidence)&&
     /^Preterite 1sg\b/u.test(f.category));
    if(!recorded||typeof recorded.note!=='string'||!recorded.note.trim())continue;
    person=0;tense='preterite';
    object=w.pos==='verb (intransitive)'?'intransitive':
     /\banimate indefinite object/iu.test(recorded.category)?'human indefinite (recorded)':
     /unspecified object/iu.test(recorded.category)?'nonhuman indefinite (recorded)':null;
   }else continue;
   const intransitive=object==='intransitive'&&w.pos==='verb (intransitive)';
   const indefinite=!intransitive&&w.pos!=='verb (intransitive)'&&
    /^(?:nonhuman|human) indefinite \(/u.test(object||'');
   if(!intransitive&&!indefinite)continue; // no invented specific/reflexive object
   const objectEnglish=intransitive?null:object.startsWith('nonhuman')?'something':'someone';
   const evidence={written:token,lemma:m.lemma,kind:m.kind,grade:m.grade,
    source:m.source,locator:recorded?.note||m.locator,person,tense,
    object:intransitive?'intransitive':objectEnglish,meaning:e.dictionaryMeaning};
   const key=JSON.stringify([m.lemma,person,tense,evidence.object]);
   if(seen.has(key))continue;seen.add(key);
   readings.push({lemma:m.lemma,person,tense,transitive:!intransitive,
    source:m.source,indefiniteObject:objectEnglish,productive:evidence,senses:e.senses});
  }
  return readings;
 }
 const readFinite=token=>[...(index.get(norm(token))||[]),...productiveReadings(token)];
 function predicateSenses(parse){return parse.senses||
  (verbs[parse.lemma]||[]).map(([base,third])=>({base,third}));}
 function englishVerb(s,parse,negative){
  if(parse.tense==='future')return 'will '+(negative?'not ':'')+s.base;
  if(s.base.startsWith('be ')){
   const be=parse.tense==='preterite'?(parse.person===0||parse.person===2?'was':'were'):
    parse.person===0?'am':parse.person===2?'is':'are';
   return be+(negative?' not':'')+s.base.slice(2);
  }
  if(negative)return (parse.tense==='preterite'?'did':parse.person===2?'does':'do')+' not '+s.base;
  return parse.tense==='preterite'?s.past:parse.person===2?s.third:s.base;
 }
 function validateProductiveFrame(frame){
  const evidence=frame?.morphologyEvidence;
  if(!evidence)return false;
  return productiveReadings(evidence.written).some(p=>
   JSON.stringify(p.productive)===JSON.stringify(evidence)&&p.lemma===frame.predicate&&
   p.person===frame.subjectPerson&&p.tense===frame.tense&&
   (!p.indefiniteObject||frame.object===p.indefiniteObject&&!frame.objectNoun)&&
   (p.transitive||frame.object===null&&frame.objectNoun===null));
 }
 function noun(token){
  const hits=words.filter(w=>w.pos==='noun'&&[w.word,...String(w.original||'').split(/[;,/]/)].some(f=>norm(f.trim())===norm(token)));
  return hits.length===1?hits[0]:null;
 }
 const nounLabel=n=>'the '+(nouns[n.word]||'['+n.meaning+']');

 // Noun coordination is distinct from the existing AUH clause coordinator.
 // It is a bounded NP structure, NOT a clause/subject/object interpretation.
 const coordinationLexeme=words.filter(w=>w.word==='īhuān'&&
  w.pos==='conjunction / postpositional construction'&&
  /^https:\/\/[^/\s]+/u.test(w.source||''));
 const inMarker=words.filter(w=>w.word==='in'&&
  w.pos==='grammatical particle / subordinator'&&
  /^https:\/\/[^/\s]+/u.test(w.source||''));
 const FLOR_FOLIO='https://florentinecodex.getty.edu/book/11/folio/217r';
 const tidyCoordToken=t=>String(t).replace(/,+$/u,'');
 function attestedIoanWindow(tokens){
  const rows=historicalPassages?.records;
  if(!Array.isArray(rows)||rows.length>150)return null;
  for(const row of rows){
   if(!row||row.reading_status!=='edited_transcription_candidate'||
     row.train_eligible!==false||row.reader?.source!==FLOR_FOLIO||
     typeof row.original!=='string'||row.original.length>1500)continue;
   const observed=row.original.split(/\s+/u).map(t=>t.replace(/[;,]+$/u,''));
   for(let start=0;start+tokens.length<=observed.length;start++){
    if(tokens.every((token,k)=>norm(tidyCoordToken(token))===norm(observed[start+k])))
     return {passageId:row.id,source:FLOR_FOLIO,
      status:'exact editorial word sequence, NOT an independently certified grammatical parse'};
   }
  }
  return null;
 }
 function nominalCoordinationProposals(tokens,negative){
  if(negative||tokens.length<3||tokens.length>5||
     coordinationLexeme.length!==1||inMarker.length!==1)return [];
  const con=coordinationLexeme[0],mark=inMarker[0];
  const cueIndices=tokens.map((t,i)=>({t,i})).filter(x=>
   norm(tidyCoordToken(x.t))==='ioan'||
   [con.word,...String(con.original||'').split(/[;,/]/)].some(v=>
    norm(v.trim())===norm(tidyCoordToken(x.t)))).map(x=>x.i);
  if(cueIndices.length!==1)return [];
  const at=cueIndices[0],sides=[tokens.slice(0,at),tokens.slice(at+1)];
  if(sides.some(x=>x.length<1||x.length>2))return [];
  const phrases=[];
  for(const [side,tokensHere] of sides.entries()){
   const marked=tokensHere.length===2;
   if(marked&&norm(tokensHere[0])!=='in')return [];
   const original=tokensHere[tokensHere.length-1],surface=tidyCoordToken(original);
   if(!surface||surface!==original&&(!original.endsWith(',')||side!==0))return [];
   const n=noun(surface);
   if(!n||n.pos!=='noun'||!/^https:\/\/[^/\s]+/u.test(n.source||''))return [];
   phrases.push({written:original,headword:n.word,headSource:n.source,
    tokenIndex:side===0?at-1:tokens.length-1,
    articleMarker:marked?'in':null,articleSource:marked?mark.source:null,
    gloss:nouns[n.word]||null,fullMeaning:n.meaning});
  }
  const cue=tokens[at],historic=norm(cue)==='ioan';
  const witness=historic?attestedIoanWindow(tokens):null;
  // 'ioan' is a source-recorded historical spelling, not a free global
  // modernization of every unverified word that happens to resemble īhuān.
  if(historic&&!witness)return [];
  const cited=[con.source,...phrases.map(x=>x.headSource),
    ...phrases.map(x=>x.articleSource),witness?.source].filter(Boolean);
  return [{family:'nominal-coordination',coverage:tokens.length,
   written:tokens.slice(),lemma:con.word,
   connector:{written:cue,lemma:con.word,tokenIndex:at,source:historic?FLOR_FOLIO:con.source,
    meaningAlternatives:['and','together with'],selectedMeaning:null,
    spellingEvidence:historic?'exact editorial manuscript-location window':
      'curated historical dictionary spelling'},
   nouns:phrases,sourceWindow:witness,
   grade:'source-checked NP coordination hypothesis; NOT a clause translation',
   sources:[...new Set(cited)],
   note:'Two independently cited noun headwords flank an independently sourced '+
    'coordination/with-form. The nouns are not assigned grammatical roles, '+
    'number, agreement, or referent identity. This structure may mean AND '+
    'or TOGETHER WITH; no English sentence is licensed. '+
    (witness?'Exact words are in an edited source window, NOT a certified parse.':
      'The combined noun phrase is grammatical composition, NOT an attested manuscript quote.')}];
 }


 // Attach the EXISTING noun-coordination analysis to an indexed INTRANSITIVE
 // third-person finite predicate only when independently documented number
 // agreement and the curated noun animacy classes permit the proposal.
 // This does not declare a historical sentence or produce English wording.
 const COORDINATED_AGREEMENT_SOURCE='https://gdn.iib.unam.mx/diccionario/ihuan/50956';
 function coordinatedSubjectProposals(tokens,negative){
  if(negative||tokens.length<4||tokens.length>6)return [];
  const out=[];
  for(const position of [0,tokens.length-1]){
   const verb=tokens[position],start=position===0?1:0;
   const nominalTokens=position===0?tokens.slice(1):tokens.slice(0,-1);
   const nps=nominalCoordinationProposals(nominalTokens,false);
   if(nps.length!==1)continue;
   const np=nps[0];
   const entries=np.nouns.map(h=>noun(tidyCoordToken(h.written)));
   if(entries.some((x,i)=>!x||x.word!==np.nouns[i].headword||
      x.source!==np.nouns[i].headSource||
      !['animate','inanimate'].includes(x.animacy)))continue;
   if(entries[0].animacy!==entries[1].animacy)continue;
   const animacy=entries[0].animacy;
   const lexicalVerbs=index.get(norm(verb))||[];
   for(const parse of lexicalVerbs){
    if(parse.transitive||![2,5].includes(parse.person)||parse.tense!=='present')continue;
    // An inanimate pair can only accompany singular verbal agreement;
    // two animate singulars may take singular OR plural, not an inferred choice.
    if(animacy==='inanimate'&&parse.person!==2)continue;
    const lexical=words.filter(w=>w.word===parse.lemma&&w.source===parse.source);
    if(lexical.length!==1||!/^https:\/\/[^/\s]+/u.test(parse.source||''))continue;
    const agreement=parse.person===2?'3sg':'3pl';
    const sources=[...new Set([...np.sources,parse.source,grammar,
      COORDINATED_AGREEMENT_SOURCE])];
    out.push({family:'coordinated-subject-attachment',coverage:tokens.length,
     written:tokens.slice(),nominalStart:start,nominal:np,
     predicate:{written:verb,tokenIndex:position,lemma:parse.lemma,
      tense:parse.tense,transitive:false,subjectPerson:agreement,source:parse.source},
     nominalAnimacy:animacy,possibleRole:'coordinated nominal subject',
     subjectAgreement:agreement,numberAgreementSource:COORDINATED_AGREEMENT_SOURCE,
     grade:'source-licensed coordination + indexed intransitive agreement hypothesis; NOT a translation',
     sources,
     note:'A complete-token structural hypothesis, NOT an independently attested '+ 
      'sentence or English translation. Two singular citation nouns are joined '+ 
      'by an unresolved and/with construction; grammatical subject attachment '+ 
      'is a conditional proposal, not a resolved meaning. The independent '+ 
      'Classical source permits singular or plural agreement with two animate '+ 
      'singulars, but only singular with inanimates. Lexical sense, coordination '+ 
      'versus comitative scope, discourse reference and actual occurrence remain unverified.'});
   }
  }
  return out.slice(0,8);
 }


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
   const verbReadings=readFinite(tokens[vi]);
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
     const semantic=predicateSenses(parse);
     if(!Array.isArray(semantic)||!semantic.length)continue;
     for(const [subjectNoun,objectNoun] of assignments(parse,phrases)){
      if(parse.indefiniteObject&&objectNoun)continue;
      const locativeWritten=locationTokens.join(' ');
      const attachmentAlternatives=phrases.length?
       ['possible clause/event location','possible modification of the overt noun phrase']:
       ['possible clause/event location'];
      const subj=subjectNoun?nounLabel(subjectNoun):people[parse.person];
      const role=parse.transitive?
       objectNoun?{type:'overt third-person object',word:objectNoun.word,meaning:objectNoun.meaning}:
       parse.indefiniteObject?{type:'indefinite object preserved from morphology',word:null,meaning:parse.indefiniteObject}:
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
        indexedEvidence:parse.productive?'source-gated morphology hypothesis or recorded form; not contextual attestation':'generated present/future paradigm, not independently attested'},
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
  const getVerbs=typeof readVerbs==='function'?readVerbs:readFinite;
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
    for(const [subjectNoun,objectNoun] of assignments){
     if(parse.indefiniteObject&&objectNoun)continue;
     proposals.push({parse,rule,subjectNoun,objectNoun});
    }
   }
  }
  return proposals;
 }
 // Exact editorial source-listed finite forms are distinct from generated paradigm
 // cells. Keep person and phrase-attachment uncertainty in every result.
 function compileSourceFiniteEvidence(pack){
  const empty=new Map();
  if(!pack||pack.format!=='tlahtolli-source-finite-context-v1'||
    pack.version!==1||pack.train_eligible!==false||pack.evaluation_eligible!==false||
    !Array.isArray(pack.records)||pack.records.length<1||pack.records.length>16)return empty;
  const mapped=new Map();
  for(const r of pack.records){
   if(!r||typeof r.id!=='string'||!/^[a-z0-9-]{8,90}$/.test(r.id)||
     typeof r.form!=='string'||!/^[\p{L}\p{M}]{3,120}$/u.test(r.form)||
     typeof r.lemma!=='string'||r.kind!=='Historically transcribed finite form'||
     typeof r.source_url!=='string'||!/^https:\/\/[^/\s]+/u.test(r.source_url)||
     typeof r.source_locator!=='string'||!r.source_locator.trim()||
     r.status!=='source-located editorial finite hypothesis; not facsimile-certified'||
     r.valency!=='intransitive'||typeof r.person_status!=='string'||!r.person_status.trim()||
     ![null,'2sg'].includes(r.subject_person)||typeof r.note!=='string'||!r.note.trim()||
     mapped.has(norm(r.form)))return empty;
   const exact=words.filter(w=>w.word===r.lemma&&w.pos==='verb (intransitive)'&&
     (w.inflections||[]).filter(f=>norm(f.form)===norm(r.form)&&
       f.category===r.kind&&f.evidence==='text'&&f.source===r.source_url).length===1);
   if(exact.length!==1)return empty;
   const entry=exact[0].inflections.find(f=>norm(f.form)===norm(r.form)&&
     f.category===r.kind&&f.evidence==='text'&&f.source===r.source_url);
   // A person label must ALSO be in the preexisting cited editorial entry.
   // An unmarked historical spelling must never be changed into 2sg by JSON edits.
   const editorial2sg=/\b(?:second[-\s]person singular|2sg)\b/i
     .test(String(entry.gloss||'')+' '+String(entry.note||''));
   if((r.subject_person==='2sg')!==editorial2sg)return empty;
   mapped.set(norm(r.form),r);
  }
  return mapped;
 }
 const locatedSourceFinite=compileSourceFiniteEvidence(sourceFiniteEvidence);
 function sourceFiniteReading(token){
  const record=locatedSourceFinite.get(norm(token));
  if(!record)return null;
  const forms=exactMorphology(token).filter(m=>m.lemma===record.lemma&&
    m.kind===record.kind&&m.grade==='manuscript'&&m.features?.evidence==='text'&&
    m.source===record.source_url&&m.parts?.length>0&&
    norm(m.parts.map(p=>p.surface).join(''))===norm(token));
  if(forms.length!==1)return null;
  const w=words.find(w=>w.word===record.lemma&&w.pos==='verb (intransitive)');
  if(!w||!/^https:\/\/[^/\s]+/u.test(w.source||''))return null;
  return {record,lexical:w};
 }

 // A bare noun is admitted only if the EXACT word sequence appears in an
 // already-source-located editorial excerpt; never infer an attested parse.
 function sourceWindow(tokens,record){
  const passages=historicalPassages?.records;
  if(!Array.isArray(passages)||passages.length>150)return null;
  for(const p of passages){
   if(p?.reading_status!=='edited_transcription_candidate'||p.train_eligible!==false||
      p.reader?.source!==record.source_url||typeof p.original!=='string'||p.original.length>1500)continue;
   const written=p.original.split(/\s+/u).map(t=>t.replace(/^[,.;!?]+|[,.;!?]+$/gu,'')).filter(Boolean);
   for(let i=0;i<=written.length-tokens.length;i++)
    if(tokens.every((t,j)=>norm(t)===norm(written[i+j])))
     return {passageId:p.id,source:record.source_url,
      status:'contiguous edited witness; grammar and manuscript line unverified'};
  }
  return null;
 }
 function sourceRelational(token){
  const matches=words.filter(w=>w.pos==='relational noun / locative'&&
    /^https:\/\/[^/\s]+/u.test(w.source||'')&&
    [w.word,...String(w.original||'').split(/[;,/]/)]
      .some(v=>norm(v.trim())===norm(token)));
  return matches.length===1?
   {written:token,lemma:matches[0].word,source:matches[0].source,
    referentStatus:'relational possessor and attachment UNRESOLVED'}:null;
 }
 function historicalFiniteContextProposals(tokens,negative){
  if(negative||tokens.length<2||tokens.length>4)return [];
  const matches=tokens.map((token,index)=>({index,found:sourceFiniteReading(token)}))
    .filter(x=>x.found);
  if(matches.length!==1)return [];
  const {index,found}=matches[0],record=found.record;
  const verb={written:tokens[index],tokenIndex:index,lemma:record.lemma,
    subjectPerson:record.subject_person||'unresolved',
    personStatus:record.person_status,tenseStatus:'not independently established',
    valency:'intransitive',evidence:'exact source-recorded finite form',
    source:record.source_url,locator:record.source_locator};
  const output=(construction,rule,nounPhrase,adverb,relational,witness=null)=>({
   constructionId:rule?.id||construction,construction,
   grade:'source-recorded finite + bounded grammatical hypothesis (NOT an attested sentence)',
   coverage:tokens.length,verb,nounPhrase:nounPhrase||null,adverb:adverb||null,
   relational:relational||null,sourceWindow:witness,
   sources:[...new Set([record.source_url,found.lexical.source,rule?.source_url,
     nounPhrase?.source,adverb?.source,relational?.source,witness?.source].filter(Boolean))],
   note:(witness?'Exact written sequence occurs in an already consulted editorial source, but grammar is NOT thereby verified. ':'Only this finite FORM is source-recorded. This complete token sequence is NOT thereby attested. ')+
     'Person evidence: '+record.person_status+'. Tense, argument attachment, adverb scope and '+
     'referent identity are not independently verified. No English translation is licensed.'
  });
  // Reuse EXISTING declarative 3sg intransitive NP grammar only as a
  // conditional possibility, NEVER as evidence that the verb actually has 3sg agreement.
  if(tokens.length===3&&record.subject_person===null){
   const seq=index===0?['V','NP']:index===2?['NP','V']:null;
   const ai=index===0?1:0,ni=index===0?2:1;
   if(seq&&norm(tokens[ai])==='in'){
    const n=noun(tokens[ni]);
    const rule=activeClauseRules.find(r=>r.valency==='intransitive'&&r.roles==='subject'&&
      r.persons.includes(2)&&JSON.stringify(r.sequence)===JSON.stringify(seq));
    if(n&&n.pos==='noun'&&/^https:\/\/[^/\s]+/u.test(n.source||'')&&rule)
     return [output('source finite + overt noun; conditional 3sg subject unverified',
       rule,{written:tokens[ni],lemma:n.word,source:n.source,
        roleStatus:'possible subject ONLY IF unresolved verb person is 3sg'},null)];
   }
  }

  // Combine the SAME recorded finite with the already recognized relational
  // form and a noun. Bare nouns require an exact documentary word-sequence gate.
  if(record.subject_person===null&&tokens.length===3&&index===1){
   const rel=sourceRelational(tokens[0]),n=noun(tokens[2]);
   const witness=rel&&n&&sourceWindow(tokens,record);
   if(witness&&n.pos==='noun'&&/^https:\/\/[^/\s]+/u.test(n.source||''))
    return [output('source finite + relational + witnessed bare noun (role unresolved)',
      null,{written:tokens[2],lemma:n.word,source:n.source,
        roleStatus:'bare noun in cited edited sequence; grammatical role UNRESOLVED'},
      null,rel,witness)];
  }
  // An overt in+NP follows the existing declarative intransitive subject rule,
  // but remains CONDITIONAL because this source verb has unknown person.
  if(record.subject_person===null&&tokens.length===4){
   const front=index===1,back=index===3;
   const ri=front?0:back?2:-1,mi=front?2:0,ni=front?3:1;
   const seq=front?['V','NP']:['NP','V'];
   if(ri>=0&&norm(tokens[mi])==='in'){
    const rel=sourceRelational(tokens[ri]),n=noun(tokens[ni]);
    const rule=activeClauseRules.find(r=>r.valency==='intransitive'&&
      r.roles==='subject'&&r.persons.includes(2)&&
      JSON.stringify(r.sequence)===JSON.stringify(seq));
    if(rel&&n?.pos==='noun'&&/^https:\/\/[^/\s]+/u.test(n.source||'')&&rule)
     return [output('source finite + relational + marked noun (conditional 3sg role)',
      rule,{written:tokens[ni],lemma:n.word,source:n.source,
       roleStatus:'possible subject ONLY IF unverified verb person is 3sg'},
      null,rel)];
   }
  }
  // Source-backed adverbs can modify a finite predicate without assigning
  // its subject person. This is a proposal, not a new source attestation.
  if(tokens.length===2){
   const ai=index===0?1:0;
   const hits=words.filter(w=>String(w.pos).startsWith('adverb')&&
     /^https:\/\/[^/\s]+/u.test(w.source||'')&&
     [w.word,...String(w.original||'').split(/[;,/]/)]
       .some(x=>norm(x.trim())===norm(tokens[ai])));
   if(hits.length===1)
    return [output('source finite + unscoped adverb',null,null,
      {written:tokens[ai],lemma:hits[0].word,source:hits[0].source,
       status:'possible modifier; semantic scope unknown'})];
   const rel=sourceRelational(tokens[ai]);
   if(rel)return [output('source finite + unresolved relational adjunct',null,null,null,rel)];
  }
  return [];
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
 // The 3sg inventory comes from an explicit reviewed-file allowlist, never a
 // guessed i- prefix rule. Malformed/duplicated packages fail closed.
 function compilePossessedEvidence(pack){
  if(!pack||pack.format!=='tlahtolli-exact-possessive-evidence-v1'||
   pack.version!==1||!Array.isArray(pack.records)||
   pack.records.length<1||pack.records.length>8)return new Map();
  const byForm=new Map();
  for(const x of pack.records){
   if(!x||typeof x.id!=='string'||!/^[a-z0-9-]{3,60}$/.test(x.id)||
    !x.id.startsWith('source-3sg-')||x.person!=='3sg'||
    x.possessive_prefix!=='i'||typeof x.form!=='string'||
    !/^i[\p{L}\p{M}’'-]{2,100}$/u.test(x.form)||
    typeof x.lemma!=='string'||typeof x.source!=='string'||
    !/^https:\/\/[^/\s]+/u.test(x.source)||typeof x.locator!=='string'||
    !x.locator.trim()||x.review_status!==
     'source-located editorial candidate; not independent adjudication'||
    typeof x.epistemic_note!=='string'||!x.epistemic_note.includes('Does not establish')||
    byForm.has(norm(x.form)))return new Map();
   // The independent source location and original written dictionary field
   // must both match the editorial record. No source metadata rewriting.
   const hits=words.filter(w=>w.word===x.lemma&&w.pos==='noun'&&
    norm(String(w.possessed||'').split('(')[0].trim())===norm(x.form));
   if(hits.length!==1)return new Map();
   const c=(hits[0].claims||[]).filter(cl=>cl.field==='possessed'&&
    cl.assessment==='text'&&cl.source===x.source&&cl.locator===x.locator);
   if(c.length!==1)return new Map();
   byForm.set(norm(x.form),{lemma:x.lemma,person:'3sg',prefix:'i',
    source:x.source,locator:x.locator});
  }
  return byForm;
 }
 const locatedPossessives=compilePossessedEvidence(possessiveEvidence);
 function resolveRecordedPossessed(token){
  if(typeof token!=='string'||!/^[\p{L}\p{M}’'-]{3,120}$/u.test(token))
   return null;
  const written=norm(token),nominal=locatedPossessives.get(written);
  const owner=written.startsWith('no')?
   {person:'1sg',prefix:'no',lemma:null}:nominal;
  if(!owner)return null;
  const rows=words.filter(w=>w.pos==='noun'&&
   norm(String(w.possessed||'').split('(')[0].trim())===written&&
   (!owner.lemma||w.word===owner.lemma));
  if(rows.length!==1)return null;
  const w=rows[0],claim=(w.claims||[]).filter(c=>c.field==='possessed'&&
   ['dictionary','grammar','text'].includes(c.assessment)&&
   typeof c.locator==='string'&&c.locator.trim()&&
   typeof c.source==='string'&&/^https:\/\/[^/\s]+/u.test(c.source));
  if(claim.length!==1||!/^https:\/\/[^/\s]+/u.test(w.source||''))return null;
  if(nominal&&(claim[0].assessment!=='text'||claim[0].source!==nominal.source||
   claim[0].locator!==nominal.locator))return null;
  const hits=exactMorphology(token).filter(m=>
   m.kind==='Editorially listed possessed form'&&m.grade==='lexical'&&
   m.lemma===w.word&&m.source===claim[0].source&&
   m.features?.partOfSpeech==='noun'&&m.features?.evidence===claim[0].assessment&&
   m.locator===claim[0].locator&&
   m.parts?.length===2&&norm(m.parts[0].surface)===owner.prefix&&
   m.parts[0].role.includes(owner.person+' possessive prefix')&&
   norm(m.parts.map(p=>p.surface).join(''))===written);
  if(hits.length!==1)return null;
  return {word:w.word,meaning:w.meaning,source:w.source,written:token,
   possessor:owner.person,possessorSource:claim[0].source,
   possessorLocator:claim[0].locator,
   kind:'exact source-located possessed noun ('+owner.person+' '+owner.prefix+'-)',
   morphSource:hits[0].source};
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
   if(split.length<2||split.length>24||split.some(x=>!x||/[,;]/u.test(x)))return null;
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
    // Locative parsing receives tokens after the clause-initial negative.
    c.coverage+(c.verb.negative?1:0)===clause.tokens.length);
   const nested=(clause.nestedInProposals||[]).filter(c=>c.coverage===clause.tokens.length);
   const dependent=(clause.nominalInProposals||[]).filter(c=>c.coverage===clause.tokens.length);
   const relative=(clause.relativeClauseProposals||[]).filter(c=>
    c.coverage===clause.tokens.length&&c.matrix);
   if(!complete.length&&!complex.length&&!nested.length&&!dependent.length&&!relative.length)return null;
   children.push({clause,finiteReadings:complete,complexReadings:complex,
    nestedReadings:nested,dependentReadings:dependent,relativeReadings:relative});
  }
  const clauses=children.map(c=>c.clause);
  const segments=children.map((item,i)=>{
   const finite=item.finiteReadings.length?item.finiteReadings:
    item.complexReadings.length?item.complexReadings:
    item.nestedReadings.length?item.nestedReadings:
    item.dependentReadings.length?item.dependentReadings:item.relativeReadings;
   const subjectPersons=[...new Set(finite.map(c=>
    item.finiteReadings.length?PERSON_CODES[c.frame.subjectPerson]:
    item.complexReadings.length?c.verb.subjectPerson:c.matrix.subjectPerson))];
   return {
    index:i,text:parts[i],
    role:relation==='conditional antecedent and consequent'?
     i===0?'conditional antecedent (mood/force NOT independently verified)':
      'proposed consequent (consequence type NOT independently verified)':
     'independent clause / discourse unit',
    finiteAnalysisKind:item.finiteReadings.length?'indexed complete clause grammar':
     item.complexReadings.length?'finite+locative structural proposals only':
     'finite-containing subordinate/relative structure (not a complete reading)',
    alternativeCount:finite.length,
    subjectPersons,
    locationExpressions:[...new Set(item.complexReadings.map(c=>c.location.written))],
    unresolved:item.finiteReadings.length?
     'Grammar-derived English sense candidates are NOT exhaustive or independently verified':
     'Subordinate role, locative attachment, participant identity and lexical senses remain unresolved; not a completed sentence translation'
   };
  });
  return {
   clauses,complete:false,
   contextLinks:explicitContextLinks(clauses),
   antecedentProposals:marker==='auh'?possibleAntecedents(clauses):[],
   discourseReferenceProposals:marker==='auh'?discourseReferenceProposals(clauses):[],
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
 // "in" is not always an article: historic Classical sources license
 // postnominal relatives and certain clausal complements. Each form below
 // consumes EXACT tokens. No spelling reconstruction or unseen argument.
 const IN_SOURCES=[
  'https://nahuatl.wired-humanities.org/content/in',
  'https://www.cambridge.org/core/books/abs/an-introduction-to-classical-nahuatl/attributives-relative-clauses-copula-verbs-semiauxiliaries/E39B0BBF93FA2B6E7E906C8F6702EAFB',
  'https://www.languageinindia.com/nov2011/bedellnawatorugo.pdf'
 ];
 const CLAUSE_SOURCE='https://www.cambridge.org/core/books/abs/an-introduction-to-classical-nahuatl/noun-clauses/F671D417C8996C3D444F793A9B73F550';
 // Resolve unique source-backed verb lemmas once; nested clauses should
 // not repeatedly scan the entire Classical lexicon for every finite token.
 // Counts (rather than first-hit maps) preserve abstention on ambiguity.
 const finiteLexemeCounts=new Map();
 for(const w of words)if(String(w.pos).startsWith('verb')&&
  /^https:\/\//.test(w.source||''))
  finiteLexemeCounts.set(w.word,(finiteLexemeCounts.get(w.word)||0)+1);
 function finiteAt(token){
  return readFinite(token).filter(p=>{
   return finiteLexemeCounts.get(p.lemma)===1&&/^https:\/\//.test(p.source||'')&&
    (p.tense==='present'||p.tense==='future'||p.productive&&p.tense==='preterite')&&
    !p.indefiniteObject; // indefinite objects cannot become relative gaps
  });
 }
 function relativeInProposals(tokens,negative){
  if(negative||!(tokens.length===4||tokens.length===5))return [];
  const offset=tokens.length===5?1:0;
  if(offset&&norm(tokens[0])==='in')return [];
  if(norm(tokens[offset])!=='in'||norm(tokens[offset+2])!=='in')return [];
  // Source-located possessed NPs can serve as *possible* relative heads.
  // Their possessor belongs to the NOUN, not to the relative or matrix verb.
  // The same conservative resolver and full-token evidence restrictions as
  // the PNP grammar must authorize the original complete written token.
  const plainHead=noun(tokens[offset+1]);
  const possessedHead=plainHead?null:resolveRecordedPossessed(tokens[offset+1]);
  const head=plainHead||possessedHead;
  if(!head||!/^https:\/\//.test(head.source||''))return [];
  const relatives=finiteAt(tokens[offset+3]);
  if(!relatives.length)return [];
  let matrix=[];
  if(offset){
   matrix=finiteAt(tokens[0]);
   if(!matrix.length)return [];
  }else matrix=[null];
  const results=[];
  for(const rel of relatives){
   // The head noun is third-person singular in our current lexical subset.
   // 3sg intransitive relative: head as SUBJECT. 1st/2nd-person transitive
   // relative: head as OBJECT. 3sg transitive: both remain possible.
   const gaps=!rel.transitive?(rel.person===2?['relative subject']:[]):
    rel.person===2?['relative subject','relative object']:['relative object'];
   if(!gaps.length)continue;
   for(const m of matrix){
    let matrixSlots=[null];
    if(m){
     // The matrix noun can be subject only under indexed 3sg agreement.
     // For nonthird-person transitive matrix, 3sg head can only be object.
     // An intransitive nonthird-person matrix cannot absorb a third-party NP.
     matrixSlots=!m.transitive?(m.person===2?['matrix subject']:[]):
      m.person===2?['matrix subject','matrix object']:['matrix object'];
    }
    for(const gap of gaps)for(const slot of matrixSlots){
     results.push({
      grade:'agreement-constrained in-relative hypothesis (NOT an attested sentence translation)',
      construction:offset?'matrix verb + headed relative noun phrase':'externally headed relative noun phrase (nonfinite)',
      head:{written:tokens[offset+1],lemma:head.word,meaning:head.meaning,
       article:tokens[offset],antecedentStatus:'explicit lexical head; referent identity NOT determined',
       ...(possessedHead?{possessor:possessedHead.possessor,
        possessorStatus:'exact source-listed nominal possessor; NOT the finite verb subject',
        possessiveEvidence:{written:possessedHead.written,source:possessedHead.possessorSource,
         locator:possessedHead.possessorLocator}}:{})},
      relative:{marker:tokens[offset+2],written:tokens[offset+3],
       lemma:rel.lemma,tense:rel.tense,subjectPerson:PERSON_CODES[rel.person],
       transitive:rel.transitive,headGapRole:gap,
       status:'possible syntactic antecedent linked by indexed person/object agreement'},
      matrix:m?{written:tokens[0],lemma:m.lemma,tense:m.tense,
       subjectPerson:PERSON_CODES[m.person],headRole:slot}:null,
      coverage:tokens.length,
      sources:[...new Set([...IN_SOURCES,head.source,possessedHead?.possessorSource,rel.source,m?.source].filter(Boolean))],
      note:'In before the noun is article-like; in before the indexed verb is a possible relative introducer. '+
       'The head may fill only a person-compatible omitted argument slot. 3sg transitive ambiguity is retained '+
       'as separate unranked subject/object readings; it does not identify a pronoun, speaker or real-world entity. '+
       'Verb cells are generated, not independently attested. No other subordinate senses are ruled out.'+
       (possessedHead?' The head noun has independently source-located possession '+
        'but the possessor is NOT the matrix/relative subject or the head-gap referent. '+
        'The combined relative construction is an editorial hypothesis, not an attested sentence.':'')
     });
     if(results.length>=12)return results;
    }
   }
  }
  return results;
 }
 function nominalInProposals(tokens,negative){
  // Source-based nominal/complement ambiguity, not a universal "in V" rule.
  // Permit ONLY a source-supported matrix predicate with a 3sg object index.
  if(negative||tokens.length!==3||norm(tokens[1])!=='in')return [];
  const matrix=finiteAt(tokens[0]).filter(p=>p.transitive&&
   (p.lemma==='mati'||p.lemma==='itta'));
  const embedded=finiteAt(tokens[2]);
  if(!matrix.length||!embedded.length)return [];
  const proposals=[];
  for(const m of matrix)for(const e of embedded){
   proposals.push({
    grade:'in-introduced clausal-dependency hypothesis (argument/adjunct unresolved)',
    construction:'possible nominalized complement or adverbial subordinate clause',
    matrix:{written:tokens[0],lemma:m.lemma,subjectPerson:PERSON_CODES[m.person],
     objectAgreement:'3sg indexed; clause as referent is a hypothesis'},
    dependent:{marker:tokens[1],written:tokens[2],lemma:e.lemma,
     subjectPerson:PERSON_CODES[e.person],tense:e.tense,
     subjectStatus:'indexed person, not resolved to an individual'},
    coverage:3,sources:[...new Set([...IN_SOURCES,CLAUSE_SOURCE,m.source,e.source])],
    note:'This in precedes a FINITE indexed verb, not a noun headword. '+
     'A dependent clause is structurally possible, but no clause type, causal/purpose/temporal sense, '+
     'cross-clause coreference or authoritative English complement is inferred.'
   });
  }
  return proposals.slice(0,8);
 }
 // Recursive but depth-limited analysis of a chain of in-introduced finite
 // dependencies. A nested headed relative is an alternative terminal form.
 // No omitted verbs, inferred markers, or unattested spelling repairs.
 function nestedInProposals(tokens,negative){
  if(negative||tokens.length<4||tokens.length>11||
   tokens.some(t=>typeof t!=='string'||t.length>120))return [];
  const results=[];
  const licensesComplement=p=>p.transitive&&
   (p.lemma==='mati'||p.lemma==='itta');
  // An embedded finite predicate may carry its own overt subject/object.
  // Delegate to the SAME full-consumption declarative clause grammar.
  function terminalArgumentProposals(at,depth,parents){
   if(depth<1||depth>3||results.length>=16)return;
   const suffix=tokens.slice(at);
   if(suffix.length<2||suffix.length>5)return;
   for(const {parse,rule,subjectNoun,objectNoun} of
    matchClauseRules(suffix,finiteAt,{possessed:resolveRecordedPossessed})){
    if(rule.roles==='none'||results.length>=16)break;
    let verbAt=0;
    for(const slot of rule.sequence){
     if(slot==='V')break;
     verbAt+=slot==='NP'?2:norm(suffix[verbAt])==='in'?2:1;
    }
    const leaf={written:suffix[verbAt],tokenIndex:at+verbAt,lemma:parse.lemma,tense:parse.tense,
     subjectPerson:PERSON_CODES[parse.person],transitive:!!parse.transitive,
     source:parse.source};
    const argumentOf=n=>n?{
     written:n.written||n.word,lemma:n.word,meaning:n.meaning,source:n.source,
     ...(n.possessor?{possessor:n.possessor,
      possessorSource:n.possessorSource,possessorLocator:n.possessorLocator}: {})
    }:null;
    const subject=argumentOf(subjectNoun),object=argumentOf(objectNoun);
    const layers=[...parents,leaf];
    results.push({
     construction:'in-introduced finite clause with overt nominal argument',
     grade:'declarative-grammar subordinate argument hypothesis (NOT a translation)',
     matrix:layers[0],layers,depth,coverage:tokens.length,
     terminal:{kind:'finite-with-arguments',predicate:leaf,ruleId:rule.id,
      written:suffix.join(' '),subjectArgument:subject,objectArgument:object,
      roleStatus:rule.roles==='either'||rule.roles==='both'?
       'multiple unranked agreement-compatible roles':'single rule-constrained role',
      argumentSource:rule.source_url},
     sources:[...new Set([...IN_SOURCES,CLAUSE_SOURCE,
      ...layers.map(l=>l.source),rule.source_url,
      subject?.source,object?.source,subject?.possessorSource,
      object?.possessorSource].filter(Boolean))],
     note:'The embedded finite clause and its overt noun arguments are licensed by '+
      'the same fully consuming declarative grammar as an independent clause. '+
      'The leading in is a possible subordinator, while any later in may introduce a noun. '+
      'Noun possessor, indexed verb subject, clause attachment and referent identity remain distinct and unresolved. '+
      'The combined subordinate construction has no independently verified English translation.'
    });
   }
  }
  function visit(at,depth,parents){
   if(depth>3||results.length>=16)return;
   terminalArgumentProposals(at,depth,parents);
   for(const reading of finiteAt(tokens[at]).slice(0,8)){
    const node={written:tokens[at],tokenIndex:at,lemma:reading.lemma,tense:reading.tense,
     subjectPerson:PERSON_CODES[reading.person],transitive:!!reading.transitive,
     source:reading.source};
    if(at===tokens.length-1){
     if(depth<2)continue; // One-level in is handled by nominalInProposals.
     const layers=[...parents,node];
     results.push({
      construction:'nested in-introduced finite dependency',
      grade:'bounded recursive subordinate syntax hypothesis (NOT a translation)',
      matrix:layers[0],layers,terminal:{kind:'finite',...node},
      depth,coverage:tokens.length,
      sources:[...new Set([...IN_SOURCES,CLAUSE_SOURCE,...layers.map(l=>l.source)].filter(Boolean))],
      note:'Each in and every finite token is consumed by a bounded recursive structure. '+
       'Only curated transitive complement-taking matrix readings may contain another finite clause. '+
       'Subordinate meaning, clause-as-object status, participant identity and English output remain unresolved.'
     });
     continue;
    }
    if(norm(tokens[at+1])!=='in')continue;
    // An embedded finite predicate may itself have an explicitly headed
    // relative NP. Reuse the existing relative gap/agreement constraints.
    if(depth>=1&&tokens.length-at===5){
     for(const rel of relativeInProposals(tokens.slice(at),false)){
      if(!rel.matrix||rel.matrix.lemma!==reading.lemma||
       rel.matrix.subjectPerson!==node.subjectPerson||
       rel.matrix.tense!==node.tense)continue;
      const layers=[...parents,node];
      results.push({
       construction:'finite complement containing a headed in-relative',
       grade:'bounded recursive subordinate/relative syntax hypothesis (NOT a translation)',
       matrix:layers[0],layers,
       terminal:{kind:'headed-relative',head:rel.head,relative:rel.relative,
        headRole:rel.matrix.headRole},
       depth:depth+1,coverage:tokens.length,
       sources:[...new Set([...IN_SOURCES,CLAUSE_SOURCE,...layers.map(l=>l.source),
        ...rel.sources].filter(Boolean))],
       note:'The terminal noun/relative pair is licensed by the existing relative gap constraints. '+
        'The outer in is a possible finite subordinator; the inner in markers retain distinct functions. '+
        'The clause structure and nominal antecedent are hypotheses; discourse identity is NOT resolved.'
      });
      if(results.length>=16)return;
     }
    }
    if(licensesComplement(reading)&&at+2<tokens.length){
     visit(at+2,depth+1,[...parents,node]);
    }
   }
  }
  visit(0,0,[]);
  return results.slice(0,16);
 }
 function possibleAntecedents(clauses){
  const links=[];
  for(let i=1;i<clauses.length;i++){
   const first=clauses[i-1],second=clauses[i];
   // Previous simple clause must have exactly one unambiguous overt 3sg
   // intransitive subject. No object, other noun, or source-only reading.
   const earlier=(first.candidates||[]).filter(c=>c.grade==='grammar-derived candidate');
   const later=(second.candidates||[]).filter(c=>c.grade==='grammar-derived candidate');
   if(!earlier.length||!later.length||
    first.relativeClauseProposals?.length||second.relativeClauseProposals?.length||
    first.complexClauseProposals?.length||second.complexClauseProposals?.length)continue;
   const participants=new Set(earlier.map(c=>JSON.stringify([
    c.frame.subjectPerson,c.frame.subjectNoun,c.frame.objectNoun,c.frame.predicate])));
   const next=new Set(later.map(c=>JSON.stringify([
    c.frame.subjectPerson,c.frame.subjectNoun,c.frame.objectNoun,c.frame.predicate])));
   if(participants.size!==1||next.size!==1)continue;
   const prev=earlier[0].frame,nextFrame=later[0].frame;
   if(prev.subjectPerson!==2||!prev.subjectNoun||prev.objectNoun||
    nextFrame.subjectPerson!==2||nextFrame.subjectNoun||nextFrame.objectNoun)continue;
   const n=noun(prev.subjectNoun);
   if(!n||!/^https:\/\//.test(n.source||''))continue;
   links.push({
    fromClause:i-1,toClause:i,
    antecedent:{written:n.word,meaning:n.meaning,source:n.source},
    pronounSlot:'unexpressed 3sg subject indexed on subsequent finite verb',
    relation:'adjacent overt nominal subject → subsequent implicit indexed subject',
    personConstraint:'3sg ↔ 3sg',confidence:'candidate-only',
    status:'single agreement-compatible antecedent candidate, NOT resolved reference',
    alternatives:'Unmentioned third-person discourse referents may still be intended.',
    note:'Adjacent clause and matching 3sg subject agreement license only a candidate. '+
      'This DOES NOT prove that the same person or entity acts in both clauses.'
   });
  }
  return links;
 }
 // Track overt NOMINAL subject mentions across a short discourse window.
 // Inferred/null subjects are never promoted to new mentions or merged into
 // entities. Mention alternatives are not rankings or proven coreference.
 function discourseReferenceProposals(clauses){
  const maxDistance=3,links=[];
  const singleFrame=clause=>{
   if(clause?.relativeClauseProposals?.length||
    clause?.nestedInProposals?.length||clause?.nominalInProposals?.length||
    clause?.complexClauseProposals?.length||clause?.roleAmbiguous)return null;
   const readings=(clause?.candidates||[]).filter(c=>
    c.grade==='grammar-derived candidate'&&
    c.coverage===clause.tokens.length);
   if(!readings.length)return null;
   const frames=new Set(readings.map(c=>JSON.stringify([
    c.frame.subjectPerson,c.frame.subjectNoun,c.frame.objectNoun,
    c.frame.predicate,c.frame.tense,c.frame.negative])));
   return frames.size===1?readings[0].frame:null;
  };
  for(let i=1;i<clauses.length&&links.length<24;i++){
   const target=singleFrame(clauses[i]);
   // The conservative coreference slot is ONLY an unexpressed 3sg subject
   // of an intransitive complete finite reading.
   if(!target||target.subjectPerson!==2||target.subjectNoun||
    target.objectNoun||target.object)continue;
   const alternatives=[];
   for(let j=i-1;j>=0&&i-j<=maxDistance;j--){
    const prior=singleFrame(clauses[j]);
    if(!prior)break; // Never leap over unsupported/ambiguous syntax.
    if(prior.subjectPerson!==2||!prior.subjectNoun||
     prior.objectNoun||prior.object)continue;
    const n=noun(prior.subjectNoun);
    if(!n||!/^https:\/\//.test(n.source||''))continue;
    alternatives.push({fromClause:j,distance:i-j,
     antecedent:{written:n.word,meaning:n.meaning,source:n.source},
     grammaticalRole:'overt 3sg subject',agreement:'3sg ↔ 3sg'});
   }
   if(!alternatives.length)continue;
   links.push({toClause:i,
    pronounSlot:'implicit 3sg subject indexed by the later finite verb',
    candidates:alternatives,confidence:'candidate-only',
    status:alternatives.length===1?
     'one visible agreement-compatible mention; identity NOT resolved':
     'multiple visible agreement-compatible mentions; no selection justified',
    alternatives:'Unmentioned discourse referents also remain possible.',
    scope:'preceding three analyzed clause units, without crossing an unsupported parse',
    note:'This is a bounded mention inventory, not an entity-resolution chain. '+
     'Repeated lexical nouns do not establish that two mentions denote the same person. '+
     'Implicit subjects never create new identity evidence.'
   });
  }
  return links;
 }

 // Locate grammar-supported CONTIGUOUS subexpressions inside a larger input
 // that the existing whole-clause parser cannot interpret. This REUSES the
 // identical analyzers: it never makes a new clause grammar, repairs unknown
 // words or turns a partial English option into a whole-passage translation.
 // Conservative resource bounds prevent uncontrolled combinatorial scanning.
 function recoverPartialSpans(clause){
  const original=clause.tokens||[];
  if(clause.complete||clause.nominalCoordinationProposals?.length||
     clause.coordinatedSubjectProposals?.length||
     original.length<4||original.length>18)return [];
  if(original.some(t=>typeof t!=='string'||t.length>120||
    /[()[\]{}<>]/u.test(t)))return [];
  const cleaned=original.map(t=>t.replace(/^[,.;:!]+|[,.;:!]+$/gu,''));
  if(cleaned.some(t=>!t||!/^[\p{L}\p{M}’'\-\u00AF]+$/u.test(t)))return [];
  const families=[
   ['indexed-finite',c=>c.candidates?.filter(p=>p.grade==='grammar-derived candidate')],
   ['source-finite',c=>c.historicalFiniteProposals],
   ['locative',c=>c.locativeInterpretations],
   ['comparison',c=>c.fragmentInterpretations],
   ['finite-location',c=>c.complexClauseProposals],
   ['relative',c=>c.relativeClauseProposals],
   ['nominal-dependent',c=>c.nominalInProposals],
   ['nested-dependent',c=>c.nestedInProposals],
   ['morphology-clause',c=>c.morphosyntactic?.items],
   ['possessed-argument',c=>c.possessedAgreement?.items],
   ['source-agreement',c=>c.agreementProposals],
   ['nominal-coordination',c=>c.nominalCoordinationProposals]
  ];
  const spans=[];
  let probes=0;
  // Longest candidate windows first; overlapping candidates remain explicitly
  // unranked, so no fictitious segmentation or unique grammatical attachment.
  for(let length=Math.min(6,cleaned.length-1);length>=2;length--){
   for(let start=0;start+length<=cleaned.length;start++){
    if(++probes>85||spans.length>=24)break;
    const observed=cleaned.slice(start,start+length);
    const analyzed=analyze(observed.join(' '),false);
    if(analyzed.clauses?.length!==1)continue;
    const c=analyzed.clauses[0],present=[],sources=new Set();
    let alternatives=0;
    for(const [family,read] of families){
     const matches=(read(c)||[]).filter(p=>p?.coverage===length);
     if(!matches.length)continue;
     const verified=matches.filter(p=>Array.isArray(p.sources)&&p.sources.length&&
       p.sources.every(u=>typeof u==='string'&&/^https:\/\/[^/\s]+/u.test(u)));
     if(!verified.length)continue;
     present.push(family);alternatives+=verified.length;
     for(const p of verified)for(const u of p.sources.slice(0,12))sources.add(u);
    }
    if(!present.length)continue;
    spans.push({start,end:start+length,written:original.slice(start,start+length),
     analyzedSpelling:observed.join(' '),families:present,
     alternatives:Math.min(alternatives,64),sources:[...sources].slice(0,24),
     status:'existing grammar on contiguous token window; NOT a whole-clause reading',
     englishAvailableForWholeInput:false,referentResolved:false});
   }
   if(probes>85||spans.length>=24)break;
  }
  return spans;
 }
 function analyze(input,allowPartialRecovery=true){
  // Partial windows and grammatical alternatives repeatedly inspect the same
  // spelling. Share evidence only within this request; never cache across
  // requests, providers, or spelling variants (including vowel length).
  const owner=morphologyMemo===null;
  if(owner)morphologyMemo=new Map();
  try{
   const result=analyzeInput(input,allowPartialRecovery);
   if(result&&typeof result==='object'&&!Array.isArray(result))
    result.poeticVocableObservations=poeticVocableObservations(input);
   return result;
  }
  finally{if(owner)morphologyMemo=null;}
 }
 function analyzeInput(input,allowPartialRecovery){
  const raw=String(input||'');
  if(raw.length>7000)return {clauses:[],complete:false,reason:'Input exceeds 7000 characters.'};
  if(/[?¿]/u.test(raw)){
   // Question scope is NOT licensed by the present finite-clause grammar.
   // Still retain each original written word for bounded morphology clues:
   // previously a single ? anywhere in an input discarded every token.
   const tokens=raw.match(/[\p{L}\p{M}’'\-\u00AF]+/gu)||[];
   return {clauses:[{text:raw,tokens,candidates:[],complete:false,
    morphologicalClues:partialClues(tokens),
    reason:'Question scope is not yet supported. Written tokens are preserved for tentative morphology only; no question grammar or translation is inferred.'}],
    complete:false};
  }
  // Separate written sentence boundaries BEFORE analyzing clause connectors.
  // A period must not disable auh within the preceding sentence. Semicolons
  // stay local: intla may use one to separate antecedent and consequent.
  if(/[.!\n]/u.test(raw)){
   const texts=raw.split(/[.!\n]+/u).filter(s=>s.trim());
   if(texts.length>24)return {clauses:[],complete:false,reason:'More than 24 sentence units.'};
   const sentenceGroups=texts.map(text=>({text,analysis:analyze(text,allowPartialRecovery)}));
   const clauses=sentenceGroups.flatMap(g=>g.analysis.clauses);
   if(clauses.length>24)return {clauses:[],complete:false,reason:'More than 24 clause units.'};
   return {clauses,sentenceGroups,complete:clauses.length>0&&sentenceGroups.every(g=>g.analysis.complete),
    contextLinks:explicitContextLinks(clauses),antecedentProposals:possibleAntecedents(clauses),
    discourseReferenceProposals:discourseReferenceProposals(clauses)};
  }
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
    const object=objectNoun?nounLabel(objectNoun):parse.indefiniteObject|| (parse.transitive?'him / her / it':null);
    const frame={subject,subjectPerson:parse.person,subjectNoun:subjectNoun?.word||null,
     predicate:parse.lemma,tense:parse.tense,negative,object,objectNoun:objectNoun?.word||null,
     lexicalMeaning:lexical[0].meaning,
     ...(parse.productive?{morphologyEvidence:parse.productive}: {})};
    const englishParts=predicateSenses(parse).map(s=>{
     const verb=englishVerb(s,parse,negative);
     return {subject,verb,object};
    });
    const english=englishParts.map(({subject,verb,object})=>{
     const line=subject+' '+verb+(object?' '+object:'');
     return line[0].toUpperCase()+line.slice(1);
    });
    candidates.push({frame,english,englishParts,coverage:original.length,
     constructionId:rule.id,constructionSource:rule.source_url,
     nounSenses:[subjectNoun,objectNoun].filter(Boolean).map(n=>({
      lemma:n.word,selected:nouns[n.word]||null,fullMeaning:n.meaning,source:n.source})),
     sources:[...new Set([grammar,tenseSource,rule.source_url,parse.source,lexical[0].source,
      subjectNoun?.source,objectNoun?.source].filter(Boolean))],
     grade:'grammar-derived candidate',
     note:(parse.productive?'Source-gated morphological analysis composed with editorial English. The word evidence remains '+parse.productive.grade+'; this sentence is NOT independently attested. ':'')+
      'Illustrative English sense choices, not exhaustive translations. Noun articles, lexical senses, aspect and third-person referents require context; candidate order is not a ranking. Construction '+rule.id+' is editorial grammar formalization, not individually attested.'});
   }
   // Only an isolated, explicitly source-labeled finite token can contribute
   // a new gloss. No words on either side may be silently discarded.
   if(!candidates.length&&!negative&&tokens.length===1){
    candidates.push(...exactFiniteReadings(tokens[0],exactMorphology(tokens[0])));
   }
   const clause={text,tokens:original,candidates,complete:candidates.length>0,
    fragmentInterpretations:candidates.length?[]:fragmentInterpretations(tokens,negative),
    relativeClauseProposals:candidates.length?[]:relativeInProposals(original,negative),
    nominalInProposals:candidates.length?[]:nominalInProposals(original,negative),
    nestedInProposals:candidates.length?[]:nestedInProposals(original,negative),
    locativeInterpretations:candidates.length?[]:locativeAnalyze(tokens,negative),
    complexClauseProposals:candidates.length?[]:finiteLocativeProposals(tokens,negative),
    morphosyntactic: morphologyClauseCandidates(tokens,negative),
    historicalFiniteProposals:candidates.length?[]:historicalFiniteContextProposals(tokens,negative),
    nominalCoordinationProposals:candidates.length?[]:nominalCoordinationProposals(tokens,negative),
    coordinatedSubjectProposals:candidates.length?[]:coordinatedSubjectProposals(tokens,negative),
    possessedAgreement: possessedAgreementProposals(tokens,negative),
    agreementProposals:candidates.length?[]:sourceAgreement(original,negative),
    morphologicalClues:candidates.length?[]:partialClues(original),
    roleAmbiguous:new Set(candidates.map(c=>JSON.stringify([c.frame.subjectNoun,c.frame.objectNoun]))).size>1,
    reason:candidates.length?'':'Outside supported clause grammar; no words were silently discarded. Partial morphology below is not a complete reading.'};
   if(!clause.complete&&clause.nestedInProposals?.length)
    clause.reason='A bounded clause structure is recognized, but it is not a verified full reading or an English translation.';
   if(allowPartialRecovery)clause.partialSpans=recoverPartialSpans(clause);
   return clause;
  });
  return {clauses,complete:clauses.length>0&&clauses.every(c=>c.complete),
   contextLinks:explicitContextLinks(clauses),
   antecedentProposals:possibleAntecedents(clauses),
   discourseReferenceProposals:discourseReferenceProposals(clauses)};
 }
 // Reuse citation-noun wording without inventing English number for inflected forms.
 function describeNoun(written){
  const n=noun(written);
  if(!n||!/^https:\/\//u.test(n.source||''))return null;
  return {lemma:n.word,text:nounLabel(n),
   sense:{lemma:n.word,selected:nouns[n.word]||null,fullMeaning:n.meaning,source:n.source}};
 }
 return {analyze,describeNoun,validateProductiveFrame};
}
root.TlahtolliSentence={create};
})(window);


