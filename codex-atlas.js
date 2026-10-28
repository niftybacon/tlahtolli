/* Florentine Codex research statistics: aggregate counts only, no manuscript text. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const status=$('codexAtlasStatus'),rows=$('codexBookRows'),chooser=$('codexBookSelect'),detail=$('codexBookDetail'),summary=$('codexSummary');
if(!status||!rows||!chooser||!detail||!summary)return;
const el=(tag,value)=>{const node=document.createElement(tag);if(value!==undefined)node.textContent=String(value);return node};
const num=n=>Number(n||0).toLocaleString('en-US');
let books=[];
function show(book){
 detail.replaceChildren();
 if(!book)return;
 detail.append(el('h4','Book '+book.book+' · '+book.title));
 detail.append(el('p',num(book.approximate_orthographic_units)+' approximate written units · '+num(book.unique_orthographic_forms)+' distinct forms · '+book.lexicon_approximate_coverage_pct+'% matched to the current dictionary.'));
 detail.append(el('p','Most frequently transcribed forms (some may be broken by historical page layout):'));
 const tags=el('p');
 for(const [word,count] of book.top_orthographic_forms||[]){
  const tag=el('span',word+' ('+num(count)+')  ');tag.className='codex-token';tags.append(tag);
 }
 detail.append(tags);
 const link=el('a','Explore the original Codex at Getty');
 link.href='https://florentinecodex.getty.edu/codex';link.target='_blank';link.rel='noopener noreferrer';detail.append(link);
}
chooser.addEventListener('change',()=>show(books.find(b=>String(b.book)===chooser.value)));
async function start(){
 try{
  const resp=await fetch('./research/florentine_codex/analysis.json',{cache:'no-store'});
  if(!resp.ok)throw Error('Statistics not published');
  const data=await resp.json();
  if(data.format!=='tlahtolli-codex-aggregate-analysis'||data.train_eligible!==false||data.verbatim_source_text_in_output!==false||data.books?.length!==12)throw Error('Unrecognized report');
  books=data.books;
  summary.textContent='All 12 books · '+num(data.totals.approximate_orthographic_units)+' approximate written units · '+num(data.totals.lexicon_approximate_hits)+' dictionary matches';
  status.textContent='Research measurements only. Historic line wrapping creates false word boundaries. No model training or complete-text reproduction.';
  const largest=Math.max(...books.map(b=>b.approximate_orthographic_units));
  for(const book of books){
   const opt=el('option',book.book+'. '+book.title);opt.value=String(book.book);chooser.append(opt);
   const tr=el('tr');
   const title=el('td');const button=el('button',book.title);button.type='button';button.className='codex-book-button';
   button.addEventListener('click',()=>{chooser.value=String(book.book);show(book)});title.append(button);
   tr.append(el('td',book.book),title,el('td',num(book.approximate_orthographic_units)),el('td',book.lexicon_approximate_coverage_pct+'%'));
   const meter=el('td');const track=el('div');track.className='codex-meter';
   const bar=el('div');bar.className='codex-meter-fill';bar.style.width=(book.approximate_orthographic_units/largest*100).toFixed(1)+'%';
   track.append(bar);meter.append(track);tr.append(meter);rows.append(tr);
  }
  chooser.value='11';show(books[10]);
 }catch(e){status.textContent='Codex statistics unavailable: '+(e.message||String(e));}
}
start();
})();