#!/usr/bin/env python3
"""Phase 3 browser search parity + large-list UI checks.

Synthetic entries exist only inside the test browser; they are NOT claims of
historical Nahuatl attestation and are never written to canonical sources.
"""
from pathlib import Path
import json
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
dictionary = json.loads((ROOT / 'dictionary.json').read_text(encoding='utf-8'))
paradigms = json.loads((ROOT / 'paradigms.json').read_text(encoding='utf-8'))

with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True, args=['--no-sandbox'])
    page = browser.new_page()
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.evaluate("""([d,p])=>{
      window.fetch=async url=>{
        const name=String(url);
        const result=name.startsWith('release.json')
          ? {format:'tlahtolli-release-manifest',schema:1,version:d.version,
             headwords:d.words.length,paradigms:Object.keys(p.paradigms).length}
          : name.startsWith('dictionary.json')?d
          : name.startsWith('paradigms.json')?p
          : {format:'tlahtolli-source-atlas',schema:1,version:d.version,
             sources:[],witnesses:[]};
        return new Response(JSON.stringify(result),
          {status:200,headers:{'Content-Type':'application/json'}});
      };
    }""", [dictionary, paradigms])
    page.set_content((ROOT / 'index.html').read_text(encoding='utf-8'), wait_until='load')
    page.wait_for_function("document.querySelector('#syncStatus')?.textContent.includes('Current')")

    # Add a few hundred deliberately invented entries to test rendering at scale.
    page.evaluate("""()=>{
      for(let i=0;i<300;i++)words.push(clean({
        word:'zztrial'+String(i).padStart(3,'0'),
        meaning:'phase3 synthetic keyword '+i,
        pos:'noun',variety:'Classical Nahuatl',status:'Draft'
      }));
      searchIndex=null;
      render();
    }""")
    assert int(page.locator('#total').inner_text()) == len(dictionary['words'])+300
    assert page.locator('button.result').count() <= 101
    assert page.locator('[data-load-more]').count() == 1
    page.locator('[data-load-more]').click()
    assert 200 <= page.locator('button.result').count() <= 201
    page.locator('#search').fill('zztrial029')
    page.wait_for_function("document.querySelector('#count')?.textContent.startsWith('1 matching')")
    assert page.locator('button.result').count() == 1
    assert 'Exact headword' in page.locator('button.result').inner_text()
    page.locator('#search').fill('zztrial')
    page.wait_for_function("document.querySelector('#count')?.textContent.startsWith('300 matching')")
    assert 100 <= page.locator('button.result').count() <= 101
    assert page.locator('[data-load-more]').count() == 1

    # A differential oracle checks old exhaustive scoring against the optimized
    # candidate search, including no-query, macron folding, forms, meanings,
    # prefix, fuzzy suggestion, and cases with no hits.
    page.evaluate("""()=>{
      const queries=['','in','xochitl','xōchitl','nichocac','tlamatini',
        'zztrial029','zztrial','synthetic keyword','phase3','unknownword',
        'zztrisl029','mātl','teocalli','tlatoque'];
      for(const query of queries){
        $('search').value=query;
        const fast=results().map(w=>[w._idx,w._match.score,w._match.type]);
        const q=norm(query.trim());
        const eligible=searchIndex; // all filters are still at their defaults
        let baseline=eligible.map(ix=>{
          const w=words[ix.index],match=q?scoreEntry(w,ix,q):{score:0,label:'',type:''};
          return match?{...w,_idx:ix.index,_match:match}:null;
        }).filter(Boolean);
        if(q&&baseline.length===0&&q.length>=4){
          const max=q.length>6?2:1;
          baseline=eligible.map(ix=>{
            const d=editDistanceLimit(q,ix.lemma,max);
            return d<=max?{...words[ix.index],_idx:ix.index,
              _match:{score:10-d,label:'Approximate spelling · suggestion only',type:'approx'}}:null;
          }).filter(Boolean);
        }
        baseline.sort((a,b)=>b._match.score-a._match.score||a.word.localeCompare(b.word));
        const slow=baseline.map(w=>[w._idx,w._match.score,w._match.type]);
        if(JSON.stringify(fast)!==JSON.stringify(slow))
          throw Error('Optimized search diverged from exhaustive scoring: '+query);
      }
      // Test index invalidation for a personal edit, not just the initial build.
      words.push(clean({word:'zznewentry',meaning:'brand new fixture',
        pos:'noun',variety:'Classical Nahuatl',status:'Draft'}));
      searchIndex=null;
      $('search').value='zznewentry';
      if(results().length!==1||results()[0].word!=='zznewentry')
        throw Error('Search index did not rebuild after edit');
    }""")
    assert not errors, errors
    browser.close()
print('PASS: Phase 3 exhaustive-score parity, result paging, search reset, and local-edit invalidation')
