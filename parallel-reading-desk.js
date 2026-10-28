/* Manual side-by-side Nahuatl reading. No remote submissions, stored model
 * answers, inferred segment matches, or claims of translation adequacy.
 */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const core=window.TlahtolliParallelCore;
const mount=$('parallelReadingWorkspace');
if(!mount||!core)return;
const $create=(tag,cls,content)=>{
 const e=document.createElement(tag);
 if(cls)e.className=cls;
 if(content!==undefined)e.textContent=String(content);
 return e;
};
const source=document.createElement('p');
source.className='readerhint';
source.append(document.createTextNode('Source: 1573 Coyoacán land sale · '));
const sourceLink=$create('a','','view ENL analytic transcription and English translation');
sourceLink.href=core.SOURCE_URL;sourceLink.target='_blank';sourceLink.rel='noopener noreferrer';
source.append(sourceLink);
mount.append(source,
 $create('p','translator-caution','Manual, non-blind reading only. Paste text you are authorized to access; no source text or modern translation is bundled, transmitted, or saved by this tool. Do not treat editorial English prose as word-by-word equivalence.'),
 $create('p','readerhint','Make your own phrase breaks with one passage or phrase per line on BOTH sides; the website will never match lines automatically.'));
const columns=$create('div','translator-controls');
const nhWrapper=$create('div');
const enWrapper=$create('div');
const nhLabel=$create('label','','Nahuatl · editorial transcription (one manually selected phrase per line)');
nhLabel.htmlFor='parallelNahuatl';
const enLabel=$create('label','','English · published translation (one manually selected phrase per line)');
enLabel.htmlFor='parallelEnglish';
const nh=$create('textarea');nh.id='parallelNahuatl';nh.rows=7;nh.spellcheck=false;
nh.placeholder='Paste Nahuatl from the source page. Manually insert line breaks where you want to study.';
const en=$create('textarea');en.id='parallelEnglish';en.rows=7;en.spellcheck=false;
en.placeholder='Paste English text from the source page; split phrases manually without assuming literal equivalence.';
nhWrapper.append(nhLabel,nh);
enWrapper.append(enLabel,en);
columns.append(nhWrapper,enWrapper);
mount.append(columns);
const tools=$create('div','translator-actions');
const makeButton=(id,label,fn)=>{
 const b=$create('button','btn',label);b.id=id;b.type='button';
 b.addEventListener('click',fn);return b;
};
const status=$create('p','readerhint','Paste source text above. All readings remain unverified and in this browser until you export.');
status.id='parallelStatus';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
const choose=$create('div','translator-controls');
const nhChoice=$create('select');nhChoice.id='parallelNhChoice';nhChoice.setAttribute('aria-label','Choose Nahuatl reading line');
const enChoice=$create('select');enChoice.id='parallelEnChoice';enChoice.setAttribute('aria-label','Choose English reading line');
const nhSelectLabel=$create('label','','Select Nahuatl phrase');nhSelectLabel.htmlFor=nhChoice.id;
const enSelectLabel=$create('label','','Select English phrase');enSelectLabel.htmlFor=enChoice.id;
const nhSelectBox=$create('div');nhSelectBox.append(nhSelectLabel,nhChoice);
const enSelectBox=$create('div');enSelectBox.append(enSelectLabel,enChoice);
choose.append(nhSelectBox,enSelectBox);
const noteLabel=$create('label','','Why these may correspond (optional; your inference)');
noteLabel.htmlFor='parallelNote';
const note=$create('textarea');note.id='parallelNote';note.rows=2;note.maxLength=500;
note.placeholder='Explain uncertainties, omissions, and non-literal choices. Max 500 characters.';
const list=$create('div');list.id='parallelPairs';
const prepared={nahuatl:[],english:[],pairs:[],dirty:true};
function info(message){status.textContent=message;}
function options(select,values){
 select.replaceChildren();
 values.forEach((value,index)=>{
  const option=$create('option','',(index+1)+'. '+(value.length>130?value.slice(0,130)+'…':value));
  option.value=String(index);select.append(option);
 });
}
function inspect(text){
 const input=$('translatorInput'),form=$('translatorForm'),dir=$('translatorDirection');
 if(!input||!form){info('The main translator is not loaded; line pairings are still editable.');return;}
 input.value=text;
 if(dir)dir.value='nh-en';
 form.requestSubmit();
 input.scrollIntoView({block:'center',behavior:'smooth'});
}
function paint(){
 const active=!prepared.dirty&&prepared.nahuatl.length>0&&prepared.english.length>0;
 nhChoice.disabled=!active;enChoice.disabled=!active;
 add.disabled=!active;inspectButton.disabled=!active;download.disabled=!active;
 list.replaceChildren();
 if(!prepared.pairs.length){
  list.append($create('p','readerhint','No manual alignments yet. Selecting two lines does not assert they are exact translations.'));
  return;
 }
 list.append($create('p','translator-meta',prepared.pairs.length+' user-proposed pair(s). Every one remains unreviewed.'));
 prepared.pairs.forEach((pair,i)=>{
  const box=$create('article','translator-analysis');
  box.append($create('strong','',(i+1)+'. Nahuatl line '+(pair.nahuatl_index+1)+
    ' ↔ English line '+(pair.english_index+1)),
    $create('p','',pair.nahuatl_text),
    $create('p','',pair.english_text),
    $create('p','translator-caution','User-proposed relation, not a verified sentence alignment.'));
  if(pair.note)box.append($create('p','translator-meta','Annotation: '+pair.note));
  const actions=$create('div','translator-actions');
  actions.append(makeButton('','Inspect Nahuatl',()=>inspect(pair.nahuatl_text)),
    makeButton('','Remove pair',()=>{
     if(prepared.dirty){info('Prepare the edited lines before changing an existing alignment.');return;}
     prepared.pairs.splice(i,1);paint();info('Manual pairing removed.');
    }));
  box.append(actions);list.append(box);
 });
}
function prepare(){
 try{
  const a=core.lines(nh.value),b=core.lines(en.value);
  if(!a.length||!b.length)throw Error('Paste some Nahuatl and English text first.');
  const changed=JSON.stringify(a)!==JSON.stringify(prepared.nahuatl)||
   JSON.stringify(b)!==JSON.stringify(prepared.english);
  if(changed&&prepared.pairs.length&&!window.confirm('New text or phrase breaks will clear your existing pairings. Export first if you want to keep them. Continue?')){
   info('Unchanged pairings retained; restore old text or export after matching the original inputs.');return;
  }
  prepared.nahuatl=a;prepared.english=b;if(changed)prepared.pairs=[];
  prepared.dirty=false;
  options(nhChoice,a);options(enChoice,b);paint();
  info(a.length+' Nahuatl and '+b.length+' English reading units prepared. Select explicit pairs; no automatic alignment or accuracy score.');
 }catch(error){info(error.message);}
}
function addPair(){
 if(prepared.dirty){info('Prepare your text before adding a pairing.');return;}
 try{
  prepared.pairs=core.normalizePairs([...prepared.pairs,
   {nahuatl_index:Number(nhChoice.value),english_index:Number(enChoice.value),
    note:note.value}],prepared.nahuatl,prepared.english);
  note.value='';paint();
  info('Added a user-proposed alignment. No historical or linguistic verification was implied.');
 }catch(error){info(error.message);}
}
function downloadProject(){
 if(prepared.dirty){info('Prepare changed text before exporting; no outdated alignments will be exported.');return;}
 try{
  const data=core.createProject(nh.value,en.value,prepared.pairs);
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const address=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=address;
  a.download='tlahtolli-personal-parallel-reading.json';a.click();
  setTimeout(()=>URL.revokeObjectURL(address),1000);
  info('Personal unverified work exported locally. Nothing was uploaded or approved for training.');
 }catch(error){info(error.message);}
}
function clearAll(){
 if((nh.value.trim()||en.value.trim()||prepared.pairs.length)&&
  !window.confirm('Clear this unsaved local reading workspace? Export first if needed.'))return;
 nh.value='';en.value='';note.value='';
 prepared.nahuatl=[];prepared.english=[];prepared.pairs=[];prepared.dirty=true;
 options(nhChoice,[]);options(enChoice,[]);paint();
 info('Local reading cleared. No source text was sent to a server.');
}
const prepareButton=makeButton('parallelPrepare','Prepare numbered reading lines',prepare);
const add=makeButton('parallelAddPair','Add selected manual pairing',addPair);
const inspectButton=makeButton('parallelInspect','Inspect selected Nahuatl phrase',()=>inspect(prepared.nahuatl[Number(nhChoice.value)]));
const download=makeButton('parallelDownload','Export personal reading notes (JSON)',downloadProject);
const clear=makeButton('parallelClear','Clear local workspace',clearAll);
const importLabel=$create('label','btn','Import saved personal reading');
importLabel.htmlFor='parallelImport';
const importInput=$create('input');importInput.id='parallelImport';importInput.type='file';importInput.accept='.json,application/json';importInput.className='sr';
importInput.addEventListener('change',async()=>{
 const file=importInput.files?.[0];importInput.value='';
 if(!file)return;
 try{
  if(file.size>120000)throw Error('Import is too large for this bounded reading desk.');
  const data=core.importProject(JSON.parse(await file.text()));
  if((nh.value.trim()||en.value.trim()||prepared.pairs.length)&&
   !window.confirm('Import replaces the current unexported reading. Continue?'))return;
  nh.value=data.original_pasted_text;en.value=data.english_pasted_text;
  prepared.nahuatl=data.nahuatl_lines;prepared.english=data.english_lines;
  prepared.pairs=data.alignments;prepared.dirty=false;
  options(nhChoice,prepared.nahuatl);options(enChoice,prepared.english);
  note.value='';paint();
  info('Personal reading imported locally: '+prepared.pairs.length+' unverified manual pairings; no publishing, AI verification, or training permission.');
 }catch(err){info('Cannot import this file: '+err.message);}
});
tools.append(prepareButton,add,inspectButton,download,importLabel,importInput,clear);
mount.append(tools,status,choose,noteLabel,note,list,
 $create('p','translator-caution','Export is a private working note, NOT an approved Classical Nahuatl training corpus. This tool neither grades translations nor uploads your text. Reloading without exporting loses your edits.'));
for(const field of [nh,en])field.addEventListener('input',()=>{
 prepared.dirty=true;paint();
 info('Text has changed. Prepare the lines again before linking or exporting them.');
});
paint();
})();