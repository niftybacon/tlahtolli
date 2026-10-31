/* Tlahtōlli translation engine v0.2 — reference-backed lookup, NOT machine translation.
 * Pure browser module. No network calls, text logging, or automatic training.
 * Grammar hypotheses are not historical attestations.
 */
(function(root){
'use strict';
function norm(s){return String(s||'').normalize('NFC').trim().toLocaleLowerCase('en');}
function fold(s){return norm(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'');}
function wordsOnly(s){return (String(s||'').match(/[\p{L}\p{M}]+(?:[¯‾][\p{L}\p{M}]*|['’\-][\p{L}\p{M}]+)*/gu)||[]);}
function splitGloss(s){return String(s||'').split(/[;,]/).map(x=>x.trim()).filter(Boolean);}
function safeURL(url){try{const u=new URL(url);return /^https?:$/.test(u.protocol)?u.href:null;}catch{return null;}}
function tokenize(s){
 // Preserve spacing overbars as part of a written token, not as punctuation.
 // A scribal abbreviation remains an unresolved spelling, never an expansion.
 const re=/[\p{L}\p{M}]+(?:[¯‾][\p{L}\p{M}]*|['’\-][\p{L}\p{M}]+)*|[^\p{L}\p{M}]+/gu;
 return String(s||'').match(re)||[];
}
function isWord(s){return /[\p{L}]/u.test(s);}
function lexicalKey(m){return [m.lemma,m.meaning,m.pos].join('\u0000');}
function distinctLexical(matches){
 const seen=new Set();return matches.filter(m=>{const k=lexicalKey(m);if(seen.has(k))return false;seen.add(k);return true;});
}
function containsLengthMark(s){return norm(s)!==fold(s);}
function confidence(match){
 if(match.evidence==='archive-index')return 'provisional-index';
 if(match.form_type==='headword')return 'lexicon';
 if(match.form_type==='source-attested form')return 'source-form';
 if(match.form_type==='historical spelling')return 'orthographic';
 return 'candidate';
}
function create(dictionary,passages,contextPack){
 const list=(dictionary&&Array.isArray(dictionary.words)?dictionary.words:[]).filter(
  w=>w&&['Classical Nahuatl','Classical Nahuatl (historical dictionary lemma)'].includes(w.variety)&&typeof w.word==='string'&&w.word.trim());
 const index=new Map(),english=new Map();
 function push(k,m,map=index){
  k=norm(k);if(!k)return;const a=map.get(k)||[];
  if(!a.some(x=>lexicalKey(x)===lexicalKey(m)&&x.source===m.source&&x.evidence===m.evidence&&x.context===m.context&&x.form_type===m.form_type&&x.form===m.form)){a.push(m);map.set(k,a);}
 }
 for(const w of list){
  const base={lemma:w.word,meaning:w.meaning||'',senses:splitGloss(w.meaning),pos:w.pos||'',source:safeURL(w.source),
   variety:w.variety,form:w.word,form_type:'headword',evidence:w.status==='Archive-indexed; lexical review pending'?'archive-index':'lexicon',
   context:w.status==='Archive-indexed; lexical review pending'?'UNREVIEWED community archive index gloss; no independently verified Classical lexical reading, morphology or contextual translation.':'An isolated dictionary entry is not a sentence-level translation.'};
  push(w.word,base);
  for(const variant of String(w.original||'').split(/[\/;,]/)){
   const v=variant.trim();if(v&&wordsOnly(v).length===1&&norm(v)!==norm(w.word))
    push(v,{...base,form:v,form_type:'historical spelling',evidence:base.evidence==='archive-index'?'archive-index':'orthography'});
  }
  for(const f of Array.isArray(w.inflections)?w.inflections:[]){
   if(!f||typeof f.form!=='string')continue;
   const form=f.form.trim(),grade=String(f.evidence||'').toLowerCase();
   // Bound stems and hypothetical paradigms are NOT independent words.
   if(!form||wordsOnly(form).length!==1||form.includes('-')||
      !['dictionary','text','grammar'].includes(grade))continue;
   push(form,{...base,form,form_type:'source-attested form',evidence:grade,
    source:safeURL(f.source)||base.source,context:f.note||f.category||base.context});
  }
  for(const gloss of splitGloss(w.meaning)){
   const k=norm(gloss.replace(/\([^)]*\)/g,'').trim());
   if(k)push(k,base,english);
  }
 }
 const candidates=Array.isArray(passages?.entries)?passages.entries.filter(e=>e&&e.variety==='Classical Nahuatl'&&e.train_eligible!==true):[];
 // Phase 6: cite the ACTUAL already-indexed Molina/Olmos dictionary senses
 // in English without pretending to choose a meaning for an isolated word.
 // This is an annotation of the original written token, not a dictionary
 // promotion, an English clause, an independent bilingual review or a rule
 // identifying 'yehua' with other pronouns/orthographies.
 const YEHUA_DEMONSTRATIVE='https://nahuatl.wired-humanities.org/content/yehua-0';
 const YEHUA_TEMPORAL='https://nahuatl.wired-humanities.org/content/yehua';
 const BRINTON_EDITION='https://www.gutenberg.org/files/12219/12219-h/12219-h.htm';
 function validatedYehuaEnglish(){
  if(contextPack?.format!=='tentli-phase6-exact-contextual-contrast-leads-v1'||
    contextPack.research_only!==true||
    contextPack.negative_guards?.no_automatic_english!==true||
    contextPack.negative_guards?.no_gold_silver_or_training!==true||
    !Array.isArray(contextPack.cases))return null;
  const cases=contextPack.cases.filter(c=>c?.written_surface==='yehua');
  if(cases.length!==1)return null;
  const caseY=cases[0],note=caseY.editorial_yehua_engine_note;
  if(note?.exact_written_form!=='yehua'||
    note.independently_approved_sentence_translation!==false||
    note.hard_engine_constraints?.no_single_default_gloss!==true||
    note.hard_engine_constraints?.no_invented_english_translation!==true||
    note.hard_engine_constraints?.abstain_on_unparsed_whole_clause!==true||
    !Array.isArray(note.dictionary_supported_function_families))return null;
  const families=note.dictionary_supported_function_families;
  const demonstrative=families.find(f=>f.function==='demonstrative_or_independent_third_person');
  const temporal=families.find(f=>f.function==='temporal_adverb');
  if(!demonstrative||demonstrative.source_url!==YEHUA_DEMONSTRATIVE||
    demonstrative.attested_spanish!=='aquel, aquella, aquello'||
    demonstrative.per_occurrence_selection_approved!==false||
    !temporal||temporal.source_url!==YEHUA_TEMPORAL||
    temporal.attested_spanish!=='denantes, o ahora poco ha; rato ha'||
    temporal.per_occurrence_selection_approved!==false||
    !Array.isArray(note.published_original_contexts)||
    note.published_original_contexts.filter(p=>p.locator==='Brinton 1890 Song VI stanza 2'&&
      p.source_url===BRINTON_EDITION&&
      p.original_short_span==='noyollo, yehua cuix ic nepohualoyan'&&
      p.grammatical_role_verified===false).length!==1)return null;
  return [
   {english:'that / that one',function:'demonstrative or pronoun',
    source:YEHUA_DEMONSTRATIVE,locator:'Molina 1571 II f.35r c.1',
    status:'attested dictionary English alternatives; contextual use not selected'},
   {english:'a little while ago / then',function:'temporal adverb',
    source:YEHUA_TEMPORAL,locator:'Molina 1571 II f.36r c.1; Olmos Arte p.183',
    status:'attested dictionary English alternatives; contextual use not selected'}
  ];
 }
 const yehuaEnglish=validatedYehuaEnglish();
 function sourceEnglishReadings(input,direction='nh-en'){
  if(direction!=='nh-en'||!yehuaEnglish)return [];
  const words=wordsOnly(String(input||'').slice(0,7000));
  const normalized=words.map(norm);
  const out=[];
  for(let i=0;i<normalized.length&&i<90;i++){
   if(normalized[i]!=='yehua')continue;
   // Brinton's English connective "that" is a contextual editorial choice,
   // never a dictionary gloss or an automatic complementizer analysis.
   const vi=normalized.slice(i-1,i+4).join(' ');
   const brinton=vi==='noyollo yehua cuix ic nepohualoyan';
   out.push({wordIndex:i,written:words[i],status:'cited English sense alternatives, not an English sentence',
    options:yehuaEnglish.map(o=>({...o})),
    editorialReading:brinton?{
     english:'that',kind:'published editorial clause-linking choice',
     source:BRINTON_EDITION,locator:'Brinton 1890 Song VI stanza 2',
     note:'The printed English uses that after my heart. This does not prove yehua is a complementizer or determine which function it serves.'
    }:null,
    selectedEnglish:null,referent:null,clauseAttachment:null,verifiedTranslation:false});
  }
  return out;
 }

 function lookup(query,direction='nh-en'){
  const q=norm(query);if(!q)return {candidates:[],approximate:false,alternatives:[],orthographyConflict:false,totalCandidates:0,truncated:false};
  const table=direction==='en-nh'?english:index;
  const exact=table.get(q)||[];
  // Historic spellings often omit contrastive vowel length. When an unmarked
  // exact match also has a distinct macron-bearing rival in this dictionary,
  // do not silently select the unmarked sense.
  const close=[];
  if(direction==='nh-en'){
   for(const [key,matches] of index)if(key!==q&&fold(key)===fold(q))close.push(...matches);
  }
  const others=distinctLexical(close.filter(x=>!exact.some(y=>lexicalKey(x)===lexicalKey(y))));
  const conflict=direction==='nh-en'&&exact.length>0&&!containsLengthMark(q)&&others.length>0;
  if(exact.length){
   return {candidates:exact.slice(0,8).map(x=>({...x,confidence:confidence(x)})),
    approximate:false,alternatives:conflict?others.slice(0,8).map(x=>({...x,confidence:'orthographic-alternative'})):[],
    orthographyConflict:conflict,totalCandidates:exact.length,truncated:exact.length>8||others.length>8};
  }
  if(direction==='en-nh')return {candidates:[],approximate:false,alternatives:[],orthographyConflict:false,totalCandidates:0,truncated:false};
  const unique=distinctLexical(close);
  return {candidates:unique.slice(0,8).map(x=>({...x,confidence:'approximate',context:'Macrons/diacritics differ. This may change meaning; verify the form.'})),
   approximate:unique.length>0,alternatives:[],orthographyConflict:false,totalCandidates:unique.length,truncated:unique.length>8};
 }

 function contextReadings(input,direction){
  if(direction!=='nh-en')return [];
  // Deliberately bounded to a complete two-word fragment, not arbitrary adjacency.
  const tokens=tokenize(String(input||'').trim());
  if(tokens.length===4&&/^[.!?]$/.test(tokens[3]))tokens.pop();
  if(tokens.length!==3||!/^ +$/.test(tokens[1]))return [];
  const marker=lookup(tokens[0]),noun=lookup(tokens[2]);
  const usable=r=>!r.approximate&&!r.orthographyConflict&&!r.truncated&&distinctLexical(r.candidates).length===1;
  if(!usable(marker)||!usable(noun))return [];
  const m=marker.candidates[0],n=noun.candidates[0];
  if(m.lemma!=='iuhquin'||n.pos!=='noun'||!m.source||!n.source||!n.senses.length)return [];
  return [{rule:'comparison-iuhquin-noun-v1',input:String(input),
   readings:[...new Set(n.senses)].map(sense=>'like '+sense),
   relation:'comparison',complement:n.lemma,
   evidence:'Editorial composition from cited lexical records; not a verified passage translation.',
   sources:[...new Set([m.source,n.source])],
   limitation:'English articles, noun sense, figurative force and wider clause scope remain unresolved.'}];
 }
 function passageMatches(input){
  const all=wordsOnly(input).map(norm).join(' ');
  if(!all)return [];
  const matching=[];
  for(const e of candidates){
   const variants=[e.original,e.normalized].filter(Boolean).map(v=>wordsOnly(v).map(norm).join(' '));
   const relaxed=variants.some(v=>fold(v)===fold(all));
   if(!relaxed)continue;
   matching.push({id:e.id,original:e.original,normalized:e.normalized,
    interpretation:e.english_interpretation||'',type:e.passage_type||'historical passage',
    source:e.source_title||'',url:safeURL(e.source_url),note:e.source_note||'',
    status:e.review_status||'candidate',rights:e.transcription_rights||'unconfirmed',
    trainEligible:false,approximate:!variants.includes(all)});
  }
  return matching;
 }
 function analyze(input,direction='nh-en'){
  const parts=tokenize(String(input||'').slice(0,7000));
  const sourceReadings=sourceEnglishReadings(input,direction);
  let wordIndex=-1;
  let matched=0,unknown=0,provisional=0,ambiguous=0,senseAmbiguities=0,approximate=0,orthographyConflicts=0,truncated=0;
  const annotated=parts.map(part=>{
   if(!isWord(part))return {kind:'separator',value:part};
   wordIndex++;
   const sourceEnglish=sourceReadings.find(reading=>reading.wordIndex===wordIndex)||null;
   const result=lookup(part,direction),hits=result.candidates;
   if(!hits.length){unknown++;return {kind:'word',value:part,status:'unknown',candidates:[],alternatives:[],sourceEnglish};}
   const provisionalOnly=hits.every(hit=>hit.evidence==='archive-index');
   if(provisionalOnly){provisional++;unknown++;}else matched++;
   const ambiguousSense=distinctLexical(hits).length>1||result.totalCandidates>8;
   if(ambiguousSense)ambiguous++;
   const senseAmbiguous=direction==='nh-en'&&hits.some(hit=>new Set(hit.senses.map(norm)).size>1);
   if(senseAmbiguous)senseAmbiguities++;
   if(result.approximate)approximate++;
   if(result.orthographyConflict)orthographyConflicts++;
   if(result.truncated)truncated++;
   return {kind:'word',value:part,status:provisionalOnly?'provisional':result.approximate?'approximate':'matched',
    candidates:hits,alternatives:result.alternatives,
    ambiguous:ambiguousSense,senseAmbiguous,orthographyConflict:result.orthographyConflict,
    truncated:result.truncated};
  });
  const gloss=annotated.map(x=>{
   if(x.kind==='separator')return x.value;
   const first=x.candidates[0];
   if(!first)return x.sourceEnglish?'['+x.sourceEnglish.options.map(o=>o.english).join(' | ')+']':'[?'+x.value+']';
   if(x.status==='provisional')return '[?'+x.value+': unreviewed archive index gloss]';
   // Deliberate abstention: a plausible lookup is NOT a licensed sentence
   // translation and a missing macron must not decide among homographs.
   if(x.orthographyConflict)return '[?'+x.value+': vowel length ambiguous]';
   if(x.status==='approximate')return '[?'+x.value+': spelling uncertain]';
   if(x.ambiguous)return '[?'+x.value+': multiple entries]';
   if(x.senseAmbiguous)return '[?'+x.value+': multiple dictionary senses]';
   const value=direction==='nh-en'?(splitGloss(first.meaning)[0]||'?'):first.lemma;
   return '['+value+']';
  }).join('');
  return {parts:annotated,gloss,stats:{matched,unknown,provisional,ambiguous,senseAmbiguities,approximate,orthographyConflicts,truncated,total:matched+unknown},
   contextReadings:contextReadings(input,direction),
   sourceEnglishReadings:sourceReadings,
   passages:direction==='nh-en'?passageMatches(input):[],
   disclaimer:'Bracketed meanings are dictionary lookups, not contextual translations. Source-labeled yehua alternatives are unranked choices from Molina/Olmos, not approved contextual readings or a complete English sentence. Uncertain spelling and lexical senses remain distinct.'};
 }

 return {analyze,lookup,passageMatches,sourceEnglishReadings,stats:{headwords:list.length,wordForms:index.size,passageCandidates:candidates.length}};
}
root.TlahtolliTranslator={create,norm,fold,tokenize};
})(window);
