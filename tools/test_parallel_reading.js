// Personal parallel-text alignment regression; NOT a historical translation test.
'use strict';
const assert=require('node:assert/strict');
const core=require('../parallel-reading-core.js');
const original='ticnamaca y¯ totlal\r\n yhuan nicē ';
const english='we sell our land\nand something more';
assert.deepEqual(core.lines(original),['ticnamaca y¯ totlal','yhuan nicē']);
assert.deepEqual(core.lines(''),[]);
const one={nahuatl_index:0,english_index:0,note:'Editorial-assisted, non-literal correspondence uncertain'};
const two={nahuatl_index:1,english_index:1,note:'Do not assume a literal translation'};
const data=core.createProject(original,english,[one,two],'2026-10-28T00:00:00.000Z');
assert.equal(data.format,'tlahtolli-personal-parallel-reading-v1');
assert.equal(data.source_id,'ENL-BC16-1573');
assert.deepEqual(data.nahuatl_lines,['ticnamaca y¯ totlal','yhuan nicē']);
assert.deepEqual(data.english_lines,['we sell our land','and something more']);
assert.equal(data.alignments.length,2);
assert.equal(data.alignments[0].nahuatl_text,'ticnamaca y¯ totlal');
assert.equal(data.alignments[0].english_text,'we sell our land');
assert.equal(data.alignments[0].status,'user_proposed_alignment_unverified');
assert.equal(data.translation_verified,false);
assert.equal(data.transcription_verified,false);
assert.equal(data.alignment_verified,false);
assert.equal(data.train_eligible,false);
assert.equal(data.evaluation_eligible,false);
assert.equal(data.independent_test_eligible,false);
assert.equal(data.review_status,'personal_unverified');
assert.equal(data.published_translation_rights,'not_verified');
assert.equal(data.original_pasted_text,original);
assert.equal(data.english_pasted_text,english);
assert.equal(data.created_at,'2026-10-28T00:00:00.000Z');
assert.deepEqual(core.importProject(JSON.parse(JSON.stringify(data))),data);
assert.equal(core.createProject(original,english,[]).alignments.length,0,
 'Unsaved alignment work may be exported before any pair is chosen.');
for(const value of [null,{},'',22,[]])assert.throws(()=>core.lines(value),/Text must be a string/);
assert.deepEqual(core.lines(' \r\n \n  '),[]);
assert.throws(()=>core.lines('a'.repeat(35001)),/35,000/);
assert.throws(()=>core.lines('a'.repeat(4001)),/4,000/);
assert.throws(()=>core.lines(Array(151).fill('a').join('\n')),/150/);
assert.throws(()=>core.createProject('',english),/at least one/);
assert.throws(()=>core.createProject(original,''),/at least one/);
assert.throws(()=>core.createProject(original,english,[one,one]),/twice/);
assert.throws(()=>core.createProject(original,english,[{...one,nahuatl_index:99}]),/outside/);
assert.throws(()=>core.createProject(original,english,[{...one,english_index:-1}]),/outside/);
assert.throws(()=>core.createProject(original,english,[{...one,english_index:0.5}]),/outside/);
assert.throws(()=>core.createProject(original,english,[{...one,note:'x'.repeat(501)}]),/500/);
assert.throws(()=>core.createProject(original,english,[{...one,status:'approved'}]),/approved or training-ready/);
assert.throws(()=>core.createProject(original,english,[{...one,nahuatl_text:'wrong'}]),/does not match/);
assert.throws(()=>core.createProject(original,english,[{...one,english_text:'wrong'}]),/does not match/);
for(const props of [
 {train_eligible:true},{evaluation_eligible:true},{independent_test_eligible:true},
 {alignment_verified:true},{transcription_verified:true},{translation_verified:true},
 {review_status:'approved'},{published_translation_rights:'permission_documented'},
 {source_id:'FC'},{source_url:'https://not-the-source.example'},
 {format:'tlahtolli-training-pairs-v1'}]){
 assert.throws(()=>core.importProject({...data,...props}),/not a compatible/);
}
assert.throws(()=>core.importProject({...data,nahuatl_lines:['tampered']}),/segmentation was changed/);
assert.throws(()=>core.importProject({...data,alignments:[
 {...data.alignments[0],english_text:'post-export alteration'}]}),/does not match/);
assert.throws(()=>core.importProject({...data,alignments:[{...one,status:'approved'}]}),/approved or training-ready/);
assert.throws(()=>core.importProject({format:core.FORMAT,__proto__:null}),/not a compatible/);
const tags='<script>alert(1)</script>';
assert.equal(core.createProject(tags,'<>',[{nahuatl_index:0,english_index:0,note:'<svg/onload=x>'}]).alignments[0].nahuatl_text,tags,
 'Preserve user-entered text for safe textContent rendering, never parse as HTML.');
console.log('PASS private parallel-reading model: manual-only line alignment, exact Unicode preservation, reversible local exports, strict no-gold metadata, import tamper rejections and length limits.');
