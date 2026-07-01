import { readFileSync, writeFileSync } from 'node:fs';

function replace(file, pairs) {
  let text = readFileSync(file, 'utf8');
  for (const [from, to] of pairs) {
    if (!text.includes(from)) throw new Error(`${file} missing marker: ${from.slice(0, 120)}`);
    text = text.replace(from, to);
  }
  writeFileSync(file, text);
}

replace('START-HERE.md', [
  [
    '12. [`docs/calendar/dynamic-dates-release-gate.md`](docs/calendar/dynamic-dates-release-gate.md)\n',
    '12. [`docs/calendar/dynamic-dates-release-gate.md`](docs/calendar/dynamic-dates-release-gate.md)\n13. [`docs/calendar/operations-v1-release-gate.md`](docs/calendar/operations-v1-release-gate.md)\n'
  ],
  [
    'data/audits/calendar-dynamic-dates-release-gate.json\nscripts/check-calendar-contracts.mjs',
    'data/audits/calendar-dynamic-dates-release-gate.json\ndata/audits/calendar-operations-v1-release-gate.json\ndata/static/calendar-operations-control.json\ndata/static/calendar-operations-seasonal-policy.json\ndata/generated/timetable/operations-status.json\ndata/generated/timetable/operations-review-package.json\nscripts/check-calendar-contracts.mjs'
  ],
  [
    'scripts/check-calendar-dynamic-dates-release-gate.mjs\n```',
    'scripts/check-calendar-dynamic-dates-release-gate.mjs\nscripts/check-calendar-operations-v1-release-gate.mjs\n```'
  ],
  ['Previous completed Work ID: `WHR-CAL-DYNAMIC-DATES`', 'Previous completed Work ID: `WHR-CAL-OPS-V1`'],
  ['```text\nWHR-CAL-OPS-V1\n```\n\nNext Work ID:', '```text\nWHR-CAL-JAPAN-JRA\n```\n\nNext Work ID:'],
  ['```text\nWHR-CAL-JAPAN-JRA\n```\n\nThe 98-country', '```text\nWHR-CAL-JAPAN-NAR\n```\n\nThe 98-country'],
  [
    'The 98-country programme, Calendar baseline reconciliation, Pipeline v1, and Dynamic Dates are complete. The active task is Operations v1; scheduled source operation remains paused until its controls and runbooks are complete.',
    'The 98-country programme, Calendar baseline reconciliation, Pipeline v1, Dynamic Dates, and Operations v1 are complete. The active task is the JRA source pilot; scheduling and unattended publication remain disabled.'
  ]
]);

replace('docs/project-roadmap.md', [
  ['Current Work ID: `WHR-CAL-OPS-V1`  \nNext Work ID: `WHR-CAL-JAPAN-JRA`', 'Current Work ID: `WHR-CAL-JAPAN-JRA`  \nNext Work ID: `WHR-CAL-JAPAN-NAR`'],
  [
    'The existing Calendar baseline, Pipeline v1 foundation, and Dynamic Dates are complete. The current product phase is Operations v1: source-health and stale reports, reviewable update preparation, pause and rollback controls, seasonal rollover, and operator runbooks without unattended publication.',
    'The existing Calendar baseline, Pipeline v1 foundation, Dynamic Dates, and Operations v1 are complete. The current product phase is the JRA source pilot: obtain a fresh reviewed official fixture, generate bounded candidates, retain human promotion, and prove fallback and rollback without unattended publication.'
  ],
  [
    'Status: Pipeline v1 and Dynamic Dates complete; Operations v1 current  \nCompleted Work ID: `WHR-CAL-PIPELINE-V1`  \nCompleted Work ID: `WHR-CAL-DYNAMIC-DATES`  \nCurrent Work ID: `WHR-CAL-OPS-V1`  \nNext Work ID: `WHR-CAL-JAPAN-JRA`',
    'Status: Pipeline v1, Dynamic Dates, and Operations v1 complete; JRA pilot current  \nCompleted Work ID: `WHR-CAL-PIPELINE-V1`  \nCompleted Work ID: `WHR-CAL-DYNAMIC-DATES`  \nCompleted Work ID: `WHR-CAL-OPS-V1`  \nCurrent Work ID: `WHR-CAL-JAPAN-JRA`  \nNext Work ID: `WHR-CAL-JAPAN-NAR`'
  ],
  [
    'Dynamic Dates replaced fixed preview dates with explicit date/timezone rules, Today/Tomorrow selection, a rolling 30-day window, and visible current/stale/empty states. Operations v1 now adds controlled maintenance and recovery ownership while scheduling remains paused.',
    'Dynamic Dates replaced fixed preview dates with explicit date/timezone rules. Operations v1 delivered source-health status, review packages, pause/rollback controls, seasonal rollover, and source-breakage escalation. The JRA pilot now starts from a freshness-blocked reference candidate and requires fresh reviewed evidence.'
  ]
]);

replace('docs/calendar/implementation-roadmap.md', [
  [
    '### Operations v1\n\nStatus: current  \nCurrent Work ID: `WHR-CAL-OPS-V1`  \nNext Work ID: `WHR-CAL-JAPAN-JRA`\n\nOperations include source-health and stale reports, reviewable generated-update preparation, pause/rollback controls, seasonal rollover, and source-breakage procedures. Do not use routine direct self-publication.',
    '### Operations v1\n\nOperations v1 status: complete  \nCompleted Work ID: `WHR-CAL-OPS-V1`\n\nOperations now include deterministic source-health status, review-package preparation, pause/rollback controls, seasonal rollover, source-breakage escalation, and grouped validation. Scheduled and unattended publication remain disabled.\n\n### JRA pilot — current\n\nCurrent Work ID: `WHR-CAL-JAPAN-JRA`  \nNext Work ID: `WHR-CAL-JAPAN-NAR`\n\nThe pilot must obtain a fresh reviewed JRA source fixture before candidate approval or promotion.'
  ],
  [
    '## Stage 6 — pilot activation\n\n```text',
    '## Stage 6 — pilot activation\n\nStatus: current — JRA pilot\n\n```text'
  ]
]);

replace('docs/calendar/current-baseline-audit.md', [
  ['Current Work ID: `WHR-CAL-OPS-V1`', 'Current Work ID: `WHR-CAL-JAPAN-JRA`'],
  [
    'Pipeline v1 and Dynamic Dates now provide the reviewed data flow, deterministic public projection, runtime boundary, explicit date/timezone rules, rolling windows, and visible stale states. The current phase establishes Operations v1 before the JRA pilot.',
    'Pipeline v1, Dynamic Dates, and Operations v1 now provide the reviewed data flow, deterministic projection, runtime/date boundaries, source-health status, review packages, and recovery controls. The current phase is the JRA pilot.'
  ]
]);

replace('docs/calendar/operations-v1-contract.md', [
  ['Status: active foundation', 'Status: complete'],
  [
    '## Remaining Operations v1 work\n\n- stale and source-health runbook;\n- seasonal rollover;\n- source-breakage escalation;\n- grouped Operations v1 release gate.\n\nThe first live pilot remains `WHR-CAL-JAPAN-JRA` after Operations v1 completion.',
    '## Completion\n\nOperations v1 is closed by `docs/calendar/operations-v1-release-gate.md` and `data/audits/calendar-operations-v1-release-gate.json`.\n\nThe current Work ID is `WHR-CAL-JAPAN-JRA`; the next pilot is `WHR-CAL-JAPAN-NAR`.'
  ]
]);

replace('docs/calendar/README.md', [
  [
    '- [`operations-v1-contract.md`](operations-v1-contract.md) — review-only operator status, thresholds, and no-write boundary.\n',
    '- [`operations-v1-contract.md`](operations-v1-contract.md) — review-only operator status, thresholds, and no-write boundary.\n- [`operations-v1-release-gate.md`](operations-v1-release-gate.md) — Operations v1 completion and JRA pilot boundary.\n'
  ],
  [
    '- [`../runbooks/calendar-operations-pause-rollback.md`](../runbooks/calendar-operations-pause-rollback.md) — canonical pause, rollback, and source-breakage controls.\n',
    '- [`../runbooks/calendar-operations-pause-rollback.md`](../runbooks/calendar-operations-pause-rollback.md) — canonical pause and rollback controls.\n- [`../runbooks/calendar-seasonal-rollover.md`](../runbooks/calendar-seasonal-rollover.md) — seasonal fixture review and rollover.\n- [`../runbooks/calendar-source-breakage-escalation.md`](../runbooks/calendar-source-breakage-escalation.md) — warning, degraded, and blocked source incidents.\n'
  ],
  [
    'data/audits/calendar-dynamic-dates-release-gate.json\ndata/static/calendar-operations-control.json',
    'data/audits/calendar-dynamic-dates-release-gate.json\ndata/audits/calendar-operations-v1-release-gate.json\ndata/static/calendar-operations-control.json\ndata/static/calendar-operations-seasonal-policy.json'
  ],
  [
    'scripts/check-calendar-operations-review-package.mjs\n```',
    'scripts/check-calendar-operations-review-package.mjs\nscripts/check-calendar-operations-v1-release-gate.mjs\n```'
  ]
]);

replace('docs/governance/document-authority.md', [
  [
    '- `docs/calendar/dynamic-dates-release-gate.md`\n',
    '- `docs/calendar/dynamic-dates-release-gate.md`\n- `docs/calendar/operations-v1-contract.md`\n- `docs/calendar/operations-v1-release-gate.md`\n- `docs/runbooks/calendar-operations-status-review.md`\n- `docs/runbooks/calendar-operations-pause-rollback.md`\n- `docs/runbooks/calendar-seasonal-rollover.md`\n- `docs/runbooks/calendar-source-breakage-escalation.md`\n'
  ],
  [
    '- `data/audits/calendar-dynamic-dates-release-gate.json`\n',
    '- `data/audits/calendar-dynamic-dates-release-gate.json`\n- `data/audits/calendar-operations-v1-release-gate.json`\n- `data/static/calendar-operations-control.json`\n- `data/static/calendar-operations-seasonal-policy.json`\n- `data/generated/timetable/operations-status.json`\n- `data/generated/timetable/operations-review-package.json`\n'
  ],
  [
    '- `scripts/check-calendar-dynamic-dates-release-gate.mjs`\n',
    '- `scripts/check-calendar-dynamic-dates-release-gate.mjs`\n- `scripts/check-calendar-operations-status.mjs`\n- `scripts/check-calendar-operations-review-package.mjs`\n- `scripts/check-calendar-operations-v1-release-gate.mjs`\n'
  ]
]);

replace('scripts/check-calendar-pipeline-v1-release-gate.mjs', [
  ["['START-HERE.md', startHere, ['Previous completed Work ID: `WHR-CAL-DYNAMIC-DATES`', 'WHR-CAL-OPS-V1', 'WHR-CAL-JAPAN-JRA']]", "['START-HERE.md', startHere, ['Previous completed Work ID: `WHR-CAL-OPS-V1`', 'WHR-CAL-JAPAN-JRA', 'WHR-CAL-JAPAN-NAR']]"],
  ["['docs/project-roadmap.md', projectRoadmap, ['Current Work ID: `WHR-CAL-OPS-V1`', 'Completed Work ID: `WHR-CAL-PIPELINE-V1`', 'Completed Work ID: `WHR-CAL-DYNAMIC-DATES`']]", "['docs/project-roadmap.md', projectRoadmap, ['Current Work ID: `WHR-CAL-JAPAN-JRA`', 'Completed Work ID: `WHR-CAL-OPS-V1`']]"],
  ["['docs/calendar/implementation-roadmap.md', implementationRoadmap, ['Pipeline v1 status: complete', 'Dynamic Dates status: complete', 'Current Work ID: `WHR-CAL-OPS-V1`']]", "['docs/calendar/implementation-roadmap.md', implementationRoadmap, ['Pipeline v1 status: complete', 'Dynamic Dates status: complete', 'Operations v1 status: complete', 'Current Work ID: `WHR-CAL-JAPAN-JRA`']]"],
  ["console.log('CURRENT_WORK_ID: WHR-CAL-OPS-V1');\nconsole.log('NEXT_WORK_ID: WHR-CAL-JAPAN-JRA');", "console.log('CURRENT_WORK_ID: WHR-CAL-JAPAN-JRA');\nconsole.log('NEXT_WORK_ID: WHR-CAL-JAPAN-NAR');"]
]);

replace('scripts/check-calendar-dynamic-dates-release-gate.mjs', [
  ["['START-HERE.md', startHere, ['Previous completed Work ID: `WHR-CAL-DYNAMIC-DATES`', 'WHR-CAL-OPS-V1', 'WHR-CAL-JAPAN-JRA']]", "['START-HERE.md', startHere, ['Previous completed Work ID: `WHR-CAL-OPS-V1`', 'WHR-CAL-JAPAN-JRA', 'WHR-CAL-JAPAN-NAR']]"],
  ["['docs/project-roadmap.md', roadmap, ['Completed Work ID: `WHR-CAL-DYNAMIC-DATES`', 'Current Work ID: `WHR-CAL-OPS-V1`', 'Next Work ID: `WHR-CAL-JAPAN-JRA`']]", "['docs/project-roadmap.md', roadmap, ['Completed Work ID: `WHR-CAL-OPS-V1`', 'Current Work ID: `WHR-CAL-JAPAN-JRA`', 'Next Work ID: `WHR-CAL-JAPAN-NAR`']]"],
  ["['docs/calendar/implementation-roadmap.md', implementationRoadmap, ['Dynamic Dates status: complete', 'Current Work ID: `WHR-CAL-OPS-V1`', 'Next Work ID: `WHR-CAL-JAPAN-JRA`']]", "['docs/calendar/implementation-roadmap.md', implementationRoadmap, ['Dynamic Dates status: complete', 'Operations v1 status: complete', 'Current Work ID: `WHR-CAL-JAPAN-JRA`']]"],
  ["console.log('CURRENT_WORK_ID: WHR-CAL-OPS-V1');\nconsole.log('NEXT_WORK_ID: WHR-CAL-JAPAN-JRA');", "console.log('CURRENT_WORK_ID: WHR-CAL-JAPAN-JRA');\nconsole.log('NEXT_WORK_ID: WHR-CAL-JAPAN-NAR');"]
]);

replace('scripts/check-calendar-baseline-reconciliation.mjs', [
  ["'docs/calendar/implementation-roadmap.md':['Status: complete','Pipeline v1 status: complete','Dynamic Dates status: complete','Current Work ID: `WHR-CAL-OPS-V1`']", "'docs/calendar/implementation-roadmap.md':['Status: complete','Pipeline v1 status: complete','Dynamic Dates status: complete','Operations v1 status: complete','Current Work ID: `WHR-CAL-JAPAN-JRA`']"],
  ["'docs/project-roadmap.md':['Current Work ID: `WHR-CAL-OPS-V1`','Completed Work ID: `WHR-CAL-DYNAMIC-DATES`']", "'docs/project-roadmap.md':['Current Work ID: `WHR-CAL-JAPAN-JRA`','Completed Work ID: `WHR-CAL-OPS-V1`']"],
  ["'START-HERE.md':['Previous completed Work ID: `WHR-CAL-DYNAMIC-DATES`','WHR-CAL-OPS-V1','WHR-CAL-JAPAN-JRA']", "'START-HERE.md':['Previous completed Work ID: `WHR-CAL-OPS-V1`','WHR-CAL-JAPAN-JRA','WHR-CAL-JAPAN-NAR']"],
  ["console.log('CURRENT_WORK_ID: WHR-CAL-OPS-V1');\nconsole.log('NEXT_WORK_ID: WHR-CAL-JAPAN-JRA');", "console.log('CURRENT_WORK_ID: WHR-CAL-JAPAN-JRA');\nconsole.log('NEXT_WORK_ID: WHR-CAL-JAPAN-NAR');"]
]);

replace('scripts/check-calendar-contracts.mjs', [
  ["[paths.roadmap, roadmapText, ['Country-page programme: complete', 'Current Work ID: `WHR-CAL-OPS-V1`', 'Completed Work ID: `WHR-CAL-DYNAMIC-DATES`', 'WHR-CAL-BASELINE-RECONCILE']]", "[paths.roadmap, roadmapText, ['Country-page programme: complete', 'Current Work ID: `WHR-CAL-JAPAN-JRA`', 'Completed Work ID: `WHR-CAL-OPS-V1`', 'WHR-CAL-BASELINE-RECONCILE']]"],
  ["[paths.startHere, startHereText, ['Previous completed Work ID: `WHR-CAL-DYNAMIC-DATES`', 'WHR-CAL-OPS-V1', 'WHR-CAL-JAPAN-JRA']]", "[paths.startHere, startHereText, ['Previous completed Work ID: `WHR-CAL-OPS-V1`', 'WHR-CAL-JAPAN-JRA', 'WHR-CAL-JAPAN-NAR']]"],
  ["console.log('CURRENT_WORK_ID: WHR-CAL-OPS-V1');\nconsole.log('NEXT_WORK_ID: WHR-CAL-JAPAN-JRA');", "console.log('CURRENT_WORK_ID: WHR-CAL-JAPAN-JRA');\nconsole.log('NEXT_WORK_ID: WHR-CAL-JAPAN-NAR');"]
]);

replace('scripts/check-project-governance-docs.mjs', [
  ["'docs/calendar/current-baseline-audit.md', 'docs/calendar/baseline-reconciliation-map.md', 'docs/calendar/pipeline-v1-release-gate.md', 'docs/calendar/dynamic-dates-release-gate.md', 'docs/country-pages/completion-contract.md'", "'docs/calendar/current-baseline-audit.md', 'docs/calendar/baseline-reconciliation-map.md', 'docs/calendar/pipeline-v1-release-gate.md', 'docs/calendar/dynamic-dates-release-gate.md', 'docs/calendar/operations-v1-contract.md', 'docs/calendar/operations-v1-release-gate.md', 'docs/country-pages/completion-contract.md'"],
  ["'data/static/calendar-readiness-registry.json', 'data/audits/calendar-baseline-migration-map.json', 'data/audits/calendar-pipeline-v1-release-gate.json', 'data/audits/calendar-dynamic-dates-release-gate.json', 'docs/runbooks/final-country-calendar-audit-98.md'", "'data/static/calendar-readiness-registry.json', 'data/audits/calendar-baseline-migration-map.json', 'data/audits/calendar-pipeline-v1-release-gate.json', 'data/audits/calendar-dynamic-dates-release-gate.json', 'data/audits/calendar-operations-v1-release-gate.json', 'data/static/calendar-operations-control.json', 'data/static/calendar-operations-seasonal-policy.json', 'docs/runbooks/final-country-calendar-audit-98.md'"],
  ["for (const phrase of ['Previous completed Work ID: `WHR-CAL-DYNAMIC-DATES`', 'WHR-CAL-OPS-V1', 'WHR-CAL-JAPAN-JRA'])", "for (const phrase of ['Previous completed Work ID: `WHR-CAL-OPS-V1`', 'WHR-CAL-JAPAN-JRA', 'WHR-CAL-JAPAN-NAR'])"],
  ["for (const phrase of ['Country-page programme: complete', 'Current Work ID: `WHR-CAL-OPS-V1`', 'Completed Work ID: `WHR-CAL-DYNAMIC-DATES`', 'WHR-CAL-BASELINE-RECONCILE', '98 EN + 98 JA = 196'])", "for (const phrase of ['Country-page programme: complete', 'Current Work ID: `WHR-CAL-JAPAN-JRA`', 'Completed Work ID: `WHR-CAL-OPS-V1`', 'WHR-CAL-BASELINE-RECONCILE', '98 EN + 98 JA = 196'])"],
  ["console.log('CURRENT_WORK_ID: WHR-CAL-OPS-V1');\nconsole.log('NEXT_WORK_ID: WHR-CAL-JAPAN-JRA');", "console.log('CURRENT_WORK_ID: WHR-CAL-JAPAN-JRA');\nconsole.log('NEXT_WORK_ID: WHR-CAL-JAPAN-NAR');"]
]);

console.log('CALENDAR_OPERATIONS_V1_COMPLETION_APPLIED');
