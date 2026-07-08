import fs from 'node:fs';

function replaceRequired(text, from, to, label) {
  if (!text.includes(from)) throw new Error(`${label}: required marker not found`);
  return text.replace(from, to);
}

function updateFile(file, transforms) {
  let text = fs.readFileSync(file, 'utf8');
  for (const [from, to, label] of transforms) {
    text = replaceRequired(text, from, to, `${file} ${label}`);
  }
  fs.writeFileSync(file, text);
}

updateFile('docs/calendar/acquisition-control-plane-implementation-plan.md', [
  [
    '## Stage ACP-12 — review cohort planner\n\nStatus: current.',
    '## Stage ACP-12 — review cohort planner\n\nStatus: complete. The deterministic planner consumes Review Queue and Acquisition Registry state, fully accounts for Queue entries, groups review-ready batches by source compatibility, review kind, public display risk, and promotion dependency, isolates source failures, preserves five-rank and coverage aggregates, and emits human-review-only proposal metadata.',
    'ACP-12 complete',
  ],
  [
    '## Stage ACP-13 — automatic review PR preparation\n\nGoal:',
    '## Stage ACP-13 — automatic review PR preparation\n\nStatus: current.\n\nGoal:',
    'ACP-13 current',
  ],
]);

updateFile('docs/calendar/implementation-roadmap.md', [
  [
    '### Review cohort planner — current',
    '### Review cohort planner — complete',
    'review cohort complete',
  ],
  [
    '### Automatic review PR preparation\n',
    '### Automatic review PR preparation — current\n',
    'automatic review PR current',
  ],
]);

updateFile('docs/project-roadmap.md', [
  [
    'The Acquisition Registry, Collection Job, Collection Plan, shared five-rank classifier, Collection Result Manifest, Review Queue, Rank-aware Retry Queue, runner-neutral compatibility foundation, Actions multi-job execution, and local multi-job execution with JRA shared local Job integration are implemented. Review Cohort Planner is current shared work.',
    'The Acquisition Registry, Collection Job, Collection Plan, shared five-rank classifier, Collection Result Manifest, Review Queue, Rank-aware Retry Queue, runner-neutral compatibility foundation, Actions multi-job execution, local multi-job execution with JRA shared local Job integration, and Review Cohort Planner are implemented. Automatic review PR preparation is current shared work.',
    'programme summary',
  ],
  [
    '12. Review Cohort Planner — current.',
    '12. Review Cohort Planner — complete;\n13. automatic review PR preparation — current.',
    'foundation sequence',
  ],
]);

updateFile('docs/calendar/machine-readable-contracts.md', [
  [
    'data/fixtures/calendar-local-multi-job-fixtures-v1.json\nscripts/timetable/actions-multi-job-core.mjs',
    'data/fixtures/calendar-local-multi-job-fixtures-v1.json\ndata/static/calendar-review-cohort-plan.schema.json\ndata/fixtures/calendar-review-cohort-planner-fixtures-v1.json\ndata/fixtures/calendar-review-cohort-planner-invalid-cases-v1.json\nscripts/timetable/actions-multi-job-core.mjs',
    'review cohort data artifacts',
  ],
  [
    'scripts/timetable/run-calendar-local-plan.mjs\nscripts/timetable/load-calendar-acquisition-registry.mjs',
    'scripts/timetable/run-calendar-local-plan.mjs\nscripts/timetable/review-cohort-planner.mjs\nscripts/timetable/load-calendar-acquisition-registry.mjs',
    'review cohort core',
  ],
  [
    'scripts/check-calendar-local-multi-job.mjs\n.github/workflows/calendar-actions-multi-job.yml',
    'scripts/check-calendar-local-multi-job.mjs\nscripts/check-calendar-review-cohort-planner.mjs\n.github/workflows/calendar-actions-multi-job.yml',
    'review cohort checker',
  ],
  [
    '.github/workflows/calendar-local-multi-job.yml\n.github/workflows/calendar-contracts.yml',
    '.github/workflows/calendar-local-multi-job.yml\n.github/workflows/calendar-review-cohort-planner.yml\n.github/workflows/calendar-contracts.yml',
    'review cohort workflow',
  ],
]);

updateFile('docs/calendar/README.md', [
  [
    '- [`local-multi-job-runner.md`](local-multi-job-runner.md) — local Job filtering, worktree-isolated JRA review-only execution, independent batches and statuses, Review Queue snapshot, and campaign summary contract.\n',
    '- [`local-multi-job-runner.md`](local-multi-job-runner.md) — local Job filtering, worktree-isolated JRA review-only execution, independent batches and statuses, Review Queue snapshot, and campaign summary contract.\n- [`review-cohort-planner.md`](review-cohort-planner.md) — source-compatible, risk-bounded review grouping, public-display risk, promotion dependency, source-failure isolation, and human-review proposal contract.\n',
    'documentation index',
  ],
  [
    'data/fixtures/calendar-local-multi-job-fixtures-v1.json\ndata/static/timetable-candidate-v1.schema.json',
    'data/fixtures/calendar-local-multi-job-fixtures-v1.json\ndata/static/calendar-review-cohort-plan.schema.json\ndata/fixtures/calendar-review-cohort-planner-fixtures-v1.json\ndata/fixtures/calendar-review-cohort-planner-invalid-cases-v1.json\ndata/static/timetable-candidate-v1.schema.json',
    'review cohort data refs',
  ],
  [
    'scripts/check-calendar-local-multi-job.mjs\n.github/workflows/calendar-actions-multi-job.yml',
    'scripts/check-calendar-local-multi-job.mjs\nscripts/timetable/review-cohort-planner.mjs\nscripts/check-calendar-review-cohort-planner.mjs\n.github/workflows/calendar-actions-multi-job.yml',
    'review cohort scripts',
  ],
  [
    '.github/workflows/calendar-local-multi-job.yml\n.github/workflows/calendar-acquisition-registry.yml',
    '.github/workflows/calendar-local-multi-job.yml\n.github/workflows/calendar-review-cohort-planner.yml\n.github/workflows/calendar-acquisition-registry.yml',
    'review cohort workflow',
  ],
  [
    'Review Cohort Planner (current)\n+ Banei source-specific implementation may proceed on the satisfied minimum handoff gate',
    'Automatic review PR preparation (current)\n+ Banei source-specific implementation may proceed on the satisfied minimum handoff gate',
    'immediate sequence',
  ],
]);

updateFile('START-HERE.md', [
  [
    'docs/calendar/local-multi-job-runner.md\ndocs/calendar/implementation-roadmap.md',
    'docs/calendar/local-multi-job-runner.md\ndocs/calendar/review-cohort-planner.md\ndocs/calendar/implementation-roadmap.md',
    'required reading',
  ],
  [
    'data/fixtures/calendar-local-multi-job-fixtures-v1.json\nscripts/timetable/five-rank-classifier.mjs',
    'data/fixtures/calendar-local-multi-job-fixtures-v1.json\ndata/static/calendar-review-cohort-plan.schema.json\ndata/fixtures/calendar-review-cohort-planner-fixtures-v1.json\ndata/fixtures/calendar-review-cohort-planner-invalid-cases-v1.json\nscripts/timetable/five-rank-classifier.mjs',
    'review cohort data refs',
  ],
  [
    'scripts/check-calendar-local-multi-job.mjs\n.github/workflows/calendar-actions-multi-job.yml',
    'scripts/check-calendar-local-multi-job.mjs\nscripts/timetable/review-cohort-planner.mjs\nscripts/check-calendar-review-cohort-planner.mjs\n.github/workflows/calendar-actions-multi-job.yml',
    'review cohort scripts',
  ],
  [
    '.github/workflows/calendar-local-multi-job.yml\nscripts/check-calendar-contracts.mjs',
    '.github/workflows/calendar-local-multi-job.yml\n.github/workflows/calendar-review-cohort-planner.yml\nscripts/check-calendar-contracts.mjs',
    'review cohort workflow',
  ],
]);

console.log('CALENDAR_REVIEW_COHORT_DOC_STATE_UPDATED');
