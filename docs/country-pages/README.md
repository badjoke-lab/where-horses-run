# Country page programme documentation

Status: active programme index  
Parent roadmap: `docs/project-roadmap.md`

Use these files together:

- [`programme-roadmap.md`](./programme-roadmap.md) — historical/current PR record and original wave schedule
- [`programme-roadmap-2026-06-28-addendum.md`](./programme-roadmap-2026-06-28-addendum.md) — active Work ID schedule, Calendar handoff, and revised final gate
- [`98-country-tracker.tsv`](./98-country-tracker.tsv) — canonical country-page status tracker
- [`completion-contract.md`](./completion-contract.md) — formal country-page publication conditions
- [`completion-contract-calendar-addendum.md`](./completion-contract-calendar-addendum.md) — separation of page completion and Calendar Readiness
- [`../calendar/source-test-v2-contract.md`](../calendar/source-test-v2-contract.md) — required source-test contract for entries 53-98 and backfill target for entries 01-52
- [`../calendar/calendar-readiness-contract.md`](../calendar/calendar-readiness-contract.md) — calendar handoff states
- [`../operations/deployment-and-ci-policy.md`](../operations/deployment-and-ci-policy.md) — mandatory deployment, CI, branch, preview, and merge rules

## Required operating rule

Read the documentation authority, project roadmap, deployment policy, original country roadmap, active roadmap addendum, completion contract, Calendar addendum, and tracker before creating a country-page branch or PR.

Normal source-test, reviewed-note, Profile v2, readiness-backfill, and documentation work must not trigger Cloudflare deployments. Formal rendered preview and production deployment are reserved for publication work unless an exception is documented.

## Status separation

`published` means that a country page passed the country completion contract. It does not claim that a live adapter, automatic refresh, or nationwide calendar coverage exists.

Calendar Readiness is tracked separately per racing system/source.

## Maintenance rule

Every PR that changes country-page status updates the tracker. Every PR that changes the Work ID, wave boundary, completion condition, or Calendar handoff updates the project roadmap and active country roadmap addendum in the same PR.
