# Glossary master working data

Status: active zero-based world racing terminology master  
Authority: `docs/glossary/world-racing-terminology-master-spec.md`  
Current work: `GLOSSARY-MASTER-005` — post-P0 evidence refinement

This directory is the non-public working area for the concept-first world racing terminology master. It is **not** consumed by current public glossary routes and does not authorize automatic publication.

## Current master

- Concepts: **657**
- categories: **18**
- P0: **203** / P1: **301** / P2: **135** / P3: **18**
- `public_ready=yes`: **0**
- public runtime input: **false**
- active Concept relations: **20**
- relationship reviews: **15 discovered / 15 resolved / 0 open**

## P0 source verification

Canonical provenance:

```text
sources/p0-core-sources-v1.tsv
sources/p0-core-sources-v2.tsv
sources/p0-core-sources-v3.tsv
sources/p0-core-sources-v4.tsv
sources/p0-core-sources-v5.tsv
coverage/p0-verification-wave1-v1.tsv
coverage/p0-verification-wave2-v1.tsv
coverage/p0-verification-wave3-v1.tsv
coverage/p0-verification-wave4-v1.tsv
coverage/p0-verification-wave5-v1.tsv
coverage/master-005-evidence-coverage-v1.tsv
coverage/master-005-completion-gate-v1.tsv
```

### Wave 1 — complete

Verified **16 P0 base Concepts** in DISC and DIST.

### Wave 2 — complete

Verified **30 P0 base Concepts** in ENTRY, VENUE and WEIGHT.

### Wave 3 — complete

Verified **51 P0 base Concepts** in RTYPE, SURF, MEET, RESULT and BET.

### Wave 4 — complete

Verified **44 P0 base Concepts**:

- HORSE: **8**
- BREED: **5**
- ROLE: **5**
- RUN: **12**
- EQUIP: **3**
- TRAIN: **4**
- PRIZE: **2**
- WELF: **5**

### Wave 5 — complete; P0 closed

Verified **11 P0 Concepts** with scope refinement where required:

- RTYPE: Stakes race
- SURF: Sand / Synthetic surface / All-weather
- MEET: Draw / Official notice / Local time / Time zone / Postponed
- BET: Tote / Starting Price

`BET-028 SP` was **not** percentage-promoted. Authority evidence identifies `SP` as the abbreviation of `Starting Price`, so the duplicate Concept was merged into `BET-027` through `concept-dispositions-v1.tsv` and `SP` was moved to `abbreviations/abbreviations-v1.tsv`.

Wave 5 uses IFHA, Equibase, Racing Australia, JRA, BHA, Tote and The Jockey Club evidence. Scope remains explicit: a source validating a Concept in one jurisdiction does not turn a local definition into a universal rule.

## Evidence state after wave 5

- all Concepts: **311 / 657 source-verified (47.3%)**; **346 candidate**
- P0: **203 / 203 source-verified (100.0%)**; **0 candidate**
- active base seed: **153 / 496 source-verified (30.8%)**; **343 candidate**
- supplemental jurisdiction/relationship research: **158 / 161 source-verified (98.1%)**; **3 candidate**

All current P0 rows across all 18 categories are now source-verified.

## Current completion decision

`GLOSSARY-MASTER-005` remains **HOLD — not complete**. P0 is closed, but lower-priority base-seed evidence remains materially incomplete and three supplemental candidates remain unresolved.

Next work:

```text
post-P0 base-seed verification
-> prioritize P1 Concepts and evidence-heavy/high-risk semantic areas
-> resolve ROLE-029 / ENTRY-029 / WEIGHT-026 supplemental candidates
-> keep scope/polysemy review coupled to evidence verification
-> rerun evidence coverage and MASTER-005 completion gate
-> only then decide MASTER-006 readiness
```

## Register / abbreviation / historical state

- register usages: **60**
- effective register mappings: **36 source-verified / 24 candidate**
- abbreviations/codes: **27**, all source-verified
- historical terms: **4**, all source-verified

## Write rules

- Never invent local-language equivalence to fill a blank.
- Never treat an English working label as the worldwide official term.
- Preserve original script and jurisdiction scope.
- Do not flatten near terms into global synonyms without evidence.
- Use evidence appropriate to the claim.
- Retired Concept IDs must resolve through `concept-dispositions-v1.tsv`.
- Do not set `public_ready=yes` until definitions, labels, jurisdiction claims, relationships and evidence have been reviewed.
- Never make this working directory a public-runtime input without a later reviewed `GLOSSARY-PUBLIC-*` decision.

The existing public glossary remains a disposable content/runtime baseline and is not a migration or completeness gate.
