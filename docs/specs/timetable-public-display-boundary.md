# Timetable public display boundary

Status: draft foundation  
Last updated: 2026-06-06

This document defines the public display boundary for timetable and meeting-detail pages in Where Horses Run.

Where Horses Run is a static-first guide to official racing calendars, timetables, racecourses, racing types, and official sources. It is not a replacement for official racecards, entry pages, result pages, betting pages, or media platforms.

---

## Public rank meanings

| Rank | Public meaning | Display scope |
| --- | --- | --- |
| C | Meeting date and racecourse are known. | Show meeting-level information only. Do not show race times. |
| B | First race time is available. | Show first race time only. |
| B+ | First and last race time are available. | Show first and last race time only. |
| A | Race-by-race post times are available. | Show race label / race number and post time only. |
| A+ | Common programme-summary fields are available. | On the meeting detail page only, show race label, post time, race name, distance, surface, and course where available. |

A+ is a lightweight programme summary. It is not a full racecard.

---

## List-view display boundary

The following views must stay one meeting per row:

- Calendar pages.
- Today pages.
- Tomorrow pages.
- Country pages.
- Racecourse pages.
- Current timetable pages.

List rows may show:

- Racecourse.
- Racing authority / system.
- Country.
- Rank.
- First race time when available.
- Last race time when available.
- Link to meeting detail or race timetable detail.
- Official source link.

List views must not expand race-by-race programme details. Even when a meeting is A+, race names, distance lists, and surface/course lists belong on the meeting detail page only.

---

## Meeting-detail display boundary

Meeting detail pages may display more than list views, but only within the rank boundary.

- C: meeting date, racecourse, country, authority, timezone, source status, and official source.
- B: C fields plus first race time.
- B+: B fields plus last race time.
- A: race label / race number plus post time.
- A+: A fields plus race name, distance, surface, and course where available.

Use headings such as `Programme summary`, `Timetable summary`, or `Race timetable`. Do not present the page as a full racecard.

---

## Fields not displayed by Where Horses Run

Where Horses Run does not display the following as site content:

- Starter lists / entries.
- Horse names.
- Jockey names.
- Trainer names.
- Saddlecloth / horse numbers.
- Draw / barrier / gate / post positions.
- Weights.
- Body weight.
- Odds.
- Betting popularity / betting rank.
- Results.
- Payouts / dividends.
- Predictions.
- Tips / selections.
- Bet suggestions.
- Full racecard text.
- Raw official page body or raw HTML.
- Embedded video.
- Direct stream URLs.
- Unofficial mirrors or redistributed recordings.

Users should use official source links for complete official information.

---

## A+ public fields

A+ may show only these common programme-summary fields:

- Race label / race number.
- Post time.
- Race name.
- Distance.
- Surface.
- Course label.
- Official source link.
- Last checked date.

Any richer programme details are out of scope for the public timetable display unless a future public specification explicitly adds them.

---

## Live and replay link boundary

Live and replay information is separate from timetable rank.

Allowed link labels include:

- Official live.
- Official replay.
- Account required.
- Betting account required.
- Paid TV / subscription may be required.
- Replay only.
- Open official source.

Where Horses Run must not embed video, publish direct stream URLs, link to unofficial mirrors, or redistribute recordings.

---

## Operating principle

When a public page cannot safely display a field within this boundary, it should show less detail and link to the official source.

The public site should help users find official calendars, meetings, racecourses, and source pages. It should not replace the official programme, racecard, betting, result, or media experience.
