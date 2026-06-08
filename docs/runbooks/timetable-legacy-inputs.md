# Timetable legacy input isolation

Status: PR-11  
Last updated: 2026-06-08

This runbook defines how legacy, sample, manual, normalized, and transitional timetable inputs may be used after the public timetable view migration.

## Rule

Pages, components, and display-facing libraries must read timetable display data from the public view only:

```text
data/generated/timetable/public/meeting-list.json
data/generated/timetable/public/meeting-details.json
src/lib/timetable/publicTimetableViewModel.ts
src/lib/timetable/publicTimetableFilters.ts
```

They must not directly import or parse legacy/manual/sample inputs.

## Allowed legacy input usage

Legacy and transitional timetable inputs may remain in the repository only as upstream inputs for builders, audits, runbooks, and source-specific normalization work.

Allowed paths:

```text
scripts/timetable/build-canonical-timetable.mjs
scripts/timetable/build-public-timetable-view.mjs
scripts/check-canonical-timetable-output.mjs
scripts/check-public-timetable-view.mjs
docs/runbooks/current-timetable-data-inventory.md
data/audits/timetable-rank-status.json
PR-*.md
```

## Legacy inputs that must not be display imports

```text
data/generated/timetables.json
data/generated/japan-active-timetable-records.json
data/generated/normalized-timetable.json
data/generated/timetable/hkjc-normalized-timetable.sample.json
data/generated/timetable/hkjc-normalized-meeting-details.sample.json
data/generated/timetable/hkjc-racecard-source-snapshot.json
src/data/normalizedTimetableCalendarPreview.ts
src/data/normalizedTimetableMeetingDetails.ts
```

These files are not deleted in this PR. They are isolated from public display surfaces.

## Public display chain

The intended display chain is:

```text
source / manual / sample / normalized input
↓
canonical builder
↓
publication policy
↓
public view builder
↓
public view model / public filters
↓
calendar, today, tomorrow, current timetable, meeting detail
```

## Non-goals

This isolation step does not add new source fetching, delete old inputs, migrate country pages, migrate racecourse pages, or change publication policy.
