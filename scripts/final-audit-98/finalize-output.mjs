import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const write = (file, text) => fs.writeFileSync(file, text);
const AUDIT = 'WHR-AUDIT-COUNTRY-CALENDAR-98';
const CURRENT = 'WHR-CAL-BASELINE-RECONCILE';
const NEXT = 'WHR-CAL-PIPELINE-V1';
const DATE = '2026-07-01';

function normalizeIds(file) {
  let text = read(file);
  text = text.replaceAll('WHR-AUDIT-98', AUDIT).replaceAll('WHR-CALENDAR-MAINTENANCE', CURRENT);
  write(file, text);
}

for (const file of [
  'START-HERE.md',
  'docs/project-roadmap.md',
  'docs/country-pages/programme-roadmap.md',
  'docs/country-pages/transition-overlays-archive.md',
  'docs/runbooks/final-country-calendar-audit-98.md',
  'scripts/check-country-page-programme-roadmap.mjs',
  'scripts/check-project-governance-docs.mjs',
  'scripts/check-calendar-contracts.mjs'
]) normalizeIds(file);

let project = read('docs/project-roadmap.md');
project = project.replace(/Last reviewed: \d{4}-\d{2}-\d{2}/, `Last reviewed: ${DATE}`);
project = project.replace(/Next Work ID: `[^`]+`/, `Next Work ID: \`${NEXT}\``);
project = project.replace(
  /## Phase 5 — complete entries 53-98 under Source Test v2[\s\S]*?## Phase 7 — reconcile the existing Calendar baseline/,
  `## Phase 5 — complete entries 53-98 under Source Test v2

Completed publication waves:

- entries 53-60: PRs #326-#329;
- entries 61-68: PRs #330-#333;
- entries 69-76: PRs #335, #336, #338, and #340;
- entries 77-84: PRs #341-#345;
- entries 85-92: PRs #346-#351;
- entries 93-98: PRs #352-#356.

Every wave completed Source Test v2, reviewed notes, bilingual Profile v2, rendered QA, and publication. Source Test v2 also closed the Calendar Readiness decision for each reviewed system/source.

## Phase 6 — combined 98-country and readiness audit

Completed Work ID: \`${AUDIT}\`

Completed outcomes:

- 98 canonical tracker rows and 196 published bilingual routes;
- 98 countries with closed Calendar Readiness decisions;
- 116 canonical authority/source records;
- 116 canonical Calendar Readiness records;
- canonical state no longer depends on transition overlays at runtime;
- legacy wave validators are archived behind explicit opt-in;
- Profile v2 runtime no longer depends on final-wave loader mutation;
- final governance, Calendar, runtime, and production-build checks pass.

This closes the 98-country research/page programme. It does not close the product.

## Phase 7 — reconcile the existing Calendar baseline`
);
project = project.replace(
  /## Phase 7 — reconcile the existing Calendar baseline\n\nWork ID: `WHR-CAL-BASELINE-RECONCILE`/,
  `## Phase 7 — reconcile the existing Calendar baseline

Status: current  
Work ID: \`${CURRENT}\``
);
project = project.replace(
  'The Calendar acquisition layer remains a separate continuing programme. A closed readiness decision does not claim that a live adapter, parser, or scheduled fetch is implemented.',
  'The current product phase is baseline reconciliation. Existing Calendar schemas, registries, generated data, adapters, fixtures, promotion tools, display policies, fixed-date logic, seeds, and PR-specific scripts must be classified before pipeline v1 is activated.'
);
write('docs/project-roadmap.md', project);

let programme = read('docs/country-pages/programme-roadmap.md');
programme = programme.replace(/Last roadmap review: \d{4}-\d{2}-\d{2}/, `Last roadmap review: ${DATE}`);
programme = programme.replace('Next operating phase: WHR-CAL-BASELINE-RECONCILE', `Next product Work ID: ${CURRENT}`);
programme = programme.replace(
  /## 12\. Wave 69-76[\s\S]*?## 15\. Roadmap maintenance rules/,
  `## 12. Wave 69-76

| Work | Status | Result |
| --- | --- | --- |
| #335 / \`WHR-ST2-69-76\` | complete | Source Test v2 and Calendar Readiness. |
| #336 / \`WHR-NOTE-69-76\` | complete | Reviewed public-safe notes. |
| #338 / \`WHR-PROFILE-69-76\` | complete | Bilingual Profile v2 records and routes. |
| #340 / \`WHR-PUB-69-76\` | complete | Published after preview PR #339 passed rendered QA. |

## 13. Wave 77-84

| Work | Status | Result |
| --- | --- | --- |
| #341 / \`WHR-ST2-77-84\` | complete | Source Test v2 and Calendar Readiness. |
| #342 / \`WHR-NOTE-77-84\` | complete | Reviewed public-safe notes. |
| #343 / \`WHR-PROFILE-77-84\` | complete | Bilingual Profile v2 records and routes. |
| #345 / \`WHR-PUB-77-84\` | complete | Published after preview PR #344 passed rendered QA. |

## 14. Wave 85-92

| Work | Status | Result |
| --- | --- | --- |
| #348 / \`WHR-ST2-85-92\` | complete | Source Test v2 and Calendar Readiness. |
| #346 / \`WHR-NOTE-85-92\` | complete | Reviewed public-safe notes. |
| #347 / \`WHR-PROFILE-85-92\` | complete | Bilingual Profile v2 records and routes. |
| #351 / \`WHR-PUB-85-92\` | complete | Published after preview PR #349 passed rendered QA; PR #350 was superseded. |

## 15. Wave 93-98

| Work | Status | Result |
| --- | --- | --- |
| #352 / \`WHR-ST2-93-98\` | complete | Source Test v2 and Calendar Readiness. |
| #353 / \`WHR-NOTE-93-98\` | complete | Reviewed explanatory and archive notes. |
| #354 / \`WHR-PROFILE-93-98\` | complete | Final bilingual Profile v2 records and routes. |
| #356 / \`WHR-PUB-93-98\` | complete | Published after preview PR #355 passed rendered QA. |

## 16. Final release gate

Completed Work ID: \`${AUDIT}\`

The canonical result is 98 published tracker rows, 98 English routes, 98 Japanese routes, 98 Profile v2 records, 116 authority/source records, and 116 Calendar Readiness records. All canonical validators and the production build must pass in the audit PR.

The country-page programme is complete. Calendar baseline reconciliation continues under the product roadmap.

## 17. Roadmap maintenance rules`
);
write('docs/country-pages/programme-roadmap.md', programme);

let calendar = read('docs/calendar/implementation-roadmap.md');
calendar = calendar.replace(/Last reviewed: \d{4}-\d{2}-\d{2}/, `Last reviewed: ${DATE}`);
calendar = calendar.replace(
  `## Stage 3 — combined research handoff\n\nWork ID: \`${AUDIT}\``,
  `## Stage 3 — combined research handoff\n\nStatus: complete  \nWork ID: \`${AUDIT}\``
);
calendar = calendar.replace(
  `## Stage 4 — existing baseline reconciliation\n\nWork ID: \`${CURRENT}\``,
  `## Stage 4 — existing baseline reconciliation\n\nStatus: current  \nWork ID: \`${CURRENT}\``
);
write('docs/calendar/implementation-roadmap.md', calendar);

let start = read('START-HERE.md');
start = start.replace(/Last reviewed: \d{4}-\d{2}-\d{2}/, `Last reviewed: ${DATE}`);
start = start.replace(
  `\`\`\`text\n${CURRENT}\n\`\`\`\n\nThe 98-country bilingual page programme`,
  `\`\`\`text\n${CURRENT}\n\`\`\`\n\nNext Work ID:\n\n\`\`\`text\n${NEXT}\n\`\`\`\n\nThe 98-country bilingual page programme`
);
start = start.replace(
  'Calendar acquisition and refresh implementation remain a separate continuing workstream.',
  'The active task is to reconcile the existing Calendar baseline before pipeline v1 is activated.'
);
write('START-HERE.md', start);

let runbook = read('docs/runbooks/final-country-calendar-audit-98.md');
runbook = runbook.replace('Status: complete for review', 'Status: complete').replace(/Date: \d{4}-\d{2}-\d{2}/, `Date: ${DATE}`);
runbook = runbook.replace(
  /Country-page publication is complete\.[\s\S]*$/,
  `Country-page publication is complete. The next task is \`${CURRENT}\`: classify the existing Calendar baseline before adapters, dynamic dates, scheduling, or broader acquisition are activated.\n`
);
write('docs/runbooks/final-country-calendar-audit-98.md', runbook);

let overlays = read('docs/country-pages/transition-overlays-archive.md');
overlays = overlays.replace(/Date: \d{4}-\d{2}-\d{2}/, `Date: ${DATE}`);
write('docs/country-pages/transition-overlays-archive.md', overlays);

let calendarCheck = read('scripts/check-calendar-contracts.mjs');
calendarCheck = calendarCheck.replace("console.log('COUNTRY_PAGE_PROGRAMME: complete');", `console.log('NEXT_WORK_ID: ${NEXT}');`);
write('scripts/check-calendar-contracts.mjs', calendarCheck);

console.log(`FINAL_AUDIT_OUTPUT_FINALIZED current=${CURRENT} next=${NEXT}`);
