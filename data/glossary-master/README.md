# Glossary master working data

Status: active zero-based world racing terminology master  
Authority: `docs/glossary/world-racing-terminology-master-spec.md`  
Current work: `GLOSSARY-MASTER-005` — P0-first source verification

This directory is the non-public working area for the concept-first world racing terminology master. It is **not** consumed by current public glossary routes and does not authorize automatic publication.

## Current master

- Concepts: **658**
- categories: **18**
- P0: **204** / P1: **301** / P2: **135** / P3: **18**
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
coverage/p0-verification-wave1-v1.tsv
coverage/p0-verification-wave2-v1.tsv
coverage/p0-verification-wave3-v1.tsv
coverage/p0-verification-wave4-v1.tsv
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

The wave uses JRA, IFHA, USTA, Racing Australia and Equibase authority/official-industry evidence. Scope remains explicit: a source validating a Concept in one jurisdiction does not turn a local definition into a universal rule.

## Evidence state after wave 4

- all Concepts: **300 / 658 source-verified (45.6%)**; **358 candidate**
- P0: **192 / 204 source-verified (94.1%)**; **12 candidate**
- active base seed: **142 / 497 source-verified (28.6%)**; **355 candidate**
- supplemental jurisdiction/relationship research: **158 / 161 source-verified (98.1%)**; **3 candidate**

All current P0 rows are now source-verified in DISC, DIST, ENTRY, HORSE, BREED, ROLE, VENUE, WEIGHT, RUN, EQUIP, TRAIN, RESULT, PRIZE and WELF.

The remaining **12 P0 candidates** are deliberately deferred rather than percentage-promoted:

```text
RTYPE-014  Stakes race
SURF-004   Sand
SURF-005   Synthetic surface
SURF-006   All-weather
MEET-022   Draw
MEET-023   Official notice
MEET-031   Local time
MEET-032   Time zone
MEET-034   Postponed
BET-004    Tote
BET-027    Starting Price
BET-028    SP
```

Several of these likely need narrower jurisdiction scope or sense refinement before verification, especially `Stakes race`, `Tote`, and broad time/source terms.

## Current completion decision

`GLOSSARY-MASTER-005` remains **HOLD — not complete**. P0 is near complete, but 12 high-priority Concepts still require explicit resolution and lower-priority base-seed coverage remains materially incomplete.

Next work:

```text
P0 verification wave 5 — deferred 12
-> refine Concept scope/sense where needed
-> verify only claims actually supported by authority evidence
-> rerun evidence coverage and MASTER-005 completion gate
-> then decide how much P1/P2 verification is required before MASTER-006
```

## Register / abbreviation / historical state

- register usages: **60**
- effective register mappings: **36 source-verified / 24 candidate**
- abbreviations/codes: **26**, all source-verified
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
