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
   if(clause.relativeClauseProposals?.length){
    const panel=el('details','translator-morph-panel');
    panel.className+=' translator-relative-in-proposals';
    panel.append(el('summary','','In-relative clauses · '+clause.relativeClauseProposals.length+
     ' unranked head/antecedent alternative'+(clause.relativeClauseProposals.length===1?'':'s')+
     ' (NOT a verified translation)'));
    panel.append(el('p','translator-caution',
     'The first in introduces a noun; the second may introduce a relative. '+
     'The noun is an explicit head, but its possible role in the relative verb follows agreement constraints—not pronoun identity.'));
    for(const proposal of clause.relativeClauseProposals){
     const item=el('div','translator-analysis');
     item.append(el('strong','',proposal.head.written+' → '+proposal.relative.written+
      ' · '+proposal.relative.headGapRole),
      el('p','translator-meta','Head: '+proposal.head.lemma+
       ' · relative verb '+proposal.relative.lemma+' · '+proposal.relative.tense+
       ' · relative subject agreement '+proposal.relative.subjectPerson),
      el('p','translator-meta',proposal.construction+' · '+proposal.grade),
      el('p','translator-caution',proposal.relative.status),
      el('p','translator-caution',proposal.note));
     if(proposal.matrix)item.append(el('p','translator-meta',
      'Matrix verb '+proposal.matrix.written+' · head in '+proposal.matrix.headRole+' slot'));
     for(const source of proposal.sources){
      const link=safeLink(source,'Inspect relative grammar evidence');
      if(link)item.append(link);
     }
     panel.append(item);
    }
    block.append(panel);
   }
   if(clause.nominalInProposals?.length){
    const panel=el('details','translator-morph-panel');
    panel.className+=' translator-nominal-in-proposals';
    panel.append(el('summary','','In-introduced dependent finite clause · '+
     clause.nominalInProposals.length+' proposal'+(clause.nominalInProposals.length===1?'':'s')+
     ' (NOT a translation)'));
    for(const proposal of clause.nominalInProposals){
     const item=el('div','translator-analysis');
     item.append(el('strong','',proposal.matrix.written+' + in '+
      proposal.dependent.written),
      el('p','translator-meta',proposal.construction+' · '+proposal.grade),
      el('p','translator-meta','Matrix '+proposal.matrix.lemma+
       ' · indexed '+proposal.matrix.subjectPerson+
       '; subordinate '+proposal.dependent.lemma+' · indexed '+proposal.dependent.subjectPerson),
      el('p','translator-caution',proposal.note));
     for(const source of proposal.sources){
      const link=safeLink(source,'Inspect subordinate grammar evidence');
      if(link)item.append(link);
     }
     panel.append(item);
    }
    block.append(panel);
   }
   if(clause.nestedInProposals?.length){
    const panel=el('details','translator-morph-panel');
    panel.className+=' translator-nested-in-proposals';
    panel.append(el('summary','','Nested in-subordination · '+
     clause.nestedInProposals.length+' bounded structural alternative'+
     (clause.nestedInProposals.length===1?'':'s')+' (NOT a translation)'));
    panel.append(el('p','translator-caution',
     'Each displayed in marker is accounted for. Depth, finite agreement and relative head roles are syntactic proposals; subordinate meanings, omitted arguments and participant identity remain unresolved.'));
    for(const p of clause.nestedInProposals.slice(0,16)){
     const item=el('div','translator-analysis');
     item.append(el('strong','',p.construction+' · depth '+p.depth),
      el('p','translator-meta',p.layers.map(l=>l.written+
       ' ('+l.lemma+', '+l.subjectPerson+')').join(' → in → ')),
      el('p','translator-meta',p.terminal.kind==='headed-relative'?
       'Relative head: '+p.terminal.head.written+' · gap: '+
       p.terminal.relative.headGapRole+' · '+p.terminal.relative.written:
       'Finite leaf: '+p.terminal.written+' · '+p.terminal.subjectPerson),
      el('p','translator-meta','Exact token coverage: '+p.coverage+' · '+p.grade),
      el('p','translator-caution',p.note));
     for(const source of p.sources||[]){
      const link=safeLink(source,'Inspect nested grammar evidence');
      if(link)item.append(link);
     }
     panel.append(item);
    }
    block.append(panel);
   }
   if(clause.complexClauseProposals?.length){
    const panel=el('details','translator-morph-panel');
    panel.className+=' translator-complex-clause-proposals';
    panel.append(el('summary','','Finite verb + locative context · '+
     clause.complexClauseProposals.length+' structural alternative'+
     (clause.complexClauseProposals.length===1?'':'s')+
     ' (NOT a verified translation)'));
    panel.append(el('p','translator-caution',
     'All words are accounted for, but the verb paradigms are grammar-derived. These are unranked syntactic proposals, NOT independently verified translations. Locatives may describe an event or modify a noun.'));
    for(const p of clause.complexClauseProposals.slice(0,20)){
     const item=el('div','translator-analysis');
     item.append(el('strong','',p.verb.written+' ('+p.verb.lemma+') · '+p.verb.tense+
      ' · subject '+p.verb.subject+
      (p.verb.negative?' · negative':'')+
      ' · '+p.location.written),
      el('p','translator-meta','Lexical verb possibilities: '+p.verb.meaning+
       ' · '+p.grade),
      el('p','translator-meta','Noun argument: '+(p.arguments.overtNounPhrase||'none written')+
       ' · '+p.arguments.object.type+
       (p.arguments.object.word?' ('+p.arguments.object.word+')':'')+
       ' · '+(p.arguments.subjectNoun?'subject noun '+p.arguments.subjectNoun:'subject indexed in verb')),
      el('p','translator-meta','Possible relational senses: '+
       p.location.possibleSenses.join(' / ')),
      el('p','translator-caution','Attachment alternatives: '+
       p.location.attachmentAlternatives.join(' OR ')),
      el('p','translator-caution',p.location.antecedentStatus),
      el('p','translator-caution',p.note));
     for(const url of p.sources){
      const link=safeLink(url,'Inspect finite-locative evidence');
      if(link)item.append(link);
     }
     panel.append(item);
    }
    block.append(panel);
   }
   if(clause.possessedAgreement?.items?.length){
    const panel=el('details','translator-morph-panel');
    panel.className+=' translator-possessed-agreement-proposals';
    panel.append(el('summary','','Possessed nouns + agreement · '+
     clause.possessedAgreement.items.length+' possible role'+
     (clause.possessedAgreement.items.length===1?'':'s')+
     ' (NOT a translation)'));
    panel.append(el('p','translator-caution',
     'An attested or source-recorded possessed noun is NOT proof of a contextual subject/object relationship. '+
     'Possessor and verbal subject are separate; they may have different grammatical persons.'));
    if(clause.possessedAgreement.truncated)panel.append(el('p','translator-caution',
     'Only the first 24 structural possibilities are displayed.'));
    for(const item of clause.possessedAgreement.items){
     const node=el('div','translator-analysis');
     node.append(el('strong','',item.verb.written+' · '+item.verb.lemma+
      ' · verb subject '+item.verb.subject+' · '+item.verb.pattern),
      el('p','translator-meta','Possessed noun '+item.possessedNoun.written+
       ' → '+item.possessedNoun.lemma+
       ' · nominal possessor '+item.possessedNoun.possessor+
       ' · '+item.possessedNoun.role),
      el('p','translator-meta','Full dictionary senses: '+
       item.possessedNoun.fullMeaning),
      el('p','translator-meta',item.constructionId+' · '+item.grade+
       ' · '+item.coverage+' original tokens accounted for'),
      el('p','translator-caution',item.note));
     for(const url of item.sourceLinks){
      const link=safeLink(url,'Inspect possession and agreement source');
      if(link)node.append(link);
     }
     panel.append(node);
    }
    block.append(panel);
   }
   if(clause.morphosyntactic?.items?.length){
    const panel=el('details','translator-morph-panel');
    panel.className+=' translator-morphosyntactic-proposals';
    panel.append(el('summary','','Indexed morphology + clause grammar · '+
     clause.morphosyntactic.items.length+' structural hypothesis'+
     (clause.morphosyntactic.items.length===1?'':'es')+
     ' (NOT a translation)'));
    panel.append(el('p','translator-caution',
     'A grammatical proposal for a complete written token sequence is NOT a completed translation. '+
     'The finite form is a grammar-generated matrix cell, not a verified manuscript occurrence; '+
     'tense, subject/object readings and dictionary senses may remain ambiguous.'));
    if(clause.morphosyntactic.truncated)panel.append(el('p','translator-caution',
     'Only the first 32 analyses are shown; additional alternatives were not displayed.'));
    for(const p of clause.morphosyntactic.items){
     const entry=el('div','translator-analysis');
     entry.append(el('strong','',p.verb.written+' → '+p.verb.lemma+
      ' · '+p.verb.pattern+' · '+p.verb.subjectPerson),
      el('p','translator-meta','Construction: '+p.constructionId+
       ' · all '+p.coverage+' written tokens covered · '+p.grade),
      el('p','translator-meta','Possible noun subject: '+
       (p.argumentRoles.subjectNoun||'none stated')+
       ' · possible noun object: '+(p.argumentRoles.objectNoun||'none stated')+
       (p.argumentRoles.implicitObject?
        ' · '+p.argumentRoles.implicitObject:'')),
      el('p','translator-meta','Dictionary verb senses (unresolved): '+
       p.verb.lexicalMeaning));
     for(const n of p.argumentRoles.nominalMeanings)entry.append(
      el('p','translator-meta','Noun '+n.lemma+' · full source meaning: '+n.meaning));
     entry.append(el('p','translator-caution',p.note));
     for(const url of p.sources){
      const link=safeLink(url,'Inspect indexed morphology and grammar source');
      if(link)entry.append(link);
     }
     panel.append(entry);
    }
    block.append(panel);
   }
   if(clause.locativeInterpretations?.length){
    const panel=el('details','translator-morph-panel');
    panel.className+=' translator-locative-interpretations';
    panel.append(el('summary','','Classical locative & relational phrase · '+
     clause.locativeInterpretations.length+' nonfinite hypothesis'+
     (clause.locativeInterpretations.length===1?'':'es')+' (NOT a sentence)'));
    panel.append(el('p','translator-caution',
     'The relational possessor, proposed place noun, and optional final word are separate analytical roles. No sentence translation, automatic historical-spelling repair, or verified co-reference is claimed.'));
    for(const reading of clause.locativeInterpretations.slice(0,5)){
     const item=el('div','translator-analysis');
     item.append(el('strong','',reading.sourceSpelling+' · '+reading.construction),
      el('p','translator-meta',reading.grade),
      el('p','',reading.potentialLocation),
      el('p','translator-meta','Place '+reading.place.lemma+
       (reading.place.article?' · article '+reading.place.article:'')+
       ' · '+reading.place.evidence),
      el('p','translator-meta','Relational '+reading.relation.lemma+
       ' · '+reading.relation.evidence+
       ' · '+reading.relation.possessorStatus),
      el('p','translator-caution',reading.note));
     if(reading.extra){
      item.append(el('p','translator-meta','Trailing '+reading.extra.written+
       ' → '+reading.extra.lemma+' · '+reading.extra.meaning),
       el('p','translator-caution',reading.extra.syntacticRole));
     }
     if(reading.editorialComparison){
      item.append(el('p','translator-meta',
       'Published contextual note for this EXACT historical fragment: '+
       reading.editorialComparison.reading),
       el('p','translator-caution','Published editorial reading consulted; NOT held-out evaluation or a verified token-by-token translation.'));
     }
     for(const url of reading.sources||[]){
      const link=safeLink(url,'Inspect locative evidence');
      if(link)item.append(link);
     }
     panel.append(item);
    }
    block.append(panel);
   }
   if(clause.fragmentInterpretations?.length){
    const panel=el('details','translator-morph-panel');
    panel.className+=' translator-contextual-fragments';
    panel.append(el('summary','','Classical Nahuatl contextual fragments · '+
     clause.fragmentInterpretations.length+' source-aware comparison'+
     (clause.fragmentInterpretations.length===1?'':'s')+' (NOT a sentence)'));
    panel.append(el('p','translator-caution',
     'A comparative phrase is not a finite clause. Exact historical examples and newly composed grammar hypotheses are kept separate; no phrase is scored as a verified model translation.'));
    for(const reading of clause.fragmentInterpretations){
     const item=el('div','translator-analysis');
     item.append(el('strong','',reading.sourceSpelling+' · '+reading.construction),
      el('p','translator-meta',reading.grade),
      el('p','',reading.compositionalReading),
      el('p','translator-meta','Comparative '+reading.cue.lemma+' ('+reading.cue.evidence+
       ') · noun '+reading.noun.lemma+' · '+reading.noun.senseStatus),
      el('p','translator-caution',reading.note));
     if(reading.editorialComparison){
      item.append(el('p','translator-meta',
       'Published contextual reading of this exact historical fragment: '+
       reading.editorialComparison.reading),
       el('p','translator-caution','Editorial and in-sample; NOT independent held-out translation evidence.'));
     }
     for(const url of reading.sources){
      const link=safeLink(url,'Inspect comparative evidence');
      if(link)item.append(link);
     }
     panel.append(item);
    }
    block.append(panel);
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
       ' · '+proposal.nounPhrase.kind+
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
  if(result.multiClauseProposals?.length){
   const panel=el('details','translator-morph-panel');
   panel.className+=' translator-multiclause-proposals';
   panel.append(el('summary','','Classical multi-clause syntax · '+
    result.multiClauseProposals.length+' marked construction'+
    (result.multiClauseProposals.length===1?'':'s')+
    ' (NOT an English translation)'));
   panel.append(el('p','translator-caution',
    'Explicit clause markers are supported by historical dictionaries and grammar; parsing their scope is a hypothesis, NOT proof of English and/but or a valid conditional mood.'));
   for(const analysis of result.multiClauseProposals){
    panel.append(el('strong','',analysis.relation+' · '+analysis.clauseCount+' units'),
     el('p','translator-meta','Markers: '+analysis.markers.join(' / ')+' · '+analysis.grade),
     el('p','translator-caution',analysis.note));
    for(const part of analysis.segments){
     const item=el('div','translator-analysis');
     item.append(el('strong','','Unit '+(part.index+1)+' · '+part.text),
      el('p','translator-meta',part.role),
      el('p','translator-meta',part.finiteAnalysisKind+
       ' · '+part.alternativeCount+' finite alternative'+(part.alternativeCount===1?'':'s')),
      el('p','translator-meta','Indexed person possibilities: '+
       (part.subjectPersons.join(' / ')||'unresolved')),
      el('p','translator-caution',part.unresolved));
     if(part.locationExpressions.length)item.append(el('p','translator-meta',
      'Explicit location phrase(s): '+part.locationExpressions.join(' / ')));
     panel.append(item);
    }
    for(const url of analysis.sources){
     const link=safeLink(url,'Inspect multi-clause grammar evidence');
     if(link)panel.append(link);
    }
   }
   passages.append(panel);
  }
  if(result.antecedentProposals?.length){
   const panel=el('details','translator-morph-panel');
   panel.className+=' translator-antecedent-proposals';
   panel.append(el('summary','','Constrained possible antecedents · '+
    result.antecedentProposals.length+
    ' (NO pronoun identity resolution)'));
   for(const candidate of result.antecedentProposals){
    panel.append(el('p','translator-meta',
     'Clause '+(candidate.fromClause+1)+' → '+(candidate.toClause+1)+
     ' · noun '+candidate.antecedent.written+
     ' · '+candidate.pronounSlot),
     el('p','translator-caution',candidate.status),
     el('p','translator-caution',candidate.alternatives),
     el('p','translator-caution',candidate.note));
    const source=safeLink(candidate.antecedent.source,'Inspect antecedent noun evidence');
    if(source)panel.append(source);
   }
   passages.append(panel);
  }
  if(result.discourseReferenceProposals?.length){
   const panel=el('details','translator-morph-panel');
   panel.className+=' translator-discourse-references';
   panel.append(el('summary','','Discourse mention tracking · '+
    result.discourseReferenceProposals.length+' unresolved subject slot'+
    (result.discourseReferenceProposals.length===1?'':'s')));
   panel.append(el('p','translator-caution',
    'These are observable agreement-compatible lexical mentions within three preceding clause units. Neither closeness nor repeated noun spellings proves reference identity; unmentioned participants remain possible.'));
   for(const proposal of result.discourseReferenceProposals){
    const item=el('div','translator-analysis');
    item.append(el('strong','','Clause '+(proposal.toClause+1)+' · '+proposal.pronounSlot),
     el('p','translator-caution',proposal.status));
    for(const alternative of proposal.candidates){
     item.append(el('p','translator-meta',
      'Possible overt antecedent in clause '+(alternative.fromClause+1)+
      ': '+alternative.antecedent.written+' · '+alternative.grammaticalRole+
      ' · distance '+alternative.distance+' clause(s) · '+alternative.agreement));
     const link=safeLink(alternative.antecedent.source,'Inspect noun evidence');
     if(link)item.append(link);
    }
    item.append(el('p','translator-caution',proposal.alternatives),
     el('p','translator-caution',proposal.note));
    panel.append(item);
   }
   passages.append(panel);
  }
  if(result.contextLinks?.length){
   const panel=el('details','translator-morph-panel');
   panel.className+=' translator-context-links';
   panel.append(el('summary','','Cross-clause context · '+
    result.contextLinks.length+' explicit repetition'+
    (result.contextLinks.length===1?'':'s')+' (NOT anaphora resolution)'));
   for(const link of result.contextLinks){
    panel.append(el('p','translator-meta',
     'Clause '+(link.fromClause+1)+' → '+(link.toClause+1)+
     ' · repeated written location: '+link.locationWritten),
     el('p','translator-caution',link.subjectAgreement),
     el('p','translator-caution',link.note));
   }
   passages.append(panel);
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
    .then(r=>r.ok?r.json():null).catch(()=>null),
   fetch('./data/clause_grammar.json',{cache:'no-cache'})
    .then(r=>r.ok?r.json():null).catch(()=>null)
  ];
  const [dictionary,candidates,codexStats,lukeStats,sourceReview,clauseGrammar]=await Promise.allSettled(requests);
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
  const locative=window.TlahtolliLocative?.create(document,corpus)||null;
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
    explainMorphology,corpus,locative,
    clauseGrammar.status==='fulfilled'?clauseGrammar.value:null);
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
