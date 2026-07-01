# Calendar Dynamic Dates contract

Status: implemented foundation  
Work ID: `WHR-CAL-DYNAMIC-DATES`  
Implemented: 2026-07-01

## Purpose

Calendar, Today, Tomorrow, and country upcoming-meeting sections must derive their display window from one explicit reference-date contract. They must not fall back to a historical fixture date or use public-data generation time as the current date.

## Reference-date resolution

The shared resolver uses this order:

1. `WHR_CALENDAR_REFERENCE_DATE` in `YYYY-MM-DD` format;
2. `SOURCE_DATE_EPOCH` in whole epoch seconds;
3. the build clock.

The reference timezone is read from `WHR_CALENDAR_TIMEZONE`. The default is `UTC`.

`WHR_CALENDAR_REFERENCE_DATE` is intended for deterministic previews and tests. `SOURCE_DATE_EPOCH` supports reproducible builds. A normal deployment may use the build clock, but the resolved date and timezone are shown on the public Calendar surfaces.

Invalid dates, impossible dates, unsupported timezones, fractional epoch values, and invalid window sizes fail the build or validation. There is no hidden June 2026 fallback.

## Date definitions

```text
today = reference date in the configured timezone
tomorrow = today + 1 calendar day
window start = today
window end exclusive = today + 30 calendar days
window end inclusive = today + 29 calendar days
```

The rolling Calendar window is start-inclusive and end-exclusive internally.

## Public data states

The public pages show one of these reviewed states:

- `current_window_available`: at least one public meeting falls inside the window;
- `no_public_records`: no reviewed public meeting records exist;
- `records_before_window`: all public records are older than the window;
- `records_after_window`: all public records are later than the window;
- `stale_generation_with_window_records`: meetings fall inside the window, but the public projection generation date is older than the window start.

The status component shows the resolved reference date, timezone, resolution source, public projection date, and a safe official-source reminder.

Old records are not relabelled as current. They remain in the reviewed public dataset and detail routes, but are excluded from Today, Tomorrow, rolling Calendar, and country upcoming-meeting windows.

## Page scope

The shared contract governs:

- `/calendar/` and `/ja/calendar/`;
- `/today/` and `/ja/today/`;
- `/tomorrow/` and `/ja/tomorrow/`;
- country-page upcoming-meeting sections.

Meeting-detail routes remain keyed to reviewed public records and are not deleted merely because their dates fall outside the current window.

## Publication boundary

Dynamic Dates changes date selection only. It does not expand the timetable publication rank or fields.

Calendar, Today, Tomorrow, country, racecourse, and current-timetable lists remain one meeting per row. Race-by-race programme detail remains restricted to reviewed meeting-detail pages and the existing Public Ceiling policy.

## Commands and CI

Source contract:

```text
node scripts/check-calendar-dynamic-dates.mjs
```

Rendered fixture with meetings:

```text
WHR_CALENDAR_REFERENCE_DATE=2026-06-06 \
WHR_CALENDAR_TIMEZONE=Asia/Tokyo \
npm run build
node scripts/check-calendar-dynamic-dates-rendered.mjs
```

Rendered stale/empty current window:

```text
WHR_CALENDAR_REFERENCE_DATE=2026-07-01 \
WHR_CALENDAR_TIMEZONE=Asia/Tokyo \
npm run build
node scripts/check-calendar-dynamic-dates-rendered.mjs
```

The dedicated workflow runs both dates, bilingual rendered QA, the runtime import boundary, Pipeline v1 release gate, and a clean-worktree check.

## Operations boundary

Dynamic Dates does not enable scheduled acquisition, automatic candidate approval, canonical promotion, or unattended publication. Source refresh, health, stale automation, pause, rollback, and generated update PRs remain `WHR-CAL-OPS-V1` work.
