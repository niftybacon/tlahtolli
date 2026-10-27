/* Wire adjustable scheduler into both study modes, with local-only settings. */
(function initializeTlahtolliSRS(){
 const S=TlahtolliSRS;
 const host=document.querySelector('#studyView .study-controls');
 if(!host)return;
 host.insertAdjacentHTML('afterend',
  '<div class="srs-actions"><span id="srsDaily" aria-live="polite"></span>'+
  '<button class="btn" type="button" id="srsUndo">Undo last review</button>'+
  '<button class="btn" type="button" id="srsAnkiVocab">↓ Anki vocabulary</button>'+
  '<button class="btn" type="button" id="srsAnkiVerbs">↓ Anki conjugations</button></div>'+
  '<details class="srs-options" id="srsOptions"><summary>Advanced study options · scheduling, limits and difficulty</summary>'+
  '<p class="readerhint"><strong>Anki-inspired, not Anki FSRS.</strong> Learning steps, review intervals, daily limits and leeches are configurable. Settings and progress stay in this browser. Saving settings affects future reviews, not existing due dates.</p>'+
  '<div class="srs-settings-row"><label>Preset<select id="srsPreset">'+
  '<option value="custom">Current / custom</option><option value="balanced">Balanced</option>'+
  '<option value="intensive">Intensive</option><option value="gentle">Gentle</option></select></label>'+
  '<button class="btn primary" id="srsSave" type="button">Save study options</button></div>'+
  '<div class="srs-fields" id="srsFields"></div>'+
  '<div class="srs-settings-row"><label>Card order<select id="srsOrder">'+
  '<option value="due">Earliest due first</option><option value="new">New cards first</option>'+
  '<option value="alphabetical">Alphabetical</option></select></label>'+
  '<label>Leeches<select id="srsLeechAction"><option value="tag">Mark as difficult</option>'+
  '<option value="suspend">Suspend card</option></select></label>'+
  '<label class="srs-checkbox"><input type="checkbox" id="srsBury"> Hide other conjugations of the same verb after reviewing one today</label></div>'+
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
  S.applySettings(config);fill(S.getSettings());
  $('srsPreset').value='custom';
  $('srsFeedback').textContent='Saved. Existing scheduled reviews have not been moved.';
 };
 $('srsUndo').onclick=()=>S.undoLast();
 $('srsAnkiVocab').onclick=()=>S.exportAnki(false);
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
