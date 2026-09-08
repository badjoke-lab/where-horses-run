# Where Horses Run — agent execution contract

Status: active repository execution instruction  
Adopted: 2026-09-08

This file tells coding/research agents how to enter and execute work in this repository. It does not override higher-authority contracts, schemas, or governance documents.

## Mandatory entry point

Before changing code, data, workflows, tests, or public documentation:

1. read `START-HERE.md`;
2. read `docs/governance/document-authority.md`;
3. read `docs/project-roadmap.md` and the latest adopted `docs/project-roadmap-YYYY-MM-DD-addendum.md` named by governance/`START-HERE.md`;
4. read the applicable canonical feature/programme specification and contracts;
5. confirm the current Work ID, current main state, and completion conditions.

Conversation history, issue comments, PR numbers, screenshots, and agent memory may explain intent but do not replace canonical repository documents.

## Re-read checkpoints

Re-read the applicable canonical specification and active schedule:

- at work start;
- whenever scope, behavior, or acceptance criteria change;
- after current `main` advances in a way that can affect the work;
- before opening or materially updating a PR;
- before merge;
- after merge, before starting the next Work ID.

If intended behavior differs from repository authority, update the specification/schedule first or in a preceding documentation PR. Do not silently implement a conversation-only rule.

## Calendar-specific entry rule

Before Calendar presentation, meeting-state, timezone, map/list/month, or official-stream work, also read:

```text
docs/specs/calendar-meeting-state-stream-and-view-2026-09-08.md
docs/specs/calendar-row-rank-live-localization-2026-09-08.md
docs/specs/map-first-site-ui-2026-09-06.md
docs/calendar/calendar-presentation-state-001-display-correction-schedule.md
docs/calendar/incremental-coverage-contract.md
docs/calendar/acquisition-control-plane-contract.md
docs/calendar/implementation-roadmap.md
```

Then inspect the current public view-model/components and the applicable machine-readable contracts before changing behavior.

Calendar implementation must preserve these separations unless a higher-authority contract is deliberately changed:

```text
acquisition/review/publication rank
meeting lifecycle state
selected display timezone
official stream state
Calendar view/presentation state
```

Do not fix a presentation defect by inventing a second meeting truth, guessed race time, guessed stream state, map-only override, or unreviewed public field.

## PR discipline

Every substantive PR must state at minimum:

```text
Work ID
Canonical documents reviewed
Specification/schedule changes
Runtime behavior changes
Tracker/registry/data changes, or none
Public display boundary changes, or none
Validation performed
Visible browser/screenshot evidence when UI changes
Completion conditions
Next Work ID
```

A green build or CI run is not sufficient evidence for visible UI/interaction changes. Inspect actual browser output and representative screenshots at the required desktop/mobile widths before merge.

## Public repository boundary

Never commit internal-only strategy notes, private workflow notes, credentials, raw restricted captures, non-public source material, or other material classified as internal-only by repository governance.

Only public-safe specifications, reviewed facts, schemas, code, tests, hashes, and public-safe operational summaries belong here.
