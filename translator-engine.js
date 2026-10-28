/* Tlahtōlli translation engine v0.2 — reference-backed lookup, NOT machine translation.
 * Pure browser module. No network calls, text logging, or automatic training.
 * Grammar hypotheses are not historical attestations.
 */
(function(root){
'use strict';
function norm(s){return String(s||'').normalize('NFC').trim().toLocaleLowerCase('en');}
function fold(s){return norm(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'');}
function wordsOnly(s){return (String(s||'').match(/[\p{L}\p{M}]+(?:['’\-][\p{L}\p{M}]+)*/gu)||[]);}
function splitGloss(s){return String(s||'').split(/[;,]/).map(x=>x.trim()).filter(Boolean);}
function safeURL(url){try{const u=new URL(url);return /^https?:$/.test(u.protocol)?u.href:null;}catch{return null;}}
function tokenize(s){
 const re=/[\p{L}\p{M}]+(?:['’\-][\p{L}\p{M}]+)*|[^\p{L}\p{M}]+/gu;
 return String(s||'').match(re)||[];
}
function isWord(s){return /[\p{L}]/u.test(s);}
function lexicalKey(m){return [m.lemma,m.meaning,m.pos].join('\u0000');}
function distinctLexical(matches){
 const seen=new Set();return matches.filter(m=>{const k=lexicalKey(m);if(seen.has(k))return false;seen.add(k);return true;});
}
function containsLengthMark(s){return norm(s)!==fold(s);}
function confidence(match){
 if(match.form_type==='headword')return 'lexicon';
 if(match.form_type==='source-attested form')return 'source-form';
 if(match.form_type==='historical spelling')return 'orthographic';
 return 'candidate';
}
function create(dictionary,passages){
 const list=(dictionary&&Array.isArray(dictionary.words)?dictionary.words:[]).filter(
  w=>w&&['Classical Nahuatl','Classical Nahuatl (historical dictionary lemma)'].includes(w.variety)&&typeof w.word==='string'&&w.word.trim());
 const index=new Map(),english=new Map();
 function push(k,m,map=index){
  k=norm(k);if(!k)return;const a=map.get(k)||[];
  if(!a.some(x=>lexicalKey(x)===lexicalKey(m)&&x.source===m.source&&x.evidence===m.evidence&&x.context===m.context&&x.form_type===m.form_type&&x.form===m.form)){a.push(m);map.set(k,a);}
 }
 for(const w of list){
  const base={lemma:w.word,meaning:w.meaning||'',senses:splitGloss(w.meaning),pos:w.pos||'',source:safeURL(w.source),
   variety:w.variety,form:w.word,form_type:'headword',evidence:'lexicon',
   context:'An isolated dictionary entry is not a sentence-level translation.'};
  push(w.word,base);
  for(const variant of String(w.original||'').split(/[\/;,]/)){
   const v=variant.trim();if(v&&wordsOnly(v).length===1&&norm(v)!==norm(w.word))
    push(v,{...base,form:v,form_type:'historical spelling',evidence:'orthography'});
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
  let matched=0,unknown=0,ambiguous=0,senseAmbiguities=0,approximate=0,orthographyConflicts=0,truncated=0;
  const annotated=parts.map(part=>{
   if(!isWord(part))return {kind:'separator',value:part};
   const result=lookup(part,direction),hits=result.candidates;
   if(!hits.length){unknown++;return {kind:'word',value:part,status:'unknown',candidates:[],alternatives:[]};}
   matched++;
   const ambiguousSense=distinctLexical(hits).length>1||result.totalCandidates>8;
   if(ambiguousSense)ambiguous++;
   const senseAmbiguous=direction==='nh-en'&&hits.some(hit=>new Set(hit.senses.map(norm)).size>1);
   if(senseAmbiguous)senseAmbiguities++;
   if(result.approximate)approximate++;
   if(result.orthographyConflict)orthographyConflicts++;
   if(result.truncated)truncated++;
   return {kind:'word',value:part,status:result.approximate?'approximate':'matched',
    candidates:hits,alternatives:result.alternatives,
    ambiguous:ambiguousSense,senseAmbiguous,orthographyConflict:result.orthographyConflict,
    truncated:result.truncated};
  });
  const gloss=annotated.map(x=>{
   if(x.kind==='separator')return x.value;
   const first=x.candidates[0];
   if(!first)return '[?'+x.value+']';
   // Deliberate abstention: a plausible lookup is NOT a licensed sentence
   // translation and a missing macron must not decide among homographs.
   if(x.orthographyConflict)return '[?'+x.value+': vowel length ambiguous]';
   if(x.status==='approximate')return '[?'+x.value+': spelling uncertain]';
   if(x.ambiguous)return '[?'+x.value+': multiple entries]';
   if(x.senseAmbiguous)return '[?'+x.value+': multiple dictionary senses]';
   const value=direction==='nh-en'?(splitGloss(first.meaning)[0]||'?'):first.lemma;
   return '['+value+']';
  }).join('');
  return {parts:annotated,gloss,stats:{matched,unknown,ambiguous,senseAmbiguities,approximate,orthographyConflicts,truncated,total:matched+unknown},
   passages:direction==='nh-en'?passageMatches(input):[],
   disclaimer:'Bracketed meanings are dictionary lookups, not contextual translations. Uncertain spelling, multiple lexical candidates and multiple dictionary senses are not auto-resolved.'};
 }

 return {analyze,lookup,passageMatches,stats:{headwords:list.length,wordForms:index.size,passageCandidates:candidates.length}};
}
root.TlahtolliTranslator={create,norm,fold,tokenize};
})(window);
