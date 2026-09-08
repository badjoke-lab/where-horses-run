# Where Horses Run — active parallel work lanes

Status: active execution coordination  
Adopted: 2026-09-08  
Applies to: simultaneous Calendar presentation correction, Calendar country/authority coverage expansion, and all-tier racecourse inventory/ledger work

This document exists to prevent one active lane from being serialized behind another or from overwriting another lane's work. These lanes are independent and may proceed at the same time. A lane may pause only for a real shared-file/shared-schema conflict, not merely because another lane is active.

## Active parallel lanes

### Lane A — Calendar presentation context correction

Current bounded Work ID: `WHR-CAL-PRESENTATION-CONTEXT-001`.

Scope:

```text
Today / Calendar presentation-state semantics
List state headings and counts
row state badge/background
Map marker status
Map legend visibility
Map selected-card status
EN/JA presentation parity
semantic visual regression coverage
```

This lane does not own Calendar acquisition routes, country/authority coverage expansion, canonical timetable truth, racecourse inventory membership, or reviewed racecourse coordinates.

### Lane B — Calendar country/authority coverage expansion

This lane continues independently under the Calendar acquisition, incremental coverage, and control-plane contracts.

Scope:

```text
new supported countries / racing systems / authorities
reviewed official acquisition routes
collector / adapter / source-registry additions
coverage observation and completeness state
review / promotion inputs for newly covered meetings
```

This lane must not rewrite Calendar presentation semantics, List/Map state labels, display colors, or UI-only state classification in order to make new data appear.

### Lane C — all-tier racecourse inventory / ledger

This lane is active independently of both Calendar presentation and Calendar acquisition coverage expansion.

Scope:

```text
complete all-tier physical-racecourse mother set
stable racecourse_id and canonical identity
country / territory / racing-system / authority relationships
reviewed names and aliases
physical location / address / coordinates when reviewed
official racecourse / authority source provenance
operating/current-state fields required by the site contract
mapping from source/club labels to physical racecourses
ledger completeness / unresolved-state tracking
```

Club/source labels must not be silently promoted to physical racecourses. New racecourse identities are reviewable ledger additions, not presentation guesses.

## Shared identity boundary

The three lanes meet only through reviewed stable identifiers and public projection contracts.

```text
Calendar meeting -> racecourse_id -> reviewed racecourse ledger identity
Calendar meeting -> authority_id -> reviewed authority identity
presentation -> consumes public meeting + reviewed identity; does not invent either
Map -> consumes reviewed racecourse location; does not create locations
```

Calendar country expansion may introduce a meeting whose racecourse is not yet fully enriched in the racecourse ledger. That must not block acquisition of the meeting. The meeting remains linked to a reviewed/stable racecourse identity when available, while unresolved enrichment remains visible in the ledger as unresolved work.

Likewise, racecourse ledger expansion must not wait for Calendar acquisition coverage. A physical racecourse may exist in the mother set even when no current public Calendar meeting is available.

## File/scope ownership for concurrent execution

To reduce collisions, use these ownership boundaries unless a shared change is genuinely required.

### Lane A normally owns

```text
src/components/TodayFilters.astro
src/components/MeetingStatePolicy.astro
src/components/TodayMeetingMap.astro
src/components/CalendarMeetingMap.astro
presentation-only portions of src/components/RacecourseMap.astro
src/lib/timetable/meetingPresentationState.mjs
presentation regression / visual-audit scripts
```

### Lane B normally owns

```text
Calendar source/authority registries
collector/adapters
acquisition workflows
coverage observations
review/promotion data
canonical/public timetable generation inputs
```

### Lane C normally owns

```text
racecourse inventory/ledger data and schemas
racecourse identity mapping tables
racecourse provenance/evidence records
reviewed racecourse location/address fields
inventory completeness validators
```

Shared files such as `RacecourseMap.astro`, common validators, top-level roadmap files, or generated projections require current-main reconciliation immediately before PR update/merge.

## Concurrent-main rule

Each lane must assume `main` can move because of the other two lanes.

Before opening/materially updating a PR and again immediately before merge:

1. read current `main` SHA;
2. re-read this document plus the lane's canonical contracts;
3. compare the lane branch with current `main`;
4. inspect all shared-file changes since branch base;
5. carry forward both sides when changes are compatible;
6. never resolve a conflict by dropping another lane's reviewed data/specification;
7. rerun the lane's gates on the reconciled exact head.

A green run from an older head is not sufficient after relevant `main` movement.

## Merge-order rule

No fixed merge order is imposed between these three lanes.

The first lane that becomes merge-ready may merge first if:

```text
its exact head is reconciled with current main
its own required checks are green
shared identity/schema contracts remain valid
it does not delete or roll back another active lane's changes
```

After any lane merges, the other active lanes continue; they do not restart from zero. They reconcile against the new main and proceed.

## Non-blocking requirements

The following are explicitly prohibited:

```text
pausing Calendar country expansion because presentation correction is active
pausing racecourse inventory work because Calendar country expansion is active
pausing either data lane because UI-008 is paused
using incomplete racecourse enrichment as a reason to discard a reviewed Calendar meeting
using missing current Calendar meetings as a reason to omit a physical racecourse from the all-tier mother set
changing presentation semantics to accommodate one newly added country
changing canonical acquisition truth to make a presentation test pass
```

## Completion reporting

Each lane reports its own completion evidence separately. A report must name the lane and exact head/merge SHA so parallel work is not conflated.

For shared integration, the final state is valid only when:

```text
new Calendar coverage resolves through stable authority/racecourse identifiers where reviewed
racecourse ledger contains the corresponding physical venues or explicit unresolved mapping states
Today/Calendar/List/Map consume those public identities without inventing state or location
all applicable exact-head validators remain green after the latest main reconciliation
```
