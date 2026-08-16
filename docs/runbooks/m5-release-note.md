# M5 release note — reviewable candidate freshness automation

Status: release candidate for roadmap PR-095  
Scope: M5 candidate-generation and review infrastructure. This release does **not** authorize automatic publication.

## Outcome

M5 reduces the manual work required to discover and review timetable changes while preserving the existing publication boundary.

The implemented path is:

```text
official source / reviewed input
  -> bounded candidate collection
  -> timetable-candidate-v1
  -> deterministic validation + dry-run log
  -> review-only candidate diff
  -> explicit human review decision
  -> separate future promotion control
```

The scheduled path stops before Canonical/public writes. Human approval in M5 is approval for a separate handoff only, not approval for Canonical promotion.

## PR-088 — scheduled candidate generation design

`docs/runbooks/m5-scheduled-candidate-generation-design.md` defines the common fail-closed contract.

- TJK: `eligible` for bounded scheduled dry-run while the verified route contract remains valid.
- KRA: `reviewed_input_only`; the reviewed 2026 plan must not be treated as perpetual live freshness.
- SOREC / Morocco: `blocked` until a stable official meeting/programme route is separately verified.
- candidate generation cannot approve, promote, publish, merge, or deploy.
- raw HTML/body, full racecards, participants, betting/results/payouts, predictions/tips, credentials, and stream material are not retained by the scheduled layer.

## PR-089 — dry-run generation logs

M5 adds `scheduled-candidate-run-log-v1`.

The run log distinguishes generated, valid-empty, offseason, blocked, disabled, source/route/parse/validation failure states and fixes `run_mode` to `dry_run`.

All publication effects remain false. The log rejects prohibited payload/credential fields and cannot make a failed/blocked run look like a promotable candidate.

## PR-090 — candidate diff page

M5 adds a review-only HTML diff artifact between `timetable-candidate-v1` and the Canonical baseline.

The diff is not a public route and has no approval/publication effect. `baseline_only` explicitly means that a baseline record is absent from that candidate partition; it is **not** a deletion instruction.

## PR-091 — auto PR generation runbook

PR-091 is a **runbook only**. M5 does not claim that a new automatic PR writer was implemented.

The runbook preserves PR #559 (`Calendar daily acquisition review queue`) as the existing long-lived draft human-review queue, forbids one-PR-per-run churn, forbids force-push replacement, and keeps queue updates separate from approval/publication.

PR #559 remains open and review-only. It must not be merged merely because automation updates it.

## PR-092 — GitHub Actions dry-run

The existing TJK current/future candidate workflow now runs a bounded M5 read-only path on schedule/manual dispatch and on relevant `main` pushes.

Permanent boundaries:

- `permissions: contents: read`;
- no `contents: write` or pull-request write permission;
- one captured run timestamp;
- page-discovered official TJK current/future meetings only;
- unattended current/future candidates capped at **Rank C**;
- candidate + run log + review diff are short-lived Actions artifacts;
- tracked repository state must remain unchanged;
- no promotion, Canonical/public write, merge, or deploy.

### Real main-run evidence

The first merged end-to-end read-only run completed successfully:

- workflow: `Calendar TJK current/future candidates`
- run ID: `31895655101`
- artifact ID: `9249724016`
- candidate count: `3`
- candidate rank: `C`
- diff: `changed 0 / candidate_only 3 / baseline_only 0 / unchanged 0`
- candidate SHA-256: `08f9fbc056230316953ba0fd5f43f3ccb1462164f61e993e15dcd9796f63a332`
- tracked repository write: none
- publication effects: none

That run proves the dry-run path on a real TJK source. It does not prove automatic publication and does not raise TJK unattended data to Rank A.

## PR-093 — human review workflow

M5 adds `M5 human candidate review`, manually dispatched on `main` with only:

- `actions: read`
- `contents: read`

The workflow resolves trusted source-run metadata from GitHub, downloads the exact run artifact, binds the decision to the candidate SHA-256, rebuilds the candidate diff from the source-head Canonical baseline, requires byte equality, and rejects bot reviewers/tampered evidence.

The output `timetable-human-review-decision-v1` records `approved_for_separate_handoff` or `rejected` while keeping:

- candidate pending/unmodified;
- `candidate_approved_for_canonical_promotion: false`;
- Canonical/public writes false;
- merge/deploy false.

## PR-094 — stale data warning

M5 makes freshness uncertainty visible without increasing the timetable rank or adding race detail.

- source checks 0–1 calendar day old are treated as current;
- checks 2+ days old trigger a compact stale-data warning for the meeting list;
- missing check dates remain explicit as unknown;
- the existing projection state `stale_generation_with_window_records` is labeled as a stale-data warning;
- official-source links remain visible for final confirmation;
- existing compact one-meeting-row markup and performance budgets remain enforced.

## Public display boundary remains unchanged

M5 does not change what Where Horses Run may publish.

- Rank C: meeting date + racecourse only.
- Rank A: race label/number + post time only.
- Rank A+: reviewed programme-summary fields only on the applicable meeting detail surface.

The public site still excludes full racecards, runners/horses, jockeys, trainers, owners, weights/form, odds, betting material, results, payouts, predictions/tips, raw source bodies, and direct stream URLs.

## Country state at M5 release

| Country/source | M5 automation state | Public consequence |
| --- | --- | --- |
| Turkey / TJK | live bounded scheduled dry-run available | unattended candidates remain Rank C and review-only |
| South Korea / KRA | reviewed-input-only | no claim of live automated freshness |
| Morocco / SOREC | blocked | no fabricated candidates; official programme route still required |
| Japan / Hong Kong / UAE | existing reviewed/public pipelines remain in place | M5 does not silently reroute them through TJK automation |

## What M5 does not complete

M5 deliberately leaves these outside this release:

- fully automatic unreviewed publishing;
- automatic candidate approval;
- a new auto-PR writer for the M5 candidate artifacts;
- automatic merge of PR #559 or any review queue;
- unattended Canonical promotion;
- unattended public projection writes;
- source-body archives;
- SOREC current/future generation before source verification;
- treating KRA reviewed plans as live source evidence.

## Release acceptance

PR-095 is releasable only when the release gate proves that PR-088 through PR-094 contracts are present together and remain non-publishing, and the exact PR-095 head passes repository CI.

After M5, the roadmap proceeds to M6, beginning with PR-096 Mobile timetable UX pass. M6 may improve presentation/usability but must not weaken these review/publication boundaries.
