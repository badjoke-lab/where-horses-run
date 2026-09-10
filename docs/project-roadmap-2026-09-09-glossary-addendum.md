# Where Horses Run project roadmap — 2026-09-09 glossary knowledge-master addendum

Status: active parallel glossary addendum  
Adopted: 2026-09-09  
Base roadmap: `docs/project-roadmap.md`  
Current primary UI roadmap addendum remains: `docs/project-roadmap-2026-09-06-addendum.md`  
Glossary knowledge-model authority: `docs/glossary/world-racing-terminology-master-spec.md`

This addendum creates a parallel glossary knowledge lane. It does not supersede the active map-first UI lane or Calendar quality/coverage lane and does not change Calendar acquisition/publication boundaries.

## Current glossary stage

```text
Glossary stage: evidence_refinement
Completed: GLOSSARY-MASTER-001
Completed: GLOSSARY-MASTER-002
Completed first major-jurisdiction pass: GLOSSARY-MASTER-003
Completed current register pass: GLOSSARY-MASTER-004
Current glossary Work ID: GLOSSARY-MASTER-005
P0 verification waves 1–5: complete
Current P0: 203/203 source-verified; 0 candidate
Supplemental research: 161/161 source-verified; 0 candidate
P1/base-seed verification wave 1: complete current pass
Next immediate lane: P1/base-seed verification wave 2
Later: GLOSSARY-MASTER-006
Current research master: 655 Concepts / 18 domain categories
Relationship layer: 20 relations / 15 reviews / 15 resolved / 0 open
Concept dispositions: 7 retired/merged rows
Evidence coverage: 341/655 source-verified; 314 candidate
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

Covered GB/Ireland, US/Canada, Australia/New Zealand, Japan including NAR/Banei, France, Hong Kong/Korea, UAE/South Africa, plus Arabian/Harness cross-system follow-up. The pass expanded the seed before relationship and evidence cleanup.

## MASTER-004 — register/abbreviation/historical terminology

Status: **current pass complete; follow-up waves allowed**.

Current layer: 60 register usages, 36 effective source-verified mappings, 24 effective candidates, 27 source-verified abbreviations/codes, 4 source-verified historical rows, and 12 register resolutions.

## MASTER-005 — relationship/equivalence and evidence refinement

Status: **current**.

Relationship work is complete for the currently discovered queue: 20 scoped relations, 15/15 review items resolved, duplicate identities merged where justified, genuine jurisdiction/sense differences split, and high-risk polysemy retained without forced global equivalence.

Current master: **655 Concepts**.

### P0 evidence verification

Five P0 waves promoted **152 base-seed P0 Concepts** using authority or official-industry evidence appropriate to each claim. Current P0 is **203/203 source-verified (100.0%)**.

### Supplemental candidate cleanup

Status: **complete current pass**.

The final three supplemental candidates were resolved with scope refinement rather than forced global claims. Current supplemental research is **161/161 source-verified (100.0%)**.

### P1 base-seed verification wave 1

Status: **complete current pass**.

Wave 1 verified **27 P1 base-seed Concepts** across DISC, ENTRY, VENUE, DIST and WEIGHT.

The wave also corrected the original seed model:

- `DIST-013 Dead heat distance` → retired into `RESULT-007 Dead heat`; malformed seed label not retained as a public synonym.
- `WEIGHT-010 Weight penalty` → merged into `WEIGHT-009 Penalty`; label retained through the disposition layer.
- `DISC-013 Quarter Horse racing` → scope narrowed from `Americas` to `North America/Regional`.
- `ENTRY-009 Maximum field` → intentionally remains candidate until canonical wording is reconciled with current authority terms such as `Field Limit` / `Field Size Limit`.

Authority and audit files:

```text
data/glossary-master/sources/p1-core-sources-v1.tsv
data/glossary-master/coverage/p1-verification-wave1-v1.tsv
```

Current observed state:

- all Concepts: **341/655 source-verified (52.1%)**, 314 candidate;
- P0: **203/203 source-verified (100.0%)**, 0 candidate;
- active base seed: **180/494 source-verified (36.4%)**, 314 candidate;
- supplemental jurisdiction/relationship research: **161/161 source-verified (100.0%)**, 0 candidate.

The remaining Concept evidence gap is entirely in lower-priority active base-seed rows.

### Completion decision

Status: **HOLD — not complete**.

P0 and current supplemental research are fully evidence-backed, and P1 wave 1 materially improved the base seed, but **314 lower-priority active base-seed Concepts remain candidate**.

Immediate work:

```text
P1/base-seed verification wave 2
-> continue high-utility / high-risk semantic areas
-> review suspicious canonical labels before promotion
-> refine jurisdiction scope before promotion where necessary
-> split/merge Concepts where authority evidence shows the seed model is wrong
-> rerun evidence coverage and completion gate
-> define a defensible evidence floor before MASTER-006
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
Current master: 655 Concepts
Evidence: 341 verified / 314 candidate
P0: 203 verified / 0 candidate
Supplemental research: 161 verified / 0 candidate
P1 wave 1: 27 verified / 2 duplicate seed rows retired
Next: P1/base-seed verification wave 2
MASTER-006: blocked until MASTER-005 evidence gate passes
Public implementation: deferred
```

Conversation history is not execution authority. Future glossary work should read the terminology specification, `data/glossary-master/README.md`, the coverage/gate files, and this addendum first.
