/* Chapter-by-chapter STRUCTURAL OCR audit, not proofread facsimile text. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const pane=$('lukeChapterAudit');if(!pane)return;
const summary=$('lukeChapterSummary'),table=$('lukeChapterRows'),picker=$('lukeChapterPicker'),detail=$('lukeChapterDetail');
const el=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=String(text);if(cls)e.className=cls;return e;};
let chapters=[];
function renderChapter(ch){
 detail.replaceChildren();
 if(!ch)return;
 detail.append(el('h4','Chapter '+ch.chapter+' · '+ch.expected_verse_count+' expected verses'));
 detail.append(el('p','OCR title: '+ch.ocr_heading,'readerhint'));
 detail.append(el('p','Heading recognition: '+(ch.heading_status==='recognized_unverified'?'identified but not facsimile-checked':'OCR-corrupted; requires comparison with the original scan'),'readerhint'));
 detail.append(el('p',ch.distinct_verse_numbers_seen_2_to_end+' distinct numbered markers recognized (excluding the normally unnumbered verse 1); '+ch.verses_needing_marker_review.length+' markers to inspect.'));
 if(ch.verses_needing_marker_review.length){
  const line=el('p','Check verse markers: '+ch.verses_needing_marker_review.join(', '),'translator-caution');detail.append(line);
 }
 if(ch.suspected_split_numerals.length){
  const line=el('p','Potential OCR-separated numerals: '+ch.suspected_split_numerals.map(x=>x.printed_digits+' → '+x.possible_verse).join('; '),'readerhint');detail.append(line);
 }
 if(ch.out_of_order_number_transitions||ch.duplicate_verse_marker_candidates.length)
  detail.append(el('p','Out-of-order transitions: '+ch.out_of_order_number_transitions+'; duplicate candidate numerals: '+ch.duplicate_verse_marker_candidates.join(', ')+'.','translator-caution'));
 if(ch.chapter_status==='PRINTED_VERSE_NUMERALS_CHECKED_TEXT_NOT_PROOFREAD'){
  detail.append(el('p','Printed chapter '+ch.chapter+' verse numerals 1–'+ch.expected_verse_count+
   ' were visually checked across PDF pages '+ch.facsimile_pages_checked[0]+'–'+
   ch.facsimile_pages_checked[ch.facsimile_pages_checked.length-1]+
   '. Numeral corrections are documented separately. The Nahuatl wording and spelling are NOT proofread.','translator-meta'));
 }else if(ch.chapter_status==='SELECTED_VERSE_NUMERALS_CHECKED_TEXT_NOT_PROOFREAD'){
  detail.append(el('p','A selected printed page has been examined (PDF page 21), confirming the numeral for verse 28. The chapter has NOT received a complete page-by-page reading.','translator-meta'));
 }else detail.append(el('p','Status: OCR structural audit only. No facsimile page was visually checked for this chapter.','translator-caution'));
 const a=el('a','Check against the scanned 1833 Gospel of Luke');
 a.href='https://archive.org/details/elevangeliodeslu00pazy';a.target='_blank';a.rel='noopener noreferrer';detail.append(a);
}
picker.addEventListener('change',()=>renderChapter(chapters[Number(picker.value)-1]));
async function load(){
 try{
  const r=await fetch('./research/translation_corpus/luke_1833_chapter_audit.json',{cache:'no-cache'});
  if(!r.ok)throw Error('Chapter audit not published (HTTP '+r.status+')');
  const d=await r.json();
  if(d.format!=='tlahtolli-luke1833-chapter-audit'||d.chapters?.length!==24||d.facsimile_review_completed_chapters!==0||d.training_approved!==false)throw Error('Unexpected audit format');
  chapters=d.chapters;
  summary.textContent='24 OCR chapter headings identified · '+d.totals.reference_verse_count+
   ' reference verses · '+d.totals.verse_marker_positions_requiring_review+
   ' verse-marker positions need image verification · '+d.totals.chapter_headings_needing_review+
   ' OCR-damaged chapter headings. No chapter is marked fully proofread.';
  for(const ch of chapters){
   const option=el('option','Chapter '+ch.chapter+' · '+ch.verses_needing_marker_review.length+' markers needing review');
   option.value=String(ch.chapter);picker.append(option);
   const tr=el('tr'),select=el('button','Chapter '+ch.chapter,'codex-book-button');
   select.type='button';select.addEventListener('click',()=>{picker.value=String(ch.chapter);renderChapter(ch)});
   const td=el('td');td.append(select);
   tr.append(td,el('td',ch.expected_verse_count),el('td',ch.distinct_verse_numbers_seen_2_to_end),
    el('td',ch.verses_needing_marker_review.length),el('td',ch.review_priority==='high'?'Review heading/markers':'Check markers'));
   table.append(tr);
  }
  picker.value='1';renderChapter(chapters[0]);
 }catch(e){summary.textContent='24-chapter audit unavailable: '+(e.message||String(e))}
}
load();
})();