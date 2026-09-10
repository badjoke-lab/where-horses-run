# Glossary master working data

Status: active zero-based world racing terminology master  
Authority: `docs/glossary/world-racing-terminology-master-spec.md`  
Current work: `GLOSSARY-MASTER-005` — relationship / equivalence / homonym / evidence refinement

This directory is the non-public working area for the concept-first world racing terminology master.

It is **not** consumed by current public glossary routes and does not authorize automatic publication.

## Current canonical candidate inventory

The original zero-based seed is stored by semantic category under `concepts/` and is extended by jurisdiction research supplement files.

```text
concepts/01-disc.tsv    Racing disciplines and systems
concepts/02-rtype.tsv   Race types, class, and conditions
concepts/03-entry.tsv   Entry and participation process
concepts/04-horse.tsv   Horse breed, sex, and age
concepts/05-breed.tsv   Pedigree and breeding
concepts/06-role.tsv    People and official roles
concepts/07-venue.tsv   Racecourses and course structure
concepts/08-surf.tsv    Surfaces and track/going conditions
concepts/09-dist.tsv    Distance and measurement
concepts/10-weight.tsv  Weight and handicapping
concepts/11-run.tsv     Race progression and running styles
concepts/12-equip.tsv   Tack and equipment
concepts/13-train.tsv   Training and pre/post-race activity
concepts/14-meet.tsv    Meetings, schedules, and official documents
concepts/15-result.tsv  Results, inquiry, and adjudication
concepts/16-prize.tsv   Prize money and race value
concepts/17-bet.tsv     Betting and odds terminology
concepts/18-welf.tsv    Veterinary, safety, and horse welfare
```

Original zero-based seed totals:

- Concepts: **501**
- categories: **18**
- P0: **156**
- P1: **212**
- P2: **118**
- P3: **15**
- verification state at seed creation: **all candidate**

Current research-master totals after jurisdiction waves through Arabian/Harness wave 1:

- Concepts: **654**
- categories: **18**
- P0: **205**
- P1: **296**
- P2: **135**
- P3: **18**
- verification state: **mixed candidate and source-verified**
- `public_ready=yes`: **0**

The manifest is the machine-readable count authority. These counts describe the current research master, not a worldwide completeness claim.

## Register / abbreviation / historical layers

The current pass of `GLOSSARY-MASTER-004` separated how a term is used from what the underlying Concept is. Follow-up register waves remain allowed when later research finds material gaps.

```text
register/register-usage-v1.tsv
    colloquial, industry, betting-language and other register-specific usage;
    may point at an existing Concept or an explicit NEW-REVIEW candidate.

register/register-review-queue-v1.tsv
    unresolved register usages whose meaning is evidenced but Concept placement is not yet settled.

abbreviations/abbreviations-v1.tsv
    official abbreviations, race-type codes, chart codes, racecard equipment codes and display codes.

historical/historical-terms-v1.tsv
    historical, predecessor, deprecated or venue-specific retired terminology with bounded periods.

sources/register-layer-sources-v1.tsv
    evidence used specifically for these usage layers.
```

Current usage-layer snapshot:

- register usages: **60**;
- source-verified direct register mappings: **26**;
- register candidate usages: **34**;
- register review targets: **33**;
- abbreviations/codes: **26**, all source-verified;
- historical terms: **4**, all source-verified.

A slang, colloquial or abbreviated form does **not** automatically create a Concept. A historically retired term in one venue/jurisdiction must not be declared globally obsolete without evidence.

## Relationship / equivalence layer

`GLOSSARY-MASTER-005` makes Concept relationships explicit and prevents false global synonymy.

```text
relations/relations-v1.tsv
    reviewed Concept-to-Concept relationships using exact_equivalent, close_equivalent,
    broader, narrower, related, contrast, regional_counterpart and no_direct_equivalent.

relations/relation-review-queue-v1.tsv
    unresolved homonyms, sense splits, false-synonym risks, candidate deduplication,
    and cross-language/cross-jurisdiction relation decisions.

sources/relationship-layer-sources-v1.tsv
    evidence added specifically for relation and sense-boundary claims.
```

Initial wave 1 contains **15 relations** and **15 relation-review items**. Important current review cases include:

- `Meeting / Race meeting / Fixture / Race day`;
- `Racecourse / Racetrack / Track / Course`;
- `Going / Track condition`;
- `Group / Grade` and their numbered levels;
- `Off time / Scheduled start time`;
- `Bumper / National Hunt Flat Race`;
- France `Meeting / Réunion` sense boundaries;
- France tactical `leader` vs North American `Rabbit`;
- France `musique` vs other form-notation systems.

Relations must be scope-aware. An `exact_equivalent` relationship in one jurisdiction or sense does not authorize a global merge. Relationship files are Concept-to-Concept only; register labels continue to map through the register/label layers.

## Concept file contract

Every category TSV uses the same fields:

```text
concept_id
category_id
category_ja
canonical_en
preferred_ja
working_definition_ja
concept_kind
priority
jurisdiction_scope
discipline_scope
translation_status
verification_status
source_required
public_ready
notes
```

`canonical_en` and `preferred_ja` are working labels for maintenance and review. They do not assert that English or Japanese is globally authoritative, nor that a direct translation exists in every jurisdiction.

## Additional normalized domains

### Labels

Original-script official, preferred, alternate, abbreviated, regional, colloquial, slang, historical, transliterated, and descriptive-translation labels.

### Definitions

Reader-oriented direct and expanded explanations by language and jurisdiction.

### Relations

Typed relationships such as `exact_equivalent`, `close_equivalent`, `broader`, `narrower`, `related`, `contrast`, `regional_counterpart`, `no_direct_equivalent`, and explicit homonym/ambiguity review.

### Regional Usage

Jurisdiction, authority, discipline, audience/register, and period-specific usage.

### Slang / Colloquial / Industry

Informal forms with bounded usage evidence, register, currentness, evidence class, confidence and review state. A one-off social-media use is not sufficient evidence.

### Historical Terms

Historical/deprecated/obsolete/legacy forms with period/currentness evidence and appropriately narrow jurisdiction/venue scope.

### Sources

Claim-specific evidence registry covering official rules/glossaries/racecards/programmes and appropriate specialist evidence for informal or historical usage.

### Search Queries

Definition, comparison, regional, how/why, translation, abbreviation, and racecard-reading search intents. Search metadata never changes canonical concept truth.

### Coverage / Review Queue

Coverage by taxonomy, jurisdiction, language, evidence state, and unresolved terminology.

## Relationship to the existing public glossary

The current public glossary is **not an input, migration gate, or completeness target** for this master.

There is no requirement to preserve:

- existing glossary record IDs;
- existing headwords;
- existing categories;
- a one-to-one mapping from old records;
- the existing bilingual field model.

When the later `GLOSSARY-PUBLIC-*` implementation is authorized, the current glossary content may be removed wholesale and regenerated from reviewed master data. Reusable routing/UI code may be retained only if it fits the new public contract.

## Site UI vocabulary is separate

WHR-specific interface/access labels such as `Official live`, `Official replay`, `Account required`, `Subscription required`, `Geo-restricted`, `Live`, and `Upcoming` are not horse-racing knowledge categories. Keep them in site UI/product vocabulary unless a term independently has a genuine horse-racing concept meaning.

## Write rules

- Never invent local-language equivalence to fill a blank.
- Never treat an English working label as the worldwide official term.
- Preserve original script when collecting local terminology.
- Never promote a search variant into a preferred label because it is convenient.
- Do not flatten `Meeting`, `Fixture`, `Race day`, `Racecourse`, `Racetrack`, `Going`, `Track condition`, `Group`, `Grade`, or similar near terms into global synonyms without evidence.
- Keep slang, colloquial, historical, abbreviation and deprecated status explicit.
- Keep unresolved taxonomy/evidence questions visible.
- Relationship assertions must record scope and should use the weakest relation type supported by evidence rather than an optimistic synonym claim.
- Do not set `public_ready=yes` until the relevant definition, labels, jurisdiction claims, relationships, and evidence have been reviewed.
- Never make this working directory a public-runtime input without a later reviewed `GLOSSARY-PUBLIC-*` decision.
