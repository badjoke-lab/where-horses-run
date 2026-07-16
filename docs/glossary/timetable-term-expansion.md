# Glossary timetable-term expansion

Status: implemented for review

Work ID: `WHR-GLOSSARY-DICTIONARY-V1`

Implementation unit: `GLOSSARY-TIMETABLE-TERM-EXPANSION-01`

Last reviewed: 2026-07-16

## Purpose

Expand the reviewed glossary for race schedules, racecards, entries, market information, official outcomes, and payouts without turning the dictionary into a live racecard, odds, result, or payout service.

## Baseline

```text
glossary records: 36
data-term records: 4
bilingual routes: 72
```

The baseline contained Meeting, Racecard, Fixture, and Post time.

## Implemented terms

### Schedule context

1. Meeting;
2. Fixture;
3. Post time.

### Race documents and participation context

4. Racecard;
5. Entries.

### Market and outcome context

6. Odds;
7. Results;
8. Payouts.

The glossary therefore contains 40 records and 80 bilingual routes after this unit.

## Added records

- `entries`;
- `odds`;
- `results`;
- `payouts`.

## Reconciled records

- `meeting`;
- `racecard`;
- `fixture`;
- `post-time`.

Each reconciled record now includes reviewed aliases, a Japanese reading, a beginner explanation, related-term navigation, and an explicit publication boundary.

## Classification boundaries

### Meeting and Fixture

A Meeting is an organized racing event or period. A Fixture is a scheduled calendar item. The exact use of both words varies by jurisdiction, but the two concepts are not treated as identical.

### Post time and actual start

Post time is the scheduled start time, normally expressed in racecourse local time. It may differ from the actual time at which the race begins. The Starter is the official role responsible for the starting procedure.

### Racecard and Entries

A Racecard is a document or page that organizes races and may contain multiple information types. Entries are the horses and associated participants listed at a particular registration or declaration stage. The document and the entries dataset are not the same concept.

### Odds, Results, and Payouts

Odds are betting-market prices or ratios before or during market operation. They are not a prediction or recommendation from Where Horses Run.

Results are the officially published race outcome. Payouts are the returns declared for winning betting selections after settlement. Results and Payouts are related but separate concepts, and neither is the same as Odds.

## Reviewed relationships

- Meeting ↔ Fixture;
- Meeting ↔ Steward;
- Racecard ↔ Entries;
- Racecard ↔ Post time;
- Racecard ↔ Odds;
- Post time ↔ Starter;
- Results ↔ Payouts.

All relationships are reciprocal in the merged glossary runtime.

## Public boundary

This unit publishes definitions and navigation only.

It does not publish or republish:

- complete racecards;
- entries or participant datasets;
- live or historical odds datasets;
- prediction or betting-tip datasets;
- result datasets;
- payout datasets;
- raw source bodies.

Where Horses Run may link to official sources and explain the meaning of these terms without becoming a mirror of the underlying data products.

## Runtime and validation

The timetable overlay is applied after the role overlay. Existing IDs are replaced and new IDs are appended without rewriting the protected baseline glossary file.

The permanent gate:

- builds all 80 bilingual glossary routes;
- preserves the v2, racing-type, horse-breed, and role release contracts;
- validates all eight timetable/data terms against the canonical registry;
- validates seven reciprocal relationships;
- rejects Meeting/Fixture, Post-time/actual-start, Racecard/Entries, Entries/Results, Odds/prediction, Results/Payouts, and Payouts/Odds conflation;
- verifies aliases, readings, beginner explanations, related terms, and public-boundary notices in rendered pages;
- proves the repository remains clean;
- performs no network request, publication, or deployment.

## Next unit

`GLOSSARY-OFFICIAL-SOURCE-TERM-EXPANSION-01` will define official-source concepts and source-status language without expanding automated collection scope.
