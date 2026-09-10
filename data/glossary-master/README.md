# Glossary master working data

Status: active zero-based world racing terminology master  
Authority: `docs/glossary/world-racing-terminology-master-spec.md`  
Current work: `GLOSSARY-MASTER-005` — P1/base-seed evidence refinement

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
coverage/supplemental-candidate-cleanup-v1.tsv
coverage/master-005-evidence-coverage-v1.tsv
coverage/master-005-completion-gate-v1.tsv
```

- Wave 1: **16 P0** — DISC / DIST
- Wave 2: **30 P0** — ENTRY / VENUE / WEIGHT
- Wave 3: **51 P0** — RTYPE / SURF / MEET / RESULT / BET
- Wave 4: **44 P0** — HORSE / BREED / ROLE / RUN / EQUIP / TRAIN / PRIZE / WELF
- Wave 5: **11 P0** — deferred scope-sensitive Concepts; P0 closed

`BET-028 SP` was not percentage-promoted. Authority evidence identifies `SP` as the abbreviation of `Starting Price`, so the duplicate Concept was merged into `BET-027` and `SP` moved to the abbreviation layer.

## Supplemental candidate cleanup — complete

The three candidates left outside the base seed have now been resolved with narrower evidence-backed semantics:

- `ROLE-029 Claiming Professional Jockey` — verified as an IHRB Irish licence/status category; no universal claim amount asserted.
- `ENTRY-029 Coupled entry` — scope narrowed to US/Regional and verified from current Kentucky regulation plus ARCI model-rule context.
- `WEIGHT-026 Base rating` — scope narrowed to Australia/Queensland and tied to current Racing Queensland RBH/weight-setting context.

Audit: `coverage/supplemental-candidate-cleanup-v1.tsv`.

## Evidence state

- all Concepts: **314 / 657 source-verified (47.8%)**; **343 candidate**
- P0: **203 / 203 source-verified (100.0%)**; **0 candidate**
- active base seed: **153 / 496 source-verified (30.8%)**; **343 candidate**
- supplemental jurisdiction/relationship research: **161 / 161 source-verified (100.0%)**; **0 candidate**

All current P0 rows across all 18 categories and all current supplemental Concept rows are source-verified.

## Current completion decision

`GLOSSARY-MASTER-005` remains **HOLD — not complete**. The remaining evidence gap is now entirely the **343 lower-priority active base-seed candidates**.

Next work:

```text
P1 base-seed verification wave 1
-> prioritize high-utility / high-risk semantic areas
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
