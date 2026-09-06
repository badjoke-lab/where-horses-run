# Where Horses Run project roadmap — 2026-09-06 map-first UI addendum

Status: active canonical project-roadmap addendum  
Adopted: 2026-09-06  
Supersedes for current product/UI execution state: `docs/project-roadmap-2026-09-05-addendum.md`  
Base roadmap: `docs/project-roadmap.md`  
Canonical UI specification: `docs/specs/map-first-site-ui-2026-09-06.md`  
Map decision authority: `docs/decisions/map-ui-integration-2026-09-05.md`

This addendum is the current execution schedule for the public map-first UI lane. It does not change reviewed Calendar acquisition/publication boundaries.

## Current stage

```text
Current stage: reviewed_incremental_maintenance
Primary product lane: map_first_site_ui
Parallel data-quality lane: calendar_quality_and_coverage
Current UI Work ID: UI-004
Next UI Work ID: UI-005
Automatic publication: disabled
Human review bypass: prohibited
```

## Parallel Calendar quality lane

The map-first UI lane does **not** replace, pause, serialize, or declare completion of Calendar quality work. Calendar remains a separate active lane and may proceed and merge independently while `UI-001`–`UI-009` are implemented.

Calendar quality/recovery continues under the canonical Calendar contracts, roadmaps, schedules, registries, acquisition-control-plane rules, and publication boundaries listed in `docs/governance/document-authority.md`.

The Calendar lane remains responsible for, as applicable:

```text
current-to-30-day official meeting coverage
authority/source adapter completeness
published race-level detail acquisition where officially available
reviewed C/B/B+/A/A+ promotion behavior
canonical/public synchronization
completeness and mother-set gates
stale/false/missing meeting correction
timezone/date/public-display correctness
```

`UI-005` is Calendar **presentation work only**. Completing it must not be interpreted as completing Calendar coverage, acquisition quality, rank promotion, or source reliability.

If UI work exposes a Calendar data defect, do not hide it with presentation-only data, guessed values, a second meeting truth, or a map-only override. Route it to the parallel Calendar lane. If Calendar work changes main while a UI branch is open, the UI branch must re-read/rebase against current main where relevant.

## Completed map foundation

The following map foundation is treated as implemented:

```text
MAP-001 reviewed racecourse location schema
MAP-002 reviewed location population
MAP-003 generated GeoJSON projection
MAP-004 shared MapLibre map + fallback
MAP-005 racecourse-detail high-zoom map
MAP-006 Today map/list synchronization
MAP-007 Calendar List/Map switch
MAP-008 Home Today/Tomorrow/Next-7-days world map
MAP-009 mobile selected-racecourse interaction
MAP-010 accessibility/performance/attribution/failure QA
```

Subsequent fixes also established Calendar-aligned status colors, status-dependent point sizes, selection rings, dense-view clustering, desktop hover labels, cooperative mobile gestures, explicit dismissal paths, and normal-flow mobile selected cards.

These are implementation facts, not permission to create a second meeting/state truth.

## Current navigation authority

Primary product destinations:

```text
Home
Today
Calendar
Racecourses
```

Desktop primary header:

```text
Today | Calendar | Racecourses
```

Mobile bottom navigation:

```text
Home | Today | Calendar | Racecourses | More
```

Secondary destinations remain available through `More`/footer:

```text
Countries
Racing Types
Glossary
Official Sources
About
```

## Active implementation sequence

1. `UI-001` — shared BaseLayout/navigation/footer refactor — **complete**;
2. `UI-002` — Home map-first composition — **complete**;
3. `UI-003` — Home selected-card enrichment — **complete**;
4. `UI-004` — Today practical-state UI and mobile map/list interaction completion — **active**;
5. `UI-005` — Calendar date-driven UI, responsive filters, List-first mobile behavior, URL-state completion;
6. `UI-006` — Racecourses primary index/search UI;
7. `UI-007` — racecourse-detail map/Today/Next/Upcoming/Profile/Sources composition;
8. `UI-008` — Countries and secondary reference-page simplification/demotion;
9. `UI-009` — EN/JA desktop/tablet/mobile visual and interaction audit, then production verification.

These Work IDs describe only the UI lane and do not replace Calendar acquisition/coverage work.

## Home period authority

Do not create `Now` as a fourth Home period. Home periods are fixed to:

```text
Today
Tomorrow
Next 7 days
```

Current meeting status inside `Today` communicates what is happening now.

## UI-001 — shared shell

Target: desktop primary navigation, compact mobile header, five-item mobile bottom navigation, `More`, language/timezone placement, compact footer, EN/JA parity, focus/accessibility, and 44px touch targets.

Status: **complete**.

Verified before merge: existing CI/build success; EN/JA desktop/mobile Chromium success; 0px horizontal overflow; 0 page errors; five mobile nav items; `More` preserved secondary links; Timezone→URL state verified. Temporary audit PR closed unmerged.

## UI-002 — Home map-first composition

Target order:

```text
compact hero
Today | Tomorrow | Next 7 days
Timezone
world map
legend
selected card when applicable
Today's Racing
Up Next
compact footer
```

Status: **complete**.

Verified before merge: existing CI/build success; EN/JA desktop/mobile Chromium success; 0px overflow; 0 page errors; desktop Home map 638px in audit viewport; mobile Home map 422px; period switching success; legacy equal-weight Home feature grid absent; Today's Racing and Up Next retained below the map. Temporary audit PR closed unmerged.

## UI-003 — Home selected information

Selected card is limited to public/reviewed values and may show:

```text
racecourse
country / authority
state/date
first race
last race
race count when public
public rank
meeting/detail link
racecourse link
Calendar link
```

One venue remains one point across multi-day periods. The selected card renders a bounded maximum of three meetings and then links out instead of expanding indefinitely.

Status: **complete**.

Verified before merge:

```text
existing repository CI/build: success
EN Home desktop selected-card QA: success
JA Home desktop selected-card QA: success
EN Home mobile selected-card QA: success
JA Home mobile selected-card QA: success
horizontal overflow in all four cases: 0px
page errors in all four cases: 0
same-selection repeated 10 times: stable / no duplication
Kawasaki Next-7-days input: 5 meetings -> 3 rendered + 2 remaining note
Hanshin: public-detail-derived race count displayed
Mizusawa: no public detail -> race count omitted
mobile selected-card normal-flow scrolling: verified
```

Temporary UI-003 browser-audit PR #867 was closed unmerged.

## UI-004 — Today — ACTIVE

Today is the practical current-day work surface. It must make the following states immediately legible:

```text
racing now
later today
finished
```

Required structure:

```text
Today heading/date/timezone
filters
map
selected card when applicable
meeting list grouped or clearly ordered by state/time
```

Relevant filters may include Timezone, Country, Authority, and Rank where supported by the same public meeting rows.

Map and list must use the same public meeting set and the same state calculation. Selecting a map point selects the racecourse context; list-to-map focuses the point. On mobile, map selection must not automatically jump to the list; only explicit `View in list` may perform the scroll/focus.

UI-004 must not patch Calendar coverage/data defects in presentation code.

## UI-005 — Calendar presentation

Calendar remains selected-date authoritative. Desktop supports List/Map plus useful filters. Mobile starts in List mode, renders Map only after explicit selection, and collapses filters into a compact control.

Target URL-backed state:

```text
date
view
tz
```

Stable/share-worthy filters may follow. Completion of UI-005 does not certify Calendar data quality.

## UI-006 — Racecourses

Racecourses is a primary navigation destination. The index is search/place driven and should prefer reviewed identity, location, authority, and upcoming-meeting context over decorative imagery.

## UI-007 — racecourse detail

Target order:

```text
identity / locality / authority / timezone
single-venue high-zoom map
verified location text
Today or next-meeting state
Upcoming meetings (bounded)
reviewed Course/Profile facts
Official Sources
secondary/related links
```

Unknown facts are omitted rather than guessed.

## UI-008 — secondary pages

Countries, Racing Types, Glossary, Sources, and About remain available as lighter content/reference surfaces. They do not return to equal-weight primary Home/navigation status.

## UI-009 — release verification

Verify at minimum:

```text
Home EN/JA desktop + tablet + mobile
Today EN/JA desktop + tablet + mobile
Calendar EN/JA desktop + tablet + mobile
Racecourses EN/JA desktop + mobile
representative racecourse detail EN/JA desktop + mobile
More/secondary navigation EN/JA mobile
```

Visible interactions require browser-level QA, including map select/dismiss, cluster expansion, timezone/period/date changes, list↔map actions, mobile scrolling, and map failure fallback where practical.

## Current execution rule

Before each UI implementation PR:

1. read `docs/specs/map-first-site-ui-2026-09-06.md`;
2. read this addendum;
3. read the applicable page/programme contract;
4. confirm the parallel Calendar lane has not changed relevant public meeting/view-model assumptions on current main;
5. compare intended code changes against those documents;
6. update specification/schedule in the same or preceding PR if behavior changes;
7. after merge, re-read this addendum and advance the Work ID only when completion conditions are actually met.

Conversation history is not execution authority.

## Current Work ID

```text
Current UI Work ID after UI-003 merge: UI-004
Next UI Work ID after completion: UI-005
Parallel Calendar lane: active independently
```

## Completion definition

The map-first UI lane is complete only after shared shell, Home, Today, Calendar, Racecourses, racecourse detail, secondary navigation, responsive behavior, and EN/JA visual/interaction verification are all implemented against the canonical UI specification.

Do not call the UI lane complete merely because the map works. Do not call the Calendar data-quality lane complete because `UI-005` or `UI-009` is complete.
