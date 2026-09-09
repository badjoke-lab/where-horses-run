# Legacy glossary runtime audit — 2026-09-09

Status: complete structural migration audit for `GLOSSARY-MASTER-002`  
Work ID: `WHR-GLOSSARY-WORLD-TERMINOLOGY-MASTER`  
Scope: legacy public glossary v1 -> concept-first world terminology master migration input  
Evidence basis: repository state and completed legacy glossary documents only; no new external terminology verification in this unit

## Result

The legacy public glossary v1 contract declares 48 concepts across nine categories. The committed base `data/static/glossary.json` contains 31 baseline/enriched records; completed legacy units then add five role records, four timetable/data records, and eight official-source/governance records to reach the 48-concept release contract.

All 48 are now treated as migration inputs, not protected future headwords and not a completeness target.

```text
legacy public-v1 concepts: 48
old categories: 9
base static records: 31
role overlay additions: 5
timetable/data overlay additions: 4
official/governance overlay additions: 8
new public page work: deferred
```

The complete row-level audit is `data/glossary-master/legacy-migration-v1.tsv`.

## Decision counts

- `KEEP_AS_CONCEPT`: 22
- `KEEP_WITH_SCOPE`: 9
- `KEEP_WITH_REGIONAL_SCOPE`: 4
- `RECLASSIFY`: 2
- `RENAME_CANONICAL`: 2
- `SPLIT_REQUIRED`: 2
- `MERGE_AS_VARIANT`: 1
- `TAXONOMY_GAP_REVIEW`: 3
- `DEFER_FROM_WORLD_GLOSSARY`: 3

## Migration rule

Legacy review status is not copied forward as master evidence status. This unit is a structural migration audit only.

A retained concept still requires claim-appropriate evidence under the new specification before official status, regional usage, exact equivalence, currentness, slang status, or a preferred local label is accepted.

Old IDs are migration keys. They are not automatically the final new `concept_id` values.

## Material corrections discovered

### `post-time` is not a neutral global canonical headword

The old record defines the scheduled start time of a race. The proposed master concept is therefore `scheduled-race-start-time`. `Post time` survives as a label/variant whose regional scope must be evidenced. Other jurisdictional terms will be collected later rather than guessed now.

### `jump-course` is not a surface

The legacy category is `surface`, but the record itself describes a course/layout used for races over obstacles. It moves to category 8, Racecourse and course structure. Surface material and course geometry remain separate.

### `all-weather` should describe a surface, not a venue

The old public headword is `All-weather course`. The proposed master headword is `All-weather surface`, preventing a material/surface concept from being confused with course geometry.

### `meeting` becomes `Race meeting`

The old generic headword `Meeting` is retained as a label, while the provisional canonical English display label becomes `Race meeting`. `Fixture` remains a separate scheduled-calendar concept rather than an exact synonym.

### `entries` requires a split

The legacy plural can describe entry/participation status or a published entries list/dataset. The master must model the participation-process concept separately from document/dataset representation.

### `results` requires a split

A race outcome and a published results page/dataset are not the same concept. The proposed core concept is `Race result`; document/data representations remain separate where needed.

### three old concepts are WHR operations language

`official-source`, `link-first-source`, and `source-status` are not automatically migrated as worldwide racing terminology. In particular, link-first handling and source status are Where Horses Run operational concepts and belong in governance/operations metadata unless later public knowledge value is justified.

### governance terms expose a real taxonomy gap

`governing-body`, `racing-authority`, and `racecourse-operator` are legitimate racing concepts, but the current 16-category taxonomy has no honest organization/governance category. They are marked `TAXONOMY_GAP_REVIEW` instead of being forced into People and roles. `GLOSSARY-MASTER-003` must resolve this explicitly.

## Legacy concepts by new treatment

### Racing systems and disciplines

Retained or scoped: Thoroughbred flat racing, Flat racing, Jump racing, Steeplechase, Harness racing, Trotting, Pacing, Arabian racing, Quarter Horse racing, Banei racing.

### Horses

Retained: Thoroughbred, Arabian horse, American Quarter Horse, Standardbred. Draft horse is retained but reclassified as a horse type rather than a breed.

### Meetings, schedule, and documents

Race meeting, Racecard, Scheduled race start time, Fixture, Official racing calendar, and Official racecard remain candidates. `Post time` is a variant proposal rather than the neutral canonical identity.

### Entry, results, and betting

Entries and Results require semantic splits. Odds and Payout remain knowledge concepts with publication and regional boundaries.

### People and roles

Jockey, Driver, Trainer, Owner, Breeder, Steward, Starter, and Clerk of the scales remain candidates. Driver and Clerk of the scales carry explicit discipline/regional scope requirements.

### Racecourse structure and surfaces

Racecourse, Left-handed course, Right-handed course, Course used in both directions, Straight course, and Jump course map to racecourse/course structure. Turf, Dirt, and All-weather surface map to surface/condition taxonomy, with condition still treated separately from material.

### Governance / supporting terms

Racing governing body, Racing authority, and Racecourse operator require taxonomy resolution. Generic Official source and the two WHR-specific source-handling concepts are not automatically part of the public world-racing glossary master.

## Normalized working-master boundary

`data/glossary-master/README.md` now defines the normalized working domains and file contracts for:

- Concepts;
- Labels;
- Definitions;
- Relations;
- Regional Usage;
- Slang/Colloquial;
- Historical Terms;
- Sources;
- Search Queries;
- Page Targets;
- Coverage;
- Review Queue.

The populated migration input is `data/glossary-master/legacy-migration-v1.tsv` with exactly 48 legacy rows.

## MASTER-002 completion gate

- [x] final legacy public-v1 scope recovered as 48 concepts / nine categories;
- [x] base-vs-overlay composition identified;
- [x] all 48 concepts assigned an explicit migration disposition;
- [x] category errors and mixed concepts surfaced rather than silently copied;
- [x] old IDs retained as migration keys only;
- [x] normalized working-master domain/file contract defined;
- [x] new public glossary expansion remains deferred;
- [x] unresolved source, regional, and taxonomy questions remain visible.

## Next unit

`GLOSSARY-MASTER-003` is now the current glossary unit. It builds the core worldwide concept inventory across the controlled taxonomy, resolves the governance taxonomy gap, and defines common confusion/boundary pairs before jurisdiction/language expansion.
