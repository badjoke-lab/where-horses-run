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
    '11. [`docs/calendar/pipeline-v1-release-gate.md`](docs/calendar/pipeline-v1-release-gate.md)\n',
    '11. [`docs/calendar/pipeline-v1-release-gate.md`](docs/calendar/pipeline-v1-release-gate.md)\n12. [`docs/calendar/dynamic-dates-release-gate.md`](docs/calendar/dynamic-dates-release-gate.md)\n'
  ],
  [
    'data/audits/calendar-pipeline-v1-release-gate.json\nscripts/check-calendar-contracts.mjs',
    'data/audits/calendar-pipeline-v1-release-gate.json\ndata/audits/calendar-dynamic-dates-release-gate.json\nscripts/check-calendar-contracts.mjs'
  ],
  [
    'scripts/check-calendar-pipeline-v1-release-gate.mjs\n```',
    'scripts/check-calendar-pipeline-v1-release-gate.mjs\nscripts/check-calendar-dynamic-dates-release-gate.mjs\n```'
  ],
  ['Previous completed Work ID: `WHR-CAL-PIPELINE-V1`', 'Previous completed Work ID: `WHR-CAL-DYNAMIC-DATES`'],
  ['```text\nWHR-CAL-DYNAMIC-DATES\n```\n\nNext Work ID:', '```text\nWHR-CAL-OPS-V1\n```\n\nNext Work ID:'],
  ['```text\nWHR-CAL-OPS-V1\n```\n\nThe 98-country', '```text\nWHR-CAL-JAPAN-JRA\n```\n\nThe 98-country'],
  [
    'The 98-country programme, Calendar baseline reconciliation, and Pipeline v1 foundation are complete. The active task is dynamic Today/Tomorrow and rolling Calendar date logic; scheduled source operation remains paused.',
    'The 98-country programme, Calendar baseline reconciliation, Pipeline v1, and Dynamic Dates are complete. The active task is Operations v1; scheduled source operation remains paused until its controls and runbooks are complete.'
  ]
]);

replace('docs/project-roadmap.md', [
  ['Current Work ID: `WHR-CAL-DYNAMIC-DATES`  \nNext Work ID: `WHR-CAL-OPS-V1`', 'Current Work ID: `WHR-CAL-OPS-V1`  \nNext Work ID: `WHR-CAL-JAPAN-JRA`'],
  [
    'The existing Calendar baseline and Pipeline v1 foundation are complete. The current product phase is dynamic dates: build-date/timezone-aware Today and Tomorrow selection, a rolling Calendar window, and safe empty/stale states without reactivating scheduled acquisition.',
    'The existing Calendar baseline, Pipeline v1 foundation, and Dynamic Dates are complete. The current product phase is Operations v1: source-health and stale reports, reviewable update preparation, pause and rollback controls, seasonal rollover, and operator runbooks without unattended publication.'
  ],
  [
    'Status: Pipeline v1 complete; dynamic dates current  \nCompleted Work ID: `WHR-CAL-PIPELINE-V1`  \nCurrent Work ID: `WHR-CAL-DYNAMIC-DATES`  \nNext Work ID: `WHR-CAL-OPS-V1`',
    'Status: Pipeline v1 and Dynamic Dates complete; Operations v1 current  \nCompleted Work ID: `WHR-CAL-PIPELINE-V1`  \nCompleted Work ID: `WHR-CAL-DYNAMIC-DATES`  \nCurrent Work ID: `WHR-CAL-OPS-V1`  \nNext Work ID: `WHR-CAL-JAPAN-JRA`'
  ],
  [
    'Dynamic Dates now replaces fixed preview dates with explicit build-date/timezone rules, Today/Tomorrow selection, a rolling Calendar window, and safe empty/stale handling. Operations and scheduling remain separate under `WHR-CAL-OPS-V1`.',
    'Dynamic Dates replaced fixed preview dates with explicit date/timezone rules, Today/Tomorrow selection, a rolling 30-day window, and visible current/stale/empty states. Operations v1 now adds controlled maintenance and recovery ownership while scheduling remains paused.'
  ]
]);

replace('docs/calendar/implementation-roadmap.md', [
  [
    '### Dynamic Dates — current\n\nReplace preview-era fixed dates with build-date aware Today/Tomorrow, a rolling Calendar window, explicit timezone rules, safe empty states, and historical/future-window handling.\n\n### Operations v1 — next\n\nOperations include candidate schedules, source-health and stale reports, reviewable generated-update PRs, pause/rollback controls, seasonal rollover, and source-breakage procedures. Do not use routine direct self-publication.',
    '### Dynamic Dates\n\nDynamic Dates status: complete  \nCompleted Work ID: `WHR-CAL-DYNAMIC-DATES`\n\nThe site now uses explicit reference-date and timezone rules, Today/Tomorrow selection, a rolling 30-day window, and visible current/stale/empty states.\n\n### Operations v1\n\nStatus: current  \nCurrent Work ID: `WHR-CAL-OPS-V1`  \nNext Work ID: `WHR-CAL-JAPAN-JRA`\n\nOperations include source-health and stale reports, reviewable generated-update preparation, pause/rollback controls, seasonal rollover, and source-breakage procedures. Do not use routine direct self-publication.'
  ]
]);

replace('docs/calendar/current-baseline-audit.md', [
  ['Current Work ID: `WHR-CAL-DYNAMIC-DATES`', 'Current Work ID: `WHR-CAL-OPS-V1`'],
  [
    'Pipeline v1 now provides the shared candidate envelope, human promotion path, deterministic public projection, runtime import guard, grouped validation, and a JRA reference adapter. The current phase implements dynamic dates; operations remain separate.',
    'Pipeline v1 and Dynamic Dates now provide the reviewed data flow, deterministic public projection, runtime boundary, explicit date/timezone rules, rolling windows, and visible stale states. The current phase establishes Operations v1 before the JRA pilot.'
  ]
]);

replace('docs/calendar/README.md', [
  [
    '- [`dynamic-dates-contract.md`](dynamic-dates-contract.md) — explicit reference date, timezone, Today/Tomorrow, rolling window, and stale-state rules.\n',
    '- [`dynamic-dates-contract.md`](dynamic-dates-contract.md) — explicit reference date, timezone, Today/Tomorrow, rolling window, and stale-state rules.\n- [`dynamic-dates-release-gate.md`](dynamic-dates-release-gate.md) — Dynamic Dates completion and Operations v1 boundary.\n'
  ],
  [
    'data/audits/calendar-pipeline-v1-release-gate.json\nscripts/check-calendar-contracts.mjs',
    'data/audits/calendar-pipeline-v1-release-gate.json\ndata/audits/calendar-dynamic-dates-release-gate.json\nscripts/check-calendar-contracts.mjs'
  ],
  [
    'scripts/check-calendar-dynamic-dates-rendered.mjs\n```',
    'scripts/check-calendar-dynamic-dates-rendered.mjs\nscripts/check-calendar-dynamic-dates-release-gate.mjs\n```'
  ]
]);

replace('docs/governance/document-authority.md', [
  [
    '- `docs/calendar/pipeline-v1-release-gate.md`\n',
    '- `docs/calendar/pipeline-v1-release-gate.md`\n- `docs/calendar/dynamic-dates-release-gate.md`\n'
  ],
  [
    '- `data/audits/calendar-pipeline-v1-release-gate.json`\n',
    '- `data/audits/calendar-pipeline-v1-release-gate.json`\n- `data/audits/calendar-dynamic-dates-release-gate.json`\n'
  ],
  [
    '- `scripts/check-calendar-pipeline-v1-release-gate.mjs`\n',
    '- `scripts/check-calendar-pipeline-v1-release-gate.mjs`\n- `scripts/check-calendar-dynamic-dates-release-gate.mjs`\n'
  ]
]);

replace('scripts/check-calendar-pipeline-v1-release-gate.mjs', [
  [
    "['START-HERE.md', startHere, ['Previous completed Work ID: `WHR-CAL-PIPELINE-V1`', 'WHR-CAL-DYNAMIC-DATES', 'WHR-CAL-OPS-V1']],",
    "['START-HERE.md', startHere, ['Previous completed Work ID: `WHR-CAL-DYNAMIC-DATES`', 'WHR-CAL-OPS-V1', 'WHR-CAL-JAPAN-JRA']],"
  ],
  [
    "['docs/project-roadmap.md', projectRoadmap, ['Current Work ID: `WHR-CAL-DYNAMIC-DATES`', 'Completed Work ID: `WHR-CAL-PIPELINE-V1`']],",
    "['docs/project-roadmap.md', projectRoadmap, ['Current Work ID: `WHR-CAL-OPS-V1`', 'Completed Work ID: `WHR-CAL-PIPELINE-V1`', 'Completed Work ID: `WHR-CAL-DYNAMIC-DATES`']],"
  ],
  [
    "['docs/calendar/implementation-roadmap.md', implementationRoadmap, ['Pipeline v1 status: complete', 'Current Work ID: `WHR-CAL-DYNAMIC-DATES`']]",
    "['docs/calendar/implementation-roadmap.md', implementationRoadmap, ['Pipeline v1 status: complete', 'Dynamic Dates status: complete', 'Current Work ID: `WHR-CAL-OPS-V1`']]"
  ],
  ["console.log('CURRENT_WORK_ID: WHR-CAL-DYNAMIC-DATES');\nconsole.log('NEXT_WORK_ID: WHR-CAL-OPS-V1');", "console.log('CURRENT_WORK_ID: WHR-CAL-OPS-V1');\nconsole.log('NEXT_WORK_ID: WHR-CAL-JAPAN-JRA');"]
]);

replace('scripts/check-calendar-baseline-reconciliation.mjs', [
  ["'docs/calendar/implementation-roadmap.md':['Status: complete','Pipeline v1 status: complete','Current Work ID: `WHR-CAL-DYNAMIC-DATES`']", "'docs/calendar/implementation-roadmap.md':['Status: complete','Pipeline v1 status: complete','Dynamic Dates status: complete','Current Work ID: `WHR-CAL-OPS-V1`']"],
  ["'docs/project-roadmap.md':['Current Work ID: `WHR-CAL-DYNAMIC-DATES`','Completed Work ID: `WHR-CAL-PIPELINE-V1`']", "'docs/project-roadmap.md':['Current Work ID: `WHR-CAL-OPS-V1`','Completed Work ID: `WHR-CAL-DYNAMIC-DATES`']"],
  ["'START-HERE.md':['Previous completed Work ID: `WHR-CAL-PIPELINE-V1`','WHR-CAL-DYNAMIC-DATES','WHR-CAL-OPS-V1']", "'START-HERE.md':['Previous completed Work ID: `WHR-CAL-DYNAMIC-DATES`','WHR-CAL-OPS-V1','WHR-CAL-JAPAN-JRA']"],
  ["console.log('CURRENT_WORK_ID: WHR-CAL-DYNAMIC-DATES');\nconsole.log('NEXT_WORK_ID: WHR-CAL-OPS-V1');", "console.log('CURRENT_WORK_ID: WHR-CAL-OPS-V1');\nconsole.log('NEXT_WORK_ID: WHR-CAL-JAPAN-JRA');"]
]);

replace('scripts/check-calendar-contracts.mjs', [
  [
    "[paths.roadmap, roadmapText, ['Country-page programme: complete', 'Current Work ID: `WHR-CAL-DYNAMIC-DATES`', 'Completed Work ID: `WHR-CAL-PIPELINE-V1`', 'WHR-CAL-BASELINE-RECONCILE']],",
    "[paths.roadmap, roadmapText, ['Country-page programme: complete', 'Current Work ID: `WHR-CAL-OPS-V1`', 'Completed Work ID: `WHR-CAL-DYNAMIC-DATES`', 'WHR-CAL-BASELINE-RECONCILE']],"
  ],
  [
    "[paths.startHere, startHereText, ['Previous completed Work ID: `WHR-CAL-PIPELINE-V1`', 'WHR-CAL-DYNAMIC-DATES', 'WHR-CAL-OPS-V1']],",
    "[paths.startHere, startHereText, ['Previous completed Work ID: `WHR-CAL-DYNAMIC-DATES`', 'WHR-CAL-OPS-V1', 'WHR-CAL-JAPAN-JRA']],"
  ],
  ["console.log('CURRENT_WORK_ID: WHR-CAL-DYNAMIC-DATES');\nconsole.log('NEXT_WORK_ID: WHR-CAL-OPS-V1');", "console.log('CURRENT_WORK_ID: WHR-CAL-OPS-V1');\nconsole.log('NEXT_WORK_ID: WHR-CAL-JAPAN-JRA');"]
]);

replace('scripts/check-project-governance-docs.mjs', [
  [
    "'docs/calendar/current-baseline-audit.md', 'docs/calendar/baseline-reconciliation-map.md', 'docs/calendar/pipeline-v1-release-gate.md', 'docs/country-pages/completion-contract.md',",
    "'docs/calendar/current-baseline-audit.md', 'docs/calendar/baseline-reconciliation-map.md', 'docs/calendar/pipeline-v1-release-gate.md', 'docs/calendar/dynamic-dates-release-gate.md', 'docs/country-pages/completion-contract.md',"
  ],
  [
    "'data/static/calendar-readiness-registry.json', 'data/audits/calendar-baseline-migration-map.json', 'data/audits/calendar-pipeline-v1-release-gate.json', 'docs/runbooks/final-country-calendar-audit-98.md'",
    "'data/static/calendar-readiness-registry.json', 'data/audits/calendar-baseline-migration-map.json', 'data/audits/calendar-pipeline-v1-release-gate.json', 'data/audits/calendar-dynamic-dates-release-gate.json', 'docs/runbooks/final-country-calendar-audit-98.md'"
  ],
  [
    "for (const phrase of ['Previous completed Work ID: `WHR-CAL-PIPELINE-V1`', 'WHR-CAL-DYNAMIC-DATES', 'WHR-CAL-OPS-V1'])",
    "for (const phrase of ['Previous completed Work ID: `WHR-CAL-DYNAMIC-DATES`', 'WHR-CAL-OPS-V1', 'WHR-CAL-JAPAN-JRA'])"
  ],
  [
    "for (const phrase of ['Country-page programme: complete', 'Current Work ID: `WHR-CAL-DYNAMIC-DATES`', 'Completed Work ID: `WHR-CAL-PIPELINE-V1`', 'WHR-CAL-BASELINE-RECONCILE', '98 EN + 98 JA = 196'])",
    "for (const phrase of ['Country-page programme: complete', 'Current Work ID: `WHR-CAL-OPS-V1`', 'Completed Work ID: `WHR-CAL-DYNAMIC-DATES`', 'WHR-CAL-BASELINE-RECONCILE', '98 EN + 98 JA = 196'])"
  ],
  ["console.log('CURRENT_WORK_ID: WHR-CAL-DYNAMIC-DATES');\nconsole.log('NEXT_WORK_ID: WHR-CAL-OPS-V1');", "console.log('CURRENT_WORK_ID: WHR-CAL-OPS-V1');\nconsole.log('NEXT_WORK_ID: WHR-CAL-JAPAN-JRA');"]
]);

console.log('CALENDAR_DYNAMIC_DATES_COMPLETION_APPLIED');
