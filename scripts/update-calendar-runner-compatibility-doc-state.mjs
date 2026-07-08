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
    'Status: current. Shared runner compatibility begins with Actions execution consuming common Job/Plan/Manifest/Queue semantics.\n\nGoal:',
    'Status: current. Shared runner compatibility begins with Actions execution consuming common Job/Plan/Manifest/Queue semantics.\n\nRunner-neutral compatibility foundation: complete. NAR Actions-primary/local-fallback and JRA local result adapters now converge on common Coverage Observation and Collection Result Manifest semantics. This satisfies the runner-neutral batch/result semantics part of the Banei handoff gate without completing the full Actions multi-job stage or full Runner Gate.\n\nGoal:',
    'runner compatibility foundation state',
  ],
]);

updateFile('docs/calendar/implementation-roadmap.md', [
  [
    '### ACP-9 — shared runner semantics — current\n\n- Actions jobs consume Collection Jobs;',
    '### ACP-9 — shared runner semantics — current\n\nRunner-neutral compatibility foundation: complete.\nActions multi-job execution: current.\n\n- Actions jobs consume Collection Jobs;',
    'shared runner state',
  ],
  [
    'Full Actions matrix execution, full scheduler, and automatic PR generation are not required before Banei starts.',
    'Minimum Banei handoff gate status: satisfied.\n\nFull Actions matrix execution, full scheduler, and automatic PR generation are not required before Banei starts.',
    'Banei gate state',
  ],
]);

updateFile('docs/project-roadmap.md', [
  [
    'The Acquisition Registry, Collection Job, Collection Plan, shared five-rank classifier, Collection Result Manifest, Review Queue, and Rank-aware Retry Queue are implemented. Shared Actions/local runner compatibility is current next work.',
    'The Acquisition Registry, Collection Job, Collection Plan, shared five-rank classifier, Collection Result Manifest, Review Queue, Rank-aware Retry Queue, and runner-neutral compatibility foundation are implemented. Actions multi-job execution remains current shared work.',
    'programme summary',
  ],
  [
    '9. Actions and local runner compatibility with common Job/Plan/Manifest/Queue semantics — current.',
    '9. runner-neutral compatibility foundation across Job/Registry/Coverage/Manifest semantics — complete;\n10. Actions multi-job execution — current;\n11. JRA shared local Job execution — subsequent runner-gate work.',
    'foundation sequence',
  ],
  [
    'Full Actions matrix execution, scheduler, and automatic PR generation are not prerequisites for starting Banei.',
    'Minimum Banei handoff gate status: satisfied.\n\nFull Actions matrix execution, scheduler, and automatic PR generation are not prerequisites for starting Banei.',
    'Banei minimum gate',
  ],
]);

updateFile('docs/calendar/machine-readable-contracts.md', [
  [
    'data/fixtures/calendar-rank-aware-retry-queue-invalid-cases-v1.json\nscripts/timetable/load-calendar-acquisition-registry.mjs',
    'data/fixtures/calendar-rank-aware-retry-queue-invalid-cases-v1.json\ndata/static/calendar-runner-compatibility-contract-v1.json\ndata/fixtures/calendar-runner-compatibility-fixtures-v1.json\ndata/fixtures/calendar-runner-compatibility-invalid-cases-v1.json\nscripts/timetable/load-calendar-acquisition-registry.mjs',
    'compatibility data artifacts',
  ],
  [
    'scripts/timetable/rank-aware-retry-queue-validation.mjs\nscripts/timetable/coverage-observation-validation.mjs',
    'scripts/timetable/rank-aware-retry-queue-validation.mjs\nscripts/timetable/runner-compatibility.mjs\nscripts/timetable/coverage-observation-validation.mjs',
    'compatibility core',
  ],
  [
    'scripts/check-calendar-rank-aware-retry-queue.mjs\n.github/workflows/calendar-contracts.yml',
    'scripts/check-calendar-rank-aware-retry-queue.mjs\nscripts/check-calendar-runner-compatibility.mjs\n.github/workflows/calendar-contracts.yml',
    'compatibility validator',
  ],
  [
    '.github/workflows/calendar-rank-aware-retry-queue.yml\n.github/workflows/calendar-validation-responsibilities.yml',
    '.github/workflows/calendar-rank-aware-retry-queue.yml\n.github/workflows/calendar-runner-compatibility.yml\n.github/workflows/calendar-validation-responsibilities.yml',
    'compatibility workflow',
  ],
  [
    'runner compatibility validators\ncontrol-plane release gate',
    'control-plane release gate',
    'planned artifacts',
  ],
  [
    'The Acquisition Registry routes system/source/adapter profiles to runners without changing candidate or promotion semantics.',
    'The Acquisition Registry routes system/source/adapter profiles to runners without changing candidate or promotion semantics. The implemented runner compatibility foundation resolves Job runner policy, Registry route, executor identity, Coverage Observation, and Collection Result Manifest semantics across NAR Actions/local and JRA local paths.',
    'compatibility implementation summary',
  ],
]);

updateFile('docs/calendar/README.md', [
  [
    '- [`rank-aware-retry-queue.md`](rank-aware-retry-queue.md) — rank-gap, missing-field, retry reason/scope, Registry routing, backoff, and NAR 71-target projection contract.\n',
    '- [`rank-aware-retry-queue.md`](rank-aware-retry-queue.md) — rank-gap, missing-field, retry reason/scope, Registry routing, backoff, and NAR 71-target projection contract.\n- [`runner-compatibility.md`](runner-compatibility.md) — Job runner-policy resolution, Registry route, executor mapping, NAR Actions/local result neutrality, JRA local normalization, and Banei handoff semantics.\n',
    'documentation index',
  ],
  [
    'data/fixtures/calendar-rank-aware-retry-queue-invalid-cases-v1.json\ndata/static/timetable-candidate-v1.schema.json',
    'data/fixtures/calendar-rank-aware-retry-queue-invalid-cases-v1.json\ndata/static/calendar-runner-compatibility-contract-v1.json\ndata/fixtures/calendar-runner-compatibility-fixtures-v1.json\ndata/fixtures/calendar-runner-compatibility-invalid-cases-v1.json\ndata/static/timetable-candidate-v1.schema.json',
    'compatibility data refs',
  ],
  [
    'scripts/check-calendar-rank-aware-retry-queue.mjs\n.github/workflows/calendar-acquisition-registry.yml',
    'scripts/check-calendar-rank-aware-retry-queue.mjs\nscripts/timetable/runner-compatibility.mjs\nscripts/check-calendar-runner-compatibility.mjs\n.github/workflows/calendar-acquisition-registry.yml',
    'compatibility scripts',
  ],
  [
    '.github/workflows/calendar-rank-aware-retry-queue.yml\nscripts/check-calendar-coverage-observation-schema.mjs',
    '.github/workflows/calendar-rank-aware-retry-queue.yml\n.github/workflows/calendar-runner-compatibility.yml\nscripts/check-calendar-coverage-observation-schema.mjs',
    'compatibility workflow',
  ],
  [
    'runner compatibility validators\ncontrol-plane release gate',
    'control-plane release gate',
    'planned refs',
  ],
  [
    'shared Actions/local job semantics\n-> Banei on the shared foundation',
    'Actions multi-job execution (current)\n+ Banei source-specific implementation may begin on the satisfied minimum handoff gate',
    'immediate sequence',
  ],
]);

updateFile('START-HERE.md', [
  [
    'docs/calendar/rank-aware-retry-queue.md\ndocs/calendar/implementation-roadmap.md',
    'docs/calendar/rank-aware-retry-queue.md\ndocs/calendar/runner-compatibility.md\ndocs/calendar/implementation-roadmap.md',
    'required reading',
  ],
  [
    'data/fixtures/calendar-rank-aware-retry-queue-invalid-cases-v1.json\nscripts/timetable/five-rank-classifier.mjs',
    'data/fixtures/calendar-rank-aware-retry-queue-invalid-cases-v1.json\ndata/static/calendar-runner-compatibility-contract-v1.json\ndata/fixtures/calendar-runner-compatibility-fixtures-v1.json\ndata/fixtures/calendar-runner-compatibility-invalid-cases-v1.json\nscripts/timetable/five-rank-classifier.mjs',
    'compatibility data refs',
  ],
  [
    'scripts/check-calendar-rank-aware-retry-queue.mjs\n.github/workflows/calendar-five-rank-classifier.yml',
    'scripts/check-calendar-rank-aware-retry-queue.mjs\nscripts/timetable/runner-compatibility.mjs\nscripts/check-calendar-runner-compatibility.mjs\n.github/workflows/calendar-five-rank-classifier.yml',
    'compatibility scripts',
  ],
  [
    '.github/workflows/calendar-rank-aware-retry-queue.yml\nscripts/check-calendar-contracts.mjs',
    '.github/workflows/calendar-rank-aware-retry-queue.yml\n.github/workflows/calendar-runner-compatibility.yml\nscripts/check-calendar-contracts.mjs',
    'compatibility workflow',
  ],
  [
    'runner compatibility\ncontrol-plane release gate',
    'control-plane release gate',
    'planned refs',
  ],
  [
    'Do not manage future systems by operator memory. The Acquisition Registry will become the routing source of truth.',
    'Do not manage future systems by operator memory. The Acquisition Registry is the routing source of truth, and the runner compatibility foundation validates that supported runner paths converge on common Coverage Observation and Result Manifest semantics.',
    'runner model wording',
  ],
]);

console.log('CALENDAR_RUNNER_COMPATIBILITY_DOC_STATE_UPDATED');
