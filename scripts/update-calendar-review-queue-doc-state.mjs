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
    '## Stage ACP-8 — Review Queue\n\nStatus: current.',
    '## Stage ACP-8 — Review Queue\n\nStatus: complete. The schema, validation core, valid and invalid fixtures, Manifest projection cross-checks, deterministic summary, contract documentation, and dedicated CI are implemented.',
    'ACP-8 complete',
  ],
  [
    '## Stage ACP-9 — Rank-aware Retry Queue\n\nGoal:',
    '## Stage ACP-9 — Rank-aware Retry Queue\n\nStatus: current.\n\nGoal:',
    'ACP-9 current',
  ],
]);

updateFile('docs/calendar/implementation-roadmap.md', [
  [
    '### ACP-7 — Review Queue — current',
    '### ACP-7 — Review Queue — complete',
    'Review Queue complete',
  ],
  [
    '### ACP-8 — Rank-aware Retry Queue\n',
    '### ACP-8 — Rank-aware Retry Queue — current\n',
    'Retry Queue current',
  ],
  [
    `1. add Review Queue\n2. add Rank-aware Retry Queue\n3. connect Actions and local runners to shared job semantics\n4. begin Banei on the shared foundation\n5. expand multi-system execution\n6. add automatic review PR preparation\n7. add due-job planning and scheduled bounded retries\n8. add Operations v2 operator view`,
    `1. add Rank-aware Retry Queue\n2. connect Actions and local runners to shared job semantics\n3. begin Banei on the shared foundation\n4. expand multi-system execution\n5. add automatic review PR preparation\n6. add due-job planning and scheduled bounded retries\n7. add Operations v2 operator view`,
    'immediate sequence',
  ],
]);

updateFile('docs/project-roadmap.md', [
  [
    'The Acquisition Registry, Collection Job, Collection Plan, shared five-rank classifier, and Collection Result Manifest are implemented. Review Queue and Rank-aware Retry Queue foundations are current next work.',
    'The Acquisition Registry, Collection Job, Collection Plan, shared five-rank classifier, Collection Result Manifest, and Review Queue are implemented. Rank-aware Retry Queue foundation is current next work.',
    'programme summary',
  ],
  [
    '7. Review Queue foundation — current;\n8. Rank-aware Retry Queue foundation;',
    '7. Review Queue foundation — complete;\n8. Rank-aware Retry Queue foundation — current;',
    'foundation sequence',
  ],
]);

updateFile('docs/calendar/machine-readable-contracts.md', [
  [
    `data/fixtures/calendar-collection-result-manifest-invalid-cases-v1.json\nscripts/timetable/load-calendar-acquisition-registry.mjs`,
    `data/fixtures/calendar-collection-result-manifest-invalid-cases-v1.json\ndata/static/calendar-review-queue.schema.json\ndata/fixtures/calendar-review-queue-v1.json\ndata/fixtures/calendar-review-queue-invalid-cases-v1.json\nscripts/timetable/load-calendar-acquisition-registry.mjs`,
    'review queue data artifacts',
  ],
  [
    `scripts/timetable/collection-result-manifest-validation.mjs\nscripts/timetable/coverage-observation-validation.mjs`,
    `scripts/timetable/collection-result-manifest-validation.mjs\nscripts/timetable/review-queue-validation.mjs\nscripts/timetable/coverage-observation-validation.mjs`,
    'review queue core',
  ],
  [
    `scripts/check-calendar-collection-result-manifest.mjs\n.github/workflows/calendar-contracts.yml`,
    `scripts/check-calendar-collection-result-manifest.mjs\nscripts/check-calendar-review-queue.mjs\n.github/workflows/calendar-contracts.yml`,
    'review queue validator',
  ],
  [
    `.github/workflows/calendar-collection-result-manifest.yml\n.github/workflows/calendar-validation-responsibilities.yml`,
    `.github/workflows/calendar-collection-result-manifest.yml\n.github/workflows/calendar-review-queue.yml\n.github/workflows/calendar-validation-responsibilities.yml`,
    'review queue workflow',
  ],
  [
    `Review Queue schema\nRank-aware Retry Queue schema\nassociated validators and release gates`,
    `Rank-aware Retry Queue schema\nassociated validators and release gates`,
    'planned artifacts',
  ],
  [
    '## Planned Review Queue\n\nThe Review Queue machine-readable contract must expose:',
    '## Implemented Review Queue\n\nThe Review Queue schema, validation core, fixtures, Manifest projection cross-checks, deterministic summary, validator, contract documentation, and dedicated CI are implemented.\n\nThe Review Queue machine-readable contract exposes:',
    'review queue section',
  ],
  [
    '6. implement Review Queue and Rank-aware Retry Queue schemas;',
    '6. implement Rank-aware Retry Queue schema;',
    'next implementation',
  ],
]);

updateFile('docs/calendar/README.md', [
  [
    '- [`collection-result-manifest.md`](collection-result-manifest.md) — one-result-per-Job identity, runner, scope, coverage, five-rank accounting, unresolved state, source-error, and artifact-reference contract.\n',
    '- [`collection-result-manifest.md`](collection-result-manifest.md) — one-result-per-Job identity, runner, scope, coverage, five-rank accounting, unresolved state, source-error, and artifact-reference contract.\n- [`review-queue.md`](review-queue.md) — validated-batch operator inventory, five-rank visibility, Manifest projection, and review/promotion state contract.\n',
    'documentation index',
  ],
  [
    `data/fixtures/calendar-collection-result-manifest-invalid-cases-v1.json\ndata/static/timetable-candidate-v1.schema.json`,
    `data/fixtures/calendar-collection-result-manifest-invalid-cases-v1.json\ndata/static/calendar-review-queue.schema.json\ndata/fixtures/calendar-review-queue-v1.json\ndata/fixtures/calendar-review-queue-invalid-cases-v1.json\ndata/static/timetable-candidate-v1.schema.json`,
    'review queue data refs',
  ],
  [
    `scripts/check-calendar-collection-result-manifest.mjs\n.github/workflows/calendar-acquisition-registry.yml`,
    `scripts/check-calendar-collection-result-manifest.mjs\nscripts/timetable/review-queue-validation.mjs\nscripts/check-calendar-review-queue.mjs\n.github/workflows/calendar-acquisition-registry.yml`,
    'review queue script refs',
  ],
  [
    `.github/workflows/calendar-collection-result-manifest.yml\nscripts/check-calendar-coverage-observation-schema.mjs`,
    `.github/workflows/calendar-collection-result-manifest.yml\n.github/workflows/calendar-review-queue.yml\nscripts/check-calendar-coverage-observation-schema.mjs`,
    'review queue workflow ref',
  ],
  [
    `Review Queue schema\nRank-aware Retry Queue schema\nrunner compatibility validators`,
    `Rank-aware Retry Queue schema\nrunner compatibility validators`,
    'planned entry points',
  ],
  [
    `Review Queue\n-> Rank-aware Retry Queue\n-> shared Actions/local job semantics`,
    `Rank-aware Retry Queue\n-> shared Actions/local job semantics`,
    'immediate sequence',
  ],
]);

updateFile('START-HERE.md', [
  [
    'docs/calendar/collection-result-manifest.md\ndocs/calendar/implementation-roadmap.md',
    'docs/calendar/collection-result-manifest.md\ndocs/calendar/review-queue.md\ndocs/calendar/implementation-roadmap.md',
    'required reading',
  ],
  [
    `data/fixtures/calendar-collection-result-manifest-invalid-cases-v1.json\nscripts/timetable/five-rank-classifier.mjs`,
    `data/fixtures/calendar-collection-result-manifest-invalid-cases-v1.json\ndata/static/calendar-review-queue.schema.json\ndata/fixtures/calendar-review-queue-v1.json\ndata/fixtures/calendar-review-queue-invalid-cases-v1.json\nscripts/timetable/five-rank-classifier.mjs`,
    'review queue data refs',
  ],
  [
    `scripts/check-calendar-collection-result-manifest.mjs\n.github/workflows/calendar-five-rank-classifier.yml`,
    `scripts/check-calendar-collection-result-manifest.mjs\nscripts/timetable/review-queue-validation.mjs\nscripts/check-calendar-review-queue.mjs\n.github/workflows/calendar-five-rank-classifier.yml`,
    'review queue scripts',
  ],
  [
    `.github/workflows/calendar-collection-result-manifest.yml\nscripts/check-calendar-contracts.mjs`,
    `.github/workflows/calendar-collection-result-manifest.yml\n.github/workflows/calendar-review-queue.yml\nscripts/check-calendar-contracts.mjs`,
    'review queue workflow',
  ],
  [
    `Review Queue\nRank-aware Retry Queue\nrunner compatibility`,
    `Rank-aware Retry Queue\nrunner compatibility`,
    'planned references',
  ],
]);

console.log('CALENDAR_REVIEW_QUEUE_DOC_STATE_UPDATED');
