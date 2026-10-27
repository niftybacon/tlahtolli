/* Wire adjustable scheduler into both study modes, with local-only settings. */
(function initializeTlahtolliSRS(){
 const S=TlahtolliSRS;
 const host=document.querySelector('#studyView .study-controls');
 if(!host)return;
 host.insertAdjacentHTML('afterend',
  '<div class="srs-actions"><span id="srsDaily" aria-live="polite"></span>'+
  '<button class="btn" type="button" id="srsUndo">Undo last review</button>'+
  '<button class="btn" type="button" id="srsAnkiVocab">↓ Anki vocabulary</button>'+
  '<button class="btn" type="button" id="srsAnkiReverse">↓ Anki reverse cards</button>'+
  '<button class="btn" type="button" id="srsAnkiVerbs">↓ Anki conjugations</button></div>'+
  '<details class="srs-options" id="srsOptions"><summary>Advanced study options · scheduling, limits and difficulty</summary>'+
  '<p class="readerhint"><strong>Anki-inspired, not Anki FSRS.</strong> Learning steps, review intervals, daily limits and leeches are configurable. Settings and progress stay in this browser. Saving settings affects future reviews, not existing due dates.</p>'+
  '<div class="srs-settings-row"><label>Preset<select id="srsPreset">'+
  '<option value="custom">Current / custom</option><option value="balanced">Balanced</option>'+ 
  '<option value="screenshot">Light · 2 new / 5 reviews</option>'+
  '<option value="intensive">Intensive</option><option value="gentle">Gentle</option></select></label>'+
  '<button class="btn primary" id="srsSave" type="button">Save study options</button>'+
  '<button class="btn" id="srsResume" type="button">Resume suspended cards</button></div>'+
  '<div class="srs-fields" id="srsFields"></div>'+
  '<div class="srs-settings-row"><label>Card order<select id="srsOrder">'+
  '<option value="due">Earliest due first</option><option value="new">New cards first</option>'+
  '<option value="alphabetical">Alphabetical</option></select></label>'+
  '<label>Leeches<select id="srsLeechAction"><option value="tag">Mark as difficult</option>'+
  '<option value="suspend">Suspend card</option></select></label>'+
  '<label class="srs-checkbox"><input type="checkbox" id="srsBury"> Hide other conjugations of the same verb after reviewing one today</label></div>'+ 
  '<div class="srs-settings-row"><label>New card order<select id="srs_newOrder"><option value="added">Dictionary order</option><option value="alphabetical">Alphabetical</option><option value="random">Daily stable shuffle</option></select></label>'+ 
  '<label>Review card order<select id="srs_reviewOrder"><option value="due">Oldest due first</option><option value="hardest">Lowest ease first</option><option value="random">Daily stable shuffle</option></select></label>'+ 
  '<label class="srs-checkbox"><input type="checkbox" id="srsReviewFirst"> Show due review cards before new cards</label>'+ 
  '<label class="srs-checkbox"><input type="checkbox" id="srsAutoReveal"> Automatically reveal when answer timer expires (never auto-grade)</label></div>'+
  '<p class="readerhint" id="srsFeedback" role="status"></p></details>');
 const labels=S.FIELDS;
 $('srsFields').innerHTML=labels.map(pair=>{
  const key=pair[0],label=pair[1],type=['learning','relearning'].includes(key)?'text':'number';
  const whole=['newLimit','reviewLimit','graduating','easyDays','maxInterval','minLapse','leechThreshold'].includes(key);
  return '<label for="srs_'+key+'">'+safe(label)+
   '<input id="srs_'+key+'" type="'+type+'" '+(type==='number'?'step="'+(whole?'1':'0.05')+'"':'')+'></label>';
 }).join('');
 function fill(data){
  for(const [key] of labels)$('srs_'+key).value=data[key];
  $('srsOrder').value=data.order;$('srsLeechAction').value=data.leechAction;$('srsBury').checked=data.burySiblings;
  $('srs_newOrder').value=data.newOrder;$('srs_reviewOrder').value=data.reviewOrder;
  $('srsReviewFirst').checked=data.reviewFirst;$('srsAutoReveal').checked=data.autoReveal;
 }
 fill(S.getSettings());
 $('srsPreset').onchange=()=>{
  const chosen=S.PRESETS[$('srsPreset').value];
  if(chosen){fill(chosen);$('srsFeedback').textContent='Preset loaded into the form. Save to apply.';}
 };
 $('srsSave').onclick=()=>{
  const config={};
  for(const [key] of labels)config[key]=$('srs_'+key).value;
  config.order=$('srsOrder').value;
  config.leechAction=$('srsLeechAction').value;
  config.burySiblings=$('srsBury').checked;
  config.newOrder=$('srs_newOrder').value;config.reviewOrder=$('srs_reviewOrder').value;
  config.reviewFirst=$('srsReviewFirst').checked;config.autoReveal=$('srsAutoReveal').checked;
  S.applySettings(config);fill(S.getSettings());
  $('srsPreset').value='custom';
  $('srsFeedback').textContent='Saved. Existing scheduled reviews have not been moved.';
 };
 $('srsUndo').onclick=()=>S.undoLast();
 $('srsAnkiVocab').onclick=()=>S.exportAnki(false);
 $('srsAnkiReverse').onclick=()=>S.exportAnki('reverse');
 $('srsResume').onclick=()=>S.resumeSuspended();
 $('srsAnkiVerbs').onclick=()=>S.exportAnki(true);
 const priorStudyRender=renderStudy;
 studyQueue=()=>S.queueWords();
 drillQueue=()=>S.queueDrill();
 renderStudy=function(){priorStudyRender();S.preview('studyCard',studyCurrentKey);S.statsText()};
 const priorDrillRender=renderDrill;
 renderDrill=function(){priorDrillRender();S.preview('drillCard',drillCurrentKey);S.statsText()};
 gradeStudy=grade=>{if(studyRevealed)S.rate(studyCurrentKey,grade,$('studySubset').value)};
 gradeDrill=grade=>{if(drillRevealed)S.rate(drillCurrentKey,grade,$('drillSubset').value)};
 $('studySubset').addEventListener('change',()=>{S.applySettings(S.getSettings())});
 $('drillSubset').addEventListener('change',()=>{S.applySettings(S.getSettings())});
 document.addEventListener('keydown',e=>{
  if($('studyView').classList.contains('hidden')||['INPUT','SELECT','TEXTAREA'].includes(document.activeElement?.tagName))return;
  if(e.key===' '&&!studyRevealed&&$('studyReveal')){e.preventDefault();$('studyReveal').click();return}
  const grade={'1':'again','2':'hard','3':'good','4':'easy'}[e.key];
  if(grade&&studyRevealed){e.preventDefault();gradeStudy(grade)}
 });
 $('studyExport').onclick=()=>{
  const rows=[['Lemma key','Headword','Phase','Reviews','Lapses','Interval days','Ease','Last grade','Last reviewed ISO','Next due ISO','Suspended','Review history JSON']];
  for(const [key,r] of Object.entries(studyRecords)){
   const w=words.find(word=>studyKey(word)===key);
   rows.push([key,w?.word||'Paradigm card',r.phase||'legacy',r.reps,r.lapses,r.interval||'',
    r.ease||'',r.lastGrade||'',r.last?new Date(r.last).toISOString():'',r.due?new Date(r.due).toISOString():'',
    r.suspended?'yes':'no',JSON.stringify(r.history||[])]);
  }
  download('tlahtolli-study-records.csv',rowsToText(rows,','),'text/csv');
  message('Detailed local review history exported. Full JSON backup also preserves study settings.');
 };
 renderStudy();renderDrill();
})();
/* BEGIN TLAHTOLLI SRS V3 INSIGHTS */
(function initializeTlahtolliStudyInsights(){
 const root=document.querySelector('#studyView .srs-actions'),options=$('srsOptions');
 if(!root||!options)return;
 const timer=document.createElement('span');
 timer.id='srsTimer';timer.className='srs-timer';timer.setAttribute('aria-live','off');
 timer.title='Optional study-card timer; never grades a card automatically.';
 root.insertBefore(timer,root.querySelector('#srsUndo'));
 const details=document.createElement('details');details.className='srs-options';details.id='srsInsights';
 details.innerHTML='<summary>Study insights · retention and next 7 days</summary>'+
  '<p class="readerhint">A descriptive forecast of scheduled due dates, not an FSRS memory prediction. Actual retention uses the first graded review on each day (Again = missed).</p>'+
  '<div id="srsRetention" role="status" aria-live="polite"></div>'+
  '<div id="srsForecast" class="srs-forecast" role="img" aria-label="Scheduled review counts over the next seven calendar days"></div>';
 options.insertAdjacentElement('afterend',details);
 const style=document.createElement('style');
 style.textContent='.srs-timer{font-variant-numeric:tabular-nums;font-size:.86rem;color:var(--muted)}.srs-forecast{display:grid;gap:8px;margin:12px 0}.srs-forecast-row{display:grid;grid-template-columns:56px 1fr 36px;gap:8px;align-items:center;font-size:.82rem}.srs-forecast-track{height:10px;border-radius:8px;background:var(--line);overflow:hidden}.srs-forecast-fill{background:var(--accent);height:100%}.srs-insight-metrics{display:flex;flex-wrap:wrap;gap:12px;font-size:.88rem}.srs-insight-metrics b{font-variant-numeric:tabular-nums}';
 document.head.appendChild(style);
 function report(){
  const now=Date.now(),today=TlahtolliSRS.midnight(now),days=Array.from({length:7},()=>0);
  let correct=0,total=0,reviewed=0,difficult=0;
  for(const rec of Object.values(studyRecords)){
   if(!rec||rec.suspended)continue;
   if(rec.last)reviewed++;
   if(rec.leech)difficult++;
   if(rec.due>=today&&rec.due<today+7*86400000&&rec.phase==='review'){
    const day=Math.floor((rec.due-today)/86400000);days[day]++;
   }
   const seen=new Set();
   for(const event of rec.history||[]){
    if(!event.wasReview||event.at<now-30*86400000)continue;
    const day=TlahtolliSRS.midnight(event.at);
    if(seen.has(day))continue;seen.add(day);total++;
    if(event.grade!=='again')correct++;
   }
  }
  $('srsRetention').innerHTML='<div class="srs-insight-metrics">'+
   '<span>30-day first-review retention: <b>'+(total?Math.round(100*correct/total)+'%':'Not enough data')+'</b> ('+total+' attempts)</span>'+
   '<span>Cards reviewed: <b>'+reviewed+'</b></span>'+
   '<span>Flagged difficult: <b>'+difficult+'</b></span></div>';
  const maximum=Math.max(1,...days);
  $('srsForecast').innerHTML=days.map((n,i)=>{
   const d=new Date(today+i*86400000),label=d.toLocaleDateString(undefined,{weekday:'short'});
   return '<div class="srs-forecast-row"><span>'+safe(label)+'</span>'+
    '<div class="srs-forecast-track"><div class="srs-forecast-fill" style="width:'+Math.round(n/maximum*100)+'%"></div></div>'+
    '<strong>'+n+'</strong></div>';
  }).join('');
 }
 details.addEventListener('toggle',()=>{if(details.open)report()});
 let key='',stage='',began=Date.now(),fired=false;
 function tick(){
  const opts=TlahtolliSRS.getSettings(),active=!$('studyView').classList.contains('hidden');
  const selected=studyCurrentKey||'',shown=studyRevealed?'answer':'question';
  if(!active||!selected||!opts.timerSeconds){timer.textContent='';key='';return;}
  if(selected!==key||shown!==stage){key=selected;stage=shown;began=Date.now();fired=false;}
  if(shown==='answer'){timer.textContent='';return;}
  const elapsed=Math.floor((Date.now()-began)/1000),remaining=Math.max(0,opts.timerSeconds-elapsed);
  timer.textContent='Time '+remaining+'s';
  if(remaining===0&&opts.autoReveal&&!fired){
   fired=true;const button=$('studyReveal');if(button)button.click();
  }
 }
 window.setInterval(tick,1000);
 const oldSave=$('srsSave').onclick;
 $('srsSave').onclick=()=>{oldSave();key='';stage='';began=Date.now();report();};
 const oldUndo=$('srsUndo').onclick;
 $('srsUndo').onclick=()=>{oldUndo();report();};
 const oldExport=$('studyExport').onclick;
 $('studyExport').onclick=()=>{oldExport();};
 report();
})();
 /* END TLAHTOLLI SRS V3 INSIGHTS */
