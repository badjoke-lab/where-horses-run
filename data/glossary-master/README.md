# Glossary master working data

Status: active zero-based world racing terminology master  
Authority: `docs/glossary/world-racing-terminology-master-spec.md`  
Current work: `GLOSSARY-MASTER-005` — evidence and semantic refinement

This directory is the non-public working area for the worldwide horse-racing terminology master. It is **not** consumed by current public glossary routes and does not authorize automatic publication.

## Plain-language progress

The working dictionary currently contains **643 racing terms/concepts**.

- **503 terms have meaning-level source verification** from racing authorities, official rule/glossary material, or appropriate official-industry sources.
- **140 terms still need verification, scope correction, splitting/merging, or removal.**
- The already researched jurisdiction-specific additions are **161/161 verified**.
- The core highest-priority terminology set is **203/203 verified**.
- Public glossary publication is still disabled while the remaining terms are cleaned up.

The latest pass is **equipment / training terminology wave 1**. It source-verified 13 EQUIP Concepts and 7 TRAIN Concepts using current JRA, Equibase, USTA, Racing Australia/Racing Victoria and Jockey Club material. Equipment definitions distinguish meaning-level authority evidence from merely current operational gear labels, and training terms retain regional procedure boundaries.

EQUIP is now **27/30 source-verified (90.0%)**; `Blinders`, `Barefoot` and `Bike` remain candidate. TRAIN is **19/26 source-verified (73.1%)**, with seven training/pre-race edge terms still under review.

RUN remains **42/44 source-verified (95.5%)** with only `Jump` and `Hold-up horse` deliberately unresolved. Earlier residual edge cases outside these categories also remain visible where Concept boundaries or authority evidence are weak.

## Current master

- Concepts: **643**
- categories: **18**
- P0: **203** / P1: **291** / P2: **131** / P3: **18**
- `public_ready=yes`: **0**
- public runtime input: **false**
- active Concept relations: **20**
- relationship reviews: **15 discovered / 15 resolved / 0 open**
- retired/merged Concept rows: **19**

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
The initial pass verified 6 terms and retired 1 duplicate. Residual cleanup later verified Season and Bulletin and retired `Program` into `Programme`. MEET is **37/38 verified (97.4%)**; only `Daylight saving time` remains candidate.

### Results and decisions — complete current pass
The initial pass verified 13 semantic Concepts and retired 2 duplicate code Concepts. Residual cleanup verified Relegation and False start. RESULT is **27/28 verified (96.4%)**; its remaining item is the RO/result-code modeling question. The separate RUN event `Ran out` is source-verified from current IHRB evidence.

### Prize and betting terminology — complete current pass
The initial pass verified 28 Concepts and retired 3 duplicate regional wager Concepts. Residual cleanup verified Totalisator, Fractional odds and On the board. PRIZE remains **10/12 verified (83.3%)** and BET is **38/39 verified (97.4%)**.

### Welfare, veterinary and safety terminology — complete current pass
Verified **13** additional Concepts. WELF is **18/18 source-verified (100.0%)**. Definitions keep HISA/BHA/Racing Australia/IFHA-specific operational and reporting boundaries explicit.

### Residual edge-case cleanup — complete current pass
Audit: `coverage/residual-edgecase-verification-v1.tsv`  
Sources: `sources/residual-edgecase-sources-v1.tsv` plus existing authority sources.

Verified **7** additional Concepts and retired **1 duplicate Program Concept**.

### Running / trip / race-comment terminology — current broad pass complete
Audits: `coverage/run-trip-verification-v1.tsv`, `coverage/run-trip-verification-v2.tsv`, `coverage/run-trip-verification-v3.tsv`  
Sources: `sources/run-trip-sources-v1.tsv` plus existing authority evidence.

Across the three focused RUN bundles, **21 additional RUN Concepts were source-verified and 4 duplicate/label Concepts were retired**. RUN is **42/44 source-verified (95.5%)**, with only `Jump` and `Hold-up horse` deliberately unresolved.

### Equipment / training terminology — wave 1 complete current pass
Audit: `coverage/equipment-training-verification-v1.tsv`  
Sources: `sources/equipment-training-sources-v1.tsv` plus existing authority evidence.

Verified **20** additional base Concepts: 13 equipment terms and 7 training/pre-race terms. Definitions were narrowed where the official source supports only a regional label or current gear identity rather than a universal equipment construction or training rule.

EQUIP is **27/30 verified (90.0%)** and TRAIN is **19/26 verified (73.1%)**.

Across the lower-priority cleanup passes, **189 base-dictionary terms have been newly verified and 14 duplicate/malformed rows have been removed**.

## Evidence state

- all Concepts: **503 / 643 source-verified (78.2%)**; **140 candidate**
- core highest-priority set: **203 / 203 source-verified (100.0%)**
- active base seed: **342 / 482 source-verified (71.0%)**; **140 candidate**
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
coverage/welfare-safety-verification-v1.tsv
coverage/residual-edgecase-verification-v1.tsv
coverage/run-trip-verification-v1.tsv
coverage/run-trip-verification-v2.tsv
coverage/run-trip-verification-v3.tsv
coverage/equipment-training-verification-v1.tsv
coverage/master-005-evidence-coverage-v1.tsv
coverage/master-005-completion-gate-v1.tsv
```

## Current completion decision

The terminology master remains **not complete**. The remaining **140 terms** must be reviewed rather than automatically promoted.

The immediate next step is to finish the small EQUIP/TRAIN residuals only where stronger authority evidence supports them, then continue horse/breeding/role, venue/entry, and the remaining race type/surface/distance/weight candidates. The two unresolved RUN labels and other residual edge cases remain visible for later evidence-driven resolution rather than blocking progress on clearer categories.

Public implementation remains deferred until the evidence/readiness review passes.

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
