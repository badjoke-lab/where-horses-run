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
    '## Stage ACP-14 — due-job planner and scheduling\n\nStatus: current.',
    '## Stage ACP-14 — due-job planner and scheduling\n\nStatus: complete. Policy-driven planning now converts freshness, meeting proximity, source horizon, season state, coverage gaps, due rank retries, retry backoff, and source health into explicit validated Collection Jobs before execution. The daily scheduler is artifact-only and does not execute acquisition Jobs, approve candidates, promote data, publish, or deploy.',
    'ACP-14 complete',
  ],
  [
    '## Stage ACP-15 — Operations v2 operator view\n\nGoal:',
    '## Stage ACP-15 — Operations v2 operator view\n\nStatus: current.\n\nGoal:',
    'ACP-15 current',
  ],
]);

updateFile('docs/calendar/implementation-roadmap.md', [
  ['### Due-job planner — current', '### Due-job planner — complete', 'due-job complete'],
  [
    '### Scheduled steady-state maintenance\n',
    '### Scheduled steady-state maintenance — planning active, execution disabled\n',
    'scheduled planning state',
  ],
  [
    '## Stage 10 — additional pilots',
    '## Operations v2 — current\n\nBuild the unified operator view over due plans, Collection Jobs, Result Manifests, Review Queue, Retry Queue, source health, freshness, promotion state, and publication state.\n\n## Stage 10 — additional pilots',
    'Operations v2 current',
  ],
]);

updateFile('docs/project-roadmap.md', [
  [
    'The Acquisition Registry, Collection Job, Collection Plan, shared five-rank classifier, Collection Result Manifest, Review Queue, Rank-aware Retry Queue, runner-neutral compatibility foundation, Actions multi-job execution, local multi-job execution with JRA shared local Job integration, Review Cohort Planner, and deterministic review PR package preparation are implemented. Due-job planning and scheduling policy are current shared work.',
    'The Acquisition Registry, Collection Job, Collection Plan, shared five-rank classifier, Collection Result Manifest, Review Queue, Rank-aware Retry Queue, runner-neutral compatibility foundation, Actions multi-job execution, local multi-job execution with JRA shared local Job integration, Review Cohort Planner, deterministic review PR package preparation, and policy-driven Due-job Planner with artifact-only daily scheduling are implemented. Operations v2 operator view is current shared work.',
    'programme summary',
  ],
  [
    '14. due-job planner and scheduling policy — current.',
    '14. due-job planner and artifact-only scheduling policy — complete;\n15. Operations v2 operator view — current.',
    'foundation sequence',
  ],
  [
    'due-job planner\nscheduled regular refresh\nscheduled rank-gap retry policy\nOperations v2 operator view',
    'due-job planner — complete\nartifact-only scheduled planning — complete\nscheduled acquisition execution — disabled\nOperations v2 operator view — current',
    'multi-system sequence',
  ],
]);

updateFile('docs/calendar/machine-readable-contracts.md', [
  [
    'data/fixtures/calendar-review-pr-preparation-invalid-cases-v1.json\nscripts/timetable/actions-multi-job-core.mjs',
    'data/fixtures/calendar-review-pr-preparation-invalid-cases-v1.json\ndata/static/calendar-due-job-policy-v1.json\ndata/static/calendar-due-job-plan.schema.json\ndata/fixtures/calendar-due-job-planner-fixtures-v1.json\ndata/fixtures/calendar-due-job-planner-invalid-cases-v1.json\nscripts/timetable/actions-multi-job-core.mjs',
    'due-job data artifacts',
  ],
  [
    'scripts/timetable/prepare-calendar-review-pr-packages.mjs\nscripts/timetable/load-calendar-acquisition-registry.mjs',
    'scripts/timetable/prepare-calendar-review-pr-packages.mjs\nscripts/timetable/due-job-planner.mjs\nscripts/timetable/plan-calendar-due-jobs.mjs\nscripts/timetable/load-calendar-acquisition-registry.mjs',
    'due-job core and CLI',
  ],
  [
    'scripts/check-calendar-review-pr-preparation.mjs\n.github/workflows/calendar-actions-multi-job.yml',
    'scripts/check-calendar-review-pr-preparation.mjs\nscripts/check-calendar-due-job-planner.mjs\n.github/workflows/calendar-actions-multi-job.yml',
    'due-job checker',
  ],
  [
    '.github/workflows/calendar-review-pr-preparation.yml\n.github/workflows/calendar-contracts.yml',
    '.github/workflows/calendar-review-pr-preparation.yml\n.github/workflows/calendar-due-job-planner.yml\n.github/workflows/calendar-contracts.yml',
    'due-job workflow',
  ],
]);

updateFile('docs/calendar/README.md', [
  [
    '- [`review-pr-preparation.md`](review-pr-preparation.md) — deterministic candidate diff, Coverage, retry, checklist, PR metadata, and pending-human-review package boundary.\n',
    '- [`review-pr-preparation.md`](review-pr-preparation.md) — deterministic candidate diff, Coverage, retry, checklist, PR metadata, and pending-human-review package boundary.\n- [`due-job-planner.md`](due-job-planner.md) — freshness, proximity, horizon, season, coverage, retry, source-health policy, explicit Job generation, and artifact-only daily scheduling contract.\n',
    'documentation index',
  ],
  [
    'data/fixtures/calendar-review-pr-preparation-invalid-cases-v1.json\ndata/static/timetable-candidate-v1.schema.json',
    'data/fixtures/calendar-review-pr-preparation-invalid-cases-v1.json\ndata/static/calendar-due-job-policy-v1.json\ndata/static/calendar-due-job-plan.schema.json\ndata/fixtures/calendar-due-job-planner-fixtures-v1.json\ndata/fixtures/calendar-due-job-planner-invalid-cases-v1.json\ndata/static/timetable-candidate-v1.schema.json',
    'due-job data refs',
  ],
  [
    'scripts/check-calendar-review-pr-preparation.mjs\n.github/workflows/calendar-actions-multi-job.yml',
    'scripts/check-calendar-review-pr-preparation.mjs\nscripts/timetable/due-job-planner.mjs\nscripts/timetable/plan-calendar-due-jobs.mjs\nscripts/check-calendar-due-job-planner.mjs\n.github/workflows/calendar-actions-multi-job.yml',
    'due-job scripts',
  ],
  [
    '.github/workflows/calendar-review-pr-preparation.yml\n.github/workflows/calendar-acquisition-registry.yml',
    '.github/workflows/calendar-review-pr-preparation.yml\n.github/workflows/calendar-due-job-planner.yml\n.github/workflows/calendar-acquisition-registry.yml',
    'due-job workflow',
  ],
  [
    'Due-job planner and scheduling policy (current)\n+ Banei source-specific implementation may proceed on the satisfied minimum handoff gate',
    'Operations v2 operator view (current)\n+ Banei source-specific implementation may proceed on the satisfied minimum handoff gate',
    'current sequence',
  ],
]);

updateFile('START-HERE.md', [
  [
    'docs/calendar/review-pr-preparation.md\ndocs/calendar/implementation-roadmap.md',
    'docs/calendar/review-pr-preparation.md\ndocs/calendar/due-job-planner.md\ndocs/calendar/implementation-roadmap.md',
    'required reading',
  ],
  [
    'data/fixtures/calendar-review-pr-preparation-invalid-cases-v1.json\nscripts/timetable/five-rank-classifier.mjs',
    'data/fixtures/calendar-review-pr-preparation-invalid-cases-v1.json\ndata/static/calendar-due-job-policy-v1.json\ndata/static/calendar-due-job-plan.schema.json\ndata/fixtures/calendar-due-job-planner-fixtures-v1.json\ndata/fixtures/calendar-due-job-planner-invalid-cases-v1.json\nscripts/timetable/five-rank-classifier.mjs',
    'due-job data refs',
  ],
  [
    'scripts/check-calendar-review-pr-preparation.mjs\n.github/workflows/calendar-actions-multi-job.yml',
    'scripts/check-calendar-review-pr-preparation.mjs\nscripts/timetable/due-job-planner.mjs\nscripts/timetable/plan-calendar-due-jobs.mjs\nscripts/check-calendar-due-job-planner.mjs\n.github/workflows/calendar-actions-multi-job.yml',
    'due-job scripts',
  ],
  [
    '.github/workflows/calendar-review-pr-preparation.yml\n.github/workflows/calendar-five-rank-classifier.yml',
    '.github/workflows/calendar-review-pr-preparation.yml\n.github/workflows/calendar-due-job-planner.yml\n.github/workflows/calendar-five-rank-classifier.yml',
    'due-job workflow',
  ],
]);

console.log('CALENDAR_DUE_JOB_DOC_STATE_UPDATED');
