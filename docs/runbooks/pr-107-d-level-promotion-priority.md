# PR-107 D-level promotion priority

## Core correction

For the 13-country major racing scope, D is not a real user-facing data level.

D only means that this repository has an official source target but has not yet extracted meeting rows from it.

Top-tier racing countries should normally have public calendars, entries, fields, or racecards that people use to know where and when racing is happening. Therefore, D should be treated as a temporary extraction backlog, not as acceptable product coverage.

## User-facing rule

Do not present D as timetable coverage.

A public timetable page should primarily show:

- A: all race times
- B: first race time
- C: meeting date and racecourse
- season-window status where a country/system is in an official off-season window

D can appear only in an internal operations/audit view.

## Promotion obligation

Every D system must have a next promotion target.

- D to C: extract meeting date and racecourse from official calendars, entries, fields, or fixture lists.
- C to B: extract first race time from racecard, entries, declarations, or fields.
- B to A: extract all race rows and race times.

## D systems in PR-107

### United States

- Equibase Thoroughbred: promote to C from official entries/track-date rows.
- USTA Harness: promote to C from official entries rows.
- AQHA Quarter Horse: promote to C from official racing calendar or race result/entries source.

### Canada

- Woodbine Thoroughbred: promote to C from Woodbine racing calendar/race-day pages.
- Standardbred Canada: promote to C from entries/results pages.

### Australia

- Racing Australia Thoroughbred: promote to C from Racing Australia calendar/race fields pages.
- Harness Australia: promote to C from fields/meeting calendar pages.

### New Zealand

- LOVERACING Thoroughbred: promote to C from RaceInfo calendar/meetings/fields pages.
- HRNZ Harness: promote to C from HRNZ fields/meeting pages.

### South Africa

- NHRA: regulator/index source; use as supporting authority source, not final D coverage.
- 4Racing: promote to C from racing/calendar/racecard pages.
- Gold Circle: promote to C from racing calendar pages.

### South Korea

- KRA: promote to C from official race schedule/race information pages.

## Priority order

1. Promote Australia and New Zealand first because their official pages expose calendar/fields navigation clearly.
2. Promote Canada next using Woodbine and Standardbred Canada.
3. Promote South Africa using Gold Circle and 4Racing, while treating NHRA as supporting source.
4. Promote US by source family. Equibase and USTA may require parser or access handling, but they should not remain D long term.
5. Promote South Korea after confirming stable KRA schedule URLs and parser path.

## Product implication

If a system remains D, the user-facing site should not imply that the country has no usable racing calendar.

It should say internally: source target exists, extraction pending.

Public pages should show C or better whenever an official meeting date/racecourse source exists.

## Next PR work after PR-107

PR-108 should not add more D-only files.

PR-108 should promote at least one D country group to C using official calendar or fields rows.

Recommended PR-108 target:

- Australia Thoroughbred and Harness Australia to C
- New Zealand Thoroughbred and Harness to C

This creates the pattern for promoting the remaining D systems.
