# Where Horses Run — map-first site UI specification

Status: active canonical product/UI specification  
Adopted: 2026-09-06  
Applies to: shared navigation, Home, Today, Calendar, Racecourses, racecourse detail, Countries, Racing Types, Glossary, Sources, responsive/mobile behavior  
Related decision: `docs/decisions/map-ui-integration-2026-09-05.md`  
Active execution schedule: `docs/project-roadmap-2026-09-06-addendum.md`

This specification defines the current public UI direction. Older mocks, v0 product examples, early page-map descriptions, and pre-map navigation examples are historical when they conflict with this document.

It does not change Calendar acquisition, review, publication-rank, participant-data, betting-data, or automatic-publication boundaries.

## 1. Product role

The primary user question is:

> Where is racing taking place, and when?

The public UI therefore centers on four distinct tasks:

```text
Home        = world overview and map discovery
Today       = practical current-day racing view
Calendar    = date-driven meeting discovery
Racecourses = place-driven discovery and stable venue pages
```

Countries, Racing Types, Glossary, Sources, and About remain available as secondary information surfaces. They are not equal-weight primary navigation destinations.

## 2. Shared visual language

- background: white to very light warm/off-white;
- primary brand color: dark navy;
- accent: restrained gold for selection/emphasis, not status semantics;
- headings may use the established serif treatment;
- body text, controls, tables, filters, and status UI use sans-serif;
- prefer borders and spacing over heavy card shadows;
- do not introduce invented statistics, fabricated venue facts, decorative fake race data, or image-dependent layouts that cannot be maintained from reviewed data.

## 3. Primary status colors

Map meeting-status colors reuse Calendar meaning rather than inventing a map-only taxonomy.

```text
running / racing now       red      #c40000   10px base radius
later today / upcoming     orange   #d18a00   10px base radius
future scheduled           black    #111111    7px base radius
finished / past today      gray     #666666    9px base radius
```

Selected point behavior:

- preserve the underlying status color;
- add visible selection emphasis with a white ring / outer outline;
- enlarge the selected point by 3px over its base radius;
- do not use a separate selection color that destroys the status meaning.

Cluster points use a neutral black/white treatment and carry count meaning, not meeting-status meaning.

## 4. Shared desktop navigation

Desktop primary header:

```text
logo + Where Horses Run
Today | Calendar | Racecourses
Search | Language | Timezone | More
```

`More` contains:

```text
Countries
Racing Types
Glossary
Official Sources
About
```

Do not restore all secondary pages as equal horizontal primary-navigation items while this specification is active.

## 5. Shared mobile navigation

Top header is compact:

```text
logo + Where Horses Run | menu
```

Use a five-item bottom navigation:

```text
Home | Today | Calendar | Racecourses | More
```

`More` contains secondary pages plus Language and Timezone.

All primary touch controls must provide at least a 44px effective target.

## 6. Home

### 6.1 Role

Home answers the global discovery question quickly. The world map is a first-class primary surface, not a decorative secondary card.

### 6.2 Order

```text
compact hero
period selector
Timezone
world map
map legend
selected-racecourse card when applicable
Today's Racing summary list
Up Next
compact footer
```

### 6.3 Period selector

Only these three periods are primary:

```text
Today
Tomorrow
Next 7 days
```

There is no separate `Now` tab. `Today` already exposes current state through status colors.

### 6.4 World map

- plot only racecourses relevant to the selected period;
- use reviewed racecourse locations only;
- dense world/regional views may cluster;
- cluster click/tap expands/zooms toward constituent venues;
- desktop fine-pointer users may see a racecourse-name hover label;
- mobile does not depend on hover;
- map and list derive from the same public meeting records;
- map failure must not remove Today's Racing or ordinary navigation.

### 6.5 Selected card

List-level information may include:

```text
racecourse name
localized racecourse name when available
country / authority
meeting date/state
first race
last race
race count when public
public rank
meeting/detail link
racecourse-page link
```

For a multi-day range, one racecourse remains one map point. The selected card may show a small bounded set of relevant meetings and then link to Calendar rather than expanding indefinitely.

### 6.6 Home content reduction

Do not retain equal-weight promotional blocks for Countries, Racing Types, Glossary, Sources, newsletter, social-media promotion, or fabricated summary statistics in the main Home flow. Secondary destinations remain reachable through navigation/footer.

## 7. Today

### 7.1 Role

Today is the practical current-day work surface.

### 7.2 Structure

```text
Today heading/date/timezone
filters
map
selected card when applicable
meeting list grouped or clearly ordered by state/time
```

Relevant filters may include Timezone, Country, Authority, and Rank.

### 7.3 State presentation

The page must make it easy to distinguish:

```text
racing now
later today
finished
```

The map and list use the same public meeting set and the same state calculation.

### 7.4 Map/list synchronization

- selecting a map point selects the corresponding racecourse context;
- list-to-map action focuses the corresponding map point;
- on mobile, selecting a map point must not automatically scroll the user down to the list;
- an explicit `View in list` action may perform that scroll/focus.

## 8. Calendar

### 8.1 Role

Calendar is date-driven discovery across the current rolling 30-day public window.

### 8.2 Structure

```text
Calendar heading
rolling 30-day range / optional date focus
Today shortcut
List | Map switch
Timezone / Country / Authority / Rank filters
rolling 30-day content, optionally focused to one date
```

### 8.3 Authority

The default Calendar meeting set is the current rolling 30-day public window after active public filters. A selected date is optional, not required.

`date=YYYY-MM-DD` narrows that same rolling-window set to one day for a focused view. Clearing the date returns to the full rolling 30-day view. Home or other pages may link into Calendar with a date focus, but that must not change the default Calendar contract.

List and Map are two presentations of the same currently filtered meeting set. Do not create a separate selected-date-only Calendar truth or force an initial `date` parameter when none was requested.

### 8.4 Mobile

- initial mode is List;
- Map renders only when the user selects Map;
- switching back to List removes the large map surface from the immediate content flow;
- filters should collapse into a compact expandable/filter control rather than forcing a wide desktop toolbar onto mobile.

## 9. Racecourses index

Racecourses is a primary navigation destination.

The page is place-driven, with search/filtering as the primary interaction:

```text
Search racecourse
Country
Authority
Racing type when useful
racecourse results
```

A result should prefer stable reviewed identity/location/upcoming-meeting information over decorative imagery.

## 10. Racecourse detail

### 10.1 Order

```text
racecourse identity
country / authority / locality / timezone
single-venue high-zoom location map
verified location text
Today state or next-meeting state
Upcoming meetings (bounded, approximately 5–10)
Course/Profile fields when reviewed
Official Sources
related/secondary navigation when useful
```

### 10.2 Location map

- one reviewed venue point;
- no cluster;
- high initial zoom suitable for recognizing the venue/immediate surroundings;
- normal zoom and pan;
- verified address/locality only;
- no guessed coordinates or runtime geocoding;
- page content remains useful if the map fails.

### 10.3 Today/next meeting

When racing today, show public meeting information such as first/last race, race count, rank, and meeting-detail link when available.

When not racing today, show the next public meeting rather than an empty decorative panel.

### 10.4 Course profile

Display only reviewed available facts. Do not create placeholder cards merely to fill a visual grid. Unknown circuit length, straight length, width, elevation, track record, phone, or similar fields are omitted unless reviewed data exists.

## 11. Countries and country detail

Countries remains a secondary destination.

The index favors a concise searchable/list structure grouped by region or alphabetically. Do not make large unverified global counts or photo-card tourism presentation the product focus.

Country detail may show:

```text
country identity
relevant authorities
Today's Racing
Upcoming
Racecourses
Official Sources
```

## 12. Racing Types, Glossary, Sources

These remain secondary information tools:

- Racing Types: concise reference/dictionary presentation;
- Glossary: search + A–Z/reference behavior;
- Sources: authority/source trust and methodology information.

They are not promoted as equal-weight Home feature cards.

## 13. Search

Initial shared search scope should prioritize:

```text
Racecourses
Countries
```

Do not expand search scope merely for visual completeness before the underlying content quality supports it.

## 14. Timezone and language

- EN and JA share the same information architecture and component behavior;
- Home, Today, and Calendar use the selected display timezone consistently;
- racecourse detail prioritizes venue-local context and may additionally expose the user's display timezone where useful;
- timezone changes must not create a second meeting/state truth.

## 15. Mobile map behavior

Mobile map behavior is not a scaled-down desktop popup.

### 15.1 Map size and gesture behavior

- map uses full available content width;
- typical map height should remain practical on a phone, approximately 320–420px depending on viewport;
- cooperative gesture behavior should prevent ordinary page scrolling from being trapped unnecessarily by the map;
- pinch/zoom and explicit zoom controls remain available;
- map hit areas are at least 44px even when visual points are smaller.

### 15.2 Selected card

The selected card appears directly after the map in normal document flow.

It must not use a sticky bottom-following behavior that causes unnatural page scrolling.

Dismissal paths:

```text
visible close control in the card
re-tap the selected point
tap empty map background
Escape for keyboard users
```

Dismissing the card also clears the selected-point ring/state.

The close control must remain visibly placed and have at least a 44px effective touch target.

## 16. URL/state behavior

Where practical, user-visible discovery state should survive navigation/share/back behavior.

Home target state:

```text
period=today|tomorrow|next7
tz=<IANA timezone>
```

Calendar target state:

```text
view=list|map
tz=<IANA timezone>
date=YYYY-MM-DD   # optional one-day focus; absent = rolling 30-day view
```

Additional filters may be URL-backed when they are stable/share-worthy and do not complicate the public data model.

## 17. Footer

Use a compact footer focused on durable navigation/legal/source information. Newsletter and social-media blocks are not required product UI and should not be retained merely because older mocks contained them.

## 18. Failure and data boundaries

Map failure must not remove ordinary list access, meeting information, racecourse links, date navigation, or reviewed official-source links.

Runtime map fetching is limited to approved rendering resources plus the generated local reviewed-location projection. Runtime racing-data acquisition remains prohibited.

The UI must never introduce participant, horse, jockey, trainer, odds, result, payout, prediction, betting, complete-racecard, raw-source, embedded-video, or direct-stream data outside the existing explicit public contracts.

## 19. Responsive verification matrix

Every major UI implementation unit must be checked in EN and JA at minimum for:

```text
desktop
mobile
```

And where the unit affects shared layout/navigation, additionally verify a tablet/intermediate width for wrapping/overflow regressions.

Visible interaction changes require browser-level verification of the actual interaction, not build-only success.

## 20. Implementation authority

Implementation work must read this specification and `docs/project-roadmap-2026-09-06-addendum.md` before changing public UI.

If an implementation reveals that this specification should change, update the specification and active schedule in the same PR or in a preceding documentation PR. Do not silently diverge from the repository documents based only on conversation history.
