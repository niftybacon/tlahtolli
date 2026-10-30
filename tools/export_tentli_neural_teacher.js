#!/usr/bin/env node
'use strict';
// Export *existing* Tēntli teacher signals; no new parser or verified gold.
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const ROOT=path.join(__dirname,'..');
const read=f=>fs.readFileSync(path.join(ROOT,f),'utf8');
const load=f=>JSON.parse(read(f));
const D=load('dictionary.json'),P=load('paradigms.json'),R=load('release.json');
if(D.version!==P.version||D.version!==R.version)throw Error('Mismatched canonical release');
const ctx={window:{},URL};vm.createContext(ctx);
for(const f of ['translator-locative.js','translator-sentence.js','translator-english.js','translator-grammar-ir.js'])
 vm.runInContext(read(f),ctx,{filename:f});
const L=ctx.window.TlahtolliLocative.create(D,{entries:[]});
const S=ctx.window.TlahtolliSentence.create(D,P,null,null,L);
const E=ctx.window.TlahtolliEnglish.create(S);
const I=ctx.window.TlahtolliGrammarIR.create(D);
const outputs=[],paradigms=new Map(),counts={cells:0,lemmas:0,forms:0,english:0,ambiguousEnglish:0};
const url=s=>typeof s==='string'&&s.startsWith('https://');
function add(task,input,target,grade,sources,weight){
 if(!input||!target||!sources.length||sources.some(s=>!url(s)))throw Error('Invalid cited teacher example');
 if(Buffer.byteLength(input)>240||Buffer.byteLength(target)>240)return;
 outputs.push({task,input,target,grade,source_urls:[...new Set(sources)],weight,
  provenance:'synthetic teacher signal from existing Tēntli; not a historical passage',split:'train'});
}
for(const [lemma,p] of Object.entries(P.paradigms)){
 if(!url(p.lemmaSource))throw Error('Missing lemma source '+lemma);
 for(let row=0;row<p.cells.length;row++)for(let person=0;person<P.persons.length;person++){
  const written=p.cells[row][person];
  if(!written)throw Error('Missing indexed cell');
  const prior=paradigms.get(written)||{parts:new Set(),sources:new Set()};
  prior.parts.add(lemma+':'+P.patterns[row]+':'+P.persons[person]);
  prior.sources.add(p.lemmaSource);paradigms.set(written,prior);counts.cells++;
 }
}
if(counts.cells!==720)throw Error('Expected canonical 720 cells');
for(const [word,parts] of paradigms)
 add('analyze',word,[...parts.parts].sort().join('|'),'grammar-paradigm',
     [...parts.sources],0.65);
for(const w of D.words){
 if(w.status!=='Checked against source'||!url(w.source))continue;
 if(!['headword','pos'].every(field=>w.claims?.some(c=>c.field===field&&
  ['dictionary','grammar','text'].includes(c.assessment)&&url(c.source))))continue;
 add('analyze',w.word,'lemma='+w.word+';pos='+w.pos,
  'source-checked-lexeme',[w.source],0.8);counts.lemmas++;
 for(const f of w.inflections||[]){
  if(!['dictionary','grammar','text'].includes(f.evidence)||!url(f.source)||!f.form||f.form.includes(' '))continue;
  add('analyze',f.form,'lemma='+w.word+';source-form='+String(f.category||'form').slice(0,70),
   'source-listed-form',[f.source],0.8);counts.forms++;
 }
}
// Additional source-gated Tēntli grammatical hypotheses remain LOW-WEIGHT
// teacher examples. Query the existing canonical morphology engine; never
// implement a competing analyzer or treat its suggestions as attestations.
const mctx={window:{},words:D.words,FULL_VERB_PARADIGMS:P.paradigms,
 VERB_TENSES:P.patterns,
 norm:t=>String(t).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase(),
 stripToken:t=>String(t).trim(),
 historicalSpellings:w=>String(w.original||'').split(/[;,/]+/).map(z=>z.trim()).filter(Boolean),
 safe:String,validUrl:()=>true,safeLink:()=>''};
const msource=read('tools/morphology_engine.js').split('renderMorphologyBreakdown=TlahtolliMorphEngine.html;')[0];
vm.runInNewContext(msource+String.fromCharCode(10)+'this.Morph=TlahtolliMorphEngine;',mctx);
const parsedMorph=mctx.Morph,derived=new Map();
for(const w of D.words){
 if(w.status!=='Checked against source'||!String(w.pos).startsWith('verb')||
  !w.claims?.some(c=>c.field==='stem'&&['grammar','dictionary'].includes(c.assessment)))continue;
 const bases=[w.word,...String(w.stem||'').split(';').map(z=>z.trim().replace(/-$/,'')).filter(Boolean)];
 const candidates=new Set();
 for(const base of bases)for(const suffix of ['', 'z', 'queh'])
  for(const prefix of ['ni','ti','n','t','nitla','titla','ōni','ōti'])
   candidates.add(prefix+base+suffix);
 for(const word of candidates){
  if(paradigms.has(word))continue;
  const readings=parsedMorph.analyze(word).filter(h=>h.lemma===w.word&&h.grade==='hypothesis'&&
   url(h.source)&&h.parts?.filter(p=>p.surface!=='Ø').map(p=>p.surface).join('')===word);
  if(!readings.length)continue;
  const prev=derived.get(word)||{alternatives:new Set(),sources:new Set()};
  for(const h of readings){
   const feature=h.features||{};
   prev.alternatives.add(w.word+':'+h.kind+':'+String(feature.subject||'')+':'+String(feature.tense||''));
   prev.sources.add(h.source);
  }
  derived.set(word,prev);
 }
}
counts.hypotheses=0;
for(const [written,data] of derived){
 const alternatives=[...data.alternatives].sort().join('|');
 if(Buffer.byteLength(alternatives,'utf8')>240)continue;
 add('analyze',written,alternatives,'source-gated-hypothesis',[...data.sources],0.22);
 counts.hypotheses++;
}
for(const p of Object.values(P.paradigms))for(const row of [0,3])for(const form of p.cells[row]){
 for(const prefix of ['', 'ahmo ']){
  const written=prefix+form,parsed=S.analyze(written),graph=I.build(written,parsed);
  const c=I.auditEnglish(E.compose(written,parsed),parsed,graph);
  const options=c.available&&c.units.length===1&&c.joins.length===0
    ? [...new Set(c.units[0].options.map(x=>x.text))]:[];
  if(options.length!==1){counts.ambiguousEnglish++;continue;}
  const translation=E.render(c),sources=c.units[0].options[0].sources||[];
  if(!translation||!sources.every(url)||!sources.length){counts.ambiguousEnglish++;continue;}
  add('translate',written,translation,'grammar-composed-English',sources,0.2);counts.english++;
 }
}
if(counts.lemmas<150||counts.forms<100)throw Error('Unexpected source-checked inventory');
const seen=new Set();
for(const x of outputs){
 const key=JSON.stringify([x.task,x.grade,x.input,x.target]);
 if(seen.has(key))throw Error('Duplicate teacher example '+key);
 seen.add(key);
}
outputs.sort((a,b)=>a.task.localeCompare(b.task)||a.grade.localeCompare(b.grade)||
 a.input.localeCompare(b.input)||a.target.localeCompare(b.target));
const out=process.argv[2];
if(!out)throw Error('Usage: node tools/export_tentli_neural_teacher.js /tmp/teacher.jsonl');
fs.mkdirSync(path.dirname(path.resolve(out)),{recursive:true});
fs.writeFileSync(out,outputs.map(x=>JSON.stringify(x)).join('\n')+'\n');
const hashes={};
for(const file of ['dictionary.json','paradigms.json','translator-sentence.js',
 'translator-english.js','translator-grammar-ir.js','tools/morphology_engine.js'])
 hashes[file]=crypto.createHash('sha256').update(read(file)).digest('hex');
const meta={format:'tentli-teacher-v1',release:D.version,counts,
 uniqueParadigmSurfaces:paradigms.size,examples:outputs.length,source_sha256:hashes,
 historical_attestations_added:0,independent_gold:0,accuracy:null};
fs.writeFileSync(out+'.meta.json',JSON.stringify(meta,null,2)+'\n');
console.log('TEACHER EXPORT '+JSON.stringify(meta));
