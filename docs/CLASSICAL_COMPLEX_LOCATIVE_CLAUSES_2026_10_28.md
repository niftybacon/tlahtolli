# Complex Classical Nahuatl clauses: finite verbs + relational location + explicit context

**Scope (October 28, 2026):** grammar-composed structural proposals only. This is not free translation, an independently gold-scored evaluation, or a general parser of subordinate clauses.

## Historical and grammatical sources

This module builds on TWO previously source-inspected layers: the 12 verb paradigms in `paradigms.json` and the independently sourced relational noun interpretation in `translator-locative.js`.

- **Relational nouns:** [Online Nahuatl Dictionary — `itic`](https://nahuatl.wired-humanities.org/content/itic), [`-itic`](https://nahuatl.wired-humanities.org/content/itic-0), and [`ītech`](https://nahuatl.wired-humanities.org/content/itech). Molina 1571, Carochi 1645/Lockhart 2001, and Florentine Codex example notes support relational noun possession and the nontrivial meanings of the constructions. The dictionary records `calitic` as “inside the house,” but this implementation **does not** invent fused forms from stand-alone `calli itic`.
- **Noun/locative modifier attachment:** Michel Launey, *An Introduction to Classical Nahuatl* (2011), [Lesson 32, *Attributives, Relative Clauses...*](https://www.cambridge.org/core/books/abs/an-introduction-to-classical-nahuatl/attributives-relative-clauses-copula-verbs-semiauxiliaries/E39B0BBF93FA2B6E7E906C8F6702EAFB). The chapter documents that locative elements may modify nouns and that historical constituent order is flexible. **The engine therefore does not choose automatically** whether a locative locates the event or modifies an overt nominal argument.
- **Finite-person/tense indexing:** existing project `paradigms.json` and `docs/ADVANCED_MORPHOLOGY_ENGINE.md`, with morphological references and the explicit limitation that the 720 generated cells are *not individually historically attested*.

## Exactly what is implemented

A **new, separate** `complexClauseProposals` collection in `TlahtolliSentence.create(...).analyze(text).clauses[n]` supports:

`[finite present/future indexed verb] + [one sourced locative phrase] + [optionally one written in + uniquely recognized noun]`

The **three contiguous components can appear in different orders** without skipping or swallowing extra words. A locative phrase can be `[unique curated noun] [source-listed possessed relational noun]` or `in [noun] [relational]`, and must be separately accepted by the existing locative engine.

Requirements:

1. Exactly one supported finite verb in a **generated indexed present/future cell**, not a hypothesized historical finite string, and a uniquely identified Classical Nahuatl verb lemma in the curated dictionary.
2. Exactly one independently source-supported relational phrase with third-person possessive marking, currently `itic`, `ītech` and documented exact written variants `yitic`, `itech`. No speculative alternate spellings.
3. Zero or one **explicitly written `in` + source-checked noun phrase** outside the locative, with noun–verb role assignment from existing agreement rules. For third-person subject agreement, alternatives are shown rather than selecting a subject/object ordering.
4. All tokens must be covered. Extra arguments, an unmarked object noun, multiple locative phrases, an unidentified trailing form or unsupported question scope result in **no complex proposal**.
5. The result records separate **verb, subject, object, location, ambiguity of semantic locative senses**, and for overt noun arguments the two viable **attachments**: modifying the event *or* modifying the noun. Nothing is flattened into a single polished English sentence.
6. `complete:false` remains the complete-clause result (these are new, **unattested grammatical compositions**). Original `candidates`, `fragmentInterpretations`, `locativeInterpretations`, `agreementProposals` and `morphologicalClues` retain their previous semantics and tests.

### Example structural results (not attested quotations)

| Hypothetical input | Structural result | Unresolved |
| --- | --- | --- |
| `ninemi calli itic` | 1sg present `nemi`, locative `calli itic` | Exact sense of `nemi` and historical syntax |
| `niquittaz in cihuātl calli itic` | 1sg future transitive `itta`, possible object `in cihuātl`, locative `calli itic` | Location of *seeing event* versus *woman*, lexical senses |
| `quitta in cihuātl calli itic` | Two different possible third-person subject/object assignments | No person or object disambiguation from word order alone |
| `ahmo ninemi calli itic` | Explicit preposed negation, recognized 1sg clause structure | Does not independently validate grammatical productivity |
| `ninemi atl yitic nemjnj` | **Refused** | `nemjnj` remains an unresolved agentive noun / verbal form; no extra finite verb invented |

## Context across written clause boundaries

`analyze(text).contextLinks` checks *adjacent fully segmented clauses* for a **literally repeated locative expression**. For example, `ninemi calli itic. nichōca calli itic.` produces a pointer to the two explicitly repeated spellings and notes whether the **indexed grammatical person** is the same or differs.

It DOES NOT infer absent locations, anaphoric reference, identity of speakers, pronoun antecedents, location equality in the physical world, tense across clauses, or a historical attestation of the example.

## Engineering and evaluation

`tools/test_complex_locative_clauses.js` covers varied relative orders, present/future, negation, intransitive versus transitive agreement, 3sg role ambiguity, event/noun attachment alternatives, all-token coverage, repeated written locations, changing person marking, unlicensed word sequences and a missing/forged locative provider.

`tools/test_translator_browser.py` checks the **actual Translator UI**, source citations, unranked alternatives, repeated-location context, and refusal of unresolved `nemjnj` as a second finite predicate.

This is a legitimate **increase in rule coverage**, not proof of any translation accuracy gain. A linguist-reviewed, held-out corpus from independently checked manuscripts remains necessary before assigning a translation score. No new model has been trained.

**Next work:** vetted finite+locative historical passage collection, independently grouped evaluation, then carefully constrained coordination/subordination and pronoun reference. Do not generalize these from a single 1573 deed or the 62r Florentine phrase alone.
