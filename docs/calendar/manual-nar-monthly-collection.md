# Manual NAR monthly collection

Status: active operator runbook  
Work ID: `WHR-CAL-JAPAN-NAR-A-PLUS`

## Purpose

This command collects review-only NAR monthly meeting candidates after the all-fourteen fixture set has been approved. It checks every flat-racing NAR racecourse for the selected month, collects every discovered RaceList meeting through the optional cutoff date, and records venues without selected-month meetings explicitly.

## Run

From the repository root:

```bash
sh ./collect-nar-monthly-manual 2026-07
```

For an in-progress month, use a cutoff date so future meetings are not treated as parser failures:

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

## Output

```text
data/candidates/nar-monthly-meeting-candidates.json
data/generated/timetable/nar-monthly-collection-report.json
```

Every candidate remains:

```text
review.status: needs_review
review.promotion_eligible: false
```

Canonical and public writes remain disabled.

## Venue states

- `has_target_month_meetings`: at least one official RaceList link was discovered for the selected month and cutoff range.
- `no_meeting_in_target_month`: no RaceList link was discovered for that racecourse in the selected month and cutoff range.

A no-meeting venue is not a failure. It is an explicit monthly status record.

## Meeting states

- `meeting_complete`: the meeting has continuous race numbers and all required A+ public fields.
- `meeting_incomplete`: a meeting exists, but required rows or fields are incomplete.
- `source_unavailable`: the official source route cannot be fetched safely.
- `parser_failure`: the source is reachable but cannot be parsed safely.

Blockers are written to the report and candidate file, but they are not promotion-eligible.

## Boundary

The command must not write:

```text
data/generated/timetable/canonical/**
data/generated/timetable/public/**
src/**
```

Raw source storage remains disabled. Scheduling remains disabled. Publication requires a later human-approved promotion PR.
