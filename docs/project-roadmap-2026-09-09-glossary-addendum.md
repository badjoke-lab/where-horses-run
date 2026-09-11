# Where Horses Run project roadmap — 2026-09-09 glossary knowledge-master addendum

Status: active parallel glossary addendum  
Adopted: 2026-09-09  
Base roadmap: `docs/project-roadmap.md`  
Current primary UI roadmap addendum remains: `docs/project-roadmap-2026-09-06-addendum.md`  
Glossary knowledge-model authority: `docs/glossary/world-racing-terminology-master-spec.md`

This addendum creates a parallel glossary knowledge lane. It does not supersede the active map-first UI lane or Calendar quality/coverage lane and does not change Calendar acquisition/publication boundaries.

## Current glossary stage

Plain-language state:

```text
Working dictionary: 642 terms/concepts
Meaning-level source verified: 529
Still under review: 113
Highest-priority core terms: 203/203 verified
Jurisdiction-specific research additions: 161/161 verified
Public glossary publication: disabled
```

Internal execution state:

```text
Completed: GLOSSARY-MASTER-001 — specification / authority
Completed: GLOSSARY-MASTER-002 — zero-based seed
Completed current pass: GLOSSARY-MASTER-003 — major-jurisdiction + local-language terminology research
Completed current pass: GLOSSARY-MASTER-004 — slang / colloquial / industry / abbreviation / historical evidence
Current: GLOSSARY-MASTER-005 — evidence / semantic cleanup
Base-dictionary pass 1: complete
Base-dictionary pass 2: complete
Race types / classifications pass: complete current pass
Surface / going / track-condition pass: complete current pass
Meeting / schedule / official-document pass: complete current pass
Results / inquiries / decisions / result-code pass: complete current pass
Prize money / betting / odds pass: complete current pass
Welfare / veterinary / safety pass: complete current pass
Residual edge-case pass: complete current pass
Running / trip / race-comment pass: broad current pass complete; 2 deliberate unresolved labels retained
Equipment / training pass: current defensible pass complete; weak residuals retained
Horse / breeding / participant roles: wave 1 complete current pass; weak residuals retained
Venue / entry terminology: wave 1 complete current pass; weak residuals retained
Next: remaining race type / surface / distance / weight candidates
Later: GLOSSARY-MASTER-006 — search-intent / coverage / readiness review
```

## Programme objective

The glossary is first a useful user-facing worldwide horse-racing dictionary and knowledge resource. A user should be able to understand a term, its Japanese equivalent, where it is used, how its meaning changes by jurisdiction, and what source supports that explanation. Search/AI discoverability is a separate structured layer and must not distort canonical knowledge truth.

## Completed foundation

`GLOSSARY-MASTER-001` through `004` established the specification, a zero-based 18-category seed, major-jurisdiction/local-language research, and the current register/abbreviation/historical layer.

The relationship review currently has 20 scoped relations and 15/15 reviewed conflicts resolved. The abbreviation/code layer has **38 source-verified rows** and historical terminology has 4 source-verified rows.

## Current evidence and semantic cleanup

The highest-priority core terminology is **203/203 source-verified**. The current jurisdiction/relationship research additions are **161/161 source-verified**.

The remaining task is to clean the lower-priority base dictionary. This does **not** mean automatically marking every seed row as valid. For each term the review may verify it, narrow its regional scope, rewrite its definition, split senses, merge a duplicate, move a code/regional label to the appropriate layer, or remove a bad seed row.

### Completed subject passes

- Base dictionary pass 1: **27 verified**, 2 malformed/duplicate rows retired.
- Base dictionary pass 2: **29 verified**, duplicate `Breeder` consolidated.
- Race types/classifications: **15 verified**.
- Surface/going/track condition: **10 verified**, regional condition systems kept separate.
- Meeting/schedule/official documents: **6 verified**, duplicate `Condition book` consolidated.
- Results/inquiries/decisions/result codes: **13 verified**, duplicate result-code Concepts retired and codes moved to the abbreviation layer.
- Prize money/betting/odds: **28 verified**, duplicate regional wager mechanics consolidated.
- Welfare/veterinary/safety: **13 verified**, bringing WELF to **18/18 source-verified**.
- Residual edge cases: **7 verified**, duplicate `Program` consolidated into `Programme`.
- Running/trip/race comments wave 1: **7 verified**, duplicate Harness `Break` consolidated into `Broke stride`.
- Running/trip/race comments wave 2: **5 verified**, generic `Pacesetter` consolidated into `Front-runner`.
- Running/trip/race comments final broad bundle: **9 verified**, `Tempo` consolidated into `Pace`, `Kick/closing kick` consolidated into `Turn of foot`.
- Equipment/training wave 1: **20 verified** — 13 EQUIP and 7 TRAIN Concepts with scoped authority evidence.
- Equipment/training residual: **1 verified**, `Bike/Racebike` consolidated into `Sulky`.
- Horse/breeding/participant roles wave 1: **14 verified** — 3 HORSE, 4 BREED and 7 ROLE Concepts with scoped JRA/IFHA/BHA/Jockey Club evidence.
- Venue/entry terminology wave 1: **11 verified** — 6 ENTRY and 5 VENUE Concepts with scoped BHA, JRA, Jockey Club, Equibase/Churchill Downs, HRA and HRNZ evidence.

### Residual edge-case pass

The residual pass verified Season, Bulletin, Relegation, False start, Totalisator, Fractional odds and On the board. It also retired `MEET-013 Program` into `MEET-012 Programme`, preserving `Program` as a regional spelling/document label rather than a second Concept.

Several cross-category edge cases remain deliberately unresolved where current evidence or the Concept boundary is insufficient, including Daylight saving time, RO/result-code modeling, generic Bonus, polysemous Stake and American odds.

### Running / trip / race-comment pass

Across three focused RUN bundles, **21 additional RUN Concepts were source-verified and 4 duplicate/label Concepts were retired**. RUN is **42/44 source-verified (95.5%)**. The two deliberate candidates are `Jump`, whose seed conflates multiple senses, and `Hold-up horse`, whose exact canonical label still lacks strong enough current authority definition.

### Equipment / training pass

Wave 1 verified 13 equipment Concepts and 7 training/pre-race Concepts using JRA, Equibase, USTA, Racing Australia/Racing Victoria and Jockey Club material. The residual pass then verified `Pre-parade` from current Jockey Club material and retired `Bike/Racebike` into `Sulky` because USTA explicitly identifies the racebike as the sulky.

EQUIP is now **27/29 source-verified (93.1%)**. `Blinders` and `Barefoot` remain candidate. TRAIN is **20/26 source-verified (76.9%)**. `Breeze`, `Gate schooling`, `Qualifying trial`, `Cool down`, `Layoff` and `Freshened` remain candidate. These weak residuals are retained rather than promoted without sufficient evidence.

### Horse / breeding / participant-role pass

Wave 1 verified `Horse`, `Foal`, `Yearling`, `Broodmare sire`, `Mating`, `Foaling`, `Inbreeding`, `Conditional jockey`, `Amateur rider`, `Owner-breeder`, `Exercise rider`, `Work rider`, `Clerk of the scales` and `Farrier` using current JRA, IFHA, BHA and Jockey Club material.

HORSE is now **21/34 source-verified (61.8%)**, BREED is **11/22 (50.0%)**, and ROLE is **25/31 (80.6%)**. Local age conventions, Thoroughbred registration procedures, and British licensing thresholds remain explicitly scoped. The remaining horse/breeding/role seed rows are retained as candidates where this source bundle does not support promotion.

### Venue / entry terminology pass

Wave 1 verified `Maximum field`, `Balloted out`, `Also eligible`, `Entry fee`, `Preference`, `Eliminated`, `Homestretch`, `Backstretch`, `Mobile barrier`, `Parade ring` and `Winner's enclosure`.

ENTRY is now **26/31 source-verified (83.9%)** and VENUE is **28/44 (63.6%)**. BHA's maximum-field/elimination language remains GB-scoped; current North American stakes conditions support also-eligible, entry-fee and preference mechanics without universalizing one race's rules; JRA/Jockey Club and harness authorities support regional course/facility labels without flattening `Homestretch` into `Home straight`, `Parade ring` into `Paddock`, `Winner's enclosure` into `Winners' circle`, or `Mobile barrier` into every starting-gate system.

Authority/audit files now include:

```text
data/glossary-master/sources/p1-core-sources-v1.tsv
data/glossary-master/sources/p1-core-sources-v2.tsv
data/glossary-master/sources/race-type-condition-sources-v1.tsv
data/glossary-master/sources/surface-going-sources-v1.tsv
data/glossary-master/sources/meeting-schedule-sources-v1.tsv
data/glossary-master/sources/result-decision-sources-v1.tsv
data/glossary-master/sources/prize-betting-sources-v1.tsv
data/glossary-master/sources/welfare-safety-sources-v1.tsv
data/glossary-master/sources/residual-edgecase-sources-v1.tsv
data/glossary-master/sources/run-trip-sources-v1.tsv
data/glossary-master/sources/equipment-training-sources-v1.tsv
data/glossary-master/sources/horse-breeding-role-sources-v1.tsv
data/glossary-master/sources/venue-entry-sources-v1.tsv
data/glossary-master/coverage/p1-verification-wave1-v1.tsv
data/glossary-master/coverage/p1-verification-wave2-v1.tsv
data/glossary-master/coverage/race-type-condition-verification-v1.tsv
data/glossary-master/coverage/surface-going-verification-v1.tsv
data/glossary-master/coverage/meeting-schedule-verification-v1.tsv
data/glossary-master/coverage/result-decision-verification-v1.tsv
data/glossary-master/coverage/prize-betting-verification-v1.tsv
data/glossary-master/coverage/welfare-safety-verification-v1.tsv
data/glossary-master/coverage/residual-edgecase-verification-v1.tsv
data/glossary-master/coverage/run-trip-verification-v1.tsv
data/glossary-master/coverage/run-trip-verification-v2.tsv
data/glossary-master/coverage/run-trip-verification-v3.tsv
data/glossary-master/coverage/equipment-training-verification-v1.tsv
data/glossary-master/coverage/equipment-training-residual-v1.tsv
data/glossary-master/coverage/horse-breeding-role-verification-v1.tsv
data/glossary-master/coverage/venue-entry-verification-v1.tsv
data/glossary-master/coverage/master-005-evidence-coverage-v1.tsv
data/glossary-master/coverage/master-005-completion-gate-v1.tsv
```

Current observed state:

- all Concepts: **529/642 source-verified (82.4%)**, 113 candidate;
- core highest-priority set: **203/203 source-verified (100.0%)**;
- active base seed: **368/481 source-verified (76.5%)**, 113 candidate;
- supplemental jurisdiction/relationship research: **161/161 source-verified (100.0%)**;
- ENTRY: **26/31 source-verified (83.9%)**;
- VENUE: **28/44 source-verified (63.6%)**;
- HORSE: **21/34 source-verified (61.8%)**;
- BREED: **11/22 source-verified (50.0%)**;
- ROLE: **25/31 source-verified (80.6%)**;
- RUN: **42/44 source-verified (95.5%)**;
- EQUIP: **27/29 source-verified (93.1%)**;
- TRAIN: **20/26 source-verified (76.9%)**;
- MEET: **37/38 source-verified (97.4%)**;
- RESULT: **27/28 source-verified (96.4%)**;
- BET: **38/39 source-verified (97.4%)**;
- WELF: **18/18 source-verified (100.0%)**;
- retired/merged Concept rows: **20**;
- abbreviations/codes: **38/38 source-verified**.

## What happens next

The remaining **113 terms** continue by the clearest unresolved broad categories:

```text
remaining race type / surface / distance / weight candidates
-> revisit deliberately unresolved horse / breeding / roles, venue / entry, RUN, EQUIP, TRAIN and cross-category edge cases only with stronger evidence
-> rerun evidence/readiness gate
```

`GLOSSARY-MASTER-005` remains **HOLD — not complete**. An 82.4% verified master with 113 unresolved seed Concepts is not ready to advance.

## MASTER-006 — search-intent, coverage, readiness

Status: **queued, not started**.

Only after the residual semantic review reaches a defensible completion floor may this stage add definition/comparison/regional/how-why/translation/abbreviation/racecard-reading search intents and decide whether public implementation planning is justified.

## Public implementation lane

Deferred:

```text
GLOSSARY-PUBLIC-001  information architecture / URL contract
GLOSSARY-PUBLIC-002  concept/category content contract
GLOSSARY-PUBLIC-003  multilingual/local-label presentation
GLOSSARY-PUBLIC-004  comparison/regional presentation
GLOSSARY-PUBLIC-005  structured data / machine-readable projection
GLOSSARY-PUBLIC-006  internal-link integration
GLOSSARY-PUBLIC-007  EN/JA/responsive/accessibility/SEO/AI-discovery QA
GLOSSARY-PUBLIC-008  reviewed rollout
```

The current public glossary remains disposable content. There is no old-record migration gate.

## Current execution pointer

```text
Current Work ID: GLOSSARY-MASTER-005
Working dictionary: 642 terms
Verified: 529
Still under review: 113
Next subject group: remaining race type / surface / distance / weight candidates
MASTER-006: blocked until the evidence/readiness gate passes
Public implementation: deferred
```

Conversation history is not execution authority. Future glossary work should read the terminology specification, `data/glossary-master/README.md`, the coverage/gate files, and this addendum first.
