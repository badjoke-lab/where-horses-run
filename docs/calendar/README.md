# Calendar programme documentation

Status: active documentation index  
Last reviewed: 2026-06-28

Use these files together:

- [`../project-roadmap.md`](../project-roadmap.md) — full product sequence and current Work ID.
- [`source-test-v2-contract.md`](source-test-v2-contract.md) — required source-research output.
- [`calendar-readiness-contract.md`](calendar-readiness-contract.md) — completion states for each racing system and source.
- [`implementation-roadmap.md`](implementation-roadmap.md) — reconciliation, pipeline activation, pilots, release, expansion, and operations.
- [`current-baseline-audit.md`](current-baseline-audit.md) — current repository capabilities and gaps.
- [`../specs/global-timetable-architecture.md`](../specs/global-timetable-architecture.md) and its 2026-06-28 addendum.
- [`../specs/timetable-data-flow-and-display-contract.md`](../specs/timetable-data-flow-and-display-contract.md).
- [`../operations/deployment-and-ci-policy.md`](../operations/deployment-and-ci-policy.md).

## Operating rule

Calendar work starts from reviewed source tests, authority/source records, country-page notes, and Calendar Readiness records. It must not begin from generic country assumptions.

Country-page completion and Calendar Readiness share research and stable identifiers but remain separate states.

## Local research boundary

Detailed local captures remain outside the repository. The public repository may contain only reviewed, public-safe derived metadata and summaries. Follow `docs/governance/internal-source-handling.md`.

## Maintenance

Every Calendar PR must update the applicable roadmap, readiness registry, source record, runbook, or validator when its state changes.
