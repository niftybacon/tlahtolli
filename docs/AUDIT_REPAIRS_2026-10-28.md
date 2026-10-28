# Audit repairs — 2026-10-28

Release 2026-10-28.1.0 corrects tepētl against OND Karttunen p.230, mati locators to p.138, and pilli locators to p.195. Source pages were retrieved during the preceding audit; no new specialist certification is claimed. Existing folded publication/study keys remain identical for tepētl. Historical quotation spellings and plural evidence are retained; witness lemma pointers follow the correction.

Sixteen unsupported applicability claims are editorial inferences with lexical pointers explicitly distinguished from proof. Other unresolved fields remain unresolved. Additional applicability metadata is provisional. Paradigm orthography and exact rule citations remain pending; the matrices were not silently normalized.

The prior Luke review queue is preserved as luke_1833_review_queue_prior.json. The current queue is regenerated against the existing working text, with all proposed joins pending and no new OCR corrections applied. It includes the entire candidate inventory and a hash of the exact decoded working file, including its header. Original-offset repair history belongs to the prior report. New generator output hashes the file it actually writes. No training approval or transcription certification was added.

The corpus manifest now acknowledges imported working OCR. Codex matching-string counts are distinct from headword counts. Close readings explicitly identify edited transcription candidates. Reader summaries scope verification to lexical source review.

Remaining research: 25 normalization candidates require source-specific decisions; exact paradigm rule citations, comprehensive field-level UI badges, and canonical consolidation of duplicated passages remain open. No automatic correction of uncertain grammar or manuscript wording is warranted. This repair release does not claim those larger editorial tasks are complete.

Validation: full repository suite plus committed-data regressions for hashes, complete candidates, pending joins, retained history, lemma identity and citation downgrades. CI runs the new regression.


## Continued source review and passage consolidation

All 25 orthographic candidates now have individual source, locator, decision and scope in research/orthography_review.json, also preserved in lexical notes. Source-normalized spellings supplement the existing citation identities; historical spellings are not rewritten. In/īn is explicitly held apart by function, and parenthesized source segments are not expanded into productive rules.

Every paradigm row now links to an exact Launey section through rule_sources/rule_refs. The present subject-prefix mechanism was inspected in the preview; the later tense/mood chapters were only located in its contents. They remain unverified research locators, and no complete matrix is certified. Full access to the relevant pages and independent analysis are still needed to certify those cells.

data/passages.json now owns shared edited readings and presentation-specific analyses. tools/build_passages.py generates the embedded reader, translator examples, and Codex close readings; --check rejects drift. Former alternate readings are preserved. Token surfaces follow the shared edited text, with previous editorial surfaces retained. Existing browser-local customized passages remain protected by the existing merge behavior; the new Draft status applies to bundled records, not an overwrite of personal notes.

The current upstream lexical-abstention changes were retained by rebasing onto 549c289. Regression coverage includes source decision scope, complete rule references, no automatic certification, and mutation testing that a canonical reading reaches all three views.
