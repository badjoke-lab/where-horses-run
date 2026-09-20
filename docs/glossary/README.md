# Glossary programme

The glossary programme is building a **user-facing worldwide horse-racing dictionary/knowledge base**. Each usable entry should explain what a racing term means, its Japanese equivalent, where that usage applies, important regional differences, and the evidence supporting the definition.

Search/AI discovery is a later structured layer. It must not distort the dictionary itself.

## Current authority

Read these first for glossary work:

1. [World racing terminology master specification](world-racing-terminology-master-spec.md)
2. [2026-09-09 glossary roadmap addendum](../project-roadmap-2026-09-09-glossary-addendum.md)
3. [Working master data](../../data/glossary-master/README.md)

## Current state in plain language

The working dictionary has **622 terms/concepts**.

- **603 are source-verified at the meaning level**.
- **19 still require review**: verify, narrow regional scope, rewrite, split, merge, or remove.
- the highest-priority core set is **203/203 verified**;
- jurisdiction-specific research additions are **161/161 verified**;
- publication is still disabled (`public_ready=0`, public runtime disconnected).

The latest pass is **targeted residual wave 11**. It verified **4** scoped Concepts and retired **4** unsupported/polysemous/context rows: Older horse, Veteran horse, Imported horse and Walking ring are verified; Waitlist, Stud, Surface switch and Freshened are removed from the active Concept set.

Current whole-master coverage is **603/622 verified (96.9%)** with **19 candidates**. Active base seed is **442/461 verified (95.9%)**. ENTRY is **29/29 verified (100%)**, HORSE **31/33 (93.9%)**, VENUE **40/42 (95.2%)**, SURF **59/61 (96.7%)**, and TRAIN **24/25 (96.0%)**.

These rows were removed because the active glossary already models the underlying racing meaning more cleanly, or because the seed represented generic analytical/presentation context rather than an independent racing term.

## What has been completed

The dictionary was built from zero rather than copied from the existing public glossary. Major jurisdiction/local-language research and the current slang/abbreviation/historical pass are complete. The core terminology set is fully source-verified, and all current jurisdiction-specific additions are evidence-backed.

Base-dictionary cleanup has now verified **289 additional terms** and removed **35 duplicate, malformed or non-independent rows**. Current base-dictionary coverage is **442/461 verified (95.9%)**.

Canonical evidence/audit files include:

```text
data/glossary-master/sources/p1-core-sources-v1.tsv
data/glossary-master/sources/p1-core-sources-v2.tsv
data/glossary-master/sources/race-type-condition-sources-v1.tsv
data/glossary-master/sources/surface-going-sources-v1.tsv
data/glossary-master/sources/meeting-schedule-sources-v1.tsv
data/glossary-master/sources/result-decision-sources-v1.tsv
data/glossary-master/sources/prize-betting-sources-v1.tsv
data/glossary-master/sources/welfare-safety-sources-v1.tsv
data/glossary-master/sources/residual-edgecase-sources-v1.tsv
data/glossary-master/sources/run-trip-sources-v1.tsv
data/glossary-master/sources/equipment-training-sources-v1.tsv
data/glossary-master/sources/horse-breeding-role-sources-v1.tsv
data/glossary-master/sources/venue-entry-sources-v1.tsv
data/glossary-master/sources/broad-category-sources-v1.tsv
data/glossary-master/sources/targeted-residual-sources-v1.tsv
data/glossary-master/sources/targeted-residual-sources-v2.tsv
data/glossary-master/sources/targeted-residual-sources-v3.tsv
data/glossary-master/sources/targeted-residual-sources-v4.tsv
data/glossary-master/sources/targeted-residual-sources-v5.tsv
data/glossary-master/sources/targeted-residual-sources-v6.tsv
data/glossary-master/sources/targeted-residual-sources-v10.tsv
data/glossary-master/sources/targeted-residual-sources-v11.tsv
data/glossary-master/coverage/p1-verification-wave1-v1.tsv
data/glossary-master/coverage/p1-verification-wave2-v1.tsv
data/glossary-master/coverage/race-type-condition-verification-v1.tsv
data/glossary-master/coverage/surface-going-verification-v1.tsv
data/glossary-master/coverage/meeting-schedule-verification-v1.tsv
data/glossary-master/coverage/result-decision-verification-v1.tsv
data/glossary-master/coverage/prize-betting-verification-v1.tsv
data/glossary-master/coverage/welfare-safety-verification-v1.tsv
data/glossary-master/coverage/residual-edgecase-verification-v1.tsv
data/glossary-master/coverage/run-trip-verification-v1.tsv
data/glossary-master/coverage/run-trip-verification-v2.tsv
data/glossary-master/coverage/run-trip-verification-v3.tsv
data/glossary-master/coverage/equipment-training-verification-v1.tsv
data/glossary-master/coverage/equipment-training-residual-v1.tsv
data/glossary-master/coverage/horse-breeding-role-verification-v1.tsv
data/glossary-master/coverage/venue-entry-verification-v1.tsv
data/glossary-master/coverage/broad-category-verification-v1.tsv
data/glossary-master/coverage/targeted-residual-verification-v1.tsv
data/glossary-master/coverage/targeted-residual-verification-v2.tsv
data/glossary-master/coverage/targeted-residual-verification-v3.tsv
data/glossary-master/coverage/targeted-residual-verification-v4.tsv
data/glossary-master/coverage/targeted-residual-verification-v5.tsv
data/glossary-master/coverage/targeted-residual-verification-v6.tsv
data/glossary-master/coverage/targeted-residual-resolution-v7.tsv
data/glossary-master/coverage/targeted-residual-resolution-v8.tsv
data/glossary-master/coverage/targeted-residual-resolution-v9.tsv
data/glossary-master/coverage/targeted-residual-resolution-v10.tsv
data/glossary-master/coverage/targeted-residual-resolution-v11.tsv
data/glossary-master/coverage/master-005-evidence-coverage-v1.tsv
data/glossary-master/coverage/master-005-completion-gate-v1.tsv
```

The abbreviation/code layer remains at **38 source-verified rows**.

## Near-complete categories

- RUN: **42/44 verified (95.5%)** — Jump and Hold-up horse remain candidate.
- EQUIP: **28/28 verified (100%)** — wave 10 retired Blinders into Blinkers and verified Barefoot.
- MEET: **37/37 verified (100%)** — wave 8 retired generic Daylight saving time as Time zone context.
- RESULT: **27/27 verified (100%)** — wave 7 retired the unsupported RO code row into the verified Ran out event Concept.
- BET: **38/38 verified (100%)** — wave 9 retired generic sportsbook American odds as contextual Odds presentation.
- WELF: **18/18 verified (100%)**.
- DISC: **16/17 verified (94.1%)** — Endurance racing remains under modeling review.
- RTYPE: **108/109 verified (99.1%)** — Cup race is the only remaining race-type candidate.
- DIST: **19/20 verified (95.0%)** — Fraction was corrected to verified Fractional time; Final fraction remains under review.
- SURF: **59/61 verified (96.7%)** — wave 11 retired broad Surface switch; Cushion Track and Track bias remain candidate.
- WEIGHT: **32/32 verified (100%)** — wave 9 retired derived Weight rise/drop comparison labels.
- ENTRY: **29/29 verified (100%)** — wave 11 retired unsupported generic Waitlist.
- PRIZE: **10/12 verified (83.3%)** — Bonus and Stake remain candidate.
- ROLE: **30/30 verified (100%)** — wave 9 retired malformed Commentator; Track announcer remains the verified race-calling role.
- TRAIN: **24/25 verified (96.0%)** — Freshened was retired as vague layoff context; Cool down remains under review.
- VENUE: **40/42 verified (95.2%)** — Walking ring is verified in Keeneland scope; Round course and Oval remain under review.
- HORSE: **31/33 verified (93.9%)** — wave 11 verified Older horse, Veteran horse and Imported horse; Homebred and Locally bred remain under review.
- BREED: **15/20 verified (75.0%)** — polysemous Stud was retired; five breeding/industry residuals remain under review.

## What remains

The **19 remaining terms** are not all expected to become verified unchanged. Some seed terms are broad, duplicated, polysemous, regional, or badly named. Review means choosing the correct action rather than chasing a percentage.

Targeted residual wave 11 is complete for the current defensible source bundle. The next step is to continue residual cleanup across the remaining base-seed categories while leaving intentionally weak edge cases visible until stronger evidence or a cleaner modeling decision exists.

After that residual cleanup, the evidence/readiness gate will be rerun. `MASTER-006` and public glossary architecture remain blocked until that review is defensible.

## Dictionary modeling rule

```text
find the term in actual racing material
-> determine the exact sense
-> preserve country/region and local-language usage
-> add a source that supports that claim
-> split meanings that are genuinely different
-> merge abbreviations, spelling variants, codes, regional labels, or duplicate identities when appropriate
-> leave uncertain entries under review instead of inventing certainty
```

The existing public glossary remains a disposable runtime baseline and is not the source of truth for this new dictionary.
