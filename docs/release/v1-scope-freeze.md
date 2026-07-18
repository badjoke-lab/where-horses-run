# Where Horses Run v1 scope freeze

Status: complete  
Release ID: `WHR-V1-PREPARATION-V1`  
Work ID: `WHR-V1-PREPARATION-V1`  
Implementation unit: `V1-SCOPE-FREEZE-01`  
Reviewed: 2026-07-18

## Decision

The candidate scope for Where Horses Run v1 is frozen.

Phase 12 may audit, correct, remove unsupported records, improve quality, and verify mobile, accessibility, performance, source policy, limitations, and release readiness. It may not add a new route family, public data class, user feature, transactional feature, or publication mode without an explicit scope review and contract update.

The completed Phase 11 release `WHR-SEO-PUBLIC-CONTENT-V1` is the technical and public-content baseline.

## Baseline inventory

```text
Locales: 2
Public pages: 771
English pages: 387
Japanese pages: 384
Route families: 17
Country detail routes: 196
Source-country routes: 196
Meeting detail routes: 158
Glossary term routes: 96
Glossary relationship routes: 2
Racecourse detail routes: 72
Racing-type detail routes: 16
FAQ content routes: 2
Methods content routes: 2
```

The numbers above are a reference snapshot, not a prohibition on correction. Unsupported, stale, or incorrect records may be reduced or removed during the v1 data audit. Increasing counts or adding a new public data class requires both data review and scope review.

## Included route families

```text
root
search
countries
tracks
types
sources
glossary
calendar
today
tomorrow
timetable
major-countries
archive
about
disclaimer
faq
methods
```

## Included capabilities

v1 includes:

- static English and Japanese navigation;
- client-side search and filters over already-rendered records;
- country and area discovery;
- racecourse profiles;
- racing-type guides;
- official and reference source directories;
- glossary terms and reviewed related-term navigation;
- reviewed Calendar, Today, Tomorrow, and timetable views;
- meeting detail pages using publication ranks C, B, B+, A, and A+;
- official live and replay availability labels without video embedding;
- source status, review dates, and official confirmation routes;
- complete static readability without JavaScript;
- sitemap, canonical, hreflang, JSON-LD, Open Graph, Twitter, title, and description metadata.

## Included public data classes

v1 may publish reviewed values for:

- country or area identity;
- racecourse identity and visible location;
- racing-type identity;
- glossary term identity and reviewed definition;
- official or reference source routes;
- meeting date, racecourse, country, organizer, timezone, and source status;
- publication rank;
- first and last race times when the rank permits them;
- race labels and post times when the rank permits them;
- A+ programme-summary fields when the rank permits them;
- official live or replay availability labels;
- last-reviewed or last-checked dates.

A+ remains a lightweight programme summary, not a complete racecard.

## Explicitly excluded from v1

v1 does not include:

- accounts, profiles, login, user submissions, comments, or public editing;
- personalization, saved items, or notifications;
- a public write API or user-data API;
- a native mobile application;
- live odds or betting-market data;
- predictions, tips, picks, or betting advice;
- results, payouts, or dividend republication;
- complete racecards, entries, or participant datasets;
- horse, jockey, trainer, draw, weight, or body-weight fields;
- embedded video, direct stream URLs, recording redistribution, or unofficial mirrors;
- a real-time or complete-coverage guarantee;
- automatic translation or unreviewed content generation;
- automatic publication from candidate or private data;
- ticketing, wagering, payment, or other transactional features.

## Scope-change rule

Allowed without expanding scope:

- correcting a factual error;
- removing stale or unsupported data;
- reducing a page to a lighter official-link-first presentation;
- improving navigation, accessibility, performance, or wording inside existing route families;
- improving validation and QA for existing public data classes.

Requires explicit scope review:

- a new top-level route family;
- a new public data class;
- a new user-generated or transactional feature;
- a new publication mode or automatic publishing path;
- a material increase in inventory that changes the reviewed v1 candidate boundary.

## Remaining v1 acceptance work

The frozen scope is not the final v1 release decision. The following units remain required:

```text
V1-DATA-AUDIT-01
V1-MOBILE-QA-01
V1-ACCESSIBILITY-QA-01
V1-PERFORMANCE-QA-01
V1-SOURCE-POLICY-REVIEW-01
V1-KNOWN-LIMITATIONS-PAGE-01
V1-RELEASE-NOTES-01
V1-FINAL-CLEANUP-01
V1-RELEASE-01
```

## Public and privacy boundary

Public documentation may describe site purpose, public features, technical architecture, data policy, official-source priority, current public state, and known limitations.

It may not republish participant datasets, complete racecards, odds, results, payouts, predictions, betting advice, or raw official-source bodies. It does not discuss revenue, budget, other-project relationships, or internal circumstances.

This unit adds no visitor identifiers, interaction logging, cookies, client storage, analytics, automatic translation, automatic generation, automatic publication, or deployment action.

## Verification

Permanent checker:

```text
scripts/check-v1-scope-freeze.mjs
```

Read-only Actions gate:

```text
.github/workflows/v1-scope-freeze.yml
```

The gate builds the complete static site, preserves the Phase 11 SEO release, validates the frozen scope against the current public route contracts, and proves the repository remains clean.

## Next implementation unit

```text
V1-DATA-AUDIT-01
```
