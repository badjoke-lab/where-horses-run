# Glossary racing-type expansion

Status: complete

Work ID: `WHR-GLOSSARY-DICTIONARY-V1`

Implementation unit: `GLOSSARY-RACING-TYPE-EXPANSION-01`

Last reviewed: 2026-07-16

## Purpose

Expand the reviewed glossary from its seven racing-type baseline records into a stable racing-type taxonomy without conflating racing types, horse breeds, horse types, racing surfaces, course layouts, or governing bodies.

## Baseline

```text
glossary records: 23
race-type records: 7
bilingual routes: 46
```

The baseline contained Thoroughbred racing, Harness racing, Trotting, Pacing, Arabian racing, Quarter Horse racing, and Banei racing.

## Implemented taxonomy

The public browse-primary set is:

1. Thoroughbred flat racing;
2. Jump racing;
3. Harness racing;
4. Trotting;
5. Pacing;
6. Arabian racing;
7. Quarter Horse racing;
8. Banei racing.

Two supporting glossary definitions are also included:

- Flat racing;
- Steeplechase.

This produces ten reviewed racing-type glossary records and 52 total bilingual glossary routes at completion of this unit.

## Added records

- `flat-racing`;
- `jump-racing`;
- `steeplechase`.

## Reconciled records

The seven baseline racing-type records were rewritten to express their classification boundaries clearly.

- Thoroughbred flat racing is a breed-qualified flat-racing category, not the Thoroughbred breed record.
- Harness racing is the parent racing code for Trotting and Pacing.
- Arabian racing and Quarter Horse racing are breed-qualified racing categories, not breed definitions.
- Banei racing remains a separate sled-racing category and is not classified as Jump racing merely because its course contains hill-shaped obstacles.

Legacy English and Japanese labels for Thoroughbred racing remain as aliases so the existing route and familiar wording are preserved.

## Classification boundaries

### Horse breed

Thoroughbred, Arabian horse, American Quarter Horse, and Standardbred are breed records. They remain separate from racing-type records with similar names.

### Horse type

Draft horse is a broad horse type covering multiple heavy working breeds. It must not be treated as a single breed or as the Banei racing type itself.

### Surface and course layout

Turf, Dirt, All-weather course, and Jump course remain surface or course-layout terms. Flat racing and Jump racing are racing codes, not surface labels.

### Governing body

A governing body is not a racing type. JRA, NAR, HKJC, ERA, and other authorities are organizations or official-source concepts.

## Public boundary

The glossary may explain and navigate between racing concepts. This unit does not add or republish racecards, entries, participant data, odds, results, payouts, predictions, raw source bodies, embedded video, or direct stream URLs.

## Runtime and validation

The existing glossary index and dynamic detail routes automatically rendered all 26 records in English and Japanese at this unit's release point.

The permanent gate:

- preserves the 52-route racing-type release baseline while allowing later glossary additions;
- preserves the original v2 schema-migration baseline;
- validates the ten-record racing-type registry;
- validates parent classifications;
- verifies old labels retained as aliases where required;
- rejects breed, horse-type, surface, governing-body, and Banei/Jump conflation;
- verifies rendered content and metadata;
- proves the repository remains clean;
- performs no network request, publication, or deployment.

## Completed next unit

`GLOSSARY-HORSE-BREED-EXPANSION-01` adds reviewed breed definitions and a separate Draft horse type without reclassifying breed-qualified racing types as breeds.
