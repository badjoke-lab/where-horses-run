# Glossary programme

The glossary programme is building a **user-facing worldwide horse-racing dictionary/knowledge base**. Each usable entry should explain what a racing term means, its Japanese equivalent, where that usage applies, important regional differences, and the evidence supporting the definition.

Search/AI discovery is a later structured layer. It must not distort the dictionary itself.

## Current authority

Read these first for glossary work:

1. [World racing terminology master specification](world-racing-terminology-master-spec.md)
2. [2026-09-09 glossary roadmap addendum](../project-roadmap-2026-09-09-glossary-addendum.md)
3. [Working master data](../../data/glossary-master/README.md)

## Current state in plain language

The working dictionary has **645 terms/concepts**.

- **474 are source-verified at the meaning level**.
- **171 still require review**: verify, narrow regional scope, rewrite, split, merge, or remove.
- the highest-priority core set is **203/203 verified**;
- jurisdiction-specific research additions are **161/161 verified**;
- publication is still disabled (`public_ready=0`, public runtime disconnected).

The latest completed pass is the second **running / trip / race-comment terminology** bundle. Five more Concepts were verified: Stalker, Presser, Pocket, Cover and Parked out. Generic `Pacesetter` was retired into `Front-runner`; the separate tactical-pacemaker Concept remains intact.

The RUN passes preserve discipline and regional boundaries rather than treating every racing-comment label as globally interchangeable. Harness positioning stays Harness-scoped, while the Equibase running-style labels remain North American.

Five earlier edge cases remain deliberately unresolved: `Daylight saving time`, `Ran Out`, generic `Bonus`, polysemous `Stake`, and `American odds`.

## What has been completed

The dictionary was built from zero rather than copied from the existing public glossary. Major jurisdiction/local-language research and the current slang/abbreviation/historical pass are complete. The core terminology set is fully source-verified, and all current jurisdiction-specific additions are evidence-backed.

Base-dictionary cleanup has now verified **160 additional terms** and removed **12 duplicate or malformed rows**. Current base-dictionary coverage is **313/484 verified (64.7%)**.

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
data/glossary-master/coverage/master-005-evidence-coverage-v1.tsv
data/glossary-master/coverage/master-005-completion-gate-v1.tsv
```

The abbreviation/code layer remains at **38 source-verified rows**.

## Near-complete categories

- MEET: **37/38 verified (97.4%)** — only Daylight saving time remains candidate.
- RESULT: **27/28 verified (96.4%)** — Ran Out remains candidate.
- BET: **38/39 verified (97.4%)** — American odds remains candidate.
- WELF: **18/18 verified (100%)**.
- PRIZE: **10/12 verified (83.3%)** — Bonus and Stake remain candidate.

RUN is now **33/46 verified (71.7%)** after two focused running/trip passes. Thirteen RUN candidates remain; these are mainly ambiguous generic labels, regional Jump terms, course-stage labels and remaining Harness gait terminology.

## What remains

The **171 remaining terms** are not all expected to become verified unchanged. Some seed terms are broad, duplicated, polysemous, regional, or badly named. Review means choosing the correct action rather than chasing a percentage.

The immediate next step is to finish the remaining 13 RUN candidates where authority evidence supports the exact sense. After RUN, the next broad categories are equipment, training, horse/breeding/roles, venue, entry, race type, surface, distance and weight. The five residual edge cases stay visible for later evidence-driven resolution.

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
