# Global timetable architecture addendum — 2026-06-28

Status: active canonical addendum  
Amends: `docs/specs/global-timetable-architecture.md`  
Last reviewed: 2026-06-28

## Authority

This addendum controls where it differs from the older draft foundation.

## Existing implementation baseline

The architecture is no longer only a pre-adapter foundation. The repository already contains Calendar/Today/Tomorrow surfaces, generated canonical/public data, view models, publication policies, candidate/promotion tooling, source-specific work, and refresh-command skeletons.

Future work must reconcile and activate this baseline rather than create an independent second timetable stack.

## Canonical rank model

```text
CapabilityRank = C | B | B+ | A | A+
```

- C: meeting date and racecourse.
- B: first-race time.
- B+: first and last race times.
- A: race label/number and post time on a separate detail view.
- A+: A plus selected race name, distance, surface, and course fields on a separate detail view, subject to item-level publication policy.

Technical Rank is source capability. Public Ceiling is publication permission. Effective Public Rank is the lower approved result used by public output.

## Readiness and implementation

Authority/source inventory, Calendar Readiness, and implementation status are distinct:

```text
source inventory = what official source exists and what it can provide
Calendar Readiness = whether/how implementation may begin
implementation status = what tooling and operations currently exist
```

A parser name, route record, target rank, or refresh cadence does not prove that live acquisition is active.

## Source-to-public flow

```text
official source
-> reviewed route or manual import
-> extracted candidate
-> normalization
-> validation
-> human review and promotion
-> canonical meeting data
-> publication policy
-> public meeting-list/detail projection
-> static Calendar surfaces
```

Candidate generation must not publish directly.

## Automation modes

The architecture supports:

```text
automatic
semi_automatic
manual_import
manual_confirmation
link_only
blocked
not_applicable
```

No mode may bypass source provenance, prohibited-field guards, stale handling, or human promotion unless a later explicit contract changes that rule.

## Freshness and failure

Every active or planned route needs refresh class, stale/revalidation rule, and fallback. Supported fallbacks include marking last verified data stale, downgrading to C, official-link-only, hiding from current Calendar, or archiving the last verified record.

Failed acquisition must never appear as current verified information.

## Local-source boundary

Raw source captures remain local/internal. Public data and Git history may contain only reviewed derived summaries and public-safe candidates. Follow `docs/governance/internal-source-handling.md`.

## Programme connection

Source Test v2 and Calendar Readiness are completed during the 98-country research programme. Calendar implementation then follows `docs/calendar/implementation-roadmap.md` through baseline reconciliation, pipeline activation, pilots, public v1, and expansion.
