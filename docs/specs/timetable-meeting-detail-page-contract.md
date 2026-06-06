# Timetable meeting detail page contract

Status: draft foundation  
Last updated: 2026-06-07

This specification defines the public-safe contract for future meeting detail pages in Where Horses Run.

It extends the existing timetable public display boundary. Meeting detail pages may show more detail than list pages, but they must not become racecard, betting, result, or video pages.

---

## 1. Purpose

A meeting detail page should answer:

```text
What is known about this meeting, what limited public-safe timetable detail can be shown, and where is the official source?
```

The page should help users reach the official source for complete information. It must not replace the official race programme, racecard, entries, odds, results, betting page, or video service.

---

## 2. Route shape

Future meeting detail pages should use stable, meeting-level routes.

Recommended route pattern:

```text
/meetings/[country]/[racecourse]/[date]/
/ja/meetings/[country]/[racecourse]/[date]/
```

Route parameters:

- `country`: stable country slug or country id.
- `racecourse`: stable racecourse slug or racecourse id.
- `date`: local meeting date in `YYYY-MM-DD`.

The route must identify one country, one racecourse, and one local meeting date. It must not identify one horse, race entry, bet type, result, payout, replay, or stream.

---

## 3. Source record requirement

A meeting detail page may be generated only from a normalized meeting-level record that preserves:

- `meeting_id`
- `country_id`
- `authority_id`
- `racecourse_id`
- `date`
- `timezone`
- `source_id`
- `route_id` when available
- `capability_rank`
- `source_status`
- `official_source_url`
- `last_checked_date`

If a required identifier cannot be mapped to stable project data, the page should not be generated.

---

## 4. Rank-specific display contract

Meeting detail pages must follow the rank boundary.

| Rank | Detail page display |
| --- | --- |
| `C` | Meeting date, racecourse, country, authority, timezone, source status, and official source only. |
| `B` | `C` fields plus first race time. |
| `B+` | `B` fields plus last race time. |
| `A` | `B+` summary plus race label or race number and post time only, when verified. |
| `A+` | `A` fields plus limited programme summary fields: race name, distance, surface, and course label where available. |

A+ remains a limited programme summary. It is not a full racecard.

---

## 5. Allowed page sections

Meeting detail pages may include these sections:

- meeting summary
- timetable summary
- programme summary
- race timetable
- source and verification
- related racecourse
- related country
- related racing type
- related glossary

Do not use page titles or section headings that imply full official coverage, such as `Full racecard`, `Complete entries`, `Odds`, `Results`, `Tips`, or `Watch here`.

---

## 6. Allowed A+ fields

A+ rows may contain only:

- race label or race number
- post time
- race name
- distance
- surface
- course label
- official source link
- last checked date

If a source provides richer details, those details must be hidden and routed to the official source.

---

## 7. Forbidden fields

Meeting detail pages must not display:

- entries or runners
- horse names
- jockey names
- trainer names
- saddlecloth, gate, draw, barrier, or post position
- weights
- horse body weight
- odds
- betting popularity or betting rank
- betting selections
- predictions
- tips
- results
- payouts or dividends
- full racecard text
- raw source text
- raw HTML
- embedded video
- direct stream URLs
- unofficial mirrors
- redistributed recordings

---

## 8. Empty and fallback states

When detail data is not available, the page should show a conservative empty state.

Recommended empty states:

- `Meeting summary available only.`
- `Race-by-race timetable is not available here.`
- `Use the official source for entries, odds, results, and full racecard information.`
- `Official source may require an account, location eligibility, or subscription.`

The page must not infer missing times, race names, distances, or surfaces.

---

## 9. Live / Replay placement

Live and replay information is separate from timetable rank.

A meeting detail page may show official-source access labels such as:

- Official live
- Official replay
- Account required
- Betting account required
- Paid TV / subscription may be required
- Replay only
- Open official source

The page must not embed video, publish direct stream URLs, link to unofficial mirrors, or redistribute recordings.

---

## 10. Public-safe implementation boundary

This contract does not implement:

- meeting detail routes
- meeting detail UI
- source-specific parsers
- scrapers
- runtime fetching
- scheduled jobs
- generated writeback
- racecard redistribution
- video, replay, or stream integration

It only defines the display contract that future implementation must follow.
