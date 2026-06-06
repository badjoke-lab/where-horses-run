# Timetable public display boundary

Status: draft foundation  
Last updated: 2026-06-06

This specification defines the public display boundary for Where Horses Run timetable pages and meeting detail pages.

Where Horses Run is a static-first guide to official horse racing calendars, timetables, racecourses, racing types, glossary entries, generated schedule status, and official source links. It is not a replacement for official entries, racecards, results pages, betting pages, or video services.

The purpose of the timetable layer is to help users find known meetings, summary timing information, and the official source where complete information can be confirmed.

---

## Public rank meanings

| Rank | Public meaning | Display boundary |
| --- | --- | --- |
| `C` | Meeting date and racecourse are known. | Show meeting-level information only. Do not show race times. |
| `B` | First race time is known. | Show first race time only. |
| `B+` | First and last race times are known. | Show first race time and last race time only. |
| `A` | Race-by-race post times are known. | Show race label or race number plus post time only. |
| `A+` | Limited programme summary fields are known. | On meeting detail pages only, show race label, post time, race name, distance, surface, and course when allowed. |

A+ is a lightweight programme summary. It is not a full racecard.

Capability rank describes what verified official source information is available. It is not permission to republish every source field.

---

## List page boundary

The following pages must keep one meeting per row:

- calendar pages
- today pages
- tomorrow pages
- country pages
- racecourse pages
- current timetable pages

Meeting rows may show only these fields:

- racecourse
- country
- authority or racing system
- rank
- first race time when allowed by rank
- last race time when allowed by rank
- detail link
- official source link

A+ race-by-race programme summaries must not be expanded on list pages. Race names, distance lists, surface lists, and course lists belong only on meeting detail pages when the source policy allows them.

---

## Meeting detail boundary

Meeting detail pages may show more than list pages, but they must still stay inside the public rank boundary.

- `C`: meeting date, racecourse, country, authority, timezone, source status, and official source.
- `B`: `C` fields plus first race time.
- `B+`: `B` fields plus last race time.
- `A`: race label or race number plus post time only.
- `A+`: `A` fields plus allowed limited programme summary fields.

Use headings such as `Programme summary`, `Timetable summary`, or `Race timetable`. Avoid presenting the page as a complete `racecard`.

---

## A+ allowed fields

A+ display is limited to these fields:

- race label or race number
- post time
- race name
- distance
- surface
- course label
- official source link
- last checked date

Anything beyond this list must be added through a separate public specification before display.

---

## Forbidden site content

Where Horses Run must not display these items as site content:

- entries or runners
- horse names
- jockey names
- trainer names
- saddlecloth, gate, or post position
- weights
- horse body weight
- odds
- popularity or betting rank
- results
- payouts or dividends
- predictions
- betting tips
- betting suggestions
- full racecard body
- raw official source text
- raw HTML
- embedded video
- direct stream URLs
- unofficial mirrors
- redistributed recordings

Complete official information should be confirmed through official source links.

---

## Live / Replay boundary

Live and replay information is separate from timetable rank.

Allowed public labels:

- Official live
- Official replay
- Account required
- Betting account required
- Paid TV / subscription may be required
- Replay only
- Open official source

Forbidden outputs:

- Watch here
- guaranteed live claims
- unverified free stream claims
- embedded video
- direct stream URLs
- unofficial mirrors
- redistributed recordings

Where Horses Run may route users to official sources, but it must not become a video hosting, mirroring, stream-link, or replay redistribution service.

---

## Operational principle

When a field is not safe to display, hide the field and route users to the official source.

The site should display only useful public-safe summary information. It should not become an alternative to official racecards, entries, betting pages, results pages, or video services.
