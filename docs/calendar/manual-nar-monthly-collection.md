# Manual NAR monthly collection

Status: legacy compatibility operator runbook  
Work ID: `WHR-CAL-JAPAN-NAR-A-PLUS`  
Last reviewed: 2026-07-07

## Governing contract

Read first:

```text
docs/calendar/incremental-coverage-contract.md
docs/calendar/nar-monthly-collection-contract.md
docs/calendar/manual-nar-incremental-collection.md
```

This command remains available for the legacy monthly candidate path and bounded compatibility checks. It is not the ordinary NAR update contract.

The ordinary NAR operator is documented in:

```text
docs/calendar/manual-nar-incremental-collection.md
```

That path supports arbitrary windows, overlapping retries, selected-meeting retries, Coverage Observation, and explicit retry targets.

## Purpose

The legacy command collects review-only NAR monthly meeting candidates after the all-fourteen fixture set has been approved. It checks the fourteen flat-racing NAR racecourses against the selected month source path and collects discovered RaceList meetings through the optional cutoff date.

This command predates the shared incremental coverage contract. Therefore:

- a successful run may produce useful partial candidates;
- its absence results must not be generalized into deletion or cancellation;
- its cutoff result is not month-completion evidence;
- its `no_meeting_in_target_month` interpretation is not the common rule for arbitrary-window operation;
- later systems must not require this exact monthly shape.

## Legacy command

From the repository root:

```bash
sh ./collect-nar-monthly-manual 2026-07
```

For the existing cutoff form:

```bash
sh ./collect-nar-monthly-manual 2026-07 2026-07-04
```

The launcher creates an isolated temporary checkout. Local uncommitted work and the original working tree are not used or modified.

## Scope

The command classifies all fourteen flat-racing racecourses:

```text
Monbetsu, Morioka, Mizusawa, Urawa, Funabashi, Oi, Kawasaki,
Kanazawa, Kasamatsu, Nagoya, Sonoda, Himeji, Kochi, Saga
```

Obihiro remains outside this command and is handled by the separate Banei Work ID.

## Legacy output

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

The legacy implementation uses:

- `has_target_month_meetings`;
- `no_meeting_in_target_month`.

These states are valid only under the exact source and scope assumptions of the monthly command.

For arbitrary-window operation, absence in one run remains unresolved unless a reviewed complete schedule source establishes a stronger conclusion.

## Meeting states

The legacy implementation uses:

- `meeting_complete`;
- `meeting_incomplete`;
- `source_unavailable`;
- `parser_failure`.

The ordinary incremental path also records requested/observed scope, unresolved dates, unresolved meeting IDs, source errors, and retry targets under the common contracts.

## Boundary

The command must not write:

```text
data/generated/timetable/canonical/**
data/generated/timetable/public/**
src/**
```

Raw source storage remains disabled. Scheduling remains disabled. Publication requires later human-approved promotion.

## Ordinary replacement path

Do not generalize this legacy runbook to Banei, HKJC, UAE, or later systems.

The ordinary path is:

```text
arbitrary or selected operator scope
-> incremental candidate output
-> Batch Validation
-> human review
-> Promotion Validation
-> canonical/public update

parallel:
Coverage Observation
-> Coverage Audit
-> retry targets

separate only when claimed:
Completion Audit
```

Use the legacy monthly command only for compatibility work or bounded historical/pilot checks. Use the incremental operator runbook for ordinary NAR maintenance.
