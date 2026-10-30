# Source-gated English: connect Tēntli's existing engines to neural scoring

**Status: research integration; canonical draft remains the default.**
This is **not a newly trained neural translator** and does not mean
Classical Nahuatl→English accuracy was independently established.

## Root cause and intended architecture

The [actual two-checkpoint neural test](TENTLI_REAL_NEURAL_INFERENCE_EVALUATION_2026_10_29.md)
confirmed that raw unconstrained generation produced nonsense for
short inputs (e.g. `nichōca` → `nca`) after thousands of
Nahuatl-only denoising steps. The separately source-bounded canonical
grammar correctly drafted eight of eight constructed grammar controls.

The problem is **not** that `nca` needs a post hoc English spelling
correction. That would be an unsourced translation hallucination.
The solution is to constrain what the neural model can output:

```
Original source-written Classical Nahuatl
         |
existing canonical morphology (source and evidence grade)
         v
existing sentence / role / possessive grammar
         v
existing English composer (ALL words accounted for)
         v
existing grammar IR evidence/role audit
         |
         +-- incomplete/unsupported --> ABSTAIN, partial morphology clues
         |
         +-- complete --> bounded, source-linked English alternatives
                                     |
                           optional PyTorch Tēntli scorer
                           teacher-forced English candidate likelihood
                                     |
                  [canonical default] or [explicit experimental ranking]
                                     |
                  ONLY a fully source-licensed candidate, NEVER raw
                  autoregressive nonsense like 'nca'
```

The bridge consumes the **same** `translator-sentence.js`,
`translator-english.js`, `translator-grammar-ir.js`, original
`tools/morphology_engine.js` and repository dictionary/paradigms:
`tools/source_gated_english_bridge.js`. **No second conjugation,
dictionary, historical-word validator, or independent grammatical
parser is introduced.** The Python scoring wrapper is
`neural/hybrid_infer.py`.

The bridge automatically supplies the optional
`data/predicate_english.json` when present, to work with PR #92's
separately developed **82 lexically gated English predicate
realizations**. It does not copy, merge or modify that PR. Without
that pack the existing 12 built-in verbs remain available; the
bridge must not invent `nicochi` English from bare morphology.

### Meaning of the neural likelihood

Each fully audited English option is *already* authorized by the
canonical software and has source URLs. The actual byte Transformer
receives the original Nahuatl text with the `translate` task tag;
the scorer then teacher-forces each English candidate and computes
**average negative log likelihood per output byte**. It can estimate
which of these *proposed strings* it models best. This is **not a
calibrated meaning score**, not a way to verify a dictionary sense,
not a human translation review, and not a license to use an
unconstrained neural generation.

The default policy is deliberately `canonical`: keep the canonical
source-aware draft while returning neural scores for research.
`experimental-neural-ranked` is explicit opt-in and can
only choose an already source-audited grammatical alternative;
if candidate enumeration is incomplete or the source exceeds the
neural byte limit, it stays with the canonical draft.

We score a bounded number of complete alternatives (default <=32,
hard limit 64). For combinatorially larger compositions we keep the
canonical first reading and declare the alternative enumeration
incomplete, rather than omitting some words or falsely asserting a
fully ranked search.

## Authentic saved-weight experiment

[GitHub Actions real-model guarded-English run](https://github.com/niftybacon/tlahtolli/actions/runs/40998248504)
restored the **real trained checkpoint from
Temoa/Chimalpahin #40993235240**, not a synthetic fixture.

The seven supported grammar-control inputs already showed these
canonical drafts, versus previous raw free-generation nonsense:

| Original Nahuatl | Unsafe raw neural | Source-audited guarded English |
| --- | --- | --- |
| `nichōca` | `nca` | `I cry.` |
| `nitlacua` | `n tla` | `I eat.` |
| `niquitta in cihuātl` | repetition of `in` | `I see the woman.` |
| `ahmo niquittaz in cihuātl` | repetition | `I will not see the woman.` |
| `niquitta in cihuātl in chōca` | Nahuatl-like fragment | `I see the woman that cries.` |
| `nichōca auh nitlacua` | repetition | `I cry. I eat.` |
| `chōca in cihuātl. chōca` | fragment | `The woman cries. He / she / it cries.` |

The neural model **actually scored** those alternatives:
`nichōca` preferred `I cry.` over `I weep.` by a lower
mean byte negative log-likelihood (**5.3478 versus 6.0114**).
For `niquitta in cihuātl`, it preferred `I inspect the woman.`
over `I see the woman.` (**4.2004 versus 4.8323**), despite the
canonical first reading being the more ordinary English.
These examples demonstrate **why we do not treat neural
likelihood as contextual semantic confidence**.

Unsupported inputs including `xyzzy`,
`asfdghjk xyzwe` and `nichōca auh xyzzy` **abstain**
with no neural computation and no English invention.

A structurally supported **396-byte** source input exceeds the
trained model's **254 UTF-8 byte** input budget. The hybrid returns
its complete canonical draft while **skipping** the neural model
and recording the bound explicitly, rather than truncating it.
Targets longer than 254 bytes similarly are not silently scored.
This is a correctness guard, **not a longer-context architecture**.

### Important limits

- These are **constructed known development examples**, NOT fresh
  blind human-reviewed manuscript translations. The eight prior
  controls already informed grammar code; English phrasing is
  **editorial** and ambiguity remains. **Independent historical
  translation accuracy is unknown**.
- All English emitted by the hybrid comes from the **source-audited
  canonical composer**, not a neural model that learned English
  translation. The neural model still fails unconstrained English
  generation and has not been retrained by this PR.
- The existing English composer remains limited by dictionary
  coverage, morphology/argument roles and documented rules.
  Unparsable authentic documents still abstain. The open PR #92
  addresses many previously missing predicate English mappings
  independently; it does not by itself fix full historical
  paragraph interpretation.
- The byte-level model still requires longer-context and
  multilingual/task provenance work for substantial discourse.
  This approach deliberately does NOT swap in modern Nahuatl
  dialect text or treat unsupported historical readings as valid.
- The current inference code had previously exposed unsafe free
  neural decoding under the `translate` label. Now the default
  **English** research inference uses this guarded hybrid;
  free decoding is available **only explicitly** with
  `--raw-neural` as *unverified model diagnostic*, never a source
  translation. The public website translator and canonical source
  engines are unchanged.

## Reproduction

```sh
node tools/test_source_gated_english_bridge.js
python -m unittest discover -s tools -p test_tentli_hybrid_infer.py -v

# With a real restored checkpoint:
python -m neural.infer --task translate \
  --model-dir /path/to/saved-research-checkpoint --text 'nichōca'
python -m neural.hybrid_infer --text 'nichōca' \
  --model-dir /path/to/saved-research-checkpoint \
  --selection experimental-neural-ranked
```

Review [the actual safeguarded-English training-checkpoint CI
workflow](../.github/workflows/tentli-source-gated-hybrid.yml)
for strict negative controls, scores, truncation checks,
existing neural/teacher smoke regressions and saved JSON outputs.

**Next capability work should prioritize widening source-checked
historical grammar and properly aligned English supervision**, not
merely increasing byte denoising steps. An independent blinded
human-reviewed Classical Nahuatl–English benchmark is still required
before claiming translation quality.
