/* Tlahtōlli per-account study sync. Private SRS records only; no dictionary edits uploaded. */
(function(){
'use strict';
const cfg=window.TLAHTOLLI_CLOUD_CONFIG||{};
const $=id=>document.getElementById(id);
const TABLE='tlahtolli_study_cards';
const GUEST='tlahtolli_guest_study_backup_v1';
const ACTIVE='tlahtolli_active_cloud_user_v1';
let api=null,user=null,ready=false,inFlight=false,pending=false,clock=null;
// Read-only bridge for account-scoped advanced study preferences.
window.TlahtolliCloudSession={get client(){return api},get user(){return user},get ready(){return ready}};
const isConfigured=()=>/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(cfg.url||'') && /^sb_publishable_|^eyJ/.test(cfg.publishableKey||'');
const status=s=>{const el=$('cloudStatus');if(el)el.textContent=s};
const byId=id=>$(id);
const getLocal=()=>{try{return sanitizeStudyRecords(studyRecords)}catch{return {}}};
const parse=val=>{try{return sanitizeStudyRecords(JSON.parse(val||'{}'))}catch{return {}}};
const stamp=r=>Number(r&&r.last)||0;
function merge(local,remote){
 const merged={...remote};
 for(const [key,record] of Object.entries(local)){
  if(!merged[key]||stamp(record)>stamp(merged[key]))merged[key]=record;
 }
 return merged;
}
function install(records){
 studyRecords=sanitizeStudyRecords(records);
 // Do not call saveStudyRecords() here: that method notifies the cloud change listener.
 try{localStorage.setItem(studyStorageKey,JSON.stringify(studyRecords))}catch{status('Cannot save the downloaded study data on this device. Export a backup.')}
 if(typeof renderStudy==='function')renderStudy();
 if(typeof renderDrill==='function')renderDrill();
}
function renderUser(){
 const logged=!!user;
 const forms=byId('cloudForms'),loggedUI=byId('cloudLogged');
 if(forms){forms.hidden=logged;forms.style.display=logged?'none':'flex';}
 if(loggedUI){loggedUI.hidden=!logged;loggedUI.style.display=logged?'block':'none';}
 if(byId('cloudIdentity'))byId('cloudIdentity').textContent=user?.email||'Signed in';
}
async function pull(){
 const {data,error}=await api.from(TABLE).select('card_key,record').eq('user_id',user.id).limit(20000);
 if(error)throw error;
 const records={};
 for(const row of data||[])if(typeof row.card_key==='string'&&row.record&&typeof row.record==='object'&&row.card_key!=='__tlahtolli_preferences_v1__')records[row.card_key]=row.record;
 return sanitizeStudyRecords(records);
}
async function activate(account){
 if(!account)return;
 ready=false;user=account;renderUser();status('Loading private study history…');
 const oldActive=localStorage.getItem(ACTIVE);
 const same=oldActive===user.id;
 // Only guest records can be explicitly imported into a new account.
 if(!same && !oldActive && !localStorage.getItem(GUEST)){
  try{localStorage.setItem(GUEST,JSON.stringify(getLocal()))}catch{}
 }
 const remote=await pull();
 const local=same?getLocal():{};
 const combined=merge(local,remote);
 install(combined);localStorage.setItem(ACTIVE,user.id);
 ready=true;
 window.dispatchEvent(new Event('tlahtolli:accountReady'));
 if(byId('cloudImport'))byId('cloudImport').hidden=!Object.keys(parse(localStorage.getItem(GUEST))).length;
 status('Account connected · '+Object.keys(combined).length+' saved review cards. Changes sync automatically.');
 if(same && Object.keys(local).some(k=>!remote[k]||stamp(local[k])>stamp(remote[k])))queue();
}
async function push(){
 if(!api||!user||!ready||inFlight){pending=true;return}
 inFlight=true;pending=false;
 try{
  const remote=await pull(),local=getLocal(),combined=merge(local,remote),changes=[];
  for(const [key,rec] of Object.entries(local)){
   if(!remote[key]||stamp(rec)>stamp(remote[key]))changes.push({user_id:user.id,card_key:key,record:rec});
  }
  for(let i=0;i<changes.length;i+=200){
   const {error}=await api.from(TABLE).upsert(changes.slice(i,i+200),{onConflict:'user_id,card_key'});
   if(error)throw error;
  }
  if(JSON.stringify(combined)!==JSON.stringify(local))install(combined);
  status('Synced '+new Date().toLocaleTimeString()+' · '+Object.keys(combined).length+' saved cards'+(changes.length?' · '+changes.length+' uploaded':''));
 }catch(e){status('Offline or sync error: '+(e?.message||String(e))+'. Records remain on this device; retry Sync now.')}
 finally{inFlight=false;if(pending){pending=false;queue()}}
}
function queue(){if(!ready)return;if(clock)clearTimeout(clock);clock=setTimeout(push,1200)}
async function signIn(e){
 e.preventDefault();
 if(!api)return;
 const email=byId('cloudEmail').value.trim(),password=byId('cloudPassword').value;
 if(!email||!password){status('Enter your email and password.');return}
 status('Signing in…');
 try{
  const {data,error}=await api.auth.signInWithPassword({email,password});
  if(error)throw error;
  byId('cloudPassword').value='';
  if(data.user)await activate(data.user);
 }catch(e){status('Sign-in failed: '+(e?.message||'Unknown error'))}
}
async function signUp(){
 if(!api)return;
 const email=byId('cloudEmail').value.trim(),password=byId('cloudPassword').value;
 if(!email||password.length<8){status('Enter an email and a password of at least 8 characters.');return}
 try{
  const {data,error}=await api.auth.signUp({email,password,options:{emailRedirectTo:location.origin+location.pathname}});
  if(error)throw error;
  byId('cloudPassword').value='';
  status(data.session?'Account created. Loading study history…':'Account created; check your email for the confirmation link.');
  if(data.session&&data.user)await activate(data.user);
 }catch(e){status('Registration failed: '+(e?.message||'Unknown error'))}
}
async function signOut(){
 try{
  ready=false;const {error}=await api.auth.signOut();if(error)throw error;
  localStorage.removeItem(ACTIVE);user=null;install(parse(localStorage.getItem(GUEST)));renderUser();
  window.dispatchEvent(new Event('tlahtolli:accountSignedOut'));
  if(byId('cloudImport'))byId('cloudImport').hidden=true;
  status('Signed out; the original guest reviews have been restored on this device.');
 }catch(e){status('Could not sign out: '+(e?.message||'Unknown error'))}
}
async function importGuest(){
 if(!user||!ready)return;
 const imported=parse(localStorage.getItem(GUEST));
 const count=Object.keys(imported).length;
 if(!count){status('No older local review history is available to import.');return}
 if(!confirm('Import '+count+' saved local review cards into this account? Newer reviews are retained. This does not delete your backup.'))return;
 install(merge(imported,getLocal()));
 await push();
 status('Imported local review history into this account. Your guest backup remains on this device.');
}
function mount(){
 const root=$('studyView');if(!root)return;
 const el=document.createElement('section');el.className='panel';el.style.marginBottom='18px';el.setAttribute('aria-label','Cloud study account');
 el.innerHTML='<div class="panelhead"><span class="eyebrow">Momachtia · Account synchronization</span><h3>Private study account</h3><p>Keep your review history across devices. Guest study data stays local until you explicitly import it.</p></div>'+
 '<div style="padding:0 18px 18px"><p id="cloudStatus" role="status" aria-live="polite">Preparing account sync…</p>'+
 '<form id="cloudForms" style="display:flex;gap:10px;flex-wrap:wrap;align-items:end"><label>Email <input id="cloudEmail" type="email" autocomplete="username" required style="display:block;max-width:320px;width:100%;padding:9px"></label><label>Password <input id="cloudPassword" type="password" autocomplete="current-password" required minlength="8" style="display:block;max-width:320px;width:100%;padding:9px"></label><button class="btn primary" type="submit">Sign in</button><button class="btn" type="button" id="cloudSignup">Create account</button></form>'+
 '<div id="cloudLogged" hidden><p>Signed in as <strong id="cloudIdentity"></strong></p><div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn primary" id="cloudSync" type="button">↻ Sync now</button><button class="btn" id="cloudImport" type="button" hidden>Import old local reviews</button><button class="btn" id="cloudSignout" type="button">Sign out</button></div></div>'+
 '<p class="readerhint">This syncs vocabulary, reverse, and conjugation cards including FSRS review history. Advanced SRS/FSRS preferences now sync via the separate settings controls below. Personal dictionary edits and passages remain device-local. Keep a full-project JSON backup before switching devices.</p></div>';
 root.insertBefore(el,root.firstChild);
 $('cloudForms').addEventListener('submit',signIn);
 $('cloudSignup').addEventListener('click',signUp);
 $('cloudSignout').addEventListener('click',signOut);
 $('cloudSync').addEventListener('click',push);
 $('cloudImport').addEventListener('click',importGuest);
 renderUser();
}
async function start(){
 mount();
 if(!isConfigured()){status('Account sync is not configured yet. The site owner must add the Supabase project URL and publishable key to cloud-config.js. Local study still works.');byId('cloudForms').hidden=true;byId('cloudForms').style.display='none';return}
 if(!window.supabase?.createClient){
  try{await new Promise((resolve,reject)=>{
   const script=document.createElement('script');
   script.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
   script.async=true;script.onload=resolve;script.onerror=()=>reject(new Error('library unavailable'));
   document.head.append(script);
  });}catch{
   status('Supabase library could not load. Reload while online; local study still works.');
   byId('cloudForms').hidden=true;byId('cloudForms').style.display='none';return;
  }
 }
 if(!window.supabase?.createClient){status('Account library unavailable; local study still works.');return}
 api=window.supabase.createClient(cfg.url,cfg.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
 try{
  const {data,error}=await api.auth.getSession();if(error)throw error;
  if(data.session?.user)await activate(data.session.user);
  else status('Sign in or create an account. Guest history stays only on this device.');
 }catch(e){status('Account service unavailable: '+(e?.message||String(e))+'. Local study still works.')}
 window.addEventListener('tlahtolli:studySaved',queue);
 window.addEventListener('online',queue);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)queue()});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
