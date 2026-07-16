# Glossary schema extension

Status: complete

Work ID: `WHR-GLOSSARY-DICTIONARY-V1`

Implementation unit: `GLOSSARY-SCHEMA-EXTENSION-01`

Last reviewed: 2026-07-16

## Purpose

The glossary needs a stable reviewed contract before it expands into racing types, horse breeds, roles, timetable terms, official-source concepts, multilingual cleanup, related-term navigation, and beginner explanations.

This unit extends the existing seven-field bilingual baseline without removing or renaming the fields used by current pages.

## Discovery baseline

```text
records: 23
categories: 5
expected bilingual routes: 46
missing baseline fields: 0
duplicate IDs: 0
duplicate slugs: 0
records with any extension field: 0
schema files: 0
```

Baseline category counts were:

- data term: 4;
- race type: 7;
- role: 3;
- surface: 4;
- track term: 5.

## v2 entry contract

Every glossary record keeps the original fields and adds:

- `schema_version`;
- English and Japanese aliases;
- Japanese reading;
- English pronunciation note;
- English and Japanese beginner explanations;
- related-term IDs;
- source IDs;
- evidence status;
- public-boundary object;
- content status;
- last-reviewed date.

The schema permits future categories for breeds, official sources, and governance terms while preserving the existing categories.

## Safe migration defaults

The original 23 records were migrated without enrichment by guesswork.

- aliases remained empty until reviewed;
- reading and pronunciation remained null until reviewed;
- beginner explanations remained null until reviewed;
- related terms remained empty until the relation graph is reviewed;
- source IDs remained empty until evidence is attached;
- evidence status was `baseline_definition`;
- content status was `baseline_reviewed`;
- review date was 2026-07-16.

The migration preserved the original English and Japanese term names, categories, summaries, slugs, routes, and page descriptions.

## Expansion compatibility

The schema-extension checker now treats the 23 migrated records and 46 bilingual routes as a protected minimum baseline rather than a permanent maximum.

Later reviewed units may:

- add new v2 records;
- enrich existing records;
- update review dates;
- render reviewed aliases or other optional fields;
- increase category and route counts.

Later units may not remove any of the 23 baseline IDs, weaken the v2 required-field contract, break related-term or source references, or enable dataset republication.

## Public behavior

The baseline pages show the reviewed term, summary, category, counterpart-language term, content status, and review date. Optional aliases, reading, pronunciation, beginner explanations, related terms, and source sections appear only when reviewed values exist.

Restricted concepts may show a public-boundary notice, but the pages do not republish participant, racecard, odds, result, or payout datasets.

## Public boundary

Glossary pages may define and link to concepts that are restricted as datasets elsewhere on the site. For example, the dictionary may explain a racecard, jockey, trainer, odds, result, or payout concept without republishing racecards, participant lists, odds, results, or payouts.

Every record has a machine-readable `public_boundary` object. `republish_dataset` is always false. Restricted dataset keys are recorded explicitly when the term is closely associated with participant or racecard data.

The schema does not permit predictions, recommendations, raw source bodies, embedded video, or direct stream URLs as glossary datasets.

## Runtime compatibility

The glossary index and detail routes continue to read `data/static/glossary.json`. Optional presentation fields do not create empty public sections.

The permanent workflow builds the site and runs the schema-extension checker. The checker validates the two JSON schemas, the protected migration baseline, all current records and routes, ID and slug uniqueness, relationship/source references, restricted-concept boundaries, rendered metadata, the permanent workflow itself, temporary-workflow removal, and clean-worktree behavior.

## Automation boundary

The permanent gate performs no source fetch, automatic source acceptance, automatic content promotion, publication, or deployment.

## Completed next unit

`GLOSSARY-RACING-TYPE-EXPANSION-01` expands and reconciles racing-type terms against `data/static/glossary-racing-type-registry-v1.json` without conflating racing types, horse breeds, surfaces, course layouts, or governing bodies.

The next implementation unit is `GLOSSARY-HORSE-BREED-EXPANSION-01`.
