# Glossary programme

The glossary programme is building a **user-facing worldwide horse-racing dictionary/knowledge base**. Each usable entry should explain what a racing term means, its Japanese equivalent, where that usage applies, important regional differences, and the evidence supporting the definition.

Search/AI discovery is a later structured layer. It must not distort the dictionary itself.

## Current authority

Read these first for glossary work:

1. [World racing terminology master specification](world-racing-terminology-master-spec.md)
2. [2026-09-09 glossary roadmap addendum](../project-roadmap-2026-09-09-glossary-addendum.md)
3. [Working master data](../../data/glossary-master/README.md)

## Current state in plain language

The working dictionary has **614 terms/concepts**.

- **614 / 614 are source-verified at the meaning level**.
- **0 active Concepts remain under evidence/semantic review**.
- the highest-priority core set is **203/203 verified**;
- jurisdiction-specific research additions are **161/161 verified**;
- publication is still disabled (`public_ready=0`, public runtime disconnected).

The latest pass is **final targeted residual wave 13**. It verified historical California `Cushion Track`, corrected `Hold-up horse` to operational `Held up`, and verified the GB prize-money `Stake` sense. Ambiguous `Grandsire`, `Stallion service`, generic `Jump`, and generic `Bonus` were retired rather than forced into the public model.

`GLOSSARY-MASTER-005` is complete: **614/614 active Concepts are source-verified (100%)** and **0 candidates remain**. Active base seed is **453/453 verified (100%)**. Evidence completion does not publish the glossary; `MASTER-006` remains the next readiness stage.

`MASTER-006` wave 5 is now active. The search layer is kept separate from canonical knowledge and currently contains **570 reviewed non-canonical queries**: 406 EN/JA direct-definition queries covering all **203 P0 Concepts**, 40 EN/JA comparison queries covering all **20 current reviewed Concept relations**, 28 EN/JA regional-usage queries covering **14 curated source-verified regional label/use cases**, 30 EN/JA translation queries covering **15 source-verified local/original-script label cases**, plus 33 abbreviation lookups and 33 racecard-reading lookups. How/why remains unseeded; translation/local-label queries preserve no-direct-equivalent boundaries and are not blanket-generated.

These rows were removed because the active glossary already models the underlying racing meaning more cleanly, or because the seed represented generic analytical/presentation context rather than an independent racing term.

## What has been completed

The dictionary was built from zero rather than copied from the existing public glossary. Major jurisdiction/local-language research and the current slang/abbreviation/historical pass are complete. The core terminology set is fully source-verified, and all current jurisdiction-specific additions are evidence-backed.

Base-dictionary cleanup has now verified **300 additional terms** and removed **43 duplicate, malformed or non-independent rows**. Current base-dictionary coverage is **453/453 verified (100%)**.

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
data/glossary-master/sources/targeted-residual-sources-v12.tsv
data/glossary-master/sources/targeted-residual-sources-v13.tsv
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
data/glossary-master/coverage/targeted-residual-resolution-v12.tsv
data/glossary-master/coverage/targeted-residual-resolution-v13.tsv
data/glossary-master/coverage/master-005-evidence-coverage-v1.tsv
data/glossary-master/coverage/master-005-completion-gate-v1.tsv
```

The abbreviation/code layer remains at **38 source-verified rows**.

## Near-complete categories

- RUN: **43/43 verified (100%)** — wave 13 retired generic `Jump` and corrected/verified `Hold-up horse` as `Held up`.
- EQUIP: **28/28 verified (100%)** — wave 10 retired Blinders into Blinkers and verified Barefoot.
- MEET: **37/37 verified (100%)** — wave 8 retired generic Daylight saving time as Time zone context.
- RESULT: **27/27 verified (100%)** — wave 7 retired the unsupported RO code row into the verified Ran out event Concept.
- BET: **38/38 verified (100%)** — wave 9 retired generic sportsbook American odds as contextual Odds presentation.
- WELF: **18/18 verified (100%)**.
- DISC: **16/16 verified (100%)** — wave 12 retired out-of-scope Endurance racing.
- RTYPE: **108/108 verified (100%)** — wave 12 retired generic Cup race.
- DIST: **19/19 verified (100%)** — wave 12 retired Final fraction as derived Fractional-time context.
- SURF: **61/61 verified (100%)** — wave 13 verified historical California `Cushion Track`.
- WEIGHT: **32/32 verified (100%)** — wave 9 retired derived Weight rise/drop comparison labels.
- ENTRY: **29/29 verified (100%)** — wave 11 retired unsupported generic Waitlist.
- PRIZE: **11/11 verified (100%)** — wave 13 retired generic `Bonus` and verified the GB regulatory `Stake` sense.
- ROLE: **30/30 verified (100%)** — wave 9 retired malformed Commentator; Track announcer remains the verified race-calling role.
- TRAIN: **25/25 verified (100%)** — wave 12 verified Cool down with BHA veterinary guidance.
- VENUE: **42/42 verified (100%)** — wave 12 verified Round course and Oval with BHA/Churchill Downs evidence.
- HORSE: **32/32 verified (100%)** — wave 12 verified Homebred and retired generic Locally bred.
- BREED: **18/18 verified (100%)** — wave 13 retired ambiguous `Grandsire` and `Stallion service` seeds into already modeled pedigree/breeding senses.

## What remains

There are **0 active candidate Concepts** after final residual wave 13. `GLOSSARY-MASTER-005` therefore passes its evidence/semantic completion gate for the current master.

`GLOSSARY-MASTER-006` is now **in progress**. Waves 1-5 add the search-intent policy, audited query registry, complete P0 EN/JA definition coverage, EN/JA comparison coverage for all current reviewed Concept relations, a curated regional-usage seed, and a curated translation/local-label seed grounded in source-verified evidence. The current decision remains **HOLD** until how/why coverage and worldwide domain/jurisdiction/language readiness audits are completed. Public glossary architecture remains deferred.

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
