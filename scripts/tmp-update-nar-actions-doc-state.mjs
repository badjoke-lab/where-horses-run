import fs from 'node:fs';

const replacements = [
  ['START-HERE.md', [
    [
`NAR
current: local runner available + bounded Actions success evidence
target after formal workflow activation:
  primary runner: github_actions
  fallback runner: local`,
`NAR
primary runner: github_actions
fallback runner: local
formal workflow_dispatch operator: active
scheduled publication: disabled`,
    ],
    [
`scripts/timetable/run-nar-incremental-v2-local.mjs
scripts/check-calendar-nar-incremental-v2-core.mjs
scripts/check-calendar-nar-incremental-v2.mjs`,
`scripts/timetable/run-nar-incremental-v2-local.mjs
scripts/timetable/nar-incremental-v2-actions-core.mjs
scripts/timetable/run-nar-incremental-v2-actions.mjs
scripts/check-calendar-nar-incremental-v2-core.mjs
scripts/check-calendar-nar-incremental-v2.mjs
scripts/check-calendar-nar-incremental-v2-actions-operator.mjs
.github/workflows/calendar-nar-incremental-v2-operator.yml`,
    ],
    [
`The formal NAR Actions workflow-dispatch path is a scheduled implementation step. Temporary diagnostic workflows are not the canonical normal operation.`,
`The formal NAR Actions workflow-dispatch path is active as the primary operator entry point. The local v2 runner remains the fallback and development path. Temporary diagnostic workflows are closed and are not part of normal operation.`,
    ],
    [
`Current Work ID: \`WHR-CAL-JAPAN-NAR-A-PLUS\`  
Next Work ID: \`WHR-CAL-ACQUISITION-CONTROL-PLANE\`  
Subsequent Work ID: \`WHR-CAL-JAPAN-BANEI-A-PLUS\`

Current NAR status:

\`\`\`text
published through 2026-07-07
July 8–31 review batch committed
schedule-confirmed: 82
A+: 11
C: 71
schedule errors: 0
coverage: source_window_complete
pending detail retries: 71
promotion/publication of this batch: pending
\`\`\``,
`Completed Work ID: \`WHR-CAL-JAPAN-NAR-A-PLUS\`  
Current Work ID: \`WHR-CAL-ACQUISITION-CONTROL-PLANE\`  
Next source-specific Work ID: \`WHR-CAL-JAPAN-BANEI-A-PLUS\`

Current NAR status:

\`\`\`text
published schedule coverage through 2026-07-31
July 8–31 reviewed batch: published
schedule-confirmed: 82
A+: 11
C: 71
schedule errors: 0
coverage: source_window_complete
pending detail retries: 71
primary runner: github_actions
fallback runner: local
\`\`\`

The 71 C meetings are published schedule identities, not A+ detail-complete meetings. They remain explicit retry work.`,
    ],
    [
`1. merge control-plane documentation alignment
2. finish NAR 82-meeting review/promotion/publication
3. close temporary diagnostic PRs #430 and #435 without merge
4. formalize NAR Actions manual dispatch
5. add Acquisition Registry
6. add Collection Job schema
7. add Collection Plan schema
8. add five-rank classifier contract tests
9. add Collection Result Manifest
10. add Review Queue
11. add Rank-aware Retry Queue
12. connect Actions and local runners to shared job semantics
13. begin Banei on the shared foundation
14. add Actions multi-job execution
15. add local multi-job execution
16. add review cohort planner
17. add automatic review PR preparation
18. add due-job planning and scheduled bounded retries
19. add Operations v2 operator view`,
`1. add Acquisition Registry
2. add Collection Job schema
3. add Collection Plan schema
4. add five-rank classifier contract tests
5. add Collection Result Manifest
6. add Review Queue
7. add Rank-aware Retry Queue
8. connect Actions and local runners to shared job semantics
9. begin Banei on the shared foundation
10. add Actions multi-job execution
11. add local multi-job execution
12. add review cohort planner
13. add automatic review PR preparation
14. add due-job planning and scheduled bounded retries
15. add Operations v2 operator view`,
    ],
    [
`> Current Work ID: \`WHR-CAL-JAPAN-JRA-A-PLUS\`  
> Next Work ID: \`WHR-CAL-JAPAN-NAR-A-PLUS\``,
`> Current Work ID: \`WHR-CAL-JAPAN-JRA-A-PLUS\`  
> Next Work ID: \`WHR-CAL-JAPAN-NAR-A-PLUS\`

> Current Work ID: \`WHR-CAL-JAPAN-NAR-A-PLUS\`  
> Next Work ID: \`WHR-CAL-ACQUISITION-CONTROL-PLANE\``,
    ],
  ]],
  ['docs/project-roadmap.md', [
    [
`Current Work ID: \`WHR-CAL-JAPAN-NAR-A-PLUS\`  
Next Work ID: \`WHR-CAL-ACQUISITION-CONTROL-PLANE\`  
Subsequent Work ID: \`WHR-CAL-JAPAN-BANEI-A-PLUS\``,
`Completed Work ID: \`WHR-CAL-JAPAN-NAR-A-PLUS\`  
Current Work ID: \`WHR-CAL-ACQUISITION-CONTROL-PLANE\`  
Next source-specific Work ID: \`WHR-CAL-JAPAN-BANEI-A-PLUS\``,
    ],
    [
`NAR A+ is current.

Reviewed NAR detail through 2026-07-07 has been promoted and published. The schedule-aware immutable v2 operator is merged. The July 8–31 review batch is committed and contains:

\`\`\`text
schedule-confirmed meetings: 82
A+ detail candidates:         11
C schedule candidates:        71
schedule errors:               0
coverage claim:                source_window_complete
pending detail retries:       71
\`\`\`

The 82-meeting batch is currently in review/promotion preparation. It is not yet fully promoted or published.`,
`The NAR source pilot publication sequence is complete and the Acquisition Control Plane is current.

Reviewed NAR schedule coverage through 2026-07-31 has been promoted and published. The July 8–31 batch contains:

\`\`\`text
schedule-confirmed meetings: 82
A+ detail records:            11
C schedule records:           71
schedule errors:               0
coverage claim:                source_window_complete
pending detail retries:       71
\`\`\`

The 71 C records remain explicit detail-retry work. Formal NAR \`workflow_dispatch\` acquisition is active with GitHub Actions as primary runner and local execution as fallback.`,
    ],
    [
`Status: current  
Completed Work ID: \`WHR-CAL-JAPAN-JRA-A-PLUS\`  
Current Work ID: \`WHR-CAL-JAPAN-NAR-A-PLUS\`  
Shared next Work ID: \`WHR-CAL-ACQUISITION-CONTROL-PLANE\`  
Subsequent source Work ID: \`WHR-CAL-JAPAN-BANEI-A-PLUS\``,
`Status: NAR source pilot complete; shared control-plane foundation current  
Completed Work ID: \`WHR-CAL-JAPAN-JRA-A-PLUS\`  
Completed Work ID: \`WHR-CAL-JAPAN-NAR-A-PLUS\`  
Current Work ID: \`WHR-CAL-ACQUISITION-CONTROL-PLANE\`  
Next source-specific Work ID: \`WHR-CAL-JAPAN-BANEI-A-PLUS\``,
    ],
    [
`- review, promotion, rendered QA, and publication for 10 incremental meetings on 2026-07-05 through 2026-07-07;
- July 8–31 review batch collection and immutable main-branch commit for 82 meetings.`,
`- review, promotion, rendered QA, and publication for 10 incremental meetings on 2026-07-05 through 2026-07-07;
- July 8–31 immutable batch collection for 82 meetings;
- pinned human review and source-separated approved C/A+ envelopes;
- canonical promotion and public projection for all 82 reviewed meetings;
- rendered QA and Pipeline v1 release-gate validation;
- closure of temporary diagnostic PRs #430 and #435 without merge;
- formal Actions manual-dispatch operator with immutable review-artifact upload.`,
    ],
    [
`Current NAR sequence:

1. finalize the 82-meeting review decision and approved promotion envelopes;
2. validate 11 A+ and 71 C normal promotion paths;
3. promote canonical records;
4. rebuild public projection;
5. run rendered bilingual QA and release checks;
6. publish the reviewed batch;
7. retain the 71 C meetings as detail retry targets;
8. close temporary diagnostic acquisition PRs without merge;
9. formalize NAR Actions manual dispatch;
10. keep local execution as fallback.

Target operating profile after the formal workflow is merged:`,
`Current NAR maintenance state:

1. the July 8–31 batch is reviewed, promoted, projected, QA-validated, and published from main;
2. 11 meetings are A+ detail-complete;
3. 71 meetings remain C schedule identities and explicit detail retry targets;
4. formal Actions manual dispatch is the primary operator path;
5. local v2 execution remains the fallback and development path;
6. NAR now hands off into the shared Registry / Job / Plan / Review Queue / Retry Queue model.

Active operating profile:`,
    ],
    [
`The foundation sequence is:

1. NAR formal Actions manual-dispatch path;
2. Acquisition Registry schema and Japan profiles;`,
`The foundation sequence is:

1. NAR formal Actions manual-dispatch path — complete;
2. Acquisition Registry schema and Japan profiles — current;`,
    ],
    [
`Completed JRA A+ transition:

> Current Work ID: \`WHR-CAL-JAPAN-JRA-A-PLUS\`  
> Next Work ID: \`WHR-CAL-JAPAN-NAR-A-PLUS\``,
`Completed NAR transition:

> Current Work ID: \`WHR-CAL-JAPAN-NAR-A-PLUS\`  
> Next Work ID: \`WHR-CAL-ACQUISITION-CONTROL-PLANE\`

Completed JRA A+ transition:

> Current Work ID: \`WHR-CAL-JAPAN-JRA-A-PLUS\`  
> Next Work ID: \`WHR-CAL-JAPAN-NAR-A-PLUS\``,
    ],
  ]],
  ['docs/calendar/implementation-roadmap.md', [
    [
`Completed Work ID: \`WHR-CAL-JAPAN-A-PLUS-RECONCILE\`  
Completed Work ID: \`WHR-CAL-JAPAN-JRA-A-PLUS\`  
Current Work ID: \`WHR-CAL-JAPAN-NAR-A-PLUS\`  
Next Work ID: \`WHR-CAL-ACQUISITION-CONTROL-PLANE\`  
Subsequent Work ID: \`WHR-CAL-JAPAN-BANEI-A-PLUS\``,
`Completed Work ID: \`WHR-CAL-JAPAN-A-PLUS-RECONCILE\`  
Completed Work ID: \`WHR-CAL-JAPAN-JRA-A-PLUS\`  
Completed Work ID: \`WHR-CAL-JAPAN-NAR-A-PLUS\`  
Current Work ID: \`WHR-CAL-ACQUISITION-CONTROL-PLANE\`  
Next source-specific Work ID: \`WHR-CAL-JAPAN-BANEI-A-PLUS\`

Completed transition marker:  
Current Work ID: \`WHR-CAL-JAPAN-NAR-A-PLUS\`  
Next Work ID: \`WHR-CAL-ACQUISITION-CONTROL-PLANE\``,
    ],
    [
`26. July 8–31 NAR immutable review batch with 82 schedule-confirmed meetings;
27. successful bounded NAR acquisition from GitHub Actions.`,
`26. July 8–31 NAR immutable review batch with 82 schedule-confirmed meetings;
27. successful bounded NAR acquisition from GitHub Actions;
28. reviewed promotion and publication of the July 8–31 82-meeting batch;
29. formal read-only Actions manual-dispatch operator with immutable review-artifact upload.`,
    ],
    [
`Status: current  
Completed Work ID: \`WHR-CAL-JAPAN-JRA-A-PLUS\`  
Current Work ID: \`WHR-CAL-JAPAN-NAR-A-PLUS\`  
Next shared Work ID: \`WHR-CAL-ACQUISITION-CONTROL-PLANE\`  
Subsequent source Work ID: \`WHR-CAL-JAPAN-BANEI-A-PLUS\``,
`Status: NAR source pilot complete; shared control-plane foundation current  
Completed Work ID: \`WHR-CAL-JAPAN-JRA-A-PLUS\`  
Completed Work ID: \`WHR-CAL-JAPAN-NAR-A-PLUS\`  
Current Work ID: \`WHR-CAL-ACQUISITION-CONTROL-PLANE\`  
Next source Work ID: \`WHR-CAL-JAPAN-BANEI-A-PLUS\``,
    ],
    [
`### NAR A+ — current`,
`### NAR A+ — published source pilot with ongoing detail retries`,
    ],
    [
`- schedule-aware immutable v2 implementation;
- reviewed and published incremental NAR detail through 2026-07-07;
- July 8–31 review batch collection and immutable commit.`,
`- schedule-aware immutable v2 implementation;
- reviewed and published incremental NAR detail through 2026-07-07;
- July 8–31 review batch collection and immutable commit;
- pinned review and source-compatible C/A+ approval envelopes;
- canonical promotion and public projection of all 82 reviewed meetings;
- rendered bilingual QA and release-gate validation;
- temporary diagnostic PR closure without merge;
- formal Actions manual-dispatch operator with local fallback.`,
    ],
    [
`Current NAR sequence:

1. finish review decision and approved candidate generation;
2. validate 11 A+ and 71 C promotion paths;
3. perform canonical promotion;
4. rebuild public projection;
5. run rendered bilingual QA and release checks;
6. publish reviewed output;
7. preserve rank-aware retry work for pending meetings;
8. close temporary diagnostic acquisition PRs without merge;
9. formalize NAR Actions manual dispatch;
10. retain local fallback.

Target NAR operating profile after formal workflow release:`,
`Current NAR maintenance state:

1. 82 reviewed July 8–31 meetings are promoted and projected;
2. 11 are A+ detail-complete;
3. 71 remain C schedule identities and explicit retry targets;
4. Actions manual dispatch is the primary acquisition runner;
5. local execution remains fallback;
6. shared Registry / Job / Plan / Queue integration is next.

Active NAR operating profile:`,
    ],
    [
`### ACP-1 — NAR formal workflow dispatch`,
`### ACP-1 — NAR formal workflow dispatch — complete`,
    ],
    [
`1. merge control-plane documentation alignment
2. finish NAR 82-meeting review/promotion/publication
3. close temporary diagnostic PRs #430 and #435 without merge
4. formalize NAR Actions manual dispatch
5. add Acquisition Registry
6. add Collection Job schema
7. add Collection Plan schema
8. add five-rank classifier contract tests
9. add Result Manifest
10. add Review Queue
11. add Rank-aware Retry Queue
12. connect Actions and local runners to shared job semantics
13. begin Banei on the shared foundation
14. expand multi-system execution
15. add automatic review PR preparation
16. add due-job planning and scheduled bounded retries
17. add Operations v2 operator view`,
`1. add Acquisition Registry
2. add Collection Job schema
3. add Collection Plan schema
4. add five-rank classifier contract tests
5. add Result Manifest
6. add Review Queue
7. add Rank-aware Retry Queue
8. connect Actions and local runners to shared job semantics
9. begin Banei on the shared foundation
10. expand multi-system execution
11. add automatic review PR preparation
12. add due-job planning and scheduled bounded retries
13. add Operations v2 operator view`,
    ],
  ]],
  ['docs/calendar/acquisition-control-plane-implementation-plan.md', [
    [
`- the July 8–31 NAR review batch has 82 schedule-confirmed meetings, including 11 A+ detail candidates and 71 C schedule candidates;
- the current NAR promotion/publication sequence is not yet complete;
- temporary diagnostic PRs/workflows must not become the normal operating model;`,
`- the July 8–31 NAR batch has 82 published schedule-confirmed meetings, including 11 A+ detail records and 71 C schedule records;
- the 71 C meetings remain explicit detail-retry work;
- temporary diagnostic PRs #430 and #435 are closed without merge;
- formal NAR workflow-dispatch acquisition is active with GitHub Actions primary and local fallback;`,
    ],
    [
`Current source-specific work:

\`\`\`text
WHR-CAL-JAPAN-NAR-A-PLUS
\`\`\`

Next shared work:

\`\`\`text
WHR-CAL-ACQUISITION-CONTROL-PLANE
\`\`\``,
`Completed source-specific work:

\`\`\`text
WHR-CAL-JAPAN-NAR-A-PLUS
\`\`\`

Current shared work:

\`\`\`text
WHR-CAL-ACQUISITION-CONTROL-PLANE
\`\`\``,
    ],
    [
`Status: current documentation task.`,
`Status: complete.`,
    ],
    [
`## Stage ACP-1 — finish NAR July remainder publication

Dependency: existing NAR review batch.`,
`## Stage ACP-1 — finish NAR July remainder publication

Status: complete.`,
    ],
    [
`## Stage ACP-2 — NAR formal workflow-dispatch operation

Goal: replace temporary diagnostic Actions harnesses with a canonical manual-dispatch workflow.`,
`## Stage ACP-2 — NAR formal workflow-dispatch operation

Status: complete. The canonical manual-dispatch workflow accepts bounded date-window or selected-meeting input, writes immutable review artifacts only, validates shared boundaries, and uploads the four review artifacts without approval or publication side effects.`,
    ],
    [
`## Stage ACP-3 — Acquisition Registry

Goal: remove runner and capability knowledge from operator memory.`,
`## Stage ACP-3 — Acquisition Registry

Status: current.

Goal: remove runner and capability knowledge from operator memory.`,
    ],
  ]],
  ['docs/calendar/manual-nar-incremental-collection.md', [
    [
`Status: active operator runbook with runner transition  
Work ID: \`WHR-CAL-JAPAN-NAR-A-PLUS\``,
`Status: active operator runbook  
Primary Work ID: \`WHR-CAL-ACQUISITION-CONTROL-PLANE\`  
NAR maintenance context: \`WHR-CAL-JAPAN-NAR-A-PLUS\``,
    ],
    [
`Current implemented state:

\`\`\`text
local v2 runner: available and canonical
bounded GitHub Actions acquisition: proven successful
formal workflow_dispatch operation: not yet canonical
\`\`\`

Target state after the formal workflow-dispatch implementation is merged and validated:

\`\`\`text
primary runner: github_actions
fallback runner: local
\`\`\``,
`Current implemented state:

\`\`\`text
primary runner: github_actions
formal workflow_dispatch operation: active
fallback runner: local
immutable review artifact upload: active
scheduled publication: disabled
\`\`\``,
    ],
    [
`## Formal Actions workflow target

The formal NAR workflow-dispatch path must accept bounded operator inputs equivalent to the local v2 runner.`,
`## Formal Actions workflow

The canonical operator entry point is \`.github/workflows/calendar-nar-incremental-v2-operator.yml\`. It accepts bounded operator inputs equivalent to the local v2 runner and uploads review artifacts without repository writes.`,
    ],
    [
`The formal workflow is an implementation step under \`WHR-CAL-ACQUISITION-CONTROL-PLANE\`.`,
`The formal workflow is active under \`WHR-CAL-ACQUISITION-CONTROL-PLANE\`. Inputs are validated by \`nar-incremental-v2-actions-core.mjs\`; the workflow launcher is \`run-nar-incremental-v2-actions.mjs\`; the operator contract is checked by \`check-calendar-nar-incremental-v2-actions-operator.mjs\`.`,
    ],
    [
`Dedicated CI also validates:

\`\`\`text
scripts/check-calendar-nar-incremental-v2-core.mjs
\`\`\``,
`Dedicated CI also validates:

\`\`\`text
scripts/check-calendar-nar-incremental-v2-core.mjs
scripts/check-calendar-nar-incremental-v2-actions-operator.mjs
\`\`\``,
    ],
    [
`Published NAR detail is complete through 2026-07-07 for the reviewed promoted batches.

The July 8–31 immutable review batch is committed with:`,
`Reviewed NAR schedule coverage through 2026-07-31 is promoted and projected. The July 8–31 published batch contains:`,
    ],
    [
`The next source-specific steps are review, approved candidate generation, promotion, projection, QA, and publication for that batch.

After publication:

\`\`\`text
formal NAR Actions manual dispatch
-> primary hosted runner
-> local fallback retained
-> shared Acquisition Registry / Job / Plan integration
\`\`\``,
`The 11 A+ meetings are detail-complete. The 71 C meetings are published schedule identities and remain explicit detail-retry targets.

Current handoff:

\`\`\`text
primary hosted runner active
-> local fallback retained
-> Acquisition Registry current
-> Job / Plan / Review Queue / Retry Queue integration next
\`\`\``,
    ],
  ]],
  ['docs/calendar/nar-a-plus-pilot-plan.md', [
    [
`Status: active  
Work ID: \`WHR-CAL-JAPAN-NAR-A-PLUS\`  
Pilot audit month: 2026-07  
Current phase: July remainder review/promotion and runner transition  
Next Work ID: \`WHR-CAL-ACQUISITION-CONTROL-PLANE\``,
`Status: source pilot publication complete; maintenance retries continue  
Work ID: \`WHR-CAL-JAPAN-NAR-A-PLUS\`  
Pilot audit month: 2026-07  
Current phase: Acquisition Control Plane integration and detail retries  
Current shared Work ID: \`WHR-CAL-ACQUISITION-CONTROL-PLANE\``,
    ],
    [
`Reviewed NAR detail through 2026-07-07 is already published. The July 2026 full-month path remains a bounded Completion Audit and pilot benchmark.`,
`Reviewed NAR schedule coverage through 2026-07-31 is published. The July 8–31 batch contributes 11 A+ detail records and 71 C schedule records; the C records remain detail-retry work. The July 2026 full-month path remains a bounded Completion Audit and pilot benchmark.`,
    ],
    [
`Current implemented state:

\`\`\`text
local v2 runner: available
bounded GitHub Actions acquisition: successful
formal workflow_dispatch normal operation: pending
\`\`\`

Target profile after the formal workflow-dispatch path is merged and validated:

\`\`\`text
primary runner: github_actions
fallback runner: local
\`\`\``,
`Current implemented state:

\`\`\`text
primary runner: github_actions
formal workflow_dispatch normal operation: active
fallback runner: local
scheduled publication: disabled
\`\`\``,
    ],
    [
`14. July 8–31 immutable review batch collection — complete.`,
`14. July 8–31 immutable review batch collection — complete;
15. pinned review and source-separated C/A+ approval envelopes — complete;
16. canonical promotion, public projection, rendered QA, and release-gate validation — complete;
17. temporary PR #430/#435 closure without merge — complete;
18. formal Actions manual-dispatch operator — complete.`,
    ],
    [
`This batch is currently awaiting completion of review decision, approved candidate generation, promotion, projection, QA, and publication.`,
`This batch is reviewed, promoted, projected, QA-validated, and published from main. The 71 C meetings remain explicit detail-retry targets.`,
    ],
    [
`## Current sequence

1. finalize the exact review decision for the 82-meeting batch;
2. generate source-compatible approved promotion envelopes;
3. validate 11 A+ and 71 C promotion paths;
4. perform canonical promotion;
5. rebuild public projection;
6. run rendered bilingual QA and release checks;
7. publish reviewed output;
8. preserve pending meetings as retry work;
9. close temporary diagnostic PRs #430 and #435 without merge;
10. formalize NAR Actions manual dispatch;
11. retain local fallback;
12. hand NAR into the shared Acquisition Registry / Job / Plan / Review Queue / Retry Queue model.`,
`## Current sequence

1. keep the 71 C meetings in explicit detail-retry work;
2. use Actions manual dispatch as primary acquisition runner;
3. retain the local v2 runner as fallback;
4. register NAR in the shared Acquisition Registry;
5. connect NAR to Collection Job / Plan / Review Queue / Rank-aware Retry Queue semantics.`,
    ],
    [
`After the current NAR publication path:

\`\`\`text
formal NAR Actions workflow
-> Acquisition Registry`,
`Current control-plane handoff:

\`\`\`text
formal NAR Actions workflow active
-> Acquisition Registry`,
    ],
  ]],
  ['docs/calendar/README.md', [
    [
`NAR detail through 2026-07-07 is published. The July 8–31 immutable review batch is committed with 82 schedule-confirmed meetings: 11 A+ and 71 C, with zero schedule errors and 71 pending detail retries.

The immediate sequence is:

\`\`\`text
finish NAR review/promotion/publication
-> close temporary diagnostic PRs without merge
-> formalize NAR Actions manual dispatch
-> Acquisition Registry`,
`NAR schedule coverage through 2026-07-31 is published. The July 8–31 batch contains 82 schedule-confirmed meetings: 11 A+ and 71 C, with zero schedule errors and 71 pending detail retries. Temporary diagnostic PRs are closed, and formal Actions manual dispatch is active with local fallback.

The immediate sequence is:

\`\`\`text
Acquisition Registry`,
    ],
  ]],
];

let changedFiles = 0;
for (const [file, pairs] of replacements) {
  let text = fs.readFileSync(file, 'utf8');
  let changed = false;
  for (const [from, to] of pairs) {
    if (text.includes(to)) continue;
    if (!text.includes(from)) throw new Error(`${file}: expected source block not found`);
    text = text.replace(from, to);
    changed = true;
  }
  if (changed) {
    fs.writeFileSync(file, text);
    changedFiles += 1;
    console.log(`updated ${file}`);
  }
}

console.log(`NAR_ACTIONS_DOC_STATE_UPDATED: files=${changedFiles}`);
