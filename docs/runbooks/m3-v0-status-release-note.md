# M3 v0 Generator Foundation Status

Date: 2026-05-30

## Summary

M3 v0 generator foundation is internally gated.

Public coverage remains partial.

No complete coverage claim is made for global coverage, country coverage, active-window coverage, or public timetable coverage.

## Completed foundation

- Japan candidate generators and approved active-window bundle.
- Hong Kong HKJC candidate generator and approved active-window bundle.
- UAE ERA candidate generator and approved active-window bundle.
- Cross-country candidate validator.
- M3 v0 release gate.

## Country status

### Japan

Japan has a generator-backed active-window candidate bundle.

This is foundation coverage for the M3 v0 generator milestone. It is not complete national coverage.

### Hong Kong

Hong Kong has an HKJC generator and an active-window approved bundle.

This is foundation coverage for the M3 v0 generator milestone. It is not a claim of complete public coverage beyond the approved bundle state.

### UAE

UAE is currently in a season gap for the active window.

The approved bundle has `records: []` and must not be shown as active coverage.

## Safety boundary

This M3 v0 status does not add or permit:

- live fetch
- source page parsing
- raw source body storage
- racecards
- odds
- results
- payouts
- predictions or tips

## What users/public pages may safely say

Users and public pages may safely say:

- Generator foundation exists.
- Coverage is partial.
- Official source links remain final confirmation.
- UAE currently has no active-window records in this generated state.

## What must not be claimed

Users and public pages must not claim:

- complete global coverage
- complete country coverage
- live official timetable sync
- racecard/odds/results support
- betting advice/predictions/tips

## Next

PR-081 or the next roadmap item should continue from the post-M3 v0 roadmap without weakening the safety boundary.
