/* Tlahtōlli · Shared evidence-bounded grammatical representation.
 * Converts existing analyzer proposals to a clause/mention/argument graph.
 * Does not invent parses, infer referent identity, or generate English.
 */
(function(root){
'use strict';
const MAX_NODES=240,MAX_EDGES=480,MAX_ALTERNATIVES=48;
const norm=x=>String(x||'').normalize('NFC').toLowerCase();
const source=x=>typeof x==='string'&&/^https:\/\/[^\s/]+/u.test(x)?x:null;
const items=(x,max=32)=>Array.isArray(x)?x.slice(0,max):[];
function create(dictionary,historicalPassages,paradigms,sentenceModel){
 // A lexical head source must originate from an unambiguous curated entry,
 // never from the preceding in-relative grammar marker.
 const grammarSource='https://api.pageplace.de/preview/DT0400.9780511985027_A23683606/preview-9780511985027_A23683606.pdf';
 const lexicalSource=(lemma,written)=>{
  const found=items(dictionary?.words,2000).filter(x=>x.word===lemma&&
   x.pos==='noun'&&source(x.source)&&
   [x.word,...String(x.original||'').split(/[;,/]/)].some(y=>norm(y.trim())===norm(written)));
  return found.length===1?found[0].source:null;
 };
 function build(input,analysis){
  const raw=typeof input==='string'?input:'';
  const clauses=items(analysis?.clauses,32);
  const nodes=[],edges=[],byId=new Map(),mentions=new Map(),slots=new Map(),edgeKeys=new Set();
  const diagnostics=[],alternatives=[],agreementAudit={checked:0,accepted:0,rejected:[],status:'source-bounded grammatical role checks; NOT reference resolution'};
  let serial=0;
  // Compare indexed person and valency only INSIDE each analysis alternative.
  // A noun possessor never substitutes for a finite subject or object index.
  function roleAllowed(kind,role,person,transitive){
   agreementAudit.checked++;
   const valid=kind==='relative'?
    (role==='relative subject'&&person==='3sg')||
    (role==='relative object'&&transitive===true):
    kind==='matrix'?
     (role==='matrix subject'&&person==='3sg')||role==='matrix object':
    kind==='possessed'?
     (role==='possible grammatical subject'&&person==='3sg')||
     (role==='possible grammatical object'&&transitive===true):
    kind==='embedded'?
     (role==='subject'&&person==='3sg')||
     (role==='object'&&transitive===true):false;
   if(valid){agreementAudit.accepted++;return true;}
   if(agreementAudit.rejected.length<48)
    agreementAudit.rejected.push({kind,role:String(role||'unresolved'),reason:
     'indexed verbal subject/valency incompatible with proposed noun role; no identity inferred'});
   return false;
  }
  const newNode=(kind,props)=>{
   if(nodes.length>=MAX_NODES){if(!diagnostics.includes('node-limit'))diagnostics.push('node-limit');return null;}
   const id=kind+':'+(serial++);
   const v={id,kind,...props};
   nodes.push(v);byId.set(id,v);return id;
  };
  const newEdge=(from,to,relation,meta={})=>{
   if(!from||!to||!byId.has(from)||!byId.has(to))return;
   const key=JSON.stringify([from,to,relation,meta.readingId||'']);
   if(edgeKeys.has(key))return;edgeKeys.add(key);
   if(edges.length>=MAX_EDGES){if(!diagnostics.includes('edge-limit'))diagnostics.push('edge-limit');return;}
   edges.push({from,to,relation,...meta,status:'candidate-only',notIdentity:true});
  };
  const span=(i,written)=>{
   const tokens=items(clauses[i]?.tokens,64);
   const matches=[];
   tokens.forEach((t,j)=>{if(norm(t)===norm(written))matches.push(j);});
   return matches.length===1?matches[0]:null;
  };
  const clauseIds=clauses.map((cl,i)=>newNode('clause',{
   unit:i,written:String(cl?.text||'').trim().slice(0,600),tokens:items(cl?.tokens,64),
   completeAccordingToAnalyzer:cl?.complete===true,
   epistemicStatus:'analyzer output, not independent historical attestation'
  }));
  function mention(i,head,readingId,role){
   if(!head||typeof head.written!=='string'||typeof head.lemma!=='string'||!source(head.source))return null;
   const t=span(i,head.written);
   if(t===null)return null;
   const key=i+':'+t;
   const owner=head.possessor||null;
   let m=mentions.get(key);
   if(m){
    const previous=byId.get(m);
    if(previous.lemma!==head.lemma||previous.source!==head.source||
     (owner&&previous.possessor&&owner!==previous.possessor)){
     diagnostics.push('conflicting-mention-evidence');return null;
    }
    if(owner&&!previous.possessor){
     previous.possessor=owner;
     previous.possessorEvidence=source(head.possessorSource)||null;
    }
   }else{
    m=newNode('nominal-mention',{unit:i,tokenIndex:t,written:head.written,
     lemma:head.lemma,source:head.source,possessor:owner,
     possessorEvidence:source(head.possessorSource)||null,
     evidence:'unique written occurrence with cited lexical provenance',
     referentId:null});
    if(m){mentions.set(key,m);newEdge(clauseIds[i],m,'contains-nominal-mention');}
   }
   if(m&&readingId)newEdge(readingId,m,role,{readingId});
   return m;
  }
  function variant(i,family,n,grade,sources){
   if(alternatives.length>=MAX_ALTERNATIVES){
    if(!diagnostics.includes('alternative-limit'))diagnostics.push('alternative-limit');
    return null;
   }
   const v=newNode('analysis-alternative',{unit:i,family,index:n,
    grade:String(grade||'provisional'),sources:items(sources,16).map(source).filter(Boolean),
    status:'unranked grammar proposal; not verified translation'});
   if(v){alternatives.push(v);newEdge(clauseIds[i],v,'has-unranked-alternative',{readingId:v});}
   return v;
  }
  function predicate(i,written,lemma,person,readingId,layer,sourceUrl,tokenIndex){
   if(!written||!lemma||!person)return null;
   // Explicitly indexed recursive layers can repeat the SAME finite spelling.
   // Never guess which token the layer points to by a global word lookup.
   const t=Number.isInteger(tokenIndex)&&
    norm(clauses[i]?.tokens?.[tokenIndex])===norm(written)?tokenIndex:span(i,written);
   if(t===null)return null;
   const id=newNode('finite-predicate',{unit:i,tokenIndex:t,written,lemma,
    subjectPerson:person,layer,source:source(sourceUrl),
    subjectReferentId:null});
   if(id)newEdge(readingId,id,'contains-finite-predicate',{readingId});
   return id;
  }
  for(let i=0;i<clauses.length;i++){
   const cl=clauses[i]||{};
   // Partial analyses occupy observed token windows, not whole sentence
   // alternatives. No English, identity, or cross-boundary links follow.
   const allowed=new Set(['indexed-finite','source-finite','locative',
    'comparison','finite-location','relative','nominal-dependent',
    'nested-dependent','morphology-clause','possessed-argument','source-agreement',
    'nominal-coordination']);
   for(const p of items(cl.partialSpans,24)){
    if(cl.complete||!Number.isInteger(p?.start)||!Number.isInteger(p?.end)||
      p.start<0||p.end>items(cl.tokens,64).length||
      p.end-p.start<2||p.end-p.start>6||
      !Array.isArray(p.written)||p.written.length!==p.end-p.start||
      !p.written.every((t,k)=>t===cl.tokens[p.start+k])||
      !Array.isArray(p.families)||!p.families.length||
      !p.families.every(x=>allowed.has(x))||
      !Number.isInteger(p.alternatives)||p.alternatives<1||
      !Array.isArray(p.sources)||!p.sources.length||!p.sources.every(source)||
      p.status!=='existing grammar on contiguous token window; NOT a whole-clause reading'||
      p.englishAvailableForWholeInput!==false||p.referentResolved!==false)continue;
    const id=newNode('partial-grammatical-span',{unit:i,
     tokenStart:p.start,tokenEnd:p.end,written:p.written.join(' '),
     families:p.families.slice(0,11),alternativeCount:p.alternatives,
     sources:p.sources.slice(0,24),boundaryAttachmentsResolved:false,
     status:'local structural candidate; NOT whole-sentence analysis'});
    if(id)newEdge(clauseIds[i],id,'contains-partial-grammatical-evidence',{
     originalTokenStart:p.start,originalTokenEnd:p.end,
     boundaryAttachmentsResolved:false,referentResolved:false});
   }

   // Only noun-PHRASE hypotheses. Do not create discourse mentions or
   // subject/object slots from unresolved coordinated heads.
   const coordinatedLayers=[
    ...items(cl.nominalCoordinationProposals,8).map((p,n)=>({p,n,offset:0,attached:null})),
    ...items(cl.coordinatedSubjectProposals,8).map((attached,n)=>({
     p:attached?.nominal,n,offset:attached?.nominalStart,attached
    }))
   ];
   for(const {p,n,offset,attached} of coordinatedLayers){
    if(!Number.isInteger(offset)||offset<0||offset>1)continue;
    const nominalTokens=cl.tokens?.slice(offset,offset+(p?.coverage||0))||[];
    if(cl.complete||!p||p.family!=='nominal-coordination'||
      p.grade!=='source-checked NP coordination hypothesis; NOT a clause translation'||
      p.coverage!==nominalTokens.length||!Array.isArray(p.written)||
      p.written.length!==nominalTokens.length||
      !p.written.every((t,k)=>t===nominalTokens[k])||
      !Array.isArray(p.nouns)||p.nouns.length!==2||
      p.connector?.meaningAlternatives?.join('|')!=='and|together with'||
      p.connector?.selectedMeaning!==null||
      p.connector?.lemma!=='īhuān'||!Number.isInteger(p.connector?.tokenIndex)||
      nominalTokens[p.connector.tokenIndex]!==p.connector.written||
      !Array.isArray(p.sources)||p.sources.length<3||
      !p.sources.every(source))continue;
    const connector=items(dictionary?.words,2000).filter(w=>w.word==='īhuān'&&
      w.pos==='conjunction / postpositional construction'&&source(w.source));
    const mark=items(dictionary?.words,2000).filter(w=>w.word==='in'&&
      w.pos==='grammatical particle / subordinator'&&source(w.source));
    if(connector.length!==1||mark.length!==1||
      !p.sources.includes(connector[0].source))continue;
    const cue=p.connector.written,at=p.connector.tokenIndex,historical=norm(cue)==='ioan';
    if(at<1||at>=nominalTokens.length-1)continue;
    if(historical){
     const witness=p.sourceWindow,url='https://florentinecodex.getty.edu/book/11/folio/217r';
     if(!witness||witness.source!==url||p.connector.source!==url||
       p.connector.spellingEvidence!=='exact editorial manuscript-location window'||
       witness.status!=='exact editorial word sequence, NOT an independently certified grammatical parse')continue;
     const matched=items(historicalPassages?.records,150).some(row=>{
      if(row?.id!==witness.passageId||row.train_eligible!==false||
       row.reading_status!=='edited_transcription_candidate'||
       row.reader?.source!==url||typeof row.original!=='string')return false;
      const written=row.original.split(/\s+/u).map(t=>t.replace(/[;,]+$/u,''));
      return written.some((_,start)=>start+p.written.length<=written.length&&
       p.written.every((token,k)=>norm(token.replace(/,+$/u,''))===norm(written[start+k])));
     });
     if(!matched)continue;
    }else if(p.sourceWindow!==null||
     p.connector.spellingEvidence!=='curated historical dictionary spelling'||
     p.connector.source!==connector[0].source||
     ![connector[0].word,...String(connector[0].original||'').split(/[;,/]/)]
      .some(x=>norm(x.trim())===norm(cue)))continue;
    const sides=[nominalTokens.slice(0,at),nominalTokens.slice(at+1)],members=[];
    for(let k=0;k<2;k++){
     const side=sides[k],h=p.nouns[k];
     if(side.length<1||side.length>2||!h||!Number.isInteger(h.tokenIndex)||
      h.written!==nominalTokens[h.tokenIndex]||
      h.tokenIndex!==(k===0?at-1:nominalTokens.length-1)||
      (side.length===2)!==(h.articleMarker==='in')||
      (side.length===2&&
       (nominalTokens[h.tokenIndex-1]!=='in'||h.articleSource!==mark[0].source)))break;
     const form=side[side.length-1],clean=form.replace(/,+$/u,'');
     if(!clean||(form!==clean&&(!form.endsWith(',')||k!==0)))break;
     const hits=items(dictionary?.words,2000).filter(w=>w.pos==='noun'&&
      w.word===h.headword&&w.source===h.headSource&&source(w.source)&&
      [w.word,...String(w.original||'').split(/[;,/]/)]
       .some(x=>norm(x.trim())===norm(clean)));
     if(hits.length!==1||!p.sources.includes(h.headSource)||
       (h.articleMarker==='in'&&!p.sources.includes(h.articleSource)))break;
     members.push({head:h,entry:hits[0]});
    }
    if(members.length!==2)continue;
    let finite=null;
    if(attached){
     const pred=attached.predicate;
     const person=pred?.subjectPerson==='3sg'?2:pred?.subjectPerson==='3pl'?5:-1;
     const matrix=paradigms?.paradigms?.[pred?.lemma];
     const lex=items(dictionary?.words,2000).filter(w=>w.word===pred?.lemma&&
      w.source===pred?.source&&source(w.source));
     const animacy=members[0].entry.animacy;
     const agreementUrl='https://gdn.iib.unam.mx/diccionario/ihuan/50956';
     const position=offset===1?0:nominalTokens.length;
     if(cl.complete||!Array.isArray(attached.written)||
      attached.written.length!==cl.tokens.length||
      !attached.written.every((t,k)=>t===cl.tokens[k])||
      attached.family!=='coordinated-subject-attachment'||
      attached.coverage!==cl.tokens.length||
      attached.nominalStart!==offset||nominalTokens.length!==cl.tokens.length-1||
      !pred||pred.tokenIndex!==position||pred.written!==cl.tokens[position]||
      pred.tense!=='present'||pred.transitive!==false||
      (person!==2&&person!==5)||pred.source!==matrix?.lemmaSource||
      matrix?.trans!==false||matrix?.cells?.[0]?.[person]!==pred.written||
      lex.length!==1||!['animate','inanimate'].includes(animacy)||
      animacy!==members[1].entry.animacy||
      (animacy==='inanimate'&&person!==2)||
      attached.nominalAnimacy!==animacy||
      attached.possibleRole!=='coordinated nominal subject'||
      attached.subjectAgreement!==pred.subjectPerson||
      attached.numberAgreementSource!==agreementUrl||
      attached.grade!=='source-licensed coordination + indexed intransitive agreement hypothesis; NOT a translation'||
      !Array.isArray(attached.sources)||
      !attached.sources.includes(agreementUrl)||
      !attached.sources.includes(pred.source)||
      !attached.sources.includes(grammarSource)||
      !p.sources.every(u=>attached.sources.includes(u))||
      !attached.sources.every(source))continue;
     finite=pred;
    }
    const v=variant(i,attached?'coordinated-subject-attachment':'nominal-coordination',
     n,attached?attached.grade:p.grade,attached?attached.sources:p.sources);if(!v)continue;
    const link=newNode('nominal-coordination-marker',{
     unit:i,tokenIndex:at+offset,written:cue,lemma:'īhuān',source:p.connector.source,
     possibleMeanings:['and','together with'],meaningSelected:null,scopeResolved:false});
    if(link)newEdge(v,link,'contains-unresolved-coordinator',{readingId:v});
    for(const [k,{head,entry}] of members.entries()){
     const id=newNode('coordinated-noun-head',{
      unit:i,tokenIndex:head.tokenIndex+offset,written:head.written,lemma:entry.word,
      source:entry.source,number:null,grammaticalRole:null,referentId:null});
     if(link&&id)newEdge(link,id,'possible-coordinated-noun-member',{
      readingId:v,member:k,roleResolved:false,numberResolved:false,
      relationSelected:false,referentResolved:false});
    }
    if(finite){
     const pred=predicate(i,finite.written,finite.lemma,finite.subjectPerson,
      v,0,finite.source,finite.tokenIndex);
     if(pred&&link)newEdge(pred,link,'possible-coordinated-subject-attachment',{
      readingId:v,role:'possible coordinated subject',numberAgreement:finite.subjectPerson,
      agreementSource:attached.numberAgreementSource,scopeResolved:false,
      referentResolved:false,semanticReadingSelected:false
     });
    }
   }
   for(const [n,p] of items(cl.nestedInProposals,16).entries()){
    if(!p||p.coverage!==cl.tokens?.length||!Array.isArray(p.layers)||p.layers.length<2)continue;
    if(p.terminal?.kind==='headed-relative'){
     const rel=p.terminal.relative;
     if(!roleAllowed('relative',rel?.headGapRole,rel?.subjectPerson,rel?.transitive)||
      !roleAllowed('matrix',p.terminal.headRole,p.layers[p.layers.length-1]?.subjectPerson,null))continue;
    }
    if(p.terminal?.kind==='finite-with-arguments'){
     const t=p.terminal, pred=t.predicate;
     if(!pred||(!t.subjectArgument&&!t.objectArgument)||
      (t.subjectArgument&&!roleAllowed('embedded','subject',pred.subjectPerson,pred.transitive))||
      (t.objectArgument&&!roleAllowed('embedded','object',pred.subjectPerson,pred.transitive)))
      continue;
    }
    const v=variant(i,'nested-in',n,p.grade,p.sources);if(!v)continue;
    let parent=null;
    for(const [layer,j] of p.layers.entries()){
     const finite=predicate(i,j.written,j.lemma,j.subjectPerson,v,layer,j.source,
      Number.isInteger(j.tokenIndex)?j.tokenIndex:layer*2);
     if(parent&&finite)newEdge(parent,finite,'in-subordinate-dependency',{readingId:v,
      grammaticalScope:'embedded under preceding finite predicate; no subject identity inferred'});
     if(finite)parent=finite;
    }
    if(p.terminal?.kind==='finite-with-arguments'){
     for(const [role,head] of [
      ['subject',p.terminal.subjectArgument],
      ['object',p.terminal.objectArgument]
     ]){
      if(!head)continue;
      const nm=mention(i,head,v,'possible-embedded-'+role+'-argument');
      if(parent&&nm)newEdge(parent,nm,'possible-grammatical-argument',{
       readingId:v,role,embedded:true,sourceRule:p.terminal.ruleId,
       nominalPossessorPerson:head.possessor||null,
       subjectPossessorUnified:false,referentResolved:false
      });
     }
    }
    if(p.terminal?.kind==='headed-relative'){
     const h=p.terminal.head,r=p.terminal.relative;
     const nm=mention(i,{written:h?.written,lemma:h?.lemma,
      source:h?.possessiveEvidence?.source||lexicalSource(h?.lemma,h?.written),
      possessor:h?.possessor||null,
      possessorSource:h?.possessiveEvidence?.source||null},v,'headed-relative-nominal');
     const relative=predicate(i,r?.written,r?.lemma,r?.subjectPerson,v,p.layers.length,
      p.sources?.find(source),cl.tokens.length-1);
     if(parent&&relative)newEdge(parent,relative,'terminal-relative-dependency',{readingId:v});
     if(nm&&relative)newEdge(nm,relative,'possible-relative-gap',{readingId:v,
      gapRole:r?.headGapRole||'unresolved',antecedentResolved:false});
    }
   }
   for(const [n,p] of items(cl.relativeClauseProposals,12).entries()){
    if(!p||p.coverage!==cl.tokens?.length)continue;
    if(!roleAllowed('relative',p.relative?.headGapRole,p.relative?.subjectPerson,p.relative?.transitive)||
     (p.matrix&&!roleAllowed('matrix',p.matrix.headRole,p.matrix.subjectPerson,null)))continue;
    const v=variant(i,'headed-in-relative',n,p.grade,p.sources);if(!v)continue;
    const h=p.head,r=p.relative;
    const nm=mention(i,{written:h?.written,lemma:h?.lemma,
     source:h?.possessiveEvidence?.source||lexicalSource(h?.lemma,h?.written),
     possessor:h?.possessor||null,possessorSource:h?.possessiveEvidence?.source||null},v,
     'possible-relative-head');
    const rel=predicate(i,r?.written,r?.lemma,r?.subjectPerson,v,1,p.sources?.find(source),cl.tokens.length-1);
    if(nm&&rel)newEdge(nm,rel,'possible-relative-gap',{readingId:v,
     gapRole:r?.headGapRole||'unresolved',antecedentResolved:false});
    if(p.matrix){
     const matrix=predicate(i,p.matrix.written,p.matrix.lemma,p.matrix.subjectPerson,v,0,p.sources?.find(source),0);
     if(matrix&&nm)newEdge(matrix,nm,'possible-matrix-argument',{readingId:v,
      role:p.matrix.headRole||'unresolved'});
    }
   }
   for(const [n,p] of items(cl.possessedAgreement?.items,24).entries()){
    if(!p||p.coverage!==cl.tokens?.length)continue;
    if(!roleAllowed('possessed',p.possessedNoun?.role,p.verb?.subject,
     p.verb?.objectAgreement==='indexed fixed 3sg'))continue;
    const v=variant(i,'possessed-noun-argument',n,p.grade,p.sourceLinks);if(!v)continue;
    const h=p.possessedNoun,j=p.verb;
    const nm=mention(i,{written:h?.written,lemma:h?.lemma,
     source:h?.source,possessor:h?.possessor,possessorSource:h?.source},
     v,'source-located-possessed-argument');
    const verb=predicate(i,j?.written,j?.lemma,j?.subject,v,0,p.sourceLinks?.find(source));
    if(nm&&verb)newEdge(verb,nm,'possible-grammatical-argument',{readingId:v,
     role:h?.role||'unresolved',verbSubjectPerson:j.subject,
     nominalPossessorPerson:h?.possessor||null,subjectPossessorUnified:false});
   }
   function citedWindowValid(p){
    if(!p.sourceWindow)return true;
    const witness=p.sourceWindow,rows=historicalPassages?.records;
    if(!Array.isArray(rows)||!p.nounPhrase||!p.relational||
       witness.status!=='contiguous edited witness; grammar and manuscript line unverified'||
       witness.source!==p.verb?.source)return false;
    return rows.some(row=>{
     if(row?.id!==witness.passageId||row.reading_status!=='edited_transcription_candidate'||
        row.train_eligible!==false||row.reader?.source!==witness.source||
        typeof row.original!=='string'||row.original.length>1500)return false;
     const written=row.original.split(/\s+/u).map(t=>
       t.replace(/^[,.;!?]+|[,.;!?]+$/gu,'')).filter(Boolean);
     return written.some((_,start)=>start+p.coverage<=written.length&&
       clauses[i].tokens.every((token,k)=>norm(token)===norm(written[start+k])));
    });
   }
   // Source-recorded finite verbs are candidate-only: no agreement or English
   // may be inferred from source orthography or an unresolved nominal role.
   for(const [n,p] of items(cl.historicalFiniteProposals,8).entries()){
    if(!p||p.coverage!==cl.tokens?.length||!p.verb||
      !source(p.verb.source)||!items(p.sources).includes(p.verb.source)||
      (p.nounPhrase&&!source(p.nounPhrase.source))||
      (p.adverb&&!source(p.adverb.source))||
      (p.relational&&!source(p.relational.source)))continue;
    const j=p.verb;
    const lexical=items(dictionary?.words,2000).filter(w=>w.word===j.lemma&&
      w.pos==='verb (intransitive)'&&source(w.source)&&
      items(w.inflections,100).some(f=>norm(f.form)===norm(j.written)&&
       f.evidence==='text'&&f.category==='Historically transcribed finite form'&&
       f.source===j.source));
    const finiteEntry=lexical.length===1?
      lexical[0].inflections.find(f=>norm(f.form)===norm(j.written)&&
       f.evidence==='text'&&f.category==='Historically transcribed finite form'&&
       f.source===j.source):null;
    const editorial2sg=/\b(?:second[-\s]person singular|2sg)\b/i
      .test(String(finiteEntry?.gloss||'')+' '+String(finiteEntry?.note||''));
    if(!finiteEntry||j.subjectPerson!==(editorial2sg?'2sg':'unresolved')||
      cl.tokens?.[j.tokenIndex]!==j.written||
      (p.nounPhrase&&lexicalSource(p.nounPhrase.lemma,p.nounPhrase.written)!==p.nounPhrase.source)||
      (p.nounPhrase&&editorial2sg)||
      (p.adverb&&items(dictionary?.words,2000).filter(w=>w.word===p.adverb.lemma&&
       String(w.pos).startsWith('adverb')&&w.source===p.adverb.source).length!==1)||
      (p.relational&&items(dictionary?.words,2000).filter(w=>w.word===p.relational.lemma&&
       w.pos==='relational noun / locative'&&w.source===p.relational.source&&
       [w.word,...String(w.original||'').split(/[;,/]/)]
         .some(x=>norm(x.trim())===norm(p.relational.written))).length!==1))continue;
    if(!citedWindowValid(p))continue;
    const v=variant(i,'source-finite-context',n,p.grade,p.sources);if(!v)continue;
    const fin=predicate(i,j.written,j.lemma,j.subjectPerson,v,0,j.source,j.tokenIndex);
    if(fin){
     const node=byId.get(fin);
     node.personStatus=j.personStatus;
     node.tenseStatus=j.tenseStatus;
     node.agreementCertified=false;
    }
    if(p.nounPhrase){
     const h=p.nounPhrase;
     const bareWitness=!!p.sourceWindow;
     const nm=mention(i,{written:h.written,lemma:h.lemma,source:h.source},v,
       bareWitness?'source-cooccurring-unassigned-noun':'possible-conditional-nominal-argument');
     if(fin&&nm)newEdge(fin,nm,
       bareWitness?'possible-unassigned-nominal':'possible-conditional-argument',{
       readingId:v,roleStatus:h.roleStatus,requiresUnverified3sg:!bareWitness,
       nominalRoleResolved:false,agreementCertified:false,referentResolved:false,
       sourceWindow:bareWitness?p.sourceWindow.passageId:null
     });
    }
    if(p.relational){
     const h=p.relational,t=span(i,h.written);
     if(t!==null){
      const loc=newNode('possible-relational-adjunct',{
       unit:i,tokenIndex:t,written:h.written,lemma:h.lemma,source:h.source,
       possessorReferent:null,attachment:'unresolved'});
      if(loc&&fin){
       newEdge(v,loc,'contains-unresolved-relational',{readingId:v});
       newEdge(fin,loc,'possible-relational-attachment',{
        readingId:v,attachmentResolved:false,possessorResolved:false});
      }
     }
    }
    if(p.adverb){
     const h=p.adverb,t=span(i,h.written);
     if(t!==null){
      const adv=newNode('possible-adverbial-modifier',{
       unit:i,tokenIndex:t,written:h.written,lemma:h.lemma,
       source:h.source,scope:'unresolved'});
      if(adv&&fin){
       newEdge(v,adv,'contains-possible-adverb',{readingId:v});
       newEdge(fin,adv,'possible-adverbial-scope',{
        readingId:v,scopeResolved:false,referentResolved:false});
      }
     }
    }
   }
   for(const [n,p] of items(cl.nominalInProposals,8).entries()){
    if(!p||p.coverage!==cl.tokens?.length)continue;
    const v=variant(i,'finite-in-complement',n,p.grade,p.sources);if(!v)continue;
    const a=predicate(i,p.matrix?.written,p.matrix?.lemma,p.matrix?.subjectPerson,v,0,p.sources?.find(source),0);
    const b=predicate(i,p.dependent?.written,p.dependent?.lemma,p.dependent?.subjectPerson,v,1,p.sources?.find(source),2);
    if(a&&b)newEdge(a,b,'in-subordinate-dependency',{readingId:v,
     grammaticalScope:'possible complement or adjunct, not semantically selected'});
   }
   // Only fully covered, unambiguous overt subject mentions may enter the
   // discourse inventory. A relative head is never silently a matrix subject.
   const c=items(cl.candidates,32).filter(x=>x?.grade==='grammar-derived candidate'&&
    x.coverage===cl.tokens?.length&&x.frame);
   const frames=new Set(c.map(x=>JSON.stringify([x.frame.subjectPerson,x.frame.subjectNoun,
    x.frame.objectNoun,x.frame.predicate,x.frame.tense,x.frame.negative])));
   if(frames.size===1&&!cl.roleAmbiguous&&!items(cl.relativeClauseProposals).length&&
    !items(cl.nestedInProposals).length&&!items(cl.nominalInProposals).length){
    const f=c[0].frame,lex=items(c[0].nounSenses).find(s=>s.lemma===f.subjectNoun);
    if(f.subjectPerson===2&&f.subjectNoun&&!f.objectNoun&&lex?.source){
     mention(i,{written:f.subjectNoun,lemma:f.subjectNoun,source:lex.source},null,null);
    }
   }
  }
  function targetSlot(i){
   if(!Number.isInteger(i)||i<0||i>=clauses.length)return null;
   if(slots.has(i))return slots.get(i);
   const cl=clauses[i],frames=items(cl?.candidates).filter(x=>x?.grade==='grammar-derived candidate'&&
    x.coverage===cl.tokens?.length&&x.frame);
   const signatures=new Set(frames.map(x=>JSON.stringify([
    x.frame.subjectPerson,x.frame.subjectNoun,x.frame.objectNoun,x.frame.predicate,x.frame.tense])));
   if(signatures.size!==1||cl.roleAmbiguous||items(cl.relativeClauseProposals).length||
    items(cl.nestedInProposals).length||items(cl.nominalInProposals).length||
    items(cl.complexClauseProposals).length)return null;
   const f=frames[0].frame;
   if(f.subjectPerson!==2||f.subjectNoun||f.objectNoun||f.object)return null;
   const id=newNode('implicit-subject-slot',{unit:i,person:'3sg',
    entity:null,referenceStatus:'unresolved; even repeated mentions do not establish identity'});
   if(id){slots.set(i,id);newEdge(clauseIds[i],id,'contains-unexpressed-subject');}
   return id;
  }
  // Only a uniquely licensed overt 3sg SUBJECT can seed a discourse link.
  // Relative heads, possessed arguments and noun objects are not promoted.
  function overtSubject(i){
   const cl=clauses[i];if(!cl||cl.roleAmbiguous||
    items(cl.relativeClauseProposals).length||items(cl.nestedInProposals).length||
    items(cl.nominalInProposals).length||items(cl.complexClauseProposals).length)return null;
   const readings=items(cl.candidates).filter(c=>
    c?.grade==='grammar-derived candidate'&&c.coverage===cl.tokens?.length&&c.frame);
   const keys=new Set(readings.map(c=>JSON.stringify([c.frame.subjectPerson,
    c.frame.subjectNoun,c.frame.objectNoun,c.frame.object,c.frame.predicate,
    c.frame.tense,c.frame.negative])));
   if(keys.size!==1)return null;
   const frame=readings[0].frame;
   if(frame.subjectPerson!==2||!frame.subjectNoun||frame.objectNoun||frame.object)return null;
   const nounSource=items(readings[0].nounSenses).filter(x=>
    x?.lemma===frame.subjectNoun&&source(x.source));
   if(nounSource.length!==1)return null;
   const original=lexicalSource(frame.subjectNoun,frame.subjectNoun);
   return original===nounSource[0].source?{written:frame.subjectNoun,source:original}:null;
  }
  // No antecedent can jump over unparsed or role-ambiguous discourse units.
  function traversable(from,to){
   for(let i=from+1;i<to;i++){
    const cl=clauses[i];if(!cl||cl.roleAmbiguous||
     items(cl.relativeClauseProposals).length||items(cl.nestedInProposals).length||
     items(cl.nominalInProposals).length||items(cl.complexClauseProposals).length)return false;
    const c=items(cl.candidates).filter(x=>x?.grade==='grammar-derived candidate'&&
     x.coverage===cl.tokens?.length&&x.frame);
    if(!c.length||new Set(c.map(x=>JSON.stringify([x.frame.subjectPerson,
     x.frame.subjectNoun,x.frame.objectNoun,x.frame.predicate,x.frame.tense,
     x.frame.negative]))).size!==1)return false;
   }
   return true;
  }
  const possibleLink=(from,to,a,label,distance)=>{
   if(!Number.isInteger(from)||!Number.isInteger(to)||from<0||to>=clauses.length||
    from>=to||to-from>3||!a||!source(a.source)||a.written!==a.written?.trim())return;
   const verified=overtSubject(from);
   if(!verified||verified.written!==a.written||verified.source!==a.source||
    !traversable(from,to)){
    if(agreementAudit.rejected.length<48)agreementAudit.rejected.push({kind:'discourse',
     role:'implicit 3sg subject',reason:'prior mention is not a unique overt 3sg subject, or intervening scope is unsupported'});
    return;
   }
   const slot=targetSlot(to);if(!slot)return;
   const m=mentions.get(from+':'+span(from,a.written));
   const head=m&&byId.get(m);
   if(!head||head.lemma!==a.written||head.source!==a.source||
    head.possessor||!head.written)return;
   newEdge(m,slot,'antecedent-candidate',{distance:distance||to-from,
    evidence:label,coReferenceResolved:false,
    unmentionedReferentsPossible:true});
  };
  for(const p of items(analysis?.discourseReferenceProposals,24)){
   if(p?.confidence!=='candidate-only'||!Number.isInteger(p.toClause))continue;
   for(const a of items(p.candidates,8))
    if(a?.agreement==='3sg ↔ 3sg'&&a.distance===p.toClause-a.fromClause)
     possibleLink(a.fromClause,p.toClause,a.antecedent,'bounded-overt-mention-inventory',a.distance);
  }
  for(const p of items(analysis?.antecedentProposals,24)){
   if(p?.confidence!=='candidate-only'||p.personConstraint!=='3sg ↔ 3sg')continue;
   if(p.toClause!==p.fromClause+1)continue;
   possibleLink(p.fromClause,p.toClause,p.antecedent,'adjacent-agreement-compatible-mention',1);
  }
  const connectionGroups=analysis?.sentenceGroups||[{analysis}];
  let clauseOffset=0;
  for(const group of connectionGroups){
   const local=group.analysis,localCount=local?.clauses?.length||0;
   for(const p of items(local?.multiClauseProposals,4)){
    if(p?.clauseCount!==localCount||!Array.isArray(p.segments)||
     p.segments.length!==localCount||clauseOffset+localCount>clauses.length)continue;
    for(let i=1;i<localCount;i++)
     newEdge(clauseIds[clauseOffset+i-1],clauseIds[clauseOffset+i],'explicit-clause-connection',{
      connection:p.relation,marker:p.markers?.[i-1]||null,referenceResolved:false});
   }
   clauseOffset+=localCount;
  }
  return {schema:'tlahtolli-grammar-ir-v1',status:'candidate-only; not a translation',
   input:raw.slice(0,7000),nodes,edges,alternatives:alternatives.slice(),
   clauseIds:clauseIds.filter(Boolean),diagnostics:[...new Set(diagnostics)],
   agreementAudit:{...agreementAudit,rejected:agreementAudit.rejected.slice(),
    unresolved:'compatible agreement never establishes discourse co-reference, nominal owner identity, or a complete translation'},
   unresolved:{pronounIdentity:true,possessorIdentity:true,semanticScope:true,
    sourceAttestationOfComposedSentence:true},
   counts:{clauses:clauseIds.length,readings:alternatives.length,
    nominalMentions:nodes.filter(n=>n.kind==='nominal-mention').length,
    nestedDependencies:edges.filter(e=>e.relation==='in-subordinate-dependency').length,
    antecedentCandidates:edges.filter(e=>e.relation==='antecedent-candidate').length,
    partialSpans:nodes.filter(n=>n.kind==='partial-grammatical-span').length,
    nominalCoordinations:nodes.filter(n=>n.kind==='nominal-coordination-marker').length,
    coordinatedSubjectAttachments:edges.filter(e=>e.relation==='possible-coordinated-subject-attachment').length}};
 }
 // Inspect output from the EXISTING English composer; do not realize text or
 // derive new grammar here. Every relative wording must map to a reading
 // alternative already admitted by THIS source-gated graph and its role audit.
 // Finite/location text remains delegated to the existing source-aware composer
 // and is labeled accordingly, never claimed to be IR-confirmed translation.
 function auditEnglish(composition,analysis,graph){
  const fail=reason=>({available:false,verified:false,reason,units:[],joins:[],
   audit:{scope:'structural provenance only; not historical translation verification',
    approved:0,rejected:0,graphMatchedRelatives:0}});
  if(!composition?.available)return composition;
  const units=composition.units,clauses=analysis?.clauses;
  if(graph?.schema!=='tlahtolli-grammar-ir-v1'||
   !Array.isArray(units)||!Array.isArray(clauses)||units.length!==clauses.length||
   !Array.isArray(graph.clauseIds)||graph.clauseIds.length!==clauses.length||
   !Array.isArray(graph.alternatives)||!Array.isArray(graph.edges)||
   !Array.isArray(composition.joins)||composition.joins.length!==units.length-1)
   return fail('Shared grammatical evidence is unavailable or disagrees with the passage.');
  const isSourceList=list=>Array.isArray(list)&&list.length>0&&
   list.every(u=>source(u)!==null);
  const hasSources=(option,needed)=>isSourceList(option?.sources)&&
   isSourceList(needed)&&needed.every(u=>option.sources.includes(u));
  const frameSame=(a,b)=>!!a&&!!b&&
   ['subjectPerson','subjectNoun','objectNoun','predicate','tense','negative']
    .every(k=>a[k]===b[k])&&JSON.stringify(a.morphologyEvidence)===JSON.stringify(b.morphologyEvidence);
  const PERSONS=['1sg','2sg','3sg','1pl','2pl','3pl'];
  const counters={approved:0,rejected:0,graphMatchedRelatives:0,
   existingFinite:0,existingLocation:0};
  const approved=units.map((unit,i)=>{
   const cl=clauses[i],options=[];
   if(unit.index!==i||unit.written!==String(cl?.text||'').trim()||
    !Array.isArray(unit.options)||unit.options.length>128)return {...unit,options};
   for(const option of unit.options){
    const st=option?.structure;
    if(!st||typeof option.text!=='string'||!option.text.trim()||
     !isSourceList(option.sources)){counters.rejected++;continue;}
    let status=null;
    // Reconsult the same canonical morphology provider for each productive
    // predicate; English options cannot strip or alter their evidence tier.
    const frames=[st.frame,st.relativeFrame,st.matrixFrame].filter(Boolean);
    if(frames.some(f=>{
     const expanded=!!f.morphologyEvidence||paradigms&&!paradigms.paradigms?.[f.predicate];
     if(!expanded)return false;
     try{return !sentenceModel?.validateProductiveFrame(f);}catch{return true;}
    })){counters.rejected++;continue;}
    if(st.kind==='finite'){
     const accepted=(cl.candidates||[]).some(c=>
      c?.grade==='grammar-derived candidate'&&
      c.coverage===cl.tokens?.length&&frameSame(c.frame,st.frame)&&
      Array.isArray(c.english)&&c.english.includes(option.text)&&
      hasSources(option,c.sources));
     if(accepted){status=st.frame.morphologyEvidence?'source-gated-productive-finite':'existing-indexed-finite-source';counters.existingFinite++;}
    }else if(st.kind==='headed-relative'){
     for(const [n,r] of (cl.relativeClauseProposals||[]).entries()){
      if(r.coverage!==cl.tokens?.length||!r.matrix||
       st.head!==r.head?.lemma||
       st.relativeGap!==r.relative?.headGapRole||
       st.matrixRole!==r.matrix?.headRole||
       !st.relativeFrame||!st.matrixFrame||
       st.relativeFrame.predicate!==r.relative.lemma||
       st.relativeFrame.tense!==r.relative.tense||
       PERSONS[st.relativeFrame.subjectPerson]!==r.relative.subjectPerson||
       st.matrixFrame.predicate!==r.matrix.lemma||
       st.matrixFrame.tense!==r.matrix.tense||
       PERSONS[st.matrixFrame.subjectPerson]!==r.matrix.subjectPerson||
       !hasSources(option,r.sources))continue;
      // alternatives contains graph node IDs, not a second copy of nodes.
      const altId=graph.alternatives.find(id=>graph.nodes?.some(a=>
       a.id===id&&a.unit===i&&a.family==='headed-in-relative'&&a.index===n));
      const alt=altId&&graph.nodes.find(a=>a.id===altId);
      if(!alt||!hasSources({sources:alt.sources},r.sources))continue;
      const edges=graph.edges.filter(e=>e.readingId===alt.id&&
       e.status==='candidate-only'&&e.notIdentity===true);
      if(!edges.some(e=>e.relation==='possible-relative-gap'&&
       e.gapRole===st.relativeGap)||
       !edges.some(e=>e.relation==='possible-matrix-argument'&&
       e.role===st.matrixRole))continue;
      status='graph-consistent-relative-roles';
      counters.graphMatchedRelatives++;
      break;
     }
    }else if(st.kind==='relational-location'){
     // The shared IR does NOT parse relational locations. Retain only an
     // already licensed full-coverage location proposal and clearly label
     // that its attachments are outside the current IR agreement audit.
     const accepted=(cl.complexClauseProposals||[]).some(p=>
      p?.grade==='grammar-composed verb + relational location (unattested; NOT a verified translation)'&&
      p.coverage+(p.verb?.negative?1:0)===cl.tokens?.length&&
      p.verb?.lemma===st.frame?.predicate&&
      p.verb?.tense===st.frame?.tense&&
      p.location?.place?.lemma===st.place&&
      p.location?.relation?.lemma===st.relation&&
      (p.location.possibleSenses||[]).includes(st.selectedRelation)&&
      ((st.attachment==='event'&&
       p.location.attachmentAlternatives?.includes('possible clause/event location'))||
       (['subject','object'].includes(st.attachment)&&
       p.location.attachmentAlternatives?.includes('possible modification of the overt noun phrase')))&&
      hasSources(option,p.sources));
     if(accepted){status='existing-location-scope-not-ir-audited';counters.existingLocation++;}
    }
    if(!status){counters.rejected++;continue;}
    counters.approved++;
    options.push({...option,grammarAudit:{
     status,sourceBounded:true,verifiedTranslation:false,
     note:status==='source-gated-productive-finite'?
      'Canonical morphology and lexical evidence were rechecked; the word keeps its original grade and the sentence remains an unverified draft.':
      status==='graph-consistent-relative-roles'?
      'The relative and matrix roles occur in one admitted grammar-IR alternative; this does not prove the English wording or referent identity.':
      status==='existing-location-scope-not-ir-audited'?
       'Location attachment was licensed by the separate location analyzer; the grammar IR has NOT checked that attachment.':
       'Finite wording was sourced from an existing full-coverage indexed reading, not a grammatical IR role verdict.'}});
   }
   return {...unit,options};
  });
  if(approved.some(u=>!u.options.length))return fail(
   'The grammar graph rejected one or more English clause readings; inspect the structural candidates instead.');
  return {...composition,units:approved,verified:false,
   audit:{...counters,scope:'structural provenance, never historical truth or entity identity',
    optionsRetained:approved.every(u=>u.options.length>0)},
   note:composition.note+' Grammar-graph audit: '+counters.graphMatchedRelatives+
    ' relative role reading(s) matched a single source-bounded alternative; '+
    counters.existingFinite+' finite and '+counters.existingLocation+
    ' location reading(s) keep their existing analyzers. Rejected '+counters.rejected+
    ' unsupported option(s). This is not a verified translation.'};
 }
 return {build,auditEnglish};
}
root.TlahtolliGrammarIR={create};
})(typeof window==='undefined'?globalThis:window);
