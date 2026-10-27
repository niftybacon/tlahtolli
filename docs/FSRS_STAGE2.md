# FSRS Stage 2 — calibrated, offline study

Classic SRS remains the default. Enable FSRS-5 in the Study options to begin using it. Changing the algorithm, targets, or calibration never mass-reschedules cards. Only grading a review changes a card's due date.

## Per-type retention profiles

Vocabulary, reverse cards and conjugation prompts have separate target retention settings (80–97%). Balanced (90%), Thorough (95%) and Lighter (85%) fill in the form; press Save to apply them.

## Personalized calibration, not full Anki optimization

After at least 30 eligible reviews and 3 misses per profile, Calibrate from local review history searches one stability multiplier per profile to minimize predicted-recall squared error with a regularization penalty. It is deliberately not a 19-weight FSRS optimizer. Missing past review details are never invented. Fewer reviews produce an insufficient-data indication, not fake parameters.

## 30-day scheduling and projections

The detailed study view now shows 30 days of current due dates; when FSRS is enabled it simulates an optimistic scenario with every future answer rated Good and no new cards introduced. A seven-day due-date chart and historical first-review retention remain in Study Insights. The FSRS panel also shows card-type model recall estimates and measured 30-day successes. The projection is illustrative rather than a reliable forecast of actual workload.

## Anki

Existing TSV exports retain stable GUIDs and explicit Anki import headers for vocabulary, reverse cards and grammar-derived conjugations. Importing in Anki preserves note identity when properly mapped, but TSV **does not transfer** card scheduling, history or FSRS memory state. Full JSON backups are the supported way to preserve Tlahtōlli progress. Native APKG collection interchange is not supported.
