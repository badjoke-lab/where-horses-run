# Glossary multilingual field cleanup

Status: implemented for review

Work ID: `WHR-GLOSSARY-DICTIONARY-V1`

Implementation unit: `GLOSSARY-MULTILINGUAL-FIELD-CLEANUP-01`

Last reviewed: 2026-07-16

## Purpose

Normalize English and Japanese glossary fields without changing the released concept IDs, routes, classifications, or publication boundaries.

## Baseline

```text
glossary records: 48
bilingual routes: 96
records with Japanese reading: 29
records missing Japanese reading: 19
localized category labels: 0
```

## Japanese reading cleanup

Reviewed `reading_ja` values are added for the nineteen records that still inherited a null reading from the original baseline:

- ten racing-type records;
- Racecourse;
- four surface records;
- four course-direction or layout records.

After this unit every one of the 48 glossary records has a non-empty Japanese reading.

The readings are stored in a field-patch file rather than copied into another complete-entry overlay. A field patch may update only a reviewed field on an existing concept ID and cannot create a new glossary concept.

## Localized category labels

The nine machine-readable category IDs remain unchanged:

1. `race_type`;
2. `breed`;
3. `horse_type`;
4. `role`;
5. `data_term`;
6. `official_source`;
7. `track_term`;
8. `surface`;
9. `governance_term`.

English and Japanese pages now display reviewed labels such as Racing type / 競馬種別 and Official source / 公式ソース instead of exposing raw category IDs as user-facing text.

The raw category ID remains available through `data-glossary-category` for machine-readable use and validation.

## Field policy

- `term_en` and `term_ja` remain required and may not silently fall back to the other language;
- `reading_ja` is required for all released records after this cleanup;
- `pronunciation_en` remains optional until separately reviewed;
- aliases remain language-specific, trimmed, unique, and separate from the canonical term;
- English and Japanese beginner explanations must either both be present or both be absent;
- field patches may update an existing ID but may not add or remove concept IDs;
- category labels are localized for display while category IDs remain stable for data use.

## Runtime

The runtime applies complete-entry overlays first:

```text
baseline → role → timetable → official-source
```

It then applies the multilingual field patch:

```text
complete merged record → reviewed multilingual field patch
```

This separation prevents a reading-only correction from accidentally replacing summaries, relationships, evidence status, or public-boundary fields.

## Public boundary

This unit changes display fields only.

It does not:

- add or remove glossary concepts;
- change glossary URLs;
- change source or evidence acceptance;
- publish raw source bodies;
- republish participant, odds, result, or payout datasets;
- perform automatic translation;
- publish or deploy generated data.

## Runtime and validation

The permanent gate:

- builds all 96 bilingual glossary routes;
- preserves the v2, racing-type, horse-breed, role, timetable, and official-source release contracts;
- proves that the pre-patch merged glossary has exactly nineteen missing Japanese readings;
- proves that the field patch targets exactly those nineteen existing IDs;
- verifies that all 48 released records have Japanese readings after patching;
- validates nine English and nine Japanese category labels;
- rejects duplicate aliases, canonical-term alias collisions, unpaired beginner explanations, whitespace errors, and silent language fallbacks;
- verifies localized category labels and machine-readable category IDs in rendered pages;
- proves that no concept ID or bilingual route changed;
- proves the repository remains clean;
- performs no network request, automatic translation, publication, or deployment.

## Next unit

`GLOSSARY-RELATED-TERMS-GRAPH-01` will formalize the related-term graph without changing the multilingual field contract.
