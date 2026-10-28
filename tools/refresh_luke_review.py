"""Refresh pending review offsets against the final OCR draft; never edit its wording."""
import hashlib,json
from pathlib import Path
from clean_segment_luke1833 import prepare,references
ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT/'research/translation_corpus'
def refresh(text,refs):
    _,report=prepare(text,refs)
    # prepare proposes further mechanical edits; this snapshot must not apply them.
    report['counts']['proposed_hyphen']=report['counts'].get('applied_hyphen',0)
    report['counts']['applied_hyphen']=0
    for item in report['review_queue']:
        item['status']='needs_review'
    report['working_draft_hash']=hashlib.sha256(text.encode('utf8')).hexdigest()
    report['hash_convention']='UTF-8 decoded text with universal newlines, including draft header'
    report['previous_review_file']='luke_1833_review_queue_prior.json'
    report['note']='Offsets and candidates refer to the current working file. Earlier repair history retained in the prior report. No wording certified.'
    report['automatic_policy']='Snapshot only: all proposals need review; no text edits are applied by this refresh.'
    return report
if __name__=='__main__':
    if not (BASE/'luke_1833_review_queue_prior.json').is_file():
        raise ValueError('Preserved review history is missing')
    text=(BASE/'luke_1833_working_ocr.txt').read_text(encoding='utf8')
    dictionary=json.loads((ROOT/'dictionary.json').read_text(encoding='utf8'))
    report=refresh(text,references(dictionary))
    (BASE/'luke_1833_review_queue.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    print('Refreshed pending review snapshot against final OCR draft; no wording certified.')
