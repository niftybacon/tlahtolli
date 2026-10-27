#!/usr/bin/env python3
"""Maintain offline, source-controlled adjustable SRS engine and UI."""
from pathlib import Path
import sys
ROOT=Path(__file__).resolve().parents[1]
BEGIN='/* BEGIN TLAHTOLLI SRS V2 */'
END='/* END TLAHTOLLI SRS V2 */'
ANCHOR='renderSourceAtlas();syncSourceAtlas();render();'
def bundled():
    engine=(ROOT/'tools/srs_engine.js').read_text(encoding='utf-8').rstrip()
    ui=(ROOT/'tools/srs_ui.js').read_text(encoding='utf-8').rstrip()
    return BEGIN+'\n'+engine+'\n'+ui+'\n'+END

def generate(html):
    block=bundled()
    start=html.find(BEGIN)
    if start>=0:
        stop=html.find(END,start)
        if stop<0:raise ValueError('Missing closing SRS marker')
        if html.find(BEGIN,start+len(BEGIN))>=0:raise ValueError('Duplicate SRS embed')
        return html[:start]+block+html[stop+len(END):]
    pos=html.rfind(ANCHOR)
    if pos<0:raise ValueError('No final application initialization')
    return html[:pos]+block+'\n'+html[pos:]
if __name__=='__main__':
    path=ROOT/'index.html';html=path.read_text(encoding='utf-8')
    result=generate(html)
    if result==html:print('PASS: advanced SRS sources and offline HTML identical')
    elif '--write' in sys.argv:
        path.write_text(result,encoding='utf-8')
        print('UPDATED: source-controlled SRS engine in index.html')
    else:
        print('FAILED: stale SRS engine embed. Run python tools/build_srs.py --write',file=sys.stderr)
        raise SystemExit(1)
