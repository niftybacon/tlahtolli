/* Tlahtōlli: separately licensed historical lexicon supplement.
 * 36,543 source rows are not 36,543 verified Classical Nahuatl lemmas.
 * Never promote OCR, modern dialect, or alternate spellings to certified evidence.
 */
(function(root){
'use strict';
const base='./research/amoxcalli_archive/';
const kinds={nci:'Classical Nahuatl',nhn:'Central Nahuatl',nch:'Central Huasteca Nahuatl',nhe:'Eastern Huasteca Nahuatl'};
const norm=s=>String(s||'').normalize('NFC').trim().toLocaleLowerCase('en');
const fold=s=>norm(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const $=id=>document.getElementById(id);
const el=(tag,txt,cls)=>{
 const node=document.createElement(tag);
 if(cls)node.className=cls;
 if(txt!==undefined)node.textContent=String(txt);
 return node;
};
let loaded=false,pending=null,records=[],byForm=new Map(),byFold=new Map(),manifest=null;
function addForm(word,rec){
 const key=norm(word);
 if(!key||key.length>160)return;
 const found=byForm.get(key)||[];
 if(!found.includes(rec))found.push(rec);
 byForm.set(key,found);
 const folded=fold(key),alternatives=byFold.get(folded)||[];
 if(!alternatives.includes(rec))alternatives.push(rec);
 byFold.set(folded,alternatives);
}
function addRecord(rec,forms=[]){
 // Retain Kaikki's form-level labels instead of flattening its raw [form, tags]
 // pairs into strings. A listed form is not thereby a historically attested
 // inflection, and any grammatical label remains source-reported evidence.
 rec.sourceForms=forms.map(f=>{
  if(typeof f==='string')return {form:f,tags:[]};
  if(!Array.isArray(f)||typeof f[0]!=='string')return null;
  return {form:f[0],tags:(Array.isArray(f[1])?f[1]:[]).filter(tag=>typeof tag==='string')};
 }).filter(f=>f&&f.form.trim());
 records.push(rec);
 addForm(rec.word,rec);
 for(const entry of rec.sourceForms)if(norm(entry.form)!==norm(rec.word))addForm(entry.form,rec);
}
function matchingFormEvidence(rec,query,approximate){
 const forms=[{form:rec.word,role:'headword',tags:[]},
  ...(rec.sourceForms||[]).map(f=>({...f,role:'source-listed form'}))];
 const found=new Map();
 for(const item of forms){
  const key=norm(item.form);
  if(approximate?(fold(key)!==fold(query)||key===query):key!==query)continue;
  const old=found.get(key);
  if(old){
   old.tags=[...new Set([...old.tags,...item.tags])];
   if(item.role==='headword')old.role='headword';
  }else found.set(key,{form:item.form,role:item.role,tags:[...item.tags]});
 }
 return [...found.values()];
}
async function fetchJson(path){
 const response=await fetch(base+path,{cache:'default'});
 if(!response.ok)throw Error('Archive file unavailable ('+path+', HTTP '+response.status+')');
 return response.json();
}
async function readAll(){
 const meta=await fetchJson('manifest.json');
 if(meta.format!=='tlahtolli-amoxcalli-archive-manifest-v1')throw Error('Unsupported lexicon manifest');
 const tasks=[
  ...meta.simeon.files.map(path=>({path,kind:'simeon'})),
  ...meta.kaikki.files.map(path=>({path,kind:'kaikki'}))
 ];
 const next=[];
 for(let offset=0;offset<tasks.length;offset+=4){
  const batch=tasks.slice(offset,offset+4);
  const items=await Promise.all(batch.map(t=>fetchJson(t.path)));
  items.forEach((doc,i)=>{
   const task=batch[i];
   if(doc.format!=='tlahtolli-amoxcalli-'+task.kind+'-v1'||!Array.isArray(doc.rows))throw Error('Invalid archive shard '+task.path);
   next.push({kind:task.kind,rows:doc.rows});
  });
 }
 records=[];byForm=new Map();byFold=new Map();
 for(const part of next){
  for(const row of part.rows){
   if(part.kind==='simeon'){
    if(!Array.isArray(row)||typeof row[0]!=='string')continue;
    addRecord({word:row[0],meaning:row[1]||'',pos:row[2]||'unclassified',roots:row[3]||[],
      source:'Siméon 1885 (Amoxcalli OCR)',sourceKey:'simeon',variety:'Historical Nahuatl · OCR unreviewed',
      sourceUrl:meta.simeon.source_url,language:'French',note:'Historical OCR is not an individually verified lexical claim.'});
   }else{
    if(!Array.isArray(row)||typeof row[0]!=='string')continue;
    const senses=Array.isArray(row[3])?row[3]:[];
    const forms=Array.isArray(row[4])?row[4]:[];
    addRecord({word:row[0],meaning:senses.flatMap(s=>Array.isArray(s[0])?s[0]:[]).join('; '),
     pos:row[1]||'unclassified',source:'Wiktionary / Kaikki',sourceKey:'kaikki',
     variety:kinds[row[2]]||('Unclassified '+row[2]),language:'English',
     sourceUrl:meta.kaikki.source_url,etymology:row[5]||'',senses:senses,
     note:'Community dictionary data, not independent attestation of this historical context.'},
     forms);
   }
  }
 }
 if(records.length!==meta.source_rows.total)throw Error('Archive completeness mismatch: expected '+meta.source_rows.total+', got '+records.length);
 loaded=true;manifest=meta;
 return {total:records.length,simeon:meta.source_rows.simeon,kaikki:meta.source_rows.kaikki};
}
function ensureLoaded(){
 if(loaded)return Promise.resolve({total:records.length});
 if(!pending)pending=readAll().catch(e=>{pending=null;loaded=false;records=[];byForm=new Map();byFold=new Map();throw e;});
 return pending;
}
function lookup(form,opts={}){
 if(!loaded)return [];
 const hits=byForm.get(norm(form))||[];
 const classicalOnly=opts.classicalOnly!==false;
 return hits.filter(x=>!classicalOnly||x.sourceKey==='simeon'||x.variety==='Classical Nahuatl')
  .slice(0,opts.limit||10);
}
// A separate, evidence-only lookup: do not silently promote archive rows into
// curated lexical candidates or into the working translation gloss.
function lookupEvidence(form,opts={}){
 const empty={hits:[],total:0,approximateCount:0,truncated:false};
 if(!loaded)return empty;
 const key=norm(form);
 if(!key)return empty;
 const classicalOnly=opts.classicalOnly!==false;
 const allow=rec=>!classicalOnly||rec.sourceKey==='simeon'||rec.variety==='Classical Nahuatl';
 const exact=(byForm.get(key)||[]).filter(allow);
 const approximate=(byFold.get(fold(key))||[]).filter(rec=>allow(rec)&&!exact.includes(rec));
 const limit=Number.isInteger(opts.limit)?Math.min(50,Math.max(1,opts.limit)):8;
 const hits=[
  ...exact.map(rec=>({...rec,matchKind:'exact',
   matchedForms:matchingFormEvidence(rec,key,false)})),
  ...approximate.map(rec=>({...rec,matchKind:'diacritic-variant',
   matchedForms:matchingFormEvidence(rec,key,true)}))
 ];
 return {hits:hits.slice(0,limit),total:hits.length,
  approximateCount:approximate.length,truncated:hits.length>limit};
}
// Cross-reference an already-proposed morphological parse against *exact*
// source-listed Classical forms. A lexical overlap is not a manuscript
// attestation, a verified morphological parse, or a reason to rank candidates.
function crossCheckMorphology(token,analyses,opts={}){
 if(!loaded||!Array.isArray(analyses))return [];
 const key=norm(token);
 if(!key||key.length>120)return [];
 const max=Number.isInteger(opts.limit)?Math.max(1,Math.min(opts.limit,20)):8;
 const archive=(byForm.get(key)||[]).filter(rec=>rec.sourceKey==='kaikki'&&rec.variety==='Classical Nahuatl');
 const out=[],seen=new Set();
 for(const candidate of analyses.slice(0,40)){
  if(!candidate||candidate.changed||!candidate.kind||
    ['Dictionary matching form','Dictionary headword','Spelling variant'].includes(candidate.kind)||
    norm(candidate.surface)!==key||candidate.original&&norm(candidate.original)!==key)continue;
  const lemma=norm(candidate.lemma);
  if(!lemma)continue;
  // Reject contradictory parts of speech when the proposal gives a category.
  // Many form-of tags do not encode a syntactic role; leave those unresolved.
  const category=String(candidate.features?.category||'').toLowerCase();
  const kind=String(candidate.kind).toLowerCase();
  const categoryPos=['noun','verb'].includes(category)?category:null;
  const kindPos=/\bnoun\b|possessed form/.test(kind)?'noun':
   /conjugation|transitive parse/.test(kind)?'verb':null;
  if(categoryPos&&kindPos&&categoryPos!==kindPos)continue;
  const expectedPos=categoryPos||kindPos;
  for(const rec of archive){
   if(norm(rec.word)!==lemma||(expectedPos&&rec.pos!==expectedPos))continue;
   const forms=matchingFormEvidence(rec,key,false);
   for(const form of forms){
    const unique=[lemma,form.form,form.role,(form.tags||[]).join('|'),candidate.kind].join('\u0000');
    if(seen.has(unique))continue;
    seen.add(unique);
    out.push({lemma:candidate.lemma,kind:candidate.kind,grade:candidate.grade||'unreviewed',
     form:form.form,role:form.role,tags:form.tags,source:rec.source,sourceUrl:rec.sourceUrl,
     sourcePartOfSpeech:rec.pos,
     evidence:'Exact source-form/lemma overlap only; unreviewed lexicographic cross-reference, not proof of the proposed parse.'});
    if(out.length>=max)return out;
   }
  }
 }
 return out;
}
function search(query,source='all',limit=60){
 if(!loaded)return {hits:[],total:0};
 const q=norm(query);
 if(q.length<2)return {hits:[],total:0};
 let hits=[],total=0;
 for(const rec of records){
  if(source!=='all'&&rec.sourceKey!==source&&rec.variety!==source)continue;
  if(norm(rec.word).includes(q)||(q.length>2&&norm(rec.meaning).includes(q))){
   total++;if(hits.length<limit)hits.push(rec);
  }
 }
 return {hits,total};
}
function renderRecord(rec){
 const item=el('article',undefined,'archive-entry');
 item.append(el('strong',rec.word),el('span',' · '+rec.pos+' · '+rec.variety,'translator-meta'));
 const meaning=el('p',rec.meaning||'No usable source definition.');
 if(meaning.textContent.length>500){
  const details=el('details');
  details.append(el('summary',meaning.textContent.slice(0,250)+'… (read complete original definition)'));
  details.append(meaning);item.append(details);
 }else item.append(meaning);
 item.append(el('p',rec.source+' · '+rec.language+' · Not individually verified','translator-meta'));
 if(rec.etymology)item.append(el('p','Etymology note: '+rec.etymology,'translator-meta'));
 if(rec.roots?.length)item.append(el('p','Source roots: '+rec.roots.join(', '),'translator-meta'));
 const link=el('a','Inspect original imported source');
 link.href=rec.sourceUrl;link.rel='noopener noreferrer';link.target='_blank';item.append(link);
 return item;
}
function bindPanel(){
 const load=$('archiveLoad'),input=$('archiveSearch'),filter=$('archiveSource'),results=$('archiveResults'),status=$('archiveStatus');
 if(!load||!input||!filter||!results||!status)return;
 let searchTimer;
 function render(){
  results.replaceChildren();
  const query=input.value.trim();
  if(query.length<2){status.textContent='36,543 source records loaded. Enter at least two letters to search the unreviewed archive.';return;}
  const match=search(query,filter.value);
  status.textContent=match.total+' source records found; showing '+match.hits.length+'. These are not additions to the verified dictionary.';
  for(const entry of match.hits)results.append(renderRecord(entry));
 }
 load.addEventListener('click',async()=>{
  load.disabled=true;status.textContent='Loading 36,543 source rows (first use can take several seconds)…';
  try{
   const data=await ensureLoaded();
   status.textContent=data.total+' source records ready. Classical and modern varieties remain separate.';
   input.disabled=false;filter.disabled=false;load.hidden=true;
   render();
  }catch(e){status.textContent='Archive unavailable: '+e.message;load.disabled=false;}
 });
 input.addEventListener('input',()=>{clearTimeout(searchTimer);searchTimer=setTimeout(render,180);});
 filter.addEventListener('change',render);
}
root.TlahtolliArchive={ensureLoaded,lookup,lookupEvidence,crossCheckMorphology,search,renderRecord,get ready(){return loaded;},get manifest(){return manifest;}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bindPanel,{once:true});
else bindPanel();
})(window);
