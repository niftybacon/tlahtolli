# English choice provenance checked against the shared grammar graph

**Stage:** Software consistency audit for editorial English choices. Not a verified translation, new Nahuatl grammar, independent manuscript attestation, or automated entity resolver.

## Motivation and ownership

The existing `translator-english.js` already composes editable English alternatives from the bounded finite, headed-relative, and relational-location analyses. The shared `translator-grammar-ir.js` already records source-backed alternatives and reading-local agreement checks.

This increment adds `grammarIR.auditEnglish(composition, sentenceAnalysis, grammarGraph)` **to the existing IR module**. It does not introduce a second parser or duplicate English wording logic. The UI first requests choices from the unchanged English composer; the IR audits the resulting choices before display. The original composition and sentence analysis are not mutated. English `render()` and its interactive choice controls continue to operate exactly as before.

## Per-construction evidence

- **Headed in-relatives:** Require the English option's head lemma, relative role, matrix role, verb lemma, tense, subject person and source references to match the *same* original relative-clause proposal **and** an admitted IR alternative node. Both `possible-relative-gap` and `possible-matrix-argument` edges must belong to that alternative, with `candidate-only` and `notIdentity` metadata. The IR's existing person/valency audit rejects forged role combinations before English display.
- **Indexed finite readings:** Require a full-coverage source-cited original candidate, a matching verb/person/arguments frame, and an English option already generated from that finite candidate. The graph does not claim to independently prove the English wording.
- **Relational locations:** The IR does **not** independently parse locative attachments. Retain only choices already associated with a matching fully consumed, source-cited location proposal, lexical relation sense, and allowed attachment. Explicitly mark them as `existing-location-scope-not-ir-audited`; do not falsely announce IR validation of the attachment.
- **Unknown or unsupported structures:** Drop any choice not justified by the corresponding original proposal and, for relatives, the same IR reading alternative. If one sentence unit would have no surviving alternative, the entire English composition is unavailable; no silent omission of unknown text is allowed.

The result attaches `grammarAudit` metadata to each retained option, an `audit` count summary and a note that none of the readings are historical truth claims. Unmentioned participants, nominal possessors, English senses and co-reference are not resolved.

## Implementation and backwards compatibility

The native Translator uses the existing `englishModel.compose(content,result)`, audits that output with the already-computed `grammarIR.build(content,result)`, then passes the filtered composition to the preexisting controls and renderer. No new English generator or grammar data pack is installed. If the optional graph adapter cannot load, the preexisting English composer continues operating as before, without claiming an IR audit.

The evidence panel labels how many relative alternatives were graph-consistent, and how many finite/location alternatives remain supported by their respective original analyzers. The counts measure **editorial alternative consistency**, never translation accuracy.

## Testing and concurrency

`tools/test_ir_audited_english.js` verifies all 288 indexed finite present/future controls, source-backed multi-clause readings, existing locative readings, both reversible third-person relative roles, tampered subject/object roles, mismatched sources, missing graph edges and absent IR evidence. A revised `tools/test_english_composition_browser.py` checks the actual app's alternatives and audit labels.

Both repository workflows must pass on the exact PR commit. This branch starts from `main` at `bba3770`, which includes the other developer's merged location-English PR #44 and nested arguments PR #47. No files in those branches were overwritten or force-pushed; `translator-english.js` and `translator-sentence.js` remain unchanged.

### Forward path

Subsequent work can add evidence-backed IR readings for additional structures (e.g., fully indexed nonpresent, overt possessed-noun arguments within nested clauses) **without** generating English from raw morphology until human-reviewed bilingual evidence supports it.
