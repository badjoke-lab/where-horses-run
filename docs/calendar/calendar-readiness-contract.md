# Calendar Readiness contract

Status: active canonical readiness contract  
Work ID introduced by: `WHR-GOV-ROADMAP-01`  
Machine-readable enforcement planned in: `WHR-CAL-CONTRACT-02`  
Last reviewed: 2026-06-28

## Purpose

Calendar Readiness states whether a reviewed racing system or official source can move into maintained timetable operation.

It is separate from country-page publication status and from Technical Rank.

## Record scope

Readiness is recorded per meaningful system/source scope, not only per country.

Examples:

```text
Japan / JRA
Japan / NAR
Japan / Banei Tokachi
France / France Galop
France / LETROT
Argentina / Palermo
```

## Required dimensions

Each record must identify:

- country, racing system, authority/operator, and official source;
- racecourse coverage scope;
- Technical Rank;
- Public Ceiling;
- source and access format where known;
- automation mode;
- refresh class;
- readiness state;
- fallback behaviour;
- freshness or revalidation trigger;
- reviewed evidence reference;
- checked date.

## Automation modes

### `automatic`

A reviewed route can generate candidates on a schedule without routine manual source acquisition. Human review is still required before publication unless a later contract explicitly changes that rule.

### `semi_automatic`

Tooling performs acquisition or extraction, but a human must correct, select, or complete the candidate before promotion.

### `manual_import`

A human obtains an official file or snapshot and approved tooling converts it into public-safe candidates.

### `manual_confirmation`

A human confirms meeting-level facts directly from the official source and records the approved summary.

### `link_only`

Where Horses Run maintains a reviewed official link and explanatory state but does not reproduce timetable data.

### `blocked`

No stable, safe, or sufficiently verified route currently exists. A reason and revalidation trigger are required.

### `not_applicable`

The scope is archive, excluded, not a current calendar product, or otherwise outside recurring timetable operation.

## Readiness states

### `ready`

Implementation or activation can begin using a reviewed route, stable identifiers, expected output, fixtures/evidence, fallback, and maintenance decision.

`ready` does not mean that live acquisition is already active.

### `prototype_ready`

A bounded adapter or import prototype can be built, but production activation still needs one or more of fixture coverage, source stability proof, operational review, or fallback verification.

### `manual_ready`

A documented manual import or confirmation workflow can maintain the public-safe result now.

### `link_only`

The completed product treatment is an official-source link and explanatory coverage state.

### `blocked`

Implementation must not begin until the documented blocking condition changes.

### `not_applicable`

No recurring calendar implementation is required for this scope.

## Refresh classes

Use one or more reviewed classes:

```text
daily
near_meeting
weekly
monthly
seasonal
event_driven
manual
none
```

A source may use different routes for annual meeting dates and near-meeting race times.

## Fallback modes

Every operational or planned route records one primary fallback:

```text
keep_last_verified_and_mark_stale
downgrade_to_C
official_link_only
hide_from_current_calendar
archive_last_verified
not_applicable
```

Fallback must prevent failed or old extraction from appearing as current verified data.

## Readiness versus implementation status

Readiness answers whether implementation may begin. It must not be used to claim that a parser, scheduler, or live route exists.

Implementation status will be tracked separately, for example:

```text
not_started
prototype
fixture_validated
candidate_active
manual_operation
scheduled_candidate_active
public_active
paused
retired
```

The machine-readable schema for those fields is created in a later Work ID.

## Closure rules

- Every country must have at least one calendar decision at the combined 98-country audit.
- Every reviewed active racing system or source must have a closed readiness state.
- `ready` and `prototype_ready` require evidence and a fallback.
- `blocked` requires a reason and revalidation trigger.
- `link_only` requires a reviewed official source.
- `not_applicable` requires an archive, exclusion, special-scope, or equivalent reason.
- No completed record may rely only on a country-level assumption when multiple systems differ.

## Promotion and downgrade

Readiness may be promoted or downgraded when source stability, coverage, publication risk, access method, or maintenance cost changes.

A downgrade must not delete reviewed history. It changes the active state, fallback, and next review condition.
