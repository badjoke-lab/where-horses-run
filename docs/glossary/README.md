# Glossary programme

The glossary programme is building a **user-facing worldwide horse-racing dictionary/knowledge base**. Each usable entry should explain what a racing term means, its Japanese equivalent, where that usage applies, important regional differences, and the evidence supporting the definition.

Search/AI discovery is a later structured layer. It must not distort the dictionary itself.

## Current authority

Read these first for glossary work:

1. [World racing terminology master specification](world-racing-terminology-master-spec.md)
2. [2026-09-09 glossary roadmap addendum](../project-roadmap-2026-09-09-glossary-addendum.md)
3. [Working master data](../../data/glossary-master/README.md)

## Current state in plain language

The working dictionary has **641 terms/concepts**.

- **592 are source-verified at the meaning level**.
- **49 still require review**: verify, narrow regional scope, rewrite, split, merge, or remove.
- the highest-priority core set is **203/203 verified**;
- jurisdiction-specific research additions are **161/161 verified**;
- publication is still disabled (`public_ready=0`, public runtime disconnected).

The latest pass is **targeted residual wave 6**. It verified **5 additional base Concepts** and retired one duplicate surface Concept using current JRA, BHA, NYRA, HISA and Churchill Downs authority material.

ROLE is now **30/31 verified (96.8%)**, TRAIN **24/26 (92.3%)**, WEIGHT **32/34 (94.1%)**, and SURF **57/62 (91.9%)**. The pass verified Claiming allowance, Breeze, Gate schooling, Layoff and Track announcer; `Grass` was merged into `Turf` and `Race caller` was corrected to `Track announcer`.

This pass reduces duplicate semantics instead of chasing a percentage: JRA explicitly links grass and turf, while the role title is normalized to the current authority-backed North American usage.

## What has been completed

The dictionary was built from zero rather than copied from the existing public glossary. Major jurisdiction/local-language research and the current slang/abbreviation/historical pass are complete. The core terminology set is fully source-verified, and all current jurisdiction-specific additions are evidence-backed.

Base-dictionary cleanup has now verified **278 additional terms** and removed **16 duplicate or malformed rows**. Current base-dictionary coverage is **431/480 verified (89.8%)**.

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
data/glossary-master/coverage/master-005-evidence-coverage-v1.tsv
data/glossary-master/coverage/master-005-completion-gate-v1.tsv
```

The abbreviation/code layer remains at **38 source-verified rows**.

## Near-complete categories

- RUN: **42/44 verified (95.5%)** — Jump and Hold-up horse remain candidate.
- EQUIP: **27/29 verified (93.1%)** — Blinders and Barefoot remain candidate.
- MEET: **37/38 verified (97.4%)** — only Daylight saving time remains candidate.
- RESULT: **27/28 verified (96.4%)** — the remaining item is RO/result-code modeling; the RUN event Ran out is verified.
- BET: **38/39 verified (97.4%)** — American odds remains candidate.
- WELF: **18/18 verified (100%)**.
- DISC: **16/17 verified (94.1%)** — Endurance racing remains under modeling review.
- RTYPE: **106/111 verified (95.5%)** — five race-type residuals remain under review.
- DIST: **18/21 verified (85.7%)** — Kilometre, Fraction and Final fraction remain under review.
- SURF: **57/62 verified (91.9%)** — Grass was merged into Turf; five product/weather/analysis residuals remain candidate.
- WEIGHT: **32/34 verified (94.1%)** — Weight rise and Weight drop remain under review.
- ENTRY: **29/31 verified (93.5%)** — Waitlist and Qualification remain under review.
- PRIZE: **10/12 verified (83.3%)** — Bonus and Stake remain candidate.
- ROLE: **30/31 verified (96.8%)** — Commentator remains under review.
- TRAIN: **24/26 verified (92.3%)** — Cool down and Freshened remain under review.
- VENUE: **39/44 verified (88.6%)** — five facility/orientation residuals remain under review.
- HORSE: **27/34 verified (79.4%)** — seven horse identity/age/origin residuals remain under review.
- BREED: **15/22 verified (68.2%)** — seven breeding/facility/industry residuals remain under review.

## What remains

The **49 remaining terms** are not all expected to become verified unchanged. Some seed terms are broad, duplicated, polysemous, regional, or badly named. Review means choosing the correct action rather than chasing a percentage.

Targeted residual wave 6 is complete for the current defensible source bundle. The next step is to continue residual cleanup across the remaining base-seed categories while leaving intentionally weak edge cases visible until stronger evidence or a cleaner modeling decision exists.

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
