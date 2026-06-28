# Calendar Readiness contract

Status: active canonical readiness contract  
Machine-readable enforcement active from: `WHR-CAL-CONTRACT-02`  
Last reviewed: 2026-06-28

## Purpose

Calendar Readiness states whether a reviewed racing system or official source can move into maintained timetable operation. It is separate from country-page publication, Technical Rank, Public Ceiling, source status, and implementation status.

## Machine-readable files

```text
data/static/calendar-readiness.schema.json
data/static/calendar-readiness-registry.json
data/static/source-test-v2.schema.json
scripts/check-calendar-contracts.mjs
```

The initial registry is intentionally empty and marked `pending_backfill_01_52`. It must not be interpreted as 98 countries having no racing or no official sources. Actual records are added only through evidence-based backfill or Source Test v2 work.

## Record scope

Readiness is recorded per meaningful system/source scope, for example Japan/JRA, Japan/NAR, France/France Galop, France/LETROT, or Argentina/Palermo.

Stable readiness IDs use:

```text
country--system--source-or-scope
```

A record may link to an authority source inventory key:

```text
country_id/authority_id/official_source_id
```

## Required dimensions

Each record identifies:

- tracker country and delivery number;
- racing system and scope;
- authority/source and optional racecourse references;
- Technical Rank and separate Public Ceiling;
- confirmed timetable fields;
- source/access format;
- automation mode and refresh classes;
- readiness state and separate implementation status;
- fallback and source status;
- checked date, evidence date, and revalidation trigger;
- blocked reason when applicable;
- public-safe source-test reference, limitations, and notes.

## Automation modes

- `automatic`: reviewed scheduled candidate generation without routine manual acquisition.
- `semi_automatic`: tooling acquires/extracts, then a human corrects or completes candidates.
- `manual_import`: a human obtains an official file/snapshot and approved tooling converts it.
- `manual_confirmation`: a human confirms meeting-level facts directly.
- `link_only`: maintain a reviewed official link and explanatory state only.
- `blocked`: no stable, safe, sufficiently verified route exists.
- `not_applicable`: archive, excluded, or outside recurring timetable operation.

Human review remains required before promotion unless a later contract explicitly changes that rule.

## Readiness states

- `ready`: implementation or activation can begin with reviewed route, IDs, expected output, fallback, and maintenance decision.
- `prototype_ready`: bounded prototype can begin, but production evidence is incomplete.
- `manual_ready`: documented manual import/confirmation can maintain public-safe output.
- `link_only`: official-source link and explanatory coverage are the completed treatment.
- `blocked`: implementation must wait for a documented condition to change.
- `not_applicable`: no recurring calendar implementation is required.

`ready` does not claim that a live parser, scheduler, candidate job, or public output already exists.

## Implementation status

Implementation status is separate and uses:

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

A source may be `ready` with implementation status `not_started`. Conversely, an old prototype does not make a source `ready` without current reviewed evidence.

## Refresh classes

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

A system may have separate annual-date and near-meeting time routes.

## Fallback modes

```text
keep_last_verified_and_mark_stale
downgrade_to_C
official_link_only
hide_from_current_calendar
archive_last_verified
not_applicable
```

Fallback must prevent failed or old extraction from appearing as current verified data.

## Closure rules

- every country has at least one calendar decision at the combined audit;
- every reviewed active system/source has a closed readiness state;
- Public Ceiling must not exceed Technical Rank;
- `ready` and `prototype_ready` require a reviewed authority/source reference and operational fallback;
- `manual_ready` requires `manual_import` or `manual_confirmation`;
- `blocked` requires blocked automation mode, reason, and revalidation trigger;
- `link_only` requires a reviewed official source and `official_link_only` fallback;
- `not_applicable` requires aligned automation and fallback values;
- `public_active` requires `ready` or `manual_ready`;
- one subsystem must not be generalized to a wider country without evidence;
- completed records may not use unexplained `unknown` as a readiness outcome.

## Validation

Run:

```text
node scripts/check-calendar-contracts.mjs
```

The validator checks schema enum agreement, tracker/source/racecourse references, stable IDs, date formats, rank order, closure rules, registry counts, prohibited fields, and current roadmap state.

Readiness may later be promoted or downgraded without deleting reviewed history.
