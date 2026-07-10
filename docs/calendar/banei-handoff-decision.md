# Banei operational handoff decision

Status: accepted decision record  
Work ID: `WHR-CAL-JAPAN-BANEI-A-PLUS`  
Decision ID: `banei-operational-handoff-2026-07`  
Accepted: 2026-07-10

## Decision

The Banei Calendar integration is accepted for manual reviewed steady-state operation.

The accepted claim is:

```text
bounded_operational_integration_complete
```

This is not a July whole-month completeness claim.

The next Work ID is:

```text
WHR-CAL-HONG-KONG-HKJC
```

under Stage 10 additional pilots.

## Why handoff is accepted

The Banei path now has reviewed evidence for the full operational chain needed for bounded ongoing maintenance:

```text
source identity and Authority Source Inventory
-> Acquisition Registry profile
-> date-window / selected-meeting collection
-> five-rank classification
-> schedule fallback preservation
-> candidate / Coverage Observation / Result Manifest / Review Queue
-> rank-aware retry planning
-> GitHub Actions primary runner with reviewed-import fallback
-> reviewed retry Job evidence
-> explicit manual operator route
-> proposal-only Queue reconciliation
-> guarded Queue state apply and rollback
-> freshness and rollback operating evidence
-> bilingual and public-display QA
```

The handoff therefore does not require unattended execution or an automatic publication path.

## July whole-month Completion Audit decision

The July whole-month Completion Audit is not required for this handoff.

Current decision state:

```text
required_for_handoff: false
performed: false
full_month_completeness_claim_made: false
```

The trigger remains explicit:

```text
Run the separate July whole-month Completion Audit before making an explicit July full-month completeness claim.
```

Ordinary valid partial or arbitrary-window Banei maintenance remains valid without that claim.

The handoff does not state that every July Banei meeting or every July Banei detail row has been completely collected, reviewed, promoted, or published.

## Accepted operational boundary

```text
primary runner: github_actions
fallback runner: reviewed_import
date-window collection: enabled
selected-meeting collection: enabled
rank-upgrade retry planning: enabled
regular refresh planning: disabled
coverage-gap planning: disabled
source revalidation planning: disabled
scheduler Job execution: disabled
automatic approval: disabled
automatic promotion: disabled
automatic publication: disabled
```

The accepted operating mode is manual reviewed steady-state operation.

Manual reviewed operation means an operator may run bounded acquisition or retry paths and review resulting artifacts, but the system does not independently execute due plans, approve candidates, promote canonical records, or publish pages.

## Queue and rollback boundary

Authoritative Retry Queue mutation remains an explicit operator action.

A reviewed state apply requires:

- an exact source Queue SHA-256;
- an exact proposal SHA-256;
- an exact proposed Queue SHA-256;
- a reviewed approval artifact;
- stale-write rejection;
- backup and rollback evidence before replacement;
- durable same-directory atomic replacement;
- post-apply digest verification.

Rollback remains an explicit operator action and rejects stale current Queue state.

The handoff does not enable automatic Queue mutation or automatic rollback.

## Freshness boundary

Banei source health and freshness remain separate signals.

Accepted operating evidence proves:

```text
freshness age: 1 hour
source health: healthy
freshness attention: false
```

and:

```text
freshness age: 168 hours
source health: healthy
freshness attention: true
```

A freshness threshold breach does not silently rewrite source health to degraded or unavailable.

## Public display boundary

The accepted Banei public display boundary is:

```text
detail source public ceiling: A+
legacy schedule source public ceiling: C
legacy schedule source readiness: link_only
list surfaces: one meeting per row
A+ programme-summary fields: meeting detail page only
```

The separate Banei detail source and legacy schedule source remain independent Readiness records.

The A+ detail source may expose only the public-safe common programme-summary fields allowed by the active publication policy:

- race label;
- post time;
- race name;
- distance;
- surface;
- course label.

The reviewed Banei normalization semantics include:

```text
distance: 200m
surface: Dirt
course: Banei Straight Course
```

They must not be converted into flat-racing course-layout assumptions.

## Bilingual boundary

The accepted route set includes:

```text
/timetable/meetings/{meeting_id}/
/ja/timetable/meetings/{meeting_id}/
```

Japanese Calendar list routes use localized known Banei labels including:

```text
帯広競馬場
ばんえい十勝
日本
```

Japanese meeting-detail links remain under `/ja`.

Rendered fixture QA proves English and Japanese meeting-detail routes show matching timetable row counts while list and country surfaces remain one-meeting-per-row surfaces without A+ row-detail expansion.

## Forbidden output boundary

The handoff does not permit public output for:

- participant lists;
- horse names;
- jockey names;
- trainer names;
- draw, gate, or post position;
- weights;
- betting data;
- odds;
- results;
- payouts;
- predictions or tips;
- raw HTML or source body;
- embedded video;
- direct stream URLs.

The handoff does not change the existing Calendar public display boundary.

## Evidence accepted for handoff

The machine-readable decision records the reviewed evidence references. The handoff relies on:

- Banei incremental/full-month plan and Completion Audit separation;
- proposal-only reconciliation;
- guarded Retry Queue state apply and rollback;
- freshness and rollback operating evidence;
- bilingual and public-display QA;
- Banei detail Readiness;
- Banei detail Authority Source Inventory;
- permanent state-apply, operating-evidence, and bilingual/public-display QA checkers.

The evidence chain is sufficient for bounded operational handoff without claiming unattended automation or July full-month completeness.

## Next handoff

Banei now moves to manual reviewed steady-state operation under the accepted boundaries above.

The Calendar programme may begin:

```text
WHR-CAL-HONG-KONG-HKJC
```

The next pilot inherits:

- Pipeline v1 boundaries;
- incremental coverage semantics;
- Collection Job and Plan contracts;
- five-rank classification;
- Review Queue and Retry Queue semantics;
- human review before promotion;
- freshness and source-health separation;
- fallback and rollback requirements;
- bilingual QA requirements;
- one-meeting-per-list-row public display boundary;
- no participant, betting, result, payout, prediction, raw-source, embedded-video, or direct-stream output.

Banei remains maintainable in parallel. Starting the next pilot does not enable unattended Banei execution or publication.
