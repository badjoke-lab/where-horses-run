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
coverage/p0-verification-wave1-v1.tsv
coverage/p0-verification-wave2-v1.tsv
coverage/p0-verification-wave3-v1.tsv
coverage/master-005-evidence-coverage-v1.tsv
coverage/master-005-completion-gate-v1.tsv
```

### Wave 1 — complete

Verified **16 P0 base Concepts** in DISC and DIST.

### Wave 2 — complete

Verified **30 P0 base Concepts** in ENTRY, VENUE and WEIGHT.

### Wave 3 — complete

Verified **51 P0 base Concepts**:

- RTYPE: **8**
- SURF: **7**
- MEET: **19**
- RESULT: **10**
- BET: **7**

Deliberately deferred P0 terms remain candidate where the available evidence does not yet support the intended global Concept boundary. Examples include `Stakes race`, `Sand`, `Synthetic surface`, `All-weather`, `Draw`, `Official notice`, `Local time`, `Time zone`, `Postponed`, `Tote`, and `Starting Price/SP`.

The verification keeps jurisdiction boundaries intact. Examples:

- `Group / Grade` remain separate regional counterparts;
- `Going / Track condition` remain separate related taxonomies;
- `Post time / Scheduled start time` remain planned timestamps while `Off time` is actual start time;
- `Racecourse / Racetrack / Track` remain scope-bounded/polysemous;
- `Fixed odds / Pari-mutuel` remain separate betting mechanisms.

## Evidence state after wave 3

- all Concepts: **256 / 658 source-verified (38.9%)**; **402 candidate**
- P0: **148 / 204 source-verified (72.5%)**; **56 candidate**
- active base seed: **98 / 497 source-verified (19.7%)**; **399 candidate**
- supplemental jurisdiction/relationship research: **158 / 161 source-verified (98.1%)**; **3 candidate**

Current category snapshots include:

- DISC 7/17
- RTYPE 80/111
- ENTRY 13/31
- VENUE 18/44
- SURF 39/63
- DIST 9/22
- WEIGHT 18/35
- MEET 24/40
- RESULT 12/30
- BET 11/43

## Current completion decision

`GLOSSARY-MASTER-005` remains **HOLD — not complete** because **56 P0 Concepts remain candidate** and the original base seed is still broadly under-evidenced.

Next work:

```text
P0 verification wave 4 — remaining P0 categories and deliberately deferred core terms
-> update Concept evidence/provenance
-> resolve remaining supplemental candidates where evidence is available
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
