# Calendar programme documentation

Status: active documentation index  
Last reviewed: 2026-06-28

Use these files together:

- [`../project-roadmap.md`](../project-roadmap.md) — full product sequence and current Work ID.
- [`source-test-v2-contract.md`](source-test-v2-contract.md) — required source-research output.
- [`calendar-readiness-contract.md`](calendar-readiness-contract.md) — completion states for each racing system and source.
- [`implementation-roadmap.md`](implementation-roadmap.md) — work after readiness research, including reconciliation, pipeline activation, pilots, release, and expansion.
- [`current-baseline-audit.md`](current-baseline-audit.md) — current repository capabilities and gaps.
- [`../specs/global-timetable-architecture.md`](../specs/global-timetable-architecture.md) — shared timetable architecture and rank model.
- [`../specs/timetable-data-flow-and-display-contract.md`](../specs/timetable-data-flow-and-display-contract.md) — source-to-display flow.
- [`../operations/deployment-and-ci-policy.md`](../operations/deployment-and-ci-policy.md) — deployment and CI rules.

## Operating rule

Calendar work must not begin from a generic country assumption. Read the relevant source tests, authority/source records, country-page notes, and readiness record first.

The Calendar programme and country-page programme share research and stable identifiers, but they maintain separate completion states.

## Local research boundary

Detailed local source captures remain outside the repository under `.whr-local-source-tests/` or another approved local-only location.

The public repository may contain only public-safe derived material such as:

- official URLs and source roles;
- HTTP and format metadata;
- tested meeting/race counts;
- obtainable field summaries;
- capability and fallback decisions;
- hashes or local-path references that do not expose raw content;
- reviewed final summaries and limitations.

Do not commit raw HTML, PDF bodies, API response bodies, complete racecards, participant data, betting data, results, payouts, credentials, or restricted access details.

## Maintenance

Every Calendar PR must update the applicable roadmap, readiness registry, source record, runbook, or validator when its state changes.
