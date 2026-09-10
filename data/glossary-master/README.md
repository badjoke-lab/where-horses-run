# Glossary master working data

Status: active zero-based world racing terminology master  
Authority: `docs/glossary/world-racing-terminology-master-spec.md`  
Current work: `GLOSSARY-MASTER-005` — source/evidence coverage audit and completion gate

This directory is the non-public working area for the concept-first world racing terminology master. It is **not** consumed by current public glossary routes and does not authorize automatic publication.

## Current canonical candidate inventory

Original seed: **501 Concepts / 18 categories**.

Current relationship-refined research master after MASTER-005 wave 4:

- Concepts: **658**
- categories: **18**
- P0: **204**
- P1: **301**
- P2: **135**
- P3: **18**
- verification state: **mixed candidate and source-verified**
- `public_ready=yes`: **0**

The master reached 653 Concepts after wave-2 identity cleanup, then wave 4 added five genuinely missing Concepts exposed by relation review: Wet-track aptitude, Travelling easily, Under pressure, Strong betting support, and Dominant betting concentration.

Merged identities remain recorded in `concepts/concept-dispositions-v1.tsv`; retired IDs are not recycled.

## Register / abbreviation / historical layers

```text
register/register-usage-v1.tsv
register/register-review-queue-v1.tsv
register/register-resolutions-v1.tsv
abbreviations/abbreviations-v1.tsv
historical/historical-terms-v1.tsv
sources/register-layer-sources-v1.tsv
```

Current effective usage snapshot:

- register usages: **60**;
- effective source-verified mappings: **36**;
- effective candidate usages: **24**;
- register review targets: **33 total / 24 effectively open**;
- register resolutions: **12**;
- abbreviations/codes: **26**, all source-verified;
- historical terms: **4**, all source-verified.

A slang, colloquial or abbreviated form does **not** automatically create a Concept. `register-resolutions-v1.tsv` is authoritative when an older row points at a retired Concept or a now-resolved `NEW-REVIEW-*` target.

## Relationship / equivalence layer

```text
relations/relations-v1.tsv
relations/relation-review-queue-v1.tsv
relations/relation-resolutions-v1.tsv
labels/relationship-wave2-labels-v1.tsv
labels/relationship-wave3-labels-v1.tsv
labels/relationship-wave4-labels-v1.tsv
definitions/relationship-wave2-definitions-v1.tsv
definitions/relationship-wave3-definitions-v1.tsv
definitions/relationship-wave4-definitions-v1.tsv
sources/relationship-layer-sources-v1.tsv
```

Current relationship snapshot after wave 4:

- active Concept-to-Concept relations: **20**;
- relation review items discovered: **15**;
- resolved review items: **15**;
- open relation review items: **0**.

Wave 4 closed the remaining four discovered relation sets:

- `Spell / Layoff`: Spell/Spelling is a narrower regional deliberate-break Concept under broader Layoff; no global 60-day threshold is asserted;
- `Mudlark`: AU/NZ labels now map to `HORSE-034 Wet-track aptitude`, explicitly separated from track-condition state;
- `Under double wraps` and `On the bit/bridle` map to `RUN-047 Travelling easily`; `Off the bit/bridle` maps to contrasting `RUN-048 Under pressure` within race-commentary scope;
- `backed off the map` maps to `BET-043 Strong betting support`, while JRA `一本かぶり` maps to narrower `BET-044 Dominant betting concentration` rather than being treated as a synonym.

All relation-review items discovered in waves 1–4 now have explicit resolutions. This does **not** make MASTER-005 complete by itself: the next gate is source/evidence coverage across the 658-Concept master.

## Concept file contract

Every Concept row uses:

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

`canonical_en` and `preferred_ja` are working maintenance labels, not declarations of worldwide language authority.

## Normalized domains

The working master separates Concepts from labels, definitions, relations, regional/register usage, abbreviations, historical terms, sources, future search queries, coverage and review queues.

Typed Concept relations include `exact_equivalent`, `close_equivalent`, `broader`, `narrower`, `related`, `contrast`, `regional_counterpart`, and `no_direct_equivalent`. Polysemy and unresolved equivalence remain explicit until reviewed.

## Current completion gate

`GLOSSARY-MASTER-005` remains current until an evidence-coverage audit answers at least:

- how many Concepts are still `candidate` versus source-verified;
- whether P0 Concepts have credible evidence coverage;
- which categories/jurisdictions still contain concentrated evidence gaps;
- whether relationship resolutions rely on sources appropriate to the claim;
- whether any critical unresolved Concept identity conflict remains.

Only after that audit may the roadmap advance to `GLOSSARY-MASTER-006`.

## Relationship to the existing public glossary

The current public glossary is **not an input, migration gate, or completeness target**. Its record IDs, headwords, categories and EN/JA-only field model need not be preserved. During later `GLOSSARY-PUBLIC-*` work it may be removed wholesale and regenerated from reviewed master data.

## Write rules

- Never invent local-language equivalence to fill a blank.
- Never treat an English working label as the worldwide official term.
- Preserve original script.
- Do not flatten near terms into global synonyms without evidence.
- Keep slang, historical, abbreviation and deprecated status explicit.
- Keep unresolved taxonomy/evidence questions visible.
- Relationship assertions must record scope and use the weakest relation supported by evidence.
- Retired Concept IDs must resolve through `concept-dispositions-v1.tsv`; do not silently recycle them.
- Do not set `public_ready=yes` until definitions, labels, jurisdiction claims, relationships and evidence have been reviewed.
- Never make this working directory a public-runtime input without a later reviewed `GLOSSARY-PUBLIC-*` decision.
