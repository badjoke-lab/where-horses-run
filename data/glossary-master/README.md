# Glossary master working data

Status: active zero-based world racing terminology master  
Authority: `docs/glossary/world-racing-terminology-master-spec.md`  
Current work: `GLOSSARY-MASTER-005` — evidence and semantic refinement

This directory is the non-public working area for the worldwide horse-racing terminology master. It is **not** consumed by current public glossary routes and does not authorize automatic publication.

## Plain-language progress

The working dictionary currently contains **653 racing terms/concepts**.

- **401 terms have meaning-level source verification** from racing authorities, official rule/glossary material, or appropriate official-industry sources.
- **252 terms still need verification, scope correction, splitting/merging, or removal.**
- The already researched jurisdiction-specific additions are **161/161 verified**.
- The core highest-priority terminology set is **203/203 verified**.
- Public glossary publication is still disabled while the remaining terms are cleaned up.

The latest subject pass is **開催・日程・公式文書 / meeting and schedule terminology**. It verified six additional terms: Meeting number, Day number, Condition book, Weights, Barrier draw and First post.

This pass also retired duplicate `MEET-015 Condition book` into `MEET-014`, whose canonical English label was normalized from `Conditions book` to current NYRA-style `Condition book`. `Program` remains candidate because the seed conflates an American spelling variant of Programme with possible racecard/document senses. `Daylight saving time` remains candidate because it is a generic civil-time concept whose independent value in the racing dictionary still needs justification. `Season` and `Bulletin` also remain under review rather than being promoted without sharper racing-specific evidence.

The preceding surface/going pass verified 10 terms while keeping BHA, IHRB, North American dirt and JRA condition systems separate.

## Current master

- Concepts: **653**
- categories: **18**
- P0: **203** / P1: **298** / P2: **134** / P3: **18**
- `public_ready=yes`: **0**
- public runtime input: **false**
- active Concept relations: **20**
- relationship reviews: **15 discovered / 15 resolved / 0 open**
- retired/merged Concept rows: **9**

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
Verified **15** race-type/classification terms. RTYPE is **96/111 verified**.

### Surface and going terminology — complete current pass
Audit: `coverage/surface-going-verification-v1.tsv`  
Sources: `sources/surface-going-sources-v1.tsv` plus existing BHA/USTA authority ledgers.

Verified **10** additional surface-condition terms. SURF is **52/63 verified (82.5%)**.

### Meeting and schedule terminology — complete current pass
Audit: `coverage/meeting-schedule-verification-v1.tsv`  
Sources: `sources/meeting-schedule-sources-v1.tsv` plus existing Equibase/Racing Australia source rows.

Verified **6** additional terms and retired **1 duplicate**. MEET is now **35/39 verified (89.7%)**. The four remaining candidates are intentionally unresolved: Season, Program, Bulletin and Daylight saving time.

Across these passes, **87 base-dictionary terms have been newly verified and 4 duplicate/malformed rows have been removed**.

## Evidence state

- all Concepts: **401 / 653 source-verified (61.4%)**; **252 candidate**
- core highest-priority set: **203 / 203 source-verified (100.0%)**
- active base seed: **240 / 492 source-verified (48.8%)**; **252 candidate**
- supplemental jurisdiction/relationship research: **161 / 161 source-verified (100.0%)**

Canonical current audit state includes:

```text
coverage/p1-verification-wave1-v1.tsv
coverage/p1-verification-wave2-v1.tsv
coverage/race-type-condition-verification-v1.tsv
coverage/surface-going-verification-v1.tsv
coverage/meeting-schedule-verification-v1.tsv
coverage/master-005-evidence-coverage-v1.tsv
coverage/master-005-completion-gate-v1.tsv
```

## Current completion decision

The terminology master remains **not complete**. The remaining **252 terms** must be reviewed rather than automatically promoted.

Next user-facing areas to process are:

```text
results, decisions and result codes
-> prize and betting terminology
-> welfare / veterinary / safety terminology
-> remaining surface / meeting edge cases where better evidence exists
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
