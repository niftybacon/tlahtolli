# Exact third-person possessed forms: source-bounded extension

**Stage:** Editorial source-linked noun morphology and provisional role agreement, not a verified historical sentence translation.

## Why the 3sg prefix cannot be used generically

The dictionary has many different possession examples: no- (first-person singular), i- (often third-person singular), and forms documented as plural ownership, such as inxiuh (their years) and imitzcuinoan (their dogs). A naive rule that every i-initial token has a third-person singular possessor would misclassify these cases and confuse possessor agreement with verb subject agreement.

This stage explicitly authorizes **only** two source-recorded complete tokens, defined in data/possessed_form_evidence.json:

| Written form | Lexical headword | Nominal possessor | Curated historical evidence |
| --- | --- | --- | --- |
| iicxi | icxitl, foot | 3sg | Florentine Codex Book 10, p.161, cited through Online Nahuatl Dictionary |
| itoca | tocaitl, name | 3sg | Primeros Memoriales, p.254, cited through Online Nahuatl Dictionary |

The additional data is a **list of positive exceptions with exact sources and locators**, not a productive noun-possessive paradigm. Existing first-person no- exact forms remain supported with no migration.

## Guardrails

The sentence engine accepts a 3sg possessed noun only when the evidence list, curated lexicon record, located possessed-form claim, and canonical morphological reverse analysis agree on **all** of the original token, headword, part of speech, owner person, i- prefix, exact source URL, original citation locator, and lexical grade. Any invalid/duplicated evidence pack disables all new 3sg readings; it does not erase established no- readings.

The new forms participate in the existing PNP slots and produce possible grammatical **subject/object argument structures** only. They do not generate English sentences or raise complete to true. They preserve the difference between noun possessor 3sg and verb subject 1sg/2sg/3sg. Third-person transitive role assignments remain alternatives, not a choice of named referent.

## Explicit abstentions

- inxiuh (their years) and imitzcuinoan (their dogs): documented third-person plural ownership; never classify as 3sg using initial i.
- itlatqui: lexicon citation points to historical ytlatqui; this extension does not silently change y to i and report the normalization as source-spelled.
- Unreviewed forms such as imā or other i-prefixed analogies.
- Any source without a matching cited editorial claim, any negative or modal sentence requiring extra evidence, and any multiword input with unconsumed words.

## Test scope

Both Node and actual Playwright browser regressions cover exact 3sg forms, mismatched person between possessor and verb subject, reversible argument roles, missing and corrupted evidence packs, same-word and different-word controls, source URL and locator tampering, and deliberate rejection of 3pl/orthographic repairs. These are software integration tests and do not measure historical translation correctness.

## Concurrency

This branch began at merge commit b46cb5f (PR #34) and does not modify the concurrent developer's open PR #35. Its work touches the sentence engine, so changes must be reconciled if PR #35 merges first. Use current main SHA and rerun both workflows before final integration.
