/* Run with: node tools/test_srs_session.js */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const DAY=86400000,clock={now:Date.UTC(2026,9,29,12)};
class TestDate extends Date {static now(){return clock.now;}}
const storage=()=>{const raw={};return {getItem:k=>raw[k]??null,setItem:(k,v)=>{raw[k]=String(v);}}};
const elements={
 studySubset:{value:'due'},drillSubset:{value:'active'},drillVerb:{value:'all'},
 drillScope:{value:'core'},srsDaily:{textContent:''},srsUndo:{disabled:false}
};
const ctx={
 Date:TestDate,Math,JSON,localStorage:storage(),sessionStorage:storage(),
 Event:class{constructor(type){this.type=type;}},window:{dispatchEvent(){},setInterval(){}},
 words:[{word:'x',meaning:'word'}],studyRecords:{},studyCurrentKey:'',drillCurrentKey:'',
 studyRevealed:false,drillRevealed:false,FULL_VERB_PARADIGMS:{y:{cells:[['a','b']]}},
 $:key=>elements[key]||(elements[key]={value:'',textContent:''}),
 readLocalJson:()=>({}),studyKey:w=>w.word,drillKey:(lemma,ti,pi,form)=>'paradigm§'+lemma+'§'+ti+'§'+pi+'§'+form,
 norm:x=>x,renderStudy(){},renderDrill(){},saveStudyRecords(){},message(){},download(){},
 safe:x=>x,rowsToText:()=>'',confirm:()=>true,
 VERB_TENSES:[],PARADIGM_PERSONS:[]
};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync('tools/fsrs_core.js','utf8')+
 '\n'+fs.readFileSync('tools/srs_engine.js','utf8')+
 '\n;globalThis.S=TlahtolliSRS;globalThis.F=TlahtolliFSRS;',ctx);
const S=ctx.S;
// Again does not end a session; it waits for the actual learning step.
S.rate('x','again','due');
assert.equal(ctx.studyRecords.x.phase,'learning');
assert.equal(S.queueWords(clock.now).length,0);
assert.equal(S.waiting('words',clock.now).count,1);
clock.now+=60000;
assert.equal(S.queueWords(clock.now).length,1);
S.rate('x','good','due');
assert.equal(ctx.studyRecords.x.phase,'learning');
assert.equal(S.queueWords(clock.now).length,0);
assert.equal(S.waiting('words',clock.now).count,1);
clock.now+=600000;
assert.equal(S.queueWords(clock.now).length,1);
S.rate('x','good','due');
assert.equal(ctx.studyRecords.x.phase,'review');
assert.equal(S.waiting('words',clock.now),null);
S.undoLast();
assert.equal(ctx.studyRecords.x.phase,'learning');
assert.equal(S.waiting('words',clock.now),null); // retry is already due, not waiting
assert.equal(S.queueWords(clock.now).length,1);
S.rate('x','good','due');
// Established Hard reviews keep their future scheduled interval while retesting in-session.
ctx.studyRecords.x={phase:'review',reps:5,last:clock.now-DAY,due:clock.now,interval:7,ease:2.5,lapses:0};
S.rate('x','hard','due');
const hard=JSON.stringify(ctx.studyRecords.x);
assert.equal(S.queueWords(clock.now).length,0);
assert.equal(S.waiting('words',clock.now).count,1);
clock.now+=60000;
assert.equal(S.queueWords(clock.now).length,1);
S.rate('x','good','due');
assert.equal(JSON.stringify(ctx.studyRecords.x),hard);
assert.equal(S.waiting('words',clock.now),null);
// If a Hard session retest actually fails, record a lapse and relearning.
ctx.studyRecords.x={phase:'review',reps:6,last:clock.now-DAY,due:clock.now,interval:7,ease:2.5,lapses:0};
S.rate('x','hard','due');
clock.now+=60000;
S.rate('x','again','due');
assert.equal(ctx.studyRecords.x.phase,'relearning');
assert.equal(ctx.studyRecords.x.lapses,1);
assert.equal(S.waiting('words',clock.now).count,1);
// Drill retry bypasses sibling-bury suppression; not the normal daily caps.
ctx.studyRecords['paradigm§y§0§1§b']={phase:'review',last:clock.now, due:clock.now+DAY,reps:3};
ctx.studyRecords['paradigm§y§0§0§a']={phase:'review',last:clock.now-DAY, due:clock.now,reps:3,interval:3};
S.rate('paradigm§y§0§0§a','hard','active');
clock.now+=60000;
assert.ok(S.queueDrill(clock.now).some(x=>x.key==='paradigm§y§0§0§a'));
S.rate('paradigm§y§0§0§a','good','active');
assert.equal(S.waiting('drill',clock.now),null);
// FSRS mode also returns Again and Hard learning cards.
ctx.F.setSettings({enabled:true});
delete ctx.studyRecords.x;
S.rate('x','again','due');
assert.equal(ctx.studyRecords.x.phase,'learning');
assert.equal(S.waiting('words',clock.now).count,1);
clock.now+=60000;
assert.equal(S.queueWords(clock.now).length,1);
const html=fs.readFileSync('index.html','utf8');
assert.ok(html.includes('Retry intent belongs to this tab'));
assert.ok(html.includes('Still learning · '));
console.log('PASS: Again/Hard/Good retries, waiting, Undo, no double-counted Hard reviews, drills, FSRS and HTML parity');
