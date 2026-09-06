# Specifications

Formal project specifications live here. Read `docs/governance/document-authority.md` before treating an older specification as current.

## Active specifications and contracts

- [map-first-site-ui-2026-09-06.md](map-first-site-ui-2026-09-06.md) — current canonical public information architecture, navigation, map status presentation, responsive/mobile behavior, page roles, and UI verification contract.
- [data-model.md](data-model.md)
- [global-timetable-architecture.md](global-timetable-architecture.md)
- [global-timetable-architecture-2026-06-28-addendum.md](global-timetable-architecture-2026-06-28-addendum.md)
- [authority-source-inventory-schema.md](authority-source-inventory-schema.md)
- [authority-source-inventory-2026-06-28-addendum.md](authority-source-inventory-2026-06-28-addendum.md)
- [timetable-acquisition-route-schema.md](timetable-acquisition-route-schema.md) — Acquisition Route Inventory schema and operating boundary.
- [normalized-timetable-output-schema.md](normalized-timetable-output-schema.md) — Normalized Timetable Record schema and safe calendar-summary fields; newer candidate/promotion contracts override older rank/model text where they differ.
- [calendar-view-model-reader-contract.md](calendar-view-model-reader-contract.md)
- [page-map.md](page-map.md)
- [ui-css-policy.md](ui-css-policy.md)
- [image-policy.md](image-policy.md)
- [data-use-policy.md](data-use-policy.md)
- [operations-policy.md](operations-policy.md)

Current product/UI execution order is governed by `docs/project-roadmap-2026-09-06-addendum.md`. Implementation PRs must read both that addendum and `map-first-site-ui-2026-09-06.md` before changing the shared shell, Home, Today, Calendar, Racecourses, racecourse detail, Countries, or secondary navigation.

Current Calendar acquisition, five-rank, review, promotion, and publication behavior is governed by the canonical Calendar contracts listed in `docs/governance/document-authority.md`, especially:

- `docs/calendar/incremental-coverage-contract.md`;
- `docs/calendar/validation-responsibility-contract.md`;
- `docs/calendar/acquisition-control-plane-contract.md`;
- `docs/calendar/daily-acquisition-contract.md`;
- `docs/calendar/implementation-roadmap-2026-08-09-addendum.md`;
- applicable machine-readable schemas, Registry, policies, and validators.

Current racecourse-page data/publication behavior is governed by the implemented canonical documents under `docs/racecourses/`, including identity reconciliation, public timetable connection, profile evidence, page-link architecture, and bilingual QA. Current racecourse-page UI composition/navigation role is additionally governed by `map-first-site-ui-2026-09-06.md`.

## Superseded design foundations retained for traceability

The following files preserve useful early product/design intent but are **not** current operating contracts when they conflict with implemented Calendar/racecourse contracts or the active map-first UI specification:

- [timetable-data-flow-and-display-contract.md](timetable-data-flow-and-display-contract.md) — 2026-06-05 pre-control-plane design foundation; its four-rank and no-live-acquisition assumptions are superseded by the current five-rank candidate/review/promotion model.
- [racecourse-page-spec.md](racecourse-page-spec.md) — early fixed-direction page design; current public data availability and field visibility are constrained by `docs/racecourses/*`, Calendar public-rank rules, and the active map-first UI specification.
- [page-link-architecture.md](page-link-architecture.md) — early navigation design; current implemented racecourse link behavior is governed by `docs/racecourses/page-link-architecture.md`, while current site navigation hierarchy is governed by the active map-first UI specification.

Do not use an early example in these design files to invent a currently unverified field or to bypass the C/B/B+/A/A+ public boundary.

## Current acquisition boundary

The repository is no longer limited to the original dry-run/status-only route skeleton. Reviewed source-specific adapters, shared Collection Job/Plan semantics, hosted/local acquisition paths, candidate generation, stable Draft PR review delivery, and separate reviewed promotion exist.

This does **not** authorize unattended publication. Automatic approval, Canonical promotion, public projection, merge, and deployment remain disabled unless a later explicit contract/policy decision changes them.

## Historical baseline

- [where-horses-run-v0-spec.md](where-horses-run-v0-spec.md)
- [where-horses-run-v0-status.md](where-horses-run-v0-status.md)

The v0 specification preserves original product intent but does not override current roadmaps, contracts, schemas, or active addenda.
