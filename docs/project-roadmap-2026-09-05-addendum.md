# Where Horses Run project roadmap — 2026-09-05 map/UI addendum

Status: active canonical project-roadmap addendum  
Adopted: 2026-09-05  
Supersedes for current product/UI execution state: `docs/project-roadmap-2026-08-25-addendum.md`  
Base roadmap: `docs/project-roadmap.md`  
Map/UI decision authority: `docs/decisions/map-ui-integration-2026-09-05.md`

This addendum changes the current product/UI execution state without changing the reviewed Calendar acquisition/publication boundary.

## Current stage

```text
Current stage: reviewed_incremental_maintenance
Parallel product lane: map_ui_integration
Automatic publication: disabled
Human review bypass: prohibited
```

The 2026-08-25 reviewed incremental maintenance model remains valid. The new decision is that map UI is no longer deferred future planning: it is an active product-navigation lane.

## Current public-navigation emphasis

Until lower-quality navigation surfaces are deliberately restored, current public-navigation work should prioritize:

```text
Home
Today
Calendar
-> racecourse detail
```

Map work integrates into these pages. It does not justify exposing additional low-quality pages merely because location data exists.

## Active map/UI sequence

Implementation units are:

1. `MAP-001` — racecourse location schema + validation;
2. `MAP-002` — verified location population for currently published racecourses;
3. `MAP-003` — generated map/GeoJSON projection from the racecourse master;
4. `MAP-004` — shared interactive map component + graceful fallback;
5. `MAP-005` — racecourse-detail high-zoom map;
6. `MAP-006` — Today map/list synchronization;
7. `MAP-007` — Calendar List/Map switch using the selected-date public meeting set;
8. `MAP-008` — Home world map with Today/Tomorrow/Next-7-days filters;
9. `MAP-009` — mobile selected-racecourse interaction/card behavior;
10. `MAP-010` — accessibility, performance, attribution, and map-failure QA.

The first implementation gate is `MAP-001` through `MAP-005`. Home map-first release work must not begin before that gate is green.

## Non-negotiable map rules

- Coordinates are verified racecourse master data, not guessed values.
- Normal rendering does not use runtime geocoding.
- Map-specific hand-maintained meeting data is prohibited.
- Today and Calendar maps use the same public meeting records as their corresponding list views.
- Calendar selected date remains authoritative for the Map view.
- Racecourse pages use a single-point high-zoom view and do not cluster the venue.
- Dense multi-racecourse views may cluster points.
- Map popup/card content remains list-level and does not expand A/A+ race-level programme rows.
- Map/client/provider failure must not remove ordinary list/navigation access.
- Basemap runtime resources are a narrowly scoped rendering exception; runtime racing-data acquisition remains prohibited.

## Completion gate

The map lane is not complete when a screenshot, static image, or isolated map shell exists.

Completion requires:

```text
verified racecourse coordinates
-> real interactive map
-> zoom/pan
-> selection
-> real racecourse/meeting route
-> Today/Calendar reuse of existing public meeting records
-> mobile/touch behavior
-> non-map fallback
-> attribution/accessibility/performance QA
```

## Relationship to existing product lanes

The map lane may proceed in parallel with Calendar maintenance, source review, racecourse-page strengthening, and other safe reviewed maintenance. It must not alter acquisition rank, publication rank, source acceptance, meeting existence, or automatic-publication policy.

The existing racecourse page-link contract remains historical evidence of the pre-map implementation. Its current extension is governed by `docs/decisions/map-ui-integration-2026-09-05.md`.

## Supersession rule

Older planning material that places world-map/region-index work in a distant future phase is superseded for current UI execution. Retain historical entries where needed for audit history, but do not use them to defer `MAP-001`–`MAP-010`.

## Authority rule

For current product/UI execution state, this addendum is the current project-roadmap addendum. It inherits the reviewed incremental-maintenance and publication controls from the 2026-08-25 addendum except where this document explicitly changes UI/navigation sequencing.

Active schemas, publication-boundary contracts, and governance documents continue to outrank roadmap prose on their respective subjects.
