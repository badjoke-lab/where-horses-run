# Japan A+ Calendar reconciliation plan

Status: active implementation plan  
Work ID: `WHR-CAL-JAPAN-A-PLUS-RECONCILE`  
Approved policy date: 2026-07-01  
Last reviewed: 2026-07-02

## Purpose

This plan aligns the repository with the approved Japan Calendar policy:

| System | Technical Rank | Public Ceiling |
| --- | --- | --- |
| JRA central racing | A+ | A+ |
| NAR and local-government racing | A+ | A+ |
| Banei Tokachi | A+ | A+ |

The three systems remain separate. An individual meeting is displayed only at the highest rank supported by reviewed canonical fields. A system-level A+ ceiling does not invent missing meeting data.

## Current problem

The approved policy and v2 controls are present, but older active records and generated output still contain pre-approval assumptions:

- the legacy Calendar Readiness registry still contains JRA A+/A and NAR/Banei C/C records;
- the Japan Profile v2 and Source Test summary still describe the earlier partial/C treatment;
- some validators assert the earlier values;
- JRA public generated data still caps reviewed A+ meetings at A;
- the canonical roadmaps still describe NAR as the current link-only C pilot.

No new unattended publication is enabled by this reconciliation. Scheduling remains disabled and canonical/public writes remain human-approved.

## Required sequence

### 1. Canonical document alignment

- update the project roadmap;
- update the Calendar implementation roadmap;
- make this Work ID the current programme state;
- record `WHR-CAL-JAPAN-JRA-A-PLUS` as the next Work ID.

### 2. Registry and profile alignment

- reconcile the three Japan records in the active Calendar Readiness registry with the approved v2 records;
- align the authority/source inventory;
- update the Japan Source Test v2 final summary;
- update Japan Profile v2 and its public ceiling;
- keep JRA, NAR, and Banei source identity and terminology separate.

### 3. Validator and generator alignment

- remove active assertions that require NAR or Banei to remain C/link-only;
- remove the JRA public-A cap where the reviewed policy permits A+;
- retain evidence-bound field checks;
- retain prohibited-field guards;
- ensure normal build/check remain read-only.

### 4. Public projection repair

- regenerate the public meeting list from reviewed canonical data and the A+ policy;
- regenerate meeting detail projections;
- allow reviewed JRA A+ fields on meeting detail pages;
- keep list pages at one meeting per row;
- do not publish participant, betting, result, payout, prediction, complete-racecard, raw-source, embedded-video, or direct-stream data.

### 5. Legacy cleanup

- classify the old NAR C control and earlier Japan readiness records as superseded historical evidence;
- close or archive stale PRs after confirming that no unique required work remains;
- do not merge old branches into the current Pipeline v1 path.

## Completion conditions

This Work ID is complete only when:

1. active canonical documents agree on A+/A+ for all three Japan systems;
2. active registries, profiles, source summaries, controls, and validators agree;
3. reviewed JRA A+ meeting records project as A+ without adding unsupported fields;
4. NAR and Banei are ready to proceed through separate A+ pilot implementations;
5. `npm run check` and the grouped Calendar release gates pass;
6. no scheduled or unattended canonical/public write is enabled;
7. the next Work ID is `WHR-CAL-JAPAN-JRA-A-PLUS`.

## Programme sequence after reconciliation

```text
WHR-CAL-JAPAN-A-PLUS-RECONCILE
-> WHR-CAL-JAPAN-JRA-A-PLUS
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

## Per-PR review order

Every PR under this plan must review, in order:

1. `docs/governance/document-authority.md`;
2. `docs/project-roadmap.md`;
3. `docs/calendar/implementation-roadmap.md`;
4. this plan;
5. `docs/operations/deployment-and-ci-policy.md`;
6. the applicable machine-readable policy, readiness, control, source, profile, and display-boundary files.

Each PR records the Work ID, canonical documents reviewed, specifications reviewed, runtime and display effects, validation results, out-of-scope work, and next Work ID.
