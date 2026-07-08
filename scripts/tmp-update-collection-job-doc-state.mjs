import fs from 'node:fs';

const replacements = [
  ['docs/calendar/acquisition-control-plane-implementation-plan.md', [
    [
`## Stage ACP-4 — Collection Job schema

Status: current.`,
`## Stage ACP-4 — Collection Job schema

Status: complete. The schema, validation core, valid fixtures, negative fixtures, contract documentation, and dedicated CI are implemented.`,
    ],
    [
`## Stage ACP-5 — Collection Plan schema

Goal: allow one campaign to contain multiple systems with independent scopes.`,
`## Stage ACP-5 — Collection Plan schema

Status: current.

Goal: allow one campaign to contain multiple systems with independent scopes.`,
    ],
  ]],
  ['docs/calendar/machine-readable-contracts.md', [
    [
`data/static/calendar-acquisition-registry.json
scripts/timetable/load-calendar-acquisition-registry.mjs
scripts/timetable/coverage-observation-validation.mjs`,
`data/static/calendar-acquisition-registry.json
data/static/calendar-collection-job.schema.json
data/fixtures/calendar-collection-jobs-v1.json
data/fixtures/calendar-collection-job-invalid-cases-v1.json
scripts/timetable/load-calendar-acquisition-registry.mjs
scripts/timetable/collection-job-validation.mjs
scripts/timetable/coverage-observation-validation.mjs`,
    ],
    [
`scripts/check-calendar-acquisition-registry.mjs
.github/workflows/calendar-contracts.yml`,
`scripts/check-calendar-acquisition-registry.mjs
scripts/check-calendar-collection-job.mjs
.github/workflows/calendar-contracts.yml`,
    ],
    [
`.github/workflows/calendar-acquisition-registry.yml
.github/workflows/calendar-validation-responsibilities.yml`,
`.github/workflows/calendar-acquisition-registry.yml
.github/workflows/calendar-collection-job.yml
.github/workflows/calendar-validation-responsibilities.yml`,
    ],
    [
`\`\`\`text
Collection Job schema
Collection Plan schema`,
`\`\`\`text
Collection Plan schema`,
    ],
  ]],
  ['docs/calendar/README.md', [
    [
`data/static/calendar-acquisition-registry.json
data/static/timetable-candidate-v1.schema.json`,
`data/static/calendar-acquisition-registry.json
data/static/calendar-collection-job.schema.json
data/fixtures/calendar-collection-jobs-v1.json
data/fixtures/calendar-collection-job-invalid-cases-v1.json
data/static/timetable-candidate-v1.schema.json`,
    ],
    [
`scripts/check-calendar-acquisition-registry.mjs
.github/workflows/calendar-acquisition-registry.yml
scripts/check-calendar-coverage-observation-schema.mjs`,
`scripts/check-calendar-acquisition-registry.mjs
scripts/timetable/collection-job-validation.mjs
scripts/check-calendar-collection-job.mjs
.github/workflows/calendar-acquisition-registry.yml
.github/workflows/calendar-collection-job.yml
scripts/check-calendar-coverage-observation-schema.mjs`,
    ],
    [
`\`\`\`text
Collection Job schema
Collection Plan schema`,
`\`\`\`text
Collection Plan schema`,
    ],
    [
`\`\`\`text
Collection Job schema
-> Collection Plan schema`,
`\`\`\`text
Collection Plan schema`,
    ],
  ]],
  ['START-HERE.md', [
    [
`.github/workflows/calendar-acquisition-registry.yml
scripts/check-calendar-contracts.mjs`,
`.github/workflows/calendar-acquisition-registry.yml
data/static/calendar-collection-job.schema.json
data/fixtures/calendar-collection-jobs-v1.json
data/fixtures/calendar-collection-job-invalid-cases-v1.json
scripts/timetable/collection-job-validation.mjs
scripts/check-calendar-collection-job.mjs
.github/workflows/calendar-collection-job.yml
scripts/check-calendar-contracts.mjs`,
    ],
    [
`\`\`\`text
Collection Job
Collection Plan`,
`\`\`\`text
Collection Plan`,
    ],
    [
`1. add Collection Job schema
2. add Collection Plan schema
3. add five-rank classifier contract tests
4. add Collection Result Manifest
5. add Review Queue
6. add Rank-aware Retry Queue
7. connect Actions and local runners to shared job semantics
8. begin Banei on the shared foundation
9. add Actions multi-job execution
10. add local multi-job execution
11. add review cohort planner
12. add automatic review PR preparation
13. add due-job planning and scheduled bounded retries
14. add Operations v2 operator view`,
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
    ],
  ]],
  ['docs/calendar/implementation-roadmap.md', [
    [
`### ACP-3 — Collection Job schema — current`,
`### ACP-3 — Collection Job schema — complete`,
    ],
    [
`### ACP-4 — Collection Plan schema

One campaign may contain many independent jobs`,
`### ACP-4 — Collection Plan schema — current

One campaign may contain many independent jobs`,
    ],
  ]],
  ['docs/project-roadmap.md', [
    [
`3. Collection Job schema and fixtures — current;
4. Collection Plan schema and fixtures;`,
`3. Collection Job schema and fixtures — complete;
4. Collection Plan schema and fixtures — current;`,
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
console.log(`COLLECTION_JOB_DOC_STATE_UPDATED: files=${changedFiles}`);
