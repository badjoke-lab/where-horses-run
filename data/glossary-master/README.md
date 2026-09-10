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
coverage/p0-verification-wave1-v1.tsv
coverage/p0-verification-wave2-v1.tsv
coverage/master-005-evidence-coverage-v1.tsv
coverage/master-005-completion-gate-v1.tsv
```

### Wave 1 — complete

Verified **16 P0 base Concepts** in DISC and DIST.

### Wave 2 — complete

Verified **30 P0 base Concepts**:

- ENTRY: **9**
- VENUE: **16**
- WEIGHT: **5**

The verification keeps jurisdiction boundaries intact. Examples:

- `Racecourse / Racetrack / Track` remain distinct/polysemous as modeled by MASTER-005;
- `Weight-for-age` is verified as a general Concept without collapsing regional systems such as JRA 馬齢重量 into it;
- `Declaration`, `Scratch`, `Withdrawal`, and `Non-runner` remain separate procedural/status Concepts.

## Evidence state after wave 2

- all Concepts: **205 / 658 source-verified (31.2%)**; **453 candidate**
- P0: **97 / 204 source-verified (47.5%)**; **107 candidate**
- active base seed: **47 / 497 source-verified (9.5%)**; **450 candidate**
- supplemental jurisdiction/relationship research: **158 / 161 source-verified (98.1%)**; **3 candidate**

Current category snapshots include:

- DISC 7/17 verified
- DIST 9/22 verified
- ENTRY 13/31 verified
- VENUE 18/44 verified
- WEIGHT 18/35 verified

The current P0 rows in DISC, DIST, ENTRY, VENUE and WEIGHT are all source-verified. Lower-priority rows in those categories may remain candidate.

## Current completion decision

`GLOSSARY-MASTER-005` remains **HOLD — not complete** because **107 P0 Concepts remain candidate**.

Next work:

```text
P0 verification wave 3 — remaining high-impact categories
-> update Concept evidence/provenance
-> rerun evidence coverage
-> rerun MASTER-005 completion gate
-> only after the gate passes, consider GLOSSARY-MASTER-006
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
