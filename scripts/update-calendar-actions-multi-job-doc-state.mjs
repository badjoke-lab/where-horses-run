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
    '## Stage ACP-10 — Actions multi-job runner\n\nStatus: current. Shared runner compatibility begins with Actions execution consuming common Job/Plan/Manifest/Queue semantics.',
    '## Stage ACP-10 — Actions multi-job runner\n\nStatus: complete. The formal manual-dispatch workflow consumes a validated Plan, filters hosted-capable Jobs, checks executor collection-mode support, runs independent Jobs with fail-fast disabled, preserves independent status/batch artifacts, and emits an isolation-preserving campaign summary.\n\nShared runner compatibility continues through ACP-11 local execution.',
    'ACP-10 complete',
  ],
  [
    '## Stage ACP-11 — local multi-job runner\n\nGoal:',
    '## Stage ACP-11 — local multi-job runner\n\nStatus: current.\n\nGoal:',
    'ACP-11 current',
  ],
]);

updateFile('docs/calendar/implementation-roadmap.md', [
  [
    'Runner-neutral compatibility foundation: complete.\nActions multi-job execution: current.',
    'Runner-neutral compatibility foundation: complete.\nActions multi-job execution: complete.\nLocal multi-job execution: current.',
    'shared runner stage state',
  ],
  [
    '### Actions multi-job execution\n\n- consume one Collection Plan;',
    '### Actions multi-job execution — complete\n\n- consume one Collection Plan;',
    'Actions multi-job stage',
  ],
  [
    '### Local multi-job execution\n\n- consume the same Collection Plan;',
    '### Local multi-job execution — current\n\n- consume the same Collection Plan;',
    'Local multi-job stage',
  ],
  [
    `1. connect Actions and local runners to shared job semantics\n2. begin Banei on the shared foundation\n3. expand multi-system execution\n4. add automatic review PR preparation\n5. add due-job planning and scheduled bounded retries\n6. add Operations v2 operator view`,
    `1. implement local multi-job execution and JRA shared local Job path\n2. begin Banei source-specific implementation on the satisfied minimum gate\n3. add review cohort planning\n4. add automatic review PR preparation\n5. add due-job planning and scheduled bounded retries\n6. add Operations v2 operator view`,
    'immediate order',
  ],
]);

updateFile('docs/project-roadmap.md', [
  [
    'The Acquisition Registry, Collection Job, Collection Plan, shared five-rank classifier, Collection Result Manifest, Review Queue, Rank-aware Retry Queue, and runner-neutral compatibility foundation are implemented. Actions multi-job execution remains current shared work.',
    'The Acquisition Registry, Collection Job, Collection Plan, shared five-rank classifier, Collection Result Manifest, Review Queue, Rank-aware Retry Queue, runner-neutral compatibility foundation, and Actions multi-job execution are implemented. Local multi-job execution and JRA shared local Job integration are current shared work.',
    'programme summary',
  ],
  [
    '10. Actions multi-job execution — current;\n11. JRA shared local Job execution — subsequent runner-gate work.',
    '10. Actions multi-job execution — complete;\n11. local multi-job execution and JRA shared local Job integration — current runner-gate work.',
    'foundation sequence',
  ],
]);

updateFile('docs/calendar/machine-readable-contracts.md', [
  [
    'data/fixtures/calendar-runner-compatibility-invalid-cases-v1.json\nscripts/timetable/load-calendar-acquisition-registry.mjs',
    'data/fixtures/calendar-runner-compatibility-invalid-cases-v1.json\nscripts/timetable/actions-multi-job-core.mjs\nscripts/timetable/plan-actions-multi-job.mjs\nscripts/timetable/run-calendar-actions-job.mjs\nscripts/timetable/run-hkjc-bounded-generator-job.mjs\nscripts/timetable/summarize-actions-multi-job.mjs\nscripts/timetable/load-calendar-acquisition-registry.mjs',
    'Actions multi-job implementation files',
  ],
  [
    'scripts/check-calendar-runner-compatibility.mjs\n.github/workflows/calendar-contracts.yml',
    'scripts/check-calendar-runner-compatibility.mjs\nscripts/check-calendar-actions-multi-job.mjs\n.github/workflows/calendar-actions-multi-job.yml\n.github/workflows/calendar-contracts.yml',
    'Actions multi-job checker workflow',
  ],
]);

updateFile('docs/calendar/README.md', [
  [
    '- [`runner-compatibility.md`](runner-compatibility.md) — Job runner-policy resolution, Registry route, executor mapping, NAR Actions/local result neutrality, JRA local normalization, and Banei handoff semantics.\n',
    '- [`runner-compatibility.md`](runner-compatibility.md) — Job runner-policy resolution, Registry route, executor mapping, NAR Actions/local result neutrality, JRA local normalization, and Banei handoff semantics.\n- [`actions-multi-job-runner.md`](actions-multi-job-runner.md) — hosted Job filtering, executor-mode support, isolated matrix execution, per-Job artifacts/status, and campaign summary contract.\n',
    'documentation index',
  ],
  [
    'scripts/check-calendar-runner-compatibility.mjs\n.github/workflows/calendar-acquisition-registry.yml',
    'scripts/check-calendar-runner-compatibility.mjs\nscripts/timetable/actions-multi-job-core.mjs\nscripts/timetable/plan-actions-multi-job.mjs\nscripts/timetable/run-calendar-actions-job.mjs\nscripts/timetable/run-hkjc-bounded-generator-job.mjs\nscripts/timetable/summarize-actions-multi-job.mjs\nscripts/check-calendar-actions-multi-job.mjs\n.github/workflows/calendar-actions-multi-job.yml\n.github/workflows/calendar-acquisition-registry.yml',
    'implemented Actions refs',
  ],
]);

updateFile('START-HERE.md', [
  [
    'docs/calendar/runner-compatibility.md\ndocs/calendar/implementation-roadmap.md',
    'docs/calendar/runner-compatibility.md\ndocs/calendar/actions-multi-job-runner.md\ndocs/calendar/implementation-roadmap.md',
    'required reading',
  ],
  [
    'scripts/check-calendar-runner-compatibility.mjs\n.github/workflows/calendar-five-rank-classifier.yml',
    'scripts/check-calendar-runner-compatibility.mjs\nscripts/timetable/actions-multi-job-core.mjs\nscripts/timetable/plan-actions-multi-job.mjs\nscripts/timetable/run-calendar-actions-job.mjs\nscripts/timetable/run-hkjc-bounded-generator-job.mjs\nscripts/timetable/summarize-actions-multi-job.mjs\nscripts/check-calendar-actions-multi-job.mjs\n.github/workflows/calendar-actions-multi-job.yml\n.github/workflows/calendar-five-rank-classifier.yml',
    'implemented Actions refs',
  ],
]);

console.log('CALENDAR_ACTIONS_MULTI_JOB_DOC_STATE_UPDATED');
