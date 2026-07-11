# UAE ERA PILOT-06 canonical venue and acquisition profile foundation

Status: implementation and bounded review-only execution evidence  
Work ID: `WHR-CAL-UAE-ERA`  
Implementation unit: `UAE-PILOT-06`  
Last reviewed: 2026-07-11

## Starting decisions

PILOT-05 completed two explicit decisions.

### Reviewed fixture window

```text
accepted source:
  official fixture PDF coordinate grid

start:
  2026-10-22

end inclusive:
  2027-04-15

end exclusive:
  2027-04-16

coverage state:
  count_closed_reviewed_pdf_fixture_window
```

The article narrative closing date is not used as the exhaustive fixture-window boundary.

### Venue identity approval

```text
Meydan Racecourse
-> meydan-racecourse

Abu Dhabi Turf Club
-> abu-dhabi-turf-club

Al Ain Racecourse
-> al-ain-racecourse

Jebel Ali Racecourse
-> jebel-ali-racecourse

Sharjah Racecourse
-> sharjah-racecourse
```

All five identities are approved for registration, but PILOT-05 performed no Registry write.

## Purpose

PILOT-06 turns the reviewed evidence chain into an explicit acquisition foundation without enabling unattended operation.

The unit contains four implementation areas:

1. canonical racecourse identity registration for the four newly approved venues;
2. Calendar Readiness alignment to all five approved venues;
3. provisional Acquisition Registry and runner-compatibility representation;
4. review-only C-level candidate artifact generation from the evidence-backed PDF coordinate-grid route.

## Racecourse Registry scope

`meydan-racecourse` already exists in the base Racecourse Registry and must not be duplicated.

The four newly approved identities are added to the extension Registry:

```text
abu-dhabi-turf-club
al-ain-racecourse
jebel-ali-racecourse
sharjah-racecourse
```

PILOT-06 registration is identity-first and conservative.

The new records include:

- approved stable ID;
- official English label;
- Japanese display label;
- country and timezone;
- official ERA venue page link;
- high-level racing-type context;
- placeholder image state;
- partial course-profile status;
- official-link-only schedule state.

PILOT-06 does not infer unreviewed circumference, distance, surface, direction, lighting, or course-layout facts.

## Readiness alignment

The UAE ERA Calendar Readiness record changes from a Meydan-only manual boundary to a five-venue fixture-validated prototype boundary.

Expected state:

```text
racecourse scope:
  five approved IDs

technical rank:
  C

public ceiling:
  C

source format:
  mixed

access mode:
  direct

automation mode:
  semi_automatic

readiness:
  prototype_ready

implementation status:
  fixture_validated

fallback:
  keep_last_verified_and_mark_stale
```

`semi_automatic` means the evidence-backed parser and artifact generator exist. It does not mean automatic execution, approval, promotion, or publication.

## Acquisition Registry profile

The UAE system profile remains provisional.

```text
system_id:
  uae-national-racing-system

profile_status:
  provisional

primary_runner:
  github_actions

fallback_runner:
  null

schedule_source_id:
  era-season-calendar

schedule_adapter_id:
  uae-era-pdf-grid-actions-v1

technical_capability_rank:
  C

public_ceiling:
  C

supported_observation_ranks:
  C only
```

The profile enables only:

```text
supports_source_visible_horizon: true
```

It keeps disabled:

```text
supports_date_window: false
supports_cross_month_window: false
supports_selected_meetings: false
supports_rank_upgrade_retry: false
```

The following remain pending:

```text
fallback_runner
detail_source_id
detail_adapter_id
```

## Runner compatibility

The evidence-backed execution route is represented as:

```text
system:
  uae-national-racing-system

runner:
  github_actions

executor_id:
  uae-era-pdf-grid-actions

entry point:
  scripts/timetable/run-uae-era-pdf-grid-actions.mjs

output model:
  uae-era-pdf-grid-artifact-batch

supported collection mode:
  source_visible_horizon only
```

The runner requires a valid Collection Job and Runner Execution envelope.

## Collection Job boundary

The reviewed Job requests exactly the accepted fixture window:

```text
collection_mode:
  source_visible_horizon

start_date:
  2026-10-22

end_date_exclusive:
  2027-04-16

timezone:
  Asia/Dubai

rank_strategy:
  best_available

target_rank:
  null

runner:
  github_actions
```

Arbitrary date-window mode is not activated in this unit.

## Review-only execution path

The bounded executor performs:

```text
Collection Job
+ Runner Execution validation
-> official PDF coordinate probe
-> coordinate-aware grid parser
-> PILOT-05 approved venue mapping application
-> C-level timetable-candidate-v1
-> Coverage Observation
-> Collection Result Manifest
-> review-only collection report
```

The parser evidence must still close to:

```text
records: 64

Meydan: 17
Abu Dhabi: 16
Al Ain: 14
Jebel Ali: 11
Sharjah: 6
```

Every candidate remains:

```text
capability_rank: C
first_race_time_local: null
last_race_time_local: null
timetable_rows: []
review_status: needs_review
```

The candidate batch review state is also `needs_review` and promotion target is null.

## Output boundary

The executor requires an output directory outside the repository.

The only intended output files are:

```text
candidates.json
coverage-observation.json
collection-result-manifest.json
collection-report.json
```

The executor must not store:

- raw PDF bytes;
- raw extracted text;
- unapproved source text;
- canonical timetable data;
- public timetable data.

## Existing baseline validator limitation

The repository-wide legacy `validate-data.mjs` currently exposes pre-existing unrelated Racecourse Registry debt, including a duplicate `sha-tin-racecourse` ID and missing direction values on existing Hong Kong records.

PILOT-06 does not silently repair unrelated historical records.

The unit therefore uses a source-specific validator for the new UAE venue identities and separately revalidates Calendar Acquisition Registry, runner compatibility, governance, protected-state hashes, and review-only execution outputs.

## Safety boundary

PILOT-06 keeps disabled:

```text
scheduled acquisition execution
automatic Queue mutation
automatic approval
automatic promotion
automatic publication
canonical write
public write
deployment
```

The current public capability remains C-level meeting date and approved racecourse identity only.

## Handoff condition

PILOT-06 is complete when:

1. all five approved venue identities resolve exactly once across base and extension Racecourse Registries;
2. Readiness scope lists all five IDs and remains C-only;
3. the provisional Acquisition Registry profile validates;
4. runner compatibility validates for GitHub Actions + source-visible-horizon only;
5. a live bounded execution produces 64 review-only C candidates with exact venue count closure;
6. Coverage Observation and Result Manifest validate and agree;
7. raw-source, canonical, and public protected state remains unchanged;
8. repository worktree remains clean after execution and external output cleanup;
9. no automatic execution or publication path is enabled.
