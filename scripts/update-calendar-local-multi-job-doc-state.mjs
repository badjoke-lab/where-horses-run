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
    '## Stage ACP-11 — local multi-job runner\n\nStatus: current.',
    '## Stage ACP-11 — local multi-job runner\n\nStatus: complete. The shared local runner consumes Collection Plans, filters local Jobs, preserves independent batches and status artifacts, runs JRA collection inside an isolated temporary worktree, validates Coverage Observation and Result Manifest artifacts, builds Review Queue snapshots, and preserves bounded Job failure isolation.',
    'ACP-11 complete',
  ],
  [
    '## Stage ACP-12 — review cohort planner\n\nGoal:',
    '## Stage ACP-12 — review cohort planner\n\nStatus: current.\n\nGoal:',
    'ACP-12 current',
  ],
]);

updateFile('docs/calendar/implementation-roadmap.md', [
  [
    '### ACP-9 — shared runner semantics — current',
    '### ACP-9 — shared runner semantics — complete',
    'shared runner semantics complete',
  ],
  [
    'Local multi-job execution: current.',
    'Local multi-job execution: complete.',
    'local multi-job state',
  ],
  [
    '### Local multi-job execution — current',
    '### Local multi-job execution — complete',
    'local stage state',
  ],
  [
    '### Review cohort planner\n',
    '### Review cohort planner — current\n',
    'review cohort state',
  ],
]);

updateFile('docs/project-roadmap.md', [
  [
    'The Acquisition Registry, Collection Job, Collection Plan, shared five-rank classifier, Collection Result Manifest, Review Queue, Rank-aware Retry Queue, runner-neutral compatibility foundation, and Actions multi-job execution are implemented. Local multi-job execution and JRA shared local Job integration are current shared work.',
    'The Acquisition Registry, Collection Job, Collection Plan, shared five-rank classifier, Collection Result Manifest, Review Queue, Rank-aware Retry Queue, runner-neutral compatibility foundation, Actions multi-job execution, and local multi-job execution with JRA shared local Job integration are implemented. Review Cohort Planner is current shared work.',
    'programme summary',
  ],
  [
    'Status: complete source pilot; steady-state runner integration pending.',
    'Status: complete source pilot; shared local runner integration complete.',
    'JRA runner integration state',
  ],
  [
    'JRA must later consume shared Collection Job/Plan semantics so local execution does not require the operator to reconstruct source-specific commands manually.',
    'JRA now consumes shared Collection Plan/Job semantics through the local multi-job runner, which isolates legacy collector writes in a temporary worktree and emits review-boundary batch artifacts.',
    'JRA current acquisition direction',
  ],
  [
    '11. local multi-job execution and JRA shared local Job integration — current runner-gate work.',
    '11. local multi-job execution and JRA shared local Job integration — complete;\n12. Review Cohort Planner — current.',
    'foundation sequence',
  ],
  [
    'Minimum Banei handoff gate status: satisfied.\n\nFull Actions matrix execution, scheduler, and automatic PR generation are not prerequisites for starting Banei.',
    'Minimum Banei handoff gate status: satisfied.\n\nRequired first Runner Gate status: complete.\n\nFull Actions matrix execution, scheduler, and automatic PR generation are not prerequisites for starting Banei.',
    'runner gate state',
  ],
]);

updateFile('docs/calendar/machine-readable-contracts.md', [
  [
    'data/fixtures/calendar-runner-compatibility-invalid-cases-v1.json\nscripts/timetable/actions-multi-job-core.mjs',
    'data/fixtures/calendar-runner-compatibility-invalid-cases-v1.json\ndata/fixtures/calendar-local-multi-job-fixtures-v1.json\nscripts/timetable/actions-multi-job-core.mjs',
    'local fixture reference',
  ],
  [
    'scripts/timetable/summarize-actions-multi-job.mjs\nscripts/timetable/load-calendar-acquisition-registry.mjs',
    'scripts/timetable/summarize-actions-multi-job.mjs\nscripts/timetable/local-multi-job-core.mjs\nscripts/timetable/run-jra-local-review-job.mjs\nscripts/timetable/run-calendar-local-plan.mjs\nscripts/timetable/load-calendar-acquisition-registry.mjs',
    'local implementation references',
  ],
  [
    'scripts/check-calendar-actions-multi-job.mjs\n.github/workflows/calendar-actions-multi-job.yml',
    'scripts/check-calendar-actions-multi-job.mjs\nscripts/check-calendar-local-multi-job.mjs\n.github/workflows/calendar-actions-multi-job.yml\n.github/workflows/calendar-local-multi-job.yml',
    'local checker workflow references',
  ],
  [
    'The Acquisition Registry routes system/source/adapter profiles to runners without changing candidate or promotion semantics. The implemented runner compatibility foundation resolves Job runner policy, Registry route, executor identity, Coverage Observation, and Collection Result Manifest semantics across NAR Actions/local and JRA local paths.',
    'The Acquisition Registry routes system/source/adapter profiles to runners without changing candidate or promotion semantics. The implemented runner compatibility foundation resolves Job runner policy, Registry route, executor identity, Coverage Observation, and Collection Result Manifest semantics across NAR Actions/local and JRA local paths. Formal Actions and local multi-job runners are implemented for the required first Runner Gate set.',
    'runner implementation summary',
  ],
]);

updateFile('docs/calendar/README.md', [
  [
    '- [`actions-multi-job-runner.md`](actions-multi-job-runner.md) — hosted Job filtering, executor-mode support, isolated matrix execution, per-Job artifacts/status, and campaign summary contract.\n',
    '- [`actions-multi-job-runner.md`](actions-multi-job-runner.md) — hosted Job filtering, executor-mode support, isolated matrix execution, per-Job artifacts/status, and campaign summary contract.\n- [`local-multi-job-runner.md`](local-multi-job-runner.md) — local Job filtering, worktree-isolated JRA review-only execution, independent batches and statuses, Review Queue snapshot, and campaign summary contract.\n',
    'documentation index',
  ],
  [
    'data/fixtures/calendar-runner-compatibility-invalid-cases-v1.json\ndata/static/timetable-candidate-v1.schema.json',
    'data/fixtures/calendar-runner-compatibility-invalid-cases-v1.json\ndata/fixtures/calendar-local-multi-job-fixtures-v1.json\ndata/static/timetable-candidate-v1.schema.json',
    'local fixture entry point',
  ],
  [
    'scripts/timetable/summarize-actions-multi-job.mjs\nscripts/check-calendar-actions-multi-job.mjs\n.github/workflows/calendar-actions-multi-job.yml',
    'scripts/timetable/summarize-actions-multi-job.mjs\nscripts/check-calendar-actions-multi-job.mjs\nscripts/timetable/local-multi-job-core.mjs\nscripts/timetable/run-jra-local-review-job.mjs\nscripts/timetable/run-calendar-local-plan.mjs\nscripts/check-calendar-local-multi-job.mjs\n.github/workflows/calendar-actions-multi-job.yml\n.github/workflows/calendar-local-multi-job.yml',
    'local implementation entry points',
  ],
  [
    'Actions multi-job execution (current)\n+ Banei source-specific implementation may begin on the satisfied minimum handoff gate',
    'Review Cohort Planner (current)\n+ Banei source-specific implementation may proceed on the satisfied minimum handoff gate',
    'immediate sequence',
  ],
]);

updateFile('START-HERE.md', [
  [
    'docs/calendar/actions-multi-job-runner.md\ndocs/calendar/implementation-roadmap.md',
    'docs/calendar/actions-multi-job-runner.md\ndocs/calendar/local-multi-job-runner.md\ndocs/calendar/implementation-roadmap.md',
    'required reading',
  ],
  [
    'data/fixtures/calendar-runner-compatibility-invalid-cases-v1.json\nscripts/timetable/five-rank-classifier.mjs',
    'data/fixtures/calendar-runner-compatibility-invalid-cases-v1.json\ndata/fixtures/calendar-local-multi-job-fixtures-v1.json\nscripts/timetable/five-rank-classifier.mjs',
    'local fixture reference',
  ],
  [
    'scripts/timetable/summarize-actions-multi-job.mjs\nscripts/check-calendar-actions-multi-job.mjs\n.github/workflows/calendar-actions-multi-job.yml',
    'scripts/timetable/summarize-actions-multi-job.mjs\nscripts/check-calendar-actions-multi-job.mjs\nscripts/timetable/local-multi-job-core.mjs\nscripts/timetable/run-jra-local-review-job.mjs\nscripts/timetable/run-calendar-local-plan.mjs\nscripts/check-calendar-local-multi-job.mjs\n.github/workflows/calendar-actions-multi-job.yml\n.github/workflows/calendar-local-multi-job.yml',
    'local implementation references',
  ],
  [
    'Do not manage future systems by operator memory. The Acquisition Registry is the routing source of truth, and the runner compatibility foundation validates that supported runner paths converge on common Coverage Observation and Result Manifest semantics.',
    'Do not manage future systems by operator memory. The Acquisition Registry is the routing source of truth, and the runner compatibility foundation validates that supported runner paths converge on common Coverage Observation and Result Manifest semantics. The required first Runner Gate is complete across NAR Actions semantics, NAR local fallback semantics, and the JRA shared local Job path.',
    'runner model state',
  ],
]);

updateFile('docs/calendar/local-multi-job-runner.md', [
  [
    'One bounded Job failure does not stop the next independent local Job.',
    'One bounded Job failure does not stop the next independent local Job. The invariant is: one bounded Job failure does not stop the next independent local Job.',
    'failure isolation invariant marker',
  ],
]);

console.log('CALENDAR_LOCAL_MULTI_JOB_DOC_STATE_UPDATED');
