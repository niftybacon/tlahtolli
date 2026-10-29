#!/usr/bin/env node
'use strict';
// Offline inspector of already published Elotl/Axolotl aligned records.
// It never downloads, trains, scores accuracy, writes pairs.csv, or publishes
// third-party text into Tlahtōlli. Attribution and review stay mandatory.
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const ROOT=path.join(__dirname,'..');
const MANIFEST=path.join(ROOT,'research','translation_corpus','axolotl_classical_pair_pointers.json');

function gitBlobSha(buffer){
 const bytes=Buffer.isBuffer(buffer)?buffer:Buffer.from(buffer);
 return crypto.createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
}
function parseRows(input){
 const s=String(input).replace(/^\uFEFF/u,'');
 let rows=[],row=[],value='',quoted=false,closed=false;
 for(let i=0;i<s.length;i++){
  const c=s[i];
  if(quoted){
   if(c==='"'){
    if(s[i+1]==='"'){value+='"';i++;}
    else{quoted=false;closed=true;}
   }else value+=c;
  }else if(c===','){
   row.push(value);value='';closed=false;
  }else if(c==='\n'||c==='\r'){
   if(c==='\r'&&s[i+1]==='\n')i++;
   row.push(value);value='';closed=false;
   if(row.some(v=>v!==''))rows.push(row);
   row=[];
  }else if(c==='"'&&!value&&!closed)quoted=true;
  else if(closed&&c!==' '&&c!=='\t')
   throw Error('Unexpected characters after CSV quote');
  else if(!closed)value+=c;
 }
 if(quoted)throw Error('Unterminated CSV quote');
 if(row.length||value){row.push(value);rows.push(row);}
 if(rows.some((r,i)=>r.length!==5))
  throw Error('Axolotl CSV must have five source columns in every row');
 return rows;
}
function fingerprint(text){
 return String(text||'').normalize('NFD').toLowerCase()
  .replace(/[\u0300-\u036f]/gu,'')
  .replace(/[^\p{L}\p{N}]+/gu,' ').trim().replace(/\s+/gu,' ');
}
function wordCount(value){return String(value).trim().split(/\s+/u).filter(Boolean).length;}
function inspect(input,manifest,options={}){
 const bytes=Buffer.isBuffer(input)?input:Buffer.from(input);
 if(bytes.length>12*1024*1024)throw Error('External CSV exceeds safe size cap');
 if(!manifest||manifest.format!=='tlahtolli-axolotl-source-pointer-manifest-v1'||
  manifest.schema!==1||!Array.isArray(manifest.rows)||!manifest.rows.length||
  manifest.rows.length>60)throw Error('Unrecognized bounded pointer manifest');
 if(options.verifyBlob!==false&&gitBlobSha(bytes)!==manifest.upstream?.blob_sha)
  throw Error('Axolotl upstream blob changed: do not shift row pointers silently');
 const rows=parseRows(bytes.toString('utf8'));
 if(rows.length!==manifest.upstream.verified_total_csv_rows)
  throw Error('Upstream CSV row count differs from pinned version');
 const classical=rows.filter(r=>r[2]==='Classical Nahuatl');
 if(classical.length!==manifest.upstream.verified_classical_label_rows)
  throw Error('Classical label count differs from pinned version');
 const nhCounts=new Map(),esCounts=new Map();
 for(const row of classical){
  for(const [counts,key] of [[nhCounts,fingerprint(row[1])],[esCounts,fingerprint(row[0])]])
   counts.set(key,(counts.get(key)||0)+1);
 }
 const seen=new Set(),results=[];
 for(const pointer of manifest.rows){
  const index=pointer.source_row_1based;
  if(!Number.isInteger(index)||index<1||index>rows.length||seen.has(index))
   throw Error('Invalid or repeated source row: '+index);
  seen.add(index);
  const [spanish,nahuatl,variety,source_work,iso]=rows[index-1];
  if(variety!=='Classical Nahuatl'||iso!=='nci'||
    variety!==pointer.upstream_variety_label||
    iso!==pointer.upstream_iso_label||
    source_work!==pointer.source_work_title||
    pointer.expected_nahuatl_tokens!==wordCount(nahuatl)||
    pointer.expected_spanish_tokens!==wordCount(spanish))
   throw Error('Pinned source row drift or classification mismatch: '+index);
  if(!fingerprint(nahuatl)||!fingerprint(spanish))
   throw Error('Empty original or translated pair: '+index);
  // Reject duplicate source/translations in the pinned corpus. They would
  // otherwise make independent coverage and error rates look stronger.
  if(nhCounts.get(fingerprint(nahuatl))!==1||
     esCounts.get(fingerprint(spanish))!==1)
   throw Error('Reused Nahuatl or Spanish sentence in corpus: '+index);
  if(pointer.gold_translation!==false||
     pointer.independent_evaluation_eligible!==false||
     pointer.status!=='published_parallel_candidate_not_reviewed_or_blind')
   throw Error('Cannot silently promote an inspected corpus row into gold: '+index);
  results.push({
   id:pointer.id,
   upstream_row_1based:index,source_work,upstream_variety:variety,iso,
   nahuatl,spanish,
   classification:'SOURCE-PROVIDED PAIR; NOT FACSIMILE-VERIFIED, NOT GOLD, NOT BLIND',
   ready_for_gold:false
  });
 }
 return {upstream_git_blob_sha:gitBlobSha(bytes),total_rows:rows.length,
  classical_label_rows:classical.length,selected:results,
  assessed_translation_accuracy:null,
  approved_heldout_gold_pairs:0};
}
function main(){
 const filename=process.argv[2];
 if(!filename||filename.startsWith('--')){
  console.error('Usage: node tools/inspect_axolotl_candidates.js /local/path/axolotl.csv [--json]');
  process.exitCode=2;return;
 }
 const manifest=JSON.parse(fs.readFileSync(MANIFEST,'utf8'));
 const report=inspect(fs.readFileSync(filename),manifest);
 if(process.argv.includes('--json'))console.log(JSON.stringify(report,null,2));
 else{
  console.log('Axolotl: '+report.total_rows+' source rows; '+report.classical_label_rows+
   ' upstream-Classical-labeled rows; '+report.selected.length+' pinned research pairs.');
  for(const r of report.selected){
   console.log('\n'+r.id+' · row '+r.upstream_row_1based+' · '+r.source_work);
   console.log('  Nahuatl: '+r.nahuatl);
   console.log('  Spanish: '+r.spanish);
   console.log('  '+r.classification);
  }
  console.log('\nGold pairs: 0; accuracy: not measured. Nothing has been saved.');
 }
}
if(require.main===module){
 try{main();}catch(e){console.error('ERROR: '+e.message);process.exitCode=1;}
}
module.exports={parseRows,fingerprint,gitBlobSha,inspect};
