# Where Horses Run — current development entry point

Status: active entry point  
Last reviewed: 2026-09-08

`AGENTS.md` is the mandatory repository execution instruction. Read it before using this entry point.

## Required reading for all work

```text
AGENTS.md
docs/governance/document-authority.md
docs/governance/parallel-work-lanes-2026-09-08.md
docs/project-roadmap.md
docs/project-roadmap-2026-09-08-addendum.md
docs/specs/map-first-site-ui-2026-09-06.md
docs/operations/deployment-and-ci-policy.md
```

Re-read the applicable canonical specification and active roadmap/addendum whenever scope or acceptance criteria change, after relevant movement on `main`, before opening or materially updating a PR, before merge, and after merge before beginning the next Work ID. Conversation history and PR numbers do not replace canonical repository documents.

The active parallel-lane contract is mandatory. Calendar presentation correction, Calendar country/authority coverage expansion, and all-tier racecourse inventory/ledger work may proceed simultaneously. Do not serialize one behind another unless there is a real shared-file/shared-schema conflict.

## Calendar-visible work: mandatory additional reading

Before changing Calendar, Today, meeting-state, timezone, List/Month/Map, stream presentation, Calendar naming/localization, or shared Calendar map behavior, also read:

```text
docs/specs/calendar-meeting-state-stream-and-view-2026-09-08.md
docs/specs/calendar-row-rank-live-localization-2026-09-08.md
docs/calendar/calendar-presentation-state-001-display-correction-schedule.md
docs/calendar/incremental-coverage-contract.md
docs/calendar/acquisition-control-plane-contract.md
docs/calendar/implementation-roadmap.md
```

For acquisition/control-plane work, continue into the source-specific and machine-readable contracts linked from `docs/calendar/README.md`, `docs/calendar/machine-readable-contracts.md`, and `docs/governance/document-authority.md`.

## Active Calendar model

```text
Meeting / Schedule Layer
+
Timetable Detail Layer
+
Coverage Observation
+
Acquisition Control Plane
```

Validation roles remain:

```text
Batch Validation
Promotion Validation
Coverage Audit
Completion Audit
```

Operational flow remains:

```text
Collection Plan
-> independent Collection Jobs
-> runner routing
-> source-specific adapters
-> field observation
-> C/B/B+/A/A+ classification
-> Batch Validation
-> Coverage Observation
-> Review Queue
-> Rank-aware Retry Queue
-> human review
-> Promotion Validation
-> canonical promotion
-> public projection
```

Rules that remain unchanged:

- meetings may enter at C, B, B+, A, or A+ according to reviewed evidence;
- B and B+ are first-class operational states;
- absence from one run is not deletion/cancellation;
- normal promotion rejects rank regression;
- corrective downgrade is a separate reviewed path;
- runner choice does not change batch/rank/coverage/review/promotion semantics;
- unattended publication remains disabled unless separately approved.

## Current execution state

Use `docs/project-roadmap-2026-09-08-addendum.md` as the current top-level execution authority and `docs/governance/parallel-work-lanes-2026-09-08.md` as the active concurrency contract.

```text
Current stage: reviewed_incremental_maintenance
Active product/UI lane: map_first_site_ui
Completed UI Work ID: UI-006
Completed UI Work ID: UI-007
Current UI Work ID: UI-008 [runtime paused during bounded Calendar correction]
Next UI Work ID: UI-009
Parallel Calendar quality lane: calendar_quality_and_coverage
Active Calendar country/authority coverage expansion: continues independently
Active all-tier racecourse inventory/ledger lane: continues independently
Completed Calendar presentation correction: WHR-CAL-PRESENTATION-STATE-001
Completed Calendar color-state amendment: WHR-CAL-PRESENTATION-COLOR-001
Active Calendar context-state amendment: WHR-CAL-PRESENTATION-CONTEXT-001
```

Execution priority before UI-008 resumes:

```text
WHR-CAL-PRESENTATION-CONTEXT-001
```

That priority applies only to the UI lane. It does **not** pause Calendar country/authority coverage expansion or the all-tier racecourse inventory/ledger lane. Those two lanes continue in parallel and reconcile against current `main` before PR update/merge.

The active Calendar context-state contract requires Today/Calendar/List/Map to agree on the same presentation state for the same meeting and date context.

## Active Today / Calendar presentation rules

Current-day precise state requires B+ or higher with sufficient reviewed first/last timing:

```text
before first -> Upcoming / 開催前
within window -> Racing now / 開催中
after last -> Finished / 終了
```

B/C or day-level-only reviewed current-day meeting:

```text
Today meeting / 本日開催
```

Today range valid groups:

```text
Racing now / 開催中
Upcoming / 開催前
Today meeting / 本日開催
Finished / 終了
```

Forbidden on Today range:

```text
Upcoming / racing today
開催前・本日開催
Scheduled / 開催予定 as a current-day fallback
```

Tomorrow meetings use `Scheduled / 開催予定`.

Seven-day range uses current-day states for today and `Scheduled / 開催予定` for later dates.

Calendar selected today uses the four current-day states. Calendar selected future date uses `Scheduled / 開催予定`.

## Active List / Map state colors

List:

```text
running   #fff7f6
upcoming  #fff9e9
today     #fffcf4
ended     #f6f7f8
future    #ffffff
unknown   #ffffff
```

Map:

```text
running   #c40000
upcoming  #d18a00
today     #fffcf4 + dark warm outline/ring
future    #111111
ended     #666666
```

Today Map and Calendar Map with today selected must not show a `Scheduled / 開催予定` legend item. Future-date Calendar Map uses `Scheduled / 開催予定` and does not show current-day legend states.

## State-separation rule

Calendar implementation must preserve these separate dimensions:

```text
acquisition/review/publication rank
meeting lifecycle state
selected display timezone
official stream state
Calendar/Today presentation state
```

Do not fix a presentation defect by inventing a second meeting truth, guessed race time, guessed stream state, map-only override, or unreviewed public field.

The shared presentation-state consumer set includes:

```text
Today summary counts
Today/List group headings
row badge/background
Calendar List
Map marker
Map legend
Map selected card
```

These surfaces must not independently reinterpret the same meeting.

## Parallel-lane identity rule

The active lanes integrate through reviewed IDs, not by copying each other's provisional data:

```text
Calendar meeting -> authority_id
Calendar meeting -> racecourse_id
racecourse_id -> reviewed physical-racecourse ledger identity
Map -> reviewed racecourse location only
presentation -> public meeting + reviewed identity only
```

Calendar country expansion may continue even when racecourse enrichment is incomplete; unresolved enrichment remains ledger work rather than a reason to drop the meeting. Racecourse ledger expansion may continue even when a venue has no current Calendar meeting.

## PR discipline

Every substantive PR must state at minimum:

```text
Work ID or active lane
Canonical documents reviewed
Specification/schedule changes
Runtime behavior changes
Tracker/registry/data changes, or none
Public display boundary changes, or none
Validation performed
Visible browser/screenshot evidence when UI changes
Completion conditions
Next Work ID / lane continuation
```

Before PR material update and immediately before merge, each active lane must re-read current `main`, inspect shared-file changes since its branch base, preserve compatible changes from the other lanes, and rerun its gates on the reconciled exact head.

Visible UI/interaction work requires actual browser output and representative screenshot inspection. A green build or CI run alone is not completion evidence.

## Public repository boundary

Never commit internal-only strategy notes, private workflow notes, credentials, raw restricted captures, non-public source material, or other material classified as internal-only by repository governance.

Only public-safe specifications, reviewed facts, schemas, code, tests, hashes, and public-safe operational summaries belong here.

## Resume rule

After `WHR-CAL-PRESENTATION-CONTEXT-001` merges and exact-SHA CI/Cloudflare verification passes:

1. re-read `AGENTS.md`;
2. re-read this file and `docs/governance/parallel-work-lanes-2026-09-08.md`;
3. re-read governance and the active top-level roadmap addendum;
4. confirm the Calendar amendment is marked complete;
5. resume `UI-008` from current `main` rather than from a stale pre-Calendar branch.

Calendar country/authority coverage expansion and all-tier racecourse inventory/ledger work do not wait for this resume rule; they remain active throughout.
