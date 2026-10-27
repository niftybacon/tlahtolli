/* FSRS Stage 2: study profiles, personalized calibration, and 30-day workload. */
(function initializeFSRSStage2(){
 'use strict';
 const F=TlahtolliFSRS,S=TlahtolliSRS,host=document.getElementById('fsrsOptions');
 if(!host)return;
 const presets=document.createElement('div');presets.className='srs-settings-row';
 presets.innerHTML='<span class="readerhint">Retention presets (save to apply):</span>'+
  '<button class="btn" type="button" id="fsrsBalanced">Balanced · 90%</button>'+
  '<button class="btn" type="button" id="fsrsThorough">Thorough · 95%</button>'+
  '<button class="btn" type="button" id="fsrsLighter">Lighter · 85%</button>';
 host.insertBefore(presets,document.getElementById('fsrsSave'));
 for(const [name,value] of [['fsrsBalanced',.90],['fsrsThorough',.95],['fsrsLighter',.85]]){
  document.getElementById(name).onclick=()=>{
   for(const id of ['fsrsTargetVocabulary','fsrsTargetReverse','fsrsTargetParadigm'])
    document.getElementById(id).value=value.toFixed(2);
   document.getElementById('fsrsFeedback').textContent='Preset loaded. Save FSRS settings to apply.';
  };
 }
 const buttons=document.createElement('div');buttons.className='srs-settings-row';
 buttons.innerHTML='<button class="btn" type="button" id="fsrsCalibrate">Calibrate from local review history</button>'+
  '<span class="readerhint">At least 30 eligible reviews and 3 misses per profile. Fits only one stability multiplier (not full FSRS parameter optimization); changes future reviews, not existing due dates.</span>';
 host.appendChild(buttons);
 const feedback=document.createElement('p');feedback.id='fsrsCalibrationStatus';feedback.className='readerhint';feedback.setAttribute('role','status');host.appendChild(feedback);
 const insights=document.createElement('details');insights.className='srs-options';insights.id='fsrsStage2Insights';
 insights.innerHTML='<summary>FSRS insights · 30-day workload</summary>'+
  '<p class="readerhint">Scheduled = current due dates. Projected = all future grades Good with no new cards introduced (FSRS enabled only). These are scenarios, not guaranteed predictions.</p>'+
  '<div id="fsrsStage2Metrics"></div><div id="fsrsStage2Forecast" class="srs-forecast"></div>'+
  '<p class="readerhint">Anki TSV downloads retain stable note GUIDs. Anki schedules imported cards independently: TSV does not transfer review history, due dates or native FSRS state. Use full-project JSON backup for Tlahtōlli progress.</p>';
 host.insertAdjacentElement('afterend',insights);
 const style=document.createElement('style');
 style.textContent='.fsrs-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(175px,1fr));gap:8px;margin:12px 0}.fsrs-card{border:1px solid var(--line);border-radius:9px;padding:12px;font-size:.83rem}.fsrs-card strong{display:block;margin-bottom:6px}.fsrs-day{display:grid;grid-template-columns:53px 1fr 64px;gap:9px;align-items:center;font-size:.79rem}.fsrs-track{height:9px;border-radius:9px;background:var(--line);overflow:hidden}.fsrs-bar{height:100%;background:var(--accent)}';
 document.head.appendChild(style);
 function report(){
  const now=Date.now(),today=S.midnight(now),DAY=86400000,settings=F.getSettings();
  const scheduled=Array(30).fill(0),projected=Array(30).fill(0),stats={};
  for(const kind of ['vocabulary','reverse','paradigm'])stats[kind]={seen:0,due:0,estimated:0,prob:0,attempts:0,correct:0};
  for(const [key,r] of Object.entries(studyRecords)){
   if(!r||r.suspended)continue;
   const kind=F.kind(key),q=stats[kind];
   if(r.last){q.seen++;
    if(r.fsrs?.version===5&&Number.isFinite(r.fsrs.stability)&&r.fsrs.stability>0){
     q.estimated++;q.prob+=F.retrievability(r.fsrs.stability,Math.max(0,(now-(r.fsrs.lastReview||r.last))/DAY));
    }
   }
   if(r.last&&r.due<=now)q.due++;
   if(Number.isFinite(r.due)&&r.due>0){
    let at=Math.max(today,r.due),slot=Math.floor((at-today)/DAY);
    if(slot>=0&&slot<30)scheduled[slot]++;
    if(settings.enabled){
     let sim=r;
     for(let i=0;i<45&&at<today+30*DAY;i++){
      slot=Math.floor((at-today)/DAY);if(slot>=0&&slot<30)projected[slot]++;
      const next=F.schedule(sim,'good',at,key);
      if(!next||!Number.isFinite(next.due)||next.due<=at)break;
      sim=next;at=next.due;
     }
    }
   }
   for(const event of r.history||[]){
    if(event?.wasReview&&event.at>=now-30*DAY&&event.at<=now){
     q.attempts++;if(event.grade!=='again')q.correct++;
    }
   }
  }
  const titles={vocabulary:'Vocabulary',reverse:'Reverse vocabulary',paradigm:'Conjugations'};
  document.getElementById('fsrsStage2Metrics').innerHTML='<div class="fsrs-cards">'+
   Object.entries(stats).map(([kind,q])=>'<div class="fsrs-card"><strong>'+titles[kind]+'</strong>'+
    q.seen+' studied · '+q.due+' due<br>Model recall now: '+
    (q.estimated?Math.round(100*q.prob/q.estimated)+'%':'not enough data')+
    '<br>Last 30 days: '+(q.attempts?Math.round(100*q.correct/q.attempts)+'% ('+q.attempts+' reviews)':'not enough data')+
    '<br>Calibration ×'+settings.scales[kind].toFixed(2)+'</div>').join('')+'</div>';
  const max=Math.max(1,...scheduled,...projected);
  document.getElementById('fsrsStage2Forecast').innerHTML=
   '<p class="readerhint">'+(settings.enabled?'Scheduled / Good-only projected':'Scheduled only (enable FSRS to simulate)')+
   '; includes overdue cards today</p>'+
   scheduled.map((n,i)=>{
    const label=new Date(today+i*DAY).toLocaleDateString(undefined,{month:'short',day:'numeric'});
    return '<div class="fsrs-day"><span>'+label+'</span><div class="fsrs-track"><div class="fsrs-bar" style="width:'+
     (100*n/max).toFixed(1)+'%"></div></div><span>'+n+(settings.enabled?' / '+projected[i]:'')+'</span></div>';
   }).join('');
 }
 document.getElementById('fsrsCalibrate').onclick=()=>{
  const outcomes=F.optimize(studyRecords);
  feedback.textContent=Object.entries(outcomes).map(([type,r])=>
   type+': '+r.count+' eligible / '+r.misses+' missed — '+
   (r.updated?'calibrated ×'+r.scale.toFixed(2):'insufficient history')).join(' · ')+
   '. Existing due dates were not modified.';
  if(insights.open)report();
 };
 insights.addEventListener('toggle',()=>{if(insights.open)report();});
 const save=document.getElementById('fsrsSave'),before=save.onclick;
 save.onclick=()=>{before();if(insights.open)report();};
 const oldRate=S.rate;S.rate=function(...args){const result=oldRate(...args);if(insights.open)report();return result;};
 const oldUndo=S.undoLast;S.undoLast=function(...args){const result=oldUndo(...args);if(insights.open)report();return result;};
})();
