# World racing terminology master specification

Status: active glossary knowledge-model specification  
Adopted: 2026-09-09  
Work ID: `WHR-GLOSSARY-WORLD-TERMINOLOGY-MASTER`  
Scope: user-facing racing knowledge, multilingual terminology, regional usage, evidence, and search-discovery metadata  
Public-page implementation: deferred until the reviewed master is sufficiently mature

## 1. Purpose

The Where Horses Run glossary is a **user-facing horse-racing knowledge resource**. Its first responsibility is to help readers understand racing concepts, terminology, local usage, and differences between racing jurisdictions and disciplines.

Because WHR is a later entrant, the same knowledge base must also be structured so that Google/Bing and AI-search systems can discover, understand, connect, and cite the material accurately. Search optimization is therefore a structural requirement, but it does not replace user value and must not distort canonical knowledge.

The master is **not**:

- an English-to-Japanese translation list;
- a list of terms needed only to understand WHR UI;
- an automatic SEO page-generation queue;
- a migration exercise for the existing public glossary.

Worldwide racing terminology is not globally standardized. A concept may have different official names by jurisdiction, local-language names with no exact English/Japanese equivalent, abbreviations, industry names, slang, historic names, or the same spelling with different meanings.

The model must preserve those differences rather than flattening them into false global synonyms.

## 2. Authority and replacement rule

This document is the governing knowledge-model specification for future glossary research, data modeling, and later public implementation.

The zero-based candidate inventory under `data/glossary-master/concepts/` is the current master-list starting point.

The existing public glossary and older glossary-v2 documents are **legacy runtime/implementation evidence only**. They are not:

- the source population for the new master;
- a completeness target;
- a migration gate;
- a requirement to preserve IDs, headwords, categories, or EN/JA-only fields.

When a later `GLOSSARY-PUBLIC-*` implementation is authorized, current glossary content may be removed wholesale and public content regenerated from reviewed master data. Reusable routing/UI code may be retained only if it satisfies the new public contract.

## 3. Core principle: Concept first, labels second

The canonical identity is a language-independent `concept_id`.

```text
Concept
-> labels by language / script / locale / jurisdiction
-> reader definitions
-> regional usage
-> typed relationships
-> evidence
-> search intents
-> eventual public targets
```

A preferred English or Japanese working label is not proof that the term is globally official.

If two strings translate similarly but represent different concepts, keep separate Concepts.

If the same string has materially different meanings, keep separate Concepts and record the ambiguity/homonym relationship. For example, the English word `Break` may refer to leaving the starting gate in one context and breaking gait in harness racing in another.

## 4. Labels and local language

Each label must be capable of carrying:

```text
concept_id
label
language
script
locale
label_type
country_or_territory
jurisdiction
authority
discipline
usage_region
register
currentness
source/evidence
review_state
```

Supported label types include:

- `official`
- `preferred`
- `alternate`
- `abbreviation`
- `short_form`
- `regional`
- `colloquial`
- `slang`
- `historical`
- `deprecated`
- `transliteration`
- `descriptive_translation`
- `search_variant`
- `misspelling`

Original script must be preserved. Do not force local terminology into ASCII or English solely for maintenance convenience.

## 5. Translation and equivalence

Do not invent equivalence for convenience.

Supported semantic relationships include:

- `exact_equivalent`
- `close_equivalent`
- `broader`
- `narrower`
- `related`
- `contrast`
- `regional_counterpart`
- `no_direct_equivalent`
- `homonym_or_ambiguous_label`

When no established translation exists, retain as applicable:

1. original-script label;
2. transliteration/romanization;
3. literal translation if useful and supportable;
4. descriptive translation for reader comprehension;
5. an explicit marker that the descriptive translation is not an official equivalent.

Regionality is metadata, not a `regional terms` catch-all category.

## 6. Controlled domain taxonomy

The current zero-based seed uses 18 semantic categories:

1. `DISC` — Racing disciplines and systems / 競馬の種類・競技体系
2. `RTYPE` — Race types, class, and conditions / レースの種類・格・条件
3. `ENTRY` — Entry and participation process / 登録・出走手続
4. `HORSE` — Horse breeds, sex, and age / 馬の品種・性別・年齢
5. `BREED` — Pedigree and breeding / 血統・繁殖
6. `ROLE` — People and official roles / 騎手・調教師・関係者
7. `VENUE` — Racecourses and course structure / 競馬場・コース
8. `SURF` — Surfaces and track/going conditions / 走路・馬場状態
9. `DIST` — Distance and measurement / 距離・計測
10. `WEIGHT` — Weight and handicapping / 重量・ハンデ
11. `RUN` — Race progression and running styles / レース進行・脚質・競走中の表現
12. `EQUIP` — Tack and equipment / 馬具・装備
13. `TRAIN` — Training and pre/post-race activity / 調教・競走前後
14. `MEET` — Meetings, schedules, and official documents / 開催・日程・公式文書
15. `RESULT` — Results, inquiry, and adjudication / 結果・審議・裁定
16. `PRIZE` — Prize money and race value / 賞金・競走価値
17. `BET` — Betting and odds terminology / 馬券・オッズ
18. `WELF` — Veterinary, safety, and horse welfare / 獣医・安全・競走馬福祉

This taxonomy may be amended when bottom-up jurisdiction research proves that a semantic domain is missing. It must not be expanded simply to mirror old glossary categories.

WHR-specific interface/access vocabulary such as `Official live`, `Official replay`, `Account required`, `Subscription required`, `Geo-restricted`, `Live`, or `Upcoming` is **site UI vocabulary**, not a horse-racing knowledge category, unless a term separately represents a genuine racing concept.

## 7. Current zero-based seed

`GLOSSARY-MASTER-002` established the initial research seed:

- **501 candidate Concepts**;
- **18 domain categories**;
- P0: **156**;
- P1: **212**;
- P2: **118**;
- P3: **15**;
- every row starts `verification_status=candidate`;
- every row starts `public_ready=no`.

The 501 count is a starting research population, not a claim that the world terminology set is complete or correct.

New Concepts may be added, split, merged, renamed, or rejected as jurisdiction evidence improves the model.

## 8. Bottom-up jurisdiction research rule

Do not translate one master list country by country.

For every jurisdiction/language pass:

```text
actual local authoritative/specialist material
-> collect terminology actually used there
-> preserve original script
-> identify meaning and context
-> map to an existing Concept only when justified
-> create/split Concepts when the current model does not fit
-> record relationship/equivalence strength
-> attach evidence for the claim being made
```

This is mandatory to prevent an English/Japanese master from erasing local-only concepts.

## 9. Slang, colloquial, industry, and historical terminology

Established informal terminology is in scope because users encounter it in racing media, commentary, racecourses, historical publications, and community discussion.

Slang/colloquial records must, where known, capture:

- exact form and original script;
- Concept mapping;
- language/locale;
- jurisdiction/usage region;
- discipline/audience;
- register;
- currentness;
- evidence type;
- confidence;
- explanatory note.

A one-off social-media use is not sufficient evidence.

Appropriate evidence may include established racing media, industry publications, specialist dictionaries, commentary/transcripts, historical publications, and repeated durable community usage.

Historical terminology remains useful when it helps readers understand older programmes, archival racing material, racecourse history, or changes in racing language. Distinguish at least `current`, `declining`, `legacy`, `historical`, `deprecated`, and `obsolete` where evidence supports the distinction.

## 10. Evidence model

Evidence requirements depend on the claim.

### Formal/official claims

Prefer, where available:

1. governing/racing authority;
2. official rules of racing;
3. official glossary;
4. official racecard/programme/conditions book/results material;
5. official racecourse/organizer material;
6. other authoritative public racing material.

### General explanation

May additionally use established specialist racing media, specialist dictionaries, academic/research sources, and reputable historical sources.

### Informal/historical usage

May additionally use industry publications, commentary/transcripts, specialist media, historical publications, and durable community evidence.

Every evidence record must state what claim it supports: meaning, official status, spelling, regional use, currentness, slang use, historical use, or another specific claim.

## 11. Normalized master domains

The working master must support these logical domains even when not all are populated yet:

- `Concepts`
- `Labels`
- `Definitions`
- `Relations`
- `Regional_Usage`
- `Slang_Colloquial`
- `Historical_Terms`
- `Sources`
- `Search_Queries`
- `Page_Targets`
- `Coverage`
- `Review_Queue`

The repository concept seed is currently partitioned by category under `data/glossary-master/concepts/*.tsv` to keep review and Git diffs manageable. All category files share one schema and together form the current candidate Concept inventory.

## 12. Search and AI-discovery layer

Search metadata is separate from canonical knowledge truth.

Search records may capture:

```text
concept_id
query
language
country_or_locale
search_intent
query_type
priority
future_target
review_state
```

Useful query classes include:

- definition (`what is X`, `Xとは`);
- comparison (`X vs Y`, `XとYの違い`);
- regional usage and jurisdiction comparison;
- how/why questions;
- translation/local-language searches;
- abbreviations;
- racecard/official-document reading questions.

Do not keyword-stuff canonical definitions. Do not create thin pages mechanically for every generated query, spelling, or regional label.

Search metadata should improve discoverability, internal-link planning, answer completeness, machine comprehension, and citation suitability while leaving the user-facing knowledge accurate and readable.

## 13. Later public-content principles

When `GLOSSARY-PUBLIC-*` work is authorized, a reviewed concept page/section should be able to provide:

1. a concise direct definition;
2. a reader-friendly fuller explanation;
3. regional/jurisdiction differences where material;
4. original-language labels, aliases, abbreviations, slang, or historical forms with clear status labels;
5. commonly confused concepts and differences;
6. related concepts;
7. appropriate evidence/source attribution;
8. useful links into WHR country, racecourse, racing-system, Calendar, or other relevant knowledge pages where they genuinely help the reader.

A comparison or regional page should be created only when it has distinct user value and enough reviewed material.

## 14. Publication boundary

The knowledge base may explain racecards, entries, participants, odds, results, payouts, betting systems, and other racing concepts.

Glossary work does **not** authorize publication of otherwise restricted meeting-specific datasets, predictions, tips, raw source bodies, or data prohibited by the existing publication contracts.

Existing publication/governance policies remain authoritative.

## 15. Current work boundary

Current in-scope work:

```text
zero-based world Concept inventory
jurisdiction and local-language terminology research
original-script labels
relations/equivalence mapping
slang/colloquial/industry/historical collection
source/evidence registry
search-intent mapping
coverage and review queues
```

Deferred:

```text
new public glossary URL/IA design
public glossary UI redesign
mass generation of detail pages
new glossary structured-data rollout
large-scale public internal-link rollout driven by the master
```

## 16. Master-list readiness criteria

The master-list phase is not complete merely because a target term count has been reached.

A later readiness review must confirm that:

- the concept-first model is stable enough;
- major racing domains have credible coverage;
- major jurisdictions and racing systems have been researched bottom-up;
- local-language/original-script labels can be represented correctly;
- no-direct-equivalent cases work without invented translations;
- homonyms and common false-synonym risks are modeled explicitly;
- slang and historical terms have evidence/register/currentness handling;
- source provenance is attached at claim-appropriate granularity;
- search intents are linked without becoming canonical knowledge;
- coverage gaps and unresolved terminology remain visible.

There is **no legacy-record migration requirement** in this readiness gate.

## 17. Execution sequence

```text
GLOSSARY-MASTER-001  specification and authority                         COMPLETE
GLOSSARY-MASTER-002  zero-based world Concept seed (501 / 18 categories) COMPLETE
GLOSSARY-MASTER-003  jurisdiction + local-language research              CURRENT
GLOSSARY-MASTER-004  slang / colloquial / industry / historical evidence QUEUED
GLOSSARY-MASTER-005  relations / equivalence / evidence refinement       QUEUED
GLOSSARY-MASTER-006  search-intent / coverage / readiness review         QUEUED

GLOSSARY-PUBLIC-*    public implementation                               DEFERRED
```

Conversation history is not execution authority. Future glossary work must use this specification, `data/glossary-master/README.md`, and the active glossary roadmap addendum as the current repository authority.
