# Where Horses Run project roadmap — 2026-08-25 active addendum

Status: active canonical project-roadmap addendum  
Adopted: 2026-08-25  
Supersedes for current execution state: `docs/project-roadmap-2026-08-12-addendum.md`  
Base roadmap: `docs/project-roadmap.md`

This addendum synchronizes the canonical execution entry point with work already merged after the 2026-08-12 TJK snapshot. Historical roadmap markers remain preserved in the base roadmap and earlier addenda, but they are not the current execution state.

## Current stage

```text
Current stage: reviewed_incremental_maintenance
Release basis: M6 v1.0 / PR #599
Current release line: v1.0
Automatic publication: disabled
Human review bypass: prohibited
```

PR #599 / `M6-V1-RELEASE-01` is authoritative for the post-v1 transition and records `next_stage: reviewed_incremental_maintenance`. There is no separate uncompleted M4, M5, or M6 implementation phase after that merge.

## Completed product and release sequence

The following earlier programme markers are complete and must not be treated as current work:

- `WHR-RACECOURSE-PAGES-V1` — completed racecourse-page identity, timetable connection, profile evidence, link architecture, and bilingual QA;
- `WHR-GLOSSARY-DICTIONARY-V1` — public v1 released by PR #522 as `WHR-GLOSSARY-V1`, with 48 concepts, 98 bilingual routes, and 57 relationship edges;
- glossary/search follow-up — bilingual global search, race-type filters, glossary search, and page metadata were subsequently merged;
- M4 country expansion — completed by PR #584;
- M5 reviewable candidate freshness automation — completed by PR #592;
- M6 v1.0 release — completed by PR #599.

The repository's historical `v1.0.0` tag policy remains governed by the M6 release contract. This addendum does not move, delete, or repurpose that tag and does not create a new semantic version.

## Source-expansion state

### Turkey / TJK

The 2026-08-12 addendum stopped at bounded TJK candidate review. That state has since advanced.

PR #579 published the reviewed Ankara and Kocaeli timetable records at the approved public A ceiling. The earlier TJK human-review gate is therefore complete and is no longer the current project gate.

### Morocco / SOREC

PR #582 completed `SOREC-SOURCE-REVALIDATION-01` and retained a fail-closed decision:

```text
status: blocked_no_public_timetable_source
technical capability rank: not_confirmed
adapter status: blocked
candidate generation: false
canonical write: false
public projection write: false
rank change: false
```

The official SOREC racing page and seven-racecourse set are reviewed evidence, but no stable public official meeting-date / daily-programme route was verified. SOREC adapter work resumes only after a public official source exposes concrete meeting-date + racecourse pairings. Do not invent Morocco timetable candidates from institutional or directory content.

No new country/source Work ID is created by this addendum merely to keep a roadmap moving. Source expansion proceeds only from an existing reviewed source gate or a separately adopted plan.

## Reviewed incremental maintenance

The active post-v1 mode is continuous reviewed maintenance rather than another numbered release phase. Work may proceed in parallel when the applicable contract permits it.

Current maintenance lanes include:

1. rolling Calendar horizon maintenance;
2. source acquisition and source-health revalidation through the Acquisition Control Plane;
3. human review of Draft PR #559 evidence without merging that queue wholesale;
4. bounded promotion of newly supported timetable records or higher-rank detail only after current-canonical comparison;
5. source-specific retries for explicit pending records when useful;
6. correction, rollback, regression, bilingual/rendered QA, SEO, accessibility, and performance maintenance required by reviewed data growth;
7. source expansion only when its existing evidence/resume gate is satisfied.

Maintenance is not permission to bypass the public-data boundary or historical release contracts.

## Calendar operating snapshot — 2026-08-25

Current main at adoption:

```text
707c1a8aa54d563b36247d26ee6c204ab6882cbc
```

The month-boundary Due-job Planner repair in PR #621 is merged. Main daily-acquisition run `32809782925` completed validate, plan, hosted execution, and review-branch delivery successfully while preserving JRA hosted exclusion.

The latest explicitly refreshed NAR regular batch contains:

```text
scheduled meetings: 48
complete-detail candidates: 14
schedule-only candidates: 34
detail blockers: 34
schedule errors: 0
current promotion delta: 0
```

All 14 complete-detail records are already represented by current reviewed public-safe A+ content, so they are verified no-ops. The 34 remaining records stay `scheduled_pending_details` under `manual_irregular_retry`; scheduled retry, Canonical write, and public write remain disabled.

A bounded 2026-08-28 selected-meetings retry for Funabashi and Kasamatsu returned zero complete-detail candidates, so both remain pending and no promotion was created.

Draft PR #559 remains the durable review queue and must remain DRAFT / unmerged. It is evidence storage and review state, not a publication branch.

## Publication and automation boundary

The v1.0 release boundary remains unchanged:

- candidate generation and validation may be automated;
- human review may not be bypassed;
- automatic approval and automatic publication remain disabled;
- complete racecards, entries/participants, odds, results, payouts, predictions, betting advice, copied/raw source bodies, raw HTML, and direct stream URLs remain outside the public timetable boundary;
- A+ remains a lightweight programme summary on meeting-detail pages;
- acquisition/retry evidence does not authorize Canonical or public writes by itself.

## Current execution rule

When deciding what to do next:

1. check the latest reviewed maintenance evidence and active source/resume gates;
2. perform non-waiting maintenance work that is already authorized by existing contracts;
3. use exact current-canonical comparison before timetable promotion;
4. do not create empty promotion PRs for no-op acquisition results;
5. do not reinterpret blocked source research as publication evidence;
6. update this addendum or adopt a newer one when a new top-level release phase or source-expansion plan is actually approved.

## Authority rule

For current/next project execution state, this addendum supersedes `docs/project-roadmap-2026-08-12-addendum.md`, `docs/project-roadmap-2026-08-09-addendum.md`, and stale current-work markers preserved in `docs/project-roadmap.md` or `START-HERE.md` for historical compatibility.

Active contracts and machine-readable schemas still outrank roadmap prose. Programme-specific current addenda and operations contracts continue to govern their own detailed behavior.
