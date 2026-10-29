'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {parseRows,gitBlobSha,inspect}=require('./inspect_axolotl_candidates.js');
const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'..','research','translation_corpus','axolotl_classical_pair_pointers.json'),'utf8'));
assert.equal(manifest.rows.length,10);
assert.equal(manifest.upstream.verified_total_csv_rows,16111);
assert.equal(manifest.upstream.verified_classical_label_rows,5993);
assert.equal(new Set(manifest.rows.map(x=>x.source_work_title)).size,6);
assert.equal(new Set(manifest.rows.map(x=>x.source_row_1based)).size,10);
assert.equal(manifest.upstream.blob_sha,'90b7327fc4023ba529e1982f823ddeaee6e313e3');
assert(manifest.upstream.license_note.includes('does not establish'));
for(const r of manifest.rows){
 assert.equal(r.gold_translation,false);
 assert.equal(r.independent_evaluation_eligible,false);
 assert.equal(r.status,'published_parallel_candidate_not_reviewed_or_blind');
 assert(!('nahuatl' in r)&&!('spanish' in r)&&!('translation_text' in r),
  'Published repository must store locators, never copied book translations');
 assert(r.expected_spanish_tokens>=3&&r.expected_nahuatl_tokens>=3);
 assert.equal(r.upstream_iso_label,'nci');
}
// Quotes, commas, embedded newlines and CRLF must retain exact original texts.
const sample='"Entonces, dijeron",No yquac poliuhque toltitlancalque.,Classical Nahuatl,Anales de Tlatelolco,nci\r\n'+
 '"El año ""cuatro""\ncorrió",Ypam ynin xihuitl citlalin opopocac.,Classical Nahuatl,Anales de Tepeteopan,nci\r\n'+
 'Modern only,Tenonotzālis,Highland Puebla Nahuatl,Other,azz\r\n';
const rows=parseRows(sample);
assert.equal(rows.length,3);
assert.equal(rows[1][0],'El año "cuatro"\ncorrió');
assert.equal(rows[0][0],'Entonces, dijeron');
const fake={
 format:'tlahtolli-axolotl-source-pointer-manifest-v1',schema:1,
 upstream:{blob_sha:gitBlobSha(Buffer.from(sample)),verified_total_csv_rows:3,
  verified_classical_label_rows:2},
 rows:[{
  id:'fixture-1',source_row_1based:1,source_work_title:'Anales de Tlatelolco',
  upstream_variety_label:'Classical Nahuatl',upstream_iso_label:'nci',
  expected_nahuatl_tokens:4,expected_spanish_tokens:2,
  gold_translation:false,independent_evaluation_eligible:false,
  status:'published_parallel_candidate_not_reviewed_or_blind'
 }]
};
const ok=inspect(Buffer.from(sample),fake);
assert.equal(ok.selected.length,1);
assert.equal(ok.selected[0].nahuatl,'No yquac poliuhque toltitlancalque.');
assert.equal(ok.selected[0].spanish,'Entonces, dijeron');
assert.equal(ok.selected[0].ready_for_gold,false);
assert.equal(ok.approved_heldout_gold_pairs,0);
assert.equal(ok.assessed_translation_accuracy,null);
const invalid=(change,needle)=>{
 const m=JSON.parse(JSON.stringify(fake));change(m);
 assert.throws(()=>inspect(Buffer.from(sample),m),new RegExp(needle));
};
invalid(x=>x.rows[0].gold_translation=true,'promote');
invalid(x=>x.rows[0].independent_evaluation_eligible=true,'promote');
invalid(x=>x.rows[0].status='approved','promote');
invalid(x=>x.rows[0].source_work_title='unrelated','classification mismatch');
invalid(x=>x.rows[0].expected_nahuatl_tokens=99,'classification mismatch');
invalid(x=>x.rows[0].upstream_iso_label='nhm','classification mismatch');
invalid(x=>x.rows[0].source_row_1based=3,'classification mismatch');
invalid(x=>x.rows.push({...x.rows[0]}),'repeated source row');
invalid(x=>x.upstream.blob_sha='a'.repeat(40),'upstream blob changed');
const shifted=sample.replace('Entonces, dijeron','Entonces, exclamaron');
assert.throws(()=>inspect(Buffer.from(shifted),fake),/upstream blob changed/);
assert.throws(()=>parseRows('"unterminated,word,Classical Nahuatl,Source,nci'),/Unterminated/);
assert.throws(()=>parseRows('a,b,Classical Nahuatl,Source\n'),/five source columns/);
const duplicates=sample+'"Entonces, dijeron",No yquac poliuhque toltitlancalque.,Classical Nahuatl,Second Work,nci\n';
const dupManifest=JSON.parse(JSON.stringify(fake));
dupManifest.upstream.verified_total_csv_rows=4;
dupManifest.upstream.verified_classical_label_rows=3;
dupManifest.upstream.blob_sha=gitBlobSha(Buffer.from(duplicates));
assert.throws(()=>inspect(Buffer.from(duplicates),dupManifest),/Reused Nahuatl or Spanish/);
console.log('PASS external Axolotl source pointer integrity: ten immutable publication locators, six works; real records are not embedded; CSV quoting, SHA, variety, duplicate and no-gold gates.');
