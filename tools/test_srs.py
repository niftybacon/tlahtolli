#!/usr/bin/env python3
"""Advanced browser-local SRS: scheduler, migration, controls, Anki exports.

SRS is SM-2-inspired and intentionally DOES NOT claim FSRS equivalence.
"""
from pathlib import Path
import csv,json
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
dictionary=json.loads((ROOT/'dictionary.json').read_text(encoding='utf-8'))
paradigms=json.loads((ROOT/'paradigms.json').read_text(encoding='utf-8'))
with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,args=['--no-sandbox'])
    page=browser.new_page(accept_downloads=True)
    errors=[]
    page.on('pageerror',lambda err:errors.append(str(err)))
    page.evaluate("""([d,p])=>{
      window.fetch=async url=>{
       const u=String(url),v=u.startsWith('release.json')
         ? {format:'tlahtolli-release-manifest',schema:1,version:d.version,headwords:d.words.length,paradigms:Object.keys(p.paradigms).length}
         :u.startsWith('dictionary.json')?d:u.startsWith('paradigms.json')?p
         :{format:'tlahtolli-source-atlas',schema:1,version:d.version,sources:[],witnesses:[]};
       return new Response(JSON.stringify(v),{status:200,headers:{'Content-Type':'application/json'}});
      };
    }""",[dictionary,paradigms])
    page.set_content((ROOT/'index.html').read_text(encoding='utf-8'),wait_until='load')
    page.wait_for_function("document.querySelector('#syncStatus')?.textContent.includes('Current')")
    assert page.locator('#srsOptions').count()==1
    assert page.locator('#srsAnkiVocab').count()==1
    assert page.locator('#srsAnkiVerbs').count()==1

    results=page.evaluate("""()=>{
      const T=TlahtolliSRS,now=Date.UTC(2026,9,27,12),baseline=T.getSettings();
      const fresh=T.schedule(null,'good',now);
      const failed=T.schedule(null,'again',now);
      const later=T.schedule(fresh,'good',now+600000);
      const review={phase:'review',last:now-86400000,due:now,reps:10,interval:30,ease:2.5,lapses:0};
      const hard=T.schedule(review,'hard',now);
      const good=T.schedule(review,'good',now);
      const easy=T.schedule(review,'easy',now);
      const lap=T.schedule(review,'again',now);
      const legacy=sanitizeStudyRecords({'old§card':{reps:2,last:100,due:300,lapses:0}});
      const advanced=sanitizeStudyRecords({'word§card':{reps:4,last:100,due:900,lapses:1,phase:'review',
        step:0,ease:2.45,interval:18,introducedAt:50,
        history:[{at:100,grade:'good',wasReview:true,interval:18,due:900,phase:'review'}]}});
      T.applySettings({...baseline,newLimit:0,reviewLimit:0});
      const zero=studyQueue().length;
      T.applySettings({...baseline,leechThreshold:2,leechAction:'suspend'});
      const leech=T.schedule({...review,lapses:1},'again',now);
      T.applySettings(baseline);
      return {freshDays:(fresh.due-now)/86400000,failedMinutes:(failed.due-now)/60000,
        laterDays:(later.due-now)/86400000,hardDays:(hard.due-now)/86400000,
        goodDays:(good.due-now)/86400000,easyDays:(easy.due-now)/86400000,
        lapsePhase:lap.phase,lapseMinutes:(lap.due-now)/60000,
        leech:leech.suspended&&leech.phase==='suspended',
        recovered:T.schedule({...review,lapses:8,leech:false,suspended:false},'good',now).suspended===false,
        old:legacy['old§card'],advanced:advanced['word§card'],zero};
    }""")
    assert results['freshDays']<1 and 9<=results['freshDays']*1440<=11,results
    assert results['failedMinutes']==1 and results['laterDays']>=1,results
    assert results['hardDays']<results['goodDays']<results['easyDays'],results
    assert results['lapsePhase']=='relearning' and results['lapseMinutes']==10,results
    assert results['leech'] and results['recovered'] and results['zero']==0,results
    assert results['old']['reps']==2 and results['old']['due']==300 and results['old']['interval']>0,results
    assert results['advanced']['interval']==18 and results['advanced']['history'][0]['grade']=='good',results

    page.locator('#tabStudy').click()
    page.locator('#srsOptions summary').click()
    page.locator('#srs_newLimit').fill('2')
    page.locator('#srs_reviewLimit').fill('20')
    page.locator('#srs_learning').fill('2m 15m')
    page.locator('#srsSave').click()
    assert page.evaluate("TlahtolliSRS.getSettings().newLimit") ==2
    assert page.evaluate("TlahtolliSRS.getSettings().learning") =='2m 15m'
    # Reverse-direction cards have distinct histories; founding forward keys survive.
    keys=page.evaluate("""()=>{
      const w=words[0];
      $('studyDirection').value='nh-en';const forward=studyKey(w);
      $('studyDirection').value='en-nh';const reverse=studyKey(w);
      $('studyDirection').value='nh-en';return {forward,reverse};
    }""")
    assert keys['reverse']==keys['forward']+'§reverse',keys
    page.locator('#studySubset').select_option('due')
    page.locator('#studyReveal').click()
    page.locator('[data-study-grade="good"]').click()
    assert page.evaluate("Object.values(studyRecords).some(r=>r.phase==='learning'&&r.due>r.last)") 
    page.locator('#srsUndo').click()
    assert page.evaluate("Object.keys(studyRecords).filter(k=>!k.startsWith('paradigm§')).length")==0

    # Practice-only mode must not mutate recorded scheduling.
    page.locator('#studySubset').select_option('all')
    page.locator('#studyReveal').click()
    page.locator('[data-study-grade="easy"]').click()
    assert page.evaluate("Object.keys(studyRecords).length")==0

    # Anki text files include import headers and keep grammar-derived forms separate.
    with page.expect_download() as incoming:
        page.locator('#srsAnkiVocab').click()
    raw=Path(incoming.value.path()).read_text(encoding='utf-8-sig')
    assert '#separator:Tab' in raw and '#notetype:Basic' in raw
    assert '#deck:Tlahtōlli::Vocabulary' in raw
    rows=list(csv.reader((line for line in raw.splitlines() if not line.startswith('#')),delimiter='\t'))
    assert len(rows)==len(dictionary['words']) and all(len(row)==3 for row in rows)
    assert any(row[0]=='xōchitl' for row in rows)
    with page.expect_download() as incoming:
        page.locator('#srsAnkiReverse').click()
    raw=Path(incoming.value.path()).read_text(encoding='utf-8-sig')
    assert '#deck:Tlahtōlli::Reverse Vocabulary' in raw
    reverse_rows=list(csv.reader((line for line in raw.splitlines() if not line.startswith('#')),delimiter='\t'))
    assert len(reverse_rows)==len(dictionary['words']) and any('xōchitl' in row[1] for row in reverse_rows)
    with page.expect_download() as incoming:
        page.locator('#srsAnkiVerbs').click()
    raw=Path(incoming.value.path()).read_text(encoding='utf-8-sig')
    assert '#deck:Tlahtōlli::Verb Paradigms' in raw
    rows=list(csv.reader((line for line in raw.splitlines() if not line.startswith('#')),delimiter='\t'))
    assert len(rows)==720 and all(len(row)==3 for row in rows)
    assert all('Grammar-derived' in row[1] for row in rows)

    with page.expect_download() as incoming:
        page.locator('#workspaceTools').evaluate('(el)=>el.open=true')
        page.locator('#allBackup').click()
    backup=json.loads(Path(incoming.value.path()).read_text(encoding='utf-8-sig'))
    assert backup['version']==6 and backup['srsSettings']['newLimit']==2,backup
    assert not errors,errors
    browser.close()
print('PASS: advanced SRS learning/relearning, ease, caps, leeches, undo,')
print('      practice-only safety, progress migration, Anki 103+720 exports, JSON backup')
