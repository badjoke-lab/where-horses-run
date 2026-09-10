# Calendar 98-tier acquisition-method contract

Status: active coverage contract  
As of: 2026-09-10

This contract records one terminal acquisition method for every tier in `docs/country-pages/98-country-tracker.tsv`.

It answers **how the tier is acquired or safely held when current fixture evidence is absent**. It does not claim that every tier currently has a live fixture, a machine-usable parser, or an active runner.

## Machine-readable source

- `data/static/calendar-98-tier-acquisition-methods/index.json`
- `data/static/calendar-98-tier-acquisition-methods/tiers-01-25.json`
- `data/static/calendar-98-tier-acquisition-methods/tiers-26-50.json`
- `data/static/calendar-98-tier-acquisition-methods/tiers-51-75.json`
- `data/static/calendar-98-tier-acquisition-methods/tiers-76-98.json`
- `data/static/calendar-98-tier-acquisition-methods.schema.json`
- validator: `scripts/check-calendar-98-tier-acquisition-methods.mjs`

## Semantics

`method_complete=true` means the tier has a defined source/discovery basis, cadence, trigger class, and fail-closed zero policy.

It does **not** mean:

- a current meeting exists,
- a parser or runner is already implemented,
- a source always exposes race-level detail,
- the acquisition rank is fixed,
- the public display rank is fixed.

Calendar remains Best Available. Observed evidence rank is derived from normalized evidence elsewhere in the pipeline.

## Method classes

- `active_source_driven` — ordinary source-visible calendar/programme discovery.
- `active_official` — active official route with a source-specific publication surface.
- `status_watch` — monitor an official publication/status surface; emit zero until a current dated trigger appears.
- `annual_notice_watch` — annual/cultural event; require a current-year official notice instead of rolling forward recurrence.
- `explanatory_zero` — no current official racing source; maintain explanatory/status coverage and emit zero.
- `dormant_archive` — domestic racing ended; emit zero until an official restart.

## Fail-closed rule

Stale dates, prior-year dates, recurring cultural dates, secondary-only dates, and postponed dates never become current meetings without the tier's defined current official trigger.

## Relationship to the Acquisition Registry

`calendar-acquisition-registry.json` is an execution-routing registry and intentionally remains narrower. Its active/provisional profiles require runner and adapter decisions.

This 98-tier contract is the coverage/method source of truth. Runner implementation is expanded from this contract into the Acquisition Registry only when an executable adapter path exists. This separation prevents a status-watch or dormant tier from being misrepresented as a failed active adapter.
