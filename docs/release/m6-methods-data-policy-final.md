# M6 Methods / Data Policy final

Implementation unit: `M6-METHODS-DATA-POLICY-FINAL-01`

This release finalizes the public Methods and Data Policy copy for the v1.0 release-candidate sequence without replacing the historical July Methods contract.

## Final public policy additions

- Candidate data remains separate from public data even when generated from official sources.
- Candidate files, diffs, and run records are review material. Human review remains required before data can enter the public dataset.
- Automated candidate generation and validation do not imply automatic publication, merge, or deployment.
- Official-source capability remains separate from reviewed public coverage.
- Source-freshness badges use the oldest checked date among readiness records contributing to a country aggregate. They are Current through 30 days, Review due after 30 days, and Unknown when a contributing checked date is missing.
- Meeting-data freshness is a separate policy. A meeting check more than one day older than the shared Calendar reference date is stale.
- C / B / B+ / A / A+ publication ranks remain unchanged. A+ remains a lightweight programme summary on meeting-detail pages only.
- Entries, participants, odds, results, payouts, predictions, complete racecards, copied official-source body text, and raw HTML remain outside the public-data boundary.

## Invariants

The existing two Methods routes, bilingual structure, nine sections per language, eighteen paragraphs per language, metadata, canonical/hreflang behavior, and related navigation remain unchanged. The historical `methods-data-policy-contract-v1.json` and audit remain reference snapshots.
