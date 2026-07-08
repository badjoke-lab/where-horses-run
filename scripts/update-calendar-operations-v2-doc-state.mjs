import fs from 'node:fs';

function replaceRequired(text, from, to, label) {
  if (!text.includes(from)) throw new Error(`${label}: required marker not found`);
  return text.replace(from, to);
}

function updateFile(file, transforms) {
  let text = fs.readFileSync(file, 'utf8');
  for (const [from, to, label] of transforms) text = replaceRequired(text, from, to, `${file} ${label}`);
  fs.writeFileSync(file, text);
}

updateFile('docs/calendar/acquisition-control-plane-implementation-plan.md', [
  [
    '## Stage ACP-15 — Operations v2 operator view\n\nStatus: current.',
    '## Stage ACP-15 — Operations v2 operator view\n\nStatus: complete. Operations v2 now aggregates Due Plan and runtime acquisition states, Review Queue, Retry Queue, five-rank distributions, source health, freshness, promotion state, publication state, and per-system operator attention in one read-only control-plane view while retaining an explicit additive reference to Operations v1.',
    'ACP-15 complete',
  ],
  [
    '## Stage ACP-16 — Completion Audit and governance alignment',
    'Initial ACP-1 through ACP-15 implementation sequence: complete.\n\n## Stage ACP-16 — Completion Audit and governance alignment',
    'ACP sequence completion marker',
  ],
]);

updateFile('docs/calendar/implementation-roadmap.md', [
  [
    '## Operations v2 — current',
    '## Operations v2 — complete\n\nInitial Acquisition Control Plane sequence ACP-1 through ACP-15: complete.',
    'Operations v2 complete',
  ],
]);

updateFile('docs/project-roadmap.md', [
  [
    'The Acquisition Registry, Collection Job, Collection Plan, shared five-rank classifier, Collection Result Manifest, Review Queue, Rank-aware Retry Queue, runner-neutral compatibility foundation, Actions multi-job execution, local multi-job execution with JRA shared local Job integration, Review Cohort Planner, deterministic review PR package preparation, and policy-driven Due-job Planner with artifact-only daily scheduling are implemented. Operations v2 operator view is current shared work.',
    'The Acquisition Registry, Collection Job, Collection Plan, shared five-rank classifier, Collection Result Manifest, Review Queue, Rank-aware Retry Queue, runner-neutral compatibility foundation, Actions multi-job execution, local multi-job execution with JRA shared local Job integration, Review Cohort Planner, deterministic review PR package preparation, policy-driven Due-job Planner with artifact-only daily scheduling, and read-only Operations v2 operator view are implemented. The initial ACP-1 through ACP-15 Acquisition Control Plane sequence is complete.',
    'programme summary',
  ],
  [
    '15. Operations v2 operator view — current.',
    '15. Operations v2 operator view — complete;\n16. initial ACP-1 through ACP-15 sequence — complete.',
    'foundation sequence',
  ],
  [
    'Operations v2 operator view — current',
    'Operations v2 operator view — complete',
    'multi-system sequence',
  ],
]);

updateFile('docs/calendar/machine-readable-contracts.md', [
  [
    'data/fixtures/calendar-due-job-planner-invalid-cases-v1.json\nscripts/timetable/actions-multi-job-core.mjs',
    'data/fixtures/calendar-due-job-planner-invalid-cases-v1.json\ndata/static/calendar-operations-v2.schema.json\ndata/fixtures/calendar-operations-v2-fixtures-v1.json\ndata/fixtures/calendar-operations-v2-invalid-cases-v1.json\nscripts/timetable/actions-multi-job-core.mjs',
    'Operations v2 data artifacts',
  ],
  [
    'scripts/timetable/plan-calendar-due-jobs.mjs\nscripts/timetable/load-calendar-acquisition-registry.mjs',
    'scripts/timetable/plan-calendar-due-jobs.mjs\nscripts/timetable/operations-v2.mjs\nscripts/timetable/build-calendar-operations-v2.mjs\nscripts/timetable/load-calendar-acquisition-registry.mjs',
    'Operations v2 core and CLI',
  ],
  [
    'scripts/check-calendar-due-job-planner.mjs\n.github/workflows/calendar-actions-multi-job.yml',
    'scripts/check-calendar-due-job-planner.mjs\nscripts/check-calendar-operations-v2.mjs\n.github/workflows/calendar-actions-multi-job.yml',
    'Operations v2 checker',
  ],
  [
    '.github/workflows/calendar-due-job-planner.yml\n.github/workflows/calendar-contracts.yml',
    '.github/workflows/calendar-due-job-planner.yml\n.github/workflows/calendar-operations-v2.yml\n.github/workflows/calendar-contracts.yml',
    'Operations v2 workflow',
  ],
]);

updateFile('docs/calendar/README.md', [
  [
    '- [`due-job-planner.md`](due-job-planner.md) — freshness, proximity, horizon, season, coverage, retry, source-health policy, explicit Job generation, and artifact-only daily scheduling contract.\n',
    '- [`due-job-planner.md`](due-job-planner.md) — freshness, proximity, horizon, season, coverage, retry, source-health policy, explicit Job generation, and artifact-only daily scheduling contract.\n- [`operations-v2.md`](operations-v2.md) — additive read-only view over acquisition state, Review Queue, Retry Queue, rank distribution, source health, freshness, promotion state, publication state, and per-system attention.\n',
    'documentation index',
  ],
  [
    'data/fixtures/calendar-due-job-planner-invalid-cases-v1.json\ndata/static/timetable-candidate-v1.schema.json',
    'data/fixtures/calendar-due-job-planner-invalid-cases-v1.json\ndata/static/calendar-operations-v2.schema.json\ndata/fixtures/calendar-operations-v2-fixtures-v1.json\ndata/fixtures/calendar-operations-v2-invalid-cases-v1.json\ndata/static/timetable-candidate-v1.schema.json',
    'Operations v2 data refs',
  ],
  [
    'scripts/check-calendar-due-job-planner.mjs\n.github/workflows/calendar-actions-multi-job.yml',
    'scripts/check-calendar-due-job-planner.mjs\nscripts/timetable/operations-v2.mjs\nscripts/timetable/build-calendar-operations-v2.mjs\nscripts/check-calendar-operations-v2.mjs\n.github/workflows/calendar-actions-multi-job.yml',
    'Operations v2 scripts',
  ],
  [
    '.github/workflows/calendar-due-job-planner.yml\n.github/workflows/calendar-acquisition-registry.yml',
    '.github/workflows/calendar-due-job-planner.yml\n.github/workflows/calendar-operations-v2.yml\n.github/workflows/calendar-acquisition-registry.yml',
    'Operations v2 workflow',
  ],
  [
    'Operations v2 operator view (current)\n+ Banei source-specific implementation may proceed on the satisfied minimum handoff gate',
    'Initial ACP-1 through ACP-15 sequence: complete\n+ Banei source-specific implementation may proceed on the satisfied minimum handoff gate',
    'current sequence',
  ],
]);

updateFile('START-HERE.md', [
  [
    'docs/calendar/due-job-planner.md\ndocs/calendar/implementation-roadmap.md',
    'docs/calendar/due-job-planner.md\ndocs/calendar/operations-v2.md\ndocs/calendar/implementation-roadmap.md',
    'required reading',
  ],
  [
    'data/fixtures/calendar-due-job-planner-invalid-cases-v1.json\nscripts/timetable/five-rank-classifier.mjs',
    'data/fixtures/calendar-due-job-planner-invalid-cases-v1.json\ndata/static/calendar-operations-v2.schema.json\ndata/fixtures/calendar-operations-v2-fixtures-v1.json\ndata/fixtures/calendar-operations-v2-invalid-cases-v1.json\nscripts/timetable/five-rank-classifier.mjs',
    'Operations v2 data refs',
  ],
  [
    'scripts/check-calendar-due-job-planner.mjs\n.github/workflows/calendar-actions-multi-job.yml',
    'scripts/check-calendar-due-job-planner.mjs\nscripts/timetable/operations-v2.mjs\nscripts/timetable/build-calendar-operations-v2.mjs\nscripts/check-calendar-operations-v2.mjs\n.github/workflows/calendar-actions-multi-job.yml',
    'Operations v2 scripts',
  ],
  [
    '.github/workflows/calendar-due-job-planner.yml\n.github/workflows/calendar-five-rank-classifier.yml',
    '.github/workflows/calendar-due-job-planner.yml\n.github/workflows/calendar-operations-v2.yml\n.github/workflows/calendar-five-rank-classifier.yml',
    'Operations v2 workflow',
  ],
]);

console.log('CALENDAR_OPERATIONS_V2_DOC_STATE_UPDATED');
