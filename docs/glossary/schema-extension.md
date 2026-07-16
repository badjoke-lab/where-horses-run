# Glossary schema extension

Status: implemented for review

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

Current category counts are:

- data term: 4;
- race type: 7;
- role: 3;
- surface: 4;
- track term: 5.

## v2 entry contract

Every glossary record now keeps the original fields and adds:

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

Existing records are not enriched by guesswork.

- aliases remain empty until reviewed;
- reading and pronunciation remain null until reviewed;
- beginner explanations remain null until reviewed;
- related terms remain empty until the relation graph is reviewed;
- source IDs remain empty until evidence is attached;
- evidence status is `baseline_definition`;
- content status is `baseline_reviewed`;
- review date is 2026-07-16.

The existing English and Japanese term names, categories, summaries, slugs, routes, and page descriptions remain unchanged.

## Public behavior

All 23 records now render the v2 contract on the existing 46 bilingual routes.

The baseline pages show the reviewed term, summary, category, counterpart language term, content status, and review date. Optional aliases, reading, pronunciation, beginner explanations, related terms, and source sections remain hidden until reviewed values exist.

Restricted concepts may show a public-boundary notice, but the pages do not republish participant, racecard, odds, result, or payout datasets.

## Public boundary

Glossary pages may define and link to concepts that are restricted as datasets elsewhere on the site. For example, the dictionary may explain a racecard, jockey, trainer, odds, result, or payout concept without republishing racecards, participant lists, odds, results, or payouts.

Every record has a machine-readable `public_boundary` object. `republish_dataset` is always false. Restricted dataset keys are recorded explicitly when the term is closely associated with participant or racecard data.

The schema does not permit predictions, recommendations, raw source bodies, embedded video, or direct stream URLs as glossary datasets.

## Runtime compatibility

The glossary index and detail routes continue to read `data/static/glossary.json`. The additional fields are optional in presentation and do not create empty public sections.

The permanent workflow builds the site and runs the schema-extension checker. The checker validates the two JSON schemas, every migrated record, ID and slug uniqueness, relationship/source references, restricted-concept boundaries, all 46 bilingual routes, rendered metadata, the permanent workflow itself, temporary-workflow removal, and clean-worktree behavior.

## Automation boundary

The permanent gate performs no source fetch, automatic source acceptance, automatic content promotion, publication, or deployment.

## Next unit

`GLOSSARY-RACING-TYPE-EXPANSION-01` will expand and reconcile racing-type terms against the canonical type registry without conflating racing types, horse breeds, surfaces, or governing bodies.
