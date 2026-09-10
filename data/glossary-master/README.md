# Glossary master working data

Status: active zero-based world racing terminology master  
Authority: `docs/glossary/world-racing-terminology-master-spec.md`  
Current work: `GLOSSARY-MASTER-005` — P0-first source verification after evidence coverage audit

This directory is the non-public working area for the concept-first world racing terminology master. It is **not** consumed by current public glossary routes and does not authorize automatic publication.

## Current master

- Concepts: **658**
- categories: **18**
- P0: **204**
- P1: **301**
- P2: **135**
- P3: **18**
- `public_ready=yes`: **0**
- public runtime input: **false**

The original seed was 501 candidate Concepts. Jurisdiction research expanded it, MASTER-005 merged four duplicate identities, and relation review added genuinely missing meanings. Retired IDs remain recorded in `concepts/concept-dispositions-v1.tsv` and are never recycled.

## Register / abbreviation / historical layers

```text
register/register-usage-v1.tsv
register/register-review-queue-v1.tsv
register/register-resolutions-v1.tsv
abbreviations/abbreviations-v1.tsv
historical/historical-terms-v1.tsv
sources/register-layer-sources-v1.tsv
```

Current effective state:

- register usages: **60**
- effective source-verified mappings: **36**
- effective candidate usages: **24**
- register resolutions: **12**
- abbreviations/codes: **26**, all source-verified
- historical terms: **4**, all source-verified

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

Current relationship state:

- active relations: **20**
- review items discovered: **15**
- resolved: **15**
- open: **0**

Resolved boundaries include Meeting/Réunion, Race day/Raceday, Favorite/Favourite, Bumper/National Hunt Flat Race, Group/Grade regional counterparts, Off time vs scheduled start, Going vs Track condition, Racecourse/Racetrack/Track polysemy, tactical Rabbit/leader, France `musique`, Spell/Layoff, Mudlark wet-track aptitude, easy-travelling/under-pressure commentary terms, and betting-support concentration terminology.

## MASTER-005 evidence coverage audit

Canonical audit files:

```text
coverage/master-005-evidence-coverage-v1.tsv
coverage/master-005-completion-gate-v1.tsv
```

Observed coverage:

- all Concepts: **159 / 658 source-verified (24.2%)**; **499 candidate**
- P0 Concepts: **51 / 204 source-verified (25.0%)**; **153 candidate**
- active base-seed rows: **1 / 497 source-verified (0.2%)**; **496 candidate**
- supplemental jurisdiction/relationship rows: **158 / 161 source-verified (98.1%)**; **3 candidate**

The relationship layer is mature enough for the current pass, but whole-master evidence coverage is not. The supplemental research is strong; the evidence deficit is concentrated in the original generic seed.

Categories with **zero** source-verified Concept rows are currently:

- DISC — racing disciplines/systems
- BREED — pedigree/breeding
- DIST — distance/measurement
- WELF — veterinary/safety/welfare

Other especially weak categories include VENUE (2/44), RESULT (2/30), BET (4/43), HORSE (4/34), ROLE (4/31), ENTRY (4/31), MEET (5/40), TRAIN (3/26), and RUN (7/48).

## Current completion decision

`GLOSSARY-MASTER-005` is **not complete**.

Reason: the relation review queue is closed, but **153 P0 Concepts remain candidate**. Advancing to search/readiness work now would build search structure on weakly evidenced core definitions.

Next work is therefore:

```text
P0-first source verification of the base seed
-> update Concept verification status and claim evidence
-> repeat evidence coverage audit
-> rerun MASTER-005 completion gate
-> only then consider GLOSSARY-MASTER-006
```

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

## Write rules

- Never invent local-language equivalence to fill a blank.
- Never treat an English working label as the worldwide official term.
- Preserve original script.
- Do not flatten near terms into global synonyms without evidence.
- Keep slang, historical, abbreviation and deprecated status explicit.
- Use evidence appropriate to the claim; slang does not require a rulebook, formal regulatory terms do.
- Relationship assertions must record scope and use the weakest relation supported by evidence.
- Retired Concept IDs must resolve through `concept-dispositions-v1.tsv`.
- Do not set `public_ready=yes` until definitions, labels, jurisdiction claims, relationships and evidence have been reviewed.
- Never make this working directory a public-runtime input without a later reviewed `GLOSSARY-PUBLIC-*` decision.

The existing public glossary remains a disposable content/runtime baseline and is not a migration or completeness gate.
