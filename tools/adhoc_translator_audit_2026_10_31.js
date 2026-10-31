#!/usr/bin/env node
'use strict';
// Adversarial development audit. All fresh grammatical examples are CONSTRUCTED,
// not manuscript attestations or independent historical accuracy evaluation.
// No dictionary, grammar, model, training or browser assets are modified.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ROOT=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const json=p=>JSON.parse(read(p));
const d=json('dictionary.json'),p=json('paradigms.json');
const ctx={window:{},URL,words:d.words,FULL_VERB_PARADIGMS:p.paradigms,
 VERB_TENSES:p.patterns,
 norm:s=>String(s||'').normalize('NFC').toLowerCase(),
 stripToken:s=>String(s||'').replace(/^[^\p{L}\p{M}]+|[^\p{L}\p{M}]+$/gu,''),
 historicalSpellings:w=>String(w.original||'').split(/[;,/]+/).map(x=>x.trim()).filter(Boolean),
 safe:String,validUrl:()=>true,safeLink:()=>''};
vm.createContext(ctx);
vm.runInContext(read('tools/morphology_engine.js').split(
 'renderMorphologyBreakdown=TlahtolliMorphEngine.html;')[0]+
 '\nthis.adMorph=TlahtolliMorphEngine;',ctx,{timeout:30000});
for(const file of ['translator-engine.js','translator-locative.js','translator-source-morphology.js',
 'translator-sentence.js','translator-english.js','translator-grammar-ir.js'])
 vm.runInContext(read(file),ctx,{filename:file,timeout:30000});
const api=ctx.window,corpus=json('research/translation_corpus/research_examples.json');
const source=api.TlahtolliSourceMorphology.create(json('research/translation_corpus/source_reviews/ENL_BC16_1573.json'));
const morph=token=>[...ctx.adMorph.analyze(token),...source.analyze(token)];
const lexical=api.TlahtolliTranslator.create(d,corpus);
const sentence=api.TlahtolliSentence.create(d,p,morph,corpus,
 api.TlahtolliLocative.create(d,corpus),json('data/clause_grammar.json'),
 json('data/possessed_form_evidence.json'),json('data/source_finite_context.json'),
 json('data/passages.json'),json('data/predicate_english.json'),
 json('research/translation_corpus/huiya_context_specific_song_vocable_2026_10_30.json'));
const english=api.TlahtolliEnglish.create(sentence);
const ir=api.TlahtolliGrammarIR.create(d,json('data/passages.json'),p,sentence);
const groups={
 baseline:[
  'nichōca','nitlacua','nicochi','niquitta in cihuātl','ahmo niquittaz in cihuātl',
  'niquitta in cihuātl in chōca','nichōca auh nitlacua',
  'nitetlazohtla','ōnicoch','antepilhuan','noyollo','yehuan','tepilhuan'],
 novel_constructed:[
  'ahmo niquitta in conetl','niquitta in conetl auh nichōca',
  'niquittaz in xōchitl','cochiz in tlācatl',
  'in tlācatl cochiz','cochiz in conetl in chōca',
  'niquitta in conetl in cochiz','nicochi auh niquitta in tlācatl',
  'ahmo nicochi auh nitlacua','niquitta in tlācatl auh ahmo nicochi',
  'niquitta in āmatl','in cihuātl quitta in conetl',
  'in conetl quitta in cihuātl','quitta in cihuātl in tlācatl',
  'noyollo niquitta in cihuātl','nicnequi in cihuātl',
  'titepilhuan','ātl itic','in xōchitl in āmatl'],
 historical_editions:[
  'In can on nemian noyollo yehua?',
  'Macazo tleon xoconyoyocoya ti noyollo, yehua cuix ic nepohualoyan in oncan nemohua yehua',
  'quen conchihuaz noyollo yehua onentacico',
  'Ma yan moyoliuh quimati in antepilhuan in anquauhtin amo celo ca',
  'Nican momalinaco in colcahuahtecpillotl huiya nican milacatzoa in Colhuaca Chichimecayotl',
  'O anca yuhqui in chalchihuitl Ohuaya zan ca yuhqui in cozcatl in quetzalli',
  'ticnamaca y¯ totlal',
  'in mochioa tezcatl, in mocuepa ca tetl',
  'Yacuic iyec tenonotzaltzin'],
 novel_unknown:[
  'xyzzy','niquittax','yehuazol','noyollocom','nantepilhuan',
  'niquittax in cihuātl','ahmo niquittaz in xyzzy',
  'niquitta in cihuātl xyzzy','xyzzy nichōca',
  'nichōca xyzzy','niquitta in xōchitlx',
  'nixochitequi','ninotlazotla','tlahtolliztliqui',
  'niquitta in cihuātl. xyzzy. nitlacua',
  'niquitta in cihuātl auh xyzzy'],
 orthography:[
  'nichoca','NICHOCA','nichōca','ni-chōca','nīchōca',
  'noyollo','noyōllo','noyöllo',
  'yehua','yehuan','yehuān','yēhuan','yeuan',
  'tepilhuan','tepilhuān','tepilhuantzin',
  'teōtl','teotl','xochitl','xōchitl',
  'atl','ātl','huiya','huīya','ohuiya'],
 punctuation_questions:[
  'nichōca.','Nichōca','nichōca!','nichōca?','¿nichōca?',
  'nichōca,','nichōca;','nichōca\nnitlacua',
  'Nichōca. Nitlacua.','niquitta in cihuātl?',
  'cuix nichōca?','cuix nichōca',
  'nichōca, auh nitlacua','ahmo nichōca. nitlacua.',
  'niquitta in cihuātl in chōca?'],
 scope_syntax:[
  'ahmo ahmo nichōca','ahmo nichōca auh nitlacua',
  'nichōca auh ahmo nitlacua',
  'zan ahmo nichōca',
  'niquitta in cihuātl in conetl',
  'niquitta in cihuātl in nichōca',
  'nicochi in calli itic',
  'niquitta in cihuātl in cochiz auh nicochi in calli itic',
  'intla nichōca nitlacua','nichōca ihuan nitlacua',
  'ahmo niquittaz in cihuātl in chōca',
  'niquitta in cihuātl in chōca',
  'chōca in cihuātl. chōca',
  'niquitta in cihuātl. chōca in conetl. nitlacua',
  'noyollo yehua','in antepilhuan in anquauhtin'],
 english_to_nahuatl:[
  'I cry','I will see the woman','I see a child','the woman sleeps',
  'my heart','we are children','I love somebody','water',
  'I do not cry','children','the man that I see','yesterday I went home']
};
const all=Object.entries(groups).flatMap(([category,inputs])=>
 inputs.map((input,i)=>({category,id:category+'-'+String(i+1).padStart(2,'0'),input,
  direction:category==='english_to_nahuatl'?'en-nh':'nh-en'})));
let successes=0,errors=0,withEnglish=0,withHeadwordCoverage=0;
console.log('AUDIT_META '+JSON.stringify({headwords:d.words.length,
 cases:all.length,categories:Object.fromEntries(Object.entries(groups).map(([k,v])=>[k,v.length])),
 runtime:'published dictionary + canonical advanced morphology + source morphology + sentence/IR/English; browser archive not loaded',
 safety:'Development diagnostics only, no independent semantic score, no test corpus promoted'}));
for(const row of all){
 const start=Date.now();
 try{
  const l=lexical.analyze(row.input,row.direction);
  const lexWords=l.parts.filter(x=>x.kind==='word');
  const unknown=lexWords.filter(x=>x.status==='unknown').map(x=>x.value);
  let parsed=null,raw=null,composed=null,graph=null,render=null;
  if(row.direction==='nh-en'){
   parsed=sentence.analyze(row.input);
   raw=english.compose(row.input,parsed);
   graph=ir.build(row.input,parsed);
   composed=ir.auditEnglish(raw,parsed,graph);
   render=composed.available?english.render(composed):null;
  }
  if(render)withEnglish++;
  if(lexWords.length&&!unknown.length)withHeadwordCoverage++;
  const hitMorph=row.direction==='nh-en'&&row.input.match(/^[\p{L}\p{M}]+$/u)?
   morph(row.input).slice(0,7).map(x=>({lemma:x.lemma,kind:x.kind,grade:x.grade,
    person:x.features?.subject||x.features?.possessor||null})):null;
  const cands=(parsed?.clauses||[]).flatMap(c=>c.candidates||[]);
  const optionCounts=composed?.units?.map(u=>u.options?.length||0)||[];
  const output={id:row.id,category:row.category,input:row.input,direction:row.direction,
   lexical:{matched:l.stats?.matched??null,unknown:unknown.slice(0,16),
    approximates:l.stats?.approximate??null,ambiguous:l.stats?.ambiguous??null,
    gloss:l.gloss?.slice(0,225),total:lexWords.length},
   grammar:{complete:parsed?.complete??null,clauseCount:parsed?.clauses?.length??0,
    candidateCount:cands.length,alternativeCount:graph?.alternatives?.length??0,
    graphNodes:graph?.nodes?.length??0,
    poeticVocableObservations:parsed?.poeticVocableObservations?.length||0,
    reason:(parsed?.clauses||[]).map(c=>c.reason).filter(Boolean).slice(0,3),
    firstFrame:cands[0]?.frame?{
      lemma:cands[0].frame.predicate,
      person:cands[0].frame.subjectPerson,
      tense:cands[0].frame.tense,negative:cands[0].frame.negative,
      object:cands[0].frame.object||null,subjectNoun:cands[0].frame.subjectNoun||null,
      objectNoun:cands[0].frame.objectNoun||null}:null},
   english:{rawAvailable:raw?.available??null,auditedAvailable:composed?.available??null,
    rendered:render,optionCounts,
    alternatives:composed?.available?
     composed.units.flatMap(u=>u.options.slice(0,3).map(o=>o.text)).slice(0,7):[],
    reason:!composed?.available?String(composed?.reason||raw?.reason||'').slice(0,210):null},
   morphology:hitMorph,elapsedMs:Date.now()-start};
  successes++;
  console.log('AUDIT_CASE '+JSON.stringify(output));
 }catch(err){
  errors++;
  console.log('AUDIT_CASE '+JSON.stringify({id:row.id,category:row.category,
   input:row.input,error:String(err.stack||err).slice(0,900)}));
 }
}
console.log('AUDIT_END '+JSON.stringify({cases:all.length,completed:successes,errors,
 withEnglish,headwordOnlyCoverage:withHeadwordCoverage,
 noSemanticAccuracyClaim:true}));
