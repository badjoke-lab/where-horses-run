# Calendar presentation/state implementation audit — 2026-09-08

Status: reviewed implementation audit  
Work ID: `WHR-CAL-PRESENTATION-STATE-001`  
Authority: `docs/specs/calendar-meeting-state-stream-and-view-2026-09-08.md`  
Base main: `cd9ef4264012abc5519d7de23fd4837bd2cc2a15`

## Scope

This audit compares the current implementation to the 2026-09-08 Calendar state/stream/view contract before runtime changes.

No acquisition, canonical record, reviewed rank, source authority, racecourse coordinate, or publication-boundary changes are authorized by this audit.

## Findings

### A. Meeting lifecycle — defect confirmed

`src/lib/timetable/meetingLifecycleState.mjs` currently derives `calendarDayState` from:

```text
displayedDate
current date in selected displayTimeZone
```

and short-circuits to `ended` or `future` before applying the source/venue race-time instants.

Therefore the selected display timezone can change lifecycle classification for the same meeting/current instant. This violates the active contract.

Required correction:

- source meeting date + source/venue timezone + reviewed race times determine lifecycle instants;
- selected display timezone may determine projected text/grouping only;
- display-timezone changes must not change lifecycle truth.

### B. Duplicate lifecycle implementation — drift risk confirmed

`src/components/TimetableMeetingList.astro` contains its own `setMeetingState()` implementation using source-local instants, while `src/components/MeetingStatePolicy.astro` separately calls `deriveMeetingLifecycleState()` and can overwrite row state.

The two implementations currently encode different authority rules.

Required correction:

- one shared lifecycle evaluator is authoritative;
- presentation components call that evaluator instead of maintaining a second lifecycle algorithm.

### C. Cross-midnight — current behavior is implicit

Both lifecycle paths currently add 24 hours whenever a parsed last-race instant is earlier than the first-race instant.

The current public row model does not expose a reviewed explicit end-date/rollover field. Treating every `last < first` case as a verified next-day meeting is therefore an implicit assumption.

Required correction for this Work ID:

- do not invent rollover evidence in UI code;
- if source timing cannot unambiguously represent the end instant, fail closed to neutral/unknown lifecycle state;
- a future data-model extension can add explicit reviewed rollover/end-date evidence.

### D. Official-stream separation — mostly correct, wording/state cleanup required

Current rows already keep `data-meeting-state` and `data-stream-state` separate.

`CalendarFilters.astro` binds event-specific detector states to `event_date === sourceDate`; mismatched event dates become `unknown`. Fetch failure also clears current payload to an empty status set. These are correct fail-closed foundations.

`CalendarLivePlayers.astro` additionally requires:

```text
configured payload
matching detector id
status === live
matching event_date
valid video id
```

before rendering a live player. This matching behavior should be preserved.

Remaining presentation issue:

- a reviewed official destination that is known but not verified live is currently labeled/filterable as `Official live available`, which can imply an active broadcast;
- UI labels should distinguish a known official stream destination from verified-live-now state.

### E. List day focus — defect confirmed

`CalendarDateNavigation.astro` currently defaults to an empty date value labeled `All 30 days` / `30日すべて`.

`src/pages/calendar/index.astro` and the Japanese page render `TimetableMeetingList` with `scope="rolling-30"`, so List initially exposes the rolling 30-day set rather than one focused day.

Required correction:

- rolling 30 days remains the browsing/window authority;
- List resolves to one focused day by default;
- the default focus is the current Calendar day in the selected display context;
- an empty focused day remains empty rather than jumping to another meeting date;
- user-selected date remains URL-backed.

### F. Month view — existing implementation can be retained

`CalendarViewControls.astro` already implements a real Month view with day buttons and meeting counts for the rolling window.

It is not necessary to create a second Month implementation. Required work is to align its date-focus semantics and labels with the new one-day List contract.

### G. Map view — existing implementation should remain the geographic view

Current Calendar pages use `CalendarMeetingMap` from the same candidate meeting records used by List/filters. No separate map-only meeting source is required.

Implementation changes must preserve shared record identity and synchronize date/filter/view state rather than inventing map overrides.

### H. Mobile density — prior improvement exists, re-verification required

Post-913/914 mobile density work already reduced nested gutters and put List before Map in mobile flow.

Because the date/view controls will change again, the 393×852 first-viewport requirement must be re-verified with actual screenshots after this Work ID. CI success alone is not acceptance.

## Implementation sequence from this audit

```text
1. make shared lifecycle evaluator source/venue-time authoritative
2. remove/neutralize duplicate lifecycle derivation in TimetableMeetingList
3. make ambiguous cross-midnight state fail closed
4. align official-stream labels with verified-live vs known-destination semantics
5. make List one-day-at-a-time while retaining rolling-30 browsing scope
6. synchronize Month/Map/date state
7. add regression checks for lifecycle × timezone and meeting × stream
8. run browser interaction checks and Representative Visual Audit
```

## Explicit non-changes

This audit does not authorize changes to:

```text
meeting acquisition
canonical/public generated meeting data
C/B/B+/A/A+ evidence or promotion
source registry/readiness
racecourse coordinates
participant/racecard/betting publication
media publication/embed permissions
automatic publication
```
