/* Tlahtōlli cloud preferences v1 — uses the existing RLS-protected study_cards table.
   Only preferences are synchronized here; cloud-sync.js owns actual review cards and auth. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const KEY='__tlahtolli_preferences_v1__';
const TABLE='tlahtolli_study_cards';
const OWNER_KEY='tlahtolli_preferences_owner_v1';
const GUEST_KEY='tlahtolli_guest_preferences_v1';
const SIGNED_OUT='tlahtolli_preferences_signed_out_v1';
const baseKey=id=>'tlahtolli_preferences_baseline_v1:'+id;
let id=null,loading=false,pending=false,force=false,conflict=false,applying=false,revision=0,task=null,busy=false;
const session=()=>window.TlahtolliCloudSession;
const valid=p=>p&&typeof p==='object'&&!Array.isArray(p)&&p.srs&&typeof p.srs==='object'&&!Array.isArray(p.srs)
 &&p.fsrs&&typeof p.fsrs==='object'&&!Array.isArray(p.fsrs);
const read=()=>({srs:TlahtolliSRS.getSettings(),fsrs:TlahtolliFSRS.getSettings()});
const defaults=()=>({srs:TlahtolliSRS.config(TlahtolliSRS.DEFAULT),
 fsrs:{enabled:false,targets:{vocabulary:.9,reverse:.9,paradigm:.9},scales:{vocabulary:1,reverse:1,paradigm:1}}});
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const status=msg=>{if($('cloudPreferencesStatus'))$('cloudPreferencesStatus').textContent=msg};
const current=()=>session()?.ready&&session()?.user?.id===id;
function baseline(){
 try{const v=JSON.parse(localStorage.getItem(baseKey(id))||'null');return valid(v)?v:null}catch{return null}
}
function mark(v){
 try{localStorage.setItem(baseKey(id),JSON.stringify(v))}catch{status('Settings work, but browser storage could not retain the sync marker.')}
}
function apply(v){
 if(!valid(v))return false;
 applying=true;
 try{
  TlahtolliSRS.applySettings(v.srs);
  const next=TlahtolliFSRS.setSettings(v.fsrs);
  if($('fsrsEnable'))$('fsrsEnable').checked=next.enabled;
  for(const [type,field] of [['vocabulary','fsrsTargetVocabulary'],['reverse','fsrsTargetReverse'],['paradigm','fsrsTargetParadigm']]){
   const control=$(field);if(control)control.value=Number(next.targets[type]).toFixed(2);
  }
  if($('fsrsFeedback'))$('fsrsFeedback').textContent='Account retention preferences loaded; existing card due dates were not changed.';
  if($('srsFeedback'))$('srsFeedback').textContent='Account study options loaded; existing card due dates were not changed.';
  return true;
 }finally{applying=false}
}
async function fetchPreferences(){
 const client=session()?.client;
 if(!client||!id)throw Error('Not signed in');
 const {data,error}=await client.from(TABLE).select('card_key,record')
  .eq('user_id',id).eq('card_key',KEY).limit(1);
 if(error)throw error;
 const item=data?.[0]?.record;
 return item?.kind==='preferences'&&valid(item.settings)?item.settings:null;
}
async function savePreferences(p){
 if(!current())throw Error('Account disconnected');
 const {error}=await session().client.from(TABLE).upsert({
  user_id:id,card_key:KEY,record:{kind:'preferences',version:1,settings:p,updatedMs:Date.now()}
 },{onConflict:'user_id,card_key'});
 if(error)throw error;
}
function schedule(){
 if(!current()||loading||conflict)return;
 if(task)clearTimeout(task);
 task=setTimeout(()=>{task=null;sync()},1200);
}
async function sync(){
 if(!current()||loading||busy){if(busy)pending=true;return}
 busy=true;
 const activeId=id,startedRevision=revision;
 try{
  const remote=await fetchPreferences();
  if(!current()||id!==activeId)return;
  const local=read(),base=baseline();
  if(pending&&!conflict){
   if(!force&&remote&&base&&!equal(remote,base)&&!equal(remote,local)){
    conflict=true;
    status('Settings changed on both devices. Choose Load account settings or Save device settings; no settings were overwritten.');
   }else if(!force&&remote&&!base&&!equal(remote,local)){
    conflict=true;
    status('Account and device have different settings. Choose which version to keep.');
   }else{
    await savePreferences(local);
    mark(local);force=false;
    if(revision===startedRevision)pending=false;
    status('Advanced SRS and FSRS options synchronized with your account.');
   }
  }else if(!conflict&&remote){
   if(equal(local,remote)){
    mark(remote);
    status('Advanced settings are synchronized.');
   }else if(!base||equal(local,base)||equal(local,defaults())){
    // A device with unsaved custom settings and no baseline requires manual selection.
    if(!base&&!equal(local,defaults())){
     conflict=true;status('This device has custom settings. Choose Load account settings or Save device settings.');
    }else{
     apply(remote);mark(read());
     status('Downloaded advanced SRS options and FSRS retention targets from your account.');
    }
   }else if(equal(remote,base)){
    pending=true;status('Device settings changed while offline. Uploading changes…');
   }else{
    conflict=true;status('Settings changed on both devices. Choose which version to keep.');
   }
  }else if(!remote&&!conflict){
   status('No advanced settings saved in your account yet. Choose Save device settings to account once.');
  }
 }catch(e){
  status('Settings sync unavailable: '+(e?.message||String(e))+'. Your existing local settings are intact; try Sync now.');
 }finally{
  busy=false;
  if(pending&&!conflict&&current())schedule();
 }
}
async function activate(){
 const acc=session();if(!acc?.ready||!acc.user?.id)return;
 const next=acc.user.id;
 loading=true;
 const prev=localStorage.getItem(OWNER_KEY);
 const signedOut=localStorage.getItem(SIGNED_OUT)==='1';
 if(!prev&&!localStorage.getItem(GUEST_KEY)){
  try{localStorage.setItem(GUEST_KEY,JSON.stringify(read()))}catch{}
 }
 id=next;pending=false;force=false;conflict=false;
 status('Checking your account’s saved study options…');
 try{
  const remote=await fetchPreferences();
  if(!current())return;
  const local=read(),base=baseline();
  if(remote){
   if(signedOut||(prev&&prev!==id)||equal(local,remote)||equal(local,defaults())||(base&&equal(local,base))){
    apply(remote);mark(read());
    status('Account settings loaded: advanced SRS and FSRS preferences are now synchronized.');
   }else if(base&&equal(remote,base)){
    pending=true;status('Unsynced changes on this device. Uploading them safely…');
   }else{
    conflict=true;status('Different customized settings exist on this device and in your account. Choose Load account settings or Save device settings.');
   }
  }else if(prev&&prev!==id){
   apply(defaults());
   status('This account has no cloud settings yet. Save its desired preferences to the account.');
  }else{
   status('Your account has no saved advanced settings yet. Click Save device settings to account once; future changes will then sync automatically.');
  }
  localStorage.setItem(OWNER_KEY,id);localStorage.removeItem(SIGNED_OUT);
 }catch(e){
  status('Could not read account settings: '+(e?.message||String(e))+'. Nothing was replaced.');
 }finally{loading=false;if(pending&&!conflict)schedule()}
}
async function chooseSave(){
 if(!current())return;
 conflict=false;force=true;pending=true;revision++;
 status('Saving this device’s study preferences to your account…');
 await sync();
}
async function chooseLoad(){
 if(!current())return;
 try{
  const remote=await fetchPreferences();
  if(!remote){status('Your account has no saved settings. Use Save device settings to account first.');return}
  if(!equal(read(),remote)&&!window.confirm('Replace this device’s advanced study settings with the account version? Saved card review history and due dates will stay unchanged.'))return;
  apply(remote);mark(read());pending=false;force=false;conflict=false;
  status('Advanced study settings downloaded from your account.');
 }catch(e){status('Could not load settings: '+(e?.message||String(e)))}
}
function changed(){
 if(applying||!current())return;
 pending=true;revision++;
 if(conflict){status('Settings saved on this device. Choose Load account settings or Save device settings to resolve the conflict.');return}
 status('Advanced options saved locally. Uploading account preferences…');
 schedule();
}
function signedOut(){
 if(task){clearTimeout(task);task=null}
 id=null;busy=false;pending=false;conflict=false;force=false;
 try{
  const guest=JSON.parse(localStorage.getItem(GUEST_KEY)||'null');
  apply(valid(guest)?guest:defaults());
 }catch{apply(defaults())}
 localStorage.setItem(SIGNED_OUT,'1');
 status('Signed out; guest study preferences restored on this device.');
}
function mount(){
 const parent=$('cloudLogged');
 if(!parent||$('cloudSavePreferences'))return;
 const p=document.createElement('div');
 p.style.marginTop='14px';
 p.innerHTML='<p id="cloudPreferencesStatus" role="status" aria-live="polite">Advanced settings are stored locally until you link them to your account.</p>'+
  '<div style="display:flex;flex-wrap:wrap;gap:10px">'+
  '<button type="button" class="btn" id="cloudSavePreferences">↑ Save device settings to account</button>'+
  '<button type="button" class="btn" id="cloudLoadPreferences">↓ Load account settings</button></div>'+
  '<p class="readerhint">Synchronizes advanced SRS settings and FSRS retention targets. Review card schedules remain separate. If devices disagree, choose which settings to keep.</p>';
 parent.appendChild(p);
 $('cloudSavePreferences').addEventListener('click',chooseSave);
 $('cloudLoadPreferences').addEventListener('click',chooseLoad);
 const syncButton=$('cloudSync');
 if(syncButton)syncButton.addEventListener('click',sync);
}
function init(){
 mount();
 window.addEventListener('tlahtolli:accountReady',activate);
 window.addEventListener('tlahtolli:accountSignedOut',signedOut);
 window.addEventListener('tlahtolli:settingsChanged',changed);
 window.addEventListener('online',()=>{if(current())sync()});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&current())sync()});
 if(session()?.ready&&session()?.user)activate();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
