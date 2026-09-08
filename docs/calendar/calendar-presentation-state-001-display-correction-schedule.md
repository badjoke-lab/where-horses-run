# Calendar presentation/state display-correction schedule

Status: completed execution schedule; retained as active regression authority  
Adopted: 2026-09-08  
Base Work ID: `WHR-CAL-PRESENTATION-STATE-001` — complete  
Completed amendment Work ID: `WHR-CAL-PRESENTATION-COLOR-001`  
Completed amendment Work ID: `WHR-CAL-PRESENTATION-CONTEXT-001`  
Canonical parent schedule: `docs/project-roadmap-2026-09-08-addendum.md`  
Canonical presentation specification: `docs/specs/calendar-meeting-state-stream-and-view-2026-09-08.md`  
Canonical display/context refinement: `docs/specs/calendar-row-rank-live-localization-2026-09-08.md`

This schedule governed the Calendar presentation correction discovered after the color-state amendment: Today summary/grouping and shared Map presentation still used legacy mixed buckets even though row-level `Upcoming / 開催前` and `Today meeting / 本日開催` had already been separated. `WHR-CAL-PRESENTATION-CONTEXT-001` is now complete; the rules below remain mandatory regression authority for later UI and Calendar work.

This remains presentation-only authority. It does not change acquisition, canonical meeting truth, public rank evidence, source authority, coordinates, race-level publication, or stream-detector truth.

## 1. Previous completed work

`WHR-CAL-PRESENTATION-STATE-001` and `WHR-CAL-PRESENTATION-COLOR-001` remain historical completed units for the behavior they actually delivered:

```text
B+ evidence boundary
B/C current-day Today meeting / 本日開催 row state
List color split: Upcoming #fff9e9 vs Today meeting #fffcf4
Map marker split: upcoming #d18a00 vs today #fffcf4 + outline
stream badge simplification
reviewed EN/JA display-name layer
```

The earlier completion record did not cover Today range grouping/context semantics sufficiently. `WHR-CAL-PRESENTATION-CONTEXT-001` closed that gap.

## 2. Defect set closed by WHR-CAL-PRESENTATION-CONTEXT-001

The amendment was required to close all of these defects:

```text
Today summary combines upcoming and day-only today as `Upcoming / racing today`
JA combines them as `開催前・本日開催`
Today range can place current-day rows into `Scheduled / 今後の開催`
Today grouping reads an older meeting-state bucket instead of the shared presentation state
Today Map selected-card status can reinterpret current-day B/C
shared Map legend always shows Scheduled even on Today/current-day contexts
Map fallback can infer `upcoming` for an incomplete current-day record
Today / Tomorrow / 7 days do not have an explicit context contract
Calendar selected-today and selected-future presentation are not explicitly separated end-to-end
```

These combinations remain forbidden regressions.

## 3. Completed execution order

The amendment was executed in this order:

```text
1. re-read AGENTS / START-HERE / governance / roadmap / Calendar specs
2. update canonical context-state specification and schedule
3. update START-HERE/current authority pointers so the new amendment is discoverable
4. merge the documentation authority update before runtime changes
5. re-read the merged revised documents and current main
6. audit current Today + Calendar + Map implementation against the revised contract
7. implement one shared context-aware presentation-state resolver/consumer path
8. split Today summary counts and List headings
9. remove current-day Scheduled fallback
10. make Today/Tomorrow/7-days presentation context explicit
11. make Calendar selected-today vs selected-future presentation explicit
12. make Map marker/legend/selected card consume the same presentation state
13. remove Map-only current-day `upcoming` inference
14. extend regression validators/tests with forbidden-state assertions
15. extend Representative Visual Audit to inspect semantic headings/legends, not only layout
16. inspect EN/JA desktop + 393×852 screenshots for Today and Calendar List/Map
17. merge only after exact-head checks and visual acceptance
18. verify exact merge SHA and Cloudflare deployment
19. re-read authority before resuming UI-008
```

Do not regress by cosmetically changing labels while leaving the bucket model inconsistent.

## 4. Current-day presentation contract

For a current-day meeting:

```text
B+/A/A+ with sufficient reviewed first/last times:
  before first -> Upcoming / 開催前
  within window -> Racing now / 開催中
  after last -> Finished / 終了

B/C or day-level-only reviewed current-day meeting:
  Today meeting / 本日開催
```

A current-day B/C meeting must not fall through to `Scheduled / 開催予定` because precise lifecycle evidence is absent.

## 5. Today range contract

When `range=today`, the only valid public state groups are:

```text
Racing now / 開催中
Upcoming / 開催前
Today meeting / 本日開催
Finished / 終了
```

Forbidden:

```text
Upcoming / racing today
開催前・本日開催
Scheduled / 開催予定 as a current-day group
```

Summary counts and List group headings must be derived from the exact same visible rows and presentation-state keys.

## 6. Tomorrow and seven-day contract

Tomorrow:

```text
future meetings -> Scheduled / 開催予定
```

Seven days:

```text
current Calendar day -> current-day state model
later Calendar days -> Scheduled / 開催予定
```

Do not flatten future days into `Upcoming`.

## 7. Calendar date-focus contract

Calendar selected today:

```text
Racing now / Upcoming / Today meeting / Finished
```

Calendar selected future date:

```text
Scheduled / 開催予定
```

List and Map must apply the same selected-date context.

## 8. List colors

```text
running   -> #fff7f6
upcoming  -> #fff9e9
today     -> #fffcf4
ended     -> #f6f7f8
future    -> #ffffff
unknown   -> #ffffff
```

`#fff9e9` is precise current-day Upcoming only. `#fffcf4` is day-only Today meeting only.

## 9. Map colors and legend

```text
running   -> #c40000
upcoming  -> #d18a00
today     -> #fffcf4 + dark warm outline/ring
future    -> #111111
ended     -> #666666
```

Today Map and Calendar Map with today selected:

```text
Racing now
Upcoming
Today meeting
Finished
```

No Scheduled legend item.

Calendar Map with a future date selected:

```text
Scheduled / 開催予定
```

No current-day legend items.

Map selected-card status must equal the corresponding List presentation state.

## 10. Shared state implementation rule

The presentation layer may derive a context-aware public state once, but individual surfaces must not independently reinterpret it.

The shared consumer set is:

```text
Today summary counts
Today/List group headings
row badge/background
Calendar List
Map marker
Map legend
Map selected card
```

Underlying lifecycle truth remains separate and source/venue-local authoritative. Display timezone controls date projection/context, not lifecycle truth.

## 11. Regression gate

The implementation must fail validation if any of the following is present:

```text
literal `Upcoming / racing today`
literal `開催前・本日開催`
Today-range current-day row grouped as Scheduled
B/C current-day row grouped as upcoming from first-time-only evidence
Today Map legend contains Scheduled
Calendar selected-today Map legend contains Scheduled
Calendar selected-future Map legend contains current-day states
Map selected card disagrees with the matching List row
Map converts presentation `today` to `upcoming`
future row receives List #fff9e9 solely because its start instant is later
```

Existing stream, locale-name, direct-watch-URL, same-href stream/site, and B+ boundary regressions remain required.

## 12. Browser and visual acceptance

Minimum screenshot/browser matrix retained for regression checking:

```text
EN desktop Today List
JA desktop Today List
EN mobile 393×852 Today List
JA mobile 393×852 Today List
EN/JA Today Map
EN/JA Calendar selected-today List + Map
EN/JA Calendar selected-future List + Map
Month representative view
```

The reviewer must inspect semantic content, not only artifact existence or overflow values.

Required visual observations:

```text
Upcoming and Today meeting have separate headings and counts
#fff9e9 and #fffcf4 are visibly distinct
no current-day Scheduled heading on Today
Today/current-day Map legend has no Scheduled
future Calendar Map uses Scheduled and no current-day states
Map selected card matches List row state
EN/JA semantics are equivalent
393×852 has no horizontal overflow
actual meeting rows remain reachable in first Today/Calendar List viewport where applicable
```

## 13. Documentation/re-read discipline

For this completed amendment and all later Calendar-visible work:

1. begin with `AGENTS.md` and `START-HERE.md`;
2. re-read governance, top-level roadmap/addendum, parent Calendar spec, this refinement, and this schedule;
3. after any behavior/acceptance change, update the canonical docs before runtime work;
4. after main moves, re-read the applicable docs and compare the implementation again;
5. re-read immediately before PR creation/material update and before merge;
6. after merge, re-read the current Work ID and next Work ID before continuing.

## 14. Completion evidence for WHR-CAL-PRESENTATION-CONTEXT-001

All completion conditions were satisfied:

```text
canonical docs merged first
START-HERE/current authority pointers synchronized
runtime uses the shared context-aware presentation state
Today mixed upcoming/today heading removed
Today current-day Scheduled fallback removed
Today/Tomorrow/7-days behavior matches the contract
Calendar today/future behavior matches the contract
List/Map/legend/selected card agree
validators lock forbidden combinations
Representative Visual Audit passes
screenshots manually inspected
exact PR head used for merge
exact merge SHA checks pass
Cloudflare deploys the exact merge commit successfully
```

Accepted runtime head: `ab86cbc532755b093c6ac07bef63aa75f0611190`.  
PR-head Race Acquisition Check: `34228907381` — success.  
PR-head Representative Visual Audit: `34228907434` — success.  
Accepted screenshot artifact: `10057027665` — manually inspected for EN/JA desktop and 393×852 Today/Calendar List/Map semantics.  
Squash merge: PR #927 -> `cf1a010765e9d012f40b168506ae3d7f6959d65b`.  
Post-merge Race Acquisition Check: `34229426401` — success.  
Post-merge Representative Visual Audit: `34229426431` — success.  
Cloudflare Pages deployment: `bdb0222f-f0c3-43d2-88f3-ea96c902bdd6` — success for exact merge commit.

`UI-008` is unblocked. Resume it from current `main` after this completion-state synchronization, while Calendar country/authority coverage expansion and all-tier racecourse inventory/ledger work continue independently.
