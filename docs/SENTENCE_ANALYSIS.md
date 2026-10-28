# Clause translation: participant constraints and English realization

## Current behavior

The sentence layer indexes the existing present and future rows of all 12 paradigms: 144 indexed cells. Forms are matched with NFC and case normalization, without stripping diacritics or generating new Nahuatl paradigms. Each complete candidate consumes every input token under the supported grammar; this is coverage, not verified translation correctness.

A predicate may stand alone or appear with one or two contiguous `in + citation noun` phrases, before or after it. Subject agreement and transitivity constrain their possible roles:

- Intransitive predicate: at most one stated subject, currently limited to a 3sg reading.
- Transitive predicate with first/second-person subject: one third-person noun phrase fills the indexed object role.
- Transitive 3sg predicate with one noun phrase: retain both subject and object assignments; the other participant stays pronominal.
- Transitive 3sg predicate with two noun phrases: retain both assignments. Input order does not rank them.

A noun phrase cannot straddle the predicate. Extra words, extra predicates, unknown nouns, duplicate competing noun records, unsupported questions and oversized input do not yield complete readings. Negation (`ahmo` / `ahmō`) is currently accepted only at the start of each clause. Periods, exclamation marks, semicolons and newlines delimit separate analysis units; these are engineering boundaries, not manuscript sentence segmentation claims. No person or sense is carried from one clause into another.

## English generation

All 12 verbs now have explicit editorial English base and third-person forms. Affirmative present uses ordinary English agreement; negative present uses do/does not; future uses will/will not. The output preserves the indexed transitive object as him/her/it unless a noun phrase fills that role. It does not infer gender or antecedents.

Examples constructed to test the implementation (not new historical attestations):

- `niquitta in cihuātl` → I see the woman (also inspect/look at options).
- `ahmo niquittaz in cihuātl` → I will not see the woman.
- `quitta in cihuātl in conetl` → The woman sees the child / The child sees the woman, without ranking either role assignment.

The English options are a selected subset of the existing dictionary senses. Twelve common noun lemmas have readable selected senses; other indexed nouns retain bracketed full meanings. Every stated noun carries `nounSenses` records with its selected wording, full dictionary meaning and source, and the interface displays them. Selecting “woman” for readable output does not prove that all uses of cihuātl mean woman rather than another indexed sense. English articles are editorial. Verb options likewise are illustrative rather than exhaustive. The system does not yet perform lexical sense ranking, idiom interpretation, discourse reference or aspect disambiguation. Present/future candidates do not exclude homographic analyses in other tenses or moods.

## Provenance and limits

- Michel Launey, *An Introduction to Classical Nahuatl*, translated/adapted Christopher Mackay (2011), sections 1.4–1.5 (printed p.15: intransitive subject position and agreement), 2.9 (pp.23–24: negation), 3.1 (p.26: transitive participant prefixes). Consulted 2026-10-28 in publisher preview: https://api.pageplace.de/preview/DT0400.9780511985027_A23683606/preview-9780511985027_A23683606.pdf . These support the grammatical ingredients. Role enumeration is our bounded editorial formalization, not a claim that the source verifies each generated clause or every supported word order.
- D. K. Jordan, *Inadequate Nahuatl Reference Grammar*, subject/object prefix tables and verb table 1, base 3 (future), https://pages.ucsd.edu/~dkjordan/nahuatl/nahugram.html , consulted 2026-10-28. These are the author's compact reference notes, not independent expert validation of this implementation. The implementation uses existing indexed cells rather than treating the notes as a complete generator.
- Existing dictionary.json and paradigms.json provide the lexical meanings, forms and source URLs. English realization tables are editorial mappings of selected senses already in those entries. No new manuscript readings, lexical attestations, paradigm cells or review grades were added.

Plural stated-subject agreement, plural object morphology, possessives, noun modifiers, questions, past tenses, subordinate clauses, coordination, semantic plausibility ranking and discourse coreference remain unsupported. The restriction to citation nouns is intentional; it must not be read as a claim that other constructions are ungrammatical. Sense selection and reversible roles can multiply alternatives; none is asserted as an authoritative full-sentence translation.

## Validation

Tests exercise all 144 supported cells both affirmatively and negatively (288 behavior checks), English agreement and future marking, explicit objects, both roles for a single third-person noun, both assignments for two nouns across multiple orders, full token coverage, source/sense retention, and clause-local negation. Negative controls include interrupted noun phrases, extra arguments, extra predicates, unknowns, conflicting records and questions. Browser regressions check future negation, complete alternative meanings and both reversible readings. These are constructed engineering controls, not a held-out translation evaluation, and do not measure historical translation accuracy. No model training or expert review is claimed.
