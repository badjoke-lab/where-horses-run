# Banei Detail Registry Activation

Status: active source-specific activation contract  
Work ID: `WHR-CAL-JAPAN-BANEI-A-PLUS`  
Last reviewed: 2026-07-09

## Purpose

This activation records the narrow set of Banei detail capabilities proven by the bounded live-source evidence run.

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
```

## Live evidence

The permanent evidence artifact is:

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

The Banei Registry profile remains:

```text
profile_status: provisional
primary_runner: reviewed_import
fallback_runner: null
```

The following fields are activated:

```text
detail_source_id: nar-banei-race-list-deba-table
detail_adapter_id: banei-nar-race-list-detail-v1
supported_observation_ranks: B, A+
supports_date_window: true
```

The schedule layer continues to provide the existing reviewed B-level observation path.

The new detail path proves complete A+ output for a bounded date-window run.

## Why the profile remains provisional

One successful GitHub Actions detail run does not by itself prove a unified system-level runner policy.

The current Banei system has two operational histories:

```text
schedule foundation: reviewed_import / dry-run lineage
detail live evidence: github_actions execution environment
```

The Registry has one system-level primary runner and fallback runner pair.

Therefore this activation does not silently switch the whole Banei system to GitHub Actions.

The profile remains provisional with:

```text
primary_runner: reviewed_import
pending_fields: fallback_runner
```

A later runner-policy PR must test schedule and detail acquisition under the proposed shared runner policy before changing this boundary.

## Capability that remains disabled

This activation does not enable:

```text
cross-month window
selected meetings
source-visible horizon
rank-upgrade retry
scheduled due-job execution
unattended publication
```

In Registry terms:

```text
supports_cross_month_window: false
supports_selected_meetings: false
supports_source_visible_horizon: false
supports_rank_upgrade_retry: false
```

The Banei Due-job Planner system rule also remains disabled.

## Why selected-meeting support remains disabled

The collector code accepts selected meeting IDs, but the bounded live evidence run exercised date-window mode only.

Code-path existence is not sufficient evidence for Registry activation.

Selected-meeting activation requires its own bounded execution proof.

## Why rank-upgrade retry remains disabled

Rank-upgrade retry requires more than an A+ parser.

It requires evidence for:

```text
selected-meeting execution
runner routing
retry backoff semantics
attempt accounting
failure isolation
Coverage and Manifest normalization
Retry Queue update behavior
```

Those are not activated by this PR.

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
- detail source ID is present in Acquisition Registry;
- detail adapter ID is present in Acquisition Registry;
- supported observation ranks remain evidence-based at B and A+;
- date-window support is true;
- profile remains provisional;
- primary runner remains reviewed_import;
- fallback runner remains pending;
- selected-meeting support remains false;
- rank-upgrade retry remains false;
- Due-job Planner Banei policy remains disabled;
- public and publication boundaries remain unchanged.

## Next handoff

The next Banei step is runner-policy convergence and selected-meeting execution proof.

That work should separately test:

1. Banei schedule acquisition under a candidate automated runner;
2. Banei detail date-window acquisition under the same runner;
3. selected-meeting execution on one known reviewed meeting;
4. shared Result Manifest and Review Queue normalization for the live detail batch;
5. failure behavior and fallback policy.

Only after that evidence should the profile become active or rank-upgrade retry be enabled.
