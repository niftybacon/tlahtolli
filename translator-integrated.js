/* Tlahtōlli · Integrated Historical Translation Desk
 * Native workspace inside the main app, powered by translator-engine.js.
 * Lexical glosses and candidate passage interpretations are NOT machine translations.
 */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const el=(tag,cls,value)=>{
 const node=document.createElement(tag);
 if(cls)node.className=cls;
 if(value!==undefined)node.textContent=String(value);
 return node;
};
const safeLink=(value,title)=>{
 if(typeof value!=='string'||!value.trim())return null;
 try{
  const url=new URL(value,location.href);
  if(!['http:','https:'].includes(url.protocol))return null;
  const link=el('a','',title);
  link.href=url.href;link.target='_blank';link.rel='noopener noreferrer';
  return link;
 }catch{return null;}
};
const form=$('translatorForm');
if(!form)return;
let model=null,latest=null,dataMode='none',morphBridge=null,sentenceModel=null,sourceMorphology=null;
const input=$('translatorInput'),direction=$('translatorDirection');
const note=$('translatorStatus'),gloss=$('translatorGloss');
const parts=$('translatorAnalyses'),passages=$('translatorPassages');
const orthography=$('translatorOrthography'),morphStatus=$('translatorMorphStatus');
function status(message){note.textContent=message;}
function showResult(){
 parts.replaceChildren();passages.replaceChildren();latest=null;
 if(!model){gloss.textContent='Dictionary is loading or unavailable.';return;}
 const content=input.value.trim();
 if(!content){gloss.textContent='Enter a word or a short passage and choose Analyze.';status(model.stats.headwords+' Classical Nahuatl headwords ready.');return;}
 latest=model.analyze(content,direction.value);
 gloss.textContent=latest.gloss;
 if(sentenceModel&&direction.value==='nh-en'){
  const result=sentenceModel.analyze(content);
  for(const clause of result.clauses){
   const block=el('article','translator-candidate');
   block.append(el('h4','','Sentence analysis'),el('p','',clause.text));
   if(clause.roleAmbiguous)block.append(el('p','translator-caution','Subject/object roles remain ambiguous. Alternatives below are not ranked.'));
   if(!clause.complete)block.append(el('p','translator-caution',clause.reason));
   for(const candidate of clause.candidates){
    const f=candidate.frame;
    block.append(el('p','',candidate.english.join(' / ')||f.subject+' — '+(f.negative?'not ':'')+f.lexicalMeaning+(f.object?' — object: '+f.object:'')),
     el('p','translator-meta','Predicate: '+f.predicate+' · '+f.tense+' · subject: '+f.subject+' · object: '+(f.object||'none')+' · '+candidate.grade),
     el('p','translator-caution',candidate.note));
    for(const sense of candidate.nounSenses||[])block.append(el('p','translator-meta',sense.lemma+' — selected English sense: '+(sense.selected||'unresolved')+'; full dictionary meaning: '+sense.fullMeaning));
    for(const url of candidate.sources){const link=safeLink(url,'Inspect analysis source');if(link)block.append(link);}
   }
   if(clause.agreementProposals?.length){
    const panel=el('details','translator-morph-panel');
    panel.className+=' translator-agreement-proposals';
    panel.append(el('summary','','Provisional agreement and noun-phrase links · '+
     clause.agreementProposals.length+' alternatives (NOT a translation)'));
    panel.append(el('p','translator-caution',
     'The following structures use source-crosschecked morphological candidates and one fully consumed noun phrase. Their verb subject and noun-object linking are proposals only; neither English text nor full-clause certainty is inferred.'));
    for(const proposal of clause.agreementProposals.slice(0,8)){
     const item=el('div','translator-analysis');
     item.append(el('strong','',proposal.verb.written+' · subject '+proposal.verb.subject+
      ' · possible direct object: '+proposal.nounPhrase.written),
      el('p','translator-meta','Verb '+proposal.verb.lemma+
       ' · 3sg object agreement · noun '+proposal.nounPhrase.lemma+
       (proposal.nounPhrase.possessor?' · possessor '+proposal.nounPhrase.possessor:'')+
       ' · '+proposal.grade),
      el('p','translator-caution','Particle: '+proposal.nounPhrase.markerStatus),
      el('p','translator-caution',proposal.note));
     for(const url of proposal.sources||[]){
      const link=safeLink(url,'Inspect agreement and noun evidence');
      if(link)item.append(link);
     }
     panel.append(item);
    }
    block.append(panel);
   }
   if(clause.morphologicalClues?.length){
    const panel=el('details','translator-morph-panel');
    panel.append(el('summary','','Partial morphology only · '+clause.morphologicalClues.length+
     ' proposed analysis'+(clause.morphologicalClues.length===1?'':'es')+
     ' (NOT a sentence translation)'));
    panel.append(el('p','translator-caution',
     'These are token-level morphological possibilities from the existing Tēntli engine. The clause remains unsupported; no grammatical roles or whole-sentence English have been established.'));
    for(const clue of clause.morphologicalClues.slice(0,12)){
     const item=el('div','translator-morph-candidate');
     item.append(el('strong','',clue.token+' → '+clue.lemma+' · '+clue.kind),
      el('p','translator-meta','Evidence grade: '+clue.grade+'; morphology only, not contextual certainty.'));
     const features=Object.entries(clue.features||{}).filter(([k,v])=>v!==null&&v!==undefined&&typeof v==='string')
      .slice(0,8).map(([k,v])=>k+': '+v).join(' · ');
     if(features)item.append(el('p','translator-meta',features));
     if(clue.parts?.length)item.append(el('p','translator-meta',
      clue.parts.map(part=>part.surface+' ('+part.role+')').join(' · ')));
     const source=safeLink(clue.source,'Inspect source of morphological proposal');
     if(source)item.append(source);
     for(const url of (clue.sources||[]).slice(0,6)){
      if(url===clue.source)continue;
      const evidence=safeLink(url,'Inspect independent morphology evidence');
      if(evidence)item.append(evidence);
     }
     panel.append(item);
    }
    if(clause.morphologicalClues.length>12)panel.append(el('p','translator-caution',
     'Further unranked proposals omitted to keep the reading bounded.'));
    block.append(panel);
   }
   passages.append(block);
  }
 }
 status(latest.stats.matched+' recognized · '+latest.stats.unknown+' unknown · '+
  latest.stats.ambiguous+' ambiguous entries · '+latest.stats.senseAmbiguities+' unresolved sense lists · '+latest.stats.approximate+
  ' approximate · '+latest.stats.orthographyConflicts+
  ' unresolved vowel-length contrasts. Working lexical clues, not a sentence translation.'+
  (dataMode==='offline'?' (Offline dictionary fallback.)':''));
 for(const reading of latest.contextReadings||[]){
  const block=el('article','translator-candidate');
  block.append(el('h4','','Compositional comparison reading'),
   el('p','',reading.readings.join(' / ')),el('p','translator-meta',reading.evidence),
   el('p','translator-caution',reading.limitation));
  for(const source of reading.sources){const link=safeLink(source,'Inspect lexical basis');if(link)block.append(link);}
  passages.append(block);
 }
 if(latest.passages.length){
  passages.append(el('h4','','Historical passage interpretation candidates'));
  for(const item of latest.passages){
   const block=el('article','translator-candidate');
   block.append(el('strong','',item.source),el('p','',item.interpretation),
    el('p','translator-meta',item.type),
    el('p','translator-caution','Not an approved translation training pair. Editorial wording requires review.'));
   if(item.approximate)block.append(el('p','translator-caution','Approximate spelling match; check the source spelling.'));
   if(item.note)block.append(el('p','translator-meta',item.note));
   const link=safeLink(item.url,'View cited source');
   if(link)block.append(link);
   passages.append(block);
  }
 }
 let morphTokens=0;
 for(const entry of latest.parts){
  if(entry.kind!=='word')continue;
  const block=el('article','translator-word');
  block.append(el('strong','translator-headword',entry.value));
  if(entry.status==='unknown'){
   block.append(el('p','translator-caution','Unindexed form: no established dictionary meaning. Morphological possibilities, if any, are shown separately below.'));
  }else{
   if(entry.status==='approximate')block.append(el('p','translator-caution','SPELLING UNCERTAIN: candidates are only diacritic-folded matches. No meaning has been selected for the working gloss.'));
   if(entry.orthographyConflict)block.append(el('p','translator-caution','UNRESOLVED VOWEL LENGTH: the unmarked spelling matches this entry but also a different macron-bearing lemma. The working gloss deliberately abstains.'));
   if(entry.ambiguous)block.append(el('p','translator-caution','MULTIPLE LEXICAL ANALYSES: no preferred meaning is selected automatically.'));
   if(entry.senseAmbiguous)block.append(el('p','translator-caution','UNRESOLVED DICTIONARY SENSES: the indexed gloss lists alternatives. Context has not selected a sense; inspect the full meaning and cited source below.'));
   if(entry.truncated)block.append(el('p','translator-caution','Additional candidates exist beyond those shown; not all possibilities are displayed.'));
   if(entry.alternatives?.length){
    const alt=el('details','translator-morph-panel');
    alt.append(el('summary','','Other meanings possible from unmarked vowel length ('+entry.alternatives.length+' shown)'));
    for(const possibility of entry.alternatives){
     const item=el('div','translator-analysis');
     item.append(el('strong','',possibility.lemma+' — '+possibility.meaning),
      el('p','translator-meta','Contrasting orthography: alternative, not a resolved reading.'));
     const source=safeLink(possibility.source,'Inspect lexical source');
     if(source)item.append(source);
     alt.append(item);
    }
    block.append(alt);
   }
   for(const candidate of entry.candidates){
    const line=el('div','translator-analysis');
    line.append(el('span','',candidate.lemma+' — '+candidate.meaning),
     el('small','translator-meta',candidate.form_type+' · '+candidate.evidence+' · '+candidate.pos));
    const source=safeLink(candidate.source,'Lexical / grammatical source');
    if(source)line.append(source);
    block.append(line);
   }
  }
  if(morphBridge&&direction.value==='nh-en'&&morphTokens<90){
   morphTokens++;
   const result=morphBridge.examine(entry.value,orthography?.value||'general');
   for(const source of ['codex','luke1833']){
    const observations=result.corpusObservations.filter(o=>o.source===source);
    if(!observations.length)continue;
    const exact=observations.filter(o=>!o.changed);
    const used=exact.length?exact:observations.filter(o=>o.changed);
    const appearances=used.reduce((n,o)=>n+o.count,0);
    const books=[...new Set(used.map(o=>o.book).filter(Boolean))].sort((a,b)=>a-b);
    const label=source==='codex'?'Florentine Codex aggregate':
     '1833 Luke unverified OCR';
    const volumes=source==='codex'?' (Books '+books.join(', ')+')':'';
    block.append(el('p','translator-meta',label+volumes+': '+
     appearances.toLocaleString()+' observations among the sampled frequent spellings. '+
     (exact.length?'Original spelling observed. ':'Only a suggested spelling observed. ')+
     'Not a verified interpretation or source location.'));
   }
   if(result.analyses.length){
    const panel=el('details','translator-morph-panel');
    const preferred=result.analyses[0];
    panel.append(el('summary','','Morphology · '+result.analyses.length+
     ' candidate'+(result.analyses.length===1?'':'s')+
     (preferred?.changed?' · historical spelling proposed':'')));
    for(const proposal of result.analyses.slice(0,5)){
     const line=el('div','translator-morph-candidate');
     line.append(el('strong','',proposal.lemma+' · '+proposal.kind));
     line.append(el('p','translator-meta',(morphBridge.gradeLabels[proposal.grade]||proposal.grade)+
      ' · '+(proposal.changed?'Spelling suggestion: '+proposal.original+' → '+proposal.surface:
      'Original spelling retained')));
     if(proposal.changed)line.append(el('p','translator-caution',proposal.rule+
       '. This is a tentative orthographic possibility, not a source-attested equivalence.'));
     const feature=Object.entries(proposal.features||{}).filter(([k,v])=>k!=='template'&&v!==''&&v!=null)
      .map(([k,v])=>k+': '+String(v)).join(' · ');
     if(feature)line.append(el('p','translator-meta',feature));
     if(proposal.parts.length){
      const morphology=el('div','translator-morphemes');
      for(const piece of proposal.parts.slice(0,9)){
       const chip=el('span','translator-morpheme');
       chip.append(el('strong','',piece.surface),el('small','',piece.role));
       morphology.append(chip);
      }
      line.append(morphology);
     }
     if(proposal.meaning)line.append(el('p','',proposal.meaning));
     if(proposal.note)line.append(el('p','translator-meta',proposal.note));
     const link=safeLink(proposal.source,'Inspect morphology source');
     if(link)line.append(link);
     for(const evidenceURL of (Array.isArray(proposal.sources)?proposal.sources:[]).slice(0,6)){
      if(evidenceURL===proposal.source)continue;
      const reference=safeLink(evidenceURL,'Inspect independent morpheme reference');
      if(reference)line.append(reference);
     }
     panel.append(line);
    }
    block.append(panel);
   }
  }
  parts.append(block);
 }

  // Compare every analyzed token with the separately licensed archive.
  // The published dictionary alone controls the working gloss and recognition status.
  if(direction.value==='nh-en'&&window.TlahtolliArchive){
   const current=latest;
   const wordEntries=current.parts.filter(item=>item.kind==='word').slice(0,90);
   if(wordEntries.length){
    const blocks=[...parts.querySelectorAll('article.translator-word')];
    window.TlahtolliArchive.ensureLoaded().then(()=>{
     if(latest!==current)return;
     let supplemented=0,approximate=0;
     wordEntries.forEach((item,i)=>{
      if(!blocks[i])return;
      const evidence=window.TlahtolliArchive.lookupEvidence(item.value,{classicalOnly:true,limit:8});
      if(!evidence.hits.length)return;
      supplemented++;
      approximate+=evidence.approximateCount;
      const section=el('details','translator-morph-panel');
      section.append(el('summary','','Additional lexical evidence · '+
       evidence.total+' source record'+(evidence.total===1?'':'s')+' (unreviewed)'));
      section.append(el('p','translator-caution',
       'Independent historical/community dictionary comparisons. No archive meaning changes the reviewed lexical lookup, resolves a sense, or becomes an attested translation. Siméon definitions are French OCR.'));
      if(evidence.truncated)section.append(el('p','translator-caution',
       'Only the first '+evidence.hits.length+' matches are shown; other source records may differ.'));
      for(const hit of evidence.hits){
       const record=el('div','translator-analysis');
       record.append(el('strong','',hit.word+' · '+hit.pos+' · '+hit.variety),
        el('p','translator-meta',hit.source+' · definition language: '+hit.language));
       if(hit.matchKind==='diacritic-variant')record.append(el('p','translator-caution',
        'UNCERTAIN SPELLING: macron/accent differs from the input. This is an unverified orthographic possibility, not a selected meaning.'));
       const forms=hit.matchedForms||[];
       if(forms.length){
        const labels=forms.slice(0,8).map(f=>f.form+' ['+f.role+
         (f.tags.length?'; source labels: '+f.tags.join(', '):'')+']');
        record.append(el('p','translator-meta','Matched source form: '+labels.join(' / ')+
         (forms.length>8?' / …':'')+'. Grammatical labels are source-reported, not verified parses.'));
       }
       const definition=el('p','',hit.meaning||'No usable imported definition');
       if(definition.textContent.length>600){
        const full=el('details');
        full.append(el('summary','','Read original definition ('+definition.textContent.length+' characters)'));
        full.append(definition);record.append(full);
       }else record.append(definition);
       const tags=[...new Set((hit.senses||[]).flatMap(s=>Array.isArray(s[2])?s[2]:[]))].slice(0,12);
       if(tags.length)record.append(el('p','translator-meta','Source sense labels: '+tags.join(', ')));
       if(hit.etymology)record.append(el('p','translator-meta','Source etymology: '+hit.etymology));
       const link=safeLink(hit.sourceUrl,'Inspect imported source and licensing');
       if(link)record.append(link);
       section.append(record);
      }
      if(morphBridge){
       // This independent cross-check never modifies morphBridge's proposed
       // analyses, their evidence grades, or any English candidate.
       const proposals=morphBridge.examine(item.value,orthography?.value||'general').analyses;
       const overlaps=window.TlahtolliArchive.crossCheckMorphology(item.value,proposals,{limit:8});
       if(overlaps.length){
        const extra=el('details','translator-morph-panel');
        extra.append(el('summary','','Source-form overlap · '+overlaps.length+' unreviewed cross-reference'+
         (overlaps.length===1?'':'s')));
        extra.append(el('p','translator-caution',
         'A source dictionary lists the same surface under the proposed lemma. This does not verify the grammatical analysis, sentence meaning, or historical use; other analyses may remain possible.'));
        for(const overlap of overlaps){
         const line=el('div','translator-analysis');
         line.append(el('strong','',overlap.lemma+' · '+overlap.kind),
          el('p','translator-meta','Matched '+overlap.role+': '+overlap.form+
           (overlap.tags.length?' · source labels: '+overlap.tags.join(', '):'')+
           ' · '+overlap.sourcePartOfSpeech+' · proposal grade: '+overlap.grade));
         const link=safeLink(overlap.sourceUrl,'Inspect archive source');
         if(link)line.append(link);
         extra.append(line);
        }
        section.append(extra);
       }
      }
      blocks[i].append(section);
     });
     if(supplemented)status(note.textContent+' · '+supplemented+
      ' tokens have unreviewed lexical comparisons'+(approximate?' (including uncertain spellings)':'')+'.');
    }).catch(error=>{
     if(latest===current)status(note.textContent+' · Supplementary archive unavailable: '+error.message);
    });
   }
  }
 if(morphStatus){
  morphStatus.textContent=direction.value==='en-nh'?
   'Morphological reverse parsing applies to Nahuatl input only. English mode remains dictionary lookup.':
   morphBridge?'Using the existing Tēntli morphology engine for up to 90 tokens. Analyses may be hypotheses, not historical attestations.':
   'The main-site morphology engine is unavailable; basic dictionary lookup remains available.';
 }
}
async function init(){
 if(!window.TlahtolliTranslator){
  status('Translation engine not available. Try reloading the website.');
  return;
 }
 try{
  const requests=[
   fetch('./dictionary.json',{cache:'no-cache'}).then(async r=>{
    if(!r.ok)throw Error('Dictionary fetch '+r.status);return r.json();
   }),
   fetch('./research/translation_corpus/research_examples.json',{cache:'no-cache'})
    .then(r=>r.ok?r.json():{entries:[]}).catch(()=>({entries:[]})),
   fetch('./research/florentine_codex/analysis.json',{cache:'no-cache'})
    .then(r=>r.ok?r.json():null).catch(()=>null),
   fetch('./research/translation_corpus/luke_1833_analysis.json',{cache:'no-cache'})
    .then(r=>r.ok?r.json():null).catch(()=>null),
   fetch('./research/translation_corpus/source_reviews/ENL_BC16_1573.json',{cache:'no-cache'})
    .then(r=>r.ok?r.json():null).catch(()=>null)
  ];
  const [dictionary,candidates,codexStats,lukeStats,sourceReview]=await Promise.allSettled(requests);
  let document;
  if(dictionary.status==='fulfilled'&&Array.isArray(dictionary.value.words)){
   document=dictionary.value;dataMode='published';
  }else if(window.TLAHTOLLI_OFFLINE_SEED&&Array.isArray(window.TLAHTOLLI_OFFLINE_SEED.words)){
   document=window.TLAHTOLLI_OFFLINE_SEED;dataMode='offline';
  }else throw Error('No published or bundled dictionary data found');
  const corpus=candidates.status==='fulfilled'?candidates.value:{entries:[]};
  model=window.TlahtolliTranslator.create(document,corpus);
  if(window.TlahtolliSourceMorphology&&sourceReview.status==='fulfilled'&&sourceReview.value)
   sourceMorphology=window.TlahtolliSourceMorphology.create(sourceReview.value);
  const explainMorphology=token=>[
   ...(typeof TlahtolliMorphEngine==='undefined'?[]:TlahtolliMorphEngine.analyze(token)),
   ...(sourceMorphology?.analyze(token)||[])
  ];
  try{
   if(!window.TlahtolliSentence)await new Promise((resolve,reject)=>{
    const script=window.document.createElement('script');script.src='./translator-sentence.js';
    script.onload=resolve;script.onerror=reject;window.document.head.append(script);
   });
   const response=await fetch('./paradigms.json',{cache:'no-cache'});
   if(response.ok&&window.TlahtolliSentence)sentenceModel=window.TlahtolliSentence.create(
    document,await response.json(),
    explainMorphology);
  }catch{} // Lexical analysis remains usable when paradigm loading fails.
  if(window.TlahtolliHistoricalMorphology){
   morphBridge=window.TlahtolliHistoricalMorphology.create(
    explainMorphology,
    token=>model.lookup(token,'nh-en'),
    codexStats.status==='fulfilled'?codexStats.value:null,
    lukeStats.status==='fulfilled'?lukeStats.value:null
   );
  }
  status(model.stats.headwords+' Classical Nahuatl headwords · '+
   model.stats.wordForms+' index keys · '+
   model.stats.passageCandidates+' sourced passage candidates.'+
   (dataMode==='offline'?' Using bundled offline dictionary.':''));
 }catch(err){status('Could not initialize translation research desk: '+String(err.message||err));}
}
form.addEventListener('submit',event=>{event.preventDefault();showResult();});
direction.addEventListener('change',()=>{if(input.value.trim())showResult();});
if(orthography)orthography.addEventListener('change',()=>{
 morphBridge?.clearCache();
 if(input.value.trim())showResult();
});
$('translatorExample').addEventListener('click',()=>{
 input.value='in mochioa tezcatl, in mocuepa ca tetl';
 direction.value='nh-en';showResult();
});
$('translatorLukeExample').addEventListener('click',()=>{
 input.value='Yacuic iyec tenonotzaltzin';
 direction.value='nh-en';if(orthography)orthography.value='luke1833';showResult();
});
$('translatorClear').addEventListener('click',()=>{
 input.value='';parts.replaceChildren();passages.replaceChildren();latest=null;
 gloss.textContent='Enter a word or a short passage and choose Analyze.';
 input.focus();
});
$('translatorCopy').addEventListener('click',async()=>{
 if(!latest){status('Analyze some text first.');return;}
 try{await navigator.clipboard.writeText(gloss.textContent);status('Working gloss copied.');}
 catch{status('Clipboard unavailable; select the gloss and copy manually.');}
});
$('translatorExport').addEventListener('click',()=>{
 if(!latest){status('Analyze a passage before exporting a research note.');return;}
 const json={
  format:'tlahtolli-translation-research-note',schema:1,
  created_at:new Date().toISOString(),direction:direction.value,
  original_text:input.value.slice(0,7000),working_gloss:latest.gloss,
  stats:latest.stats,source_passage_candidates:latest.passages,
  review_status:'unreviewed',train_eligible:false,
  note:'This is a personal research export, not reviewed corpus data or a machine translation.'
 };
 const blob=new Blob([JSON.stringify(json,null,2)],{type:'application/json'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='tlahtolli-translation-note.json';a.click();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
 status('Research note downloaded. It has not been submitted to a model.');
});
init();
})();
