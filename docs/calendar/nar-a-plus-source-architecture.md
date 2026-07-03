# NAR A+ source architecture

Status: active architecture contract  
Work ID: `WHR-CAL-JAPAN-NAR-A-PLUS`  
Checked: 2026-07-03  
Next implementation step: bounded Urawa/Funabashi fixture pilot

## Purpose

NAR and local-government racing must not be implemented as a copy of the JRA national programme flow. The public NAR site provides common route families, but venue identity, organiser responsibility, source availability, race naming, and seasonal handling remain venue- and authority-specific.

This contract defines source architecture only. It does not activate NAR public projection.

## Official route families

### Venue guide

- `https://www.keiba.go.jp/guide/`
- `https://www.keiba.go.jp/guide/course/`

The official guide confirms the current venue set and provides the canonical public venue identity layer.

### Dated race list

Template retained for pilot revalidation:

```text
https://www.keiba.go.jp/KeibaWeb/TodayRaceInfo/RaceList
  ?k_babaCode={venue_code}
  &k_raceDate={yyyy/mm/dd}
```

This route is a research input until a selected venue/date is live-reviewed and captured as a public-safe fixture.

### Race detail

Confirmed official route family:

```text
https://www.keiba.go.jp/KeibaWeb/TodayRaceInfo/DebaTable
  ?k_babaCode={venue_code}
  &k_raceDate={yyyy/mm/dd}
  &k_raceNo={race_number}
```

Current official examples confirm venue codes 18 and 19 on the detail route. The page may contain participant, odds, result-history, and other restricted material; the adapter may extract only approved timetable fields.

## First bounded pilot cohort

| Venue | Code | Reason | Activation state |
| --- | --- | --- | --- |
| Urawa | 18 | current official detail-route example available | fixture required |
| Funabashi | 19 | current official detail-route example available | fixture required |

This cohort does not assert that one adapter automatically covers all fourteen venues. It proves the common route contract and records any venue-specific exceptions before expansion.

## Venue-code research seed

`data/static/nar-venue-code-research-seed-v1.json` contains fourteen code candidates recovered from legacy PR #281. Only codes 18 and 19 currently carry official-example confirmation in this architecture. All other codes remain `revalidate` until a live official route check is recorded.

## Legacy PR #281 migration

Do not merge PR #281 directly.

Retain as research knowledge:

- venue-code candidates;
- RaceList and DebaTable parameter shapes;
- UTF-8 and Shift_JIS decoding selection;
- post-time, distance, surface, direction, and course parsing ideas;
- request timeout, delay, and parser diagnostics.

Repair before use:

- verify every venue code and source route;
- map organiser, authority, and racecourse ownership;
- replace broad race-name heuristics with fixture assertions;
- verify redirects and allowed hosts;
- define freshness, stale, fallback, and rollback behavior.

Replace completely:

- direct writes to canonical meetings;
- direct writes to public projection;
- unbounded acquisition across every venue/date combination;
- post-hoc mutation of canonical or public race names.

Machine-readable decision:

- `data/audits/nar-legacy-pr281-migration.json`

## Pipeline v1 boundary

```text
official route review
-> public-safe fixture
-> venue-aware candidate adapter
-> candidate validation
-> human review
-> canonical promotion
-> deterministic public projection
-> bilingual rendered QA
```

The first implementation PR must be candidate-only. No canonical or public output is written during source architecture or fixture generation.

## Approved public fields

- race label or number
- scheduled post time
- race name or condition
- distance
- surface
- course label

Do not store or publish raw source bodies, runners, horse names, jockeys, trainers, odds, results, payouts, predictions, complete racecards, embedded video, or direct streams.

## Activation requirements

1. verify the selected venue code and both route families;
2. record authority and racecourse ownership;
3. create a reviewed public-safe fixture without raw HTML;
4. prove encoding handling;
5. validate continuous race numbers and scheduled times;
6. validate race name, distance, surface, and course completeness for A+;
7. generate `needs_review` candidates only;
8. pass prohibited-field guards;
9. define freshness, fallback, and rollback;
10. complete bilingual rendered QA after human promotion.

## Next step

Build a fixture-only Urawa/Funabashi route probe. The probe may report source availability and public-safe extracted fields, but it must not write canonical or public data.
