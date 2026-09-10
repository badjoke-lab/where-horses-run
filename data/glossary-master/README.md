# Glossary master working data

Status: active zero-based world racing terminology master  
Authority: `docs/glossary/world-racing-terminology-master-spec.md`  
Current work: `GLOSSARY-MASTER-005` — evidence and semantic refinement

This directory is the non-public working area for the worldwide horse-racing terminology master. It is **not** consumed by current public glossary routes and does not authorize automatic publication.

## Plain-language progress

The working dictionary currently contains **654 racing terms/concepts**.

- **370 terms have meaning-level source verification** from racing authorities, official rule/glossary material, or appropriate official-industry sources.
- **284 terms still need verification, scope correction, splitting/merging, or removal.**
- The already researched jurisdiction-specific additions are **161/161 verified**.
- The core highest-priority terminology set is **203/203 verified**.
- Public glossary publication is still disabled while the remaining terms are cleaned up.

The most recent completed terminology pass covered six user-facing areas:

- horses: Arabian horse, American Quarter Horse, Standardbred, Entire, Juvenile, Maiden;
- breeding: Broodmare, Registration;
- racing people: Apprentice jockey, Breeder, Groom, Starter, Judge, Handicapper, Clerk of the course, Veterinarian;
- in-race expressions: Checked, Bumped;
- horse equipment: Visor, Hood, Cheekpieces, Tongue tie, Shadow roll, Bridle;
- training: Breezing, Handily, Canter, Trackwork, Jump-out.

`BREED-017 Breeder` was removed as a duplicate of the participant-role Concept `ROLE-009 Breeder`. Ambiguous terms such as `Horse`, `Stud`, and unsupported race-comment synonyms remain unverified rather than being promoted for percentage targets.

## Current master

- Concepts: **654**
- categories: **18**
- P0: **203** / P1: **298** / P2: **135** / P3: **18**
- `public_ready=yes`: **0**
- public runtime input: **false**
- active Concept relations: **20**
- relationship reviews: **15 discovered / 15 resolved / 0 open**
- retired/merged Concept rows: **8**

## Core source verification — complete

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

The current core set is **203/203 source-verified**. `BET-028 SP` was not percentage-promoted: authority evidence identifies `SP` as the abbreviation of `Starting Price`, so the duplicate Concept was merged into `BET-027` and `SP` moved to the abbreviation layer.

## Jurisdiction-specific research additions — complete current pass

The three final unresolved supplemental items were previously closed with narrower evidence-backed semantics:

- `Claiming Professional Jockey` — IHRB Irish licence/status category;
- `Coupled entry` — US/Regional regulatory usage;
- `Base rating` — Australia/Queensland RBH/programme context.

Current supplemental set: **161/161 source-verified**.

## Lower-priority base dictionary cleanup

### First pass — complete

Audit: `coverage/p1-verification-wave1-v1.tsv`  
Sources: `sources/p1-core-sources-v1.tsv`

Verified **27** terms across racing disciplines, entries, racecourses, distance/timing, and weights. Two duplicate/malformed rows were retired: `Dead heat distance` into `Dead heat`, and `Weight penalty` into `Penalty`.

### Second pass — complete

Audit: `coverage/p1-verification-wave2-v1.tsv`  
Sources: `sources/p1-core-sources-v2.tsv`

Verified **29** additional terms across horses, breeding, racing people, in-race expressions, horse equipment, and training. One duplicate row, `BREED-017 Breeder`, was retired into `ROLE-009 Breeder`.

Across these two passes, **56 base-dictionary terms have been newly verified and 3 duplicate/malformed rows have been removed**.

## Evidence state

- all Concepts: **370 / 654 source-verified (56.6%)**; **284 candidate**
- core highest-priority set: **203 / 203 source-verified (100.0%)**
- active base seed: **209 / 493 source-verified (42.4%)**; **284 candidate**
- supplemental jurisdiction/relationship research: **161 / 161 source-verified (100.0%)**

Canonical current audit state:

```text
coverage/supplemental-candidate-cleanup-v1.tsv
coverage/p1-verification-wave1-v1.tsv
coverage/p1-verification-wave2-v1.tsv
coverage/master-005-evidence-coverage-v1.tsv
coverage/master-005-completion-gate-v1.tsv
```

## Current completion decision

The terminology master remains **not complete**. The remaining **284 terms** must be reviewed rather than automatically promoted.

Next user-facing areas to process are:

```text
race types and classifications
-> track/surface terminology
-> meeting and schedule terminology
-> results, decisions and result codes
-> prize and betting terminology
-> welfare / veterinary / safety terminology
-> unresolved ambiguous terms and duplicate cleanup
-> rerun evidence/readiness review
```

Public implementation remains deferred until that evidence/readiness review passes.

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
- Never make this working directory a public-runtime input without a later reviewed public-glossary decision.

The existing public glossary remains a disposable content/runtime baseline and is not a migration or completeness gate.
