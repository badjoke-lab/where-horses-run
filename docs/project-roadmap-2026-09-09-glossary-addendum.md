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
Current research master: 653 Concepts / 18 domain categories
Current register layer: 60 usages / 26 abbreviations / 4 historical rows
Current relationship layer: 17 relations / 15 review items / 11 resolved / 4 open
Public glossary page expansion: deferred
Automatic glossary publication: disabled
Existing public glossary content: disposable legacy runtime baseline
```

The current task is to finish Concept relationships, homonyms, false synonyms and evidence boundaries before adding the search-intent/readiness layer. Jurisdiction and register research may still receive follow-up waves when relationship work exposes real gaps.

## Programme objective

The glossary is first a useful user-facing horse-racing knowledge resource. Because WHR is a later entrant, its knowledge structure must also support strong Google/Bing and AI-search discovery through explicit concepts, local terminology, relationships, evidence, regional differences, and search intents.

Search metadata must remain separate from canonical knowledge truth.

Worldwide racing terminology is not globally standardized. The master must represent language-independent concepts, original-script/local labels, jurisdiction-specific official usage, terms with no direct translation, aliases/abbreviations, colloquial and historical usage, typed relationships, source provenance, and search intent as a separate layer.

## Active glossary sequence

### `GLOSSARY-MASTER-001` — specification and authority

Status: **complete**.

Canonical output is `docs/glossary/world-racing-terminology-master-spec.md`. It establishes concept-first authority, multilingual/regional/slang/historical/evidence/search structure, master-first/pages-later sequencing, and excludes the existing public glossary from completeness requirements.

### `GLOSSARY-MASTER-002` — zero-based world concept seed

Status: **complete**.

The zero-based seed contained **501 candidate Concepts / 18 categories** with P0 156, P1 212, P2 118 and P3 15. All began `public_ready=no`; current public glossary IDs/headwords/categories were not migration requirements.

### `GLOSSARY-MASTER-003` — jurisdiction and local-language terminology

Status: **first major-jurisdiction pass complete; follow-up waves allowed**.

The first pass researched GB/Ireland, US/Canada, Australia/New Zealand, Japan including NAR/Banei, France, Hong Kong/Korea, UAE/South Africa, plus Arabian/Harness cross-system follow-up. That work expanded the seed to 654 Concepts before relationship cleanup.

Ongoing rule: preserve original script, map only justified equivalents, create Concepts for genuinely missing meanings, use `no_direct_equivalent` when needed, split homonyms, retain dated source evidence, and allow later jurisdiction waves where material gaps are found.

### `GLOSSARY-MASTER-004` — colloquial, slang, industry, abbreviation, and historical terminology

Status: **current pass complete; follow-up waves allowed**.

Current-pass output:

- **60** register usages;
- **26** source-verified abbreviations/codes;
- **4** source-verified historical/legacy rows;
- **33** discovered register review targets;
- explicit register-resolution overlays for mappings later resolved by MASTER-005.

A slang or abbreviation does not create a Concept automatically. Polysemous terms remain reviewable until their senses are modeled.

### `GLOSSARY-MASTER-005` — relationship/equivalence and evidence refinement

Status: **current**.

Required work:

- review `exact_equivalent`, `close_equivalent`, `broader`, `narrower`, `related`, `contrast`, `regional_counterpart`, and `no_direct_equivalent` relations;
- add explicit ambiguity/homonym handling;
- resolve Meeting/Fixture/Race day, Racecourse/Racetrack/Track, Going/Track condition, regional race-class terminology and similar false-synonym risks;
- distinguish Concept identity from spelling/register labels;
- actually merge duplicate Concepts when one identity is justified;
- create new Concepts when a real missing meaning is exposed;
- verify definitions/jurisdiction claims and retain unresolved conflicts visibly;
- prefer the weakest relation supported by evidence.

Current storage:

```text
data/glossary-master/relations/relations-v1.tsv
data/glossary-master/relations/relation-review-queue-v1.tsv
data/glossary-master/relations/relation-resolutions-v1.tsv
data/glossary-master/concepts/concept-dispositions-v1.tsv
data/glossary-master/concepts/relationship-wave2-additions.tsv
data/glossary-master/labels/relationship-wave2-labels-v1.tsv
data/glossary-master/labels/relationship-wave3-labels-v1.tsv
data/glossary-master/definitions/relationship-wave2-definitions-v1.tsv
data/glossary-master/definitions/relationship-wave3-definitions-v1.tsv
data/glossary-master/sources/relationship-layer-sources-v1.tsv
```

Wave 2 merged four duplicate Concept rows:

- `MEET-002 Meeting` -> `MEET-001 Race meeting` for the English single-event sense;
- `MEET-005 Raceday` -> `MEET-004 Race day`;
- `BET-031 Favourite` -> `BET-030 Favorite`;
- `RTYPE-005 Bumper` -> `RTYPE-006 National Hunt Flat Race`.

Wave 2 also added three distinct Concepts:

- `MEET-042 Racing meeting series (France)`;
- `RESULT-030 Race form notation`;
- `RUN-046 Tactical pacemaker for another runner`.

That changed the active research master from **654 to 653 Concepts**: four duplicate identities removed, three real meanings added.

Wave 3 resolves four additional high-priority review items:

- `MEET-028 Off time` is the **actual race-start timestamp**; `MEET-029 Scheduled start time` is the pre-announced reference. BHA `Scheduled off time` is a regional label on MEET-029. The two Concepts remain related, not synonymous;
- `Going` and `Track condition` remain separate related Concepts because official GB/IRE, North American, Japanese and Australian condition taxonomies differ structurally;
- `Racetrack` remains polysemous: facility-level use may be close to Racecourse, while racing-rule usage may denote the actual racing surface;
- `Track` remains polysemous across venue/listing, physical track/surface and course/path senses. Current relations are sense-scoped; no global merge or premature Concept split is made.

Current relationship state:

- active relations: **17**;
- review items discovered: **15**;
- resolved: **11**;
- open: **4**.

Remaining open review sets:

1. `Spell / Layoff`;
2. Australia/New Zealand `Mudlark` wet-track aptitude;
3. `Under double wraps` / `On the bit or bridle` / `Off the bit or bridle`;
4. Japanese `一本かぶり` / Australian `backed off the map` betting-market support terminology.

The next MASTER-005 wave should resolve these four sets, then perform a source/evidence coverage pass before deciding whether MASTER-005 is complete enough to advance to MASTER-006.

### `GLOSSARY-MASTER-006` — search-intent, coverage, and readiness review

Status: **queued**.

Required work:

- map definition, comparison, regional, how/why, translation, abbreviation, and racecard-reading search intents to reviewed Concepts;
- keep search metadata separate from canonical truth;
- identify useful comparison/regional-difference content instead of thin query pages;
- produce coverage views by taxonomy, jurisdiction, language, evidence, relationship and review state;
- identify remaining knowledge gaps;
- decide whether the master is mature enough for public implementation planning.

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

## Public-page readiness gate

Public glossary expansion/redesign begins only after a reviewed decision confirms the concept model, core coverage, jurisdiction/language representation, no-direct-equivalent handling, slang/historical evidence, provenance, relationships, search-intent separation and coverage/review visibility are mature enough. A raw term-count target is not sufficient. **There is no legacy-record migration gate.**

## Replacement rule for the existing public glossary

The current glossary is a disposable runtime/content baseline, not an input to the world master. During later `GLOSSARY-PUBLIC-*` work its content may be deleted wholesale and regenerated from reviewed master data; reusable routing/UI code may be retained only if it satisfies the new public contract.

## Publication boundary

Glossary knowledge may explain racecards, participants, odds, results, payouts, and betting concepts. It does not authorize republication of meeting-specific restricted datasets, predictions, tips, or raw source bodies. Existing publication/governance contracts remain authoritative.

## Parallel-lane rule

This glossary lane remains independent of map-first UI and Calendar maintenance. Glossary master work must not block Calendar corrections, racecourse data quality, or the active UI lane, and unrelated UI/Calendar completion does not imply glossary completion.

## Current execution pointer

```text
Current glossary Work ID: GLOSSARY-MASTER-005
Current input: 653-Concept research master + 60 register usages + relation/resolution layers
Current relationship state: 17 relations / 15 reviews / 11 resolved / 4 open
Next immediate wave: resolve the four remaining review sets, then evidence coverage
Next programme stage: GLOSSARY-MASTER-006
Public implementation: deferred until post-MASTER-006 readiness review
```

Conversation history is not execution authority. Future glossary-list work should read `docs/glossary/world-racing-terminology-master-spec.md`, `data/glossary-master/README.md`, and this addendum first.
