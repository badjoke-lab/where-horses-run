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
Next: GLOSSARY-MASTER-006
Current research master: 658 Concepts / 18 domain categories
Current register layer: 60 usages / 36 effective verified / 24 effective candidates
Current relationship layer: 20 relations / 15 review items / 15 resolved / 0 open
Evidence coverage: 159/658 source-verified; P0 51/204 source-verified
Public glossary page expansion: deferred
Automatic glossary publication: disabled
Existing public glossary content: disposable legacy runtime baseline
```

The relation/equivalence queue discovered in MASTER-005 waves 1–4 is fully resolved. The first whole-master evidence audit then blocked MASTER-005 completion because most of the original base seed remains candidate.

## Programme objective

The glossary is first a useful user-facing horse-racing knowledge resource. Search/AI discoverability is a separate structured layer and must not distort canonical knowledge truth.

Worldwide racing terminology is not globally standardized. The master represents language-independent Concepts, local/original-script labels, jurisdiction-specific usage, no-direct-equivalent cases, abbreviations/register, historical usage, typed relationships, evidence provenance, and later search intent as a separate layer.

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

Current layer has 60 register usages, 36 effective source-verified mappings, 24 effective candidates, 26 source-verified abbreviations/codes, 4 source-verified historical rows, and 12 register resolutions.

### `GLOSSARY-MASTER-005` — relationship/equivalence and evidence refinement

Status: **current**.

Relationship work has:

- merged duplicate Concept identities where justified;
- split real jurisdiction/sense differences;
- retained polysemy where a global split would overstate evidence;
- resolved all 15 discovered relationship-review items;
- produced 20 scoped Concept relations;
- added five wave-4 Concepts for wet-track aptitude, travelling state, pressure state and betting-support semantics.

Current master after wave 4: **658 Concepts**.

#### Evidence audit result

Canonical files:

```text
data/glossary-master/coverage/master-005-evidence-coverage-v1.tsv
data/glossary-master/coverage/master-005-completion-gate-v1.tsv
```

Observed:

- all Concepts: **159/658 source-verified (24.2%)**, 499 candidate;
- P0: **51/204 source-verified (25.0%)**, 153 candidate;
- active base seed: **1/497 source-verified (0.2%)**, 496 candidate;
- supplemental jurisdiction/relationship research: **158/161 source-verified (98.1%)**, 3 candidate.

The evidence problem is therefore not the newer jurisdiction research; it is the original generic seed.

Categories with zero source-verified Concept rows are DISC, BREED, DIST and WELF. VENUE, RESULT, BET and several other core categories also have very low coverage.

#### MASTER-005 completion decision

Status: **HOLD — not complete**.

The relationship gate passes, but the P0 evidence gate fails. The project must not move to MASTER-006 while **153 P0 Concepts remain candidate**.

Immediate work:

```text
P0-first source verification
-> prioritize official/international authority sources for generic core concepts
-> update Concept rows and claim provenance
-> resolve the three remaining supplemental Concept candidates during the same evidence cleanup
-> rerun master-005-evidence-coverage-v1
-> rerun MASTER-005 completion gate
```

No arbitrary raw-term target is sufficient. Completion is based on evidence quality and remaining material risk.

### `GLOSSARY-MASTER-006` — search-intent, coverage, and readiness review

Status: **queued, not started**.

Only after MASTER-005 passes may this stage map definition, comparison, regional, how/why, translation, abbreviation and racecard-reading intents, identify useful comparison/regional content, and decide whether public implementation planning is justified.

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
Evidence state: 159 verified / 499 candidate; P0 51 verified / 153 candidate
Immediate work: P0-first source verification
Next programme stage: GLOSSARY-MASTER-006 only after MASTER-005 gate passes
Public implementation: deferred until post-MASTER-006 readiness review
```

Conversation history is not execution authority. Future glossary work should read the terminology master specification, `data/glossary-master/README.md`, the coverage gate files, and this addendum first.
