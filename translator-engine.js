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
function confidence(match){
 if(match.form_type==='headword')return 'lexicon';
 if(match.form_type==='source-attested form')return 'source-form';
 if(match.form_type==='historical spelling')return 'orthographic';
 return 'candidate';
}
function create(dictionary,passages){
 const list=(dictionary&&Array.isArray(dictionary.words)?dictionary.words:[]).filter(
  w=>w&&w.variety==='Classical Nahuatl'&&typeof w.word==='string'&&w.word.trim());
 const index=new Map(),english=new Map();
 function push(k,m,map=index){
  k=norm(k);if(!k)return;const a=map.get(k)||[];
  if(!a.some(x=>x.lemma===m.lemma&&x.form_type===m.form_type&&x.form===m.form)){a.push(m);map.set(k,a);}
 }
 for(const w of list){
  const base={lemma:w.word,meaning:w.meaning||'',pos:w.pos||'',source:safeURL(w.source),
   variety:w.variety,form:w.word,form_type:'headword',evidence:'lexicon',
   context:'An isolated dictionary entry is not a sentence-level translation.'};
  push(w.word,base);
  for(const variant of String(w.original||'').split('/')){
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
  const q=norm(query);if(!q)return {candidates:[],approximate:false};
  const table=direction==='en-nh'?english:index;
  const exact=table.get(q)||[];
  if(exact.length)return {candidates:exact.slice(0,8).map(x=>({...x,confidence:confidence(x)})),approximate:false};
  if(direction==='en-nh')return {candidates:[],approximate:false};
  const close=[];
  for(const [key,matches] of index)if(key!==q&&fold(key)===fold(q))close.push(...matches);
  return {candidates:close.slice(0,8).map(x=>({...x,confidence:'approximate',context:'Macrons/diacritics differ. This may change meaning; verify the form.'})),approximate:close.length>0};
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
  let matched=0,unknown=0,ambiguous=0,approximate=0;
  const annotated=parts.map(part=>{
   if(!isWord(part))return {kind:'separator',value:part};
   const result=lookup(part,direction),hits=result.candidates;
   if(!hits.length){unknown++;return {kind:'word',value:part,status:'unknown',candidates:[]};}
   matched++;if(hits.length>1)ambiguous++;if(result.approximate)approximate++;
   return {kind:'word',value:part,status:result.approximate?'approximate':'matched',
    candidates:hits};
  });
  const gloss=annotated.map(x=>{
   if(x.kind==='separator')return x.value;
   const first=x.candidates[0];
   if(!first)return '[?'+x.value+']';
   const value=direction==='nh-en'?(splitGloss(first.meaning)[0]||'?'):first.lemma;
   return '['+value+']';
  }).join('');
  return {parts:annotated,gloss,stats:{matched,unknown,ambiguous,approximate,total:matched+unknown},
   passages:direction==='nh-en'?passageMatches(input):[],
   disclaimer:'Bracketed meanings are lookup aids; no complete grammatical translation has been generated.'};
 }
 return {analyze,lookup,passageMatches,stats:{headwords:list.length,wordForms:index.size,passageCandidates:candidates.length}};
}
root.TlahtolliTranslator={create,norm,fold,tokenize};
})(window);
