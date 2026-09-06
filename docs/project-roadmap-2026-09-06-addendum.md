# Where Horses Run project roadmap — 2026-09-06 map-first UI addendum

Status: active canonical project-roadmap addendum  
Adopted: 2026-09-06  
Supersedes for current product/UI execution state: `docs/project-roadmap-2026-09-05-addendum.md`  
Base roadmap: `docs/project-roadmap.md`  
Canonical UI specification: `docs/specs/map-first-site-ui-2026-09-06.md`  
Map decision authority: `docs/decisions/map-ui-integration-2026-09-05.md`

This addendum updates the current public UI execution state after completion of the initial `MAP-001`–`MAP-010` integration lane and the subsequent map-status/mobile interaction fixes. It does not change reviewed Calendar acquisition/publication boundaries.

## Current stage

```text
Current stage: reviewed_incremental_maintenance
Primary product lane: map_first_site_ui
Parallel data-quality lane: calendar_quality_and_coverage
Automatic publication: disabled
Human review bypass: prohibited
```

## Parallel Calendar quality lane

The map-first UI lane does **not** replace, serialize, pause, or declare completion of Calendar quality work. Calendar remains a separate active lane and may proceed and merge independently while `UI-001`–`UI-009` are implemented.

Calendar quality/recovery continues under the canonical Calendar contracts, roadmaps, schedules, registries, acquisition-control-plane rules, and publication boundaries listed in `docs/governance/document-authority.md`.

The parallel Calendar lane is responsible for data-quality work including, as applicable:

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

`UI-005` is **Calendar presentation work only**: date hierarchy, List/Map behavior, responsive filters, URL state, and interaction design. Completing `UI-005` must not be interpreted as completing Calendar coverage, acquisition quality, rank promotion, or source reliability.

If UI work exposes a Calendar data defect, do not hide it with presentation-only data, guessed values, a second meeting truth, or a map-only override. Route the defect to the parallel Calendar lane and continue the UI lane independently where safe.

A Calendar-lane merge may change generated/public meeting data while UI work is open. UI branches must re-read/rebase against current main as needed rather than freezing Calendar progress behind UI work.

Latest parallel-lane update observed before starting `UI-004`:

```text
dfe9f31c3e1923d610096d4a5e7ad3ef9f93f0c2  data: refresh unified official rolling timetable (full)
aa237441e385a5f454705b865af1728ee08026d9  data: refresh Japan official timetable (full)
```

`UI-004` must therefore start from current main after those data refreshes rather than from the older `UI-003` branch base.

## Completed map foundation

The following foundation is treated as implemented and no longer blocks the site-wide UI refactor:

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

Subsequent fixes also established:

- Calendar-aligned map status colors;
- status-dependent point sizes;
- selection ring without replacing status color;
- clustering for dense multi-racecourse views;
- desktop hover label support;
- cooperative mobile gestures;
- selected-card dismissal by close control, selected-point re-tap, empty-map tap, and Escape;
- normal-flow mobile selected cards instead of sticky bottom-following cards.

These are implementation facts, not permission to create a second meeting/state truth.

## Current navigation authority

The primary product navigation is now:

```text
Home
Today
Calendar
Racecourses
```

Desktop exposes `Today | Calendar | Racecourses` as primary header destinations, with Home through brand/logo and secondary content through `More`.

Mobile uses:

```text
Home | Today | Calendar | Racecourses | More
```

Secondary destinations remain available but are not equal-weight primary navigation:

```text
Countries
Racing Types
Glossary
Official Sources
About
```

## Active implementation sequence

The current Work IDs are:

1. `UI-001` — shared BaseLayout/navigation/footer refactor;
2. `UI-002` — Home map-first composition and removal/demotion of old equal-weight feature cards;
3. `UI-003` — Home selected-card enrichment and Today/Up-Next summary structure;
4. `UI-004` — Today practical-state UI and mobile map/list interaction completion;
5. `UI-005` — Calendar date-driven UI, responsive filters, List-first mobile behavior, URL-state completion;
6. `UI-006` — Racecourses primary index/search UI;
7. `UI-007` — racecourse-detail map/Today/Next/Upcoming/Profile/Sources composition;
8. `UI-008` — Countries and secondary reference-page simplification/demotion;
9. `UI-009` — EN/JA desktop/tablet/mobile visual and interaction audit, then production verification.

These UI Work IDs describe only the UI lane. They do not number or replace Calendar acquisition/coverage work running in parallel.

Do not create `Now` as a fourth Home period. Home periods are fixed to:

```text
Today
Tomorrow
Next 7 days
```

Current meeting status inside `Today` communicates what is happening now.

## UI-001 — shared shell

Target result:

```text
desktop: logo | Today | Calendar | Racecourses | Search | Language | Timezone | More
mobile top: compact logo/header + menu
mobile bottom: Home | Today | Calendar | Racecourses | More
compact footer
```

Implementation status: **complete**.

Verified implementation evidence before merge:

```text
existing repository CI/build: success
EN Home desktop browser QA: success
JA Home desktop browser QA: success
EN Today mobile browser QA: success
JA Calendar mobile browser QA: success
horizontal overflow in all four cases: 0px
page errors in all four cases: 0
mobile bottom navigation: 5 items
secondary More links: preserved
Timezone -> URL state: verified
```

The temporary browser-audit workflow/PR used for this visual interaction check is closed unmerged and does not become permanent CI.

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

Remove or demote Home promotional blocks that make Countries, Racing Types, Glossary, Sources, newsletter, social-media promotion, or fabricated summary statistics equal-weight with the primary racing-discovery task.

Implementation status: **complete**.

Verified implementation evidence before merge:

```text
existing repository CI/build: success
EN Home desktop browser QA: success
JA Home desktop browser QA: success
EN Home mobile browser QA: success
JA Home mobile browser QA: success
horizontal overflow in all four cases: 0px
page errors in all four cases: 0
desktop Home map height: 638px
mobile Home map height: 422px
Today / Tomorrow / Next 7 days switching: success
legacy equal-weight Home feature grid: absent
Today's Racing and Up Next: present below the map
```

The temporary UI-002 browser-audit workflow/PR is closed unmerged and does not become permanent CI.

## UI-003 — Home information density

Selected card shows public list-level meeting/racecourse information only, including where available:

```text
racecourse
country / authority
state/date
first race
last race
race count
public rank
meeting/detail link
racecourse link
```

One venue remains one map point across multi-day periods.

Implementation status: **complete**. Merge commit: `46dc387f477ae0bb3ed2c09cca5db51f2ec5d3ca`.

Verified implementation evidence:

```text
existing repository CI/build: success
EN/JA desktop selected-card browser QA: success
EN/JA mobile selected-card browser QA: success
same racecourse selection repeated 10 times: idempotent
switching racecourse: content replaced rather than accumulated
Next 7 days bounded display: Kawasaki 5 meetings -> 3 rendered + 2 remaining note
race count source: public meeting detail timetable_rows.length only
race-count positive case: Hanshin
race-count omitted case without public detail: Mizusawa
mobile selected-card normal-flow scrolling: success
horizontal overflow: 0px
page errors: 0
```

The temporary UI-003 browser-audit PR `#867` is closed unmerged and does not become permanent CI.

## UI-004 — Today

Today becomes the practical current-day surface. It must make the following states immediately legible:

```text
racing now
later today
finished
```

Map/list remain synchronized. Mobile pin selection does not force an automatic jump to the list; explicit `View in list` may do so.

Implementation status: **active**.

Required UI-004 behavior:

```text
Today heading/date/timezone
Timezone / Country / Authority / Rank controls
map using the same filtered public meeting rows
selected card when applicable
meeting list grouped or clearly ordered by racing now / later today / finished
explicit mobile View in list action
list -> map focus action
```

Do not create a UI-only meeting truth. Runtime state continues to derive from the same meeting rows/state calculation already used by Calendar/Map.

## UI-005 — Calendar

Calendar remains selected-date authoritative.

Desktop supports List/Map and full useful filters. Mobile starts in List mode and shows Map only after explicit selection. Mobile filters should collapse into a compact filter control rather than reproduce a wide desktop toolbar.

Target URL-backed state includes:

```text
date
view
tz
```

Stable/share-worthy filters may follow.

`UI-005` changes Calendar presentation only. It neither certifies nor blocks the parallel Calendar data-quality lane.

## UI-006 — Racecourses

Racecourses is elevated to a primary navigation destination. The index is search/place driven and should prefer reviewed identity, location, authority, and upcoming-meeting context over decorative imagery.

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

Unknown facts are omitted rather than filled with placeholders or guesses.

## UI-008 — secondary pages

Countries, Racing Types, Glossary, Sources, and About remain available. Their UI should be content/reference oriented and lighter than the primary discovery surfaces.

Country pages may continue to expose authorities, today's racing, upcoming meetings, racecourses, and official sources, but large decorative tourism-style heroes and unverified aggregate statistics are not requirements.

## UI-009 — release verification

Before declaring the UI lane complete, verify at minimum:

```text
Home EN/JA desktop + tablet + mobile
Today EN/JA desktop + tablet + mobile
Calendar EN/JA desktop + tablet + mobile
Racecourses EN/JA desktop + mobile
representative racecourse detail EN/JA desktop + mobile
More/secondary navigation EN/JA mobile
```

For visible map interactions also verify:

```text
pin select
selected pin re-tap dismissal
empty-map dismissal
close control dismissal
normal page scrolling with card open
cluster expansion
timezone changes
period/date changes
list -> map focus
map -> list explicit action
map failure fallback where practical
```

Build-only success is insufficient for visible interaction changes.

## Current execution rule

Before each UI implementation PR:

1. read `docs/specs/map-first-site-ui-2026-09-06.md`;
2. read this addendum;
3. read the specific applicable page/programme contract (Calendar/racecourse/etc.);
4. confirm the parallel Calendar lane has not changed the relevant public meeting/view-model assumptions on current main;
5. compare the intended code change against those documents;
6. if the intended behavior changes the specification or schedule, update the repository documents before or in the same PR;
7. after merge, re-read this addendum and advance the current Work ID/state if the completion conditions were actually met.

Conversation history is not the execution authority.

## Current Work ID

```text
Current UI Work ID: UI-004
Next UI Work ID after completion: UI-005
Parallel Calendar lane: active independently
Current main reviewed before UI-004: dfe9f31c3e1923d610096d4a5e7ad3ef9f93f0c2
```

## Completion definition

The map-first UI lane is complete only when the shared shell, Home, Today, Calendar, Racecourses, racecourse detail, secondary navigation, responsive behavior, and EN/JA visual/interaction verification are all implemented against the canonical UI specification.

Do not call the UI lane complete merely because the map itself works. Do not call the Calendar data-quality lane complete because `UI-005` or `UI-009` is complete.