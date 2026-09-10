# Glossary master working data

Status: active zero-based world racing terminology master  
Authority: `docs/glossary/world-racing-terminology-master-spec.md`  
Current work: `GLOSSARY-MASTER-005` — P1/base-seed evidence refinement

This directory is the non-public working area for the concept-first world racing terminology master. It is **not** consumed by current public glossary routes and does not authorize automatic publication.

## Current master

- Concepts: **655**
- categories: **18**
- P0: **203** / P1: **299** / P2: **135** / P3: **18**
- `public_ready=yes`: **0**
- public runtime input: **false**
- active Concept relations: **20**
- relationship reviews: **15 discovered / 15 resolved / 0 open**
- retired/merged Concept rows: **7**

## P0 source verification — complete

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
```

- Wave 1: **16 P0** — DISC / DIST
- Wave 2: **30 P0** — ENTRY / VENUE / WEIGHT
- Wave 3: **51 P0** — RTYPE / SURF / MEET / RESULT / BET
- Wave 4: **44 P0** — HORSE / BREED / ROLE / RUN / EQUIP / TRAIN / PRIZE / WELF
- Wave 5: **11 P0** — deferred scope-sensitive Concepts; P0 closed

`BET-028 SP` was not percentage-promoted. Authority evidence identifies `SP` as the abbreviation of `Starting Price`, so the duplicate Concept was merged into `BET-027` and `SP` moved to the abbreviation layer.

## Supplemental candidate cleanup — complete

The three candidates left outside the base seed were resolved with narrower evidence-backed semantics:

- `ROLE-029 Claiming Professional Jockey` — verified as an IHRB Irish licence/status category; no universal claim amount asserted.
- `ENTRY-029 Coupled entry` — scope narrowed to US/Regional and verified from current Kentucky regulation plus ARCI model-rule context.
- `WEIGHT-026 Base rating` — scope narrowed to Australia/Queensland and tied to current Racing Queensland RBH/weight-setting context.

Audit: `coverage/supplemental-candidate-cleanup-v1.tsv`.

## P1 base-seed verification

### Wave 1 — complete current pass

Authority sources: `sources/p1-core-sources-v1.tsv`  
Audit: `coverage/p1-verification-wave1-v1.tsv`

Wave 1 verified **27 P1 base-seed Concepts** across five categories:

- DISC: **5** — National Hunt racing, Hurdle racing, Steeplechase, Arabian racing, Quarter Horse racing
- ENTRY: **6** — Nomination, Final declaration, Acceptance, Ballot, Reserve, Scratching
- VENUE: **5** — Main track, Inner course, Outer course, Straight course, Course width
- DIST: **4** — Split time, Final 3 furlongs, Course record, Track record
- WEIGHT: **7** — Set weights, Set weights and penalties, Apprentice allowance, Top weight, Minimum weight, Assigned weight, Overweight

Scope was narrowed where evidence required it. In particular `Quarter Horse racing` moved from `Americas` to `North America/Regional` rather than extending AQHA evidence beyond its support.

Two bad seed rows were **not** promoted:

- `DIST-013 Dead heat distance` → retired into `RESULT-007 Dead heat`; the malformed seed label is not retained as a public synonym.
- `WEIGHT-010 Weight penalty` → merged into `WEIGHT-009 Penalty`; `Weight penalty` is retained only as a label through the disposition layer.

`ENTRY-009 Maximum field` also remains candidate because current authority material uses forms such as `Field Limit` / `Field Size Limit`; the canonical sense/label must be reviewed rather than silently verified under the seed wording.

## Evidence state after P1 wave 1

- all Concepts: **341 / 655 source-verified (52.1%)**; **314 candidate**
- P0: **203 / 203 source-verified (100.0%)**; **0 candidate**
- active base seed: **180 / 494 source-verified (36.4%)**; **314 candidate**
- supplemental jurisdiction/relationship research: **161 / 161 source-verified (100.0%)**; **0 candidate**

All current P0 rows and all current supplemental Concept rows are source-verified. The remaining Concept evidence gap is entirely in lower-priority active base-seed rows.

Canonical current audit state:

```text
coverage/supplemental-candidate-cleanup-v1.tsv
coverage/p1-verification-wave1-v1.tsv
coverage/master-005-evidence-coverage-v1.tsv
coverage/master-005-completion-gate-v1.tsv
```

## Current completion decision

`GLOSSARY-MASTER-005` remains **HOLD — not complete**. P1 wave 1 materially improves the base seed but **314 lower-priority active base-seed candidates remain**.

Next work:

```text
P1 base-seed verification wave 2
-> continue high-utility / high-risk semantic areas
-> resolve suspicious canonical labels before promotion
-> refine scope or split/merge Concepts when authority evidence requires it
-> keep candidate status when evidence does not support the current claim
-> rerun evidence coverage and MASTER-005 completion gate
-> define a defensible evidence floor before MASTER-006
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
