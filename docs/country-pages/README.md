# Country page programme documentation

Use these files together:

- [`programme-roadmap.md`](./programme-roadmap.md) — current PR schedule, current position, wave plan, local-work rules, and final release gate
- [`98-country-tracker.tsv`](./98-country-tracker.tsv) — canonical per-entry status tracker
- [`completion-contract.md`](./completion-contract.md) — formal definition of a completed and published country page

## Maintenance rule

Every PR that changes country-page programme status must update the tracker.

Every merge that changes the current PR, tracker counts, wave boundaries, or completion conditions must also update `programme-roadmap.md` in the same PR.
