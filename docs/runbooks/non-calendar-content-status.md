# Non-calendar content status

Status: public project note  
Last updated: 2026-06-04

This note summarizes the non-calendar content architecture for Where Horses Run / 競馬どこ？.

---

## Current position

The non-calendar content layer now treats racecourses, racing types, glossary entries, source pages, and top-page discovery as connected first-class areas.

The fixed content architecture is:

```text
/
├─ /countries/
├─ /tracks/
├─ /types/
├─ /glossary/
├─ /sources/
└─ /about/
```

Japanese equivalents are available under `/ja/`.

---

## Racecourse pages

Racecourse pages use one page per racecourse:

```text
/tracks/[slug]/
/ja/tracks/[slug]/
```

They display:

- basic racecourse information
- today status
- upcoming meeting status
- upcoming race-condition empty states
- course profile fields
- distance profile fields
- notable race placeholder sections
- seasonality
- official links
- data status
- related glossary terms
- related sources

Racecourse pages do not republish entries, odds, results, payouts, tips, or full racecards.

---

## Racing type pages

Racing types are now independent navigation targets, not glossary-only entries.

```text
/types/
/types/[slug]/
/ja/types/
/ja/types/[slug]/
```

Racing type pages connect:

- the racing type explanation
- related racecourses
- related countries
- glossary context

Glossary remains separate and is used for terminology explanations.

---

## Top-page discovery

The root pages now use discovery blocks for:

- Today’s Racing
- Calendar
- Browse by Country
- Explore Racecourses
- Browse by Racing Type
- Racing Glossary
- Official Sources
- About / Data Coverage

This keeps calendar users and discovery/learning users on separate but connected paths.

---

## Header navigation

The shared header now includes:

```text
Today | Calendar | Countries | Racecourses | Racing Types | Glossary | Sources | language switch
```

`Tomorrow` remains linked from the calendar block rather than being a primary header item.

---

## Data and validation state

Racecourse data now has page-content fields for:

- surfaces
- direction
- course profile
- distance profile
- schedule summary
- seasonality
- official links
- related terms
- related sources
- data status
- image status
- course diagram status

Validation covers key racecourse page fields, allowed values, official link URLs, related glossary terms, and related source references.

---

## Pending next work

Recommended next steps:

1. Improve `/types/` pages with richer related-term and related-racecourse sections.
2. Improve `/tracks/` list filtering by country, racing type, and surface.
3. Enrich alpha racecourse profiles with verified official-source course details.
4. Add source-safe course profile references for selected racecourses.
5. Add empty-state polish for racecourse pages with no confirmed schedule rows.

Still out of scope:

- live fetching
- live parsers
- image generation
- venue photos
- entries
- odds
- results
- payouts
- tips
- full racecard redistribution
