/* Source-controlled browser-local SRS. Adjustable SM-2-family scheduler, NOT Anki FSRS. */
const TlahtolliSRS=(()=>{
'use strict';
const DAY=86400000,MIN=60000,KEY='tlahtolli_srs_settings_v2';
const DEFAULT={newLimit:10,reviewLimit:100,learning:'1m 10m',relearning:'10m',graduating:1,easyDays:4,
 maxInterval:36500,startingEase:2.5,easyBonus:1.3,hardFactor:1.2,intervalModifier:1,lapseMultiplier:.2,
 minLapse:1,leechThreshold:8,leechAction:'tag',order:'due',burySiblings:true};
const LIMITS={newLimit:[0,999],reviewLimit:[0,9999],graduating:[1,3650],easyDays:[1,3650],
 maxInterval:[1,36500],startingEase:[1.3,4],easyBonus:[1,4],hardFactor:[1,2],
 intervalModifier:[.2,3],lapseMultiplier:[0,1],minLapse:[1,3650],leechThreshold:[1,99]};
const FIELDS=[
 ['newLimit','New cards per day'],['reviewLimit','Maximum daily reviews'],
 ['learning','Learning steps (1m 10m)'],['relearning','Relearning steps (10m)'],
 ['graduating','Graduating interval · days'],['easyDays','New-card Easy interval · days'],
 ['startingEase','Starting ease (1.3–4.0)'],['easyBonus','Easy bonus'],
 ['hardFactor','Hard interval factor'],['intervalModifier','Interval modifier'],
 ['lapseMultiplier','Lapse interval multiplier'],['minLapse','Minimum lapse interval · days'],
 ['maxInterval','Maximum interval · days'],['leechThreshold','Leech lapse threshold']
];
const PRESETS={
 balanced:{...DEFAULT},intensive:{...DEFAULT,newLimit:20,reviewLimit:200,intervalModifier:.85},
 gentle:{...DEFAULT,newLimit:5,reviewLimit:50,learning:'10m',intervalModifier:1.15}
};
function clamp(n,lo,hi,fallback){const value=Number(n);return Number.isFinite(value)?Math.max(lo,Math.min(hi,value)):fallback}
function config(input={}){
 const x={...DEFAULT};
 for(const [key,[lo,hi]] of Object.entries(LIMITS))x[key]=clamp(input[key]??DEFAULT[key],lo,hi,DEFAULT[key]);
 for(const key of ['learning','relearning']){
  const s=String(input[key]||DEFAULT[key]).trim().slice(0,90);
  x[key]=/^(\d+(?:\.\d+)?[smhd])(?:\s+\d+(?:\.\d+)?[smhd]){0,7}$/i.test(s)?s:DEFAULT[key];
 }
 x.order=['due','new','alphabetical'].includes(input.order)?input.order:DEFAULT.order;
 x.leechAction=['tag','suspend'].includes(input.leechAction)?input.leechAction:DEFAULT.leechAction;
 x.burySiblings=input.burySiblings!==false;
 return x;
}
function steps(value){
 return String(value).split(/\s+/).map(s=>{const m=/^(\d+(?:\.\d+)?)([smhd])$/i.exec(s);
  return m?Number(m[1])*({s:1000,m:MIN,h:60*MIN,d:DAY}[m[2].toLowerCase()]):NaN;
 }).filter(n=>Number.isFinite(n)&&n>=1000&&n<=30*DAY).slice(0,8);
}
let opts=config(readLocalJson(KEY,{}));
function saveConfig(){try{localStorage.setItem(KEY,JSON.stringify(opts))}catch{message('Unable to save study settings. Back up your project.')}}
function midnight(ts=Date.now()){const d=new Date(ts);return new Date(d.getFullYear(),d.getMonth(),d.getDate()).getTime()}
function phase(r){if(!r||!r.last)return 'new';if(['review','learning','relearning','suspended'].includes(r.phase))return r.phase;return r.reps>0?'review':'learning'}
function usage(records=studyRecords,now=Date.now()){
 let introduced=0,reviews=0;const today=midnight(now);
 for(const r of Object.values(records)){
  if(r?.introducedAt>=today&&r.introducedAt<=now)introduced++;
  if(Array.isArray(r?.history))reviews+=r.history.filter(h=>h.at>=today&&h.at<=now&&h.wasReview).length;
  else if(r?.last>=today&&r.reps>0)reviews++;
 }
 return {introduced,reviews};
}
function days(n){return Math.min(opts.maxInterval,Math.max(1,Math.round(n)))}
function schedule(prior,grade,now=Date.now()){
 if(!['again','hard','good','easy'].includes(grade))return null;
 const prev=prior||{},state=phase(prev),learn=steps(opts.learning),relearn=steps(opts.relearning);
 const ease=clamp(prev.ease??opts.startingEase,1.3,4,opts.startingEase);
 const oldDays=Math.max(1,Number(prev.interval)||1);
 let easeNext=ease,span=oldDays,step=Math.max(0,Math.floor(Number(prev.step)||0));
 let next=state,lapses=Number(prev.lapses)||0,due=now+learn[0],review=state==='review';
 if(state==='new'||state==='learning'||state==='relearning'){
  const all=state==='relearning'?relearn:learn;
  if(grade==='again'){step=0;due=now+all[0];}
  else if(grade==='hard'){due=now+Math.max(MIN,all[Math.min(step,all.length-1)])*1.5;}
  else if(grade==='easy'){span=days(Math.max(opts.easyDays,state==='relearning'?span:0));easeNext=Math.min(4,ease+.15);next='review';due=now+span*DAY;step=0;}
  else if(step+1<all.length){step++;due=now+all[step];}
  else{span=days(state==='relearning'?span:opts.graduating);next='review';due=now+span*DAY;step=0;}
  if(next==='new')next='learning';
 }else if(review){
  if(grade==='again'){
   lapses++;easeNext=Math.max(1.3,ease-.2);span=days(Math.max(opts.minLapse,oldDays*opts.lapseMultiplier));
   next='relearning';step=0;due=now+relearn[0];
  }else{
   if(grade==='hard'){easeNext=Math.max(1.3,ease-.15);span=days(Math.max(oldDays+1,oldDays*opts.hardFactor*opts.intervalModifier));}
   if(grade==='good')span=days(Math.max(oldDays+1,oldDays*ease*opts.intervalModifier));
   if(grade==='easy'){easeNext=Math.min(4,ease+.15);span=days(Math.max(oldDays+1,oldDays*ease*opts.easyBonus*opts.intervalModifier));}
   due=now+span*DAY;
  }
 }
 const leech=lapses>=opts.leechThreshold,suspended=leech&&opts.leechAction==='suspend';
 if(suspended)next='suspended';
 return {...prev,reps:(Number(prev.reps)||0)+1,lapses,phase:next,step,interval:span,ease:easeNext,
  last:now,due,introducedAt:prev.introducedAt||now,lastGrade:grade,leech,suspended,
  history:[...(Array.isArray(prev.history)?prev.history:[]).slice(-99),{at:now,grade,wasReview:review,interval:span,due,phase:next}]};
}
let excluded=new Set(),undo=null;
function allowed(key,r,filter,stats,now){
 if(phase(r)==='suspended'||r?.suspended||excluded.has(key))return false;
 if(filter==='dueOnly'&&!r)return false;
 if(filter!=='all'&&r&&r.due>now)return false;
 if(filter!=='all'&&!r&&stats.introduced>=opts.newLimit)return false;
 if(filter!=='all'&&r&&phase(r)==='review'&&stats.reviews>=opts.reviewLimit)return false;
 return true;
}
function sort(a,b,ka,kb){
 if(opts.order==='alphabetical')return a.localeCompare(b);
 if(opts.order==='new'&&(!ka)!==(!kb))return ka?1:-1;
 return (ka?.due||0)-(kb?.due||0)||a.localeCompare(b);
}
function queueWords(now=Date.now()){
 const stats=usage(studyRecords,now),filter=$('studySubset').value;
 return words.filter(w=>w.word&&w.meaning&&allowed(studyKey(w),studyRecords[studyKey(w)],filter,stats,now))
  .sort((a,b)=>sort(a.word,b.word,studyRecords[studyKey(a)],studyRecords[studyKey(b)]));
}
function siblingDone(lemma,key,now){
 const today=midnight(now);
 return Object.entries(studyRecords).some(([k,r])=>k!==key&&k.startsWith('paradigm§')&&k.split('§')[1]===norm(lemma)&&r.last>=today);
}
function queueDrill(now=Date.now()){
 const filter=$('drillSubset').value,stats=usage(studyRecords,now),out=[];
 for(const [lemma,m] of Object.entries(FULL_VERB_PARADIGMS)){
  if($('drillVerb').value!=='all'&&$('drillVerb').value!==lemma)continue;
  for(let ti=0;ti<($('drillScope').value==='core'?4:10);ti++)for(let pi=0;pi<6;pi++){
   const form=m.cells[ti]?.[pi];if(!form)continue;
   const key=drillKey(lemma,ti,pi,form),r=studyRecords[key];
   if(!allowed(key,r,filter==='active'?'due':filter,stats,now))continue;
   if(opts.burySiblings&&filter!=='all'&&siblingDone(lemma,key,now))continue;
   out.push({lemma,form,ti,pi,key,record:r});
  }
 }
 return out.sort((a,b)=>sort(a.lemma,b.lemma,a.record,b.record)||a.ti-b.ti||a.pi-b.pi);
}
function interval(ms){return ms<3600000?Math.ceil(ms/MIN)+'m':ms<DAY?(ms/3600000).toFixed(1).replace(/\.0$/,'')+'h':Math.round(ms/DAY)+'d'}
function preview(root,key){
 const el=$(root),box=el?.querySelector('.study-grades');if(!box)return;
 for(const button of box.querySelectorAll('[data-study-grade],[data-drill-grade]')){
  const grade=button.dataset.studyGrade||button.dataset.drillGrade;
  const record=schedule(studyRecords[key],grade);
  if(record)button.textContent=grade.slice(0,1).toUpperCase()+grade.slice(1)+' · '+interval(record.due-Date.now());
 }
 if(!el.querySelector('.srs-memo'))box.insertAdjacentHTML('beforebegin','<p class="readerhint srs-memo">Intervals follow your adjustable scheduler, not Anki FSRS.</p>');
}
function statsText(){
 const count=usage();$('srsDaily').textContent='New today '+count.introduced+'/'+opts.newLimit+' · Review grades '+count.reviews+'/'+opts.reviewLimit+
  ' · “Any” practice does not alter scheduling';
 $('srsUndo').disabled=!undo;
}
function rate(key,grade,filter){
 if(!key||!['again','hard','good','easy'].includes(grade))return;
 if(filter==='all'){excluded.add(key);message('Practice-only review: schedule unchanged.');}
 else{
  undo={key,before:studyRecords[key]?JSON.parse(JSON.stringify(studyRecords[key])):null};
  studyRecords[key]=schedule(studyRecords[key],grade);saveStudyRecords();
  if(studyRecords[key].suspended)message('Leech card suspended after repeated lapses. Use a backup to restore or reset progress.');
 }
 if(key.startsWith('paradigm§')){drillCurrentKey='';drillRevealed=false;renderDrill();}
 else{studyCurrentKey='';studyRevealed=false;renderStudy();}
 statsText();
}
function undoLast(){if(!undo)return;
 if(undo.before)studyRecords[undo.key]=undo.before;else delete studyRecords[undo.key];
 undo=null;excluded.clear();studyCurrentKey='';drillCurrentKey='';
 saveStudyRecords();renderStudy();renderDrill();message('Last graded review undone.');
}
function exportAnki(paradigms=false){
 const deck='Tlahtōlli::'+(paradigms?'Verb Paradigms':'Vocabulary');
 const head='#separator:Tab\r\n#html:true\r\n#notetype:Basic\r\n#deck:'+deck+'\r\n#columns:Front\tBack\tTags\r\n#tags column:3\r\n';
 const rows=[];
 if(paradigms){
  for(const [lemma,model] of Object.entries(FULL_VERB_PARADIGMS))
   for(let ti=0;ti<model.cells.length;ti++)for(let pi=0;pi<6;pi++){
    const prompt=lemma+' · '+VERB_TENSES[ti].name+' · '+PARADIGM_PERSONS[pi][0];
    const back='<strong>'+safe(model.cells[ti][pi])+'</strong><hr>Grammar-derived, not individually manuscript-attested. Source: '+safe(model.lemmaSource);
    rows.push([prompt,back,'Nahuatl Tlahtolli Paradigm GrammarDerived']);
   }
 }else for(const w of words){
  if(!w.word||!w.meaning)continue;
  const back='<strong>'+safe(w.meaning)+'</strong><hr>'+safe(w.pos)+
   '<br>Historic spelling: '+safe(w.original||'not recorded')+
   '<br>Verification: '+safe(w.status)+
   '<br>Source: '+safe(w.source)+(w.notes?'<br>Notes: '+safe(w.notes):'');
  rows.push([w.word,back,'Nahuatl Tlahtolli Vocabulary '+String(w.pos||'').toLowerCase().replace(/[^a-z]+/g,'_')]);
 }
 download(paradigms?'tlahtolli-anki-verb-paradigms.tsv':'tlahtolli-anki-vocabulary.tsv',
  head+rowsToText(rows,'\t'),'text/tab-separated-values');
 message('Exported '+rows.length+' Anki notes. Anki will schedule them independently; TSV does not transfer this browser’s review history.');
}
function applySettings(newSettings){
 opts=config(newSettings);saveConfig();
 for(const [k] of FIELDS)if($('srs_'+k))$('srs_'+k).value=opts[k];
 if($('srsOrder'))$('srsOrder').value=opts.order;
 if($('srsLeechAction'))$('srsLeechAction').value=opts.leechAction;
 if($('srsBury'))$('srsBury').checked=opts.burySiblings;
 excluded.clear();studyCurrentKey='';drillCurrentKey='';
 renderStudy();renderDrill();statsText();
}
return {DEFAULT,PRESETS,FIELDS,config,steps,schedule,midnight,usage,queueWords,queueDrill,rate,undoLast,
 preview,statsText,applySettings,exportAnki,getSettings:()=>({...opts})};
})();