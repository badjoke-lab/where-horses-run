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

Latest main checked before `UI-005`:

```text
c92822b610ee615c92ded605f75aea0bb3760aa6  feat(ui): implement UI-004 practical Today view
82bcd58d1d88a99f99c96467c1fa38d67fbb33fb  fix(ui): curate timezone choices and show UTC offsets
83c01a6bd11d2860dcacee85a83364f3e09285a4  data: refresh unified official rolling timetable (full)
324c4860dd863a65b174580a5a9c89c87eadf150  data: refresh Japan official timetable (full)
ebb38931560af493e3c79416bd1faf566525074b  fix(calendar): normalize stale canonical ranks across authority window
```

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

Status: **complete**.

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

Verified: existing CI/build passed; direct Chromium EN/JA desktop/mobile passed; zero horizontal overflow and page errors; More/Timezone interactions passed; temporary audit closed unmerged.

## UI-002 — Home composition

Status: **complete**.

Scope:

- reduce hero height/content;
- keep `Today | Tomorrow | Next 7 days`; no `Now` tab;
- move world map to the primary content position;
- keep timezone and legend adjacent to discovery controls;
- remove/demote equal-weight legacy Home promotional cards;
- retain map failure fallback and ordinary meeting navigation.

Verified: existing CI/build passed; EN/JA desktop/mobile passed; zero overflow/page errors; period switching passed; old feature grid absent; Today's Racing / Up Next retained. Temporary audit closed unmerged.

## UI-003 — Home selected information

Status: **complete**. PR `#866`, merge commit `46dc387f477ae0bb3ed2c09cca5db51f2ec5d3ca`.

Scope:

- selected racecourse card content;
- list-level meeting facts only;
- bounded multi-meeting display for Next 7 days;
- real racecourse/detail/Calendar links;
- preserve normal-flow mobile dismissal behavior.

Verified UI-003 evidence:

```text
existing CI/build: success
EN/JA desktop/mobile selected-card QA: success
same venue selected 10 times: idempotent
switching venue: selected content replaced
Kawasaki Next-7-days: 5 meetings -> 3 rendered + 2 remaining
race count from public detail timetable_rows.length only
Hanshin count case: passed
Mizusawa omission case: passed
mobile normal-flow scrolling: passed
horizontal overflow: 0px
page errors: 0
```

Temporary audit PR `#867` is closed unmerged.

## UI-004 — Today

Status: **complete**. PR `#875`, merge commit `c92822b610ee615c92ded605f75aea0bb3760aa6`.

Scope:

- practical current-day page hierarchy;
- racing-now/later-today/finished grouping/order;
- timezone/country/authority/rank controls;
- map/list synchronization from the same public rows;
- explicit map-to-list mobile action rather than automatic scroll;
- list-to-map focus;
- EN/JA parity.

Public timezone contract after PR `#874`:

```text
Japan — UTC+09:00
Korea — UTC+09:00
Hong Kong — UTC+08:00
UAE — UTC+04:00
Türkiye — UTC+03:00
UTC — UTC+00:00
```

Full browser IANA timezone expansion is prohibited by the Calendar dynamic-dates regression checker.

Verified UI-004 evidence:

```text
pre-merge Race Acquisition Check: success
pre-merge Calendar unified official refresh: success
EN/JA desktop browser audit: success
EN/JA mobile browser audit: success
state summary counts = visible rows: success
country/authority/rank filters -> list/map sync: success
timezone change -> list/map sync: success
reset: success
mobile pin select no auto-scroll: success
explicit Show in List focus: success
list -> map focus: success
horizontal overflow: 0px
page errors: 0
```

Temporary audit PR `#876` passed and was closed unmerged. Superseded stale PRs `#869` and `#870` are closed.

## UI-005 — Calendar presentation

Status: **current active Work ID**.

Scope:

- date navigation hierarchy;
- List/Map switch;
- List-first mobile mode;
- compact mobile filter control;
- selected-date authority;
- URL state for date/view/timezone and stable filters where appropriate.

Completion:

- changing date updates List and Map consistently;
- desktop List/Map state is explicit and usable;
- mobile initial mode is List rather than a forced map;
- mobile filters collapse into a compact control;
- back/share navigation reproduces core `date`, `view`, and `tz` state;
- stable filters are URL-backed only where they materially improve restoration/share behavior;
- no second Calendar/map meeting truth is introduced;
- no claim is made that Calendar coverage, acquisition quality, source reliability, or rank promotion is complete.

Calendar data defects observed during this PR are routed to the parallel Calendar lane instead of being cosmetically hidden in UI code.

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
Current UI: UI-005
Then UI: UI-006 -> UI-007 -> UI-008 -> UI-009
Parallel Calendar quality lane: active independently throughout
Current main reviewed before UI-005: c92822b610ee615c92ded605f75aea0bb3760aa6
```

After each merge, compare the implementation with the canonical UI specification and active roadmap before starting the next Work ID. Also check current main for Calendar-lane changes that affect the public meeting/view model. If the implementation decision changes the agreed UI, update the canonical documents rather than silently allowing drift.