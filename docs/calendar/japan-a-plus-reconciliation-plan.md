# Japan A+ Calendar reconciliation plan

Status: complete  
Work ID: `WHR-CAL-JAPAN-A-PLUS-RECONCILE`  
Approved policy date: 2026-07-01  
Completed: 2026-07-03  
Next Work ID: `WHR-CAL-JAPAN-JRA-A-PLUS`

## Purpose

This plan aligned the repository with the approved Japan Calendar policy:

| System | Technical Rank | Public Ceiling |
| --- | --- | --- |
| JRA central racing | A+ | A+ |
| NAR and local-government racing | A+ | A+ |
| Banei Tokachi | A+ | A+ |

The three systems remain separate. An individual meeting is displayed only at the highest rank supported by reviewed canonical fields. A system-level A+ ceiling does not invent missing meeting data.

## Completed reconciliation

The active state is resolved from the historical base registries plus the approved Japan v2 overlays and runtime controls:

- `data/static/calendar-readiness-registry.json` remains the historical 116-record base;
- `data/static/calendar-readiness-japan-v2.json` supersedes the three Japan readiness records for active resolution;
- `data/static/authority-source-inventory-japan-v2.json` supersedes the three Japan authority/source records;
- `data/static/japan-a-plus-runtime-control.json` keeps JRA active and NAR/Banei pending their separate pilots;
- `data/static/japan-a-plus-policy.json` records the approved A+/A+ system ceilings;
- `data/static/country-profiles-v2-13-japan.json` and `docs/timetable-source-tests/13-japan/final-summary.json` use the same policy;
- `docs/country-page-notes/13-japan.md` no longer contains the earlier public-A or C/link-only assumptions.

No unattended publication was enabled. Scheduling remains disabled and canonical/public writes remain review-controlled.

## Completed sequence

### 1. Canonical document alignment

- project and Calendar roadmaps identify this Work ID as complete;
- `WHR-CAL-JAPAN-JRA-A-PLUS` is the active Work ID;
- `WHR-CAL-JAPAN-NAR-A-PLUS` is the next Work ID.

### 2. Registry and profile alignment

- the three Japan readiness records resolve to A+/A+;
- the Japan authority/source overlay records A+ capability for all three systems;
- Japan Source Test v2 summary records the separate A+/A+ systems;
- Japan Profile v2 uses A+ public ceiling and system-specific implementation language;
- JRA, NAR, and Banei source identity and terminology remain separate.

### 3. Validator and generator alignment

- active validation no longer requires NAR or Banei to remain C/link-only;
- JRA reviewed A+ records remain A+ in public projection;
- evidence-bound field checks and prohibited-field guards remain active;
- normal build/check remain read-only;
- historical base values are retained as superseded evidence rather than silently rewritten.

### 4. Public projection repair

- JRA July 2026 public data contains 24 reviewed A+ meetings and 300 public-safe timetable rows;
- meeting detail projection exposes only race label, post time, race name, distance, surface, and course;
- list pages remain one meeting per row;
- participant, betting, result, payout, prediction, complete-racecard, raw-source, embedded-video, and direct-stream data remain excluded.

### 5. Legacy cleanup

- the old NAR C control and earlier Japan readiness values are classified as superseded historical evidence;
- stale branches must not be merged into the Pipeline v1 path;
- PR #198 and PR #281 require separate closure after confirming no unique required work remains.

## Completion conditions

- [x] active canonical documents agree on A+/A+ for all three Japan systems
- [x] active resolved registries, profiles, source summaries, controls, and validators agree
- [x] reviewed JRA A+ meeting records project as A+ without unsupported fields
- [x] NAR and Banei are ready to proceed through separate A+ pilot implementations
- [x] grouped Calendar release gates and production build pass
- [x] no scheduled or unattended canonical/public write is enabled
- [x] next Work ID is `WHR-CAL-JAPAN-JRA-A-PLUS`

Machine-readable completion record:

- `data/audits/japan-a-plus-reconciliation-completion.json`
- `scripts/check-japan-a-plus-reconciliation-completion.mjs`

## Programme sequence after reconciliation

```text
WHR-CAL-JAPAN-JRA-A-PLUS
-> WHR-CAL-JAPAN-NAR-A-PLUS
-> WHR-CAL-JAPAN-BANEI-A-PLUS
-> WHR-CAL-JAPAN-INTEGRATION
-> WHR-CAL-HONG-KONG-HKJC
-> WHR-CAL-UAE-ERA
-> WHR-CAL-PUBLIC-V1
-> racecourse-page strengthening
-> glossary, racing types, search, filtering, and SEO
-> expansion cohorts and steady-state operations
```

## Historical transition markers

These exact labels are retained for completed-gate compatibility and are not the active state:

> Current Work ID: `WHR-CAL-JAPAN-A-PLUS-RECONCILE`  
> Next Work ID: `WHR-CAL-JAPAN-JRA-A-PLUS`

## Per-PR review order

Every Japan pilot PR reviews, in order:

1. `docs/governance/document-authority.md`;
2. `docs/project-roadmap.md`;
3. `docs/calendar/implementation-roadmap.md`;
4. this completed plan and the active pilot contract;
5. `docs/operations/deployment-and-ci-policy.md`;
6. applicable machine-readable policy, readiness, control, source, profile, and display-boundary files.

Each PR records its Work ID, canonical documents reviewed, runtime and display effects, validation results, out-of-scope work, and next Work ID.
