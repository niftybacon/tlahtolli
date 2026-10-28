/* Bounded clause analysis. Indexed paradigms are editorial hypotheses, not attestations. */
(function(root){
'use strict';
const norm=s=>String(s).normalize('NFC').toLowerCase();
const people=['I','you (singular)','he / she / it','we','you (plural)','they'];
const bases={'chōca':['cry','weep'],'tlacuā':['eat'],'itta':['see','inspect','look at']};
const grammar='https://api.pageplace.de/preview/DT0400.9780511985027_A23683606/preview-9780511985027_A23683606.pdf';
function create(dictionary,paradigms){
 const words=dictionary.words.filter(w=>String(w.variety).startsWith('Classical Nahuatl'));
 const index=new Map();
 for(const [lemma,p] of Object.entries(paradigms.paradigms||{})){
  (p.cells[0]||[]).forEach((form,person)=>{
   const k=norm(form),list=index.get(k)||[];
   list.push({lemma,person,transitive:p.trans,source:p.lemmaSource});index.set(k,list);
  });
 }
 function noun(token){
  const hits=words.filter(w=>w.pos==='noun'&&[w.word,...String(w.original||'').split(/[;,/]/)].some(f=>norm(f.trim())===norm(token)));
  return hits.length===1?hits[0]:null;
 }
 function analyze(input){
  const raw=String(input||'');
  if(/[?¿]/u.test(raw))return {clauses:[{text:raw,tokens:[],candidates:[],complete:false,reason:'Question scope is not yet supported.'}],complete:false};
  if(raw.length>7000)return {clauses:[],complete:false,reason:'Input exceeds 7000 characters.'};
  const clauses=raw.split(/[.!?;\n]+/u).filter(s=>s.trim()).map(text=>{
   const tokens=text.trim().split(/\s+/u), original=tokens.slice();
   let negative=false;
   if(['ahmo','ahmō'].includes(norm(tokens[0]))){negative=true;tokens.shift();}
   const candidates=[];
   for(let v=0;v<tokens.length;v++)for(const parse of index.get(norm(tokens[v]))||[]){
    let subject=people[parse.person],subjectNoun=null;
    const remainder=tokens.filter((_,i)=>i!==v);
    if(remainder.length){
     // Entire stated subject must be contiguous and exactly in + citation noun.
     if(parse.transitive||parse.person!==2||tokens.length!==3||!([0,2].includes(v)))continue;
     if(norm(remainder[0])!=='in'||!(subjectNoun=noun(remainder[1])))continue;
     subject='the ['+subjectNoun.meaning+']';
    }
    const lexical=words.filter(w=>w.word===parse.lemma);
    if(lexical.length!==1)continue;
    const object=parse.transitive?'him / her / it':null;
    const frame={subject,subjectPerson:parse.person,subjectNoun:subjectNoun?.word||null,
     predicate:parse.lemma,tense:'present',negative,object,
     lexicalMeaning:lexical[0].meaning};
    // English do-support avoids inventing agreement or inflection from gloss strings.
    const aux=parse.person===2?'does':'do';
    const english=(bases[parse.lemma]||[]).map(base=>subject+' '+aux+(negative?' not':'')+' '+base+(object?' '+object:''));
    candidates.push({frame,english,coverage:original.length,
     sources:[...new Set([grammar,parse.source,lexical[0].source,subjectNoun?.source].filter(Boolean))],
     grade:'grammar-derived candidate',
     note:'Present-tense candidate; simple/progressive aspect, lexical sense and third-person referents remain contextual. English verb options are illustrative, not exhaustive.'});
   }
   return {text,tokens:original,candidates,complete:candidates.length>0,
    reason:candidates.length?'':'Outside supported clause grammar; no words were silently discarded.'};
  });
  return {clauses,complete:clauses.length>0&&clauses.every(c=>c.complete)};
 }
 return {analyze};
}
root.TlahtolliSentence={create};
})(window);
