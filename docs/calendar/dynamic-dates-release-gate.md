# Calendar Dynamic Dates release gate

Status: complete  
Work ID: `WHR-CAL-DYNAMIC-DATES`  
Completed: 2026-07-01  
Next Work ID: `WHR-CAL-OPS-V1`

## Completed scope

Dynamic Dates removes the fixed June behavior from Calendar, Today, Tomorrow, and country upcoming-meeting sections.

The shared contract resolves an explicit reference date, reproducible build timestamp, or build clock in a validated timezone. It then derives Today, Tomorrow, and a start-inclusive 30-day window.

## Public states

- `current_window_available`
- `no_public_records`
- `records_before_window`
- `records_after_window`
- `stale_generation_with_window_records`

The visible status shows the reference date, timezone, resolution source, and public projection date.

## Rendered fixtures

A June 6, 2026 Asia/Tokyo build proves reviewed JRA meeting and next-day rendering. A July 1, 2026 Asia/Tokyo build proves stale in-window HKJC rendering, removal of old June rows from current lists, and a safe empty Tomorrow state.

## Preserved boundaries

Dynamic Dates does not change canonical data, public projection data, ranks, or field visibility. Calendar-style pages remain one meeting per row, and meeting-detail routes remain available outside the rolling list window.

Scheduled source operation and direct publication remain disabled.

## Validation

```text
scripts/check-calendar-dynamic-dates.mjs
scripts/check-calendar-dynamic-dates-rendered.mjs
scripts/check-calendar-dynamic-dates-release-gate.mjs
data/audits/calendar-dynamic-dates-release-gate.json
```

## Next phase

`WHR-CAL-OPS-V1` adds source-health reports, stale reports, reviewable update preparation, pause and rollback ownership, seasonal rollover procedures, and operator runbooks.

The following pilot is `WHR-CAL-JAPAN-JRA`.
