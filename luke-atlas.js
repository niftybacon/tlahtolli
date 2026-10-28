/* 1833 public-domain Luke research summary: aggregate OCR statistics only. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const pane=$('lukeAtlas');
if(!pane)return;
const out=$('lukeAtlasStatus'),stats=$('lukeSummary'),frequent=$('lukeFrequent');
const num=n=>Number(n||0).toLocaleString('en-US');
async function load(){
 try{
  const response=await fetch('./research/translation_corpus/luke_1833_analysis.json',{cache:'no-store'});
  if(!response.ok)throw Error('No Luke aggregate report found');
  const report=await response.json(),s=report.stats||{};
  if(report.format!=='tlahtolli-luke1833-aggregate-analysis'||report.training_ready!==false||report.text_redistributed!==false)throw Error('Unsupported Luke report');
  stats.textContent=num(s.approximate_ocr_letter_runs)+' approximate OCR letter-runs · '+
   num(s.distinct_ocr_forms)+' different written forms · '+
   s.dictionary_exact_form_percent+'% directly found in our dictionary · '+
   s.dictionary_tentative_plus_exact_percent+'% with guarded spelling suggestions';
  out.textContent='Research scan completed. The 1833 historical source is public domain, but the archival OCR has not been proofread or aligned for translation. No model training occurred.';
  frequent.replaceChildren();
  for(const [token,count] of report.frequent_written_forms||[]){
   const node=document.createElement('span');node.className='codex-token';
   node.textContent=token+' ('+num(count)+')';
   frequent.append(node);
  }
 }catch(e){out.textContent='Luke scan summary unavailable: '+(e?.message||String(e));}
}
load();
})();