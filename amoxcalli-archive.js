/* Tlahtōlli: separately licensed historical lexicon supplement.
 * 36,543 source rows are not 36,543 verified Classical Nahuatl lemmas.
 * Never promote OCR, modern dialect, or alternate spellings to certified evidence.
 */
(function(root){
'use strict';
const base='./research/amoxcalli_archive/';
const kinds={nci:'Classical Nahuatl',nhn:'Central Nahuatl',nch:'Central Huasteca Nahuatl',nhe:'Eastern Huasteca Nahuatl'};
const norm=s=>String(s||'').normalize('NFC').trim().toLocaleLowerCase('en');
const $=id=>document.getElementById(id);
const el=(tag,txt,cls)=>{
 const node=document.createElement(tag);
 if(cls)node.className=cls;
 if(txt!==undefined)node.textContent=String(txt);
 return node;
};
let loaded=false,pending=null,records=[],byForm=new Map(),manifest=null;
function addForm(word,rec){
 const key=norm(word);
 if(!key||key.length>160)return;
 const found=byForm.get(key)||[];
 if(!found.includes(rec))found.push(rec);
 byForm.set(key,found);
}
function addRecord(rec,forms=[]){
 records.push(rec);
 addForm(rec.word,rec);
 for(const form of forms)if(form&&form!==rec.word)addForm(form,rec);
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
 records=[];byForm=new Map();
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
     forms.map(f=>Array.isArray(f)?f[0]:null).filter(Boolean));
   }
  }
 }
 if(records.length!==meta.source_rows.total)throw Error('Archive completeness mismatch: expected '+meta.source_rows.total+', got '+records.length);
 loaded=true;manifest=meta;
 return {total:records.length,simeon:meta.source_rows.simeon,kaikki:meta.source_rows.kaikki};
}
function ensureLoaded(){
 if(loaded)return Promise.resolve({total:records.length});
 if(!pending)pending=readAll().catch(e=>{pending=null;loaded=false;records=[];byForm=new Map();throw e;});
 return pending;
}
function lookup(form,opts={}){
 if(!loaded)return [];
 const hits=byForm.get(norm(form))||[];
 const classicalOnly=opts.classicalOnly!==false;
 return hits.filter(x=>!classicalOnly||x.sourceKey==='simeon'||x.variety==='Classical Nahuatl')
  .slice(0,opts.limit||10);
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
  if(query.length<2){status.textContent='Loaded. Enter at least two letters to search the unreviewed archive.';return;}
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
root.TlahtolliArchive={ensureLoaded,lookup,search,renderRecord,get ready(){return loaded;},get manifest(){return manifest;}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bindPanel,{once:true});
else bindPanel();
})(window);
