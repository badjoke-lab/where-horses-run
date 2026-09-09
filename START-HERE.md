# Where Horses Run — current development entry point

Status: active entry point  
Last reviewed: 2026-09-09

`AGENTS.md` is the mandatory repository execution instruction. Read it before using this entry point.

## Required reading for all work

```text
AGENTS.md
docs/governance/document-authority.md
docs/governance/parallel-work-lanes-2026-09-08.md
docs/project-roadmap.md
docs/project-roadmap-2026-09-09-addendum.md
docs/specs/map-first-site-ui-2026-09-06.md
docs/operations/deployment-and-ci-policy.md
```

Re-read the applicable canonical specification and active roadmap/addendum whenever scope or acceptance criteria change, after relevant movement on `main`, before opening or materially updating a PR, before merge, and after merge before beginning the next Work ID. Conversation history and PR numbers do not replace canonical repository documents.

The active parallel-lane contract is mandatory. Calendar presentation/quality work, Calendar country/authority coverage expansion, Country/Racecourse publication work, and all-tier racecourse inventory/ledger work may proceed simultaneously. Do not serialize one behind another unless there is a real shared-file/shared-schema conflict.

## Country / Racecourse publication work: mandatory additional reading

Before changing Countries, Country detail, Racecourses, Racecourse detail, country/racecourse publication gates, or a new Calendar-supported country package, also read:

```text
docs/specs/country-racecourse-integrated-publication-2026-09-09.md
docs/runbooks/country-racecourse-publication-package.md
docs/racecourses/identity-reconciliation.md
docs/racecourses/public-timetable-connection.md
docs/racecourses/profile-evidence.md
docs/racecourses/page-link-architecture.md
```

The stable Country public gate is `data/static/calendar-public-country-support-v1.json`. Normal active Racecourse publication derives from that Country gate plus canonical racecourse status `active`/`current`. Current-day meeting presence is not a publication gate.

The public expansion model is:

```text
Calendar support
-> Country hub
-> active Racecourses
-> reviewed Map locations
-> Country <-> Racecourse <-> Calendar links
-> search / sitemap / primary navigation
```

The canonical country and all-tier racecourse masters remain broader than normal public exposure. Closed/historical racecourses remain a separate future publication lane.

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

Use `docs/project-roadmap-2026-09-09-addendum.md` as the current top-level product/UI execution authority and `docs/governance/parallel-work-lanes-2026-09-08.md` as the active concurrency contract.

```text
Current stage: reviewed_incremental_maintenance
Active product/UI lane: integrated Country/Racecourse expansion
Completed UI Work ID: UI-008A — Calendar-supported Country public gate
Completed UI Work ID: UI-008B — Japan Country reference hub
Completed UI Work ID: UI-008C — Tokyo Racecourse reference hub
Completed UI Work ID: UI-008D — supported Country/Racecourse projection
Current UI Work ID: UI-008E — future country vertical publication package
Next UI Work ID: UI-009 — EN/JA responsive and navigation release verification
Parallel Calendar quality lane: calendar_quality_and_coverage
Active Calendar country/authority coverage expansion: continues independently
Active all-tier racecourse inventory/ledger lane: continues independently
```

UI-008E does not add another hard-coded country or racecourse allowlist. The generic publication projection already derives public Country and active Racecourse surfaces from the stable gates. UI-008E standardizes how every future Calendar-country addition is completed vertically using `docs/runbooks/country-racecourse-publication-package.md`.

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

Once a country reaches reviewed normal Calendar support, its public Country/Racecourse package follows the integrated publication specification and package runbook. Missing optional enrichment is recorded as a gap; it is not filled with guessed facts.

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

Before PR material update and immediately before merge, each active lane must re-read current `main`, inspect shared-file changes since its branch base, preserve compatible changes from the other lanes, and rerun its applicable gates on the reconciled exact head.

Visible UI/interaction work requires actual browser output and representative screenshot inspection. A green build or CI run alone is not completion evidence.

## Public repository boundary

Never commit internal-only strategy notes, private workflow notes, credentials, raw restricted captures, non-public source material, or other material classified as internal-only by repository governance.

Only public-safe specifications, reviewed facts, schemas, code, tests, hashes, and public-safe operational summaries belong here.

## Continue rule

After each merged Work ID or country package:

1. re-read `AGENTS.md`;
2. re-read this file and `docs/governance/document-authority.md`;
3. re-read the latest project-roadmap addendum and applicable canonical specification/runbook;
4. confirm the merged Work ID/package state in the roadmap;
5. start the next Work ID from current `main`, not a stale prior branch.

Calendar country/authority coverage expansion and all-tier racecourse inventory/ledger work remain active in parallel throughout this process.
