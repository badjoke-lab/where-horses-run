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
    '10. [`docs/calendar/baseline-reconciliation-map.md`](docs/calendar/baseline-reconciliation-map.md)\n',
    '10. [`docs/calendar/baseline-reconciliation-map.md`](docs/calendar/baseline-reconciliation-map.md)\n11. [`docs/calendar/pipeline-v1-release-gate.md`](docs/calendar/pipeline-v1-release-gate.md)\n'
  ],
  [
    'data/audits/calendar-baseline-migration-map.json\nscripts/check-calendar-contracts.mjs\nscripts/check-calendar-baseline-reconciliation.mjs',
    'data/audits/calendar-baseline-migration-map.json\ndata/audits/calendar-pipeline-v1-release-gate.json\nscripts/check-calendar-contracts.mjs\nscripts/check-calendar-baseline-reconciliation.mjs\nscripts/check-calendar-pipeline-v1-release-gate.mjs'
  ],
  ['Previous completed Work ID: `WHR-CAL-BASELINE-RECONCILE`', 'Previous completed Work ID: `WHR-CAL-PIPELINE-V1`'],
  ['```text\nWHR-CAL-PIPELINE-V1\n```\n\nNext Work ID:', '```text\nWHR-CAL-DYNAMIC-DATES\n```\n\nNext Work ID:'],
  ['```text\nWHR-CAL-DYNAMIC-DATES\n```\n\nThe 98-country', '```text\nWHR-CAL-OPS-V1\n```\n\nThe 98-country'],
  [
    'The 98-country bilingual page programme and Calendar baseline reconciliation are complete. The active task is to implement the reviewed pipeline v1 without activating unattended publication.',
    'The 98-country programme, Calendar baseline reconciliation, and Pipeline v1 foundation are complete. The active task is dynamic Today/Tomorrow and rolling Calendar date logic; scheduled source operation remains paused.'
  ]
]);

replace('docs/project-roadmap.md', [
  ['Current Work ID: `WHR-CAL-PIPELINE-V1`', 'Current Work ID: `WHR-CAL-DYNAMIC-DATES`'],
  ['Next Work ID: `WHR-CAL-DYNAMIC-DATES`', 'Next Work ID: `WHR-CAL-OPS-V1`'],
  [
    'The existing Calendar baseline has been classified in a reviewed migration map. The current product phase is pipeline v1: one bounded candidate envelope, human promotion, single canonical/public writers, runtime import guards, and grouped validation.',
    'The existing Calendar baseline and Pipeline v1 foundation are complete. The current product phase is dynamic dates: build-date/timezone-aware Today and Tomorrow selection, a rolling Calendar window, and safe empty/stale states without reactivating scheduled acquisition.'
  ],
  [
    '## Phase 8 — activate the reviewed pipeline\n\nStatus: current  \nCurrent Work ID: `WHR-CAL-PIPELINE-V1`\n\n```text\nWHR-CAL-PIPELINE-V1\nWHR-CAL-DYNAMIC-DATES\nWHR-CAL-OPS-V1\n```\n\nDeliver one adapter contract, fixture-backed parsing, candidate/promotion gates, dynamic dates, rolling window, stale/failure handling, scheduled candidate generation, reviewable update PRs, pause, and rollback.',
    '## Phase 8 — activate the reviewed pipeline\n\nStatus: Pipeline v1 complete; dynamic dates current  \nCompleted Work ID: `WHR-CAL-PIPELINE-V1`  \nCurrent Work ID: `WHR-CAL-DYNAMIC-DATES`  \nNext Work ID: `WHR-CAL-OPS-V1`\n\n```text\nWHR-CAL-PIPELINE-V1\nWHR-CAL-DYNAMIC-DATES\nWHR-CAL-OPS-V1\n```\n\nPipeline v1 delivered the read-only build boundary, candidate v1 contract, human canonical promotion, deterministic public projection, production runtime import guard, JRA reference adapter, rendered public release QA, and grouped release gate.\n\nDynamic Dates now replaces fixed preview dates with explicit build-date/timezone rules, Today/Tomorrow selection, a rolling Calendar window, and safe empty/stale handling. Operations and scheduling remain separate under `WHR-CAL-OPS-V1`.'
  ]
]);

replace('docs/calendar/implementation-roadmap.md', [
  [
    '## Stage 5 — pipeline v1\n\nStatus: current  \nCurrent Work ID: `WHR-CAL-PIPELINE-V1`',
    '## Stage 5 — pipeline v1\n\nPipeline v1 status: complete  \nCompleted Work ID: `WHR-CAL-PIPELINE-V1`  \nCurrent Work ID: `WHR-CAL-DYNAMIC-DATES`  \nNext Work ID: `WHR-CAL-OPS-V1`'
  ],
  [
    'Standard flow:\n\n```text\nofficial source\n-> reviewed adapter or manual import\n-> extracted candidate\n-> normalization\n-> validation\n-> human promotion\n-> canonical meeting data\n-> public display projection\n-> static build\n```\n\nReplace preview-era fixed dates with build-date aware Today/Tomorrow, a rolling Calendar window, explicit timezone rules, safe empty states, and historical/future-window handling.\n\nOperations include candidate schedules, source-health and stale reports, reviewable generated-update PRs, pause/rollback controls, seasonal rollover, and source-breakage procedures. Do not use routine direct self-publication.',
    'Standard flow:\n\n```text\nofficial source\n-> reviewed adapter or manual import\n-> extracted candidate\n-> normalization\n-> validation\n-> human promotion\n-> canonical meeting data\n-> public display projection\n-> static build\n```\n\nCompleted Pipeline v1 outputs include one candidate contract, human promotion writer, deterministic public projection, public-only runtime imports, read-only builds, one JRA reference adapter, rendered release QA, and `data/audits/calendar-pipeline-v1-release-gate.json`.\n\n### Dynamic Dates — current\n\nReplace preview-era fixed dates with build-date aware Today/Tomorrow, a rolling Calendar window, explicit timezone rules, safe empty states, and historical/future-window handling.\n\n### Operations v1 — next\n\nOperations include candidate schedules, source-health and stale reports, reviewable generated-update PRs, pause/rollback controls, seasonal rollover, and source-breakage procedures. Do not use routine direct self-publication.'
  ]
]);

replace('docs/calendar/current-baseline-audit.md', [
  ['Current Work ID: `WHR-CAL-PIPELINE-V1`', 'Current Work ID: `WHR-CAL-DYNAMIC-DATES`'],
  [
    'The next phase implements one shared candidate envelope, one human promotion path, one canonical writer, deterministic public projection, import guards, grouped validation, and a fixture-backed reference adapter. Dynamic dates and operations follow as separate Work IDs.',
    'Pipeline v1 now provides the shared candidate envelope, human promotion path, deterministic public projection, runtime import guard, grouped validation, and a JRA reference adapter. The current phase implements dynamic dates; operations remain separate.'
  ]
]);

replace('docs/calendar/README.md', [
  [
    '- [`pipeline-v1-jra-reference-adapter.md`](pipeline-v1-jra-reference-adapter.md) — first source adapter migrated to the candidate v1 boundary.\n',
    '- [`pipeline-v1-jra-reference-adapter.md`](pipeline-v1-jra-reference-adapter.md) — first source adapter migrated to the candidate v1 boundary.\n- [`pipeline-v1-release-gate.md`](pipeline-v1-release-gate.md) — grouped Pipeline v1 completion and remaining-work boundary.\n'
  ],
  [
    'data/audits/calendar-baseline-migration-map.json\nscripts/check-calendar-contracts.mjs',
    'data/audits/calendar-baseline-migration-map.json\ndata/audits/calendar-pipeline-v1-release-gate.json\nscripts/check-calendar-contracts.mjs'
  ],
  [
    'scripts/check-japan-jra-candidate-generator.mjs\n```',
    'scripts/check-japan-jra-candidate-generator.mjs\nscripts/check-calendar-pipeline-v1-release-gate.mjs\n```'
  ]
]);

replace('docs/governance/document-authority.md', [
  [
    '- `docs/calendar/baseline-reconciliation-map.md`\n',
    '- `docs/calendar/baseline-reconciliation-map.md`\n- `docs/calendar/pipeline-v1-release-gate.md`\n'
  ],
  [
    '- `data/audits/calendar-baseline-migration-map.json`\n',
    '- `data/audits/calendar-baseline-migration-map.json`\n- `data/audits/calendar-pipeline-v1-release-gate.json`\n'
  ],
  [
    '- `scripts/check-calendar-baseline-reconciliation.mjs`\n',
    '- `scripts/check-calendar-baseline-reconciliation.mjs`\n- `scripts/check-calendar-pipeline-v1-release-gate.mjs`\n'
  ]
]);

replace('scripts/check-calendar-baseline-reconciliation.mjs', [
  ["'docs/calendar/implementation-roadmap.md':['Status: complete','Status: current']", "'docs/calendar/implementation-roadmap.md':['Status: complete','Pipeline v1 status: complete','Current Work ID: `WHR-CAL-DYNAMIC-DATES`']"],
  ["'docs/project-roadmap.md':['Current Work ID: `WHR-CAL-PIPELINE-V1`']", "'docs/project-roadmap.md':['Current Work ID: `WHR-CAL-DYNAMIC-DATES`','Completed Work ID: `WHR-CAL-PIPELINE-V1`']"],
  ["'START-HERE.md':['WHR-CAL-PIPELINE-V1','WHR-CAL-DYNAMIC-DATES']", "'START-HERE.md':['Previous completed Work ID: `WHR-CAL-PIPELINE-V1`','WHR-CAL-DYNAMIC-DATES','WHR-CAL-OPS-V1']"],
  ["console.log('CURRENT_WORK_ID: WHR-CAL-PIPELINE-V1');\nconsole.log('NEXT_WORK_ID: WHR-CAL-DYNAMIC-DATES');", "console.log('CURRENT_WORK_ID: WHR-CAL-DYNAMIC-DATES');\nconsole.log('NEXT_WORK_ID: WHR-CAL-OPS-V1');"]
]);

replace('scripts/check-calendar-contracts.mjs', [
  [
    "[paths.roadmap, roadmapText, ['Country-page programme: complete', 'Current Work ID: `WHR-CAL-PIPELINE-V1`', 'WHR-CAL-BASELINE-RECONCILE']]",
    "[paths.roadmap, roadmapText, ['Country-page programme: complete', 'Current Work ID: `WHR-CAL-DYNAMIC-DATES`', 'Completed Work ID: `WHR-CAL-PIPELINE-V1`', 'WHR-CAL-BASELINE-RECONCILE']]"
  ],
  [
    "[paths.startHere, startHereText, ['Previous completed Work ID: `WHR-CAL-BASELINE-RECONCILE`', 'WHR-CAL-PIPELINE-V1', 'WHR-CAL-DYNAMIC-DATES']]",
    "[paths.startHere, startHereText, ['Previous completed Work ID: `WHR-CAL-PIPELINE-V1`', 'WHR-CAL-DYNAMIC-DATES', 'WHR-CAL-OPS-V1']]"
  ],
  ["console.log('CURRENT_WORK_ID: WHR-CAL-PIPELINE-V1');\nconsole.log('NEXT_WORK_ID: WHR-CAL-DYNAMIC-DATES');", "console.log('CURRENT_WORK_ID: WHR-CAL-DYNAMIC-DATES');\nconsole.log('NEXT_WORK_ID: WHR-CAL-OPS-V1');"]
]);

replace('scripts/check-project-governance-docs.mjs', [
  [
    "'docs/calendar/current-baseline-audit.md', 'docs/calendar/baseline-reconciliation-map.md', 'docs/country-pages/completion-contract.md',",
    "'docs/calendar/current-baseline-audit.md', 'docs/calendar/baseline-reconciliation-map.md', 'docs/calendar/pipeline-v1-release-gate.md', 'docs/country-pages/completion-contract.md',"
  ],
  [
    "'data/static/calendar-readiness-registry.json', 'data/audits/calendar-baseline-migration-map.json', 'docs/runbooks/final-country-calendar-audit-98.md'",
    "'data/static/calendar-readiness-registry.json', 'data/audits/calendar-baseline-migration-map.json', 'data/audits/calendar-pipeline-v1-release-gate.json', 'docs/runbooks/final-country-calendar-audit-98.md'"
  ],
  [
    "for (const phrase of ['Previous completed Work ID: `WHR-CAL-BASELINE-RECONCILE`', 'WHR-CAL-PIPELINE-V1', 'WHR-CAL-DYNAMIC-DATES'])",
    "for (const phrase of ['Previous completed Work ID: `WHR-CAL-PIPELINE-V1`', 'WHR-CAL-DYNAMIC-DATES', 'WHR-CAL-OPS-V1'])"
  ],
  [
    "for (const phrase of ['Country-page programme: complete', 'Current Work ID: `WHR-CAL-PIPELINE-V1`', 'WHR-CAL-BASELINE-RECONCILE', '98 EN + 98 JA = 196'])",
    "for (const phrase of ['Country-page programme: complete', 'Current Work ID: `WHR-CAL-DYNAMIC-DATES`', 'Completed Work ID: `WHR-CAL-PIPELINE-V1`', 'WHR-CAL-BASELINE-RECONCILE', '98 EN + 98 JA = 196'])"
  ],
  ["console.log('CURRENT_WORK_ID: WHR-CAL-PIPELINE-V1');\nconsole.log('NEXT_WORK_ID: WHR-CAL-DYNAMIC-DATES');", "console.log('CURRENT_WORK_ID: WHR-CAL-DYNAMIC-DATES');\nconsole.log('NEXT_WORK_ID: WHR-CAL-OPS-V1');"]
]);

console.log('CALENDAR_PIPELINE_V1_COMPLETION_APPLIED');
