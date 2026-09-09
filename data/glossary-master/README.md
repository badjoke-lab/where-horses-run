# Glossary master working data

Status: active working-master structure  
Authority: `docs/glossary/world-racing-terminology-master-spec.md`  
Current work: `GLOSSARY-MASTER-003` after completion of the legacy migration audit

This directory is the non-public working area for the concept-first world racing terminology master.

It is **not** consumed by current public glossary routes and does not authorize automatic publication.

## Working domains

The master uses normalized logical domains. The current file contract is:

### Concepts

Proposed file: `concepts-v1.tsv`

```text
concept_id
top_level_group
category_id
semantic_scope
parent_concept_id
concept_status
user_importance
review_state
```

### Labels

Proposed file: `labels-v1.tsv`

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

Proposed file: `definitions-v1.tsv`

```text
definition_id
concept_id
language
definition_type
text
jurisdiction
context_note
confusion_note
source_id
evidence_status
review_state
```

### Relations

Proposed file: `relations-v1.tsv`

```text
relation_id
from_concept_id
relation_type
to_concept_id
jurisdiction
note
source_id
evidence_status
review_state
```

### Regional Usage

Proposed file: `regional-usage-v1.tsv`

```text
usage_id
concept_id
label_id
country
jurisdiction
authority
discipline
audience
register
period_start
period_end
currentness
source_id
evidence_status
review_state
```

### Slang / Colloquial

Proposed file: `slang-colloquial-v1.tsv`

```text
slang_id
concept_id
label
language
script
locale
jurisdiction
discipline
register
currentness
confidence
source_id
evidence_status
review_state
```

### Historical Terms

Proposed file: `historical-terms-v1.tsv`

```text
historical_id
concept_id
label
language
script
jurisdiction
period_start
period_end
currentness
replacement_label_id
source_id
evidence_status
review_state
```

### Sources

Proposed file: `sources-v1.tsv`

```text
source_id
source_type
title
publisher_or_authority
country
jurisdiction
language
url_or_reference
supported_claim
observed_or_reviewed_date
evidence_status
notes
```

### Search Queries

Proposed file: `search-queries-v1.tsv`

```text
query_id
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

Search metadata never changes canonical concept truth.

### Page Targets

Proposed file: `page-targets-v1.tsv`

```text
target_id
concept_id
target_type
locale
decision
reason
readiness_state
```

A Concept or query does not automatically justify a public route.

### Coverage

Proposed file: `coverage-v1.tsv`

```text
coverage_id
dimension
scope
concept_count
label_count
source_verified_count
reviewed_count
gap_count
notes
```

### Review Queue

Proposed file: `review-queue-v1.tsv`

```text
review_id
entity_type
entity_key
issue_type
question
priority
blocking_unit
status
resolution_note
```

## Current populated migration input

`legacy-migration-v1.tsv` contains the complete structural audit of the 48 legacy public-v1 concepts.

Its rows are migration inputs only. `proposed_concept_key` is provisional and must not be treated as a final stable `concept_id` until accepted in MASTER-003.

The table deliberately carries unresolved states such as:

- `SPLIT_REQUIRED`;
- `TAXONOMY_GAP_REVIEW`;
- `DEFER_FROM_WORLD_GLOSSARY`;
- `master_source_review_required`.

This prevents legacy public-page structure from silently becoming the new knowledge truth.

## Write rules

- Never invent local-language equivalence to fill a blank.
- Never promote a search variant into a preferred label because it is convenient.
- Never use a legacy related-term edge as proof of synonymy.
- Never hide unresolved taxonomy or evidence questions.
- Never make this working directory a public-runtime input without a later reviewed `GLOSSARY-PUBLIC-*` decision.
