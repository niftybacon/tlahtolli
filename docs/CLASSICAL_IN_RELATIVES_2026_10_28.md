# Classical Nahuatl `in`: headed relatives, finite dependencies and cautious antecedents

**Development milestone:** October 28, 2026. **Output status:** source-checked grammar hypotheses, **not** independently attested example translations, supervised language-model training, verified manuscript paleography, or a complete Classical Nahuatl sentence interpreter.

## Why `in` cannot always mean an English article

1. [Online Nahuatl Dictionary, `in`](https://nahuatl.wired-humanities.org/content/in), with Molina 1571, Karttunen 1992 and Lockhart 2001, discusses a particle variously used as an article-like noun introducer, subordinator, and demonstrative. An identical written surface is not proof of one syntactic category.
2. Michel Launey, [*An Introduction to Classical Nahuatl*, Lesson 32](https://www.cambridge.org/core/books/abs/an-introduction-to-classical-nahuatl/attributives-relative-clauses-copula-verbs-semiauxiliaries/E39B0BBF93FA2B6E7E906C8F6702EAFB), describes noun-modifying relative clauses and the role of finite verbal agreement; postnominal `in` relatives are common, and the relative gap is not uniquely resolved in all transitive 3sg clauses.
3. James Lockhart, *Nahuatl as Written* (2001), section on the particle `in` with verbal clauses (pp. 59 ff), includes historical examples of headed relatives after nouns and warns against treating every subordinate `in` as a literal English article.
4. [George Bedell, *The Nahuatl Language* (2011), pp. 21–22](https://www.languageinindia.com/nov2011/bedellnawatorugo.pdf), includes separate noun-argument, purpose, conditional and relative clauses with `in`. The text discusses the role of verbal agreement and examples such as an overt woman head followed by a relative verbal clause, plus the `mati` family taking subordinate clauses. Examples in the parser tests below are synthetic demonstrations of these rules, **not quotations from this source**.
5. Michel Launey, [Lesson 31, *Noun Clauses*](https://www.cambridge.org/core/books/abs/an-introduction-to-classical-nahuatl/noun-clauses/F671D417C8996C3D444F793A9B73F550), distinguishes clauses serving as subjects or objects from indirect questions, verbal adjuncts and simple noun phrases.
6. [D. K. Jordan, *Nahuatl Grammar Notes*](https://pages.ucsd.edu/~dkjordan/nahuatl/nahugram.html), provides the subject/object verbal-indexing tables. Verbal 3sg subject marking is zero; transitive 3sg object indexes cannot by themselves tell whether the relative head is the subject or object of a 3sg transitive clause.

## New behavior: explicit source-bounded `in` proposals

The engine extends **`translator-sentence.js`**, not an isolated text imitation, with these **separate optional data fields**:

**`relativeClauseProposals`** – Exact `in [single curated noun] in [one indexed finite verb]` with optional one-word finite matrix verb before the head. The first `in` is recorded as article-like and the second as a possible relative introducer. To link the overt head to an omitted role:

- An **intransitive 3sg** relative verb may link the nominal head to the **relative subject** only.
- A **transitive 1sg, 2sg, or other non-3sg** relative verb may link the third-person nominal head to a **3sg relative object** slot only.
- A **transitive 3sg** relative verb has both 3sg subject and 3sg object slots; **both roles remain available and unranked**.
- An optional matrix verb is independently matched against the project's source-linked indexed present/future cell and its **agreement-compatible noun role**. No more than one nominal head can be consumed.
- This does NOT identify a person, resolve cross-document coreference, prove a shared object, or select a historical English translation.

Example diagnostic input `in cihuātl in chōca` => possible relative subject. `in cihuātl in niquitta` => possible relative object. `in cihuātl in quitta` => both. `niquitta in cihuātl in chōca` => possible noun argument of the finite matrix plus subject of the relative clause. `ninemi in cihuātl in chōca` is **rejected** because the 1sg intransitive matrix verb does not license an overt third-person subject there.

**`nominalInProposals`** – A very narrow `[indexed transitive mati or itta] in [single indexed finite verb]` construction. A dependent **finite** unit differs from `in [noun]`; the record says **possible nominalized complement OR adverbial subordinate clause**, without deciding if/that/when/purpose or assigning cross-clause identity. `nicmati in nichōca` is an illustrative *grammatical hypothesis*, not a historical quotation or confirmed idiomatic sentence. Other matrix verbs, hypothetical past-tense spelling repairs, multiword embedded predicates, negative subordinate scopes and interrogatives remain unsupported.

**`antecedentProposals`** – Across **two adjacent punctuation-separated simple indexed clauses only**, a preceding uniquely analyzed overt **3sg intransitive subject** `in [curated noun]` may be named as a **single agreement-compatible antecedent candidate** for a following **unexpressed 3sg subject**. Both clauses must have a unique grammatical frame (multiple English dictionary senses are allowed); no overt competing argument, complex locative alternative, or relative-clause frame can be present. This is **NOT reference resolution**: unmentioned third parties remain possible, and the interface explicitly disclaims identity inference. There is no lookback beyond the immediately preceding sentence.

This proposal is intended as a **safety-first intermediate representation** for future discourse modeling, not an engine that actually identifies people's antecedents from weak agreement alone.

## Compatibility and abstention

- `complete:false` remains in force for all newly handled relative and subordinate patterns. Unlike the existing narrow simple-clause cases, they do **not** generate fluent English `candidates`.
- Original `in cihuātl` noun phrases inside supported simple clauses retain their previous `complete:true` readings; they are not reclassified as subordinators.
- Existing `auh` coordination, `intla` conditional patterns, source-specific `ticnamaca y¯ totlal`, locatives, productive morphology and cited dictionary glosses remain separate.
- Historical manuscripts such as the 1573 Coyoacán land deed are **not** being memorized as relative-clause gold references, and none of the examples below change the zero independently approved held-out evaluation pairs.
- Future expansion: subject/object relatives with additional overt nouns, possessors of relational nouns, historical plural agreement, clausal complement valency by independent manuscript evidence, subordinate temporal and purpose markers, and cautiously graded cross-sentence inference with a true held-out dataset.

**Validation:** `node tools/test_relative_in_antecedents.js` and existing regression suites, plus `tools/test_translator_browser.py` for the actual Translator panels. CI must be green before merge.
