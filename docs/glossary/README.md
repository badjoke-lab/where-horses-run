# Glossary programme

The glossary programme is building a **user-facing worldwide horse-racing dictionary/knowledge base**. Each usable entry should explain what a racing term means, its Japanese equivalent, where that usage applies, important regional differences, and the evidence supporting the definition.

Search/AI discovery is a later structured layer. It must not distort the dictionary itself.

## Current authority

Read these first for glossary work:

1. [World racing terminology master specification](world-racing-terminology-master-spec.md)
2. [2026-09-09 glossary roadmap addendum](../project-roadmap-2026-09-09-glossary-addendum.md)
3. [Working master data](../../data/glossary-master/README.md)

## Current state in plain language

The working dictionary has **642 terms/concepts**.

- **581 are source-verified at the meaning level**.
- **61 still require review**: verify, narrow regional scope, rewrite, split, merge, or remove.
- the highest-priority core set is **203/203 verified**;
- jurisdiction-specific research additions are **161/161 verified**;
- publication is still disabled (`public_ready=0`, public runtime disconnected).

The latest pass is **targeted residual wave 4**. It verified **8 additional base Concepts** across RTYPE, HORSE, BREED and ROLE using current registry, racing-authority and racecourse evidence.

RTYPE is now **104/111 verified (93.7%)**, HORSE **27/34 (79.4%)**, BREED **15/22 (68.2%)**, and ROLE **28/31 (90.3%)**. The pass verified Weanling, Breeding farm, Family, Owner-trainer, Derby, Classic race, Sprint race and Middle-distance race.

The pass includes an evidence-driven canonical correction from `Stud farm` to `Breeding farm` and keeps jurisdiction/taxonomy boundaries explicit.

## What has been completed

The dictionary was built from zero rather than copied from the existing public glossary. Major jurisdiction/local-language research and the current slang/abbreviation/historical pass are complete. The core terminology set is fully source-verified, and all current jurisdiction-specific additions are evidence-backed.

Base-dictionary cleanup has now verified **267 additional terms** and removed **15 duplicate or malformed rows**. Current base-dictionary coverage is **420/481 verified (87.3%)**.

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
- RTYPE: **104/111 verified (93.7%)** — seven race-type residuals remain under review.
- DIST: **18/21 verified (85.7%)** — Kilometre, Fraction and Final fraction remain under review.
- WEIGHT: **31/34 verified (91.2%)** — Claiming allowance, Weight rise and Weight drop remain candidate.
- SURF: **57/63 verified (90.5%)** — six product/identity/weather/analysis residuals remain candidate.
- RTYPE: **100/111 verified (90.1%)** — eleven broad or regional race-type labels remain candidate.
- ENTRY: **28/31 verified (90.3%)** — Waitlist, Late withdrawal and Qualification remain under review.
- PRIZE: **10/12 verified (83.3%)** — Bonus and Stake remain candidate.
- DIST: **17/21 verified (81.0%)** — four measurement/timing rows remain candidate.
- ROLE: **28/31 verified (90.3%)** — Race caller, Commentator and Racing secretary remain under review.
- TRAIN: **20/26 verified (76.9%)** — six edge terms remain under review.
- VENUE: **38/44 verified (86.4%)** — six facility/orientation residuals remain under review.
- HORSE: **27/34 verified (79.4%)** — seven horse identity/age/origin residuals remain under review.
- BREED: **15/22 verified (68.2%)** — seven breeding/facility/industry residuals remain under review.

## What remains

The **61 remaining terms** are not all expected to become verified unchanged. Some seed terms are broad, duplicated, polysemous, regional, or badly named. Review means choosing the correct action rather than chasing a percentage.

Targeted residual wave 1 is complete for the current defensible source bundle. The next step is to continue residual cleanup across the remaining base-seed categories while leaving intentionally weak edge cases visible until stronger evidence or a cleaner modeling decision exists.

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
