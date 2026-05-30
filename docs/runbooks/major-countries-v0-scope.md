# Major countries v0 scope lock

## Summary

PR-087 locks the major-countries v0 scope and changes the completion workflow from per-country micro PRs to batched country/system work. Major-countries v0 must be completed by PR-096 at the latest, so PR-087 through PR-096 are capped for major-countries v0 completion.

Major-countries v0 means a usable major-country index with country profiles, racecourse inventory where official inventory sources are available, and official calendar links where official calendar sources are available. It does not mean full worldwide timetable completion, and complete global coverage is not claimed.

## Workflow lock

- PR-087 through PR-096 are capped for major-countries v0 completion.
- Per-country micro PRs are paused.
- Gap-report-only PRs are paused.
- Source-evidence-only PRs are paused unless bundled with data/schema/page changes.
- Japan/Hong Kong/UAE existing data remains partial.
- Complete global coverage is not claimed.
- Major-countries v0 means usable major-country index, not full worldwide timetable completion.
- This scope does not claim every major country has active-window timetables.

The exact guardrail phrases required by the validator are: per-country micro PRs are paused; gap-report-only PRs are paused; source-evidence-only PRs are paused unless bundled with data/schema/page changes.

## Major countries scope

The v0 scope contains exactly these major countries:

1. Japan
2. Hong Kong
3. United Arab Emirates
4. United Kingdom
5. Ireland
6. France
7. United States
8. Canada
9. Australia
10. New Zealand
11. South Africa
12. South Korea
13. Singapore

The machine-readable scope lives in `data/static/major-countries-v0-scope.json`.

## Coverage depth levels

Approved v0 coverage depth values are:

- `level_1_country_profile`
- `level_2_racecourse_inventory`
- `level_3_official_calendar_links`
- `level_4_active_window_meeting_dates`
- `level_5_first_race_times_optional`

## Minimum v0 requirements

For major-countries v0:

- Every scoped country requires at least `level_1_country_profile`.
- Every scoped country where an official inventory source is available requires at least `level_2_racecourse_inventory`.
- Every scoped country where an official calendar source is available requires at least `level_3_official_calendar_links`.
- `level_4_active_window_meeting_dates` and `level_5_first_race_times_optional` are only targets for countries with stable official source evidence already reviewed or easy to batch safely.

## Timetable active-window policy

The active-window target is intentionally conservative:

- `yes` means active-window meeting dates are a v0 target because stable official evidence is already reviewed and safe to batch.
- `partial` means active-window meeting dates may be included for a limited subset already supported by reviewed official evidence.
- `no` means active-window timetable data is not a v0 target for the country.
- `later` means the country belongs in the major-country index now, while active-window timetable work is deferred beyond v0.

No public page or runbook should present this scope as a promise that every major country has active-window timetables.

## Batch completion path through PR-096

- PR-087: lock scope, schema, and validator.
- PR-088: Tier 1 official source inventory batch A.
- PR-089: Tier 1 official source inventory batch B.
- PR-090: Tier 1 racecourse inventory and calendar-link batch.
- PR-091: Tier 2 official source inventory batch.
- PR-092: Tier 2 racecourse inventory and calendar-link batch.
- PR-093: Existing partial countries normalization batch for Japan/Hong Kong/UAE.
- PR-094: Active-window-safe batch for countries with reviewed stable official evidence.
- PR-095: Public index/status copy and validator hardening.
- PR-096: Major-countries v0 closeout gate.

The sequence may be adjusted as implementation details become clearer, but completion remains capped at PR-096.

## What this does not do

- Does not add new timetable records.
- Does not add live fetch runtime.
- Does not add a source parser.
- Does not add racecards.
- Does not add odds.
- Does not add results.
- Does not add payouts.
- Does not add predictions.
- Does not add tips.
- Does not claim public complete coverage.
- Does not add dependencies.
- Does not claim complete global coverage.
- Does not claim every major country has active-window timetables.

## Validation

Run:

```bash
node scripts/check-major-countries-v0-scope.mjs
npm run build
npm run check
```
