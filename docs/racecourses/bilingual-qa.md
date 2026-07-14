# Racecourse page bilingual QA and release decision

Status: accepted complete

Work ID: `WHR-RACECOURSE-PAGES-V1`

Implementation unit: `RACECOURSE-PAGE-BILINGUAL-QA-01`

Decision date: 2026-07-14

Decision: `accepted_for_reviewed_static_public_operation`

Next Work ID: `WHR-GLOSSARY-DICTIONARY-V1`

## Decision

The racecourse-page stage is complete for reviewed static public operation.

The accepted release contains 36 canonical racecourse identities and 72 bilingual pages. Every public-timetable racecourse ID resolves to a canonical page pair. Racecourse pages expose reviewed Today, Next, and upcoming meeting state from the public meeting projection, retain explicit unknown states for unsupported profile fields, and connect countries, racing types, glossary concepts, Calendar dates, official sources, source registries, and coverage explanations.

## Deterministic rendered QA

The permanent gate builds with:

```text
WHR_CALENDAR_REFERENCE_DATE=2026-07-14
WHR_CALENDAR_TIMEZONE=Asia/Tokyo
```

The corrected rendered audit completed with zero errors.

```text
racecourses: 36
bilingual pages: 72
route pairs: 36 / 36
html language: 72 / 72
localized titles: 72 / 72
localized descriptions: 72 / 72
canonical links: 72 / 72
self hreflang: 72 / 72
counterpart hreflang: 72 / 72
x-default: 72 / 72
language switches: 72 / 72
single H1: 72 / 72
unique IDs: 72 / 72
image alt text: 72 / 72
non-empty anchors: 72 / 72
skip links: 72 / 72
main landmarks: 72 / 72
labeled headers: 72 / 72
labeled navigation: 72 / 72
meeting-panel aria labels: 72 / 72
reference-date presentation: 72 / 72
public-boundary notices: 72 / 72
required section pairs: 360 / 360
optional section parity: 108 / 108
heading-level parity: 36 / 36
errors: 0
```

The source contract also confirms canonical/hreflang metadata, inferred bilingual routes, accessibility markers, responsive auto-fit grids, a mobile media query, no large fixed-width page layout, and no access to prohibited participant, betting, result, payout, prediction, raw-source, or stream fields.

The permanent `Racecourse page bilingual QA` workflow reruns for racecourse audits, records, pages, shared layout and panel code, styles, roadmaps, governance, and its own contract on pull requests and on `main`. The temporary discovery and transition mechanisms are not part of the accepted repository state.

## Completed implementation chain

1. `RACECOURSE-PAGE-IDENTITY-RECONCILIATION-01` — all 26 public timetable venue IDs resolve to canonical bilingual pages;
2. `RACECOURSE-PAGE-PUBLIC-TIMETABLE-CONNECTION-01` — all racecourse pages expose reviewed Today, Next, and upcoming public meetings;
3. `RACECOURSE-PAGE-PROFILE-EVIDENCE-01` — thirteen former identity-only Japanese records gained official location and high-level course evidence while unsupported fields remained unknown;
4. `RACECOURSE-PAGE-LINK-ARCHITECTURE-01` — country, type, glossary, Calendar, official-source, source-registry, methodology, and internal-link contracts were completed;
5. `RACECOURSE-PAGE-BILINGUAL-QA-01` — responsive, metadata, accessibility, language parity, and release readiness were accepted.

Machine-readable decisions are recorded in:

- `data/audits/racecourse-page-identity-reconciliation-v1.json`;
- `data/audits/racecourse-page-public-timetable-connection-v1.json`;
- `data/audits/racecourse-page-profile-evidence-v1.json`;
- `data/audits/racecourse-page-link-architecture-v1.json`;
- `data/audits/racecourse-page-bilingual-qa-v1.json`.

## Public boundary

Racecourse pages remain list-shaped. Today, Next, and upcoming sections show one meeting per row and do not expand race-level programme summaries.

The pages do not publish entries, horse names, jockeys, trainers, numbers, gates, weights, odds, popularity, results, payouts, predictions, recommendations, full racecards, raw official bodies, embedded video, direct stream URLs, unofficial mirrors, or redistributed recordings.

Official sources remain the final authority. Missing or unsupported facts continue to appear as explicit unknown states rather than inferred content.

## Automation boundary

The permanent gate is read-only. It performs no network fetch, candidate generation, source acceptance, Canonical write, public projection write, automatic publication, or deployment.

Ordinary data maintenance continues through reviewed repository changes. Completion of the page stage does not enable unattended publication.

## Next stage

The programme moves to `WHR-GLOSSARY-DICTIONARY-V1`.

The first unit is `GLOSSARY-SCHEMA-EXTENSION-01`. It will extend the reviewed dictionary contract before adding racing-type, breed, role, timetable, and official-source terms. Dictionary pages may explain restricted concepts such as odds or results, but the site will not republish those datasets.
