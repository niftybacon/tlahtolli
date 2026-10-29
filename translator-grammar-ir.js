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
function create(dictionary){
 // A lexical head source must originate from an unambiguous curated entry,
 // never from the preceding in-relative grammar marker.
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
     (role==='possible grammatical object'&&transitive===true):false;
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
   for(const [n,p] of items(cl.nestedInProposals,16).entries()){
    if(!p||p.coverage!==cl.tokens?.length||!Array.isArray(p.layers)||p.layers.length<2)continue;
    if(p.terminal?.kind==='headed-relative'){
     const rel=p.terminal.relative;
     if(!roleAllowed('relative',rel?.headGapRole,rel?.subjectPerson,rel?.transitive)||
      !roleAllowed('matrix',p.terminal.headRole,p.layers[p.layers.length-1]?.subjectPerson,null))continue;
    }
    const v=variant(i,'nested-in',n,p.grade,p.sources);if(!v)continue;
    let parent=null;
    for(const [layer,j] of p.layers.entries()){
     const finite=predicate(i,j.written,j.lemma,j.subjectPerson,v,layer,j.source,layer*2);
     if(parent&&finite)newEdge(parent,finite,'in-subordinate-dependency',{readingId:v,
      grammaticalScope:'embedded under preceding finite predicate; no subject identity inferred'});
     if(finite)parent=finite;
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
  for(const p of items(analysis?.multiClauseProposals,4)){
   if(p?.clauseCount!==clauses.length||!Array.isArray(p.segments)||
    p.segments.length!==clauses.length)continue;
   for(let i=1;i<clauses.length;i++)
    newEdge(clauseIds[i-1],clauseIds[i],'explicit-clause-connection',{
     connection:p.relation,marker:p.markers?.[i-1]||null,referenceResolved:false});
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
    antecedentCandidates:edges.filter(e=>e.relation==='antecedent-candidate').length}};
 }
 return {build};
}
root.TlahtolliGrammarIR={create};
})(typeof window==='undefined'?globalThis:window);
