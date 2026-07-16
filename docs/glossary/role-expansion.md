# Glossary role expansion

Status: implemented for review

Work ID: `WHR-GLOSSARY-DICTIONARY-V1`

Implementation unit: `GLOSSARY-ROLE-EXPANSION-01`

Last reviewed: 2026-07-16

## Purpose

Expand the reviewed glossary from three baseline racing roles into a clear role taxonomy while keeping role definitions separate from individual people, participant lists, ownership records, pedigrees, rider weights, inquiries, and disciplinary records.

## Baseline

```text
glossary records: 31
role records: 3
bilingual routes: 62
```

The baseline contained Jockey, Driver, and Trainer.

## Implemented role groups

### Participant roles

1. Jockey;
2. Driver;
3. Trainer;
4. Owner;
5. Breeder.

### Race-official roles

1. Steward;
2. Starter;
3. Clerk of the scales.

The glossary contains 36 records and 72 bilingual routes after this unit.

## Reconciled baseline roles

Jockey, Driver, and Trainer now include:

- reviewed aliases;
- Japanese readings;
- English and Japanese beginner explanations;
- explicit classification boundaries;
- related-term navigation;
- participant-data publication restrictions.

Jockey and Driver remain distinct because one rides the horse and the other controls the vehicle in Harness racing. Trainer remains separate from Owner and Breeder.

## Added roles

- `owner` defines the ownership role without publishing ownership records or owner lists;
- `breeder` defines the breeding or production role without publishing pedigrees, breeding records, or breeder lists;
- `steward` defines a race-official role without treating the official as the governing body or publishing inquiry and disciplinary records;
- `starter` defines the official responsible for the start and remains distinct from Post time;
- `clerk-of-scales` defines the rider-weight checking role without publishing weight or entry datasets.

## Reviewed relationships

- Jockey ↔ Clerk of the scales;
- Driver ↔ Harness racing;
- Trainer ↔ Owner;
- Trainer ↔ Breeder;
- Steward ↔ Meeting;
- Starter ↔ Post time.

Every relationship is reciprocal in `related_term_ids`.

## Public boundary

This unit publishes role definitions, aliases, readings, beginner explanations, and related-term navigation only.

It does not publish:

- named participant or official lists;
- ownership records;
- pedigrees or breeding records;
- jockey weights;
- racecards or entries;
- inquiry records;
- disciplinary or penalty records;
- results or payouts;
- raw source bodies.

## Runtime and validation

The permanent gate:

- preserves the v2 schema, racing-type, and horse-breed release baselines;
- validates all eight roles against the canonical role registry;
- validates participant-role and race-official-role grouping;
- validates six reciprocal relationships;
- rejects role/person-list, owner/ownership-record, breeder/pedigree, steward/governing-body, starter/post-time, and clerk/weight-dataset conflation;
- builds and checks all 72 bilingual glossary routes;
- verifies aliases, readings, beginner explanations, and related terms render only when present;
- proves the repository remains clean;
- performs no network request, publication, or deployment.

## Next unit

`GLOSSARY-TIMETABLE-TERM-EXPANSION-01` will expand reviewed schedule and meeting terminology without republishing full racecards or participant data.
