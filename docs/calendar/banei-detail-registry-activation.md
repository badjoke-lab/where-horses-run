# Banei Detail Registry Activation

Status: active source-specific activation contract  
Work ID: `WHR-CAL-JAPAN-BANEI-A-PLUS`  
Last reviewed: 2026-07-09

## Purpose

This activation records the narrow set of Banei detail capabilities proven by bounded live-source evidence and the later runner-convergence evidence.

The activation is evidence-driven and intentionally incomplete.

The evidence chain is:

```text
reviewed Banei schedule inventory
-> Banei-specific RaceList / DebaTable adapter
-> bounded GitHub Actions date-window live run
-> one complete A+ candidate
-> source_window_complete Coverage
-> zero unresolved meetings
-> zero source errors
-> public-safe evidence summary
-> Authority Source Inventory supplement
-> Acquisition Registry detail source/adapter activation
-> bounded GitHub Actions full-month schedule proof
-> bounded GitHub Actions selected-meeting detail proof
-> runner convergence decision
```

## Live evidence

The permanent date-window evidence artifact is:

```text
data/fixtures/calendar-banei-live-smoke-evidence-v1.json
```

The reviewed bounded run records:

```text
meeting: banei-obihiro-racecourse-2026-07-04
meeting date: 2026-07-04
source: nar-banei-race-list-deba-table
adapter: banei-nar-race-list-detail-v1
observed rank: A+
race rows: 12
first race time: 14:30
last race time: 20:30
coverage: source_window_complete
records discovered: 1
records updated: 1
unresolved meetings: 0
source errors: 0
runner environment: github_actions
scope mode: date_window
blocked meetings: 0
```

Every retained row-semantics check is true:

```text
post time present
race name present
distance 200m
surface Dirt
course Banei Straight Course
```

The evidence summary stores artifact digests, not raw source bodies.

The permanent runner and selected-meeting evidence artifact is:

```text
data/fixtures/calendar-banei-runner-selected-evidence-v1.json
```

It proves that the same GitHub Actions execution environment completed:

```text
2026 July full-month Banei schedule collection
one bounded date-window A+ detail collection
one bounded selected-meeting A+ detail collection
```

The selected-meeting proof records:

```text
scope mode: selected_meetings
observed rank: A+
race rows: 12
coverage: source_window_complete
unresolved meetings: 0
source errors: 0
blocked meetings: 0
```

## Authority Source Inventory activation

The Banei detail route is registered as a separate authority/source record:

```text
country_id: japan
authority_id: banei-tokachi
official_source_id: nar-banei-race-list-deba-table
official source route: NAR RaceList programme family
source kind: programme
source status: verified
capability rank: A+
```

This record is separate from:

```text
nar-race-list-deba-table
```

which remains the flat-racing NAR source record and explicitly excludes Banei.

The Banei source record preserves Banei-specific parser semantics and no flat-racing matrix fallback.

## Acquisition Registry activation

The Banei Registry profile is now:

```text
profile_status: active
primary_runner: github_actions
fallback_runner: reviewed_import
```

The evidence-backed capability fields are:

```text
detail_source_id: nar-banei-race-list-deba-table
detail_adapter_id: banei-nar-race-list-detail-v1
supported_observation_ranks: B, A+
supports_date_window: true
supports_selected_meetings: true
```

The schedule layer continues to provide the reviewed B-level observation path.

The detail path proves complete A+ output for bounded date-window and selected-meeting execution.

## Runner convergence update

The original detail activation proved one bounded GitHub Actions date-window detail run but did not yet prove a unified system-level runner policy. That boundary has now been superseded by permanent runner-convergence evidence.

The same GitHub Actions execution environment has successfully completed:

```text
2026 July full-month Banei schedule collection
one bounded date-window A+ detail collection
one bounded selected-meeting A+ detail collection
```

The Registry therefore now uses GitHub Actions as the primary runner and reviewed import as the fallback.

This does not activate automatic Due-job planning or rank-upgrade retry.

## Capability that remains disabled

This activation does not enable:

```text
cross-month window
source-visible horizon
rank-upgrade retry
scheduled due-job execution
unattended publication
```

In Registry terms:

```text
supports_cross_month_window: false
supports_selected_meetings: true
supports_source_visible_horizon: false
supports_rank_upgrade_retry: true
```

The Banei Due-job Planner system rule is enabled only for bounded rank-retry planning.

## Selected-meeting support update

Selected-meeting support is now enabled because a bounded live GitHub Actions run successfully executed one reviewed meeting ID, produced one complete A+ candidate with 12 public-safe race rows, and recorded source_window_complete coverage with zero unresolved meetings, zero source errors, and zero blockers.

Selected-meeting support means an explicit reviewed Collection Job may target stable meeting IDs.

It does not mean rank-upgrade retry is enabled.

## Rank-upgrade retry activation update

Rank-upgrade retry is now enabled from the merged execution proof. The proof validates due/deferred selection, selected-meeting Job generation, one success and one failure-isolated partial result, success removal, failure retention, attempt accounting, 6h then 12h exponential backoff, max-attempt suppression, Coverage and Result Manifest normalization, and Review Queue behavior. The Banei Due-job rule is enabled only for bounded rank-retry planning; unrelated automation remains disabled.

## Adapter evidence mapping

The Acquisition Registry checker recognizes:

```text
banei-nar-race-list-detail-v1
```

only when the permanent live evidence artifact contains the matching adapter identity.

The checker also requires the Banei source inventory record to resolve under:

```text
japan / banei-tokachi / nar-banei-race-list-deba-table
```

Runner and selected-meeting activation additionally depend on the permanent runner-convergence evidence artifact.

## Public and safety boundary

Registry and source inventory artifacts remain summary metadata only.

They must not contain:

- horse names;
- jockey names;
- trainer names;
- owners or breeders;
- draw or gate positions;
- weights;
- odds;
- betting rank;
- results;
- payouts;
- predictions;
- tips;
- raw HTML;
- source bodies;
- credentials, cookies, secrets, or tokens;
- direct stream URLs.

## Activation completion boundary

This activation is complete when:

- the Banei detail Authority Source Inventory supplement is loaded;
- the source identity resolves to Banei Tokachi;
- live evidence validates as one complete A+ date-window run;
- runner evidence validates full-month schedule collection in GitHub Actions;
- selected-meeting evidence validates one complete A+ run in GitHub Actions;
- detail source ID is present in Acquisition Registry;
- detail adapter ID is present in Acquisition Registry;
- supported observation ranks remain evidence-based at B and A+;
- date-window support is true;
- profile is active;
- primary runner is github_actions;
- fallback runner is reviewed_import;
- selected-meeting support is true;
- rank-upgrade retry remains false;
- Due-job Planner Banei policy remains disabled;
- public and publication boundaries remain unchanged.

## Next handoff

Runner-policy convergence and selected-meeting execution proof are complete.

The next Banei step is retry execution proof covering:

1. explicit Retry Queue entry handling;
2. due versus deferred backoff behavior;
3. attempt-count increment;
4. selected-meeting Job generation from retry state;
5. one successful retry and one failure-isolated case;
6. Result Manifest and Review Queue behavior after retry.

Only after that evidence should rank-upgrade retry or Banei Due-job retry policy be enabled.
