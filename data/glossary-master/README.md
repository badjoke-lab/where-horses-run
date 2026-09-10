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

The original seed was 501 candidate Concepts. Jurisdiction research expanded it, MASTER-005 merged four duplicate identities, and relationship review added genuinely missing meanings. Retired IDs remain recorded in `concepts/concept-dispositions-v1.tsv` and are never recycled.

## Relationship / register state

- active Concept relations: **20**
- relationship reviews: **15 discovered / 15 resolved / 0 open**
- register usages: **60**
- effective register mappings: **36 source-verified / 24 candidate**
- abbreviations/codes: **26**, all source-verified
- historical terms: **4**, all source-verified

## MASTER-005 evidence coverage

Canonical audit files:

```text
coverage/master-005-evidence-coverage-v1.tsv
coverage/master-005-completion-gate-v1.tsv
coverage/p0-verification-wave1-v1.tsv
sources/p0-core-sources-v1.tsv
```

After **P0 verification wave 1**:

- all Concepts: **175 / 658 source-verified (26.6%)**; **483 candidate**
- P0 Concepts: **67 / 204 source-verified (32.8%)**; **137 candidate**
- active base-seed rows: **17 / 497 source-verified (3.4%)**; **480 candidate**
- supplemental jurisdiction/relationship rows: **158 / 161 source-verified (98.1%)**; **3 candidate**

Wave 1 promoted **16 P0 base Concepts** using authority evidence:

- DISC: Flat racing, Thoroughbred racing, Jump racing, Harness racing, Trotting, Pacing, Banei racing;
- DIST: Race distance, Metre, Furlong, Mile, Length, Neck, Head, Nose, Sectional time.

DISC now has **7/17** verified rows and DIST **9/22**. Their remaining lower-priority rows are still candidate.

## Current completion decision

`GLOSSARY-MASTER-005` remains **HOLD — not complete**.

The relation queue is closed, but **137 P0 Concepts remain candidate**. Search/readiness work must not start yet.

Next sequence:

```text
P0 verification wave 2: ENTRY / VENUE / WEIGHT core Concepts
-> opportunistically resolve remaining supplemental candidates where authority evidence is available
-> refresh Concept verification status and provenance
-> rerun evidence coverage
-> rerun MASTER-005 completion gate
-> only then consider GLOSSARY-MASTER-006
```

## Write rules

- Never invent local-language equivalence to fill a blank.
- Never treat an English working label as the worldwide official term.
- Preserve original script.
- Do not flatten near terms into global synonyms without evidence.
- Use evidence appropriate to the claim and keep jurisdiction scope explicit.
- Retired Concept IDs must resolve through `concept-dispositions-v1.tsv`.
- Do not set `public_ready=yes` until definitions, labels, jurisdiction claims, relationships and evidence have been reviewed.
- Never make this working directory a public-runtime input without a later reviewed `GLOSSARY-PUBLIC-*` decision.

The existing public glossary remains a disposable content/runtime baseline and is not a migration or completeness gate.
