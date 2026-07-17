# Phase 10 UX polish release

Status: release ready  
Release ID: `WHR-UX-DISCOVERY-V1`  
Work ID: `WHR-SEARCH-FILTER-SEO-V1`  
Implementation unit: `UX-POLISH-RELEASE-01`  
Reviewed: 2026-07-17

## Release decision

Phase 10 is accepted as one reviewed static-first discovery and navigation release.

The release combines search, filters, bilingual glossary discovery, mobile navigation, responsive desktop layout, no-JavaScript fallback review, and final control polish without adding live fetching, server-side search, automatic publication, or new public datasets.

## Completed implementation units

```text
GLOBAL-SEARCH-FOUNDATION-01
COUNTRY-FILTERS-01
RACE-TYPE-FILTERS-01
REGION-FILTERS-01
SOURCE-STATUS-FILTERS-01
GLOSSARY-SEARCH-IMPROVEMENT-01
MOBILE-NAVIGATION-IMPROVEMENT-01
DESKTOP-LAYOUT-IMPROVEMENT-01
NO-JS-FALLBACK-REVIEW-01
UX-POLISH-RELEASE-01
```

## Frozen discovery scope

```text
Global search records per locale: 182
Country and region records per locale: 98
Region facets: 19
Racecourse records per locale: 36
Source records per locale: 171
Glossary records per locale: 48
Glossary categories: 9
Navigation links per locale: 9
No-JavaScript bilingual record cards: 1,070
```

The five bilingual discovery surfaces remain:

```text
/search/ and /ja/search/
/countries/ and /ja/countries/
/tracks/ and /ja/tracks/
/sources/ and /ja/sources/
/glossary/ and /ja/glossary/
```

## Final control polish

The final stylesheet is:

```text
src/styles/ux-polish.css
```

It provides one shared presentation contract for all five form types:

- responsive `auto-fit` form grids;
- one-column forms at 720 pixels and below;
- 44-pixel-equivalent input, select, and button heights;
- full-width mobile actions;
- visible keyboard focus on fields and buttons;
- emphasized primary actions;
- visually distinct reset actions;
- separated live result counts;
- consistent result-link underline treatment;
- dashed empty-result states.

No transition or animation is required for the release.

## Shared release markers

Every page rendered through `BaseLayout.astro` carries:

```text
data-ux-polish-release="WHR-UX-DISCOVERY-V1"
data-ux-polish-phase="10"
```

The release stylesheet is imported after the mobile and desktop layout styles and before utilities.

## Static-first preservation

All client-side search and filter pages still render complete record lists before JavaScript runs.

When JavaScript is disabled, the completed `noscript` fallback hides inert forms and live counts while preserving all 1,070 bilingual record cards and their primary links. The native mobile menu remains usable without JavaScript.

## Public and privacy boundary

Allowed:

- reviewed public discovery and navigation;
- reviewed public metadata already covered by earlier contracts;
- local client-side filtering and URL state.

Not allowed:

- participant datasets;
- complete racecards;
- odds, results, payouts, predictions, or betting advice;
- raw source-body republication;
- automatic translation or content generation;
- external search services or server-side filtering;
- cookies, client storage, interaction logging, or analytics;
- automatic publication or deployment.

## Validation

The permanent release checker is:

```text
scripts/check-ux-polish-release.mjs
```

The permanent read-only release gate is:

```text
.github/workflows/ux-polish-release.yml
```

The gate builds the complete bilingual site and runs every permanent Phase 10 checker in order:

```text
global search
country filters
race type filters
region filters
source status filters
glossary search
mobile navigation
desktop layout
no-JavaScript fallback
UX polish release
```

It then proves the repository remains clean.

## Phase 10 outcome

The release satisfies the roadmap outcome:

```text
Countries remain discoverable as the registry grows.
Glossary concepts remain discoverable as the dictionary grows.
Mobile navigation does not break at narrow widths.
The core directories remain readable without JavaScript.
```

## Next implementation unit

```text
SITEMAP-ROBOTS-01
```
