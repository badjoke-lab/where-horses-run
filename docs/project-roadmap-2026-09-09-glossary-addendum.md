# Where Horses Run project roadmap — 2026-09-09 glossary knowledge-master addendum

Status: active parallel glossary addendum  
Adopted: 2026-09-09  
Base roadmap: `docs/project-roadmap.md`  
Current primary UI roadmap addendum remains: `docs/project-roadmap-2026-09-06-addendum.md`  
Glossary knowledge-model authority: `docs/glossary/world-racing-terminology-master-spec.md`

This addendum creates a parallel glossary knowledge lane. It does not supersede the active map-first UI lane or Calendar quality/coverage lane and does not change Calendar acquisition/publication boundaries.

## Current glossary stage

```text
Glossary stage: p0_source_verification
Completed: GLOSSARY-MASTER-001
Completed: GLOSSARY-MASTER-002
Completed first major-jurisdiction pass: GLOSSARY-MASTER-003
Completed current register pass: GLOSSARY-MASTER-004
Current glossary Work ID: GLOSSARY-MASTER-005
P0 verification waves 1–4: complete
Next immediate wave: P0 wave 5 — deferred 12 scope/evidence resolution
Later: GLOSSARY-MASTER-006
Current research master: 658 Concepts / 18 domain categories
Relationship layer: 20 relations / 15 reviews / 15 resolved / 0 open
Evidence coverage: 300/658 source-verified; P0 192/204 source-verified
Public glossary page expansion: deferred
Automatic glossary publication: disabled
Existing public glossary content: disposable legacy runtime baseline
```

## Programme objective

The glossary is first a useful user-facing worldwide horse-racing knowledge resource. Search/AI discoverability is a separate structured layer and must not distort canonical knowledge truth.

## MASTER-001 — specification and authority

Status: **complete**. Canonical output: `docs/glossary/world-racing-terminology-master-spec.md`.

## MASTER-002 — zero-based world concept seed

Status: **complete**. Original seed: **501 candidate Concepts / 18 categories**; no legacy glossary migration requirement.

## MASTER-003 — jurisdiction/local-language terminology

Status: **first major-jurisdiction pass complete; follow-up waves allowed**.

Covered GB/Ireland, US/Canada, Australia/New Zealand, Japan including NAR/Banei, France, Hong Kong/Korea, UAE/South Africa, plus Arabian/Harness cross-system follow-up. The pass expanded the seed to 654 Concepts before relationship cleanup.

## MASTER-004 — register/abbreviation/historical terminology

Status: **current pass complete; follow-up waves allowed**.

Current layer: 60 register usages, 36 effective source-verified mappings, 24 effective candidates, 26 source-verified abbreviations/codes, 4 source-verified historical rows, and 12 register resolutions.

## MASTER-005 — relationship/equivalence and evidence refinement

Status: **current**.

Relationship work is complete for the currently discovered queue: 20 scoped relations, 15/15 review items resolved, duplicate identities merged where justified, genuine jurisdiction/sense differences split, and high-risk polysemy retained without forced global equivalence.

Current master: **658 Concepts**.

### P0 evidence verification

The initial evidence audit showed the generic seed was the weak layer. Four P0 waves have now promoted **141 base-seed P0 Concepts** using authority or official-industry evidence appropriate to each claim.

- Wave 1: **16** — DISC 7 / DIST 9
- Wave 2: **30** — ENTRY 9 / VENUE 16 / WEIGHT 5
- Wave 3: **51** — RTYPE 8 / SURF 7 / MEET 19 / RESULT 10 / BET 7
- Wave 4: **44** — HORSE 8 / BREED 5 / ROLE 5 / RUN 12 / EQUIP 3 / TRAIN 4 / PRIZE 2 / WELF 5

Current observed state:

- all Concepts: **300/658 source-verified (45.6%)**, 358 candidate;
- P0: **192/204 source-verified (94.1%)**, 12 candidate;
- active base seed: **142/497 source-verified (28.6%)**, 355 candidate;
- supplemental jurisdiction/relationship research: **158/161 source-verified (98.1%)**, 3 candidate.

All current P0 rows are verified in DISC, DIST, ENTRY, HORSE, BREED, ROLE, VENUE, WEIGHT, RUN, EQUIP, TRAIN, RESULT, PRIZE and WELF. Four categories retain deliberately deferred P0 rows: RTYPE, SURF, MEET and BET.

Remaining deferred P0:

```text
RTYPE-014  Stakes race
SURF-004   Sand
SURF-005   Synthetic surface
SURF-006   All-weather
MEET-022   Draw
MEET-023   Official notice
MEET-031   Local time
MEET-032   Time zone
MEET-034   Postponed
BET-004    Tote
BET-027    Starting Price
BET-028    SP
```

These are not to be promoted merely to reach 100%. `Stakes race` and `Tote` in particular may require narrower scope or sense refinement; broad time/source terms require evidence matching the actual racing-specific claim.

Canonical provenance now includes:

```text
data/glossary-master/sources/p0-core-sources-v1.tsv
data/glossary-master/sources/p0-core-sources-v2.tsv
data/glossary-master/sources/p0-core-sources-v3.tsv
data/glossary-master/sources/p0-core-sources-v4.tsv
data/glossary-master/coverage/p0-verification-wave1-v1.tsv
data/glossary-master/coverage/p0-verification-wave2-v1.tsv
data/glossary-master/coverage/p0-verification-wave3-v1.tsv
data/glossary-master/coverage/p0-verification-wave4-v1.tsv
data/glossary-master/coverage/master-005-evidence-coverage-v1.tsv
data/glossary-master/coverage/master-005-completion-gate-v1.tsv
```

### Completion decision

Status: **HOLD — not complete**.

P0 is near complete but 12 high-priority Concepts remain unresolved and lower-priority base-seed evidence remains materially incomplete. Immediate work:

```text
P0 wave 5: deferred 12
-> refine scope/sense before verification where needed
-> verify only claims supported by current authority evidence
-> rerun evidence coverage and completion gate
-> after P0 closure, explicitly decide the required P1/P2 verification floor before MASTER-006
```

## MASTER-006 — search-intent, coverage, readiness

Status: **queued, not started**.

Only after MASTER-005 passes may this stage add definition/comparison/regional/how-why/translation/abbreviation/racecard-reading search intents and decide whether public implementation planning is justified.

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
Current master: 658 Concepts
Evidence: 300 verified / 358 candidate
P0: 192 verified / 12 candidate
Next: P0 verification wave 5 — deferred 12 scope/evidence resolution
MASTER-006: blocked until MASTER-005 evidence gate passes
Public implementation: deferred
```

Conversation history is not execution authority. Future glossary work should read the terminology specification, `data/glossary-master/README.md`, the coverage/gate files, and this addendum first.
