# World racing terminology master specification

Status: active glossary knowledge-model specification  
Adopted: 2026-09-09  
Work ID: `WHR-GLOSSARY-WORLD-TERMINOLOGY-MASTER`  
Scope: user-facing racing knowledge, multilingual terminology, regional usage, evidence, and search-discovery metadata  
Public-page implementation: deferred until the reviewed master is sufficiently mature

## 1. Purpose

The Where Horses Run glossary is a user-facing horse-racing knowledge resource. Its first responsibility is to help readers understand racing concepts, terminology, local usage, and differences between racing jurisdictions and disciplines.

The terminology master must also support search discovery and machine comprehension by keeping concepts, labels, regional usage, relationships, evidence, and search intents in explicit structured form.

The master is **not** an English-to-Japanese translation list and is **not** a site manual.

The model is designed for worldwide racing, where terminology is not globally standardized. A concept may have:

- different official names in different jurisdictions;
- a local-language name with no exact English or Japanese equivalent;
- multiple common or industry names;
- abbreviations or short forms;
- colloquial or slang forms;
- historical, deprecated, or obsolete forms;
- different meanings under the same spelling in different contexts.

The data model must preserve those differences rather than flatten them into false global synonyms.

## 2. Authority and relationship to the existing glossary

This document is the governing knowledge-model specification for future glossary expansion.

Existing files under `docs/glossary/` and the current `data/static/glossary.json` implementation remain valid historical/legacy implementation evidence where they do not conflict with this specification.

The existing v2 glossary schema and current public routes are a **legacy baseline**, not the canonical model for worldwide terminology coverage and not a completeness target.

Existing public glossary routes may remain available while the master is built. Their existence does not authorize immediate mass expansion of glossary pages.

Any future glossary schema, migration, generator, content expansion, or public-page redesign must map to this specification or explicitly amend it first.

## 3. Core principle: concept first, labels second

The canonical unit is a language-independent concept identified by a stable `concept_id`.

```text
concept
-> labels in one or more languages/locales
-> regional/jurisdiction usage
-> definitions
-> concept relationships
-> evidence
-> search intents
-> eventual page targets
```

Labels are not the canonical identity.

A preferred English label may be convenient for display or maintenance, but it must not become a hidden assumption that the English term is globally official or that every concept has an exact English equivalent.

If two strings translate similarly but represent different concepts, they remain separate concepts.

If the same string has materially different meanings in different racing contexts, it maps to separate concepts and is marked as ambiguous/homonymous usage.

## 4. Translation and equivalence rules

Do not invent equivalence for convenience.

Permitted equivalence/relationship states include:

- `exact_equivalent`;
- `close_equivalent`;
- `broader`;
- `narrower`;
- `related`;
- `contrast`;
- `regional_counterpart`;
- `no_direct_equivalent`.

When no established translation exists, preserve:

1. the original-script label;
2. transliteration or romanization when useful;
3. a literal translation only when supportable and useful;
4. a descriptive translation for reader comprehension when needed;
5. an explicit note that the descriptive translation is not an official equivalent.

Original script is never discarded merely to fit an English-first schema.

## 5. Label types

Every label or variant must declare what kind of label it is. Supported types are:

- `official` — used by a governing authority, official rules, or other authoritative racing source;
- `preferred` — preferred public headword for a specified language/locale;
- `alternate` — established alternative name;
- `abbreviation` — abbreviation or initialism;
- `short_form` — shortened form;
- `regional` — established form associated with a region or jurisdiction;
- `colloquial` — established informal or industry usage;
- `slang` — slang usage with bounded evidence and context;
- `historical` — historically used form;
- `deprecated` — superseded or discouraged form;
- `transliteration` — script-to-script transliteration/romanization;
- `descriptive_translation` — explanatory translation, not asserted as an official equivalent;
- `search_variant` — meaningful search/display variant that is not a preferred headword;
- `misspelling` — sufficiently common search misspelling retained for retrieval only, never presented as the correct term.

Label type is data. Public rendering must not present slang, descriptive translations, or deprecated forms as official terminology.

## 6. Regional and contextual dimensions

Regionality is an attribute, not a catch-all category.

A term may be scoped by:

- language;
- script;
- locale;
- country or territory;
- jurisdiction;
- racing authority;
- racing system;
- discipline;
- usage region;
- register/audience;
- period/currentness.

A jurisdiction-specific term remains in its semantic category. For example, a locally specific race type belongs under race types, with jurisdiction metadata; it does not move into a generic `regional terms` bucket.

## 7. Knowledge taxonomy

The initial controlled taxonomy is grouped for human navigation while retaining narrower internal categories.

### A. Racing systems and disciplines

1. Racing types and competition systems

Examples: flat racing, jump racing, hurdle racing, steeplechase, harness racing, trotting, pacing, Arabian racing, Quarter Horse racing, Banei racing/ばんえい競馬.

### B. Meetings and races

2. Meetings and scheduling  
Examples: race meeting, meeting, fixture, race day, racing calendar, card, programme.

3. Race types, class, and conditions  
Examples: maiden, handicap, conditions race, allowance, claiming, stakes, Listed, Group race, Grade race, open race, novice, nursery.

4. Entry and participation process  
Examples: entry, nomination, declaration, acceptance, scratch, withdrawal, non-runner, reserve, ballot.

### C. Horses

5. Horse breeds, sex, age, and racing attributes  
Examples: Thoroughbred, Arabian, Standardbred, Quarter Horse, colt, filly, mare, stallion, gelding, foal, yearling.

6. Pedigree and breeding  
Examples: sire, dam, damsire, pedigree, stud, broodmare, foaling.

### D. People and roles

7. Jockeys, trainers, officials, and other roles  
Examples: jockey, apprentice jockey, trainer, driver, owner, breeder, steward, starter, handicapper, clerk of the course.

### E. Racecourses and tracks

8. Racecourse and course structure  
Examples: racecourse, racetrack, track, course, inner course, outer course, straight course, chute, home straight, backstretch, turn, bend, rail, winning post, starting gate.

9. Surface and condition  
Surface examples: turf, dirt, sand, synthetic, all-weather, Tapeta, Polytrack.  
Condition examples: going, track condition, firm, good, soft, heavy, fast, muddy, sloppy.

Surface/material and current condition are separate concepts and must not be conflated.

### F. Race mechanics

10. Distance and measurement  
Examples: furlong, mile, metre, sprint, middle distance, staying, race distance.

11. Weight and handicapping  
Examples: weight, handicap, weight-for-age, allowance, penalty, claim, top weight, bottom weight.

12. Race progression and running style  
Examples: start, pace, lead, front-runner, pacesetter, closer, final turn, finish, photo finish, dead heat.

### G. Equipment and preparation

13. Tack and equipment  
Examples: blinkers, visor, hood, tongue tie, cheekpieces, saddle, bridle, sulky.

14. Training and pre/post-race activity  
Examples: training, workout, gallop, breeze, trial, barrier trial, warm-up, paddock.

### H. Results, decisions, and race validity

15. Results, inquiry, and adjudication  
Examples: winner, placing, dead heat, inquiry, objection, disqualification, official result, void race, false start.

### I. Betting and market terminology

16. Betting and odds terminology  
Examples: odds, tote, pari-mutuel, fixed odds, win, place, show, exacta, quinella, trifecta, dividend, payout.

These concepts may be defined as knowledge. This does not authorize publication of meeting-specific odds, results, payouts, tips, or full racecard datasets.

## 8. Slang, colloquial, and industry terminology

Established informal terminology is in scope because users encounter it in racing media, commentary, racecourse usage, historic material, and community discussion.

Slang must not be accepted solely because one social post used it.

A slang/colloquial record should capture, where known:

- concept mapping;
- exact form and original script;
- language/locale;
- jurisdiction/usage region;
- discipline or audience;
- register (`colloquial`, `industry`, `slang`, etc.);
- currentness (`current`, `declining`, `historical`, etc.);
- evidence type;
- confidence;
- explanatory note where the meaning is not obvious.

Evidence appropriate to slang may include established racing media, industry publications, commentary, specialist dictionaries, historical publications, or repeated long-running community usage. It need not be an official authority source, but the source type must be explicit.

## 9. Historical and deprecated terminology

Historical terminology is retained when it helps users understand older programmes, publications, racecourse history, archival material, or changes in racing language.

Currentness values should distinguish at least:

- `current`;
- `legacy`;
- `historical`;
- `deprecated`;
- `obsolete`.

Historical forms must not silently replace current preferred terminology.

## 10. Evidence model

Source requirements depend on the claim being made.

### Formal/official terminology

Prefer, in order where available:

1. governing authority;
2. official rules of racing;
3. official racecard/programme/timetable material;
4. official racecourse or organizer material;
5. other public authoritative racing material.

### General terminology and explanation

May additionally use:

- major specialist racing media;
- established specialist dictionaries;
- academic/research material;
- reputable historical sources.

### Slang and colloquial usage

May additionally use:

- established industry publications;
- specialist racing media;
- commentary/transcript evidence;
- historical publications;
- repeated, durable community usage.

Evidence records must state what they support: official status, meaning, regional usage, currentness, spelling, slang usage, or another specific claim.

## 11. Bottom-up jurisdiction research rule

Do not build a master in one language and translate it country by country.

For each jurisdiction/language research pass:

```text
local authoritative/specialist material
-> collect terms actually used there
-> identify meaning and context
-> map to an existing concept when justified
-> create a new concept when no existing concept fits
-> record equivalence/relationship rather than forcing a translation
```

This bottom-up rule is required to preserve local-only concepts and prevent an English/Japanese master from erasing regional racing knowledge.

## 12. Master data domains

The master should be representable as normalized tables/files with at least these logical domains:

### `Concepts`

Language-independent identities and semantic classification.

Minimum concerns:

- `concept_id`;
- top-level group and internal category;
- semantic scope;
- parent/child relationships;
- status;
- user importance;
- review state.

### `Labels`

All names and variants, including original script and label type.

Minimum concerns:

- `concept_id`;
- label text;
- language/script/locale;
- label type;
- jurisdiction/usage scope;
- currentness;
- source/evidence reference.

### `Definitions`

Reader-oriented definitions and explanations by language.

At minimum support:

- concise direct definition;
- fuller explanation;
- jurisdiction/context notes;
- confusion/difference notes;
- review state and evidence.

### `Relations`

Typed concept relationships, including exact/close equivalence, broader/narrower, related, contrast, regional counterpart, and no-direct-equivalent relationships.

### `Regional_Usage`

Jurisdiction, authority, discipline, audience/register, and period-specific usage.

### `Slang_Colloquial`

Informal forms with bounded usage evidence and confidence.

### `Historical_Terms`

Historical/deprecated/obsolete forms with period/currentness evidence.

### `Sources`

Evidence registry with source type, authority, jurisdiction/language, supported claim, URL/reference, review date, and evidence status.

### `Search_Queries`

Search-discovery metadata linked to concepts but kept separate from knowledge truth.

### `Page_Targets`

Future publication decisions. A query or label does not automatically justify a standalone page.

### `Coverage`

Coverage by taxonomy, jurisdiction, language, evidence state, and review state.

### `Review_Queue`

Unverified, ambiguous, conflicting, low-confidence, or unmapped terminology requiring human review.

## 13. Search and AI-discovery layer

Search metadata is a separate layer. It must not redefine concept truth or cause definitions to be written around keyword stuffing.

Search records may capture:

- `concept_id`;
- query text;
- language;
- country/locale when relevant;
- search intent;
- query type;
- priority;
- future target page/section.

Useful query classes include:

- definition (`what is X`, `Xとは`);
- comparison (`X vs Y`, `XとYの違い`);
- regional usage (`X in UK racing`, jurisdiction comparisons);
- how/why questions;
- translation/local-language searches;
- abbreviation and racecard-reading questions.

The public knowledge remains written for people first. Search metadata is used to improve discoverability, information architecture, internal linking, answer completeness, and machine comprehension.

## 14. Public-content principles for the later implementation phase

When public glossary expansion is implemented later, each reviewed concept page/section should be capable of providing:

1. a concise direct answer/definition;
2. a reader-friendly fuller explanation;
3. regional/jurisdiction differences where material;
4. aliases, abbreviations, local forms, or slang with clear labels;
5. differences from commonly confused concepts;
6. related concepts;
7. evidence/source attribution appropriate to the claim.

Do not create thin standalone pages mechanically for every query, spelling, translation, or regional label.

A comparison, regional page, or separate question page is justified only when it has distinct user value and enough reviewed material. Otherwise the content belongs inside the canonical concept page/section.

## 15. Public-data boundary

The knowledge base may explain concepts such as racecards, entries, odds, results, payouts, jockeys, trainers, and betting systems.

It must not use glossary expansion as a route to republish prohibited meeting-specific datasets.

The existing publication boundary remains in force. In particular, glossary work does not authorize publication of:

- full racecards;
- participant datasets merely because participant roles are glossary concepts;
- meeting-specific odds;
- meeting-specific results or payouts where prohibited by the governing publication contract;
- predictions or tips;
- raw external source bodies.

## 16. Current work boundary

The immediate glossary programme is **master-list and knowledge-model construction**.

Current in-scope work:

```text
specification and normalized schema design
legacy seed audit/migration mapping
worldwide concept inventory expansion
local-language and jurisdiction terminology collection
relations/equivalence mapping
slang/colloquial/historical collection
source/evidence registry
search-intent/query mapping
coverage and review queues
```

Deferred work:

```text
new public glossary route expansion
public glossary UI redesign
mass generation of detail pages
new public structured-data rollout for the glossary
large-scale public internal-link rollout driven by the new master
```

Existing public glossary routes may remain as the legacy baseline during this phase.

## 17. Completion criteria for the master-list phase

The master-list phase is not complete because an arbitrary target number of terms has been reached.

Completion requires:

- the concept-first model is implemented in the working master;
- legacy terms are mapped, split, retained, or rejected explicitly rather than silently copied;
- the controlled taxonomy is represented;
- labels preserve language, script, type, regional scope, and currentness;
- no-direct-equivalent cases can be represented without invented translations;
- relationships can distinguish exact from approximate equivalence;
- local terms can be collected bottom-up by jurisdiction;
- slang and historical terms have their own evidence/register/currentness handling;
- evidence provenance is attached at claim-appropriate granularity;
- search queries are linked without becoming canonical knowledge;
- coverage gaps and unresolved terminology remain visible in review/coverage records;
- a separate review explicitly decides when the master is mature enough for the public-page implementation phase.

## 18. Migration rule for existing seed material

Existing glossary records, spreadsheets, and term lists are migration inputs only.

They must not be treated as canonical truth merely because they predate this specification.

Migration decisions should be explicit:

- keep as the same concept;
- split into multiple concepts;
- merge into another concept;
- retain only as a label/variant;
- regionalize;
- mark historical/deprecated;
- defer pending evidence;
- reject.

No legacy count is a protected completeness target for the new world terminology master.
