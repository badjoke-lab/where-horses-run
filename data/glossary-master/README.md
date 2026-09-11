# Glossary master working data

Status: active zero-based world racing terminology master  
Authority: `docs/glossary/world-racing-terminology-master-spec.md`  
Current work: `GLOSSARY-MASTER-005` — evidence and semantic refinement

This directory is the non-public working area for the worldwide horse-racing terminology master. It is **not** consumed by current public glossary routes and does not authorize automatic publication.

## Plain-language progress

The working dictionary currently contains **651 racing terms/concepts**.

- **414 terms have meaning-level source verification** from racing authorities, official rule/glossary material, or appropriate official-industry sources.
- **237 terms still need verification, scope correction, splitting/merging, or removal.**
- The already researched jurisdiction-specific additions are **161/161 verified**.
- The core highest-priority terminology set is **203/203 verified**.
- Public glossary publication is still disabled while the remaining terms are cleaned up.

The latest subject pass is **結果・審議・裁定 / results and decisions**. It verified thirteen additional Concepts: Provisional result, Runner-up, Objection, Protest, Claim of foul, Void race, No contest, Did not finish, Pulled up, Fell, Unseated rider, Brought down and Refused.

The pass also fixed the data model for result codes. `DNF / P / PU / F / U / UR / BD / R` are now abbreviations of semantic result Concepts rather than the canonical Concept names. Duplicate `RESULT-027 DQ` was retired into `RESULT-014 Disqualification`, and duplicate `RESULT-028 DH` was retired into `RESULT-007 Dead heat`; regional codes `DQ`, `DISQ` and `DH` now live in the abbreviation layer. `Relegation`, `False start` and `RO / Ran Out` remain under review because current authority evidence has not yet resolved their exact regional semantics or canonical code.

The preceding meeting/schedule pass verified six terms and retired one duplicate Condition book row.

## Current master

- Concepts: **651**
- categories: **18**
- P0: **203** / P1: **296** / P2: **134** / P3: **18**
- `public_ready=yes`: **0**
- public runtime input: **false**
- active Concept relations: **20**
- relationship reviews: **15 discovered / 15 resolved / 0 open**
- retired/merged Concept rows: **11**

## Core source verification — complete

The current core set is **203/203 source-verified**. Abbreviations such as `SP`, `DQ` and `DH` are not counted as duplicate Concepts.

## Jurisdiction-specific research additions — complete current pass

Current supplemental set: **161/161 source-verified**. Scope-sensitive terms remain explicitly jurisdiction-bounded.

## Base dictionary cleanup

### First pass — complete
Verified **27** terms across racing disciplines, entries, racecourses, distance/timing and weights. Two duplicate/malformed rows were retired.

### Second pass — complete
Verified **29** terms across horses, breeding, racing people, in-race expressions, horse equipment and training. Duplicate `Breeder` was consolidated into the participant-role Concept.

### Race types and classifications — complete current pass
Verified **15** race-type/classification terms. RTYPE is **96/111 verified**.

### Surface and going terminology — complete current pass
Verified **10** additional surface-condition terms. SURF is **52/63 verified (82.5%)**.

### Meeting and schedule terminology — complete current pass
Verified **6** additional terms and retired **1 duplicate**. MEET is **35/39 verified (89.7%)**.

### Results and decisions — complete current pass
Audit: `coverage/result-decision-verification-v1.tsv`  
Sources: `sources/result-decision-sources-v1.tsv` plus existing JRA/USTA authority sources.

Verified **13** additional semantic Concepts and retired **2 duplicate code Concepts**. RESULT is now **25/28 verified (89.3%)**. Eleven current result abbreviations were added to the abbreviation layer, taking that layer from 27 to **38 source-verified rows**.

Across these lower-priority passes, **100 base-dictionary terms have been newly verified and 6 duplicate/malformed rows have been removed**.

## Evidence state

- all Concepts: **414 / 651 source-verified (63.6%)**; **237 candidate**
- core highest-priority set: **203 / 203 source-verified (100.0%)**
- active base seed: **253 / 490 source-verified (51.6%)**; **237 candidate**
- supplemental jurisdiction/relationship research: **161 / 161 source-verified (100.0%)**

Canonical current audit state includes:

```text
coverage/p1-verification-wave1-v1.tsv
coverage/p1-verification-wave2-v1.tsv
coverage/race-type-condition-verification-v1.tsv
coverage/surface-going-verification-v1.tsv
coverage/meeting-schedule-verification-v1.tsv
coverage/result-decision-verification-v1.tsv
coverage/master-005-evidence-coverage-v1.tsv
coverage/master-005-completion-gate-v1.tsv
```

## Current completion decision

The terminology master remains **not complete**. The remaining **237 terms** must be reviewed rather than automatically promoted.

Next user-facing areas to process are:

```text
prize and betting terminology
-> welfare / veterinary / safety terminology
-> remaining result / surface / meeting edge cases where better evidence exists
-> unresolved ambiguous terms and duplicate cleanup
-> rerun evidence/readiness review
```

Public implementation remains deferred until that evidence/readiness review passes.

## Register / abbreviation / historical state

- register usages: **60**
- effective register mappings: **36 source-verified / 24 candidate**
- abbreviations/codes: **38**, all source-verified
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
