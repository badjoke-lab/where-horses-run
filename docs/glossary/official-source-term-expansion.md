# Glossary official-source term expansion

Status: implemented for review

Work ID: `WHR-GLOSSARY-DICTIONARY-V1`

Implementation unit: `GLOSSARY-OFFICIAL-SOURCE-TERM-EXPANSION-01`

Last reviewed: 2026-07-16

## Purpose

Define official-source and governance language used by Where Horses Run without implying that official provenance automatically permits copying, automated collection, publication, or permanent availability.

## Baseline

```text
glossary records: 40
official-source records: 0
governance-term records: 0
bilingual routes: 80
```

## Official-source concepts

1. Official source;
2. Official calendar;
3. Official racecard;
4. Link-first source;
5. Source status.

## Governance concepts

6. Governing body;
7. Racing authority;
8. Racecourse operator.

The glossary therefore contains 48 records and 96 bilingual routes after this unit.

## Reconciled existing records

`Fixture` now links reciprocally to `Official calendar`.

`Racecard` now links reciprocally to `Official racecard` while preserving its existing relationships with Entries, Post time, and Odds.

## Classification boundaries

### Official provenance is not republication permission

An Official source is published or maintained by the organization responsible for the information. The label identifies provenance. It does not mean that Where Horses Run may copy the source body, republish the full dataset, or automatically accept every value.

### Official calendar is not a complete racecard

An Official calendar provides fixture or meeting dates. An Official racecard provides race-level and entry-level information for a meeting. The two source documents have different scopes.

### Link-first is not live fetching

A Link-first source is handled by preserving a reviewed link and explanatory context. It does not activate a parser, scraper, runtime fetch, background collection, or automatic publication.

### Source status is not a quality score

Source status describes how Where Horses Run currently handles a source, such as candidate, link-first, parser-reviewed, unavailable, or stale. It does not rank the organization and does not guarantee future availability.

### Governing body, Racing authority, and Racecourse operator

A Governing body sets or coordinates rules and structures. A Racing authority performs official oversight or administration within a jurisdiction. A Racecourse operator runs a venue and may publish local information.

One organization may perform more than one function, but the glossary does not assume that the three labels are synonyms.

## Reviewed relationships

- Official source ↔ Official calendar;
- Official source ↔ Official racecard;
- Official source ↔ Link-first source;
- Official source ↔ Source status;
- Official source ↔ Racecourse operator;
- Official calendar ↔ Fixture;
- Official racecard ↔ Racecard;
- Link-first source ↔ Source status;
- Governing body ↔ Racing authority.

## Public boundary

This unit publishes definitions and navigation only.

It does not:

- copy raw source bodies;
- automatically accept source content;
- republish complete racecards;
- republish entries or participant lists;
- republish odds, results, or payouts;
- enable live fetching;
- activate a parser or scraper;
- publish or deploy generated data.

## Runtime and validation

The official-source overlay is applied after the role and timetable overlays. This allows later units to add relationships to released concepts while preserving the earlier required relationships.

The permanent gate:

- builds all 96 bilingual glossary routes;
- preserves the v2, racing-type, horse-breed, role, and timetable release contracts;
- validates five official-source terms and three governance terms;
- validates nine reciprocal relationships;
- rejects provenance/republication, calendar/racecard, link-first/live-fetch, status/quality-score, and organization-function conflation;
- verifies aliases, readings, beginner explanations, related terms, and public-boundary notices in rendered pages;
- proves the repository remains clean;
- performs no network request, publication, or deployment.

## Next unit

`GLOSSARY-MULTILINGUAL-FIELD-CLEANUP-01` will normalize multilingual fields and labels without changing the protected concept IDs.
