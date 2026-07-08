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
    '## Stage ACP-13 — automatic review PR preparation\n\nStatus: current.',
    '## Stage ACP-13 — automatic review PR preparation\n\nStatus: complete. Validated Review Cohorts are converted into deterministic human-review packages containing candidate diff summaries, Coverage summaries, five-rank distributions, retry summaries, artifact references, bounded checklists, and proposed PR metadata. Package preparation stops at `pending_human_review`; no PR creation, approval, promotion, publication, or deployment permission is granted.',
    'ACP-13 complete',
  ],
  [
    '## Stage ACP-14 — due-job planner and scheduling\n\nGoal:',
    '## Stage ACP-14 — due-job planner and scheduling\n\nStatus: current.\n\nGoal:',
    'ACP-14 current',
  ],
]);

updateFile('docs/calendar/implementation-roadmap.md', [
  ['### Automatic review PR preparation — current', '### Automatic review PR preparation — complete', 'review PR preparation complete'],
  ['### Due-job planner\n', '### Due-job planner — current\n', 'due-job current'],
]);

updateFile('docs/project-roadmap.md', [
  [
    'The Acquisition Registry, Collection Job, Collection Plan, shared five-rank classifier, Collection Result Manifest, Review Queue, Rank-aware Retry Queue, runner-neutral compatibility foundation, Actions multi-job execution, local multi-job execution with JRA shared local Job integration, and Review Cohort Planner are implemented. Automatic review PR preparation is current shared work.',
    'The Acquisition Registry, Collection Job, Collection Plan, shared five-rank classifier, Collection Result Manifest, Review Queue, Rank-aware Retry Queue, runner-neutral compatibility foundation, Actions multi-job execution, local multi-job execution with JRA shared local Job integration, Review Cohort Planner, and deterministic review PR package preparation are implemented. Due-job planning and scheduling policy are current shared work.',
    'programme summary',
  ],
  ['13. automatic review PR preparation — current.', '13. automatic review PR preparation — complete;\n14. due-job planner and scheduling policy — current.', 'foundation sequence'],
]);

updateFile('docs/calendar/machine-readable-contracts.md', [
  [
    'data/fixtures/calendar-review-cohort-planner-invalid-cases-v1.json\nscripts/timetable/actions-multi-job-core.mjs',
    'data/fixtures/calendar-review-cohort-planner-invalid-cases-v1.json\ndata/static/calendar-review-pr-package.schema.json\ndata/fixtures/calendar-review-pr-preparation-fixtures-v1.json\ndata/fixtures/calendar-review-pr-preparation-invalid-cases-v1.json\nscripts/timetable/actions-multi-job-core.mjs',
    'review PR data artifacts',
  ],
  [
    'scripts/timetable/review-cohort-planner.mjs\nscripts/timetable/load-calendar-acquisition-registry.mjs',
    'scripts/timetable/review-cohort-planner.mjs\nscripts/timetable/review-pr-preparation.mjs\nscripts/timetable/prepare-calendar-review-pr-packages.mjs\nscripts/timetable/load-calendar-acquisition-registry.mjs',
    'review PR core and CLI',
  ],
  [
    'scripts/check-calendar-review-cohort-planner.mjs\n.github/workflows/calendar-actions-multi-job.yml',
    'scripts/check-calendar-review-cohort-planner.mjs\nscripts/check-calendar-review-pr-preparation.mjs\n.github/workflows/calendar-actions-multi-job.yml',
    'review PR checker',
  ],
  [
    '.github/workflows/calendar-review-cohort-planner.yml\n.github/workflows/calendar-contracts.yml',
    '.github/workflows/calendar-review-cohort-planner.yml\n.github/workflows/calendar-review-pr-preparation.yml\n.github/workflows/calendar-contracts.yml',
    'review PR workflow',
  ],
]);

updateFile('docs/calendar/README.md', [
  [
    '- [`review-cohort-planner.md`](review-cohort-planner.md) — source-compatible, risk-bounded review grouping, public-display risk, promotion dependency, source-failure isolation, and human-review proposal contract.\n',
    '- [`review-cohort-planner.md`](review-cohort-planner.md) — source-compatible, risk-bounded review grouping, public-display risk, promotion dependency, source-failure isolation, and human-review proposal contract.\n- [`review-pr-preparation.md`](review-pr-preparation.md) — deterministic candidate diff, Coverage, retry, checklist, PR metadata, and pending-human-review package boundary.\n',
    'documentation index',
  ],
  [
    'data/fixtures/calendar-review-cohort-planner-invalid-cases-v1.json\ndata/static/timetable-candidate-v1.schema.json',
    'data/fixtures/calendar-review-cohort-planner-invalid-cases-v1.json\ndata/static/calendar-review-pr-package.schema.json\ndata/fixtures/calendar-review-pr-preparation-fixtures-v1.json\ndata/fixtures/calendar-review-pr-preparation-invalid-cases-v1.json\ndata/static/timetable-candidate-v1.schema.json',
    'review PR data refs',
  ],
  [
    'scripts/check-calendar-review-cohort-planner.mjs\n.github/workflows/calendar-actions-multi-job.yml',
    'scripts/check-calendar-review-cohort-planner.mjs\nscripts/timetable/review-pr-preparation.mjs\nscripts/timetable/prepare-calendar-review-pr-packages.mjs\nscripts/check-calendar-review-pr-preparation.mjs\n.github/workflows/calendar-actions-multi-job.yml',
    'review PR scripts',
  ],
  [
    '.github/workflows/calendar-review-cohort-planner.yml\n.github/workflows/calendar-acquisition-registry.yml',
    '.github/workflows/calendar-review-cohort-planner.yml\n.github/workflows/calendar-review-pr-preparation.yml\n.github/workflows/calendar-acquisition-registry.yml',
    'review PR workflow',
  ],
  [
    'Automatic review PR preparation (current)\n+ Banei source-specific implementation may proceed on the satisfied minimum handoff gate',
    'Due-job planner and scheduling policy (current)\n+ Banei source-specific implementation may proceed on the satisfied minimum handoff gate',
    'current sequence',
  ],
]);

updateFile('START-HERE.md', [
  [
    'docs/calendar/review-cohort-planner.md\ndocs/calendar/implementation-roadmap.md',
    'docs/calendar/review-cohort-planner.md\ndocs/calendar/review-pr-preparation.md\ndocs/calendar/implementation-roadmap.md',
    'required reading',
  ],
  [
    'data/fixtures/calendar-review-cohort-planner-invalid-cases-v1.json\nscripts/timetable/five-rank-classifier.mjs',
    'data/fixtures/calendar-review-cohort-planner-invalid-cases-v1.json\ndata/static/calendar-review-pr-package.schema.json\ndata/fixtures/calendar-review-pr-preparation-fixtures-v1.json\ndata/fixtures/calendar-review-pr-preparation-invalid-cases-v1.json\nscripts/timetable/five-rank-classifier.mjs',
    'review PR data refs',
  ],
  [
    'scripts/check-calendar-review-cohort-planner.mjs\n.github/workflows/calendar-actions-multi-job.yml',
    'scripts/check-calendar-review-cohort-planner.mjs\nscripts/timetable/review-pr-preparation.mjs\nscripts/timetable/prepare-calendar-review-pr-packages.mjs\nscripts/check-calendar-review-pr-preparation.mjs\n.github/workflows/calendar-actions-multi-job.yml',
    'review PR scripts',
  ],
  [
    '.github/workflows/calendar-review-cohort-planner.yml\n.github/workflows/calendar-five-rank-classifier.yml',
    '.github/workflows/calendar-review-cohort-planner.yml\n.github/workflows/calendar-review-pr-preparation.yml\n.github/workflows/calendar-five-rank-classifier.yml',
    'review PR workflow',
  ],
]);

console.log('CALENDAR_REVIEW_PR_PREPARATION_DOC_STATE_UPDATED');
