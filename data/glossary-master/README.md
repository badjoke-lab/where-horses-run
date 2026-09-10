# Glossary master working data

Status: active zero-based world racing terminology master  
Authority: `docs/glossary/world-racing-terminology-master-spec.md`  
Current work: `GLOSSARY-MASTER-005` — relationship / equivalence / homonym / evidence refinement

This directory is the non-public working area for the concept-first world racing terminology master. It is **not** consumed by current public glossary routes and does not authorize automatic publication.

## Current canonical candidate inventory

Original seed: **501 Concepts / 18 categories**.

Current relationship-refined research master:

- Concepts: **653**
- categories: **18**
- P0: **204**
- P1: **296**
- P2: **135**
- P3: **18**
- verification state: **mixed candidate and source-verified**
- `public_ready=yes`: **0**

The count fell from 654 to 653 in MASTER-005 wave 2 because four duplicate Concept rows were merged while three real meanings were added. Merged identities are recorded in `concepts/concept-dispositions-v1.tsv`; retired IDs are not recycled.

Current merged identities:

- `MEET-002 Meeting` -> `MEET-001 Race meeting` for the English single-event sense;
- `MEET-005 Raceday` -> `MEET-004 Race day`;
- `BET-031 Favourite` -> `BET-030 Favorite`;
- `RTYPE-005 Bumper` -> `RTYPE-006 National Hunt Flat Race`.

New meaning-bearing Concepts from wave 2:

- `MEET-042 Racing meeting series (France)`;
- `RESULT-030 Race form notation`;
- `RUN-046 Tactical pacemaker for another runner`.

The manifest is the machine-readable count authority. Counts describe the current research master, not worldwide completeness.

## Register / abbreviation / historical layers

```text
register/register-usage-v1.tsv
register/register-review-queue-v1.tsv
register/register-resolutions-v1.tsv
abbreviations/abbreviations-v1.tsv
historical/historical-terms-v1.tsv
sources/register-layer-sources-v1.tsv
```

Current usage snapshot:

- register usages: **60**;
- effective source-verified register mappings: **29**;
- effective candidate usages: **31**;
- register review targets: **33 total / 30 still open**;
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
definitions/relationship-wave2-definitions-v1.tsv
definitions/relationship-wave3-definitions-v1.tsv
sources/relationship-layer-sources-v1.tsv
```

Current relationship snapshot after wave 3:

- active Concept-to-Concept relations: **17**;
- relation review items discovered: **15**;
- resolved review items: **11**;
- open review items: **4**.

Important resolved boundaries:

- France `Meeting` and one-day `Réunion` are separate senses;
- `Race day / Raceday`, `Favorite / Favourite`, and `Bumper / National Hunt Flat Race` duplicate identities were collapsed;
- `Group / Grade` remain separate `regional_counterpart` systems;
- `Rabbit` and France tactical `leader` map to a shared tactical-pacemaker Concept;
- France `musique` maps to Race form notation;
- `Off time` is the actual race-start timestamp, while `Scheduled start time` / BHA `Scheduled off time` is the planned reference;
- `Going` and `Track condition` remain separate related Concepts because regional official taxonomies differ;
- `Racetrack` and `Track` remain polysemous with sense-scoped relations rather than global synonym merges or premature splits.

Remaining relation-review sets:

- `Spell / Layoff`;
- Australia/New Zealand `Mudlark` wet-track aptitude;
- `Under double wraps` / `On the bit or bridle` / `Off the bit or bridle`;
- Japanese `一本かぶり` / Australian `backed off the map` betting-market support terminology.

Relations must be scope-aware. Equivalence in one jurisdiction or sense does not authorize a global merge.

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
