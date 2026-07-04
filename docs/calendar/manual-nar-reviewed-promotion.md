# Manual NAR reviewed promotion

Status: active operator runbook  
Work ID: `WHR-CAL-JAPAN-NAR-A-PLUS`

## Purpose

This command promotes the reviewed NAR monthly candidate batch through 2026-07-04 into canonical timetable datasets, rebuilds the deterministic public projection, synchronizes the Japan A+ runtime override file, validates the reviewed sixteen-meeting set, builds the site, and opens a review PR.

The command is pinned to the reviewed batch. A later cutoff requires a new monthly collection and review decision before promotion.

## Preconditions

- `data/candidates/nar-monthly-meeting-candidates.json` is merged and immutable for the review decision;
- the review manifest pins the exact source blob SHA and the exact sixteen approved candidate IDs;
- the NAR RaceList/DebaTable source supplement is A+ only for the fourteen flat-racing racecourses;
- the legacy `nar-monthly-convene-info` readiness record remains `link_only`;
- Obihiro Banei racing remains outside this Work ID.

## Run

From the repository root:

```bash
sh ./promote-nar-monthly-manual 2026-07 2026-07-04
```

The launcher creates an isolated temporary checkout. Local uncommitted work and the original working tree are not used or modified.

## Generated PR boundary

Only these files may change:

```text
data/candidates/nar-monthly-2026-07-through-2026-07-04-approved.json
data/generated/timetable/canonical/meetings.json
data/generated/timetable/canonical/meeting-details.json
data/generated/timetable/public/meeting-list.json
data/generated/timetable/public/meeting-details.json
data/generated/timetable/public/japan-a-plus-overrides.json
```

Any other changed path aborts the operator before push.

## Validation sequence

The operator validates the merged monthly candidate set and pinned review decision, generates the approved standard candidate bundle, promotes it to canonical datasets, rebuilds public projection data, synchronizes Japan A+ runtime overrides, verifies all sixteen reviewed meetings at canonical and public A+, checks the production runtime import boundary, and builds the static site.

The generated PR remains a separate review gate. The NAR batch is not considered published until that PR is reviewed and merged and deployment validation succeeds.

## Safety boundary

The approved and promoted rows contain only:

```text
label
post_time_local
race_name
distance_m
surface
course_label
```

Raw source bodies, participant data, odds, results, payouts, predictions, tips, and betting advice are outside the promotion boundary.

Scheduling and unattended publication remain disabled.
