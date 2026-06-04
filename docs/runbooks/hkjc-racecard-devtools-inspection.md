# HKJC racecard DevTools inspection runbook

## Purpose

This runbook tells a human operator or Codex/browser-capable executor exactly how to inspect the official HKJC racecard page for the 2026-06-03 Happy Valley meeting.

This is not a data promotion step.

HKJC stays C until a source-verified full meeting result is committed in a later PR.

## When to run

Run this immediately after PR-141 is merged, before any HKJC B/B+ promotion work.

Expected follow-up:

- PR-142: commit the inspection result JSON.
- PR-143: only if PR-142 is verified_full_meeting, add one-meeting race_number/race_time snapshot.
- PR-144+: only after one-meeting verification, check all June 2026 HKJC meetings.

## Target

Known sample URL:

```text
https://racing.hkjc.com/en-us/local/information/racecard?RaceNo=5&Racecourse=HV&racedate=2026%2F06%2F03
```

Target meeting:

```text
meeting_date: 2026-06-03
racecourse: Happy Valley
fixture_code: HV
time_zone: Asia/Hong_Kong
known sample: RaceNo=5 / 20:40
```

## Allowed data

Record only:

- meeting_date
- racecourse
- fixture_code
- time_zone
- source_route_type
- source_url
- request_url_pattern
- race_number
- race_time
- race_source_url
- inspection_status
- reason_not_verified

Do not collect participant-level details, price-like data, forecasts, recommendations, or anything outside meeting/race time verification.

## Chrome / Edge DevTools steps

1. Open a clean browser tab.
2. Open DevTools.
3. Go to the Network tab.
4. Enable Preserve log.
5. Disable cache.
6. Open the known sample URL.
7. Confirm whether the page visibly shows RaceNo=5 and 20:40.
8. In Network, filter requests by likely keywords:
   - racecard
   - RaceNo
   - Racecourse
   - racedate
   - fixture
   - meeting
9. Click each relevant request and inspect:
   - Request URL
   - Query string parameters
   - Response body
   - Preview/JSON if available
10. In Elements, search for:
   - RaceNo
   - 20:40
   - 2026/06/03
   - Happy Valley
   - HV
11. In Sources, search loaded scripts for:
   - RaceNo
   - Racecourse
   - racedate
   - raceTime
   - race_time
   - meeting
12. Try changing only RaceNo in the URL for a small probe set, for example 1, 2, 3, 4, 5, 6, 7, 8, 9.
13. For each RaceNo probe, record only whether an official page returns a race_time.
14. Do not infer missing races from a numeric range.
15. Stop when one of these is true:
   - a full official race_number/race_time list is found;
   - only partial race rows are found;
   - the page exposes no verifiable meeting/race time route.

## Result classification

Use exactly one inspection_status.

### verified_full_meeting

Use this only when every race_number and race_time for the 2026-06-03 Happy Valley meeting is source-verified from official HKJC resources.

### partial

Use this when at least one official race_number/race_time is verified, but the full meeting list is not verified.

### not_verified

Use this when the official route cannot verify the sample or meeting-level race times.

## Result JSON template

Save the result for the next PR using this shape:

```json
{
  "schema_version": "pr-142-hkjc-devtools-inspection-result-v0",
  "inspection_status": "verified_full_meeting | partial | not_verified",
  "meeting_date": "2026-06-03",
  "racecourse": "Happy Valley",
  "fixture_code": "HV",
  "time_zone": "Asia/Hong_Kong",
  "source_route_type": "racecard_dom_links | racecard_embedded_scripts | racecard_network_payloads | meeting_level_index | not_found",
  "source_url": null,
  "request_url_pattern": null,
  "races": [],
  "reason_not_verified": null,
  "inspector_notes": []
}
```

When verified rows exist, use this race row shape:

```json
{
  "race_number": 5,
  "race_time": "20:40",
  "race_source_url": "https://racing.hkjc.com/en-us/local/information/racecard?RaceNo=5&Racecourse=HV&racedate=2026%2F06%2F03"
}
```

## Promotion rule after this runbook

Do not promote HKJC in the runbook PR.

Do not derive:

- first_race_time
- last_race_time
- race_count
- contiguous RaceNo range

A later PR may derive those only from a verified_full_meeting result.

`last_race_time` means final race start time, not meeting end time.
