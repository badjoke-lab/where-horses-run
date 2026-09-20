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
Working dictionary: 635 terms/concepts
Meaning-level source verified: 594
Still under review: 41
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
Race types / classifications pass: broad current pass complete; residuals retained
Surface / going / track-condition pass: broad current pass complete; residuals retained
Distance / measurement pass: broad current pass complete; residuals retained
Weight / handicapping pass: broad current pass complete; residuals retained
Meeting / schedule / official-document pass: complete current pass
Results / inquiries / decisions / result-code pass: complete current pass
Prize money / betting / odds pass: complete current pass
Welfare / veterinary / safety pass: complete current pass
Residual edge-case pass: complete current pass
Running / trip / race-comment pass: broad current pass complete; 2 deliberate unresolved labels retained
Equipment / training pass: current defensible pass complete; weak residuals retained
Horse / breeding / participant roles: wave 1 complete current pass; weak residuals retained
Venue / entry terminology: wave 1 complete current pass; weak residuals retained
Broad category wave 1: complete — 18 RTYPE/SURF/DIST/WEIGHT Concepts verified
Targeted residual wave 1: complete — 15 HORSE/BREED/ROLE/VENUE Concepts verified
Targeted residual wave 2: complete — 5 ENTRY/BREED/VENUE Concepts verified
Targeted residual wave 3: complete — 6 DISC/DIST/HORSE Concepts verified
Targeted residual wave 4: complete — 8 RTYPE/HORSE/BREED/ROLE Concepts verified
Targeted residual wave 5: complete — 6 RTYPE/ENTRY/ROLE/VENUE/TRAIN Concepts verified
Targeted residual wave 6: complete — 5 verified + 1 duplicate merge across SURF/WEIGHT/TRAIN/ROLE
Targeted residual resolution wave 7: complete — 5 duplicate/malformed candidate Concepts retired
Targeted residual resolution wave 8: complete — 2 SURF canonicals verified + generic Daylight saving time retired
Next: continue targeted residual cleanup across remaining base-seed categories
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
- Race types/classifications: initial **15 verified**, plus **4** in broad-category wave 1.
- Surface/going/track condition: initial **10 verified**, plus **5** in broad-category wave 1.
- Distance/measurement: **4 verified** in broad-category wave 1 beyond the earlier base cleanup.
- Weight/handicapping: **5 verified** in broad-category wave 1 beyond the earlier base cleanup.
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
- Broad category wave 1: **18 verified** — 4 RTYPE, 5 SURF, 4 DIST and 5 WEIGHT Concepts.
- Targeted residual wave 1: **15 verified** — 4 HORSE, 1 BREED, 2 ROLE and 8 VENUE Concepts; jurisdiction scope narrowed where the seed overclaimed.
- Targeted residual wave 2: **5 verified** — 2 ENTRY, 1 BREED and 2 VENUE Concepts; BHA supplementary-entry mechanics, Thoroughbred Covering semantics and JRA stable-facility terminology remain scoped.
- Targeted residual wave 3: **6 verified** — 4 DISC, 1 DIST and 1 HORSE Concepts; jurisdiction, discipline, notation and past-performance boundaries remain scoped.
- Targeted residual wave 4: **8 verified** — 4 RTYPE, 1 HORSE, 2 BREED and 1 ROLE Concepts; one seed canonical corrected from `Stud farm` to `Breeding farm`.
- Targeted residual wave 5: **6 verified** — 2 RTYPE, 1 ENTRY, 1 ROLE, 1 VENUE and 1 TRAIN Concept; invitation/programme/withdrawal/race-office/paddock/qualification semantics remain scoped.
- Targeted residual wave 6: **5 verified + 1 retired merge** — Claiming allowance, Breeze, Gate schooling, Layoff and Track announcer verified; duplicate `Grass` merged into `Turf`.
- Targeted residual resolution wave 7: **5 retired merges** — Debutant → First-time starter, Female family → Family, Corner → Turn, Counterclockwise → Anti-clockwise, and unsupported RO result-code row → Ran out.
- Targeted residual resolution wave 8: **2 verified + 1 retired context** — Frozen → `Freezing`, Snow-covered → `Snow`, and generic Daylight saving time retired under Time zone context.

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

HORSE is now **25/34 source-verified (73.5%)**, BREED is **13/22 (59.1%)**, and ROLE is **27/31 (87.1%)**. Local age conventions, Thoroughbred registration procedures, and British licensing thresholds remain explicitly scoped. The remaining horse/breeding/role seed rows are retained as candidates where this source bundle does not support promotion.

### Venue / entry terminology pass

Wave 1 verified `Maximum field`, `Balloted out`, `Also eligible`, `Entry fee`, `Preference`, `Eliminated`, `Homestretch`, `Backstretch`, `Mobile barrier`, `Parade ring` and `Winner's enclosure`.

ENTRY is now **28/31 source-verified (90.3%)** and VENUE is **38/44 (86.4%)**. BHA's maximum-field/elimination language remains GB-scoped; current North American stakes conditions support also-eligible, entry-fee and preference mechanics without universalizing one race's rules; JRA/Jockey Club and harness authorities support regional course/facility labels without flattening `Homestretch` into `Home straight`, `Parade ring` into `Paddock`, `Winner's enclosure` into `Winners' circle`, or `Mobile barrier` into every starting-gate system.

### Broad category wave 1

This pass verified `Selling race`, `Graded stakes`, scoped British `Open race` and `Restricted race`; `Tapeta`, `Polytrack`, historical British `Fibresand`, `Sealed track` and `Off turf`; `Yard`, `Short head`, `Final furlong` and `Race record`; plus `Bottom weight`, `Maximum weight`, `Underweight`, `Weigh out` and `Weigh in`.

RTYPE is now **100/111 source-verified (90.1%)**, SURF **57/63 (90.5%)**, DIST **17/21 (81.0%)**, and WEIGHT **31/34 (91.2%)**. BHA/TOBA programme categories, all-weather product names, historical surface status, North American track-state/surface-switch labels, British result notation and regional weighing terminology remain scoped to the evidence rather than generalized worldwide.

### Targeted residual wave 1

This pass verified `Four-year-old`, `Foreign-bred`, `Ridgling`, `Rig`, `Foaled`, `Assistant trainer`, `Stable staff`, `Chute`, `Bend`, `Running rail`, `Winning post`, `Grandstand`, `Barn`, `Clockwise` and `Anti-clockwise`.

HORSE is now **25/34 source-verified (73.5%)**, BREED **12/22 (54.5%)**, ROLE **27/31 (87.1%)**, and VENUE **36/44 (81.8%)**. `Foreign-bred` is bounded to Japan/Regional for the verified JRA usage, `Rig` is International/Regional, and facility/orientation labels remain separate from related broader Concepts.

### Targeted residual wave 2

This pass verified `Supplementary entry`, `Supplementary fee`, `Covering`, `Stable area` and `Stable`.

ENTRY is now **28/31 source-verified (90.3%)**, BREED **13/22 (59.1%)**, and VENUE **38/44 (86.4%)**. BHA supplementary-entry and fee mechanics stay GB/Regional, `Covering` is narrowed to International/Thoroughbred based on IFHA/ISBC/ITBF definitions, and stable-facility labels remain scope-aware.

### Targeted residual wave 3

This pass verified `Cross-country chase`, `Monté`, `Point-to-point`, `Pony racing`, `Half-length` and `First-time starter`.

DISC is now **16/17 source-verified (94.1%)**, DIST **18/21 (85.7%)**, and HORSE **26/34 (76.5%)**. Point-to-point retains separate GB/IRE governance semantics, Monté remains French mounted trotting, cross-country obstacle detail stays venue-specific, and the distance/horse-status labels retain the regional scope directly supported by current evidence.

### Targeted residual wave 4

This pass verified `Weanling`, `Breeding farm`, `Family`, `Owner-trainer`, `Derby`, `Classic race`, `Sprint race` and `Middle-distance race`.

RTYPE is now **104/111 source-verified (93.7%)**, HORSE **27/34 (79.4%)**, BREED **15/22 (68.2%)**, and ROLE **28/31 (90.3%)**. The seed `Stud farm` label was corrected to `Breeding farm`; Derby/Classic semantics and distance-class terminology remain authority-scoped rather than globalized.

### Targeted residual wave 5

This pass verified `Invitational race`, `Staying race`, `Late withdrawal`, `Racing secretary`, `Saddling paddock` and `Qualifying trial`.

RTYPE is now **106/111 source-verified (95.5%)**, ENTRY **29/31 (93.5%)**, ROLE **29/31 (93.5%)**, VENUE **39/44 (88.6%)**, and TRAIN **21/26 (80.8%)**. The terms remain tied to the authority-backed invitation, programme, withdrawal, race-office, paddock and harness-qualification contexts that support them.

### Targeted residual wave 6

This pass verified `Claiming allowance`, `Breeze`, `Gate schooling`, `Layoff` and `Track announcer`. It also retired `Grass` into the already source-verified `Turf` Concept because JRA directly cross-references the two labels.

ROLE is now **30/31 source-verified (96.8%)**, TRAIN **24/26 (92.3%)**, WEIGHT **32/34 (94.1%)**, and SURF **57/62 (91.9%)**. The seed `Race caller` label was corrected to the current authority-backed `Track announcer` canonical rather than retained as a separate or weaker canonical term.

### Targeted residual resolution wave 7

This pass retired `Debutant`, `Female family`, `Corner`, `Counterclockwise` and the unsupported `RO` result-code row through reviewed semantic dispositions. No weak candidate was promoted merely to improve the percentage.

RESULT is now **27/27 source-verified (100%)**, VENUE **39/42 (92.9%)**, HORSE **27/33 (81.8%)**, and BREED **15/21 (71.4%)**. `RO` is not retained as a verified public abbreviation because current authority evidence supports the Ran out event but not the code itself.

### Targeted residual resolution wave 8

This pass corrected and verified the current USTA track-condition labels `Freezing` and `Snow`, replacing the weaker seed canonicals `Frozen` and `Snow-covered`. It also retired generic `Daylight saving time` as a non-independent civil-time concept under `Time zone` context.

SURF is now **59/62 source-verified (95.2%)** and MEET is **37/37 (100%)**. Whole-master coverage rises through both evidence-backed verification and semantic cleanup rather than automatic promotion.

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
data/glossary-master/sources/broad-category-sources-v1.tsv
data/glossary-master/sources/targeted-residual-sources-v1.tsv
data/glossary-master/sources/targeted-residual-sources-v2.tsv
data/glossary-master/sources/targeted-residual-sources-v3.tsv
data/glossary-master/sources/targeted-residual-sources-v4.tsv
data/glossary-master/sources/targeted-residual-sources-v5.tsv
data/glossary-master/sources/targeted-residual-sources-v6.tsv
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
data/glossary-master/coverage/broad-category-verification-v1.tsv
data/glossary-master/coverage/targeted-residual-verification-v1.tsv
data/glossary-master/coverage/targeted-residual-verification-v2.tsv
data/glossary-master/coverage/targeted-residual-verification-v3.tsv
data/glossary-master/coverage/targeted-residual-verification-v4.tsv
data/glossary-master/coverage/targeted-residual-verification-v5.tsv
data/glossary-master/coverage/targeted-residual-verification-v6.tsv
data/glossary-master/coverage/targeted-residual-resolution-v7.tsv
data/glossary-master/coverage/targeted-residual-resolution-v8.tsv
data/glossary-master/coverage/master-005-evidence-coverage-v1.tsv
data/glossary-master/coverage/master-005-completion-gate-v1.tsv
```

Current observed state:

- all Concepts: **594/635 source-verified (93.5%)**, 41 candidate;
- core highest-priority set: **203/203 source-verified (100.0%)**;
- active base seed: **433/474 source-verified (91.4%)**, 41 candidate;
- supplemental jurisdiction/relationship research: **161/161 source-verified (100.0%)**;
- DISC: **16/17 source-verified (94.1%)**;
- RTYPE: **106/111 source-verified (95.5%)**;
- ENTRY: **29/31 source-verified (93.5%)**;
- HORSE: **27/33 source-verified (81.8%)**;
- BREED: **15/21 source-verified (71.4%)**;
- ROLE: **30/31 source-verified (96.8%)**;
- VENUE: **39/42 source-verified (92.9%)**;
- SURF: **59/62 source-verified (95.2%)**;
- DIST: **18/21 source-verified (85.7%)**;
- WEIGHT: **32/34 source-verified (94.1%)**;
- RUN: **42/44 source-verified (95.5%)**;
- EQUIP: **27/29 source-verified (93.1%)**;
- TRAIN: **24/26 source-verified (92.3%)**;
- MEET: **37/37 source-verified (100.0%)**;
- RESULT: **27/27 source-verified (100.0%)**;
- BET: **38/39 source-verified (97.4%)**;
- WELF: **18/18 source-verified (100.0%)**;
- retired/merged Concept rows: **27**;
- abbreviations/codes: **38/38 source-verified**.

## What happens next

The remaining **41 terms** continue through targeted residual review rather than another percentage-driven blanket promotion:

```text
largest residual groups: VENUE / HORSE / BREED / RTYPE
-> remaining ENTRY / SURF / DIST / WEIGHT and other mid-size categories
-> deliberately unresolved RUN / EQUIP / TRAIN / cross-category edge cases only with stronger evidence or cleaner modeling
-> rerun evidence/readiness gate
```

`GLOSSARY-MASTER-005` remains **HOLD — not complete**. A 93.5% verified master with 41 unresolved seed Concepts is not ready to advance.

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
Working dictionary: 635 terms
Verified: 594
Still under review: 41
Next subject group: continue targeted residual cleanup across remaining base-seed categories
MASTER-006: blocked until the evidence/readiness gate passes
Public implementation: deferred
```

Conversation history is not execution authority. Future glossary work should read the terminology specification, `data/glossary-master/README.md`, the coverage/gate files, and this addendum first.
