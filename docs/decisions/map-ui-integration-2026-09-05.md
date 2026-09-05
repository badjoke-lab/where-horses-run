# Where Horses Run — map UI integration decision

Status: active product/UI decision  
Adopted: 2026-09-05  
Applies to: Home, Today, Calendar, racecourse pages, future republished country pages

## Decision

Map UI is part of the current public navigation model. It is not a standalone future experiment and it is not a decorative image layer.

Where Horses Run will use the same reviewed racecourse identities and the same canonical/public meeting records that already drive list pages. Map presentation must not create a second meeting truth, a second rank calculation, or a second publication path.

The current public-navigation emphasis is:

```text
Home
Today
Calendar
-> racecourse detail
```

Country and broader racecourse-index map views may reuse the same location master when those pages are in the active public-navigation set. Map integration does not itself authorize re-publication of a low-quality page.

## Racecourse location master

Each public map point must resolve from a reviewed racecourse master record.

Required location fields:

```text
address (when verified and useful)
latitude
longitude
precision / verification state
location source or evidence reference
location_last_checked
```

Rules:

- Do not guess coordinates.
- Do not infer coordinates from a racecourse name at runtime.
- Do not use runtime geocoding for normal page rendering.
- Keep stable racecourse location metadata separate from changing meeting acquisition data.
- Generate any GeoJSON/map projection from the canonical racecourse master rather than maintaining a second hand-edited map dataset.
- The same location record must be reusable by Home, Today, Calendar, country, and racecourse views.

## Racecourse page behavior

A racecourse page gains a first-class `Location / Map` section alongside its existing meeting, profile/course, and official-source information.

For a single-racecourse page:

- show one verified racecourse point;
- use a high initial zoom suitable for recognizing the venue and immediate surroundings (approximately zoom 16–17 where the selected basemap supports it);
- allow normal zoom and pan up to the provider/library limit;
- do not cluster a single point;
- show the verified address/region/country context when available;
- preserve the rest of the racecourse page if the interactive map cannot load.

The map is an enhancement to the racecourse page, not the only way to access its location or meeting information.

## Today behavior

Today uses the public meetings already selected for the current date.

```text
public Today meeting records
-> list
-> map
```

The map and meeting list must stay synchronized. Selecting a map point may select/focus the corresponding meeting card; selecting a racecourse in the list may focus the map point. Neither action changes the underlying public meeting record.

## Calendar behavior

Calendar retains its existing list presentation and adds a `List / Map` view switch.

The selected date remains the authority for which meetings are shown:

```text
selected Calendar date
-> public meeting records for that date
   -> List
   -> Map
```

The map must not independently discover meetings or decide that a meeting exists.

## Home behavior

After racecourse location coverage and the shared map component are proven, Home may become map-first for the primary discovery question: where racing is taking place.

Initial filters are:

- Today;
- Tomorrow;
- Next 7 days.

The world view should plot only racecourses relevant to the selected period, not every known racecourse by default. Dense areas may use clustering. Map selection must lead back to a real racecourse/meeting route rather than a map-only information island.

Home map-first work is gated behind location-schema validation, verified location population, shared map behavior, and a working racecourse-detail implementation. A static mock or screenshot does not satisfy this gate.

## Mobile behavior

Mobile is not a scaled-down desktop popup layout.

- map remains full available width;
- tap is the primary selection action;
- essential information is not hover-only;
- selected racecourse information appears in a compact persistent card/list context outside or at the edge of the map rather than as an oversized popup covering the map;
- the ordinary list remains available and scrollable.

## Public display boundary

Map popups/cards are treated as list-level public surfaces.

They may show, when already public for the meeting:

- racecourse;
- country / authority or system context where useful;
- meeting date/state;
- public rank;
- first-race time;
- last-race time;
- racecourse or meeting-detail link;
- reviewed official-source link.

They must not expand A/A+ race-level programme rows inside the map UI. Race names, per-race times, distances, surfaces/course rows, and other A+ programme-summary fields remain subject to the existing meeting-detail boundary.

Map UI does not authorize entries/participants, horse names, jockeys, trainers, odds, results, payouts, predictions, betting advice, complete racecards, raw source bodies, embedded video, or direct stream URLs.

## Runtime-network boundary

The existing static/reviewed racing-data model remains in force.

`No runtime fetching` must be interpreted for this feature as **no runtime racing-data acquisition**. An approved map implementation may request only the resources necessary to render the basemap (for example style, tiles, glyphs, or sprites) from the selected map provider.

The map exception must never be used to fetch meeting schedules, race details, racecards, results, betting information, or other racing-source content at page runtime.

Map library/provider selection must:

- support free operation within the project's hosting/cost constraints;
- have attribution and usage terms reviewed before implementation is merged;
- avoid a design that requires a paid API key for ordinary public operation;
- preserve a useful non-map fallback when the provider or client JavaScript fails.

MapLibre GL JS is the first implementation candidate. Basemap/provider choice remains subject to implementation-time terms and attribution review rather than being hard-coded by this decision document.

## Failure and accessibility requirements

A map failure must not remove:

- meeting lists;
- racecourse names;
- racecourse links;
- official-source links;
- date navigation;
- public rank/timetable information that would otherwise be visible.

Keyboard/touch accessibility, readable selected-state presentation, reduced-motion behavior where applicable, and attribution visibility are release requirements for the shared map component.

## Implementation order

```text
MAP-001 racecourse location schema + validation
MAP-002 verified locations for currently published racecourses
MAP-003 generated map/GeoJSON projection
MAP-004 shared map component + graceful fallback
MAP-005 racecourse-detail high-zoom map
MAP-006 Today map/list synchronization
MAP-007 Calendar List/Map switch
MAP-008 Home world map + Today/Tomorrow/Next-7-days filters
MAP-009 mobile selected-racecourse interaction
MAP-010 accessibility/performance/attribution/failure QA
```

`MAP-001` through `MAP-005` are the first implementation gate. Do not begin Home map-first release work before that gate is green.

## Completion definition

Map integration is not complete because a map image is visible. The minimum functional chain is:

```text
verified racecourse coordinates
-> real interactive map
-> zoom/pan
-> racecourse selection
-> real racecourse/meeting navigation
-> same public meeting records as list views
-> graceful fallback when map rendering fails
```

## Supersession

Any older roadmap item that treats `world map / region index planning` as a distant standalone future feature is superseded by this decision for current execution. Historical entries may remain for audit history, but they are not the active product direction.
