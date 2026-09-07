# Where Horses Run — Calendar meeting-state, stream-state, and view specification

Status: active canonical Calendar presentation specification  
Adopted: 2026-09-08  
Applies to: Calendar meeting lifecycle state, display timezone projection, official-stream state, List/Month/Map presentation, responsive acceptance  
Parent UI specification: `docs/specs/map-first-site-ui-2026-09-06.md`  
Active execution schedule: `docs/project-roadmap-2026-09-08-addendum.md`

This document refines and, where explicitly stated, supersedes the Calendar presentation portions of the 2026-09-06 map-first UI specification. It does not change Calendar acquisition, review, canonical promotion, public rank, source authority, or unattended-publication rules.

## 1. Separate truths

Calendar presentation must keep these dimensions separate:

```text
meeting lifecycle state
display timezone projection
official stream state
Calendar view state
acquisition/review/publication state
```

A change in one dimension must not silently rewrite another.

In particular:

- changing the user's display timezone does not change whether the underlying meeting is upcoming, running, or finished;
- a meeting being `running` does not mean an official stream is verified live;
- a known official stream landing page does not prove that a live broadcast is active;
- List, Month, and Map are presentations of the same reviewed public meeting records, not separate meeting truths.

## 2. Meeting lifecycle authority

### 2.1 Venue/source-local canonical time

Meeting lifecycle state is calculated from the reviewed meeting identity and venue/source-local timing fields:

```text
source meeting date
source/venue timezone
first race time when available
last race time when available
```

Those fields are converted to canonical instants before comparison with the current instant.

The selected display timezone is presentation-only. It may change the date/time text shown to the user, but it must not be used as the authority that decides the meeting lifecycle state.

### 2.2 Lifecycle states

When sufficient reviewed timing data exists, the public lifecycle states are semantically:

```text
upcoming
running
finished
```

If the required timing evidence is missing, malformed, unsupported, or ambiguous, lifecycle state is unknown/neutral. The UI must fail closed rather than guess a race window.

### 2.3 Cross-midnight behavior

Do not assume that the final race instant is on the same calendar date merely because a meeting identity has one source date.

Where reviewed source data explicitly represents a meeting/race window crossing local midnight, derive start/end instants from that reviewed information and compare instants. Do not repair a date rollover by changing the display timezone or by adding an unreviewed day.

If the current public data model cannot unambiguously represent a cross-midnight end instant, keep the state neutral and route the modeling gap to Calendar data-quality work rather than inventing a value in presentation code.

## 3. Display timezone contract

The Calendar display timezone controls user-facing date/time projection and date grouping/navigation where defined by the UI. It is not the lifecycle clock.

Required invariants:

- the same meeting at the same current instant has the same lifecycle state across all supported display-timezone choices;
- changing display timezone may legitimately change displayed local date/time;
- lifecycle badges/colors must not flip solely because the selected display timezone changed;
- source/venue timezone remains available to the state evaluator even when another timezone is displayed.

## 4. Official stream-state contract

Meeting state and stream state are independent dimensions.

The public stream semantics have three states:

1. **verified live now** — the configured official detector currently verifies the expected event/source identity as live;
2. **official stream destination known, not verified live now** — a reviewed official landing page/source is known but current live verification is absent or negative;
3. **no verified official stream state available** — no reviewed/current detector result is available for this meeting.

Localized UI labels may differ, but they must preserve these semantics. Do not present state 2 or state 3 as `live`.

This specification grants no new permission to publish or embed media. Link/embed/replay behavior remains governed by the applicable public-display and media-delivery contracts.

## 5. Detector matching and fail-closed behavior

A shared detector must not leak a live result from one meeting/date/venue context into another.

At minimum, live verification must bind to the configured detector identity and expected source/event date. Where the detector payload exposes stronger event identity, use it as well.

Fail closed when any required binding is absent or mismatched, including:

```text
unknown detector id
stale/unavailable detector payload
event/source date mismatch
invalid or missing media identifier
unexpected provider response
```

A stale previous `live` response must not remain live indefinitely after verification fails.

## 6. Calendar browsing and view roles

### 6.1 Rolling 30-day browsing scope

The Calendar discovery scope remains the current rolling 30-day public meeting window after active public filters.

The 30-day window is the browsing authority, not a requirement that every view render all 30 days as a long list at once.

### 6.2 List

List is a **one-day-at-a-time meeting view** inside the rolling 30-day browsing window.

- one focused date is rendered at a time;
- the default focus is the current Calendar day in the selected display context unless an explicit supported date focus is present;
- an empty focused day shows an empty-day state rather than silently jumping to a different date;
- previous/next/day selection navigates within the rolling window;
- meeting rows remain one meeting per row.

This section supersedes the 2026-09-06 rule that the default List must render the entire rolling 30-day meeting set.

### 6.3 Month

Month is the compact date/meeting overview and navigation surface for the active rolling window. Its job is to show where meetings occur and let the user choose a date without forcing a 30-day vertical list.

Month must not become a second source of meeting facts. Counts/markers derive from the same filtered public records used by List and Map.

### 6.4 Map

Map is the geographic discovery surface for the applicable filtered Calendar set. It may show the active rolling-window context; an explicit date focus may narrow the map to that date.

Map and List must not disagree about whether a meeting exists. Map location data remains reviewed racecourse-location data and must not create map-only meeting records.

### 6.5 View switch

The primary Calendar view switch is:

```text
List | Month | Map
```

The control must be compact and must not consume most of the first mobile viewport.

## 7. Mobile information-density contract

Mobile Calendar is list-first.

For a representative 393×852 viewport when the focused date has meetings:

- the first viewport must contain actual meeting-row content, not only hero text, view controls, filters, and date controls;
- horizontal space must be used efficiently; avoid stacked/nested gutters that unnecessarily shrink rows;
- filters are collapsed/compact by default;
- long explanatory copy is reduced or moved below the primary task;
- Map is secondary and appears only after explicit Map selection;
- returning to List removes the large map surface from the immediate content flow.

Meeting rows should prioritize, in compact form, racecourse identity, authority/system context, projected time when available, public rank/state, and essential links allowed by public policy.

## 8. Desktop contract

Desktop may expose more controls at once but must still avoid large dead areas, redundant explanation, and weak grouping.

List/Month/Map, date navigation, filters, and meeting content must form a clear hierarchy. Desktop layout must not be used as justification for excessive mobile gutters or repeated toolbars.

## 9. URL/state behavior

The rolling 30-day public window remains the Calendar authority.

User-visible state may include:

```text
view=list|month|map
tz=<supported display timezone>
date=YYYY-MM-DD   # active one-day focus
```

List requires a resolved focused date for rendering, but the application does not need to force a URL rewrite merely to establish the default current-day focus. An explicit user-selected/shareable date should remain URL-backed.

Filters may remain URL-backed where already supported and stable.

## 10. EN/JA parity

English and Japanese Calendar pages use the same state model, view roles, control behavior, and responsive acceptance criteria. Localization may change labels and text length, not product semantics.

## 11. Required regression matrix

Before merging lifecycle/stream/view implementation, verify at minimum:

### Lifecycle × timezone

- upcoming meeting across every supported display timezone;
- running meeting across every supported display timezone;
- finished meeting across every supported display timezone;
- changing display timezone changes projected text without changing lifecycle state;
- missing first/last time fails closed;
- cross-midnight representable case, or explicit neutral behavior when the public model cannot represent it safely.

### Meeting × stream

- running + verified live;
- running + official destination known but not verified live;
- running + no verified stream state;
- upcoming + detector result must not be promoted to live for the wrong date;
- finished + stale prior live payload must not remain live;
- shared detector date/event mismatch fails closed.

### Views

- rolling-window bounds remain enforced;
- List renders one day only;
- Month selects/navigates dates from the same public meeting set;
- Map uses the same meeting identities as the active filtered context;
- List/Month/Map switching preserves filters/timezone/date focus as intended;
- EN/JA behavior matches.

## 12. Visual acceptance

Build-only or CI-only success is insufficient for visible Calendar changes.

Representative Visual Audit must include actual screenshots and browser interaction checks, including at minimum:

```text
EN desktop List
EN desktop Month
EN desktop Map
JA desktop representative view
EN mobile 393×852 List
EN mobile Month
EN mobile Map
JA mobile representative view
```

The reviewer must inspect the screenshots, not merely confirm that an artifact exists. On the 393×852 List screenshot, an actual meeting row must be visible in the first viewport when the focused date contains meetings.

## 13. Scope boundary

A presentation/state implementation PR under this specification must not silently alter:

```text
canonical meeting acquisition
reviewed source authority
C/B/B+/A/A+ promotion policy
public-rank evidence
racecourse coordinates
participant/racecard/betting publication rules
automatic-publication policy
```

If implementation reveals a defect in those layers, record and route it to the applicable Calendar data-quality lane instead of hiding it in UI code.
