# Glossary master working data

Status: active zero-based world racing terminology master  
Authority: `docs/glossary/world-racing-terminology-master-spec.md`  
Current work: `GLOSSARY-MASTER-005` — evidence and semantic refinement

This directory is the non-public working area for the worldwide horse-racing terminology master. It is **not** consumed by current public glossary routes and does not authorize automatic publication.

## Plain-language progress

The working dictionary currently contains **654 racing terms/concepts**.

- **385 terms have meaning-level source verification** from racing authorities, official rule/glossary material, or appropriate official-industry sources.
- **269 terms still need verification, scope correction, splitting/merging, or removal.**
- The already researched jurisdiction-specific additions are **161/161 verified**.
- The core highest-priority terminology set is **203/203 verified**.
- Public glossary publication is still disabled while the remaining terms are cleaned up.

The latest completed subject pass is **race types and classifications**. It verified 15 additional terms including Maiden Claiming, Novice, Beginners Chase, National Hunt Flat Race, Allowance, Starter Allowance, Claiming, Optional Claiming, Pattern, Group 2/3, Grade 2/3, Nursery Handicap and Match Race.

Definitions were narrowed where necessary. `Optional Claiming` now describes the North American claiming/non-claiming eligibility combination instead of being treated as a generic conditions-race synonym. `Match Race` is scoped to the directly verified North American race-type sense rather than asserted as a universal coding rule. `Selling race` remains under review because current BHA terminology uses `Seller`.

The preceding pass covered horses, breeding, racing people, in-race expressions, horse equipment and training. `BREED-017 Breeder` was removed as a duplicate of the participant-role Concept `ROLE-009 Breeder`. Ambiguous terms such as `Horse`, `Stud`, and unsupported race-comment synonyms remain unverified rather than being promoted for percentage targets.

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

The current core set is **203/203 source-verified**. `BET-028 SP` was not percentage-promoted: authority evidence identifies `SP` as the abbreviation of `Starting Price`, so the duplicate Concept was merged into `BET-027` and `SP` moved to the abbreviation layer.

## Jurisdiction-specific research additions — complete current pass

Current supplemental set: **161/161 source-verified**. Scope-sensitive terms such as Claiming Professional Jockey, Coupled entry and Base rating remain explicitly jurisdiction-bounded.

## Base dictionary cleanup

### First pass — complete

Audit: `coverage/p1-verification-wave1-v1.tsv`  
Sources: `sources/p1-core-sources-v1.tsv`

Verified **27** terms across racing disciplines, entries, racecourses, distance/timing, and weights. Two duplicate/malformed rows were retired: `Dead heat distance` into `Dead heat`, and `Weight penalty` into `Penalty`.

### Second pass — complete

Audit: `coverage/p1-verification-wave2-v1.tsv`  
Sources: `sources/p1-core-sources-v2.tsv`

Verified **29** additional terms across horses, breeding, racing people, in-race expressions, horse equipment, and training. One duplicate row, `BREED-017 Breeder`, was retired into `ROLE-009 Breeder`.

### Race types and classifications — complete current pass

Audit: `coverage/race-type-condition-verification-v1.tsv`  
Sources: `sources/race-type-condition-sources-v1.tsv`

Verified **15** additional race-type/classification terms using current Equibase, BHA, IHRB and IFHA material. The RTYPE category is now **96/111 verified**, with 15 lower-priority terms still under review.

Across these passes, **71 base-dictionary terms have been newly verified and 3 duplicate/malformed rows have been removed**.

## Evidence state

- all Concepts: **385 / 654 source-verified (58.9%)**; **269 candidate**
- core highest-priority set: **203 / 203 source-verified (100.0%)**
- active base seed: **224 / 493 source-verified (45.4%)**; **269 candidate**
- supplemental jurisdiction/relationship research: **161 / 161 source-verified (100.0%)**

Canonical current audit state includes:

```text
coverage/supplemental-candidate-cleanup-v1.tsv
coverage/p1-verification-wave1-v1.tsv
coverage/p1-verification-wave2-v1.tsv
coverage/race-type-condition-verification-v1.tsv
coverage/master-005-evidence-coverage-v1.tsv
coverage/master-005-completion-gate-v1.tsv
```

## Current completion decision

The terminology master remains **not complete**. The remaining **269 terms** must be reviewed rather than automatically promoted.

Next user-facing areas to process are:

```text
remaining race-type edge cases
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
