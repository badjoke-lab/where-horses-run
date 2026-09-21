# Glossary master working data

Status: active zero-based world racing terminology master  
Authority: `docs/glossary/world-racing-terminology-master-spec.md`  
Current work: `GLOSSARY-MASTER-006` — search-intent / coverage / readiness review

This directory is the non-public working area for the worldwide horse-racing terminology master. It is **not** consumed by current public glossary routes and does not authorize automatic publication.

## Plain-language progress

The working dictionary currently contains **614 racing terms/concepts**.

- **614 / 614 active Concepts have meaning-level source verification** from racing authorities, official rule/glossary material, or appropriate official-industry sources.
- **0 active Concepts remain under evidence/semantic review.**
- The already researched jurisdiction-specific additions are **161/161 verified**.
- The core highest-priority terminology set is **203/203 verified**.
- Public glossary publication remains disabled pending `GLOSSARY-MASTER-006` search-intent / coverage / readiness review.

The latest pass is **final targeted residual wave 13**. It source-verified historical California `Cushion Track`, corrected `Hold-up horse` to authority-backed operational `Held up`, and verified the GB regulatory prize-money sense of `Stake`. It retired ambiguous `Grandsire`, `Stallion service`, generic `Jump`, and generic `Bonus` because their seed boundaries duplicated or conflated already modeled Concepts.

`GLOSSARY-MASTER-005` is now complete: **614/614 active Concepts are source-verified (100%)**, with **0 candidates**. Active base-seed coverage is **453/453 (100%)**; all 18 categories have no active candidate Concepts. Public publication is still deferred because evidence completion does not replace the separate `GLOSSARY-MASTER-006` search-intent / coverage / readiness review.

`GLOSSARY-MASTER-006` wave 1 is now in progress. A separate search-intent policy and registry were added without changing canonical definitions. Wave 1 contains **66 reviewed source-derived query records**: **33 abbreviation lookups** and **33 racecard-reading lookups**, covering the current English/Japanese abbreviation subset. The MASTER-006 coverage matrix and readiness gate remain **HOLD** because definition, comparison, regional-usage, how/why and translation intents plus worldwide coverage/readiness audits are still incomplete.

Wave 9 is a semantic pruning pass: derived comparisons and generic display conventions remain contextual rather than standalone racing Concepts.

## Current master

- Concepts: **614**
- categories: **18**
- P0: **203** / P1: **280** / P2: **114** / P3: **17**
- `public_ready=yes`: **0**
- public runtime input: **false**
- active Concept relations: **20**
- relationship reviews: **15 discovered / 15 resolved / 0 open**
- retired/merged Concept rows: **48**

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
The initial race-type/classification pass verified **15** terms. Broad-category wave 1 added `Selling race`, `Graded stakes`, and scoped British `Open race` / `Restricted race` Concepts. RTYPE is now **108/108 verified (100%)** after wave 12 retired generic `Cup race`.

### Surface and going terminology — broad current pass
The initial surface-condition pass verified **10** terms. Later passes added product/surface-state terms, merged duplicate Grass into Turf, and wave 8 corrected/verified USTA `Freezing` and `Snow`. SURF is now **61/61 verified (100%)** after wave 13 verified historical California `Cushion Track`.

### Distance and measurement terminology — broad current pass
Broad-category and residual passes verified racing-specific distance and margin terms. Wave 9 retired generic derived `Kilometre` under `Metre`; DIST is now **19/19 verified (100%)** after wave 12 retired `Final fraction` as derived timing context under verified `Fractional time`.

### Weight and handicapping terminology — broad current pass
Weight terminology is now **32/32 verified (100%)** after wave 6 verified `Claiming allowance` and wave 9 retired derived `Weight rise`/`Weight drop` comparison labels under `Weight carried`.

### Meeting and schedule terminology — complete current pass
The initial pass verified 6 terms and retired 1 duplicate. Residual cleanup later verified Season and Bulletin and retired `Program` into `Programme`. Wave 8 retired generic `Daylight saving time` as contextual Time zone handling, so MEET is now **37/37 verified (100%)**.

### Results and decisions — complete current pass
The initial pass verified 13 semantic Concepts and retired 2 duplicate code Concepts. Residual cleanup verified Relegation and False start. Wave 7 retired the unsupported `RO` abbreviation row into the verified `Ran out` event Concept, so RESULT is now **27/27 verified (100%)**.

### Prize and betting terminology — complete current pass
The initial pass verified 28 Concepts and retired 3 duplicate regional wager Concepts. Residual cleanup verified Totalisator, Fractional odds and On the board. PRIZE is now **11/11 verified (100%)** after wave 13 retired generic `Bonus` and verified the GB regulatory `Stake` contribution sense; BET remains **38/38 verified (100%)**.

### Welfare, veterinary and safety terminology — complete current pass
Verified **13** additional Concepts. WELF is **18/18 source-verified (100.0%)**. Definitions keep HISA/BHA/Racing Australia/IFHA-specific operational and reporting boundaries explicit.

### Residual edge-case cleanup — complete current pass
Audit: `coverage/residual-edgecase-verification-v1.tsv`  
Sources: `sources/residual-edgecase-sources-v1.tsv` plus existing authority sources.

Verified **7** additional Concepts and retired **1 duplicate Program Concept**.

### Running / trip / race-comment terminology — current broad pass complete
Audits: `coverage/run-trip-verification-v1.tsv`, `coverage/run-trip-verification-v2.tsv`, `coverage/run-trip-verification-v3.tsv`  
Sources: `sources/run-trip-sources-v1.tsv` plus existing authority evidence.

Across the three focused RUN bundles, **21 additional RUN Concepts were source-verified and 4 duplicate/label Concepts were retired**. RUN is **43/43 source-verified (100%)** after wave 13 retired polysemous generic `Jump` and corrected/verified `Hold-up horse` as operational `Held up`.

### Equipment / training terminology — current pass complete with residuals retained
Audits: `coverage/equipment-training-verification-v1.tsv`, `coverage/equipment-training-residual-v1.tsv`  
Sources: `sources/equipment-training-sources-v1.tsv` plus existing authority evidence.

Wave 1 verified **20** base Concepts: 13 equipment terms and 7 training/pre-race terms. Residual cleanup then verified `Pre-parade` and retired `Bike/Racebike` into `Sulky`.

EQUIP is **28/28 verified (100%)**; TRAIN is now **25/25 verified (100%)** after wave 12 verified `Cool down` with BHA veterinary guidance.

### Horse / breeding / participant roles — wave 1 complete current pass
Audit: `coverage/horse-breeding-role-verification-v1.tsv`  
Sources: `sources/horse-breeding-role-sources-v1.tsv` plus existing authority evidence.

Wave 1 verified **14** Concepts: 3 HORSE, 4 BREED and 7 ROLE. Definitions keep local age rules, Thoroughbred registration procedure and British licensing thresholds scoped rather than turning them into universal rules.

HORSE is **25/34 verified (73.5%)**, BREED is **13/22 verified (59.1%)**, and ROLE is **27/31 verified (87.1%)**. Remaining seed rows stay candidate where current wave-1 evidence is insufficient or the Concept boundary still needs review.

### Venue / entry terminology — wave 1 complete current pass
Audit: `coverage/venue-entry-verification-v1.tsv`  
Sources: `sources/venue-entry-sources-v1.tsv` plus existing authority evidence.

Wave 1 verified **11** Concepts: 6 ENTRY and 5 VENUE. BHA evidence closes maximum-field, elimination and balloting meanings; current North American race conditions support also-eligible, entry-fee and preference mechanics; JRA/Jockey Club and harness authorities support scoped course and facility terminology.

ENTRY is **29/29 verified (100%)** and VENUE is **42/42 verified (100%)** after wave 12 verified `Round course` and `Oval`. `Homestretch`/`Home straight`, `Parade ring`/`Paddock`, `Winner's enclosure`/`Winners' circle`, and mobile-start terminology remain jurisdiction-scoped rather than flattened into global synonyms.

### Broad category wave 1 — complete current pass
Audit: `coverage/broad-category-verification-v1.tsv`  
Sources: `sources/broad-category-sources-v1.tsv` plus existing authority evidence.

This pass verified **18** Concepts: 4 RTYPE, 5 SURF, 4 DIST and 5 WEIGHT. BHA, TOBA, Jockey Club, Equibase, NYRA, JRA and Racing Australia sources were used only for the claims and regional scopes they actually support.

### Targeted residual wave 1 — complete current pass
Audit: `coverage/targeted-residual-verification-v1.tsv`  
Sources: `sources/targeted-residual-sources-v1.tsv` plus existing authority evidence.

This pass verified **15** Concepts: 4 HORSE, 1 BREED, 2 ROLE and 8 VENUE. It also corrected jurisdiction scope where the seed overclaimed global or regional usage.

### Targeted residual wave 2 — complete current pass
Audit: `coverage/targeted-residual-verification-v2.tsv`  
Sources: `sources/targeted-residual-sources-v2.tsv` plus existing authority evidence.

This pass verified **5** Concepts: 2 ENTRY, 1 BREED and 2 VENUE. BHA supplementary-entry procedure, IFHA/ISBC/ITBF Covering semantics and JRA stable-facility terminology remain explicitly scope-bounded.

### Targeted residual wave 3 — complete current pass
Audit: `coverage/targeted-residual-verification-v3.tsv`  
Sources: `sources/targeted-residual-sources-v3.tsv` plus existing authority evidence.

This pass verified **6** Concepts: 4 DISC, 1 DIST and 1 HORSE. Discipline, jurisdiction, notation and participant-status claims remain bounded to the authorities that support them.

### Targeted residual wave 4 — complete current pass
Audit: `coverage/targeted-residual-verification-v4.tsv`  
Sources: `sources/targeted-residual-sources-v4.tsv` plus existing authority evidence.

This pass verified **8** Concepts: 4 RTYPE, 1 HORSE, 2 BREED and 1 ROLE. It also corrected the seed `Stud farm` canonical to the evidence-backed `Breeding farm` label.

### Targeted residual wave 5 — complete current pass
Audit: `coverage/targeted-residual-verification-v5.tsv`  
Sources: `sources/targeted-residual-sources-v5.tsv` plus existing authority evidence.

This pass verified **6** Concepts: 2 RTYPE, 1 ENTRY, 1 ROLE, 1 VENUE and 1 TRAIN. All six remain explicitly jurisdiction/discipline/procedure scoped.

### Targeted residual wave 6 — complete current pass
Audit: `coverage/targeted-residual-verification-v6.tsv`  
Sources: `sources/targeted-residual-sources-v6.tsv` plus existing authority evidence.

This pass verified **5** Concepts across WEIGHT/TRAIN/ROLE and retired duplicate `Grass` into `Turf`. `Race caller` was corrected to `Track announcer` without adding a duplicate Concept.

### Targeted residual resolution wave 7 — complete current pass
Audit: `coverage/targeted-residual-resolution-v7.tsv`

This pass retired **5** duplicate or malformed candidate Concepts through reviewed semantic dispositions: Debutant, Female family, Corner, Counterclockwise, and the unsupported RO result-code row. No candidate was percentage-promoted without evidence.

### Targeted residual resolution wave 8 — complete current pass
Audit: `coverage/targeted-residual-resolution-v8.tsv`

This pass verified **2** authority-backed SURF Concepts after canonical correction (`Freezing`, `Snow`) and retired generic `Daylight saving time` as non-independent racing context.

### Final targeted residual wave 13 — MASTER-005 complete
Audit: `coverage/targeted-residual-resolution-v13.tsv`  
Sources: `sources/targeted-residual-sources-v13.tsv` plus existing authority evidence.

This pass resolved the final **7** candidates: **3 source-verified** (`Cushion Track`, `Held up`, `Stake`) and **4 retired** (`Grandsire`, `Stallion service`, generic `Jump`, generic `Bonus`). The active Concept master is now **614/614 source-verified with 0 candidates**.

### Targeted residual wave 12 — complete current pass
Audit: `coverage/targeted-residual-resolution-v12.tsv`  
Sources: `sources/targeted-residual-sources-v12.tsv` plus existing authority evidence.

This pass verified **8** Concepts and retired **4** out-of-scope/generic/derived/malformed seed rows across DISC/RTYPE/HORSE/BREED/VENUE/SURF/DIST/TRAIN. The unresolved queue is now exactly seven Concepts and will be handled one by one.

### Targeted residual wave 11 — complete current pass
Audit: `coverage/targeted-residual-resolution-v11.tsv`  
Sources: `sources/targeted-residual-sources-v11.tsv` plus existing authority evidence.

This pass verified **4** Concepts and retired **4** unsupported/polysemous/context rows across ENTRY/HORSE/BREED/VENUE/SURF/TRAIN. ENTRY now has no active candidate Concepts; HORSE, VENUE, SURF and TRAIN are all above 93% active verification.

### Targeted residual wave 10 — complete current pass
Audit: `coverage/targeted-residual-resolution-v10.tsv`  
Sources: `sources/targeted-residual-sources-v10.tsv` plus existing authority evidence.

This pass verified **5** Concepts and retired **3** redundant/malformed candidate rows across RTYPE/HORSE/DIST/EQUIP. It closes EQUIP's active candidate queue and leaves only `Cup race` in RTYPE and `Final fraction` in DIST.

### Targeted residual resolution wave 9 — complete current pass
Audit: `coverage/targeted-residual-resolution-v9.tsv`

This pass retired **6** vague, derived, generic or malformed candidate Concepts across ENTRY, DIST, WEIGHT, BET and ROLE. No candidate was percentage-promoted; WEIGHT, BET and ROLE close their active candidate queues through semantic cleanup.

Across the lower-priority cleanup passes, **300 base-dictionary terms have been newly verified and 43 duplicate/malformed/non-independent rows have been removed**.

## Evidence state

- all Concepts: **614 / 614 source-verified (100.0%)**; **0 candidate**
- core highest-priority set: **203 / 203 source-verified (100.0%)**
- active base seed: **453 / 453 source-verified (100.0%)**; **0 candidate**
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
coverage/equipment-training-residual-v1.tsv
coverage/horse-breeding-role-verification-v1.tsv
coverage/venue-entry-verification-v1.tsv
coverage/broad-category-verification-v1.tsv
coverage/targeted-residual-verification-v1.tsv
coverage/targeted-residual-verification-v2.tsv
coverage/targeted-residual-verification-v3.tsv
coverage/targeted-residual-verification-v4.tsv
coverage/targeted-residual-verification-v5.tsv
coverage/targeted-residual-verification-v6.tsv
coverage/targeted-residual-resolution-v7.tsv
coverage/targeted-residual-resolution-v8.tsv
coverage/targeted-residual-resolution-v9.tsv
coverage/master-005-evidence-coverage-v1.tsv
coverage/master-005-completion-gate-v1.tsv
search/search-intent-policy-v1.tsv
search/search-queries-v1.tsv
coverage/master-006-search-intent-coverage-v1.tsv
coverage/master-006-readiness-v1.tsv
```

## Current completion decision

`GLOSSARY-MASTER-005` is **complete** for the current active Concept master: **614/614 source-verified, 0 candidate**. The completion gate passes after explicit resolution of every residual seed Concept.

`GLOSSARY-MASTER-006` is **in progress**. Wave 1 establishes the separate query/policy layer and makes the remaining intent/readiness gaps explicit. Next work is definition/comparison/regional/translation/how-why coverage plus jurisdiction/system readiness auditing; evidence truth is reopened only if that review exposes a real semantic/source defect.

Public implementation remains deferred until MASTER-006 passes.

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
