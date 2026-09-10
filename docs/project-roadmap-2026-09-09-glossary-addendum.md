# Where Horses Run project roadmap — 2026-09-09 glossary knowledge-master addendum

Status: active parallel glossary addendum  
Adopted: 2026-09-09  
Base roadmap: `docs/project-roadmap.md`  
Current primary UI roadmap addendum remains: `docs/project-roadmap-2026-09-06-addendum.md`  
Glossary knowledge-model authority: `docs/glossary/world-racing-terminology-master-spec.md`

This addendum creates a parallel glossary knowledge lane. It does not supersede the active map-first UI lane or Calendar quality/coverage lane and does not change Calendar acquisition/publication boundaries.

## Current glossary stage

```text
Glossary stage: relationship_equivalence_and_evidence_refinement
Completed: GLOSSARY-MASTER-001
Completed: GLOSSARY-MASTER-002
Completed first major-jurisdiction pass: GLOSSARY-MASTER-003
Completed current register pass: GLOSSARY-MASTER-004
Current glossary Work ID: GLOSSARY-MASTER-005
Next: GLOSSARY-MASTER-006
Current research master: 654 Concepts / 18 domain categories
Current register layer: 60 usages / 26 abbreviations / 4 historical rows
Current relationship layer wave 1: 15 relations / 15 review items
Public glossary page expansion: deferred
Automatic glossary publication: disabled
Existing public glossary content: disposable legacy runtime baseline
```

The current task is to refine Concept relationships, homonyms, false synonyms and evidence boundaries before adding the search-intent/readiness layer. Jurisdiction and register research may still receive follow-up waves when later relationship work exposes real gaps.

## Programme objective

The glossary is first a useful user-facing horse-racing knowledge resource. Because WHR is a later entrant, its knowledge structure must also support strong Google/Bing and AI-search discovery through explicit concepts, local terminology, relationships, evidence, regional differences, and search intents.

Search metadata must remain separate from canonical knowledge truth.

Worldwide racing terminology is not globally standardized. The master must represent:

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

## Active glossary sequence

### `GLOSSARY-MASTER-001` — specification and authority

Status: **complete**.

Completed output:

- `docs/glossary/world-racing-terminology-master-spec.md`;
- concept-first authority over future glossary expansion;
- multilingual/regional/slang/historical/evidence/search model defined;
- master-list-first / public-pages-later boundary recorded;
- existing public glossary explicitly excluded as a completeness target.

### `GLOSSARY-MASTER-002` — zero-based world concept seed

Status: **complete**.

Completed output:

- new inventory built from zero rather than from the existing 48-term runtime;
- **501 candidate Concepts** across **18 domain categories**;
- P0: **156**;
- P1: **212**;
- P2: **118**;
- P3: **15**;
- all rows started `verification_status=candidate` and `public_ready=no`;
- repository source rows stored under `data/glossary-master/concepts/`;
- current public glossary IDs/headwords/categories are not migration requirements;
- site-specific vocabulary such as `Official live` and account/access labels is separated from horse-racing domain terminology.

The 501 count is the original research seed, **not** a worldwide completeness claim.

### `GLOSSARY-MASTER-003` — jurisdiction and local-language terminology

Status: **first major-jurisdiction pass complete; follow-up waves allowed**.

The first pass researched terminology bottom-up across GB/Ireland, US/Canada, Australia/New Zealand, Japan including NAR/Banei, France, Hong Kong/Korea, UAE/South Africa, plus Arabian/Harness cross-system follow-up. The research master now contains **654 Concepts** while preserving local labels, definitions, sources, no-direct-equivalent cases, and review candidates.

Ongoing rule:

- preserve original-script terminology;
- map local labels to existing Concepts only when semantically supportable;
- create new Concepts when the local concept is genuinely absent;
- record `no_direct_equivalent` rather than inventing a translation;
- split homonyms and same-spelling/different-meaning cases explicitly;
- keep claim-level source/currentness evidence;
- add later jurisdiction waves when material gaps are discovered.

### `GLOSSARY-MASTER-004` — colloquial, slang, industry, abbreviation, and historical terminology

Status: **current pass complete; follow-up waves allowed**.

Current-pass output:

- **60** register usages with jurisdiction/register/currentness/evidence metadata;
- **26** source-verified abbreviations, chart/racecard codes and display codes;
- **4** source-verified historical/legacy rows;
- **33** unresolved register targets retained in an explicit review queue;
- evidence from official glossaries, racing authorities, national racing bodies and appropriate specialist racing sources;
- source-backed usage does not automatically create a new Concept;
- polysemous terms stay unresolved until their senses are explicitly modeled.

Current storage:

```text
data/glossary-master/register/register-usage-v1.tsv
data/glossary-master/register/register-review-queue-v1.tsv
data/glossary-master/abbreviations/abbreviations-v1.tsv
data/glossary-master/historical/historical-terms-v1.tsv
data/glossary-master/sources/register-layer-sources-v1.tsv
```

Later relationship work may send specific terms back for additional register evidence without making MASTER-004 the primary lane again.

### `GLOSSARY-MASTER-005` — relationship/equivalence and evidence refinement

Status: **current**.

Required work:

- review `exact_equivalent`, `close_equivalent`, `broader`, `narrower`, `related`, `contrast`, `regional_counterpart`, and `no_direct_equivalent` relations;
- add explicit ambiguity/homonym treatment where one spelling has multiple meanings;
- resolve common false-synonym risks such as Meeting/Fixture/Race day, Racecourse/Racetrack/Track, Going/Track condition, and regional race-class terminology;
- distinguish Concept identity from spelling variants and register labels;
- identify duplicate-Concept candidates that should later become one Concept plus multiple labels;
- verify definitions and jurisdiction claims against source evidence;
- keep unresolved conflicts visible in a review queue;
- prefer the weakest relation supported by evidence rather than an optimistic exact-equivalence claim.

Wave 1 storage:

```text
data/glossary-master/relations/relations-v1.tsv
data/glossary-master/relations/relation-review-queue-v1.tsv
data/glossary-master/sources/relationship-layer-sources-v1.tsv
```

Wave 1 starts with **15 reviewed relations** and **15 explicit review items**. Initial decisions include:

- `Raceday` / `Race day` and `Favourite` / `Favorite` as exact-equivalent spelling pairs pending Concept dedupe;
- `Bumper` / `National Hunt Flat Race` as exact-equivalent in scoped GB/IRE operational usage pending dedupe;
- `Group` / `Grade` levels as international `regional_counterpart`, not global synonyms;
- `Going` / `Track condition` as related but not exact-equivalent;
- `Racecourse` / `Racetrack` only close-equivalent in the facility sense;
- `Fixture` / `Race meeting` as related, not identical;
- France `Meeting` held for sense split because France Galop defines it as multiple `réunions` at one racecourse over a period.

### `GLOSSARY-MASTER-006` — search-intent, coverage, and readiness review

Status: **queued**.

Required work:

- map definition, comparison, regional, how/why, translation, abbreviation, and racecard-reading search intents to reviewed concepts;
- keep search metadata separate from canonical concept truth;
- identify useful comparison and regional-difference content rather than mechanically generating thin pages;
- produce coverage views by taxonomy, jurisdiction, language, evidence state, relationship state and review state;
- identify remaining knowledge gaps;
- decide whether the master is mature enough to enter public implementation planning.

## Explicitly deferred public implementation lane

Do not start this lane merely because individual terms have been reviewed.

```text
GLOSSARY-PUBLIC-001  public information architecture / URL contract
GLOSSARY-PUBLIC-002  concept-page and category-page content contract
GLOSSARY-PUBLIC-003  multilingual/local-label presentation rules
GLOSSARY-PUBLIC-004  comparison/regional content presentation
GLOSSARY-PUBLIC-005  structured data / metadata / machine-readable projection
GLOSSARY-PUBLIC-006  internal-link integration with countries, racecourses, racing types, and related pages
GLOSSARY-PUBLIC-007  EN/JA/responsive/accessibility/SEO/AI-discovery QA
GLOSSARY-PUBLIC-008  reviewed public rollout
```

These are not current implementation tasks. Their exact scope may change after the master-list review.

## Public-page readiness gate

A new glossary public-page expansion/redesign may begin only after a reviewed decision confirms that:

```text
concept model is stable enough
core domain coverage is credible
major jurisdiction and local-language differences can be represented
original-script and no-direct-equivalent cases work without invented translations
slang/historical handling is evidence-bound
source provenance is usable
important concept relationships and ambiguity cases are reviewed
search intents are mapped separately from knowledge truth
coverage/review gaps are visible
```

A raw term-count target is not sufficient. **There is no legacy-record migration gate.**

## Replacement rule for the existing public glossary

The current glossary is a disposable runtime/content baseline, not an input to the world master.

During master construction it may remain online. When `GLOSSARY-PUBLIC-*` is later authorized:

- current glossary content may be deleted wholesale;
- no one-to-one migration of old IDs/headwords/categories is required;
- reviewed new master data may become the source for regenerated public glossary content;
- reusable routing or UI code may be retained only when it satisfies the new public contract;
- old glossary review status is not evidence for new master claims.

## Publication boundary

Glossary knowledge may explain racecards, participants, odds, results, payouts, and betting concepts. It does not authorize republication of meeting-specific restricted datasets, predictions, tips, or raw source bodies.

Existing publication and governance contracts remain authoritative.

## Parallel-lane rule

This glossary lane may proceed independently of map-first UI and Calendar maintenance because its immediate outputs are reviewed knowledge/master artifacts rather than public runtime behavior.

Glossary master work must not block Calendar corrections, racecourse data quality, or the active UI lane. Conversely, completing unrelated UI/Calendar work does not imply glossary master completion.

## Current execution pointer

```text
Current glossary Work ID: GLOSSARY-MASTER-005
Current input: 654-Concept research master + 60 register usages + relation wave 1
Current focus: false-synonym / homonym / equivalence / dedupe / evidence refinement
Next: GLOSSARY-MASTER-006
Public implementation: deferred until post-MASTER-006 readiness review
```

Conversation history is not the execution authority. Future glossary-list work should read `docs/glossary/world-racing-terminology-master-spec.md`, `data/glossary-master/README.md`, and this addendum first.
