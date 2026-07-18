# Public source directory filters

Status: complete  
Original work ID: `WHR-SEARCH-FILTER-SEO-V1`  
Original implementation unit: `SOURCE-STATUS-FILTERS-01`  
Policy revision unit: `V1-SOURCE-POLICY-REVIEW-01`  
Reviewed: 2026-07-18

## Decision

The bilingual Sources directory remains a static-first directory of 171 official source links across 98 countries and regions.

The public interface now exposes only information useful to a visitor choosing and opening an official source. Source-specific automation level, terms-risk assessment, and registry-stage metadata are operational concerns and are no longer displayed, searchable, or encoded in public HTML attributes.

## Routes and inventory

```text
/sources/
/ja/sources/
/sources/{country-slug}/
/ja/sources/{country-slug}/
```

The release preserves:

- 171 unique source records;
- 98 countries and regions with source records;
- 2 bilingual directory routes;
- 196 bilingual country-source routes;
- 171 statically rendered cards per directory locale.

## Public controls

Both directories provide 2 controls:

1. keyword: `q`
2. country or region: `country`

Keyword matching uses Unicode NFKC normalization, case-insensitive comparison, and normalized whitespace. The two controls can be combined. Their state is restored from the URL, and `history.replaceState` updates the current URL without sending the query to a server.

The directory keeps a live result count, a visible zero-result state, and one clear-filters action. With JavaScript disabled, the complete list remains readable and linked.

## Public record projection

The visitor-facing projection is limited to:

- source ID;
- official external URL;
- country or region and country-source link;
- public source type;
- public data type;
- public coverage or confirmation note;
- normalized search text derived only from those public values.

The visible card uses plain visitor-facing labels such as `Official` and `Link for official confirmation`. The directory does not present an internal risk score, collection capability, registry stage, or approval state as user guidance.

## Internal metadata boundary

The merged source registry continues to retain `auto_level` because existing acquisition and validation code depends on it. It is not part of the public directory projection.

The following source-specific fields were removed from all 171 public-repository source records:

```text
terms_risk: 171 fields removed
m3_status: 163 fields removed
m3_notes: 163 fields removed
```

Seven records that previously had no public note were given neutral official-confirmation notes. The final registry therefore has 171 non-empty public notes.

The permanent checker rejects:

- any `terms_risk`, `m3_status`, or `m3_notes` field in the 26 merged source-registry files;
- any automation, terms-risk, or registry-status value in public search text;
- any internal source metadata in public HTML attributes;
- any visible `Automation level`, `Terms risk`, or `Registry status` label;
- duplicate source IDs, missing public notes, invalid external URLs, or broken country-source links.

## Publication boundary

The directory is a route to official sources. It is not a permission claim and not a replacement for official racecards, timetable products, results, wagering pages, or streaming services.

Allowed:

- official source URLs;
- country and racecourse confirmation routes;
- high-level public coverage notes;
- reviewed timetable and racecourse context within the existing publication ranks.

Not allowed:

- participant datasets or complete racecards;
- horses, jockeys, trainers, draws, weights, or field details;
- odds, results, payouts, predictions, or betting advice;
- copied source bodies or raw HTML;
- embedded video, direct stream URLs, unofficial mirrors, or redistributed recordings.

Where coverage is limited or uncertain, the public page remains thin and links to the official source for final confirmation.

## Privacy and static-first behavior

All 171 cards are rendered before JavaScript runs. Filtering only hides or reveals existing cards.

The feature adds no external search service, filter endpoint, query logging, analytics, cookies, client storage, live source fetch, automatic source acceptance, automatic publication, or deployment behavior.

## Permanent validation

Checker:

```text
scripts/check-source-status-filters.mjs
```

Read-only Actions gate:

```text
.github/workflows/source-status-filters.yml
```

The gate builds the complete site, preserves the prior search and glossary foundations, validates all 26 registry files, checks both 171-card source directories, verifies all 196 country-source routes, rejects internal metadata exposure, removes generated output, and proves the repository remains clean.

## Current policy unit

```text
V1-SOURCE-POLICY-REVIEW-01
```
