import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const write = (file, text) => fs.writeFileSync(file, text);
const replace = (file, pairs) => {
  let text = read(file);
  for (const [from, to] of pairs) {
    if (!text.includes(from)) throw new Error(`${file} missing marker: ${from.slice(0, 100)}`);
    text = text.replace(from, to);
  }
  write(file, text);
};

const pkg = JSON.parse(read('package.json'));
pkg.scripts.build = 'astro build';
pkg.scripts.check = pkg.scripts.check.replace(/^npm run merge:june-2026-manual-records && /, '');
if (!pkg.scripts.check.startsWith('npm run validate:calendar-baseline-reconciliation && ')) {
  pkg.scripts.check = `npm run validate:calendar-baseline-reconciliation && ${pkg.scripts.check}`;
}
if (!pkg.scripts['validate:calendar-baseline-reconciliation']) {
  const scripts = {};
  for (const [key, value] of Object.entries(pkg.scripts)) {
    scripts[key] = value;
    if (key === 'validate:data') scripts['validate:calendar-baseline-reconciliation'] = 'node scripts/check-calendar-baseline-reconciliation.mjs';
  }
  pkg.scripts = scripts;
}
write('package.json', `${JSON.stringify(pkg, null, 2)}\n`);

replace('docs/project-roadmap.md', [
  ['Current Work ID: `WHR-CAL-BASELINE-RECONCILE`', 'Current Work ID: `WHR-CAL-PIPELINE-V1`'],
  ['Next Work ID: `WHR-CAL-PIPELINE-V1`', 'Next Work ID: `WHR-CAL-DYNAMIC-DATES`'],
  ['The current product phase is baseline reconciliation. Existing Calendar schemas, registries, generated data, adapters, fixtures, promotion tools, display policies, fixed-date logic, seeds, and PR-specific scripts must be classified before pipeline v1 is activated.', 'The existing Calendar baseline has been classified in a reviewed migration map. The current product phase is pipeline v1: one bounded candidate envelope, human promotion, single canonical/public writers, runtime import guards, and grouped validation.'],
  ['## Phase 7 — reconcile the existing Calendar baseline\n\nStatus: current', '## Phase 7 — reconcile the existing Calendar baseline\n\nStatus: complete'],
  ['Classify schemas, registries, generated data, candidate paths, display policies, refresh commands, fixed dates, seed data, and PR-specific scripts as:\n\n```text\nretain\nrepair\nmigrate\nreplace\narchive\n```', 'Completed through the reviewed human-readable and machine-readable migration map:\n\n- 37 component groups classified as retain, repair, migrate, replace, or archive;\n- normal production build/check made read-only;\n- incomplete daily refresh schedule paused;\n- no broad deletion before provenance and assertion migration;\n- no Technical Rank, Public Ceiling, or readiness change.\n\nCanonical result:\n\n```text\ndocs/calendar/baseline-reconciliation-map.md\ndata/audits/calendar-baseline-migration-map.json\nscripts/check-calendar-baseline-reconciliation.mjs\n```'],
  ['## Phase 8 — activate the reviewed pipeline\n\n```text', '## Phase 8 — activate the reviewed pipeline\n\nStatus: current  \nCurrent Work ID: `WHR-CAL-PIPELINE-V1`\n\n```text'],
]);

let inventory = read('docs/runbooks/current-timetable-data-inventory.md');
inventory = inventory.replace(/^Status:.*$/m, 'Status: superseded by `WHR-CAL-BASELINE-RECONCILE`');
inventory = inventory.replace(/^Last updated:.*$/m, 'Last updated: 2026-07-01');
const notice = '> This PR-237 inventory is retained as historical evidence. Its statements about missing canonical/public layers are no longer current. The authoritative component decisions are `docs/calendar/baseline-reconciliation-map.md` and `data/audits/calendar-baseline-migration-map.json`.\n\n';
if (!inventory.includes(notice.trim())) {
  const at = inventory.indexOf('\n\n', inventory.indexOf('Last updated:')) + 2;
  inventory = inventory.slice(0, at) + notice + inventory.slice(at);
}
write('docs/runbooks/current-timetable-data-inventory.md', inventory);

replace('scripts/check-calendar-contracts.mjs', [
  ["[paths.roadmap, roadmapText, ['Country-page programme: complete', 'Current Work ID: `WHR-CAL-BASELINE-RECONCILE`']]", "[paths.roadmap, roadmapText, ['Country-page programme: complete', 'Current Work ID: `WHR-CAL-PIPELINE-V1`', 'WHR-CAL-BASELINE-RECONCILE']]"],
  ["[paths.startHere, startHereText, ['Previous completed Work ID: `WHR-AUDIT-COUNTRY-CALENDAR-98`', 'WHR-CAL-BASELINE-RECONCILE']]", "[paths.startHere, startHereText, ['Previous completed Work ID: `WHR-CAL-BASELINE-RECONCILE`', 'WHR-CAL-PIPELINE-V1', 'WHR-CAL-DYNAMIC-DATES']]"],
  ["console.log('CURRENT_WORK_ID: WHR-CAL-BASELINE-RECONCILE');\nconsole.log('NEXT_WORK_ID: WHR-CAL-PIPELINE-V1');", "console.log('CURRENT_WORK_ID: WHR-CAL-PIPELINE-V1');\nconsole.log('NEXT_WORK_ID: WHR-CAL-DYNAMIC-DATES');"],
]);

replace('scripts/check-project-governance-docs.mjs', [
  ["'docs/calendar/current-baseline-audit.md', 'docs/country-pages/completion-contract.md',", "'docs/calendar/current-baseline-audit.md', 'docs/calendar/baseline-reconciliation-map.md', 'docs/country-pages/completion-contract.md',"],
  ["'data/static/calendar-readiness-registry.json', 'docs/runbooks/final-country-calendar-audit-98.md'", "'data/static/calendar-readiness-registry.json', 'data/audits/calendar-baseline-migration-map.json', 'docs/runbooks/final-country-calendar-audit-98.md'"],
  ["for (const phrase of ['Previous completed Work ID: `WHR-AUDIT-COUNTRY-CALENDAR-98`', 'WHR-CAL-BASELINE-RECONCILE'])", "for (const phrase of ['Previous completed Work ID: `WHR-CAL-BASELINE-RECONCILE`', 'WHR-CAL-PIPELINE-V1', 'WHR-CAL-DYNAMIC-DATES'])"],
  ["for (const phrase of ['Country-page programme: complete', 'Current Work ID: `WHR-CAL-BASELINE-RECONCILE`', '98 EN + 98 JA = 196'])", "for (const phrase of ['Country-page programme: complete', 'Current Work ID: `WHR-CAL-PIPELINE-V1`', 'WHR-CAL-BASELINE-RECONCILE', '98 EN + 98 JA = 196'])"],
  ["console.log('CURRENT_WORK_ID: WHR-CAL-BASELINE-RECONCILE');", "console.log('CURRENT_WORK_ID: WHR-CAL-PIPELINE-V1');\nconsole.log('NEXT_WORK_ID: WHR-CAL-DYNAMIC-DATES');"],
]);

console.log('CALENDAR_BASELINE_RECONCILIATION_APPLIED');
