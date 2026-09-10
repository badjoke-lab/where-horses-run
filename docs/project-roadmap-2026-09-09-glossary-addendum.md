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
P0 verification wave 1: complete
Next immediate wave: ENTRY / VENUE / WEIGHT P0 verification
Later: GLOSSARY-MASTER-006
Current research master: 658 Concepts / 18 domain categories
Relationship layer: 20 relations / 15 reviews / 15 resolved / 0 open
Evidence coverage: 175/658 source-verified; P0 67/204 source-verified
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

Relationship work is complete for the currently discovered queue:

- 20 scoped Concept relations;
- 15 review items discovered / 15 resolved / 0 open;
- duplicate Concepts merged where justified;
- genuine jurisdiction/sense differences split;
- Track/Racetrack polysemy and Going/Track condition retained without forced global equivalence;
- register-derived concepts such as Mudlark, easy-travelling states and betting-support states resolved.

Current master: **658 Concepts**.

### Evidence gate

The initial evidence audit blocked MASTER-005 completion because most of the generic seed remained candidate. P0 verification wave 1 has now promoted **16 base-seed P0 Concepts** using authority evidence.

Current observed state:

- all Concepts: **175/658 source-verified (26.6%)**, 483 candidate;
- P0: **67/204 source-verified (32.8%)**, 137 candidate;
- active base seed: **17/497 source-verified (3.4%)**, 480 candidate;
- supplemental jurisdiction/relationship research: **158/161 source-verified (98.1%)**, 3 candidate.

Wave 1 completed all current P0 rows in:

- DISC — 7 P0 verified;
- DIST — 9 P0 verified.

Canonical provenance:

```text
data/glossary-master/sources/p0-core-sources-v1.tsv
data/glossary-master/coverage/p0-verification-wave1-v1.tsv
data/glossary-master/coverage/master-005-evidence-coverage-v1.tsv
data/glossary-master/coverage/master-005-completion-gate-v1.tsv
```

### Completion decision

Status: **HOLD — not complete**.

137 P0 Concepts remain candidate. Immediate work:

```text
P0 wave 2: ENTRY / VENUE / WEIGHT
-> use official/international authority sources appropriate to each claim
-> resolve remaining supplemental candidates when evidence is available
-> recompute evidence coverage
-> rerun MASTER-005 completion gate
-> continue P0 waves until the remaining material evidence risk is acceptable
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
Evidence: 175 verified / 483 candidate
P0: 67 verified / 137 candidate
Next: P0 verification wave 2 — ENTRY / VENUE / WEIGHT
MASTER-006: blocked until MASTER-005 evidence gate passes
Public implementation: deferred
```

Conversation history is not execution authority. Future glossary work should read the terminology specification, `data/glossary-master/README.md`, the coverage/gate files, and this addendum first.
