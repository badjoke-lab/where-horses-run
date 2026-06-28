# Calendar Readiness contract

Status: active canonical readiness contract  
Machine-readable enforcement planned in: `WHR-CAL-CONTRACT-02`  
Last reviewed: 2026-06-28

## Purpose

Calendar Readiness states whether a reviewed racing system or official source can move into maintained timetable operation. It is separate from country-page publication and from Technical Rank.

## Record scope

Readiness is recorded per meaningful system/source scope, for example Japan/JRA, Japan/NAR, France/France Galop, France/LETROT, or Argentina/Palermo.

## Required dimensions

Each record identifies:

- country, racing system, authority/operator, source, and racecourse scope;
- Technical Rank and separate Public Ceiling;
- source/access format where known;
- automation mode and refresh class;
- readiness state;
- fallback behaviour;
- freshness or revalidation trigger;
- reviewed evidence and checked date.

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

`ready` does not claim that a live parser or scheduler already exists.

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

## Implementation status

Implementation status is separate from readiness and will be formalized by `WHR-CAL-CONTRACT-02`:

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

## Closure rules

- every country has at least one calendar decision at the combined audit;
- every reviewed active system/source has a closed readiness state;
- `ready` and `prototype_ready` require evidence and fallback;
- `blocked` requires reason and revalidation trigger;
- `link_only` requires a reviewed official source;
- `not_applicable` requires archive, exclusion, special-scope, or equivalent reason;
- one subsystem must not be generalized to a wider country without evidence.

Readiness may later be promoted or downgraded without deleting reviewed history.
