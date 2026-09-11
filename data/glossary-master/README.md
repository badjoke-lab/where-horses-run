# Glossary master working data

Status: active zero-based world racing terminology master  
Authority: `docs/glossary/world-racing-terminology-master-spec.md`  
Current work: `GLOSSARY-MASTER-005` — evidence and semantic refinement

This directory is the non-public working area for the worldwide horse-racing terminology master. It is **not** consumed by current public glossary routes and does not authorize automatic publication.

## Plain-language progress

The working dictionary currently contains **646 racing terms/concepts**.

- **469 terms have meaning-level source verification** from racing authorities, official rule/glossary material, or appropriate official-industry sources.
- **177 terms still need verification, scope correction, splitting/merging, or removal.**
- The already researched jurisdiction-specific additions are **161/161 verified**.
- The core highest-priority terminology set is **203/203 verified**.
- Public glossary publication is still disabled while the remaining terms are cleaned up.

The latest pass is the first **running / trip / race-comment terminology** bundle. It verified Break at the start, On the rail, Wide, Boxed in, Turn of foot, Eased and Lost rider. Harness `Break` was retired as a duplicate regional label of `Broke stride`; the Flat start-event `Break` remains a separate Concept.

This pass also corrected scope rather than only changing status. `Eased` now follows the Equibase chart-comment sense instead of generic slowing, `Wide` is region-scoped, and HKJC evidence keeps `Lost rider` distinct from `Unseated rider`.

Five earlier edge cases remain deliberately unresolved: `Daylight saving time`, `Ran Out`, generic `Bonus`, polysemous `Stake`, and `American odds`.

## Current master

- Concepts: **646**
- categories: **18**
- P0: **203** / P1: **293** / P2: **132** / P3: **18**
- `public_ready=yes`: **0**
- public runtime input: **false**
- active Concept relations: **20**
- relationship reviews: **15 discovered / 15 resolved / 0 open**
- retired/merged Concept rows: **16**

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
The initial pass verified 6 terms and retired 1 duplicate. Residual cleanup later verified Season and Bulletin and retired `Program` into `Programme`. MEET is now **37/38 verified (97.4%)**; only `Daylight saving time` remains candidate.

### Results and decisions — complete current pass
The initial pass verified 13 semantic Concepts and retired 2 duplicate code Concepts. Residual cleanup verified Relegation and False start. RESULT is now **27/28 verified (96.4%)**; `Ran Out` remains candidate.

### Prize and betting terminology — complete current pass
The initial pass verified 28 Concepts and retired 3 duplicate regional wager Concepts. Residual cleanup verified Totalisator, Fractional odds and On the board. PRIZE remains **10/12 verified (83.3%)** and BET is now **38/39 verified (97.4%)**; `American odds` remains candidate.

### Welfare, veterinary and safety terminology — complete current pass
Verified **13** additional Concepts. WELF is **18/18 source-verified (100.0%)**. Definitions keep HISA/BHA/Racing Australia/IFHA-specific operational and reporting boundaries explicit.

### Residual edge-case cleanup — complete current pass
Audit: `coverage/residual-edgecase-verification-v1.tsv`  
Sources: `sources/residual-edgecase-sources-v1.tsv` plus existing authority sources.

Verified **7** additional Concepts and retired **1 duplicate Program Concept**. This pass intentionally leaves five weak/polysemous/non-racing-specific edge cases unresolved rather than promoting them for percentage gain.

### Running / trip / race-comment terminology — first bundle complete
Audit: `coverage/run-trip-verification-v1.tsv`  
Sources: `sources/run-trip-sources-v1.tsv` plus existing Equibase/USTA evidence.

Verified **7** additional RUN Concepts and retired **1 duplicate Harness Break Concept**. RUN is now **28/47 source-verified (59.6%)**, with **19 candidates** remaining. Running-style nouns, regional Jump language and remaining Harness terms stay for later bundles until authority evidence supports the exact sense.

Across the lower-priority cleanup passes, **155 base-dictionary terms have been newly verified and 11 duplicate/malformed rows have been removed**.

## Evidence state

- all Concepts: **469 / 646 source-verified (72.6%)**; **177 candidate**
- core highest-priority set: **203 / 203 source-verified (100.0%)**
- active base seed: **308 / 485 source-verified (63.5%)**; **177 candidate**
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
coverage/master-005-evidence-coverage-v1.tsv
coverage/master-005-completion-gate-v1.tsv
```

## Current completion decision

The terminology master remains **not complete**. The remaining **177 terms** must be reviewed rather than automatically promoted.

The next phase continues RUN with running-style, Jump and Harness terminology where authority evidence supports the exact sense. After RUN, the broader remaining categories are equipment, training, horse/breeding/role, venue, entry, race type, surface, distance and weight. The five unresolved edge cases remain visible and can be revisited only when stronger evidence or a clearer modeling decision exists.

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
