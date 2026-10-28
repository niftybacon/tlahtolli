"""Snapshot hashes and offsets follow final text, without performing proposed repairs."""
import hashlib
from refresh_luke_review import refresh
raw='1 3  Example marker\nknown-\nword\n'+'unrelated text '*1000
corrected=raw.replace('1 3  Example','13  Example')
refs={'knownword':[{'lemma':'synthetic','source':'https://example.org','evidence':'test'}]}
a=refresh(raw,refs);b=refresh(corrected,refs)
assert b['working_draft_hash']==hashlib.sha256(corrected.encode('utf8')).hexdigest()
assert a['working_draft_hash']!=b['working_draft_hash']
assert b['verse_candidates'][0]['number_candidate']==13
assert b['counts']['proposed_hyphen']==1 and b['counts']['applied_hyphen']==0
assert all(x['status']=='needs_review' for x in b['review_queue'])
assert corrected[b['review_queue'][0]['offset']:].startswith('known-\nword')
assert not b['training_approved'] and not b['specialist_reviewed']
assert b['previous_review_file']=='luke_1833_review_queue_prior.json'
assert len(b['verse_candidates'])==b['verse_candidates_total'] and not b['verse_candidates_truncated']
print('PASS: final-draft fingerprint, post-correction markers, pending proposals and unchanged wording.')
