# Racecourse page public timetable connection

Status: implemented for review

Work ID: `WHR-RACECOURSE-PAGES-V1`

Implementation unit: `RACECOURSE-PAGE-PUBLIC-TIMETABLE-CONNECTION-01`

## Purpose

Canonical racecourse pages should answer two immediate questions from reviewed public data:

1. Is a reviewed public meeting listed for this racecourse today?
2. What is the next reviewed public meeting inside the current 30-day window?

The connection must use only the public meeting list. It must not read internal Review Queue, Retry Queue, operator, attempt-history, or reviewer records.

## Data flow

```text
data/generated/timetable/public/meeting-list.json
  -> publicTimetableViewModel
  -> publicRacecourseMeetingState
  -> RacecoursePublicMeetingPanel
  -> /tracks/[slug]/ and /ja/tracks/[slug]/
```

The view model resolves the build reference date and timezone through the existing Calendar date contract. It sorts meetings by date and ID, then exposes:

- today meetings;
- next meeting date and meetings;
- later reviewed meetings in the current 30-day window;
- public projection generation timestamp;
- public rank, public-safe time range, official source, and localized meeting-detail route.

## Deterministic fixture

The permanent Actions gate builds with:

```text
WHR_CALENDAR_REFERENCE_DATE=2026-07-14
WHR_CALENDAR_TIMEZONE=Asia/Tokyo
```

The fixture verifies reviewed meetings today at:

- Kanazawa;
- Monbetsu;
- Morioka;
- Nagoya;
- Urawa.

It also verifies next-meeting examples:

- Sonoda — 2026-07-15;
- Saga — 2026-07-16;
- Kokura — 2026-07-18.

Tokyo is used as an explicit no-future-meeting example for the current public window.

## Public presentation

Every English and Japanese racecourse page renders:

- visible reference date and public projection generation date;
- explicit Today state;
- explicit Next state;
- at most eight upcoming reviewed meetings;
- public rank;
- public-safe first/last race time when available;
- localized meeting-detail link when public detail exists;
- official source link;
- explicit empty state when no reviewed meeting is listed.

The panel states that it does not display entries, odds, results, payouts, predictions, or internal queue state.

## Safety boundary

This implementation performs no network fetch and writes no Canonical or public timetable data. It does not display participants, betting data, results, payouts, predictions, full racecards, raw source bodies, or internal operations state. It does not enable automatic publication or deployment.

## Non-claims

The panel is not a real-time schedule, a full-month completeness claim, or proof that every meeting has race-level detail. The official source remains the final authority.

## Next unit

`RACECOURSE-PAGE-PROFILE-EVIDENCE-01` will review official source, freshness, location, surface, direction, course, and distance profile fields without inferring missing facts.
