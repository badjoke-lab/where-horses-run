# Map-first UI PR plan — 2026-09-06

Status: active scoped implementation plan  
Top-level authority: `docs/project-roadmap-2026-09-06-addendum.md`  
Canonical UI specification: `docs/specs/map-first-site-ui-2026-09-06.md`

This plan governs only the map-first UI lane. Calendar acquisition/coverage/review/publication quality remains a separate active lane and may proceed independently.

## Parallel Calendar lane rule

Do not:

- pause Calendar quality work while waiting for UI;
- interpret `UI-005` as Calendar data-quality completion;
- patch missing/incorrect Calendar data in UI-only code;
- create a second Calendar/map meeting truth;
- block safe Calendar-lane merges because a UI branch is open.

When Calendar changes main, re-read/rebase the UI branch against current public meeting/view-model behavior where relevant.

## PR discipline

Every UI PR must state:

```text
Work ID
Canonical documents reviewed
Parallel Calendar state/assumptions checked
Pages/components touched
Runtime behavior changes
Mobile behavior changes
EN/JA impact
Public data boundary impact
Browser verification performed
Completion conditions
Next Work ID
```

Do not create permanent workflows/checkers when existing checks or temporary direct browser verification are sufficient.

## UI-001 — shared shell — COMPLETE

Scope: BaseLayout desktop primary navigation, compact mobile header, five-item mobile bottom navigation, `More`, language/timezone, compact footer, focus/accessibility, 44px targets.

Verified: CI/build green; EN/JA desktop/mobile browser QA green; zero overflow/page errors; More/Timezone interactions green; temporary audit closed unmerged.

## UI-002 — Home composition — COMPLETE

Scope:

- compact hero;
- `Today | Tomorrow | Next 7 days`; no `Now`;
- world map as primary content;
- timezone/legend near discovery controls;
- remove equal-weight legacy Home promo cards;
- retain map failure fallback and meeting navigation.

Verified: CI/build green; EN/JA desktop/mobile QA green; zero overflow/page errors; desktop map 638px and mobile map 422px in audit viewports; period switching green; old feature grid absent; Today's Racing / Up Next retained. Temporary audit closed unmerged.

## UI-003 — Home selected information — COMPLETE

Scope:

- selected racecourse card;
- public list-level facts only;
- race count only from public detail;
- bounded multi-meeting display;
- real racecourse/detail/Calendar links;
- normal-flow mobile dismissal.

Verified:

```text
CI/build: success
EN/JA desktop/mobile selected-card QA: success
same-selection x10: stable, no duplication
Kawasaki Next 7 days: 5 meetings -> 3 rows + remaining note
Hanshin: public-detail race count shown
Mizusawa: no public detail -> no race count
mobile normal-flow scrolling: success
horizontal overflow: 0px
page errors: 0
```

Temporary audit PR #867 closed unmerged.

## UI-004 — Today — ACTIVE

Scope:

- practical current-day page hierarchy;
- state grouping/order: racing now / later today / finished;
- timezone/country/authority/rank controls where supported by the existing public meeting set;
- map/list synchronization;
- selected card based on the same public meeting rows;
- explicit map-to-list action on mobile instead of automatic scroll;
- list-to-map focus action;
- EN/JA parity;
- no presentation-only Calendar data fixes.

Completion:

- current-day states are immediately legible;
- list and map use the same public meeting set/state calculation;
- mobile pin select does not force-scroll to list;
- explicit `View in list` scroll/focus works;
- list→map focuses the selected racecourse;
- timezone/filter changes keep map/list consistent;
- EN/JA desktop/mobile browser interaction QA passes;
- zero horizontal overflow and no page errors.

## UI-005 — Calendar presentation

Scope: date hierarchy, List/Map, List-first mobile, compact mobile filters, selected-date authority, URL state for date/view/tz and stable filters where useful.

Completion: date changes update List/Map consistently; mobile initial view is List; back/share restores core state; no claim of Calendar data-quality completion.

## UI-006 — Racecourses index

Scope: primary racecourse discovery, search by identity/place, reviewed country/authority/type filters where supported, concise reviewed location/upcoming context.

## UI-007 — racecourse detail

Scope: identity/locality, high-zoom map, verified location, Today or next meeting, bounded upcoming meetings, reviewed Course/Profile facts, Official Sources, one-column mobile order.

## UI-008 — secondary surfaces

Scope: Countries, Racing Types, Glossary, Sources, About simplification/demotion while keeping them reachable and useful.

## UI-009 — final UI audit

Scope: EN/JA parity, desktop/tablet/mobile QA, visible interaction browser QA, production verification, no speculative content.

Required interaction matrix includes Home period/timezone/cluster/pin/card scroll; Today pin/list/timezone/state; Calendar date/List/Map/filter/URL/back; racecourse high-zoom/fallback; mobile bottom nav/More/44px/no sticky selected card.

## Current execution pointer

```text
Current UI after UI-003 merge: UI-004
Then UI: UI-005 -> UI-006 -> UI-007 -> UI-008 -> UI-009
Parallel Calendar quality lane: active independently throughout
```

After each merge, compare the implementation with the canonical UI specification and active roadmap before starting the next Work ID. Also check current main for Calendar-lane changes affecting the public meeting/view model. If implementation decisions change agreed UI, update the canonical documents rather than silently drifting.
