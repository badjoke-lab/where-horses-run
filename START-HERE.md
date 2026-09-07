# Where Horses Run — current development entry point

Status: active entry point  
Last reviewed: 2026-09-08

`AGENTS.md` defines the mandatory repository execution procedure. This file is the current human/agent entry point and deliberately links to canonical documents rather than duplicating historical implementation inventories.

## Required reading

Read these before substantive work:

```text
AGENTS.md
docs/governance/document-authority.md
docs/project-roadmap.md
docs/project-roadmap-2026-09-08-addendum.md
docs/operations/deployment-and-ci-policy.md
```

For current product/UI work also read:

```text
docs/specs/map-first-site-ui-2026-09-06.md
docs/decisions/map-ui-integration-2026-09-05.md
```

For Calendar presentation, meeting-state, timezone, List/Month/Map, or official-stream work also read:

```text
docs/specs/calendar-meeting-state-stream-and-view-2026-09-08.md
docs/calendar/README.md
docs/calendar/incremental-coverage-contract.md
docs/calendar/acquisition-control-plane-contract.md
docs/calendar/acquisition-control-plane-implementation-plan.md
docs/calendar/implementation-roadmap.md
docs/calendar/machine-readable-contracts.md
docs/calendar/validation-responsibility-contract.md
```

For acquisition/source expansion, additionally follow the applicable source-test/readiness, registry, runner, review, completion, and publication-boundary contracts listed by `docs/governance/document-authority.md`.

Conversation history and PR numbers do not replace canonical repository documents.

## Re-read rule

Re-read the applicable specification and active roadmap/addendum:

- at work start;
- whenever scope or acceptance criteria change;
- after relevant movement on `main`;
- before opening/updating a PR;
- before merge;
- after merge before starting the next Work ID.

If implementation intent differs from the repository authority, update the specification/schedule first or in a preceding documentation PR. Do not silently implement a conversation-only rule.

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

Core rules:

- operator runs may be irregular;
- windows may vary, overlap, cross month boundaries, or target selected meetings;
- shorter source horizons and valid partial batches are allowed;
- meetings may enter at C, B, B+, A, or A+ according to reviewed evidence;
- direct promotion may skip intermediate ranks when evidence supports a higher rank;
- absence from one run is not deletion or cancellation;
- normal promotion rejects rank regression;
- corrective downgrade is a separate explicit reviewed path;
- runner choice does not change batch, rank, coverage, review, or promotion semantics;
- month or season completeness belongs only to explicit Completion Audit;
- unattended publication remains disabled unless separately approved.

## Calendar presentation invariants

Current Calendar presentation authority is `docs/specs/calendar-meeting-state-stream-and-view-2026-09-08.md`.

Keep these dimensions separate:

```text
meeting lifecycle state
selected display timezone
official stream state
Calendar view state
acquisition/review/publication state
```

The rolling 30-day public window remains the Calendar browsing scope. List is one-day-at-a-time, Month is compact date overview/navigation, and Map is geographic discovery from the same reviewed public meeting records.

Meeting lifecycle state uses reviewed venue/source-local timing converted to instants; changing the display timezone must not change lifecycle truth. Official stream state is independent and must fail closed on stale/mismatched detector evidence.

## Runner model

Runner routing is system/source/adapter specific, not country-only. The Acquisition Registry is the routing source of truth. Do not manage systems by operator memory.

Existing Calendar machine-readable contracts, schemas, registries, runner contracts, review queues, release gates, and validators remain canonical through the documents listed in `docs/governance/document-authority.md` and `docs/calendar/machine-readable-contracts.md`.

## Current work

```text
Current stage: reviewed_incremental_maintenance
Primary product/UI lane: map_first_site_ui
Current UI Work ID: UI-006
Next UI Work ID: UI-007
Parallel Calendar quality lane: calendar_quality_and_coverage
Active Calendar presentation correction: WHR-CAL-PRESENTATION-STATE-001
Current state authority: docs/project-roadmap-2026-09-08-addendum.md
Calendar presentation authority: docs/specs/calendar-meeting-state-stream-and-view-2026-09-08.md
Automatic publication: disabled
Human review bypass: prohibited
```

The current Calendar correction executes in this order:

```text
specification/governance update
-> existing implementation audit
-> meeting lifecycle correction
-> official stream-state correction
-> state × stream × timezone regression tests
-> List / Month / Map structure correction
-> desktop/mobile presentation refinement
-> Representative Visual Audit
-> merge after acceptance evidence
```

The primary UI lane remains `UI-006` Racecourses, followed by `UI-007` racecourse detail, `UI-008` secondary pages, and `UI-009` EN/JA responsive release verification. Calendar data-quality/coverage continues independently.

## Visible UI acceptance

A green build or CI run is not enough for visible interaction changes. Inspect actual browser behavior and representative screenshots before merge. For the current Calendar correction, the 393×852 List screenshot must show an actual meeting row in the first viewport when the focused date contains meetings.

## Public repository boundary

Only public-safe specifications, reviewed facts, schemas, code, tests, hashes, and public-safe operational summaries belong in this repository. Internal-only strategy notes, private workflow notes, credentials, raw restricted captures, and other internal-only material must remain outside it.
