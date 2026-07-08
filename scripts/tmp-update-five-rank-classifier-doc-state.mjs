import fs from 'node:fs';

const replacements = [
  ['docs/calendar/acquisition-control-plane-implementation-plan.md', [
    [
`## Stage ACP-6 — shared five-rank classifier contract

Status: current.`,
`## Stage ACP-6 — shared five-rank classifier contract

Status: complete. The machine-readable contract, classifier core, classification fixtures, transition/regression fixtures, invalid-shape fixtures, cross-contract validator, documentation, and dedicated CI are implemented.`,
    ],
    [
`## Stage ACP-7 — Collection Result Manifest

Goal: give every job one concise machine-readable result summary.`,
`## Stage ACP-7 — Collection Result Manifest

Status: current.

Goal: give every job one concise machine-readable result summary.`,
    ],
  ]],
  ['docs/calendar/machine-readable-contracts.md', [
    [
`data/fixtures/calendar-collection-plan-invalid-cases-v1.json
scripts/timetable/load-calendar-acquisition-registry.mjs`,
`data/fixtures/calendar-collection-plan-invalid-cases-v1.json
data/static/calendar-five-rank-classifier-contract-v1.json
data/fixtures/calendar-five-rank-classifier-fixtures-v1.json
scripts/timetable/load-calendar-acquisition-registry.mjs`,
    ],
    [
`scripts/timetable/collection-plan-validation.mjs
scripts/timetable/coverage-observation-validation.mjs`,
`scripts/timetable/collection-plan-validation.mjs
scripts/timetable/five-rank-classifier.mjs
scripts/timetable/coverage-observation-validation.mjs`,
    ],
    [
`scripts/check-calendar-collection-plan.mjs
.github/workflows/calendar-contracts.yml`,
`scripts/check-calendar-collection-plan.mjs
scripts/check-calendar-five-rank-classifier.mjs
.github/workflows/calendar-contracts.yml`,
    ],
    [
`.github/workflows/calendar-collection-plan.yml
.github/workflows/calendar-validation-responsibilities.yml`,
`.github/workflows/calendar-collection-plan.yml
.github/workflows/calendar-five-rank-classifier.yml
.github/workflows/calendar-validation-responsibilities.yml`,
    ],
  ]],
  ['docs/calendar/README.md', [
    [
`data/fixtures/calendar-collection-plan-invalid-cases-v1.json
data/static/timetable-candidate-v1.schema.json`,
`data/fixtures/calendar-collection-plan-invalid-cases-v1.json
data/static/calendar-five-rank-classifier-contract-v1.json
data/fixtures/calendar-five-rank-classifier-fixtures-v1.json
data/static/timetable-candidate-v1.schema.json`,
    ],
    [
`scripts/check-calendar-collection-plan.mjs
.github/workflows/calendar-acquisition-registry.yml`,
`scripts/check-calendar-collection-plan.mjs
scripts/timetable/five-rank-classifier.mjs
scripts/check-calendar-five-rank-classifier.mjs
.github/workflows/calendar-acquisition-registry.yml`,
    ],
    [
`.github/workflows/calendar-collection-plan.yml
scripts/check-calendar-coverage-observation-schema.mjs`,
`.github/workflows/calendar-collection-plan.yml
.github/workflows/calendar-five-rank-classifier.yml
scripts/check-calendar-coverage-observation-schema.mjs`,
    ],
    [
`Review Queue schema
Rank-aware Retry Queue schema
five-rank classifier validator
runner compatibility validators`,
`Review Queue schema
Rank-aware Retry Queue schema
runner compatibility validators`,
    ],
    [
`\`\`\`text
five-rank classifier contract
-> Result Manifest / Review Queue / Rank-aware Retry Queue`,
`\`\`\`text
Result Manifest
-> Review Queue / Rank-aware Retry Queue`,
    ],
  ]],
  ['START-HERE.md', [
    [
`.github/workflows/calendar-collection-plan.yml
scripts/check-calendar-contracts.mjs`,
`.github/workflows/calendar-collection-plan.yml
data/static/calendar-five-rank-classifier-contract-v1.json
data/fixtures/calendar-five-rank-classifier-fixtures-v1.json
scripts/timetable/five-rank-classifier.mjs
scripts/check-calendar-five-rank-classifier.mjs
.github/workflows/calendar-five-rank-classifier.yml
scripts/check-calendar-contracts.mjs`,
    ],
    [
`Collection Result Manifest
Review Queue
Rank-aware Retry Queue
five-rank classifier contract
runner compatibility`,
`Collection Result Manifest
Review Queue
Rank-aware Retry Queue
runner compatibility`,
    ],
    [
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
`1. add Collection Result Manifest
2. add Review Queue
3. add Rank-aware Retry Queue
4. connect Actions and local runners to shared job semantics
5. begin Banei on the shared foundation
6. add Actions multi-job execution
7. add local multi-job execution
8. add review cohort planner
9. add automatic review PR preparation
10. add due-job planning and scheduled bounded retries
11. add Operations v2 operator view`,
    ],
  ]],
  ['docs/calendar/implementation-roadmap.md', [
    [`### ACP-5 — five-rank classifier contract — current`, `### ACP-5 — five-rank classifier contract — complete`],
    [`### ACP-6 — Collection Result Manifest\n\nEvery job receives one concise summary`, `### ACP-6 — Collection Result Manifest — current\n\nEvery job receives one concise summary`],
  ]],
  ['docs/project-roadmap.md', [
    [
`5. common C/B/B+/A/A+ classifier contract tests — current;
6. Collection Result Manifest;`,
`5. common C/B/B+/A/A+ classifier contract tests — complete;
6. Collection Result Manifest — current;`,
    ],
  ]],
  ['scripts/check-project-governance-docs.mjs', [
    [
`  'data/static/calendar-collection-plan.schema.json',
  'Collection Result Manifest schema',`,
`  'data/static/calendar-collection-plan.schema.json',
  'data/static/calendar-five-rank-classifier-contract-v1.json',
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
console.log(`FIVE_RANK_CLASSIFIER_DOC_STATE_UPDATED: files=${changedFiles}`);
