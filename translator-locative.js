/* Classical Nahuatl relational/locative phrase parser.
 * Nonfinite, conservative and source-graded. Does NOT generate noun inflections,
 * invent a verbal interpretation, or turn editorial English into a gold answer.
 */
(function(root){
'use strict';
const normalize=s=>String(s).normalize('NFC').toLowerCase();
const isUrl=s=>typeof s==='string'&&/^https:\/\/[^/\s]+/u.test(s);
const LOCATIVES=[
 {lemma:'itic',pos:'relational noun / locative',
  source:'https://nahuatl.wired-humanities.org/content/itic',
  grammar:'https://nahuatl.wired-humanities.org/content/itic-0',
  senses:['inside','within','in the interior of'],possessor:'3sg',
  recorded:{yitic:'https://florentinecodex.getty.edu/book/11/folio/62r'}},
 {lemma:'ītech',pos:'relational noun / locative',
  source:'https://nahuatl.wired-humanities.org/content/itech',
  grammar:'https://nahuatl.wired-humanities.org/content/itech',
  senses:['on','by','in contact with','attached to','concerning','from'],possessor:'3sg',
  recorded:{itech:'https://florentinecodex.getty.edu/book/11/folio/217r'}}
];
const LOCATED_FC='https://florentinecodex.getty.edu/book/11/folio/62r';
function create(dictionary,researchExamples){
 const words=(Array.isArray(dictionary?.words)?dictionary.words:[])
  .filter(w=>w&&w.variety==='Classical Nahuatl'&&typeof w.word==='string');
 const nounVariants=new Map();
 for(const w of words){
  if(w.pos!=='noun'||!isUrl(w.source)||typeof w.meaning!=='string'||!w.meaning.trim())continue;
  const forms=[{form:w.word,evidence:'curated lemma spelling',source:w.source}];
  for(const written of String(w.original||'').split(';')){
   if(written.trim()&&normalize(written.trim())!==normalize(w.word))
    forms.push({form:written.trim(),evidence:'recorded original spelling (dictionary)',source:w.source});
  }
  for(const f of w.inflections||[]){
   if(f&&(f.evidence==='text'||f.evidence==='dictionary')&&
    typeof f.form==='string'&&isUrl(f.source)&&
    !/^[-]/u.test(f.form)&&f.form.length<120)
    forms.push({form:f.form,evidence:'source-listed inflection',source:f.source});
  }
  for(const f of forms){
   const key=normalize(f.form);
   if(!/^[\p{L}\p{M}’'-]{1,120}$/u.test(f.form))continue;
   const list=nounVariants.get(key)||[];
   if(!list.some(item=>item.word===w.word))list.push({...f,word:w.word,meaning:w.meaning,lexicalSource:w.source});
   nounVariants.set(key,list);
  }
 }
 const resolveNoun=token=>{
  const hits=nounVariants.get(normalize(token))||[];
  return hits.length===1?hits[0]:null;
 };
 const locativeForms=new Map();
 for(const cfg of LOCATIVES){
  const matching=words.filter(w=>w.word===cfg.lemma&&w.pos===cfg.pos&&w.source===cfg.source);
  if(matching.length!==1)continue;
  const w=matching[0];
  locativeForms.set(normalize(w.word),{
   lemma:cfg.lemma,written:w.word,kind:'curated possessed relational headword',
   source:w.source,grammar:cfg.grammar,senses:cfg.senses,possessor:cfg.possessor});
  for(const [form,url] of Object.entries(cfg.recorded)){
   const hits=(w.inflections||[]).filter(f=>
    f.form===form&&f.evidence==='text'&&f.source===url);
   if(hits.length!==1)continue;
   locativeForms.set(normalize(form),{
    lemma:cfg.lemma,written:form,kind:'exact historically source-listed relational spelling',
    source:url,lexicalSource:w.source,grammar:cfg.grammar,
    senses:cfg.senses,possessor:cfg.possessor});
  }
 }
 const agentForms=new Map();
 const agents=words.filter(w=>w.word==='nemini'&&
  w.pos==='noun (agentive; homophonous with verbal form)'&&
  w.source==='https://nahuatl.wired-humanities.org/content/nemini');
 if(agents.length===1){
  const word=agents[0];
  agentForms.set(normalize(word.word),{
   written:word.word,lemma:word.word,meaning:word.meaning,
   evidence:'curated nominal headword; possible homophonous verb',
   sources:[word.source]});
  for(const f of word.inflections||[])if(
   f.form==='nemjnj'&&f.evidence==='text'&&f.source===LOCATED_FC){
   agentForms.set(normalize(f.form),{
    written:f.form,lemma:word.word,meaning:word.meaning,
    evidence:'exact Florentine source spelling; nominal/finite verbal status unresolved',
    sources:[word.source,f.source]});
  }
 }
 const candidates=Array.isArray(researchExamples?.entries)?
  researchExamples.entries.filter(e=>e?.review_status==='candidate'&&
   e.train_eligible===false&&e.variety==='Classical Nahuatl'&&
   e.source_url=== 'https://florentinecodex.getty.edu/es/book/11/folio/62r'&&
   e.passage_type==='fragment; intentionally not a complete translated sentence'&&
   typeof e.original==='string'&&typeof e.english_interpretation==='string'):[];
 function analyze(tokens,negative=false){
  if(negative||!Array.isArray(tokens)||tokens.length<2||tokens.length>4||
    tokens.some(t=>typeof t!=='string'||t.length>120))return [];
  // Optional written in before a unique nominative noun, then a *possessed*
  // relational form. No unverified NP reorderings or automatic contractions.
  const marked=normalize(tokens[0])==='in';
  const start=marked?1:0;
  if(tokens.length-start!==2&&tokens.length-start!==3)return [];
  const place=resolveNoun(tokens[start]);
  const relation=locativeForms.get(normalize(tokens[start+1]));
  if(!place||!relation)return [];
  const rest=tokens.length-start===3?tokens[start+2]:null;
  let agent=null;
  if(rest!==null){
   agent=agentForms.get(normalize(rest));
   if(!agent)return [];
  }
  const written=tokens.join(' ');
  // The presence of the reference translation must never change the grammar
  // or make an alternate spelling an "attested" sentence.
  const hits=candidates.filter(e=>normalize(e.original.trim().replace(/\s+/gu,' '))===
   normalize(written)&&e.original==='atl yitic nemjnj');
  const sourceExample=hits.length===1?hits[0]:null;
  const sources=[...new Set([place.lexicalSource,place.source,
   relation.source,relation.lexicalSource,relation.grammar,
   ...(agent?.sources||[]),...(sourceExample?[sourceExample.source_url]:[])].filter(isUrl))];
  return [{
   construction:rest?'Nominal location + possessed relational + unresolved agentive/verb form':
    'Noun phrase + possessed relational location',
   grade:sourceExample?'historical fragment (nonblind, editorially consulted)':
    'grammar-composed locative proposal (not independently attested)',
   sourceSpelling:written,
   place:{written:tokens[start],lemma:place.word,meaning:place.meaning,
    evidence:place.evidence,source:place.source,article:marked?tokens[0]:null},
   relation:{written:tokens[start+1],lemma:relation.lemma,
    lexicalPossessor:relation.possessor,
    possessorStatus:'3sg possessor in the relational form; antecedent linkage is proposed',
    evidence:relation.kind,possibleSenses:relation.senses.slice(),
    referenceWord:tokens[start]},
   extra:agent?{written:rest,lemma:agent.lemma,meaning:agent.meaning,
    readingStatus:agent.evidence,
    syntacticRole:'UNRESOLVED: agentive noun or homophonous verbal form; not a proven predicate'}:null,
   potentialLocation:relation.senses.join(' / ')+' + ['+place.meaning+']',
   editorialComparison:sourceExample?{
    reading:sourceExample.english_interpretation,
    source:sourceExample.source_url,review_status:'candidate, consulted; NOT test gold'}:null,
   coverage:tokens.length,sources,
   note:'A source-controlled locative relation hypothesis, not a complete translation. '+
    'The third-person possessor on the relational form may refer to the preceding noun, but co-reference is not proven. '+
    (rest?'The last word is NOT automatically analyzed as a finite verb or subject. ':'')+
    (marked?'The source-spelled in is treated as a noun-phrase marker. ':'')+
    'No modern dialect substitutions, generated locative contractions or reconstructed colonial spellings are assumed.'
  }];
 }
 return {analyze};
}
root.TlahtolliLocative={create};
})(window);
