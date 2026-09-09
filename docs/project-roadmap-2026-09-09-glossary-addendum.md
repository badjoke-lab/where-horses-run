# Where Horses Run project roadmap — 2026-09-09 glossary knowledge-master addendum

Status: active parallel glossary addendum  
Adopted: 2026-09-09  
Base roadmap: `docs/project-roadmap.md`  
Current primary UI roadmap addendum remains: `docs/project-roadmap-2026-09-06-addendum.md`  
Glossary knowledge-model authority: `docs/glossary/world-racing-terminology-master-spec.md`

This addendum creates a parallel glossary knowledge lane. It does not supersede the active map-first UI lane or Calendar quality/coverage lane and does not change Calendar acquisition/publication boundaries.

## Current glossary stage

```text
Glossary stage: world_terminology_master_construction
Completed: GLOSSARY-MASTER-001
Completed: GLOSSARY-MASTER-002
Current glossary Work ID: GLOSSARY-MASTER-003
Next: GLOSSARY-MASTER-004
Immediate output: core worldwide concept inventory / working master
Public glossary page expansion: deferred
Automatic glossary publication: disabled
Legacy public glossary routes: may remain
```

The current task is to build the terminology master before committing to a new public glossary information architecture or broad route expansion.

## Why the sequence changes

The existing glossary implementation is a useful legacy baseline, but it was designed around a smaller bilingual term set and cannot serve as the canonical model for worldwide racing terminology.

Worldwide racing terminology is not globally standardized. The glossary must first represent:

- language-independent concepts;
- local-language and original-script labels;
- jurisdiction-specific official usage;
- terms with no direct translation;
- aliases, abbreviations, and short forms;
- colloquial, industry, and slang usage;
- historical/deprecated/obsolete usage;
- typed concept relationships and equivalence strength;
- source/evidence provenance;
- search-discovery intents separated from canonical knowledge.

Public-page expansion before this model is sufficiently reviewed risks freezing an English/Japanese-first or false-synonym structure into the site.

## Active glossary sequence

### `GLOSSARY-MASTER-001` — specification and authority

Status: **complete**.

Completed output:

- `docs/glossary/world-racing-terminology-master-spec.md`;
- concept-first authority over future glossary expansion;
- current public glossary preserved as a legacy baseline rather than completeness authority;
- master-list-first / public-pages-later boundary recorded.

### `GLOSSARY-MASTER-002` — normalized working master and legacy audit

Status: **complete**.

Completed output:

- recovered the complete legacy public-v1 contract as 48 concepts / nine categories;
- identified the runtime composition as 31 base records + five role additions + four timetable/data additions + eight official/governance additions;
- created `data/glossary-master/README.md` with normalized domain/file contracts;
- created `data/glossary-master/legacy-migration-v1.tsv` with exactly 48 migration rows;
- created `docs/glossary/legacy-runtime-audit-2026-09-09.md`;
- assigned every legacy concept an explicit migration decision instead of silently copying old headwords/categories;
- surfaced reclassification, split, regional-scope, operational-term, and governance-taxonomy problems;
- did not treat old review status as new master evidence verification.

Material MASTER-002 findings include:

```text
post-time -> variant under scheduled-race-start-time proposal
jump-course -> course structure, not surface
all-weather course -> all-weather surface proposal
meeting -> Race meeting proposal, with Meeting retained as label
entries -> split required
results -> split required
link-first-source/source-status -> WHR operations, not automatic public-world-glossary concepts
governing-body/racing-authority/racecourse-operator -> taxonomy gap review
```

### `GLOSSARY-MASTER-003` — core worldwide concept inventory

Status: **current**.

- expand the concept inventory across the controlled taxonomy;
- include racing systems, meetings, race types/conditions, entry process, horses, pedigree, roles, racecourses, surfaces/conditions, distance, weights, race progression, equipment, training, results/adjudication, and betting terminology;
- identify concept boundaries and common confusion pairs before translation expansion;
- resolve the governance/organization taxonomy gap exposed by MASTER-002 without force-fitting organizations into People and roles;
- assign stable master `concept_id` values only after concept boundaries are accepted;
- populate working-master structures rather than modifying current public glossary routes.

### `GLOSSARY-MASTER-004` — jurisdiction and local-language terminology

Status: queued after MASTER-003.

- research terminology bottom-up from material actually used in each jurisdiction/language;
- preserve original script;
- map local terms to existing concepts only when justified;
- create local-only concepts where required;
- record `no_direct_equivalent` instead of inventing translations;
- capture authority/jurisdiction/discipline/period context.

### `GLOSSARY-MASTER-005` — colloquial, slang, historical, and evidence pass

Status: queued.

- add established colloquial, industry, slang, historic, deprecated, and obsolete forms;
- distinguish them from official/preferred labels;
- attach claim-appropriate evidence, usage context, currentness, and confidence;
- route ambiguous or weakly evidenced forms to Review Queue rather than publishing guesses.

### `GLOSSARY-MASTER-006` — search-intent and coverage review

Status: queued.

- map definition, comparison, regional, how/why, translation, and abbreviation search intents to reviewed concepts;
- keep search metadata separate from canonical concept truth;
- produce coverage views by taxonomy, jurisdiction, language, evidence state, and review state;
- identify knowledge gaps and high-value comparison/regional topics;
- decide whether the master is mature enough to enter public implementation planning.

## Explicitly deferred public implementation lane

Do not start this lane merely because individual terms are reviewed.

```text
GLOSSARY-PUBLIC-001  public information architecture / URL contract
GLOSSARY-PUBLIC-002  concept-page and category-page content contract
GLOSSARY-PUBLIC-003  multilingual/local-label presentation rules
GLOSSARY-PUBLIC-004  comparison/regional content presentation
GLOSSARY-PUBLIC-005  structured data / metadata / machine-readable projection
GLOSSARY-PUBLIC-006  internal-link integration with countries, racecourses, types, and other relevant pages
GLOSSARY-PUBLIC-007  EN/JA/responsive/accessibility/SEO/AI-discovery QA
GLOSSARY-PUBLIC-008  reviewed public rollout
```

These are not current implementation tasks. Their exact scope may change after the master-list review.

## Public-page readiness gate

A new glossary public-page expansion/redesign may begin only after a reviewed decision confirms that:

```text
concept model is stable enough
legacy terms have explicit migration dispositions
core taxonomy coverage is credible
major regional terminology differences can be represented
no-direct-equivalent cases work without invented translations
slang/historical handling is evidence-bound
source provenance is usable
search intents are mapped separately from knowledge truth
coverage/review gaps are visible
```

A raw term-count target is not sufficient.

## Relationship to existing public glossary pages

Current glossary index/detail routes are not required to be removed during master construction.

However:

- do not treat their current records as the full worldwide master;
- do not mass-expand routes from unreviewed rows;
- do not force new concepts into the legacy v2 field/category assumptions when that would lose regional or semantic meaning;
- do not rewrite official/local terminology to fit an English-first hierarchy;
- do not use the glossary to bypass prohibited public-data boundaries.

## Publication boundary

Glossary knowledge may explain racecards, participants, odds, results, payouts, and betting concepts. It does not authorize republication of meeting-specific restricted datasets, predictions, tips, or raw source bodies.

Existing publication and governance contracts remain authoritative.

## Parallel-lane rule

This glossary lane may proceed independently of map-first UI and Calendar maintenance because its immediate outputs are reviewed knowledge/master artifacts rather than public runtime behavior.

Glossary master work must not block Calendar corrections, racecourse data quality, or the active UI lane. Conversely, completing unrelated UI/Calendar work does not imply glossary master completion.

## Current execution pointer

```text
Current glossary Work ID: GLOSSARY-MASTER-003
Next: GLOSSARY-MASTER-004
Public implementation: deferred until post-MASTER-006 readiness review
```

Conversation history is not the execution authority. Future glossary-list work should read `docs/glossary/world-racing-terminology-master-spec.md`, `docs/glossary/legacy-runtime-audit-2026-09-09.md`, `data/glossary-master/README.md`, and this addendum first.
