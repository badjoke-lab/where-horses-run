import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const write = (file, text) => fs.writeFileSync(file, text);
const replace = (file, pairs) => {
  let text = read(file);
  for (const [from, to] of pairs) {
    if (!text.includes(from)) throw new Error(`${file} missing replacement marker: ${from.slice(0, 100)}`);
    text = text.replace(from, to);
  }
  write(file, text);
};

const packageJson = JSON.parse(read('package.json'));
packageJson.scripts.build = 'astro build';
packageJson.scripts.check = packageJson.scripts.check
  .replace(/^npm run merge:june-2026-manual-records && /, '')
  .replace(/^/, 'npm run validate:calendar-baseline-reconciliation && ');
const scripts = {};
for (const [key, value] of Object.entries(packageJson.scripts)) {
  scripts[key] = value;
  if (key === 'validate:data') scripts['validate:calendar-baseline-reconciliation'] = 'node scripts/check-calendar-baseline-reconciliation.mjs';
}
packageJson.scripts = scripts;
write('package.json', `${JSON.stringify(packageJson, null, 2)}\n`);

write('docs/calendar/current-baseline-audit.md', "# Current Calendar baseline audit\n\nStatus: reconciled  \nWork ID: `WHR-CAL-BASELINE-RECONCILE`  \nReviewed against main: `d3de6114cb3d9a2dc1b2c625678ec4557c38c595`  \nLast reviewed: 2026-07-01\n\n## Conclusion\n\nWhere Horses Run already contains substantial Calendar contracts, research evidence, fixtures, adapter interfaces, candidate generators, canonical/public data models, publication policy, list/detail views, and source-specific experiments. It is not a greenfield implementation.\n\nIt is also not a maintained public Calendar pipeline yet. Multiple generations of code coexist, normal build/check previously mutated June 2026 generated data, source-specific scripts can write canonical/public files directly, Today/Tomorrow retains a fixed June fallback, and the shared scheduled refresh core reports `skeleton_no_live_fetch`.\n\nThe reviewed component-level decision is now recorded in:\n\n- [`baseline-reconciliation-map.md`](baseline-reconciliation-map.md)\n- [`../../data/audits/calendar-baseline-migration-map.json`](../../data/audits/calendar-baseline-migration-map.json)\n- `scripts/check-calendar-baseline-reconciliation.mjs`\n\n## Capabilities retained\n\n- Source Test v2 and Calendar Readiness contracts.\n- Canonical authority/source and readiness registries.\n- C / B / B+ / A / A+ rank and public-ceiling separation.\n- Field-level A+ publication policy.\n- Canonical meeting and meeting-detail types.\n- Public meeting-list and meeting-detail view models.\n- Bounded fixture/parser harness and adapter interfaces.\n- Candidate/review/promotion separation as the governing flow.\n- Public-safe source tests and manual snapshot contracts.\n- Meeting detail and scoped list routes.\n\n## Critical gaps\n\n### Multiple writers\n\nLegacy canonical builders, JRA/HKJC refresh scripts, June seed merging, public projection wrappers, and snapshot application do not yet have one clear write-ownership model. Pipeline v1 must enforce:\n\n```text\nadapter -> candidate only\nhuman promotion -> canonical only\npublic projection -> public JSON only\npages -> public JSON read only\nnormal build -> repository read only\n```\n\n### Fixed dates and historical seeds\n\nJune 2026 manual records, hard-coded JRA/HKJC sample meetings, and a fixed runtime fallback remain. These are migration evidence, not a current-date implementation.\n\n### Skeleton operations\n\nThe refresh core writes reports and empty current data while explicitly declaring that no live fetch is implemented. The daily cron is therefore paused. Manual review dispatch remains available, but scheduling must not return until `WHR-CAL-OPS-V1`.\n\n### Parallel runtime paths\n\nPublic view models exist, but legacy seed imports and normalized preview/detail modules remain. Production pages must converge on public meeting-list and meeting-details only.\n\n### Milestone-specific validation\n\nMany PR-number scripts and workflows preserve useful assertions but obscure active contract coverage. They are archived only after each continuing assertion has a named grouped replacement.\n\n## Immediate safeguards\n\nThis reconciliation removes the June merge from normal `build` and `check`, making production build read-only. It also removes the schedule trigger from the incomplete refresh workflow.\n\nNo canonical/public data, source capability, Technical Rank, Public Ceiling, or Calendar Readiness decision is changed by these safeguards.\n\n## Next phase\n\nCurrent Work ID: `WHR-CAL-PIPELINE-V1`\n\nThe next phase implements one shared candidate envelope, one human promotion path, one canonical writer, deterministic public projection, import guards, grouped validation, and a fixture-backed reference adapter. Dynamic dates and operations follow as separate Work IDs.\n");

let inventory = read('docs/runbooks/current-timetable-data-inventory.md');
inventory = inventory.replace(/^Status:.*$/m, 'Status: superseded by `WHR-CAL-BASELINE-RECONCILE`');
inventory = inventory.replace(/^Last updated:.*$/m, 'Last updated: 2026-07-01');
const inventoryNotice = '> This PR-237 inventory is retained as historical evidence. Its statements about missing canonical/public layers are no longer current. The authoritative component decisions are `docs/calendar/baseline-reconciliation-map.md` and `data/audits/calendar-baseline-migration-map.json`.\n\n';
const inventoryInsert = inventory.indexOf('\n\n', inventory.indexOf('Last updated:')) + 2;
inventory = inventory.slice(0, inventoryInsert) + inventoryNotice + inventory.slice(inventoryInsert);
write('docs/runbooks/current-timetable-data-inventory.md', inventory);

replace('docs/calendar/README.md', [
  ['Last reviewed: 2026-06-28', 'Last reviewed: 2026-07-01'],
  ['- [`current-baseline-audit.md`](current-baseline-audit.md) — current repository capabilities and gaps.', '- [`current-baseline-audit.md`](current-baseline-audit.md) — reconciled repository capabilities and gaps.\n- [`baseline-reconciliation-map.md`](baseline-reconciliation-map.md) — reviewed retain/repair/migrate/replace/archive decisions and execution order.'],
  ['data/static/calendar-readiness-registry.json\nscripts/check-calendar-contracts.mjs', 'data/static/calendar-readiness-registry.json\ndata/audits/calendar-baseline-migration-map.json\nscripts/check-calendar-contracts.mjs\nscripts/check-calendar-baseline-reconciliation.mjs'],
  ['The registry begins empty with `pending_backfill_01_52`. This is an explicit bootstrap state, not a claim that reviewed countries lack racing or official sources.', 'The readiness registry contains the 116 reviewed system/source decisions consolidated by the final 98-country audit. The baseline migration map governs how existing Calendar implementation is retained, repaired, migrated, replaced, or archived.'],
]);

replace('START-HERE.md', [
  ['9. [`docs/calendar/current-baseline-audit.md`](docs/calendar/current-baseline-audit.md)', '9. [`docs/calendar/current-baseline-audit.md`](docs/calendar/current-baseline-audit.md)\n10. [`docs/calendar/baseline-reconciliation-map.md`](docs/calendar/baseline-reconciliation-map.md)'],
  ['data/static/calendar-readiness-registry.json\nscripts/check-calendar-contracts.mjs', 'data/static/calendar-readiness-registry.json\ndata/audits/calendar-baseline-migration-map.json\nscripts/check-calendar-contracts.mjs\nscripts/check-calendar-baseline-reconciliation.mjs'],
  ['Previous completed Work ID: `WHR-AUDIT-COUNTRY-CALENDAR-98`', 'Previous completed Work ID: `WHR-CAL-BASELINE-RECONCILE`'],
  ['Current Work ID:\n\n```text\nWHR-CAL-BASELINE-RECONCILE\n```', 'Current Work ID:\n\n```text\nWHR-CAL-PIPELINE-V1\n```'],
  ['Next Work ID:\n\n```text\nWHR-CAL-PIPELINE-V1\n```', 'Next Work ID:\n\n```text\nWHR-CAL-DYNAMIC-DATES\n```'],
  ['The 98-country bilingual page programme is complete at 98 English and 98 Japanese routes. The active task is to reconcile the existing Calendar baseline before pipeline v1 is activated.', 'The 98-country bilingual page programme and Calendar baseline reconciliation are complete. The active task is to implement the reviewed pipeline v1 without activating unattended publication.'],
]);

replace('docs/project-roadmap.md', [
  ['Current Work ID: `WHR-CAL-BASELINE-RECONCILE`', 'Current Work ID: `WHR-CAL-PIPELINE-V1`'],
  ['Next Work ID: `WHR-CAL-PIPELINE-V1`', 'Next Work ID: `WHR-CAL-DYNAMIC-DATES`'],
  ['The current product phase is baseline reconciliation. Existing Calendar schemas, registries, generated data, adapters, fixtures, promotion tools, display policies, fixed-date logic, seeds, and PR-specific scripts must be classified before pipeline v1 is activated.', 'The existing Calendar baseline has been classified in a reviewed migration map. The current product phase is pipeline v1: one bounded candidate envelope, human promotion, single canonical/public writers, runtime import guards, and grouped validation.'],
  ['## Phase 7 — reconcile the existing Calendar baseline\n\nStatus: current', '## Phase 7 — reconcile the existing Calendar baseline\n\nStatus: complete'],
  ['Classify schemas, registries, generated data, candidate paths, display policies, refresh commands, fixed dates, seed data, and PR-specific scripts as:\n\n```text\nretain\nrepair\nmigrate\nreplace\narchive\n```', 'Completed through the reviewed human-readable and machine-readable migration map:\n\n- 37 component groups classified as retain, repair, migrate, replace, or archive;\n- normal production build/check made read-only;\n- incomplete daily refresh schedule paused;\n- no broad deletion before provenance and assertion migration;\n- no Technical Rank, Public Ceiling, or readiness change.\n\nCanonical result:\n\n```text\ndocs/calendar/baseline-reconciliation-map.md\ndata/audits/calendar-baseline-migration-map.json\nscripts/check-calendar-baseline-reconciliation.mjs\n```'],
  ['## Phase 8 — activate the reviewed pipeline\n\n```text', '## Phase 8 — activate the reviewed pipeline\n\nStatus: current  \nCurrent Work ID: `WHR-CAL-PIPELINE-V1`\n\n```text'],
]);

replace('docs/calendar/implementation-roadmap.md', [
  ['## Stage 4 — existing baseline reconciliation\n\nStatus: current', '## Stage 4 — existing baseline reconciliation\n\nStatus: complete'],
  ['Produce a reviewed migration map before broad deletion or replacement.', 'Completed outputs:\n\n- `docs/calendar/baseline-reconciliation-map.md`;\n- `data/audits/calendar-baseline-migration-map.json`;\n- `scripts/check-calendar-baseline-reconciliation.mjs`;\n- read-only normal build/check;\n- paused incomplete daily refresh schedule.\n\nBroad deletion remains prohibited until provenance and assertion migration is complete.'],
  ['## Stage 5 — pipeline v1\n\nWork IDs:', '## Stage 5 — pipeline v1\n\nStatus: current  \nCurrent Work ID: `WHR-CAL-PIPELINE-V1`\n\nWork IDs:'],
]);

replace('docs/governance/document-authority.md', [
  ['Last reviewed: 2026-06-28', 'Last reviewed: 2026-07-01'],
  ['- `docs/calendar/implementation-roadmap.md`', '- `docs/calendar/implementation-roadmap.md`\n- `docs/calendar/baseline-reconciliation-map.md`'],
  ['- `data/static/authority-source-inventory.json`\n- `scripts/check-calendar-contracts.mjs`', '- `data/static/authority-source-inventory.json`\n- `data/audits/calendar-baseline-migration-map.json`\n- `scripts/check-calendar-contracts.mjs`\n- `scripts/check-calendar-baseline-reconciliation.mjs`'],
]);

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
