import fs from 'node:fs';

const replacements = [
  ['docs/calendar/acquisition-control-plane-implementation-plan.md', [
    [
`## Stage ACP-5 — Collection Plan schema

Status: current.`,
`## Stage ACP-5 — Collection Plan schema

Status: complete. The schema, validation core, valid multi-system fixtures, negative fixtures, rank-isolation checks, source-error-isolation checks, contract documentation, and dedicated CI are implemented.`,
    ],
    [
`## Stage ACP-6 — shared five-rank classifier contract

Goal: make C/B/B+/A/A+ classification a tested common layer.`,
`## Stage ACP-6 — shared five-rank classifier contract

Status: current.

Goal: make C/B/B+/A/A+ classification a tested common layer.`,
    ],
  ]],
  ['docs/calendar/machine-readable-contracts.md', [
    [
`data/fixtures/calendar-collection-job-invalid-cases-v1.json
scripts/timetable/load-calendar-acquisition-registry.mjs
scripts/timetable/collection-job-validation.mjs`,
`data/fixtures/calendar-collection-job-invalid-cases-v1.json
data/static/calendar-collection-plan.schema.json
data/fixtures/calendar-collection-plans-v1.json
data/fixtures/calendar-collection-plan-invalid-cases-v1.json
scripts/timetable/load-calendar-acquisition-registry.mjs
scripts/timetable/collection-job-validation.mjs
scripts/timetable/collection-plan-validation.mjs`,
    ],
    [
`scripts/check-calendar-collection-job.mjs
.github/workflows/calendar-contracts.yml`,
`scripts/check-calendar-collection-job.mjs
scripts/check-calendar-collection-plan.mjs
.github/workflows/calendar-contracts.yml`,
    ],
    [
`.github/workflows/calendar-collection-job.yml
.github/workflows/calendar-validation-responsibilities.yml`,
`.github/workflows/calendar-collection-job.yml
.github/workflows/calendar-collection-plan.yml
.github/workflows/calendar-validation-responsibilities.yml`,
    ],
    [
`\`\`\`text
Collection Plan schema
Collection Result Manifest schema`,
`\`\`\`text
Collection Result Manifest schema`,
    ],
  ]],
  ['docs/calendar/README.md', [
    [
`data/fixtures/calendar-collection-job-invalid-cases-v1.json
data/static/timetable-candidate-v1.schema.json`,
`data/fixtures/calendar-collection-job-invalid-cases-v1.json
data/static/calendar-collection-plan.schema.json
data/fixtures/calendar-collection-plans-v1.json
data/fixtures/calendar-collection-plan-invalid-cases-v1.json
data/static/timetable-candidate-v1.schema.json`,
    ],
    [
`scripts/check-calendar-collection-job.mjs
.github/workflows/calendar-acquisition-registry.yml`,
`scripts/check-calendar-collection-job.mjs
scripts/timetable/collection-plan-validation.mjs
scripts/check-calendar-collection-plan.mjs
.github/workflows/calendar-acquisition-registry.yml`,
    ],
    [
`.github/workflows/calendar-collection-job.yml
scripts/check-calendar-coverage-observation-schema.mjs`,
`.github/workflows/calendar-collection-job.yml
.github/workflows/calendar-collection-plan.yml
scripts/check-calendar-coverage-observation-schema.mjs`,
    ],
    [
`\`\`\`text
Collection Plan schema
Collection Result Manifest schema`,
`\`\`\`text
Collection Result Manifest schema`,
    ],
    [
`\`\`\`text
Collection Job schema
-> Collection Plan schema
-> five-rank classifier contract`,
`\`\`\`text
five-rank classifier contract`,
    ],
  ]],
  ['START-HERE.md', [
    [
`.github/workflows/calendar-collection-job.yml
scripts/check-calendar-contracts.mjs`,
`.github/workflows/calendar-collection-job.yml
data/static/calendar-collection-plan.schema.json
data/fixtures/calendar-collection-plans-v1.json
data/fixtures/calendar-collection-plan-invalid-cases-v1.json
scripts/timetable/collection-plan-validation.mjs
scripts/check-calendar-collection-plan.mjs
.github/workflows/calendar-collection-plan.yml
scripts/check-calendar-contracts.mjs`,
    ],
    [
`\`\`\`text
Collection Job
Collection Plan
Collection Result Manifest`,
`\`\`\`text
Collection Result Manifest`,
    ],
    [
`1. add Collection Plan schema
2. add five-rank classifier contract tests
3. add Collection Result Manifest
4. add Review Queue
5. add Rank-aware Retry Queue
6. connect Actions and local runners to shared job semantics
7. begin Banei on the shared foundation
8. add Actions multi-job execution
9. add local multi-job execution
10. add review cohort planner
11. add automatic review PR preparation
12. add due-job planning and scheduled bounded retries
13. add Operations v2 operator view`,
`1. add five-rank classifier contract tests
2. add Collection Result Manifest
3. add Review Queue
4. add Rank-aware Retry Queue
5. connect Actions and local runners to shared job semantics
6. begin Banei on the shared foundation
7. add Actions multi-job execution
8. add local multi-job execution
9. add review cohort planner
10. add automatic review PR preparation
11. add due-job planning and scheduled bounded retries
12. add Operations v2 operator view`,
    ],
  ]],
  ['docs/calendar/implementation-roadmap.md', [
    [
`japan-banei-system
\`\`\`

Registry fields include`,
`japan-banei-system
hong-kong-hkjc-system (provisional bounded-generator profile)
\`\`\`

Registry fields include`,
    ],
    [
`### ACP-4 — Collection Plan schema — current`,
`### ACP-4 — Collection Plan schema — complete`,
    ],
    [
`### ACP-5 — five-rank classifier contract

Test common C/B/B+/A/A+ shapes`,
`### ACP-5 — five-rank classifier contract — current

Test common C/B/B+/A/A+ shapes`,
    ],
  ]],
  ['docs/project-roadmap.md', [
    [
`4. Collection Plan schema and fixtures — current;
5. common C/B/B+/A/A+ classifier contract tests;`,
`4. Collection Plan schema and fixtures — complete;
5. common C/B/B+/A/A+ classifier contract tests — current;`,
    ],
  ]],
  ['docs/calendar/acquisition-registry.md', [
    [
`japan-banei-system
\`\`\`

### JRA`,
`japan-banei-system
hong-kong-hkjc-system
\`\`\`

### JRA`,
    ],
    [
`This profile records only current evidence. It does not infer NAR-compatible detail acquisition, runner fallback, arbitrary windows, selected-meeting support, source-visible horizon support, or rank-upgrade retry support.

## Rank rules`,
`This profile records only current evidence. It does not infer NAR-compatible detail acquisition, runner fallback, arbitrary windows, selected-meeting support, source-visible horizon support, or rank-upgrade retry support.

### Hong Kong / HKJC

The HKJC profile is provisional and exists to support the already-implemented bounded safe-generator path.

\`\`\`text
profile_status: provisional
primary_runner: github_actions
fallback_runner: local
schedule_source_id: hkjc-fixture-list
schedule_adapter_id: hong-kong-hkjc-dry-run-adapter
detail_source_id: pending
detail_adapter_id: pending
technical_capability_rank: A+
public_ceiling: A
supports_date_window: true
\`\`\`

The runner profile is grounded in merged generator/check integration and local validation commands. It does not claim live fetch, arbitrary source parsing, selected-meeting support, cross-month support, or implemented detail acquisition.

The reviewed HKJC Readiness record remains the authority for Technical Rank A+ and Public Ceiling A.

## Rank rules`,
    ],
    [
`The validator cross-checks the initial Japan profiles against:

\`\`\`text
data/static/calendar-readiness-japan-v2.json
data/static/japan-a-plus-policy.json
Authority/Source inventory and supplements
concrete adapter implementation evidence
\`\`\``,
`The validator cross-checks registered profiles against reviewed readiness/policy, Authority/Source inventory, and concrete adapter evidence.

For Japan it uses:

\`\`\`text
data/static/calendar-readiness-japan-v2.json
data/static/japan-a-plus-policy.json
\`\`\`

For HKJC it uses the reviewed global Calendar Readiness record plus Authority/Source and candidate-adapter evidence.`,
    ],
    [
`## Next stage

The next control-plane implementation stage is the Collection Job schema.

Collection Jobs will reference \`system_id\` and consume Registry routing metadata without duplicating source-specific runner knowledge inside every job.`,
`## Downstream use

Collection Jobs reference \`system_id\` and consume Registry routing metadata without duplicating source-specific runner knowledge. Collection Plans group independently valid Jobs without copying source/adapter routing metadata into the Plan layer.

The current control-plane implementation stage after Job and Plan contracts is the shared five-rank classifier contract.`,
    ],
  ]],
  ['scripts/check-project-governance-docs.mjs', [
    [
`  'Collection Plan schema',
  'Collection Result Manifest schema',`,
`  'data/static/calendar-collection-plan.schema.json',
  'Collection Result Manifest schema',`,
    ],
  ]],
];

let changedFiles = 0;
for (const [file, pairs] of replacements) {
  let text = fs.readFileSync(file, 'utf8');
  let changed = false;
  for (const [from, to] of pairs) {
    if (text.includes(to)) continue;
    if (!text.includes(from)) throw new Error(`${file}: source block not found: ${from.slice(0, 120)}`);
    text = text.replace(from, to);
    changed = true;
  }
  if (changed) {
    fs.writeFileSync(file, text);
    changedFiles += 1;
    console.log(`updated ${file}`);
  }
}
console.log(`COLLECTION_PLAN_DOC_STATE_UPDATED: files=${changedFiles}`);
