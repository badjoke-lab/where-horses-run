# Calendar pipeline v1 — production runtime import boundary

Status: active runtime authority boundary  
Work ID: `WHR-CAL-PIPELINE-V1`  
Implemented: 2026-07-01; consumer-only runtime completed in Wave 5 on 2026-09-21

## Rule

Every production page must reach timetable data through the committed public projection only.

```text
production page
-> public timetable view model
-> public meeting-list / meeting-details JSON
```

Production pages, components, layouts, and their transitive local dependencies must not read:

- candidates;
- canonical meeting/detail JSON;
- manual timetable seeds;
- normalized samples;
- source-specific generated snapshots;
- current-integrated or preview-era data;
- legacy timetable display modules.

## Guard

`scripts/check-calendar-runtime-import-boundary.mjs` starts from every file under `src/pages/`, resolves relative imports recursively, and records the complete dependency chain.

The check fails when a page can reach a prohibited path, even indirectly through a shared library or component. It also fails on unresolved relative imports so a renamed or partially removed module cannot silently escape validation.

The dedicated GitHub Actions workflow runs whenever source runtime or timetable data paths change, then confirms the full static build still succeeds.

## Removed shared dependency

`src/lib/data.ts` previously imported:

```text
data/generated/timetables.json
data/generated/japan-active-timetable-records.json
```

and exposed their merged records under `siteData.generated`. Because `src/lib/data.ts` is used for countries, racecourses, and sources across the site, those legacy timetable files entered the dependency graph of unrelated production pages even when their timetable properties were not consumed.

Pipeline v1 removes those imports and exports. Country, racecourse, source, glossary, archive, and non-timetable generated helpers remain unchanged.

## Archived code

Legacy preview modules and data may remain in the repository temporarily for migration evidence. They are permitted only when unreachable from production pages.

A future cleanup may delete archived files after their useful assertions and provenance are preserved elsewhere. This guard does not treat repository presence as publication; it treats runtime reachability as publication risk.

## Public boundary

The allowed timetable runtime files are:

```text
data/generated/timetable/public/meeting-list.json
data/generated/timetable/public/meeting-details.json
src/lib/timetable/publicTimetableViewModel.ts
```

The view model itself must not import candidates, canonical files, source snapshots, legacy seeds, reviewed supplement modules, or post-publication override artifacts.

Wave 5 makes the view model consumer-only: it returns the committed public list/detail datasets exactly as produced by the Wave 4 publication authority. It must not raise ranks, restore removed meetings, replace source/provenance fields, add reviewed rows, or mutate timetable detail fields after publication.

The former runtime-only sources remain repository history until cleanup, but they are no longer allowed runtime inputs:

```text
data/generated/timetable/public/japan-a-plus-overrides.json
src/lib/timetable/tjkPublicSupplement.ts
src/lib/timetable/baneiReviewedSupplement.ts
```

## Operator diagnostics exception

`src/pages/calendar/diagnostics.json.ts` is a prerendered operator-only aggregate endpoint loaded only by `?diag=calendar`. It may compare canonical field coverage with the final public snapshot, but it must not expose canonical timetable rows or alter publication truth.

The runtime import-boundary check excludes only that prerendered diagnostics endpoint from the ordinary page graph and validates the exception separately.

## Wave 5 result

Production Calendar rendering is now:

```text
final correlated public snapshot
-> consumer-only publicTimetableViewModel
-> page/UI filtering, timezone projection, live-status decoration
```

Presentation code may filter, sort, localize, and format the final public snapshot. It may not add/remove canonical/public meetings, change evidence/public ranks, replace provenance, or enrich timetable fields from side-channel datasets.

Structured-data generation and remaining legacy cleanup are Wave 6.
