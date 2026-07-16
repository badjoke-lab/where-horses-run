# Glossary horse breed expansion

Status: complete

Work ID: `WHR-GLOSSARY-DICTIONARY-V1`

Implementation unit: `GLOSSARY-HORSE-BREED-EXPANSION-01`

Last reviewed: 2026-07-16

## Purpose

Add reviewed horse-breed definitions and connect them to the racing-type glossary without treating a breed, gait, racing code, or broad horse type as the same concept.

## Baseline

```text
glossary records: 26
breed records: 0
horse-type records: 0
bilingual routes: 52
```

## Implemented records

Four breed records are added:

1. Thoroughbred;
2. Arabian horse;
3. American Quarter Horse;
4. Standardbred.

One separate horse-type record is added:

- Draft horse.

The glossary contained 31 records and 62 bilingual routes at completion of this unit.

## Why Draft horse is not a breed record

Draft horse is a broad functional horse type covering multiple heavy working breeds. Classifying it as one breed would repeat the same category error that this dictionary is intended to prevent.

The v2 glossary category contract therefore adds `horse_type`. Draft horse uses that category and links to Banei racing only as a horse-type-to-racing-format relationship.

## Reviewed relationships

- Thoroughbred ↔ Thoroughbred flat racing;
- Arabian horse ↔ Arabian racing;
- American Quarter Horse ↔ Quarter Horse racing;
- Standardbred ↔ Harness racing, Trotting, and Pacing;
- Draft horse ↔ Banei racing.

Every relationship is reciprocal in `related_term_ids` so users can move from the horse concept to the racing concept and back.

## Official source links

The breed entries use link-only official organization sources:

- The Jockey Club for Thoroughbred registry navigation;
- Arabian Horse Association for Arabian horse breed navigation;
- American Quarter Horse Association for American Quarter Horse navigation;
- United States Trotting Association for Standardbred navigation.

Draft horse uses mixed reviewed evidence and the official Banei source only to support its relationship with Banei racing. The Banei source is not treated as a universal draft-horse breed registry.

These source records provide links and evidence identifiers only. No registry, pedigree, ownership, breeding, entry, result, or participant datasets are fetched or republished.

## Beginner explanations

Each new entry includes a short English and Japanese explanation that states the classification boundary directly.

- the horse is the breed;
- the race is the racing type;
- Trotting and Pacing are gait-based forms of Harness racing;
- Draft horse is a group of horse breeds, while Banei racing is a racing format.

## Public boundary

This unit publishes definitions, aliases, readings, beginner explanations, reviewed source IDs, and related-term links only.

It does not publish:

- breed-registry records;
- pedigrees;
- ownership or breeder records;
- horse or participant lists;
- racecards or entries;
- odds, results, or payouts;
- raw source bodies.

## Runtime and validation

The permanent gate:

- preserves the 31-record and 62-route breed release baseline while allowing later glossary additions;
- validates the expanded nine-category glossary schema;
- preserves the v2 migration and racing-type release baselines;
- validates all four breeds and the one horse type against the canonical registry;
- validates official source IDs and reciprocal relationships;
- rejects breed/racing-type and breed/horse-type conflation;
- verifies all current bilingual glossary routes;
- verifies aliases, readings, beginner explanations, sources, and related terms render only when present;
- proves the repository remains clean;
- performs no network request, publication, or deployment.

## Completed next unit

`GLOSSARY-ROLE-EXPANSION-01` expands reviewed racing roles while keeping participant, ownership, pedigree, weight, inquiry, and disciplinary datasets outside the public glossary.
