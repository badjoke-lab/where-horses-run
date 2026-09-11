# Glossary master working data

Status: active zero-based world racing terminology master  
Authority: `docs/glossary/world-racing-terminology-master-spec.md`  
Current work: `GLOSSARY-MASTER-005` — evidence and semantic refinement

This directory is the non-public working area for the worldwide horse-racing terminology master. It is **not** consumed by current public glossary routes and does not authorize automatic publication.

## Plain-language progress

The working dictionary currently contains **648 racing terms/concepts**.

- **442 terms have meaning-level source verification** from racing authorities, official rule/glossary material, or appropriate official-industry sources.
- **206 terms still need verification, scope correction, splitting/merging, or removal.**
- The already researched jurisdiction-specific additions are **161/161 verified**.
- The core highest-priority terminology set is **203/203 verified**.
- Public glossary publication is still disabled while the remaining terms are cleaned up.

The latest subject pass is **賞金・馬券・オッズ / prize and betting terminology**. It verified 28 additional Concepts: six prize/value terms and 22 betting/pool/odds terms.

The pass also removed duplicate wager mechanics from the Concept layer. `Forecast / Straight Forecast` now resolves to the exact-order `Exacta` mechanic where that sense is intended; `Reverse Forecast / Dual Forecast` resolves to `Quinella`; `Tricast / Tierce` resolves to `Trifecta`. The labels remain preserved through dispositions rather than being counted as separate worldwide wager Concepts. `Bonus`, `Stake`, `Totalisator`, `Fractional odds`, `American odds` and `On the board` remain under review because the present seed meaning is too broad, polysemous or insufficiently backed by current racing-authority evidence.

The preceding result/decision pass verified thirteen semantic Concepts, moved result codes to the abbreviation layer and retired duplicate DQ/DH Concept rows.

## Current master

- Concepts: **648**
- categories: **18**
- P0: **203** / P1: **295** / P2: **132** / P3: **18**
- `public_ready=yes`: **0**
- public runtime input: **false**
- active Concept relations: **20**
- relationship reviews: **15 discovered / 15 resolved / 0 open**
- retired/merged Concept rows: **14**

## Core source verification — complete

The current core set is **203/203 source-verified**. Abbreviations, codes and regional labels are not counted as duplicate Concepts.

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
Verified **13** additional semantic Concepts and retired **2 duplicate code Concepts**. RESULT is **25/28 verified (89.3%)**. Result codes were moved to the abbreviation layer where appropriate.

### Prize and betting terminology — complete current pass
Audit: `coverage/prize-betting-verification-v1.tsv`  
Sources: `sources/prize-betting-sources-v1.tsv` plus existing JRA/Equibase/Tote source rows.

Verified **28** additional Concepts and retired **3 duplicate regional wager Concepts**. PRIZE is now **10/12 verified (83.3%)** and BET is **35/39 verified (89.7%)**. The pass keeps wager mechanics separate from regional labels and keeps prize/premium systems jurisdiction-aware.

Across these lower-priority passes, **128 base-dictionary terms have been newly verified and 9 duplicate/malformed rows have been removed**.

## Evidence state

- all Concepts: **442 / 648 source-verified (68.2%)**; **206 candidate**
- core highest-priority set: **203 / 203 source-verified (100.0%)**
- active base seed: **281 / 487 source-verified (57.7%)**; **206 candidate**
- supplemental jurisdiction/relationship research: **161 / 161 source-verified (100.0%)**

Canonical current audit state includes:

```text
coverage/p1-verification-wave1-v1.tsv
coverage/p1-verification-wave2-v1.tsv
coverage/race-type-condition-verification-v1.tsv
coverage/surface-going-verification-v1.tsv
coverage/meeting-schedule-verification-v1.tsv
coverage/result-decision-verification-v1.tsv
coverage/prize-betting-verification-v1.tsv
coverage/master-005-evidence-coverage-v1.tsv
coverage/master-005-completion-gate-v1.tsv
```

## Current completion decision

The terminology master remains **not complete**. The remaining **206 terms** must be reviewed rather than automatically promoted.

Next user-facing areas to process are:

```text
welfare / veterinary / safety terminology
-> remaining result / prize / betting / surface / meeting edge cases where better evidence exists
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
