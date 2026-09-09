# Country + Racecourse integrated publication specification

Status: active canonical product specification  
Adopted: 2026-09-09  
Applies to: Countries, Racecourses, Calendar linkage, Map linkage, search/sitemap/internal navigation

## Purpose

Where Horses Run must not grow Countries and Racecourses as disconnected thin directories. Public expansion is organised by calendar-supported country and then completed vertically through Country -> Racecourse -> Map -> Calendar links.

The internal country and racecourse masters may remain broader than the public site.

## Core rule

A new country is treated as one integrated product-expansion unit:

```text
official source / acquisition
-> calendar support
-> public country eligibility
-> active racecourse inventory for that country
-> racecourse detail pages
-> reviewed map locations
-> Country <-> Racecourse <-> Calendar links
-> search / sitemap / navigation projection
```

The work may be split across PRs, but completion is measured at country-package level.

## Country public gate

Public country visibility is not determined by whether a meeting happens to exist today. Seasonal inactivity must not make a supported country disappear.

A country is public on the primary Countries surface only when it is formally supported by the Calendar acquisition/publication system.

For a country that is not Calendar-supported:

- retain its canonical/internal data;
- do not present it as a normal public Country directory result;
- do not expose it through normal site search, sitemap, or primary internal navigation;
- do not generate a normal public detail route unless a separate historical/reference publication rule explicitly allows it.

The exact machine-readable field/name may be implemented separately, but runtime behavior must represent the stable state `calendar_supported = true|false`, not current-day meeting presence.

## Country page baseline composition

The first reference implementation is Japan. The shared Country page should remain visually consistent with the current Home and Calendar pages and use buildable existing-site components rather than bespoke illustration or external brand marks.

Baseline sections:

1. identity: country/local name and Calendar-supported state;
2. short reviewed overview;
3. compact facts: authority/system, racing types, active racecourse count, official sources;
4. today / near-term meetings using reviewed public meeting rows;
5. reviewed racecourse map for the country;
6. active domestic racecourse list;
7. official sources;
8. links into Calendar and racecourse detail pages.

Future additions are incremental. Missing optional enrichment does not block the baseline page if the required reviewed facts exist.

## Racecourse public baseline

The first reference implementation is Tokyo Racecourse. The shared Racecourse page should remain consistent with the current Home/Calendar/Country design and avoid external logos or hard-to-maintain decorative assets.

Baseline sections:

1. identity: canonical/local name;
2. status, country, authority/system, racing type, timezone where reviewed;
3. short reviewed overview;
4. current / next meeting context and recent/upcoming meeting list;
5. reviewed map location and address/location text;
6. reviewed course/profile facts when available;
7. representative races as plain text until the race master and internal race pages are ready;
8. official sources;
9. links to Country and Calendar.

Optional later enrichment includes opening/closure dates, rename/move history, course-rebuild history, complete graded-race history, historical photos, and other reviewed facts.

## Active vs historical racecourses

The all-tier racecourse master remains broader than the public site.

Active racecourses in Calendar-supported countries are the first public priority.

Closed/historical racecourses use a separate readiness concept. They may be published later when identity, country, location, operating period, closure/history evidence, names/history and other core facts are defensible. Calendar support is not required for historical publication.

## Publication boundaries

Do not invent facts to fill layout slots. Empty optional sections should be omitted or explicitly marked unavailable rather than guessed.

Do not add external organisation logos merely for presentation. Plain text authority/source labels are sufficient.

Meeting presentation remains one meeting per row and follows existing Calendar public-display rules. Country and Racecourse pages must consume the same reviewed meeting truth; they must not create a second lifecycle/rank/timezone interpretation.

Map pins must come from reviewed racecourse locations only.

Representative race names remain plain text until the graded-race master and internal race relationship model are ready.

## Expansion sequence

```text
Reference implementation
1. Japan Country page
2. Tokyo Racecourse page

Then
3. project current Calendar-supported countries into the same Country layout
4. publish their active racecourses using the shared Racecourse layout
5. for every new Calendar-supported country, expand Country + Racecourses + Map + links as one package
6. continue independent all-tier/closed-racecourse master research for later historical publication
```

## Acceptance

A country package is complete when:

- Calendar support state is explicit and stable;
- the Country page is public and correctly linked;
- the supported country's active racecourse inventory is reconciled to canonical `racecourse_id` values;
- reviewed locations are used where available and unreviewed locations are not guessed;
- active racecourse pages use the shared baseline composition;
- Country <-> Racecourse <-> Calendar links work in EN and JA;
- search/sitemap/internal navigation reflect the same public gate;
- the result visually fits the existing site rather than behaving as a separate redesign.
