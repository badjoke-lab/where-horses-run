# Glossary master working data

Status: active zero-based world racing terminology master  
Authority: `docs/glossary/world-racing-terminology-master-spec.md`  
Current work: `GLOSSARY-MASTER-005` — relationship / equivalence / homonym / evidence refinement

This directory is the non-public working area for the concept-first world racing terminology master.

It is **not** consumed by current public glossary routes and does not authorize automatic publication.

## Current canonical candidate inventory

The original zero-based seed is stored by semantic category under `concepts/` and is extended by jurisdiction/review supplement files.

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

The count fell from 654 to 653 in `GLOSSARY-MASTER-005` wave 2 because four duplicate Concept rows were actually merged while three meaning-bearing Concepts were added. A lower count here is a quality improvement, not lost coverage.

Merged Concept identities are recorded in:

```text
concepts/concept-dispositions-v1.tsv
```

Current merges:

- `MEET-002 Meeting` -> `MEET-001 Race meeting` for the English single-event sense;
- `MEET-005 Raceday` -> `MEET-004 Race day`;
- `BET-031 Favourite` -> `BET-030 Favorite`;
- `RTYPE-005 Bumper` -> `RTYPE-006 National Hunt Flat Race`.

The moved strings remain available through `labels/relationship-wave2-labels-v1.tsv`; retired Concept IDs are not silently reused.

New meaning-bearing Concepts from the same review wave are stored in `concepts/relationship-wave2-additions.tsv`:

- `MEET-042 Racing meeting series (France)` — France Galop `Meeting`, distinct from one-day `Réunion`;
- `RESULT-030 Race form notation` — including France `musique` as a regional implementation;
- `RUN-046 Tactical pacemaker for another runner` — covering North American `Rabbit` and France Galop tactical `leader`, while remaining narrower than a generic Pacesetter.

The manifest is the machine-readable count authority. Counts describe the current research master, not worldwide completeness.

## Register / abbreviation / historical layers

The current pass of `GLOSSARY-MASTER-004` separated how a term is used from what the underlying Concept is. Follow-up register waves remain allowed when later research finds material gaps.

```text
register/register-usage-v1.tsv
register/register-review-queue-v1.tsv
register/register-resolutions-v1.tsv
abbreviations/abbreviations-v1.tsv
historical/historical-terms-v1.tsv
sources/register-layer-sources-v1.tsv
```

Current effective usage-layer snapshot after MASTER-005 wave 2 resolutions:

- register usages: **60**;
- effective source-verified register mappings: **29**;
- effective candidate usages: **31**;
- register review targets: **33 total / 30 still open**;
- abbreviations/codes: **26**, all source-verified;
- historical terms: **4**, all source-verified.

`register-resolutions-v1.tsv` is authoritative when an older register row still points at a retired Concept ID or a now-resolved `NEW-REVIEW-*` target. This preserves research history without leaving the effective mapping ambiguous.

A slang, colloquial or abbreviated form does **not** automatically create a Concept. A historically retired term in one venue/jurisdiction must not be declared globally obsolete without evidence.

## Relationship / equivalence layer

`GLOSSARY-MASTER-005` makes Concept relationships explicit and prevents false global synonymy.

```text
relations/relations-v1.tsv
    current Concept-to-Concept relationships.

relations/relation-review-queue-v1.tsv
    discovered homonyms, sense splits, false-synonym risks, dedupe candidates and unresolved cross-system relations.

relations/relation-resolutions-v1.tsv
    reviewed decisions that close items from the relation review queue.

labels/relationship-wave2-labels-v1.tsv
    labels moved by Concept merge plus labels attached to newly resolved Concepts.

definitions/relationship-wave2-definitions-v1.tsv
    jurisdiction-specific definitions created by relation/sense review.

sources/relationship-layer-sources-v1.tsv
    evidence added specifically for relation and sense-boundary claims.
```

Current relationship snapshot:

- active Concept-to-Concept relations: **16**;
- relation review items discovered: **15**;
- resolved review items: **7**;
- open review items: **8**.

Resolved wave-2 cases include:

- France `Meeting` vs `Réunion` sense split;
- `Race day / Raceday` spelling dedupe;
- `Favorite / Favourite` spelling dedupe;
- `Bumper / National Hunt Flat Race` Concept dedupe;
- `Group / Grade` retained as separate regional-counterpart systems;
- North American `Rabbit` and France tactical `leader` resolved under a shared tactical-pacemaker Concept;
- France `musique` promoted under a new race-form-notation Concept.

Still-open high-risk cases include `Off time / Scheduled start time`, `Racecourse / Racetrack / Track`, `Going / Track condition`, Australasian `mudlark`, easy-travelling terminology, and cross-language betting-market support expressions.

Relations must be scope-aware. An equivalence in one jurisdiction or one sense does not authorize a global merge.

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

`canonical_en` and `preferred_ja` are working maintenance labels. They do not assert that English or Japanese is globally authoritative.

## Normalized domains

The working master separates Concepts from labels, definitions, relations, regional/register usage, abbreviations, historical terms, sources, future search queries, coverage and review queues.

Typed Concept relations include `exact_equivalent`, `close_equivalent`, `broader`, `narrower`, `related`, `contrast`, `regional_counterpart`, and `no_direct_equivalent`. Polysemy and unresolved equivalence remain explicit review items until resolved.

## Relationship to the existing public glossary

The current public glossary is **not an input, migration gate, or completeness target** for this master. Its record IDs, headwords, categories and EN/JA-only field model need not be preserved. During later `GLOSSARY-PUBLIC-*` work it may be removed wholesale and regenerated from reviewed master data.

## Site UI vocabulary is separate

WHR-specific interface/access labels such as `Official live`, `Official replay`, `Account required`, `Subscription required`, `Geo-restricted`, `Live`, and `Upcoming` are not the backbone of the horse-racing knowledge taxonomy.

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
