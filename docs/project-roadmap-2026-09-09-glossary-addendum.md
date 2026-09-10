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
Next immediate lane: P1/base-seed verification wave 1
Later: GLOSSARY-MASTER-006
Current research master: 657 Concepts / 18 domain categories
Relationship layer: 20 relations / 15 reviews / 15 resolved / 0 open
Evidence coverage: 314/657 source-verified; 343 candidate
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

Current layer: 60 register usages, 36 effective source-verified mappings, 24 effective candidates, 27 source-verified abbreviations/codes, 4 source-verified historical rows, and 12 register resolutions.

## MASTER-005 — relationship/equivalence and evidence refinement

Status: **current**.

Relationship work is complete for the currently discovered queue: 20 scoped relations, 15/15 review items resolved, duplicate identities merged where justified, genuine jurisdiction/sense differences split, and high-risk polysemy retained without forced global equivalence.

Current master: **657 Concepts**.

### P0 evidence verification

Five P0 waves promoted **152 base-seed P0 Concepts** using authority or official-industry evidence appropriate to each claim.

- Wave 1: **16** — DISC 7 / DIST 9
- Wave 2: **30** — ENTRY 9 / VENUE 16 / WEIGHT 5
- Wave 3: **51** — RTYPE 8 / SURF 7 / MEET 19 / RESULT 10 / BET 7
- Wave 4: **44** — HORSE 8 / BREED 5 / ROLE 5 / RUN 12 / EQUIP 3 / TRAIN 4 / PRIZE 2 / WELF 5
- Wave 5: **11** — RTYPE 1 / SURF 3 / MEET 5 / BET 2; plus `BET-028 SP` merged into `BET-027 Starting Price`

Current P0: **203/203 source-verified (100.0%)**.

### Supplemental candidate cleanup

Status: **complete current pass**.

The final three supplemental candidates were resolved with scope refinement rather than forced global claims:

- `ROLE-029 Claiming Professional Jockey` — IHRB licence/status sense.
- `ENTRY-029 Coupled entry` — US/Regional regulatory sense.
- `WEIGHT-026 Base rating` — Australia/Queensland RBH/programme sense.

Audit: `data/glossary-master/coverage/supplemental-candidate-cleanup-v1.tsv`.

Current observed state:

- all Concepts: **314/657 source-verified (47.8%)**, 343 candidate;
- P0: **203/203 source-verified (100.0%)**, 0 candidate;
- active base seed: **153/496 source-verified (30.8%)**, 343 candidate;
- supplemental jurisdiction/relationship research: **161/161 source-verified (100.0%)**, 0 candidate.

The remaining Concept evidence gap is entirely in lower-priority active base-seed rows.

Canonical provenance includes the P0 source/audit waves, `supplemental-candidate-cleanup-v1.tsv`, `master-005-evidence-coverage-v1.tsv`, and `master-005-completion-gate-v1.tsv` under `data/glossary-master/`.

### Completion decision

Status: **HOLD — not complete**.

P0 and current supplemental research are fully evidence-backed, but **343 lower-priority active base-seed Concepts remain candidate**.

Immediate work:

```text
P1/base-seed verification wave 1
-> prioritize user-facing/high-risk semantic areas
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
Current master: 657 Concepts
Evidence: 314 verified / 343 candidate
P0: 203 verified / 0 candidate
Supplemental research: 161 verified / 0 candidate
Next: P1/base-seed verification wave 1
MASTER-006: blocked until MASTER-005 evidence gate passes
Public implementation: deferred
```

Conversation history is not execution authority. Future glossary work should read the terminology specification, `data/glossary-master/README.md`, the coverage/gate files, and this addendum first.
