# Glossary master working data

Status: active zero-based world racing terminology master  
Authority: `docs/glossary/world-racing-terminology-master-spec.md`  
Current work: `GLOSSARY-MASTER-005` — evidence and semantic refinement

This directory is the non-public working area for the worldwide horse-racing terminology master. It is **not** consumed by current public glossary routes and does not authorize automatic publication.

## Plain-language progress

The working dictionary currently contains **654 racing terms/concepts**.

- **395 terms have meaning-level source verification** from racing authorities, official rule/glossary material, or appropriate official-industry sources.
- **259 terms still need verification, scope correction, splitting/merging, or removal.**
- The already researched jurisdiction-specific additions are **161/161 verified**.
- The core highest-priority terminology set is **203/203 verified**.
- Public glossary publication is still disabled while the remaining terms are cleaned up.

The latest subject pass is **芝・ダート・馬場状態 / surface and going terminology**. It verified 10 additional terms: Firm, Good to Firm, Good to Soft, Yielding, Yielding to Soft, Fast, Wet Fast, Muddy, Sloppy and dirt-qualified Good.

The important rule is that regional condition systems are not collapsed into one global scale. BHA Going, IHRB Yielding terminology, US dirt conditions and JRA 良/稍重/重/不良 are kept as jurisdiction-specific systems. `Frozen`, `Snow-covered` and `Off turf` remain under review because the current seed wording does not yet match the strongest authority label evidence cleanly enough.

The preceding race-type/classification pass verified 15 terms including Maiden Claiming, Novice, Beginners Chase, National Hunt Flat Race, Allowance, Starter Allowance, Claiming, Optional Claiming, Pattern, Group/Grade 2-3, Nursery Handicap and Match Race.

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

The current core set is **203/203 source-verified**. `SP` is represented as the abbreviation of `Starting Price`, not a duplicate Concept.

## Jurisdiction-specific research additions — complete current pass

Current supplemental set: **161/161 source-verified**. Scope-sensitive terms remain explicitly jurisdiction-bounded.

## Base dictionary cleanup

### First pass — complete
Verified **27** terms across racing disciplines, entries, racecourses, distance/timing and weights. Two duplicate/malformed rows were retired.

### Second pass — complete
Verified **29** terms across horses, breeding, racing people, in-race expressions, horse equipment and training. Duplicate `Breeder` was consolidated into the participant-role Concept.

### Race types and classifications — complete current pass
Verified **15** race-type/classification terms. RTYPE is now **96/111 verified**.

### Surface and going terminology — complete current pass
Audit: `coverage/surface-going-verification-v1.tsv`  
Sources: `sources/surface-going-sources-v1.tsv` plus existing BHA/USTA authority ledgers.

Verified **10** additional surface-condition terms. SURF is now **52/63 verified (82.5%)**. Seed wording was narrowed where necessary instead of treating every regional label as equivalent.

Across these passes, **81 base-dictionary terms have been newly verified and 3 duplicate/malformed rows have been removed**.

## Evidence state

- all Concepts: **395 / 654 source-verified (60.4%)**; **259 candidate**
- core highest-priority set: **203 / 203 source-verified (100.0%)**
- active base seed: **234 / 493 source-verified (47.5%)**; **259 candidate**
- supplemental jurisdiction/relationship research: **161 / 161 source-verified (100.0%)**

Canonical current audit state includes:

```text
coverage/p1-verification-wave1-v1.tsv
coverage/p1-verification-wave2-v1.tsv
coverage/race-type-condition-verification-v1.tsv
coverage/surface-going-verification-v1.tsv
coverage/master-005-evidence-coverage-v1.tsv
coverage/master-005-completion-gate-v1.tsv
```

## Current completion decision

The terminology master remains **not complete**. The remaining **259 terms** must be reviewed rather than automatically promoted.

Next user-facing areas to process are:

```text
remaining surface/product edge cases
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
