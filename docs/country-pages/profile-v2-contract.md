# Country profile v2 contract

Status: active data contract  
Schema: `schemas/country-profile-v2.schema.json`  
Validator: `scripts/check-country-profile-v2.mjs`

## Purpose

Country profile v2 is the reviewed content contract for every English and
Japanese country or region detail page in the 98-entry programme.

A profile is reusable page data. It is not evidence by itself and it does not
replace the source-test records or country research notes.

## Required content

Every profile contains:

- canonical country ID and slug,
- page kind and review status,
- review date,
- source-test status and public display ceiling,
- separate English and Japanese hero and overview copy,
- racing types,
- seasonality,
- timezone and schedule guidance,
- surfaces,
- racing systems,
- principal racecourse IDs,
- organiser source IDs and distributor source IDs,
- calendar guidance and coverage limitations,
- revalidation triggers,
- related glossary IDs.

English and Japanese fields must be independently written natural-language
copy. One language must not be omitted merely because the other exists.

## Page kinds

The same contract supports four page treatments:

- `country`: current country or region racing guide,
- `special`: a current but non-standard or unresolved racing form,
- `explanatory`: a cautious page that does not claim confirmed current racing,
- `archive`: a historical page excluded from current calendar listings.

Current `country` and `special` pages require at least one racing type, racing
system and principal racecourse. Explanatory and archive pages may use empty
arrays when those claims are not supported.

## Source role separation

Each racing system keeps two source-reference arrays:

- `organiser_source_ids`: official organising or governing sources,
- `distributor_source_ids`: public distribution or access sources.

The same source ID must not be assigned both roles within one system. A public
distributor must not be presented as the organiser merely because it hosts a
calendar or race card.

The referenced source and racecourse IDs are resolved against canonical
registries in the following implementation PRs.

## Public display ceiling

The profile stores the maximum country-page timetable rank that may be
presented. It does not force the page to display that much information.

A pending source test requires a pending ceiling. Later source-specific display
policies may reduce A+ to A or hide individual A+ fields without deleting the
underlying reviewed profile data.

Country pages remain one-meeting-per-row views. Per-race programme summaries
belong only on meeting detail pages and must remain within the separate public
timetable boundary.

## Publication exclusions

Country profiles must not contain participant records, wagering data, results,
payouts, predictions, copied race-card text, embedded media or direct stream
routes. Those items are outside the Where Horses Run publication purpose.

## Review dates

`last_reviewed` records the editorial review date of the profile. It must not
be a future fixture date and it must not be later than the current date.

A profile must be revalidated when its listed triggers occur, including major
calendar, organiser, source-route or racing-structure changes.

## Status and programme counting

- `draft`: incomplete or not yet approved for page implementation,
- `reviewed`: approved as structured input for implementation.

A reviewed profile advances a tracker row to `profile_ready` only after the
profile itself is committed and validated. It does not count as a formally
published page until both language routes and final QA pass.

The existing Japan and Hong Kong profiles remain legacy reviewed seeds until a
later PR migrates them to this contract.
