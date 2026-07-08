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
    '## Stage ACP-9 — Rank-aware Retry Queue\n\nStatus: current.',
    '## Stage ACP-9 — Rank-aware Retry Queue\n\nStatus: complete. The schema, validation core, valid and invalid fixtures, rank-gap rules, Registry/canonical cross-checks, deterministic NAR July 71-entry projection, contract documentation, and dedicated CI are implemented.',
    'ACP-9 complete',
  ],
  [
    '## Stage ACP-10 — Actions multi-job runner\n\nGoal:',
    '## Stage ACP-10 — Actions multi-job runner\n\nStatus: current. Shared runner compatibility begins with Actions execution consuming common Job/Plan/Manifest/Queue semantics.\n\nGoal:',
    'ACP-10 current',
  ],
]);

updateFile('docs/calendar/implementation-roadmap.md', [
  [
    '### ACP-8 — Rank-aware Retry Queue — current',
    '### ACP-8 — Rank-aware Retry Queue — complete',
    'Retry Queue complete',
  ],
  [
    '### ACP-9 — shared runner semantics\n',
    '### ACP-9 — shared runner semantics — current\n',
    'shared runner current',
  ],
  [
    `1. add Rank-aware Retry Queue\n2. connect Actions and local runners to shared job semantics\n3. begin Banei on the shared foundation\n4. expand multi-system execution\n5. add automatic review PR preparation\n6. add due-job planning and scheduled bounded retries\n7. add Operations v2 operator view`,
    `1. connect Actions and local runners to shared job semantics\n2. begin Banei on the shared foundation\n3. expand multi-system execution\n4. add automatic review PR preparation\n5. add due-job planning and scheduled bounded retries\n6. add Operations v2 operator view`,
    'immediate sequence',
  ],
]);

updateFile('docs/project-roadmap.md', [
  [
    'The Acquisition Registry, Collection Job, Collection Plan, shared five-rank classifier, Collection Result Manifest, and Review Queue are implemented. Rank-aware Retry Queue foundation is current next work.',
    'The Acquisition Registry, Collection Job, Collection Plan, shared five-rank classifier, Collection Result Manifest, Review Queue, and Rank-aware Retry Queue are implemented. Shared Actions/local runner compatibility is current next work.',
    'programme summary',
  ],
  [
    '8. Rank-aware Retry Queue foundation — current;\n9. Actions and local runner compatibility with common Job/Plan semantics.',
    '8. Rank-aware Retry Queue foundation — complete;\n9. Actions and local runner compatibility with common Job/Plan/Manifest/Queue semantics — current.',
    'foundation sequence',
  ],
]);

updateFile('docs/calendar/machine-readable-contracts.md', [
  [
    `data/fixtures/calendar-review-queue-invalid-cases-v1.json\nscripts/timetable/load-calendar-acquisition-registry.mjs`,
    `data/fixtures/calendar-review-queue-invalid-cases-v1.json\ndata/static/calendar-rank-aware-retry-queue.schema.json\ndata/fixtures/calendar-rank-aware-retry-queue-fixtures-v1.json\ndata/fixtures/calendar-rank-aware-retry-queue-invalid-cases-v1.json\nscripts/timetable/load-calendar-acquisition-registry.mjs`,
    'retry queue data artifacts',
  ],
  [
    `scripts/timetable/review-queue-validation.mjs\nscripts/timetable/coverage-observation-validation.mjs`,
    `scripts/timetable/review-queue-validation.mjs\nscripts/timetable/rank-aware-retry-queue-validation.mjs\nscripts/timetable/coverage-observation-validation.mjs`,
    'retry queue core',
  ],
  [
    `scripts/check-calendar-review-queue.mjs\n.github/workflows/calendar-contracts.yml`,
    `scripts/check-calendar-review-queue.mjs\nscripts/check-calendar-rank-aware-retry-queue.mjs\n.github/workflows/calendar-contracts.yml`,
    'retry queue validator',
  ],
  [
    `.github/workflows/calendar-review-queue.yml\n.github/workflows/calendar-validation-responsibilities.yml`,
    `.github/workflows/calendar-review-queue.yml\n.github/workflows/calendar-rank-aware-retry-queue.yml\n.github/workflows/calendar-validation-responsibilities.yml`,
    'retry queue workflow',
  ],
  [
    `Rank-aware Retry Queue schema\nassociated validators and release gates`,
    `runner compatibility validators\ncontrol-plane release gate`,
    'planned artifacts',
  ],
  [
    'Until those machine-readable artifacts are implemented, their semantics and implementation order are governed by:',
    'Until the remaining machine-readable artifacts are implemented, their semantics and implementation order are governed by:',
    'planned wording',
  ],
  [
    '## Planned Rank-aware Retry Queue\n\nThe Retry Queue contract must retain:',
    '## Implemented Rank-aware Retry Queue\n\nThe Rank-aware Retry Queue schema, validation core, fixtures, rank-gap rules, Registry/canonical cross-checks, deterministic NAR July projection, validator, contract documentation, and dedicated CI are implemented.\n\nThe Retry Queue contract retains:',
    'retry queue section',
  ],
  [
    '6. implement Rank-aware Retry Queue schema;',
    '6. connect shared Actions/local runner compatibility to Job/Plan/Manifest/Queue semantics;',
    'next implementation',
  ],
]);

updateFile('docs/calendar/README.md', [
  [
    '- [`review-queue.md`](review-queue.md) — validated-batch operator inventory, five-rank visibility, Manifest projection, and review/promotion state contract.\n',
    '- [`review-queue.md`](review-queue.md) — validated-batch operator inventory, five-rank visibility, Manifest projection, and review/promotion state contract.\n- [`rank-aware-retry-queue.md`](rank-aware-retry-queue.md) — rank-gap, missing-field, retry reason/scope, Registry routing, backoff, and NAR 71-target projection contract.\n',
    'documentation index',
  ],
  [
    `data/fixtures/calendar-review-queue-invalid-cases-v1.json\ndata/static/timetable-candidate-v1.schema.json`,
    `data/fixtures/calendar-review-queue-invalid-cases-v1.json\ndata/static/calendar-rank-aware-retry-queue.schema.json\ndata/fixtures/calendar-rank-aware-retry-queue-fixtures-v1.json\ndata/fixtures/calendar-rank-aware-retry-queue-invalid-cases-v1.json\ndata/static/timetable-candidate-v1.schema.json`,
    'retry queue data refs',
  ],
  [
    `scripts/check-calendar-review-queue.mjs\n.github/workflows/calendar-acquisition-registry.yml`,
    `scripts/check-calendar-review-queue.mjs\nscripts/timetable/rank-aware-retry-queue-validation.mjs\nscripts/check-calendar-rank-aware-retry-queue.mjs\n.github/workflows/calendar-acquisition-registry.yml`,
    'retry queue scripts',
  ],
  [
    `.github/workflows/calendar-review-queue.yml\nscripts/check-calendar-coverage-observation-schema.mjs`,
    `.github/workflows/calendar-review-queue.yml\n.github/workflows/calendar-rank-aware-retry-queue.yml\nscripts/check-calendar-coverage-observation-schema.mjs`,
    'retry queue workflow',
  ],
  [
    `Rank-aware Retry Queue schema\nrunner compatibility validators\ncontrol-plane release gate`,
    `runner compatibility validators\ncontrol-plane release gate`,
    'planned entry points',
  ],
  [
    `Rank-aware Retry Queue\n-> shared Actions/local job semantics\n-> Banei on the shared foundation`,
    `shared Actions/local job semantics\n-> Banei on the shared foundation`,
    'immediate sequence',
  ],
]);

updateFile('START-HERE.md', [
  [
    'docs/calendar/review-queue.md\ndocs/calendar/implementation-roadmap.md',
    'docs/calendar/review-queue.md\ndocs/calendar/rank-aware-retry-queue.md\ndocs/calendar/implementation-roadmap.md',
    'required reading',
  ],
  [
    `data/fixtures/calendar-review-queue-invalid-cases-v1.json\nscripts/timetable/five-rank-classifier.mjs`,
    `data/fixtures/calendar-review-queue-invalid-cases-v1.json\ndata/static/calendar-rank-aware-retry-queue.schema.json\ndata/fixtures/calendar-rank-aware-retry-queue-fixtures-v1.json\ndata/fixtures/calendar-rank-aware-retry-queue-invalid-cases-v1.json\nscripts/timetable/five-rank-classifier.mjs`,
    'retry queue data refs',
  ],
  [
    `scripts/check-calendar-review-queue.mjs\n.github/workflows/calendar-five-rank-classifier.yml`,
    `scripts/check-calendar-review-queue.mjs\nscripts/timetable/rank-aware-retry-queue-validation.mjs\nscripts/check-calendar-rank-aware-retry-queue.mjs\n.github/workflows/calendar-five-rank-classifier.yml`,
    'retry queue scripts',
  ],
  [
    `.github/workflows/calendar-review-queue.yml\nscripts/check-calendar-contracts.mjs`,
    `.github/workflows/calendar-review-queue.yml\n.github/workflows/calendar-rank-aware-retry-queue.yml\nscripts/check-calendar-contracts.mjs`,
    'retry queue workflow',
  ],
  [
    `Rank-aware Retry Queue\nrunner compatibility\ncontrol-plane release gate`,
    `runner compatibility\ncontrol-plane release gate`,
    'planned references',
  ],
]);

console.log('CALENDAR_RANK_AWARE_RETRY_QUEUE_DOC_STATE_UPDATED');
