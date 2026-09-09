# Glossary master working data

Status: active zero-based world racing terminology master  
Authority: `docs/glossary/world-racing-terminology-master-spec.md`  
Current work: `GLOSSARY-MASTER-003` — jurisdiction/local-language research

This directory is the non-public working area for the concept-first world racing terminology master.

It is **not** consumed by current public glossary routes and does not authorize automatic publication.

## Current canonical candidate inventory

The zero-based seed is stored by semantic category under `concepts/`.

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

Current seed totals:

- Concepts: **501**
- categories: **18**
- P0: **156**
- P1: **212**
- P2: **118**
- P3: **15**
- verification state: **all candidate**
- `public_ready=yes`: **0**

These counts describe the current research seed, not a completeness claim.

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

As jurisdiction research proceeds, add normalized files/tables for:

### Labels

Original-script official, preferred, alternate, abbreviated, regional, colloquial, slang, historical, transliterated, and descriptive-translation labels.

Minimum concerns:

```text
label_id
concept_id
label
language
script
locale
label_type
jurisdiction
discipline
register
currentness
source_id
evidence_status
review_state
```

### Definitions

Reader-oriented direct and expanded explanations by language and jurisdiction.

### Relations

Typed relationships such as `exact_equivalent`, `close_equivalent`, `broader`, `narrower`, `related`, `contrast`, `regional_counterpart`, `no_direct_equivalent`, and homonym/ambiguity relationships.

### Regional Usage

Jurisdiction, authority, discipline, audience/register, and period-specific usage.

### Slang / Colloquial

Informal forms with bounded usage evidence, register, currentness, and confidence. A one-off social-media use is not sufficient evidence.

### Historical Terms

Historical/deprecated/obsolete forms with period/currentness evidence.

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
- Do not flatten `Meeting`, `Fixture`, `Race day`, `Racecourse`, `Racetrack`, `Going`, `Track condition`, or similar near terms into global synonyms without evidence.
- Keep slang, colloquial, historical, and deprecated status explicit.
- Keep unresolved taxonomy/evidence questions visible.
- Do not set `public_ready=yes` until the relevant definition, labels, jurisdiction claims, and evidence have been reviewed.
- Never make this working directory a public-runtime input without a later reviewed `GLOSSARY-PUBLIC-*` decision.
