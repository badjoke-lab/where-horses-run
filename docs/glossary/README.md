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

- **504 are source-verified at the meaning level**.
- **138 still require review**: verify, narrow regional scope, rewrite, split, merge, or remove.
- the highest-priority core set is **203/203 verified**;
- jurisdiction-specific research additions are **161/161 verified**;
- publication is still disabled (`public_ready=0`, public runtime disconnected).

The equipment/training pass is now closed for the current defensible scope. `Pre-parade` was verified from current Jockey Club material, and `Bike/Racebike` was consolidated into `Sulky` from USTA evidence. EQUIP is **27/29 verified (93.1%)** and TRAIN is **20/26 verified (76.9%)**.

The remaining equipment/training labels are not being percentage-promoted without strong evidence. `Blinders`, `Barefoot`, `Breeze`, `Gate schooling`, `Qualifying trial`, `Cool down`, `Layoff` and `Freshened` stay visible for later review.

RUN remains **42/44 verified (95.5%)**, with only `Jump` and `Hold-up horse` unresolved.

## What has been completed

The dictionary was built from zero rather than copied from the existing public glossary. Major jurisdiction/local-language research and the current slang/abbreviation/historical pass are complete. The core terminology set is fully source-verified, and all current jurisdiction-specific additions are evidence-backed.

Base-dictionary cleanup has now verified **190 additional terms** and removed **15 duplicate or malformed rows**. Current base-dictionary coverage is **343/481 verified (71.3%)**.

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
- PRIZE: **10/12 verified (83.3%)** — Bonus and Stake remain candidate.
- TRAIN: **20/26 verified (76.9%)** — six edge terms remain under review.

## What remains

The **138 remaining terms** are not all expected to become verified unchanged. Some seed terms are broad, duplicated, polysemous, regional, or badly named. Review means choosing the correct action rather than chasing a percentage.

The next broad cleanup target is **horse / breeding / participant roles**. After that come venue/entry and the remaining race type/surface/distance/weight candidates. Deliberately unresolved edge cases stay visible for later evidence-driven resolution rather than blocking work on clearer categories.

After that cleanup, the evidence/readiness gate will be rerun. `MASTER-006` and public glossary architecture remain blocked until that review is defensible.

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
