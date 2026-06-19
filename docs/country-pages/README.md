# Country page programme documentation

Use these files together:

- [`programme-roadmap.md`](./programme-roadmap.md) — current PR schedule, current position, wave plan, local-work rules, and final release gate
- [`98-country-tracker.tsv`](./98-country-tracker.tsv) — canonical per-entry status tracker
- [`completion-contract.md`](./completion-contract.md) — formal definition of a completed and published country page
- [`../operations/deployment-and-ci-policy.md`](../operations/deployment-and-ci-policy.md) — mandatory deployment, CI, branch, preview, and merge rules

## Required operating rule

Read the deployment and CI policy before creating a country-page branch, PR, workflow, preview deployment, or merge.

Normal source-test, reviewed-note, and profile-v2 work must not trigger Cloudflare deployments. Formal preview and production deployment are reserved for the QA/publish PR unless an exception is documented.

## Maintenance rule

Every PR that changes country-page programme status must update the tracker.

Every merge that changes the current PR, tracker counts, wave boundaries, or completion conditions must also update `programme-roadmap.md` in the same PR.

Every country-page PR must follow `docs/operations/deployment-and-ci-policy.md`.
