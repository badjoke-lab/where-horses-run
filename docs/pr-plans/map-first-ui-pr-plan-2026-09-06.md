# Map-first UI PR plan — 2026-09-06

Status: active scoped implementation plan  
Top-level authority: `docs/project-roadmap-2026-09-08-addendum.md`  
Canonical UI specification: `docs/specs/map-first-site-ui-2026-09-06.md`

This plan converts the active roadmap Work IDs into bounded implementation PRs. PR numbers are not preassigned. Do not infer execution state from historical PR-plan numbering.

## Parallel Calendar lane rule

This PR plan governs only the map-first UI lane. Calendar acquisition/coverage/review/publication quality remains a separate active lane under the canonical Calendar documents and may proceed independently while `UI-001`–`UI-009` are in progress.

Do not:

- pause Calendar quality work while waiting for a UI PR;
- interpret UI presentation completion as Calendar data-quality completion;
- patch missing/incorrect Calendar data in UI-only code;
- create a second Calendar/map meeting truth to make the UI look complete;
- block safe Calendar-lane merges merely because a UI branch is open.

When Calendar work changes main, re-read/rebase the UI branch against current public meeting/view-model behavior before merge where relevant.

Latest main checked before `UI-006`:

```text
b6879d0074d06f8e4aadbb7f31138634208757cd  fix: restore Calendar rank-aware state and locale display (#920)
4364e0131cda90866a8112eb9a36a24f07059cef  docs: add Calendar display correction authority (#919)
62949568a2e17a2e723a439bca77d05fa2ee5991  fix: correct Calendar lifecycle, stream state, and day-focused views (#918)
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

Status: **complete**. Final Calendar presentation correction merged in PR `#920` as `b6879d0074d06f8e4aadbb7f31138634208757cd` after the state/view and authority updates in PRs `#918` and `#919`.

Scope:

- date navigation hierarchy;
- List/Month/Map switch;
- List-first mobile mode;
- compact mobile filter control;
- selected-date authority;
- URL state for date/view/timezone and stable filters where appropriate;
- source-local lifecycle truth separated from display timezone;
- exact-date fail-closed official-stream state;
- B+ evidence boundary for precise current-day state;
- B/C current-day `Today meeting / 本日開催` presentation;
- reviewed locale-aware racecourse/country/authority names;
- redundant stream-live presentation removed.

Completion evidence:

- changing date updates List and Map consistently;
- desktop List/Month/Map state explicit and usable;
- mobile initial mode List;
- mobile filters compact;
- back/share navigation reproduces core date/view/timezone state;
- no second Calendar/map meeting truth introduced;
- exact verified stream uses `● Live now` / `● 公式配信中` without detector-derived direct watch URLs;
- same-href stream/site actions remain separate semantic actions;
- B+/A/A+ use precise state only with sufficient timing evidence while B/C current-day uses `Today meeting / 本日開催`;
- EN/JA desktop/mobile Representative Visual Audit passed;
- 393×852 first List viewport contains an actual meeting row when meetings exist;
- exact merge SHA post-merge validation and Cloudflare Pages deployment passed.

Calendar data defects remain routed to the parallel Calendar lane instead of being cosmetically hidden in UI code.

## UI-006 — Racecourses index

Status: **current active Work ID**.

Scope:

- elevate Racecourses to a primary discovery page;
- search by reviewed racecourse/place identity and reviewed aliases;
- country filter;
- authority filter where a reviewed venue-to-authority relation is available;
- racing-type filter when supported by reviewed data;
- keep lower-priority profile filters secondary rather than giving every field equal weight;
- concise result presentation based on reviewed identity, locality, and reviewed current-window meeting context when available;
- use the shared reviewed EN/local/JA racecourse-name registry introduced by the completed Calendar correction;
- preserve Latin/English fallback when no reviewed Japanese name exists;
- no runtime transliteration or generated hybrid Japanese names;
- EN/JA parity and information-dense responsive behavior.

Required implementation order:

```text
1. re-read authority/spec/current main
2. audit current racecourse directory data and existing filter UI
3. connect shared reviewed display-name resolver
4. add only evidence-backed authority/current-window context
5. restructure desktop results for dense place discovery
6. restructure mobile controls so search/results appear early; collapse secondary filters
7. preserve URL-backed search/filter state
8. extend existing validation rather than creating redundant CI
9. browser-check EN/JA desktop + 393×852 mobile + intermediate width
10. Representative Visual Audit when available
11. merge only after actual screenshots/interactions are inspected
```

Completion:

- users can discover racecourse pages without navigating through Countries;
- primary search accepts reviewed aliases without displaying every alias;
- country/authority/type filters do not invent unsupported venue metadata;
- result cards/rows prioritize stable identity and location over decorative imagery;
- reviewed current-window meeting context is shown only when a public meeting record exists;
- Japanese racecourse names follow the shared reviewed-name policy;
- first mobile viewport reaches actual search/result content rather than being consumed by hero/filter chrome;
- no horizontal overflow at 393×852;
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
Calendar: date change, List/Month/Map, filters, URL/back behavior
Racecourses: search, country/authority/type filters, URL restoration, reviewed-name aliases
Racecourse: high-zoom map + failure fallback
Mobile: bottom nav, More, 44px controls, no sticky selected card
```

## Current execution pointer

```text
Current UI: UI-006
Then UI: UI-007 -> UI-008 -> UI-009
Parallel Calendar quality lane: active independently throughout
Current main reviewed before UI-006: b6879d0074d06f8e4aadbb7f31138634208757cd
Completed Calendar presentation correction: WHR-CAL-PRESENTATION-STATE-001
```

After each merge, compare the implementation with the canonical UI specification and active roadmap before starting the next Work ID. Also check current main for Calendar-lane changes that affect the public meeting/view model. If the implementation decision changes the agreed UI, update the canonical documents rather than silently allowing drift.
