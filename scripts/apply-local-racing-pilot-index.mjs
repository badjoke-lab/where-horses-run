import { readFileSync, writeFileSync } from 'node:fs';

function replace(file, pairs) {
  let text = readFileSync(file, 'utf8');
  for (const [from, to] of pairs) {
    if (!text.includes(from)) throw new Error(`${file} missing marker: ${from}`);
    text = text.replace(from, to);
  }
  writeFileSync(file, text);
}

replace('docs/project-roadmap.md', [
  ['Current Work ID: `WHR-CAL-JAPAN-JRA`  \nNext Work ID: `WHR-CAL-JAPAN-NAR`', 'Current Work ID: `WHR-CAL-JAPAN-NAR`  \nNext Work ID: `WHR-CAL-JAPAN-BANEI`'],
  [
    'The existing Calendar baseline, Pipeline v1 foundation, Dynamic Dates, and Operations v1 are complete. The current product phase is the JRA source pilot: obtain a fresh reviewed official fixture, generate bounded candidates, retain human promotion, and prove fallback and rollback without unattended publication.',
    'The existing Calendar baseline, Pipeline v1 foundation, Dynamic Dates, and Operations v1 are complete. The JRA implementation foundation is complete and remains pending a fresh reviewed official final fixture. The current product phase is the regional local-racing link-only pilot, which must preserve its C-level boundary until authority-specific timetable evidence supports a reviewed readiness change.'
  ],
  ['Status: Pipeline v1, Dynamic Dates, and Operations v1 complete; JRA pilot current', 'Status: Pipeline v1, Dynamic Dates, and Operations v1 complete; local-racing link-only pilot current'],
  ['Current Work ID: `WHR-CAL-JAPAN-JRA`  \nNext Work ID: `WHR-CAL-JAPAN-NAR`', 'Current Work ID: `WHR-CAL-JAPAN-NAR`  \nNext Work ID: `WHR-CAL-JAPAN-BANEI`'],
  [
    'The JRA pilot now starts from a freshness-blocked reference candidate and requires fresh reviewed evidence.',
    'The JRA pilot now has closed input, confirmation, normalized-handoff, and operator-package boundaries but still requires fresh reviewed final evidence. The local-racing pilot starts from link-only C-level readiness and does not permit candidate generation.'
  ]
]);

replace('docs/calendar/implementation-roadmap.md', [
  ['Current Work ID: `WHR-CAL-DYNAMIC-DATES`  \nNext Work ID: `WHR-CAL-OPS-V1`', 'Current Work ID: `WHR-CAL-JAPAN-NAR`  \nNext Work ID: `WHR-CAL-JAPAN-BANEI`'],
  ['### JRA pilot — current', '### JRA pilot — implementation foundation complete'],
  [
    'Current Work ID: `WHR-CAL-JAPAN-JRA`  \nNext Work ID: `WHR-CAL-JAPAN-NAR`\n\nThe pilot must obtain a fresh reviewed JRA source fixture before candidate approval or promotion.',
    'Completed implementation Work ID: `WHR-CAL-JAPAN-JRA`  \nCurrent Work ID: `WHR-CAL-JAPAN-NAR`  \nNext Work ID: `WHR-CAL-JAPAN-BANEI`\n\nThe JRA implementation boundary is complete but still requires a fresh reviewed final fixture before candidate approval or promotion. The current regional local-racing pilot remains link-only at C and blocks candidate work until authority-specific timetable evidence supports a readiness change.'
  ],
  ['Status: current — JRA pilot', 'Status: current — regional local-racing link-only pilot']
]);

replace('docs/calendar/README.md', [
  [
    '- [`jra-final-review-package.md`](jra-final-review-package.md) — external final-fixture decision and optional normalized handoff package.\n',
    '- [`jra-final-review-package.md`](jra-final-review-package.md) — external final-fixture decision and optional normalized handoff package.\n- [`local-racing-link-only-pilot.md`](local-racing-link-only-pilot.md) — C-level link-only boundary and authority-specific activation blockers.\n'
  ],
  ['data/static/jra-final-program-intake.schema.json\n', 'data/static/jra-final-program-intake.schema.json\ndata/static/local-racing-pilot-control.json\n'],
  ['scripts/check-jra-review-package.mjs\n```', 'scripts/check-jra-review-package.mjs\nscripts/check-local-racing-pilot-foundation.mjs\n```']
]);

replace('docs/governance/document-authority.md', [
  ['- `docs/calendar/jra-final-normalized-handoff.md`\n', '- `docs/calendar/jra-final-normalized-handoff.md`\n- `docs/calendar/local-racing-link-only-pilot.md`\n'],
  ['- `data/static/jra-final-program-intake.schema.json`\n', '- `data/static/jra-final-program-intake.schema.json`\n- `data/static/local-racing-pilot-control.json`\n'],
  ['- `scripts/check-jra-final-normalized-handoff.mjs`\n', '- `scripts/check-jra-final-normalized-handoff.mjs`\n- `scripts/check-local-racing-pilot-foundation.mjs`\n']
]);

console.log('LOCAL_RACING_PILOT_INDEX_APPLIED');
