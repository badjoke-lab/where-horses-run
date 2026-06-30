# Calendar baseline reconciliation map

Status: reviewed canonical migration map  
Work ID: `WHR-CAL-BASELINE-RECONCILE`  
Reviewed against main: `d3de6114cb3d9a2dc1b2c625678ec4557c38c595`  
Review date: 2026-07-01  
Next Work ID: `WHR-CAL-PIPELINE-V1`

## Result

The existing Calendar implementation is not discarded and it is not activated as-is. This reconciliation classifies 37 component groups and fixes the two unsafe execution paths that could run before pipeline v1 is ready.

| Classification | Count | Meaning |
| --- | ---: | --- |
| retain | 12 | Keep as an active contract, evidence base, type, route, or public boundary. |
| repair | 9 | Keep the role, but correct ownership, determinism, status, or operations. |
| migrate | 7 | Move useful source-specific or transitional logic into the shared v1 pipeline. |
| replace | 4 | Do not carry the current implementation into active operation. |
| archive | 5 | Preserve evidence until dependencies/assertions are migrated, then remove from active paths. |

Priority distribution: 11 critical, 17 high, 8 medium, and 1 low.

The machine-readable source of truth is [`../../data/audits/calendar-baseline-migration-map.json`](../../data/audits/calendar-baseline-migration-map.json).

## Immediate safeguards completed here

### Normal build is read-only

`npm run build` no longer invokes `merge:june-2026-manual-records`. The old command remains available only as explicit migration evidence. Normal production builds must not mutate committed generated data.

This safeguard is required because the old June merge/build path can reconstruct timetable files from older manual/sample inputs and overwrite newer canonical JRA/HKJC data.

### Incomplete daily refresh is paused

The cron trigger is removed from `.github/workflows/timetable-scheduled-refresh.yml`. Manual review dispatch remains available and defaults to no live fetch.

Scheduling is restored only under `WHR-CAL-OPS-V1`, after reviewed adapters, candidate validation, human promotion, stale/failure handling, rollback, and generated-PR review gates are complete.

## Target architecture

```text
official source or reviewed manual import
-> source adapter
-> bounded candidate
-> candidate validation
-> human review
-> idempotent promotion
-> canonical meeting data
-> publication policy
-> deterministic public projection
-> static pages
```

Ownership rules:

- adapters write candidates, not canonical or public data;
- promotion is the only canonical writer;
- public projection is the only public JSON writer;
- pages read public JSON only;
- normal build reads committed data and produces the site without repository mutation;
- scheduled operation creates reviewable candidate/update changes and never directly publishes.

## Critical decisions

1. **Replace the legacy canonical builder.** It reads overlapping manual/sample sources, contains fixed June 2026 records, and can overwrite newer records.
2. **Repair public projection.** Keep the rank/field policy resolver, but detach it from legacy acquisition and make output deterministic.
3. **Replace skeleton refresh.** `skeleton_no_live_fetch` commands cannot be treated as an active acquisition pipeline.
4. **Migrate JRA and HKJC source logic.** Existing work is useful, but source scripts must emit bounded candidates and stop writing canonical/public files directly.
5. **Migrate all runtime pages to the public boundary.** No page may import candidates, canonical records, raw snapshots, manual seeds, or normalized samples.
6. **Replace fixed-date logic.** Today/Tomorrow and Calendar must use explicit build date and timezone rules.
7. **Archive only after migration.** Historical PR files, June seeds, preview modules, and milestone validators remain until provenance and assertions have named replacements.

## Component decisions

| Component | Domain | Decision | Priority | Target |
| --- | --- | --- | --- | --- |
| `calendar-contracts` | contracts | **retain** | high | `WHR-CAL-PIPELINE-V1` |
| `canonical-authority-readiness` | canonical_registries | **retain** | high | `WHR-CAL-PIPELINE-V1` |
| `public-display-boundary` | publication_policy | **retain** | critical | `WHR-CAL-PIPELINE-V1, WHR-CAL-PUBLIC-V1` |
| `source-and-route-registries` | source_routes | **repair** | high | `WHR-CAL-PIPELINE-V1` |
| `manual-snapshot-contracts` | snapshot_contracts | **retain** | medium | `WHR-CAL-PIPELINE-V1, WHR-CAL-OPS-V1` |
| `adapter-interfaces` | adapters | **retain** | high | `WHR-CAL-PIPELINE-V1` |
| `fixture-parser-harness` | fixtures | **retain** | high | `WHR-CAL-PIPELINE-V1` |
| `candidate-contract` | candidate_generation | **retain** | high | `WHR-CAL-PIPELINE-V1` |
| `country-candidate-generators` | candidate_generation | **migrate** | high | `WHR-CAL-PIPELINE-V1, WHR-CAL-JAPAN-JRA, WHR-CAL-JAPAN-NAR, WHR-CAL-JAPAN-BANEI, WHR-CAL-UAE-ERA` |
| `promotion-gates` | promotion | **repair** | critical | `WHR-CAL-PIPELINE-V1, WHR-CAL-OPS-V1` |
| `canonical-types` | canonical_generation | **retain** | high | `WHR-CAL-PIPELINE-V1` |
| `legacy-canonical-builder` | canonical_generation | **replace** | critical | `WHR-CAL-PIPELINE-V1` |
| `source-specific-normalizers` | canonical_generation | **migrate** | high | `WHR-CAL-PIPELINE-V1, WHR-CAL-JAPAN-JRA, WHR-CAL-HONG-KONG-HKJC` |
| `public-projection-builder` | public_projection | **repair** | critical | `WHR-CAL-PIPELINE-V1` |
| `canonical-public-json` | public_projection | **repair** | critical | `WHR-CAL-PIPELINE-V1, WHR-CAL-OPS-V1` |
| `public-view-model` | runtime_pages | **retain** | high | `WHR-CAL-PIPELINE-V1, WHR-CAL-DYNAMIC-DATES` |
| `calendar-today-tomorrow-pages` | runtime_pages | **migrate** | high | `WHR-CAL-DYNAMIC-DATES` |
| `meeting-detail-route` | runtime_pages | **retain** | high | `WHR-CAL-PIPELINE-V1` |
| `normalized-preview-runtime` | runtime_pages | **archive** | medium | `WHR-CAL-PIPELINE-V1` |
| `legacy-direct-display-inputs` | legacy_inputs | **migrate** | critical | `WHR-CAL-PIPELINE-V1` |
| `june-build-mutation` | build_commands | **replace** | critical | `WHR-CAL-PIPELINE-V1` |
| `package-check-chain` | build_commands | **repair** | critical | `WHR-CAL-PIPELINE-V1, WHR-CAL-OPS-V1` |
| `fixed-date-logic` | fixed_dates | **replace** | critical | `WHR-CAL-DYNAMIC-DATES` |
| `refresh-skeleton` | refresh_workflows | **replace** | critical | `WHR-CAL-PIPELINE-V1, WHR-CAL-OPS-V1` |
| `scheduled-refresh-workflow` | refresh_workflows | **repair** | critical | `WHR-CAL-OPS-V1` |
| `generated-data-dry-run` | refresh_workflows | **repair** | high | `WHR-CAL-PIPELINE-V1, WHR-CAL-OPS-V1` |
| `live-source-snapshot-path` | refresh_workflows | **repair** | high | `WHR-CAL-PIPELINE-V1, WHR-CAL-OPS-V1` |
| `jra-pilot` | source_pilots | **migrate** | high | `WHR-CAL-JAPAN-JRA` |
| `hkjc-pilot` | source_pilots | **migrate** | high | `WHR-CAL-HONG-KONG-HKJC` |
| `uae-pilot` | source_pilots | **migrate** | medium | `WHR-CAL-UAE-ERA` |
| `manual-june-seeds` | manual_seeds | **archive** | medium | `WHR-CAL-PIPELINE-V1` |
| `pr-progress-generated-artifacts` | pr_specific_artifacts | **archive** | low | `WHR-CAL-OPS-V1` |
| `pr-specific-validators-workflows` | pr_specific_artifacts | **archive** | medium | `WHR-CAL-OPS-V1` |
| `legacy-current-integrated` | legacy_inputs | **archive** | medium | `WHR-CAL-PIPELINE-V1` |
| `historical-source-tests` | research_evidence | **retain** | medium | `WHR-CAL-PIPELINE-V1` |
| `operations-reports` | operations | **repair** | high | `WHR-CAL-OPS-V1` |
| `scoped-country-racecourse-lists` | runtime_pages | **retain** | medium | `WHR-CAL-DYNAMIC-DATES, WHR-CAL-PUBLIC-V1` |

## Execution sequence

### 1. `WHR-CAL-PIPELINE-V1`

Deliver the shared adapter/candidate envelope, deterministic candidate validation, human promotion, one canonical writer, one public-projection writer, import guards, and grouped validation suites. JRA should be the first reference adapter because it has the strongest existing implementation, but source-specific activation remains a separate pilot decision.

### 2. `WHR-CAL-DYNAMIC-DATES`

Remove all current-view June 2026 fallbacks. Implement timezone-aware Today/Tomorrow, a rolling Calendar window, stale/empty handling, and historical/future boundaries.

### 3. `WHR-CAL-OPS-V1`

Define candidate schedules, source-health and stale reports, generated update PRs, human ownership, pause, rollback, seasonal rollover, and source-breakage procedures. Only then may cron scheduling return.

### 4. Pilot activation

Activate JRA, NAR, Banei, HKJC, and UAE separately. Automation mode must match each reviewed Calendar Readiness record; a generator or parser name does not prove live readiness.

### 5. `WHR-CAL-PUBLIC-V1`

Release maintained dynamic Calendar/Today/Tomorrow and scoped country/racecourse/meeting views after the pilot and operations gates pass.

## Public boundary

This reconciliation changes no Technical Rank or Public Ceiling. Public output remains bounded to meeting-level fields and the permitted A/A+ timetable summary fields. Participant, betting, result, payout, prediction, complete-racecard, raw-source, embedded-video, direct-stream, unofficial-mirror, and redistributed-recording content remains prohibited.

## Completion statement

`WHR-CAL-BASELINE-RECONCILE` is complete when this map, its validator, the read-only build safeguard, and the paused incomplete schedule are merged. It does not claim that pipeline v1 or any pilot source is active.
