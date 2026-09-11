# Glossary master working data

Status: active zero-based world racing terminology master  
Authority: `docs/glossary/world-racing-terminology-master-spec.md`  
Current work: `GLOSSARY-MASTER-005` — evidence and semantic refinement

This directory is the non-public working area for the worldwide horse-racing terminology master. It is **not** consumed by current public glossary routes and does not authorize automatic publication.

## Plain-language progress

The working dictionary currently contains **642 racing terms/concepts**.

- **547 terms have meaning-level source verification** from racing authorities, official rule/glossary material, or appropriate official-industry sources.
- **95 terms still need verification, scope correction, splitting/merging, or removal.**
- The already researched jurisdiction-specific additions are **161/161 verified**.
- The core highest-priority terminology set is **203/203 verified**.
- Public glossary publication is still disabled while the remaining terms are cleaned up.

The latest pass is **broad category wave 1** across race type, surface, distance and weight terminology. It source-verified **18 additional base Concepts** while narrowing labels to the authority scope actually supported.

RTYPE is now **100/111 source-verified (90.1%)**, SURF **57/63 (90.5%)**, DIST **17/21 (81.0%)**, and WEIGHT **31/34 (91.2%)**. Newly verified Concepts include Selling race, Graded stakes, British Open/Restricted race categories, Tapeta, Polytrack, historical Fibresand, Sealed track, Off turf, Yard, Short head, Final furlong, Race record, Bottom weight, Maximum weight, Underweight, Weigh out and Weigh in.

Weak residual labels remain visible rather than being promoted for percentage gain. In particular, broad generic race categories, Turf/Grass identity, historical/cold-weather surface labels, some timing units and informal weight-comparison terms still require stronger evidence or cleaner modeling.

## Current master

- Concepts: **642**
- categories: **18**
- P0: **203** / P1: **291** / P2: **130** / P3: **18**
- `public_ready=yes`: **0**
- public runtime input: **false**
- active Concept relations: **20**
- relationship reviews: **15 discovered / 15 resolved / 0 open**
- retired/merged Concept rows: **20**

## Core source verification — complete

The current core set is **203/203 source-verified**. Abbreviations, codes and regional labels are not counted as duplicate Concepts.

## Jurisdiction-specific research additions — complete current pass

Current supplemental set: **161/161 source-verified**. Scope-sensitive terms remain explicitly jurisdiction-bounded.

## Base dictionary cleanup

### First pass — complete
Verified **27** terms across racing disciplines, entries, racecourses, distance/timing and weights. Two duplicate/malformed rows were retired.

### Second pass — complete
Verified **29** terms across horses, breeding, racing people, in-race expressions, horse equipment and training. Duplicate `Breeder` was consolidated into the participant-role Concept.

### Race types and classifications — broad current pass
The initial race-type/classification pass verified **15** terms. Broad-category wave 1 added `Selling race`, `Graded stakes`, and scoped British `Open race` / `Restricted race` Concepts. RTYPE is now **100/111 verified (90.1%)**.

### Surface and going terminology — broad current pass
The initial surface-condition pass verified **10** terms. Broad-category wave 1 added `Tapeta`, `Polytrack`, historical British `Fibresand`, `Sealed track`, and `Off turf`. SURF is now **57/63 verified (90.5%)**. Product identity, historical status and surface-switch semantics remain scope-aware.

### Distance and measurement terminology — broad current pass
Broad-category wave 1 verified `Yard`, `Short head`, `Final furlong` and `Race record`. DIST is now **17/21 verified (81.0%)**. `Kilometre`, `Half-length`, `Fraction` and `Final fraction` remain candidate pending cleaner racing-specific evidence or Concept boundaries.

### Weight and handicapping terminology — broad current pass
Broad-category wave 1 verified `Bottom weight`, `Maximum weight`, `Underweight`, `Weigh out` and `Weigh in`. WEIGHT is now **31/34 verified (91.2%)**. `Claiming allowance`, `Weight rise` and `Weight drop` remain candidate.

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

### Equipment / training terminology — current pass complete with residuals retained
Audits: `coverage/equipment-training-verification-v1.tsv`, `coverage/equipment-training-residual-v1.tsv`  
Sources: `sources/equipment-training-sources-v1.tsv` plus existing authority evidence.

Wave 1 verified **20** base Concepts: 13 equipment terms and 7 training/pre-race terms. Residual cleanup then verified `Pre-parade` and retired `Bike/Racebike` into `Sulky`.

EQUIP is **27/29 verified (93.1%)** and TRAIN is **20/26 verified (76.9%)**. The remaining weak labels stay candidate until stronger authority evidence or a cleaner modeling decision exists.

### Horse / breeding / participant roles — wave 1 complete current pass
Audit: `coverage/horse-breeding-role-verification-v1.tsv`  
Sources: `sources/horse-breeding-role-sources-v1.tsv` plus existing authority evidence.

Wave 1 verified **14** Concepts: 3 HORSE, 4 BREED and 7 ROLE. Definitions keep local age rules, Thoroughbred registration procedure and British licensing thresholds scoped rather than turning them into universal rules.

HORSE is **21/34 verified (61.8%)**, BREED is **11/22 verified (50.0%)**, and ROLE is **25/31 verified (80.6%)**. Remaining seed rows stay candidate where current wave-1 evidence is insufficient or the Concept boundary still needs review.

### Venue / entry terminology — wave 1 complete current pass
Audit: `coverage/venue-entry-verification-v1.tsv`  
Sources: `sources/venue-entry-sources-v1.tsv` plus existing authority evidence.

Wave 1 verified **11** Concepts: 6 ENTRY and 5 VENUE. BHA evidence closes maximum-field, elimination and balloting meanings; current North American race conditions support also-eligible, entry-fee and preference mechanics; JRA/Jockey Club and harness authorities support scoped course and facility terminology.

ENTRY is **26/31 verified (83.9%)** and VENUE is **28/44 verified (63.6%)**. `Homestretch`/`Home straight`, `Parade ring`/`Paddock`, `Winner's enclosure`/`Winners' circle`, and mobile-start terminology remain jurisdiction-scoped rather than flattened into global synonyms.

### Broad category wave 1 — complete current pass
Audit: `coverage/broad-category-verification-v1.tsv`  
Sources: `sources/broad-category-sources-v1.tsv` plus existing authority evidence.

This pass verified **18** Concepts: 4 RTYPE, 5 SURF, 4 DIST and 5 WEIGHT. BHA, TOBA, Jockey Club, Equibase, NYRA, JRA and Racing Australia sources were used only for the claims and regional scopes they actually support.

Across the lower-priority cleanup passes, **233 base-dictionary terms have been newly verified and 15 duplicate/malformed rows have been removed**.

## Evidence state

- all Concepts: **547 / 642 source-verified (85.2%)**; **95 candidate**
- core highest-priority set: **203 / 203 source-verified (100.0%)**
- active base seed: **386 / 481 source-verified (80.2%)**; **95 candidate**
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
coverage/run-trip-verification-v2-v1.tsv
coverage/run-trip-verification-v3.tsv
coverage/equipment-training-verification-v1.tsv
coverage/equipment-training-residual-v1.tsv
coverage/horse-breeding-role-verification-v1.tsv
coverage/venue-entry-verification-v1.tsv
coverage/broad-category-verification-v1.tsv
coverage/master-005-evidence-coverage-v1.tsv
coverage/master-005-completion-gate-v1.tsv
```

## Current completion decision

The terminology master remains **not complete**. The remaining **95 terms** must be reviewed rather than automatically promoted.

The next work is **targeted residual cleanup** across the largest remaining candidate groups, especially VENUE, HORSE, BREED and the residual RTYPE/ENTRY/SURF/DIST/WEIGHT sets. Deliberately weak RUN, EQUIP, TRAIN and cross-category edge cases remain visible until stronger evidence or a cleaner modeling decision exists.

After that residual work, rerun the evidence/readiness gate before advancing to `GLOSSARY-MASTER-006`.

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
