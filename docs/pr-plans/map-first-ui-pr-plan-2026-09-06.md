# Map-first UI PR plan — 2026-09-06

Status: active scoped implementation plan  
Top-level authority: `docs/project-roadmap-2026-09-06-addendum.md`  
Canonical UI specification: `docs/specs/map-first-site-ui-2026-09-06.md`

This plan converts the active roadmap Work IDs into bounded implementation PRs. PR numbers are not preassigned. Do not infer execution state from historical PR-plan numbering.

## Parallel Calendar lane rule

This PR plan governs only the map-first UI lane. Calendar acquisition/coverage/review/publication quality remains a separate active lane under the canonical Calendar documents and may proceed independently while `UI-001`–`UI-009` are in progress.

Do not:

- pause Calendar quality work while waiting for a UI PR;
- interpret `UI-005` as Calendar data-quality completion;
- patch missing/incorrect Calendar data in UI-only code;
- create a second Calendar/map meeting truth to make the UI look complete;
- block safe Calendar-lane merges merely because a UI branch is open.

When Calendar work changes main, re-read/rebase the UI branch against current public meeting/view-model behavior before merge where relevant.

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

Do not create new workflows/checkers merely to satisfy this plan when existing checks can be extended or direct browser verification can be done without permanent CI bloat.

## UI-001 — shared shell

Scope:

- `BaseLayout` desktop primary navigation;
- compact mobile header;
- five-item mobile bottom navigation;
- `More` secondary navigation;
- language/timezone placement;
- compact footer;
- preserve accessibility, focus, and 44px touch targets.

Primary navigation target:

```text
Desktop: Today | Calendar | Racecourses
Mobile: Home | Today | Calendar | Racecourses | More
```

Secondary destinations:

```text
Countries
Racing Types
Glossary
Official Sources
About
```

Completion:

- EN/JA desktop and mobile shell renders without overflow;
- primary/secondary navigation matches the canonical UI spec;
- existing public routes remain reachable;
- footer no longer promotes newsletter/social blocks as required product UI.

## UI-002 — Home composition

Scope:

- reduce hero height/content;
- keep `Today | Tomorrow | Next 7 days`; no `Now` tab;
- move world map to the primary content position;
- keep timezone and legend adjacent to discovery controls;
- remove/demote equal-weight legacy Home promotional cards;
- retain map failure fallback and ordinary meeting navigation.

Completion:

- map is visually primary on desktop and mobile;
- Today's Racing and Up Next remain available below the map;
- secondary informational destinations are not equal-weight Home feature cards.

## UI-003 — Home selected information

Scope:

- selected racecourse card content;
- list-level meeting facts only;
- bounded multi-meeting display for Next 7 days;
- real racecourse/detail/Calendar links;
- preserve normal-flow mobile dismissal behavior.

Completion:

- card shows reviewed/public values only;
- one venue remains one point;
- repeated selection does not duplicate content/links;
- dismissal and scrolling remain natural on mobile.

## UI-004 — Today

Scope:

- practical current-day page hierarchy;
- status grouping/order;
- timezone/country/authority/rank controls where supported;
- map/list synchronization;
- explicit map-to-list mobile action rather than automatic scroll.

Completion:

- racing-now/later-today/finished states are immediately legible;
- list and map use the same public meeting set/state;
- EN/JA mobile behavior passes direct browser interaction QA.

## UI-005 — Calendar presentation

Scope:

- date navigation hierarchy;
- List/Map switch;
- List-first mobile mode;
- compact mobile filter control;
- selected-date authority;
- URL state for date/view/timezone and stable filters where appropriate.

Completion:

- changing date updates List and Map consistently;
- mobile does not force the map into the initial view;
- back/share navigation reproduces core Calendar state;
- no claim is made that Calendar coverage, acquisition quality, source reliability, or rank promotion is complete.

Calendar data defects observed during this PR are filed/routed to the parallel Calendar lane instead of being cosmetically hidden in UI code.

## UI-006 — Racecourses index

Scope:

- elevate Racecourses to a primary discovery page;
- search by racecourse/place identity;
- country/authority/type filters when supported by reviewed data;
- concise results based on reviewed identity/location/upcoming context.

Completion:

- users can discover racecourse pages without navigating through Countries;
- no decorative/fabricated racecourse facts are introduced.

## UI-007 — racecourse detail

Scope:

- identity and locality hierarchy;
- high-zoom single-point location map;
- verified location text;
- Today state or next meeting;
- bounded upcoming meetings;
- reviewed Course/Profile facts only;
- Official Sources;
- responsive single-column mobile order.

Completion:

- venue page is a useful destination from a map point;
- unknown fields are omitted rather than invented;
- map failure leaves location text/meeting/source content usable.

## UI-008 — secondary surfaces

Scope:

- Countries index/detail simplification;
- Racing Types reference layout;
- Glossary reference/search layout;
- Sources trust/methodology layout;
- About/secondary navigation cleanup.

Completion:

- secondary pages remain reachable and useful;
- they no longer dictate the Home/primary navigation hierarchy.

## UI-009 — final UI audit

Scope:

- EN/JA parity;
- desktop/tablet/mobile responsive QA;
- visible interaction browser QA;
- production verification after deploy;
- no speculative content introduced by the redesign.

Required representative interaction matrix:

```text
Home: period, timezone, cluster, pin select/dismiss, card scroll
Today: pin select, list focus, timezone/state refresh
Calendar: date change, List/Map, filters, URL/back behavior
Racecourse: high-zoom map + failure fallback
Mobile: bottom nav, More, 44px controls, no sticky selected card
```

## Current execution pointer

```text
Current UI: UI-001
Then UI: UI-002 -> UI-003 -> UI-004 -> UI-005 -> UI-006 -> UI-007 -> UI-008 -> UI-009
Parallel Calendar quality lane: active independently throughout
```

After each merge, compare the implementation with the canonical UI specification and active roadmap before starting the next Work ID. Also check current main for Calendar-lane changes that affect the public meeting/view model. If the implementation decision changes the agreed UI, update the canonical documents rather than silently allowing drift.