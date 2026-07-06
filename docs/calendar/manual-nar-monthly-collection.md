# Manual NAR monthly collection

Status: transitional operator runbook  
Work ID: `WHR-CAL-JAPAN-NAR-A-PLUS`  
Last reviewed: 2026-07-06

## Governing contract

Read first:

```text
docs/calendar/incremental-coverage-contract.md
docs/calendar/nar-monthly-collection-contract.md
```

This existing command remains available for the legacy monthly candidate path. Its old cutoff-based semantics must not be treated as the future common Calendar update contract.

The next NAR implementation work will refactor ordinary collection to support arbitrary windows, overlapping retries, selected-meeting retries, coverage observation, and separation of ordinary batches from the July completion audit.

## Purpose

The current command collects review-only NAR monthly meeting candidates after the all-fourteen fixture set has been approved. It checks the fourteen flat-racing NAR racecourses against the selected month source path and collects discovered RaceList meetings through the optional cutoff date.

This command predates the shared incremental coverage contract. Therefore:

- a successful run may produce useful partial candidates;
- its absence results must not be generalized into deletion or cancellation;
- its cutoff result is not month-completion evidence;
- its `no_meeting_in_target_month` interpretation is not the common rule for arbitrary-window operation;
- later implementation must not require this exact monthly shape for other systems.

## Current run

From the repository root:

```bash
sh ./collect-nar-monthly-manual 2026-07
```

For the existing in-progress-month command shape:

```bash
sh ./collect-nar-monthly-manual 2026-07 2026-07-04
```

The launcher creates an isolated temporary checkout. Local uncommitted work and the original working tree are not used or modified.

## Current scope

The command classifies all fourteen flat-racing racecourses:

```text
Monbetsu, Morioka, Mizusawa, Urawa, Funabashi, Oi, Kawasaki,
Kanazawa, Kasamatsu, Nagoya, Sonoda, Himeji, Kochi, Saga
```

Obihiro remains outside this command and is handled by the separate Banei Work ID.

## Current output

```text
data/candidates/nar-monthly-meeting-candidates.json
data/generated/timetable/nar-monthly-collection-report.json
```

Every candidate remains review-only:

```text
review.status: needs_review
review.promotion_eligible: false
```

Canonical and public writes remain disabled during collection.

## Legacy venue states

The existing implementation currently uses:

- `has_target_month_meetings`;
- `no_meeting_in_target_month`.

These states are valid only under the exact source and scope assumptions of the legacy monthly command.

For future arbitrary-window operation, absence in one run must instead remain `not_observed` unless a reviewed complete schedule source establishes a stronger conclusion.

## Meeting states

The current implementation uses:

- `meeting_complete`;
- `meeting_incomplete`;
- `source_unavailable`;
- `parser_failure`.

The refactored path will also support explicit pending-detail and coverage-observation states as defined by the common contract.

## Boundary

The command must not write:

```text
data/generated/timetable/canonical/**
data/generated/timetable/public/**
src/**
```

Raw source storage remains disabled. Scheduling remains disabled. Publication requires later human-approved promotion.

## Replacement direction

Do not generalize this runbook to Banei, HKJC, UAE, or later systems.

The replacement direction is:

```text
arbitrary operator scope
-> batch candidate output
-> batch validation
-> human review
-> promotion validation
-> canonical/public update

parallel:
coverage observation
-> gap report
-> retry targets
-> optional completion audit
```

Until the refactor is merged, use this command only within its documented transitional boundary.
