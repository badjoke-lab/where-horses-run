# Generated data schema

Status: public specification  
Phase: Generated Data Foundation

This document defines the baseline generated JSON files used by Where Horses Run / 競馬どこ？.

## Files

```text
data/generated/latest.json
data/generated/today.json
data/generated/tomorrow.json
data/generated/calendar-30d.json
data/generated/fetch-status.json
```

## latest.json

Tracks the current generated file pointers.

Required fields:

```text
generated_at
timezone
today_file
tomorrow_file
calendar_30d_file
fetch_status_file
```

## today / tomorrow

Daily meeting files.

Required fields:

```text
generated_at
date_basis
meetings
```

`meetings` must be an array. Empty arrays are allowed.

## calendar-30d

Thirty-day fallback calendar file.

Required fields:

```text
generated_at
start_date_utc
end_date_utc
meetings
```

## fetch-status

Source and generation status file.

Required fields:

```text
generated_at
status
sources
notes
```

## Rules

```text
- Generated files must be valid JSON.
- Placeholder files are allowed.
- Empty meetings arrays are allowed.
- Stale or unavailable data must be visible in the UI.
- Generated data must not imply live coverage when no live process exists.
```

## Not included

```text
- entries
- odds
- results
- payouts
- tips
- full racecards
- private or paid feeds
```

