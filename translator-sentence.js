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
 'chimalli':'shield','tlaxcalli':'tortilla','tēpetl':'hill'};
const grammar='https://api.pageplace.de/preview/DT0400.9780511985027_A23683606/preview-9780511985027_A23683606.pdf';
const tenseSource='https://pages.ucsd.edu/~dkjordan/nahuatl/nahugram.html';
function create(dictionary,paradigms){
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
   return {text,tokens:original,candidates,complete:candidates.length>0,
    roleAmbiguous:new Set(candidates.map(c=>JSON.stringify([c.frame.subjectNoun,c.frame.objectNoun]))).size>1,
    reason:candidates.length?'':'Outside supported clause grammar; no words were silently discarded.'};
  });
  return {clauses,complete:clauses.length>0&&clauses.every(c=>c.complete)};
 }
 return {analyze};
}
root.TlahtolliSentence={create};
})(window);
