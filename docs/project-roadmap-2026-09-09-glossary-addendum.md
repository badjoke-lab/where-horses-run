# Where Horses Run project roadmap — 2026-09-09 glossary knowledge-master addendum

Status: active parallel glossary addendum  
Adopted: 2026-09-09  
Base roadmap: `docs/project-roadmap.md`  
Current primary UI roadmap addendum remains: `docs/project-roadmap-2026-09-06-addendum.md`  
Glossary knowledge-model authority: `docs/glossary/world-racing-terminology-master-spec.md`

This addendum creates a parallel glossary knowledge lane. It does not supersede the active map-first UI lane or Calendar quality/coverage lane and does not change Calendar acquisition/publication boundaries.

## Current glossary stage

```text
Glossary stage: source_evidence_coverage_gate
Completed: GLOSSARY-MASTER-001
Completed: GLOSSARY-MASTER-002
Completed first major-jurisdiction pass: GLOSSARY-MASTER-003
Completed current register pass: GLOSSARY-MASTER-004
Current glossary Work ID: GLOSSARY-MASTER-005
Next: GLOSSARY-MASTER-006
Current research master: 658 Concepts / 18 domain categories
Current register layer: 60 usages / 36 effective verified / 24 effective candidates
Current relationship layer: 20 relations / 15 review items / 15 resolved / 0 open
Public glossary page expansion: deferred
Automatic glossary publication: disabled
Existing public glossary content: disposable legacy runtime baseline
```

The relation/equivalence review queue discovered in MASTER-005 waves 1–4 is now fully resolved. MASTER-005 does **not** complete merely because that queue reached zero: the current gate is source/evidence coverage across the full 658-Concept master.

## Programme objective

The glossary is first a useful user-facing horse-racing knowledge resource. Search/AI discoverability is a separate structured layer and must not distort canonical knowledge truth.

Worldwide racing terminology is not globally standardized. The master represents language-independent Concepts, local/original-script labels, jurisdiction-specific usage, no-direct-equivalent cases, abbreviations and register, historical usage, typed relationships, evidence provenance, and later search intent as a separate layer.

## Active glossary sequence

### `GLOSSARY-MASTER-001` — specification and authority

Status: **complete**. Canonical output: `docs/glossary/world-racing-terminology-master-spec.md`.

### `GLOSSARY-MASTER-002` — zero-based world concept seed

Status: **complete**. Original seed: **501 candidate Concepts / 18 categories**, all initially `public_ready=no`.

### `GLOSSARY-MASTER-003` — jurisdiction and local-language terminology

Status: **first major-jurisdiction pass complete; follow-up waves allowed**.

The first pass covered GB/Ireland, US/Canada, Australia/New Zealand, Japan including NAR/Banei, France, Hong Kong/Korea, UAE/South Africa, plus Arabian/Harness cross-system follow-up. It expanded the seed to 654 Concepts before relationship cleanup.

### `GLOSSARY-MASTER-004` — colloquial, slang, industry, abbreviation, and historical terminology

Status: **current pass complete; follow-up waves allowed**.

Current layer:

- 60 register usages;
- 36 effective source-verified mappings after MASTER-005 resolutions;
- 24 effective register candidates;
- 26 source-verified abbreviations/codes;
- 4 source-verified historical/legacy rows;
- 12 register-resolution rows.

### `GLOSSARY-MASTER-005` — relationship/equivalence and evidence refinement

Status: **current — relation review complete for discovered wave 1–4 items; evidence audit in progress**.

Identity cleanup merged:

- `MEET-002 Meeting` -> `MEET-001 Race meeting` for the English single-event sense;
- `MEET-005 Raceday` -> `MEET-004 Race day`;
- `BET-031 Favourite` -> `BET-030 Favorite`;
- `RTYPE-005 Bumper` -> `RTYPE-006 National Hunt Flat Race`.

Relation review also created real missing meanings, including France Meeting series, Race form notation, tactical pacemaker, and wave-4 Concepts:

- `HORSE-034 Wet-track aptitude`;
- `RUN-047 Travelling easily`;
- `RUN-048 Under pressure`;
- `BET-043 Strong betting support`;
- `BET-044 Dominant betting concentration`.

Current relation decisions include:

- `Off time` = actual race-start time; scheduled start remains a separate Concept;
- `Going` and `Track condition` remain related regional taxonomies, not global synonyms;
- `Racecourse / Racetrack / Track` retain sense-scoped relations and documented polysemy;
- `Group / Grade` remain separate regional-counterpart systems;
- `Spell/Spelling` is narrower than generic Layoff;
- AU/NZ `Mudlark` maps to horse Wet-track aptitude, not surface condition;
- `under double wraps` / `on the bit/bridle` map to Travelling easily, contrasted with `off the bit/bridle` under Under pressure;
- `backed off the map` maps to Strong betting support; JRA `一本かぶり` maps to narrower Dominant betting concentration.

Current relationship state:

- active relations: **20**;
- review items discovered: **15**;
- resolved: **15**;
- open: **0**.

### MASTER-005 completion gate

Before advancing to MASTER-006, audit the 658-Concept master for:

- candidate vs source-verified Concept counts;
- P0 evidence coverage;
- category concentrations of unsourced/candidate Concepts;
- major-jurisdiction evidence gaps;
- evidence-class appropriateness for formal terms versus slang/historical claims;
- any newly exposed critical identity conflict.

A zero relation-review queue is necessary but not sufficient. `public_ready` remains 0 during this audit.

### `GLOSSARY-MASTER-006` — search-intent, coverage, and readiness review

Status: **queued, not started**.

Required work will map definition/comparison/regional/how/why/translation/abbreviation/racecard-reading intents, keep search metadata separate from knowledge truth, produce coverage views, identify remaining knowledge gaps, and decide whether public implementation planning is justified.

## Explicitly deferred public implementation lane

```text
GLOSSARY-PUBLIC-001  public information architecture / URL contract
GLOSSARY-PUBLIC-002  concept-page and category-page content contract
GLOSSARY-PUBLIC-003  multilingual/local-label presentation rules
GLOSSARY-PUBLIC-004  comparison/regional content presentation
GLOSSARY-PUBLIC-005  structured data / metadata / machine-readable projection
GLOSSARY-PUBLIC-006  internal-link integration
GLOSSARY-PUBLIC-007  EN/JA/responsive/accessibility/SEO/AI-discovery QA
GLOSSARY-PUBLIC-008  reviewed public rollout
```

The current public glossary remains a disposable runtime/content baseline. There is no legacy-record migration gate; later reviewed public work may delete and regenerate its content from the new master.

## Current execution pointer

```text
Current glossary Work ID: GLOSSARY-MASTER-005
Current master: 658 Concepts / 18 categories
Relationship state: 20 relations / 15 discovered reviews / 15 resolved / 0 open
Immediate work: source/evidence coverage audit and MASTER-005 completion gate
Next programme stage: GLOSSARY-MASTER-006 only after that gate
Public implementation: deferred until post-MASTER-006 readiness review
```

Conversation history is not execution authority. Future glossary work should read the terminology master specification, `data/glossary-master/README.md`, and this addendum first.
