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
Next immediate lane: P1/base-seed verification + 3 supplemental candidate cleanup
Later: GLOSSARY-MASTER-006
Current research master: 657 Concepts / 18 domain categories
Relationship layer: 20 relations / 15 reviews / 15 resolved / 0 open
Evidence coverage: 311/657 source-verified; P0 203/203 source-verified
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

The initial evidence audit showed the generic seed was the weak layer. Five P0 waves have now promoted **152 base-seed P0 Concepts** using authority or official-industry evidence appropriate to each claim.

- Wave 1: **16** — DISC 7 / DIST 9
- Wave 2: **30** — ENTRY 9 / VENUE 16 / WEIGHT 5
- Wave 3: **51** — RTYPE 8 / SURF 7 / MEET 19 / RESULT 10 / BET 7
- Wave 4: **44** — HORSE 8 / BREED 5 / ROLE 5 / RUN 12 / EQUIP 3 / TRAIN 4 / PRIZE 2 / WELF 5
- Wave 5: **11** — RTYPE 1 / SURF 3 / MEET 5 / BET 2; plus `BET-028 SP` merged into `BET-027 Starting Price`

Wave 5 closes the current P0 set without percentage-driven promotion. `SP` is represented as an abbreviation rather than a duplicate Concept. `Stakes race`, `Tote`, `Draw`, surface terms and time/document-state terms were verified only after narrowing or recording the actual scope supported by evidence.

Current observed state:

- all Concepts: **311/657 source-verified (47.3%)**, 346 candidate;
- P0: **203/203 source-verified (100.0%)**, 0 candidate;
- active base seed: **153/496 source-verified (30.8%)**, 343 candidate;
- supplemental jurisdiction/relationship research: **158/161 source-verified (98.1%)**, 3 candidate.

All current P0 rows across all 18 categories are now source-verified.

Canonical provenance now includes:

```text
data/glossary-master/sources/p0-core-sources-v1.tsv
data/glossary-master/sources/p0-core-sources-v2.tsv
data/glossary-master/sources/p0-core-sources-v3.tsv
data/glossary-master/sources/p0-core-sources-v4.tsv
data/glossary-master/sources/p0-core-sources-v5.tsv
data/glossary-master/coverage/p0-verification-wave1-v1.tsv
data/glossary-master/coverage/p0-verification-wave2-v1.tsv
data/glossary-master/coverage/p0-verification-wave3-v1.tsv
data/glossary-master/coverage/p0-verification-wave4-v1.tsv
data/glossary-master/coverage/p0-verification-wave5-v1.tsv
data/glossary-master/coverage/master-005-evidence-coverage-v1.tsv
data/glossary-master/coverage/master-005-completion-gate-v1.tsv
```

### Completion decision

Status: **HOLD — not complete**.

P0 is complete, but lower-priority base-seed evidence remains materially incomplete. Three supplemental research rows also remain candidate: `ROLE-029 Claiming Professional Jockey`, `ENTRY-029 Coupled entry`, and `WEIGHT-026 Base rating`.

Immediate work:

```text
post-P0 evidence refinement
-> prioritize P1/base-seed Concepts and high-risk semantic areas
-> resolve ROLE-029 / ENTRY-029 / WEIGHT-026
-> keep jurisdiction scope and polysemy review coupled to verification
-> rerun evidence coverage and completion gate
-> only after MASTER-005 passes, advance to MASTER-006
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
Evidence: 311 verified / 346 candidate
P0: 203 verified / 0 candidate
Next: P1/base-seed verification + 3 supplemental candidate cleanup
MASTER-006: blocked until MASTER-005 evidence gate passes
Public implementation: deferred
```

Conversation history is not execution authority. Future glossary work should read the terminology specification, `data/glossary-master/README.md`, the coverage/gate files, and this addendum first.
