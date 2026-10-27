/* FSRS-5 compatibility scheduler; offline, no third-party runtime dependency.
   Opt-in to protect existing schedules; review history remains locally owned. */
const TlahtolliFSRS=(()=>{
'use strict';
const DAY=86400000, K=19/81, DECAY=-.5, KEY='tlahtolli_fsrs_v1';
const W=[.40255,1.18385,3.173,15.69105,7.1949,.5345,1.4604,.0046,1.54575,.1192,1.01925,1.9395,.11,.29605,2.2698,.2315,2.9898,.51655,.6621];
const grades={again:1,hard:2,good:3,easy:4};
const kinds=['vocabulary','reverse','paradigm'];
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
function kind(key=''){return String(key).startsWith('paradigm§')?'paradigm':String(key).endsWith('§reverse')?'reverse':'vocabulary';}
function configure(v={}){
 const prior=v&&typeof v==='object'?v:{};
 const targets={},scales={};
 for(const type of kinds){
  const r=Number(prior.targets&&prior.targets[type]);targets[type]=Number.isFinite(r)?clamp(r,.80,.97):.90;
  const s=Number(prior.scales&&prior.scales[type]);scales[type]=Number.isFinite(s)?clamp(s,.55,1.8):1;
 }
 return {enabled:prior.enabled===true,targets,scales};
}
let opts;
try{opts=configure(JSON.parse(localStorage.getItem(KEY)||'{}'));}catch{opts=configure();}
function getSettings(){return JSON.parse(JSON.stringify(opts));}
function setSettings(next){
 opts=configure(next);
 try{localStorage.setItem(KEY,JSON.stringify(opts));}catch{}
 return getSettings();
}
function retrievability(s,elapsedDays){return Math.pow(1+K*Math.max(0,elapsedDays)/Math.max(.01,s),DECAY);}
function interval(stability,retention,scale=1){
 const raw=stability*scale/K*(Math.pow(retention,1/DECAY)-1);
 return clamp(Math.round(raw),1,36500);
}
function initialD(g){return clamp(W[4]-Math.exp(W[5]*(g-1))+1,1,10);}
function nextD(d,g){return clamp(W[7]*initialD(4)+(1-W[7])*(d-W[6]*(g-3)),1,10);}
function nextS(s,d,r,g,elapsed){
 if(elapsed<1)return clamp(s*Math.exp(W[17]*(g-3+W[18])),.05,36500);
 if(g===1)return clamp(W[11]*Math.pow(d,-W[12])*(Math.pow(s+1,W[13])-1)*Math.exp((1-r)*W[14]),.05,36500);
 const extra=Math.exp(W[8])*(11-d)*Math.pow(s,-W[9])*(Math.exp((1-r)*W[10])-1);
 return clamp(s*(1+extra*(g===2?W[15]:1)*(g===4?W[16]:1)),.05,36500);
}
function seed(old,grade,now){
 const known=old?.fsrs;
 if(known?.version===5&&Number.isFinite(known.stability)&&Number.isFinite(known.difficulty)&&known.stability>0)
  return {stability:clamp(known.stability,.05,36500),difficulty:clamp(known.difficulty,1,10),last:known.lastReview||old.last||now};
 if(old?.reps&&old.last){
  // Legacy estimate: never changes existing due dates until a graded review.
  return {stability:clamp(Number(old.interval)||(old.due-old.last)/DAY||1,.1,36500),
   difficulty:clamp(6-(Number(old.ease||2.5)-2.5)*2,1,10),last:old.last};
 }
 return {stability:W[grades[grade]-1],difficulty:initialD(grades[grade]),last:now,fresh:true};
}
function schedule(previous,grade,now=Date.now(),key=''){
 if(!grades[grade])return null;
 const old=previous||{},type=kind(key),g=grades[grade];
 let state=old.phase||(!old.last?'new':old.reps?'review':'learning');
 if(state==='suspended')return {...old};
 const model=seed(old,grade,now),elapsed=Math.max(0,(now-model.last)/DAY);
 const predicted=model.fresh?null:retrievability(model.stability,elapsed);
 const s=model.fresh?model.stability:nextS(model.stability,model.difficulty,predicted,g,elapsed);
 const d=model.fresh?model.difficulty:nextD(model.difficulty,g);
 const wasReview=state==='review';
 let phase=state,step=Math.max(0,Number(old.step)||0),due=now+60000;
 let lapses=Math.max(0,Number(old.lapses)||0);
 if(state==='new'||state==='learning'){
  phase='learning';
  if(grade==='again'){step=0;due=now+60000;}
  else if(grade==='hard'){due=now+90000;}
  else if(grade==='easy'){phase='review';step=0;due=now+interval(s,opts.targets[type],opts.scales[type])*DAY;}
  else if(step<1){step=1;due=now+600000;}
  else {phase='review';step=0;due=now+interval(s,opts.targets[type],opts.scales[type])*DAY;}
 }else if(state==='relearning'){
  if(grade==='again'){step=0;due=now+600000;}
  else if(grade==='hard'){due=now+900000;}
  else{phase='review';step=0;due=now+interval(s,opts.targets[type],opts.scales[type])*DAY;}
 }else{
  if(grade==='again'){phase='relearning';step=0;lapses++;due=now+600000;}
  else{phase='review';step=0;due=now+interval(s,opts.targets[type],opts.scales[type])*DAY;}
 }
 const classic=typeof TlahtolliSRS==='undefined'?{leechThreshold:8,leechAction:'tag'}:TlahtolliSRS.getSettings();
 const leech=old.leech===true||(wasReview&&grade==='again'&&lapses>=classic.leechThreshold);
 const suspended=leech&&classic.leechAction==='suspend';
 if(suspended)phase='suspended';
 const entry={at:now,grade,wasReview,interval:Math.max(0,(due-now)/DAY),due,phase,
  fsrsPredicted:predicted,fsrsElapsed:elapsed,fsrsStabilityBefore:model.stability,fsrsKind:type};
 return {...old,reps:(Number(old.reps)||0)+1,lapses,phase,step,interval:Math.max(0,(due-now)/DAY),
  last:now,due,introducedAt:old.introducedAt||now,lastGrade:grade,
  leech,suspended,fsrs:{version:5,stability:s,difficulty:d,lastReview:now},
  history:[...(Array.isArray(old.history)?old.history:[]).slice(-99),entry]};
}
function optimize(records=typeof studyRecords==='undefined'?{}:studyRecords){
 const out={...opts.scales},results={};
 for(const type of kinds){
  const samples=[];
  for(const [key,record] of Object.entries(records)){
   if(kind(key)!==type)continue;
   for(const item of record.history||[]){
    if(item?.wasReview!==true||!grades[item.grade]||!Number.isFinite(item.fsrsStabilityBefore)||
       !Number.isFinite(item.fsrsElapsed)||item.fsrsElapsed<.9)continue;
    samples.push(item);
   }
  }
  const misses=samples.filter(e=>e.grade==='again').length;
  if(samples.length<30||misses<3){results[type]={count:samples.length,misses,updated:false};continue;}
  let best=Infinity,scale=out[type];
  for(let i=0;i<=50;i++){
   const x=.55+i*.025;
   let loss=.02*Math.pow(Math.log(x),2);
   for(const e of samples){
    const p=retrievability(e.fsrsStabilityBefore*x,e.fsrsElapsed);
    loss+=Math.pow(p-(e.grade==='again'?0:1),2)/samples.length;
   }
   if(loss<best){best=loss;scale=x;}
  }
  out[type]=Number(scale.toFixed(3));
  results[type]={count:samples.length,misses,updated:true,scale:out[type],brier:best};
 }
 setSettings({...opts,scales:out});
 return results;
}
return {W,kind,configure,getSettings,setSettings,retrievability,interval,schedule,optimize};
})();
