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
    '## Stage ACP-7 — Collection Result Manifest\n\nStatus: current.',
    '## Stage ACP-7 — Collection Result Manifest\n\nStatus: complete. The schema, validation core, valid and invalid fixtures, Job/Registry/Coverage cross-checks, contract documentation, and dedicated CI are implemented.',
    'ACP-7 status',
  ],
  [
    '## Stage ACP-8 — Review Queue\n\nGoal:',
    '## Stage ACP-8 — Review Queue\n\nStatus: current.\n\nGoal:',
    'ACP-8 current marker',
  ],
]);

updateFile('docs/calendar/implementation-roadmap.md', [
  [
    '### ACP-6 — Collection Result Manifest — current',
    '### ACP-6 — Collection Result Manifest — complete',
    'Result Manifest completion marker',
  ],
  [
    '### ACP-7 — Review Queue\n',
    '### ACP-7 — Review Queue — current\n',
    'Review Queue current marker',
  ],
  [
    `1. add Collection Job schema\n2. add Collection Plan schema\n3. add five-rank classifier contract tests\n4. add Result Manifest\n5. add Review Queue\n6. add Rank-aware Retry Queue\n7. connect Actions and local runners to shared job semantics\n8. begin Banei on the shared foundation\n9. expand multi-system execution\n10. add automatic review PR preparation\n11. add due-job planning and scheduled bounded retries\n12. add Operations v2 operator view`,
    `1. add Review Queue\n2. add Rank-aware Retry Queue\n3. connect Actions and local runners to shared job semantics\n4. begin Banei on the shared foundation\n5. expand multi-system execution\n6. add automatic review PR preparation\n7. add due-job planning and scheduled bounded retries\n8. add Operations v2 operator view`,
    'immediate execution order',
  ],
]);

updateFile('docs/project-roadmap.md', [
  [
    'The Acquisition Control Plane machine-readable Registry, Job, Plan, Result Manifest, Review Queue, and Rank-aware Retry Queue schemas are planned next.',
    'The Acquisition Registry, Collection Job, Collection Plan, shared five-rank classifier, and Collection Result Manifest are implemented. Review Queue and Rank-aware Retry Queue foundations are current next work.',
    'machine-readable state summary',
  ],
  [
    '6. Collection Result Manifest — current;\n7. Review Queue foundation;',
    '6. Collection Result Manifest — complete;\n7. Review Queue foundation — current;',
    'control-plane sequence state',
  ],
]);

updateFile('docs/calendar/machine-readable-contracts.md', [
  [
    `data/static/calendar-five-rank-classifier-contract-v1.json\ndata/fixtures/calendar-five-rank-classifier-fixtures-v1.json\nscripts/timetable/load-calendar-acquisition-registry.mjs`,
    `data/static/calendar-five-rank-classifier-contract-v1.json\ndata/fixtures/calendar-five-rank-classifier-fixtures-v1.json\ndata/static/calendar-collection-result-manifest.schema.json\ndata/fixtures/calendar-collection-result-manifests-v1.json\ndata/fixtures/calendar-collection-result-manifest-invalid-cases-v1.json\nscripts/timetable/load-calendar-acquisition-registry.mjs`,
    'implemented manifest data artifacts',
  ],
  [
    `scripts/timetable/five-rank-classifier.mjs\nscripts/timetable/coverage-observation-validation.mjs`,
    `scripts/timetable/five-rank-classifier.mjs\nscripts/timetable/collection-result-manifest-validation.mjs\nscripts/timetable/coverage-observation-validation.mjs`,
    'implemented manifest validation core',
  ],
  [
    `scripts/check-calendar-five-rank-classifier.mjs\n.github/workflows/calendar-contracts.yml`,
    `scripts/check-calendar-five-rank-classifier.mjs\nscripts/check-calendar-collection-result-manifest.mjs\n.github/workflows/calendar-contracts.yml`,
    'implemented manifest validator',
  ],
  [
    `.github/workflows/calendar-five-rank-classifier.yml\n.github/workflows/calendar-validation-responsibilities.yml`,
    `.github/workflows/calendar-five-rank-classifier.yml\n.github/workflows/calendar-collection-result-manifest.yml\n.github/workflows/calendar-validation-responsibilities.yml`,
    'implemented manifest workflow',
  ],
  [
    `Collection Result Manifest schema\nReview Queue schema\nRank-aware Retry Queue schema`,
    `Review Queue schema\nRank-aware Retry Queue schema`,
    'planned artifact list',
  ],
  [
    '## Planned Collection Result Manifest',
    '## Implemented Collection Result Manifest',
    'manifest section state',
  ],
  [
    'Every job should have a compact result summary containing:',
    'Every Collection Job result has a compact result summary containing:',
    'manifest section wording',
  ],
  [
    '6. implement Collection Result Manifest, Review Queue, and Rank-aware Retry Queue schemas;',
    '6. implement Review Queue and Rank-aware Retry Queue schemas;',
    'next implementation list',
  ],
]);

updateFile('docs/calendar/README.md', [
  [
    '- [`acquisition-control-plane-implementation-plan.md`](acquisition-control-plane-implementation-plan.md) — staged implementation schedule from current NAR completion through shared runners, Banei handoff, multi-system execution, review PR preparation, and scheduling.\n',
    '- [`acquisition-control-plane-implementation-plan.md`](acquisition-control-plane-implementation-plan.md) — staged implementation schedule from current NAR completion through shared runners, Banei handoff, multi-system execution, review PR preparation, and scheduling.\n- [`collection-result-manifest.md`](collection-result-manifest.md) — one-result-per-Job identity, runner, scope, coverage, five-rank accounting, unresolved state, source-error, and artifact-reference contract.\n',
    'documentation index entry',
  ],
  [
    `data/static/calendar-five-rank-classifier-contract-v1.json\ndata/fixtures/calendar-five-rank-classifier-fixtures-v1.json\ndata/static/timetable-candidate-v1.schema.json`,
    `data/static/calendar-five-rank-classifier-contract-v1.json\ndata/fixtures/calendar-five-rank-classifier-fixtures-v1.json\ndata/static/calendar-collection-result-manifest.schema.json\ndata/fixtures/calendar-collection-result-manifests-v1.json\ndata/fixtures/calendar-collection-result-manifest-invalid-cases-v1.json\ndata/static/timetable-candidate-v1.schema.json`,
    'implemented manifest data references',
  ],
  [
    `scripts/timetable/five-rank-classifier.mjs\nscripts/check-calendar-five-rank-classifier.mjs\n.github/workflows/calendar-acquisition-registry.yml`,
    `scripts/timetable/five-rank-classifier.mjs\nscripts/check-calendar-five-rank-classifier.mjs\nscripts/timetable/collection-result-manifest-validation.mjs\nscripts/check-calendar-collection-result-manifest.mjs\n.github/workflows/calendar-acquisition-registry.yml`,
    'implemented manifest script references',
  ],
  [
    `.github/workflows/calendar-five-rank-classifier.yml\nscripts/check-calendar-coverage-observation-schema.mjs`,
    `.github/workflows/calendar-five-rank-classifier.yml\n.github/workflows/calendar-collection-result-manifest.yml\nscripts/check-calendar-coverage-observation-schema.mjs`,
    'implemented manifest workflow reference',
  ],
  [
    `Collection Result Manifest schema\nReview Queue schema\nRank-aware Retry Queue schema`,
    `Review Queue schema\nRank-aware Retry Queue schema`,
    'planned entry points',
  ],
  [
    `Result Manifest\n-> Review Queue / Rank-aware Retry Queue\n-> shared Actions/local job semantics`,
    `Review Queue\n-> Rank-aware Retry Queue\n-> shared Actions/local job semantics`,
    'immediate sequence',
  ],
]);

updateFile('START-HERE.md', [
  [
    'docs/calendar/acquisition-control-plane-implementation-plan.md\ndocs/calendar/implementation-roadmap.md',
    'docs/calendar/acquisition-control-plane-implementation-plan.md\ndocs/calendar/collection-result-manifest.md\ndocs/calendar/implementation-roadmap.md',
    'required reading',
  ],
  [
    `data/static/calendar-five-rank-classifier-contract-v1.json\ndata/fixtures/calendar-five-rank-classifier-fixtures-v1.json\nscripts/timetable/five-rank-classifier.mjs`,
    `data/static/calendar-five-rank-classifier-contract-v1.json\ndata/fixtures/calendar-five-rank-classifier-fixtures-v1.json\ndata/static/calendar-collection-result-manifest.schema.json\ndata/fixtures/calendar-collection-result-manifests-v1.json\ndata/fixtures/calendar-collection-result-manifest-invalid-cases-v1.json\nscripts/timetable/five-rank-classifier.mjs`,
    'manifest data references',
  ],
  [
    `scripts/check-calendar-five-rank-classifier.mjs\n.github/workflows/calendar-five-rank-classifier.yml`,
    `scripts/check-calendar-five-rank-classifier.mjs\nscripts/timetable/collection-result-manifest-validation.mjs\nscripts/check-calendar-collection-result-manifest.mjs\n.github/workflows/calendar-five-rank-classifier.yml\n.github/workflows/calendar-collection-result-manifest.yml`,
    'manifest implementation references',
  ],
  [
    `Collection Result Manifest\nReview Queue\nRank-aware Retry Queue`,
    `Review Queue\nRank-aware Retry Queue`,
    'planned control-plane references',
  ],
]);

console.log('CALENDAR_RESULT_MANIFEST_DOC_STATE_UPDATED');
