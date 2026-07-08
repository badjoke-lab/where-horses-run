import fs from 'node:fs';

const replacements = [
  ['docs/calendar/acquisition-control-plane-implementation-plan.md', [
    [
`## Stage ACP-3 — Acquisition Registry

Status: current.`,
`## Stage ACP-3 — Acquisition Registry

Status: complete. The machine-readable registry, schema, loader, validator, initial Japan profiles, and CI are implemented.`,
    ],
    [
`## Stage ACP-4 — Collection Job schema

Goal: define one schedulable acquisition request format.`,
`## Stage ACP-4 — Collection Job schema

Status: current.

Goal: define one schedulable acquisition request format.`,
    ],
  ]],
  ['docs/calendar/machine-readable-contracts.md', [
    [
`data/static/timetable-candidate-v1.schema.json
data/static/jra-final-program-intake.schema.json
scripts/timetable/coverage-observation-validation.mjs`,
`data/static/timetable-candidate-v1.schema.json
data/static/jra-final-program-intake.schema.json
data/static/calendar-acquisition-registry.schema.json
data/static/calendar-acquisition-registry.json
scripts/timetable/load-calendar-acquisition-registry.mjs
scripts/timetable/coverage-observation-validation.mjs`,
    ],
    [
`scripts/check-calendar-pipeline-v1-promotion.mjs
.github/workflows/calendar-contracts.yml`,
`scripts/check-calendar-pipeline-v1-promotion.mjs
scripts/check-calendar-acquisition-registry.mjs
.github/workflows/calendar-contracts.yml
.github/workflows/calendar-acquisition-registry.yml`,
    ],
    [
`Planned control-plane canonical artifacts:

\`\`\`text
Acquisition Registry schema + registry
Collection Job schema`,
`Planned control-plane canonical artifacts:

\`\`\`text
Collection Job schema`,
    ],
    [
`Source Test v2, authority/source inventory, Calendar Readiness, and the planned Acquisition Registry keep these states separate:`,
`Source Test v2, authority/source inventory, Calendar Readiness, and the implemented Acquisition Registry keep these states separate:`,
    ],
    [
`The planned Acquisition Registry will route system/source/adapter profiles to runners without changing candidate or promotion semantics.`,
`The Acquisition Registry routes system/source/adapter profiles to runners without changing candidate or promotion semantics.`,
    ],
    [
`## Planned Acquisition Registry

The Acquisition Registry must represent at least:`,
`## Implemented Acquisition Registry

Canonical files:

\`\`\`text
data/static/calendar-acquisition-registry.schema.json
data/static/calendar-acquisition-registry.json
scripts/timetable/load-calendar-acquisition-registry.mjs
scripts/check-calendar-acquisition-registry.mjs
.github/workflows/calendar-acquisition-registry.yml
\`\`\`

The Acquisition Registry represents at least:`,
    ],
    [
`JRA and NAR must be representable without hard-coding runner choice into the common orchestration layer.`,
`JRA and NAR are represented without hard-coding runner choice into the common orchestration layer. The initial Banei profile is provisional and preserves explicit pending detail source/adapter state instead of inventing unsupported acquisition capability.`,
    ],
  ]],
  ['docs/calendar/README.md', [
    [
`data/static/calendar-validation-responsibilities-v1.json
data/static/timetable-candidate-v1.schema.json`,
`data/static/calendar-validation-responsibilities-v1.json
data/static/calendar-acquisition-registry.schema.json
data/static/calendar-acquisition-registry.json
data/static/timetable-candidate-v1.schema.json`,
    ],
    [
`scripts/timetable/run-nar-incremental-v2-local.mjs
scripts/check-calendar-coverage-observation-schema.mjs`,
`scripts/timetable/run-nar-incremental-v2-local.mjs
scripts/timetable/load-calendar-acquisition-registry.mjs
scripts/check-calendar-acquisition-registry.mjs
.github/workflows/calendar-acquisition-registry.yml
scripts/check-calendar-coverage-observation-schema.mjs`,
    ],
    [
`\`\`\`text
Acquisition Registry schema + registry
Collection Job schema`,
`\`\`\`text
Collection Job schema`,
    ],
    [
`\`\`\`text
Acquisition Registry
-> Collection Job / Collection Plan schemas`,
`\`\`\`text
Collection Job schema
-> Collection Plan schema`,
    ],
  ]],
  ['START-HERE.md', [
    [
`data/static/calendar-validation-responsibilities-v1.json
data/static/timetable-candidate-v1.schema.json`,
`data/static/calendar-validation-responsibilities-v1.json
data/static/calendar-acquisition-registry.schema.json
data/static/calendar-acquisition-registry.json
data/static/timetable-candidate-v1.schema.json`,
    ],
    [
`scripts/check-calendar-validation-responsibilities.mjs
scripts/check-calendar-contracts.mjs`,
`scripts/check-calendar-validation-responsibilities.mjs
scripts/timetable/load-calendar-acquisition-registry.mjs
scripts/check-calendar-acquisition-registry.mjs
.github/workflows/calendar-acquisition-registry.yml
scripts/check-calendar-contracts.mjs`,
    ],
    [
`\`\`\`text
Acquisition Registry
Collection Job`,
`\`\`\`text
Collection Job`,
    ],
    [
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
    ],
  ]],
  ['docs/calendar/implementation-roadmap.md', [
    [
`### ACP-2 — Acquisition Registry

Implement machine-readable routing/capability records for at least:`,
`### ACP-2 — Acquisition Registry — complete

Implemented machine-readable routing/capability records for at least:`,
    ],
    [
`### ACP-3 — Collection Job schema

One schedulable request with:`,
`### ACP-3 — Collection Job schema — current

One schedulable request with:`,
    ],
    [
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
`1. add Collection Job schema
2. add Collection Plan schema
3. add five-rank classifier contract tests
4. add Result Manifest
5. add Review Queue
6. add Rank-aware Retry Queue
7. connect Actions and local runners to shared job semantics
8. begin Banei on the shared foundation
9. expand multi-system execution
10. add automatic review PR preparation
11. add due-job planning and scheduled bounded retries
12. add Operations v2 operator view`,
    ],
  ]],
  ['docs/project-roadmap.md', [
    [
`1. NAR formal Actions manual-dispatch path — complete;
2. Acquisition Registry schema and Japan profiles — current;
3. Collection Job schema and fixtures;`,
`1. NAR formal Actions manual-dispatch path — complete;
2. Acquisition Registry schema and Japan profiles — complete;
3. Collection Job schema and fixtures — current;`,
    ],
  ]],
];

let changed = 0;
for (const [file, pairs] of replacements) {
  let text = fs.readFileSync(file, 'utf8');
  let fileChanged = false;
  for (const [from, to] of pairs) {
    if (text.includes(to)) continue;
    if (!text.includes(from)) throw new Error(`${file}: source block not found: ${from.slice(0, 100)}`);
    text = text.replace(from, to);
    fileChanged = true;
  }
  if (fileChanged) {
    fs.writeFileSync(file, text);
    changed += 1;
    console.log(`updated ${file}`);
  }
}
console.log(`ACQUISITION_REGISTRY_DOC_STATE_UPDATED: files=${changed}`);
