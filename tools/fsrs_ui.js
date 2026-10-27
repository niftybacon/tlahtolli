/* Conservative FSRS opt-in. Stored browser-locally and included in full backup. */
(function initializeFSRSOptions(){
 const host=document.getElementById('srsOptions');if(!host)return;
 const panel=document.createElement('details');panel.className='srs-options';panel.id='fsrsOptions';
 panel.innerHTML='<summary>FSRS-5 · modern adaptive scheduling</summary>'+
 '<p class="readerhint">Opt-in. Existing review dates are preserved until you grade the card. Learning steps, daily limits, Undo, leech handling, statistics, and Anki TSV export remain available. Classical ease/interval factors do not control FSRS.</p>'+
 '<label class="srs-checkbox"><input type="checkbox" id="fsrsEnable"> Use FSRS-5 instead of the classic scheduler</label>'+
 '<p class="readerhint">Target recall for future reviews (changes do not reschedule existing due dates):</p>'+
 '<div class="srs-settings-row"><label>Vocabulary<select id="fsrsTargetVocabulary"></select></label>'+
 '<label>Reverse vocabulary<select id="fsrsTargetReverse"></select></label>'+
 '<label>Conjugations<select id="fsrsTargetParadigm"></select></label></div>'+
 '<button class="btn primary" type="button" id="fsrsSave">Save FSRS settings</button>'+
 '<p class="readerhint" id="fsrsFeedback" role="status"></p>';
 host.insertAdjacentElement('afterend',panel);
 const fields=[['vocabulary','fsrsTargetVocabulary'],['reverse','fsrsTargetReverse'],['paradigm','fsrsTargetParadigm']];
 for(const [,id] of fields){const sel=document.getElementById(id);
  for(let p=80;p<=97;p++){const opt=document.createElement('option');opt.value=(p/100).toFixed(2);opt.textContent=p+'%';sel.appendChild(opt);}
 }
 function fill(){const settings=TlahtolliFSRS.getSettings();document.getElementById('fsrsEnable').checked=settings.enabled;
  for(const [kind,id] of fields)document.getElementById(id).value=settings.targets[kind].toFixed(2);}
 fill();
 document.getElementById('fsrsSave').onclick=()=>{
  const existing=TlahtolliFSRS.getSettings(),targets={};
  for(const [kind,id] of fields)targets[kind]=Number(document.getElementById(id).value);
  TlahtolliFSRS.setSettings({...existing,enabled:document.getElementById('fsrsEnable').checked,targets});
  document.getElementById('fsrsFeedback').textContent='Saved. Existing due dates are unchanged.';
  studyCurrentKey='';drillCurrentKey='';renderStudy();renderDrill();
 };
})();
