# Racecourse notable and graded-race roadmap — 2026-09-09

Status: active racecourse programme roadmap  
Adopted: 2026-09-09  
Current Work ID: `WHR-RACECOURSE-NOTABLE-RACES-001`  
Specification: `docs/racecourses/notable-and-graded-race-display-2026-09-09.md`

## Programme goal

Turn the current small `notable_races` list into a durable racecourse ↔ graded-race information system without delaying the immediate correction of misleading external links.

The end state is not a collection of manually maintained race-name links. It is a stable race entity model with current and historical racecourse relationships.

## Phase 1 — immediate display correction

Work ID: `WHR-RACECOURSE-NOTABLE-RACES-001`

Scope:

```text
remove external anchors from notable-race names
preserve localized race names
keep official venue/authority links in Official Sources
add regression protection
```

No graded-race completeness claim is made in this phase.

## Phase 2 — representative-race selection audit

Work ID: `WHR-GRADED-RACE-REPRESENTATIVE-AUDIT-001`

Goal:

- review the current representative list for every racecourse that has one;
- correct poor, duplicated, stale, or non-representative selections;
- target roughly 3–5 representative races where evidence supports them;
- leave explicit unresolved state where no defensible selection has been researched.

This is an editorial/identity-quality pass, not yet a complete graded-race inventory.

## Phase 3 — active graded-race master

Work ID: `WHR-GRADED-RACE-ACTIVE-MASTER-001`

Build a canonical race master by racing system/authority.

The programme must distinguish:

```text
race identity
current name
current classification / grade
current racecourse
race conditions
current status
source/evidence
```

Completeness is claimed only per researched racing system and only when the applicable official/authoritative source set supports that claim.

## Phase 4 — internal race pages

Work ID: `WHR-GRADED-RACE-PAGES-001`

Target routes:

```text
/races/[slug]/
/ja/races/[slug]/
```

Racecourse pages then link notable/current graded races to WHR internal pages instead of external race/venue URLs.

## Phase 5 — complete active racecourse graded-race sections

Work ID: `WHR-GRADED-RACE-RACECOURSE-ACTIVE-001`

Where the applicable system has complete active coverage, racecourse pages may expose:

```text
Notable graded races
All current graded races
count / classification summary when machine-derived
```

The short representative section remains useful even after the complete list exists.

## Phase 6 — historical graded-race master

Work ID: `WHR-GRADED-RACE-HISTORY-001`

Expand canonical race records with reviewed history:

```text
renames
grade/classification changes
racecourse moves
suspensions
revivals
discontinuations
```

Historical relationships must be date-bounded where the evidence permits.

## Phase 7 — closed racecourses and historical relationships

Work ID: `WHR-GRADED-RACE-CLOSED-RACECOURSE-001`

Closed/dead racecourse pages may expose historically hosted graded races. A race that moved elsewhere remains associated with the former venue for the appropriate historical period.

This phase turns the racecourse archive and graded-race archive into mutually reinforcing reference content.

## Data-model migration direction

Short term:

```text
racecourse.notable_races[] = display names + evidence metadata
```

Target:

```text
racecourse.notable_race_ids[] -> race.id
race.current_racecourse_id -> racecourse.id
race.racecourse_history[] -> racecourse.id + date range/status
```

Do not mass-convert free-form names into `race_id` without identity review.

## Publication boundary

- External evidence does not automatically become a public race-name link.
- Official venue/authority links remain under Official Sources.
- Internal race pages become the preferred navigation target once implemented.
- No participant, odds, result, payout, prediction, full-racecard, raw-source, or direct-stream dataset is authorized by this roadmap.

## Current completion checklist

`WHR-RACECOURSE-NOTABLE-RACES-001` is complete only after:

- specification/roadmap committed;
- agent entry pointer committed;
- text-only notable-race rendering committed;
- regression check committed and wired into CI;
- exact-head build/check pass;
- EN/JA representative page output inspected;
- current main reconciled before merge.

## Next Work ID

After the bounded display correction:

```text
WHR-GRADED-RACE-REPRESENTATIVE-AUDIT-001
```
