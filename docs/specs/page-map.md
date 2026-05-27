# Page map specification

Status: draft  
Scope: v0 static MVP and later Alpha timetable pages

This document defines the initial URL structure and page responsibilities for Where Horses Run / 競馬どこ？.

The site is static-first. Every page should be renderable from `data/static/` and optional `data/generated/` files.

---

## 1. URL principles

### 1.1 English root and Japanese subpath

English is the root locale.

```text
/
/calendar/
/countries/
/tracks/
/glossary/
```

Japanese uses `/ja/`.

```text
/ja/
/ja/calendar/
/ja/countries/
/ja/tracks/
/ja/glossary/
```

### 1.2 Slugs

All route slugs should be lowercase kebab-case.

```text
/countries/hong-kong/
/tracks/sha-tin/
/glossary/harness-racing/
```

### 1.3 No translated slugs in v0

Use the same slug across locales.

```text
/countries/japan/
/ja/countries/japan/
```

Do not use:

```text
/ja/countries/日本/
```

### 1.4 Trailing slash

Use trailing slashes for public URLs.

```text
/countries/japan/
```

---

## 2. Initial MVP routes

```text
/
/ja/

/calendar/
/ja/calendar/

/countries/
/ja/countries/
/countries/[country]/
/ja/countries/[country]/

/tracks/
/ja/tracks/
/tracks/[track]/
/ja/tracks/[track]/

/glossary/
/ja/glossary/
/glossary/[term]/
/ja/glossary/[term]/

/archive/
/ja/archive/

/sources/
/ja/sources/

/about/
/ja/about/

/disclaimer/
/ja/disclaimer/
```

---

## 3. Navigation groups

Primary navigation:

```text
Today
Calendar
Countries
Tracks
Glossary
Sources
```

Secondary navigation:

```text
Archive
About
Disclaimer
```

Japanese labels are provided by i18n dictionaries, not hardcoded in page templates.

---

## 4. Home page

Routes:

```text
/
/ja/
```

Purpose:

- Explain the site purpose quickly
- Show today’s racing worldwide
- Link to calendar, countries, tracks, glossary, and sources
- Display data freshness and disclaimer summary

Required sections:

```text
Hero
Today’s racing worldwide
Coverage explanation
Featured countries or regions
Glossary entry points
Official-source disclaimer
```

Data sources:

```text
data/static/countries.json
data/static/racecourses.json
data/generated/today.json
data/generated/fetch-status.json
```

Fallback behavior:

- If generated data is missing, show static country/track links.
- If today’s data is stale, show a stale badge and official source links.
- Do not show empty page states without explanation.

---

## 5. Calendar page

Routes:

```text
/calendar/
/ja/calendar/
```

Purpose:

- Show today, tomorrow, and upcoming racing dates
- Allow region, country, race type, coverage, and freshness filtering
- Link to track and official source pages

Required sections:

```text
Date controls
Today
Tomorrow
Next 7 days
Region filter
Race type filter
Coverage / Auto filters
Timetable cards
```

Timetable card minimum fields:

```text
Country
Racecourse
Local date
Timezone
Race count if available
First race time if available
Official source link
Freshness badge
```

Race-level rows may include:

```text
Race number
Local start time
User/JST time display if available
Official detail URL
Coverage Level
```

Prohibited fields:

```text
entries
odds
results
payouts
full racecards
```

---

## 6. Countries index

Routes:

```text
/countries/
/ja/countries/
```

Purpose:

- Provide the global country/jurisdiction index
- Show active, under review, special, excluded, and archive status clearly
- Make long-tail coverage understandable

Required filters:

```text
Region
Status
Racing type
Coverage Level
Auto Level
Search
```

Country card fields:

```text
Country name
Local name if useful
Region
Status
Racing types
Coverage Level
Auto Level
Official source count
```

Do not hide low-coverage countries. Use clear labels instead.

---

## 7. Country detail page

Routes:

```text
/countries/[country]/
/ja/countries/[country]/
```

Purpose:

- Explain the country’s racing profile
- List major tracks
- Show today/upcoming meetings if available
- Link to official sources
- Explain coverage limitations

Required sections:

```text
Country header
Coverage / Auto badges
Racing types
Today / upcoming meetings
Major tracks
Official sources
Coverage notes
Related glossary terms
```

Fallback behavior:

- If no timetable exists, show official source links.
- If country is under review, show under-review explanation.
- If country is archive, link to archive page.

---

## 8. Tracks index

Routes:

```text
/tracks/
/ja/tracks/
```

Purpose:

- Provide racecourse index
- Support country, status, race type, and coverage filters

Required filters:

```text
Country
Region
Status
Racing type
Coverage Level
Search
```

Track card fields:

```text
Track name
Country
City if available
Racing types
Status
Official link
Today meeting status if available
```

---

## 9. Track detail page

Routes:

```text
/tracks/[track]/
/ja/tracks/[track]/
```

Purpose:

- Show track profile
- Show race-day timetable when available
- Link to official track/source pages
- Hold future illustrative PNG image slot

Required sections:

```text
Track header
Country and city
Timezone
Racing types
Illustrative image frame if available or planned
Today / upcoming timetable
Official sources
Coverage notes
Related glossary terms
```

Image rules:

- Track images are illustrative unless explicitly stated otherwise.
- Show caption: `Illustrative image. Not an official venue photo.`
- Japanese caption: `説明用のイメージ画像です。公式写真ではありません。`

Fallback behavior:

- If no timetable exists, show official source link.
- If source fetch failed, show FetchStatus and fallback link.

---

## 10. Glossary index

Routes:

```text
/glossary/
/ja/glossary/
```

Purpose:

- Explain racing terms, race types, roles, horse types, and official-site terms
- Make non-major racing categories understandable

Required filters:

```text
Category
Related racing type
Image status
Search
```

Glossary card fields:

```text
Term
Japanese term if available
Category
Short summary
Image status
Related terms
```

Initial entries:

```text
Thoroughbred racing
Harness racing
Trotting
Pacing
Arabian racing
Quarter Horse racing
Banei racing
Racecourse
Meeting
Racecard
Post time
Fixture
Jockey
Driver
Trainer
```

---

## 11. Glossary detail page

Routes:

```text
/glossary/[term]/
/ja/glossary/[term]/
```

Purpose:

- Explain one concept clearly
- Show related countries/tracks/terms
- Hold one or more explanatory PNG image slots

Required sections:

```text
Term header
Category
Plain-language explanation
How it appears on official racing sites
Related countries
Related tracks if applicable
Related terms
Explanatory image frame if available or planned
```

Image rules:

- Final explanatory images are PNG, not SVG.
- Initial placeholder/image-plan metadata is allowed.
- Alt text is required when an image exists.

---

## 12. Archive page

Routes:

```text
/archive/
/ja/archive/
```

Purpose:

- List former racing jurisdictions and closed/ended racing contexts
- Explain why they are not shown in active calendars

Initial archive entries:

```text
Singapore
Macau
Greece
```

Archive card fields:

```text
Name
Former racecourse if available
Last meeting date if available
Archive status
Reference/official link
```

---

## 13. Sources page

Routes:

```text
/sources/
/ja/sources/
```

Purpose:

- Show official and supporting sources used by the site
- Make coverage and risk transparent

Source card fields:

```text
Source name or ID
Country
Racecourse if applicable
Source type
Data type
Auto Level
Terms risk
Official URL
Fallback URL if available
```

Do not expose internal parser implementation details on public pages unless useful.

---

## 14. About page

Routes:

```text
/about/
/ja/about/
```

Purpose:

- Explain the project and badjoke-lab ownership
- Explain that it is an index/guide, not a betting or prediction site

Required sections:

```text
What this project is
What this project is not
Why official links matter
Coverage philosophy
```

---

## 15. Disclaimer page

Routes:

```text
/disclaimer/
/ja/disclaimer/
```

Purpose:

- State data limitations
- State no entries/odds/results/payouts republishing
- State official source confirmation requirement
- State image disclaimer

Required statements:

```text
This site does not republish entries, odds, results, or payouts.
Race details are linked to official sources whenever available.
Timetables may be delayed, incomplete, or changed.
Images are illustrative unless otherwise stated.
Venue images are not official photos.
```

---

## 16. Locale behavior

### 16.1 Required v0 locales

```text
en
ja
```

### 16.2 Future locales

Prepared but not required in v0:

```text
zh-hant
ko
fr
es
```

### 16.3 Missing translation behavior

If a field is missing in Japanese:

1. show Japanese UI labels
2. show English data text
3. do not machine-translate at runtime
4. keep the page usable

---

## 17. SEO and metadata rules

Every public page should have:

```text
title
description
canonical URL
hreflang for available locales
basic Open Graph metadata
```

Do not claim complete global coverage on pages that include under-review or link-only jurisdictions.

Use wording such as:

```text
Global horse racing calendar, timetable, official-source index, and glossary.
```

Avoid wording such as:

```text
Complete worldwide racecards
All horse racing data
Live odds and results
```

---

## 18. Mobile behavior

Mobile-first constraints:

- single column layout
- filters collapse into disclosure sections
- timetable rows become stacked cards
- official links are large enough to tap
- coverage badges stay visible
- no essential data should require horizontal scrolling

Timetable mobile row example:

```text
1R
Local: 12:20
Official detail
Coverage: Level 3
```

---

## 19. Initial implementation order

Implement route support in this order:

```text
1. Home
2. Countries index
3. Country detail
4. Tracks index
5. Track detail
6. Glossary index
7. Glossary detail
8. Calendar
9. Sources
10. Archive
11. About / Disclaimer
```

Calendar can render after countries/tracks/glossary exist, because it depends on those shared components.

---

## 20. Acceptance criteria

The page map is satisfied when:

- all initial MVP routes exist in English and Japanese where required
- each route has a defined data source
- each route has a fallback behavior
- country, track, glossary, source, and archive pages can render from static data
- timetable sections can render from generated data when available
- missing generated data does not break pages
- mobile layout is readable
- public wording does not imply entries, odds, results, or payouts are republished
