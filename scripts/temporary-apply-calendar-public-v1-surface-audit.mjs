import fs from 'node:fs';

function replaceRequired(file, before, after) {
  const current = fs.readFileSync(file, 'utf8');
  if (!current.includes(before)) throw new Error(`${file}: required synchronization anchor missing`);
  fs.writeFileSync(file, current.replace(before, after));
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

const contractsPath = 'scripts/check-calendar-contracts.mjs';
let contracts = fs.readFileSync(contractsPath, 'utf8');

contracts = contracts.replace(
  "  racecourses: 'data/static/racecourses.json',\n",
  "  racecourses: 'data/static/racecourses.json',\n  racecourseExtensions: 'data/static/racecourses-extensions.json',\n",
);
contracts = contracts.replace(
  "const racecourses = readJson(paths.racecourses);\n",
  "const racecourses = readJson(paths.racecourses);\nconst racecourseExtensions = readJson(paths.racecourseExtensions);\n",
);
contracts = contracts.replace(
  `const racecourseCountry = new Map();
if (!Array.isArray(racecourses)) fail(\`${'${paths.racecourses}'} must be an array.\`);
for (const record of racecourses ?? []) {
  if (isNonEmptyString(record?.id)) racecourseCountry.set(record.id, record.country_id);
}`,
  `const racecourseCountry = new Map();
for (const [file, records] of [
  [paths.racecourses, racecourses],
  [paths.racecourseExtensions, racecourseExtensions],
]) {
  if (!Array.isArray(records)) {
    fail(\`${'${file}'} must be an array.\`);
    continue;
  }
  for (const record of records) {
    if (!isNonEmptyString(record?.id)) continue;
    if (racecourseCountry.has(record.id)) fail(\`racecourse registries duplicate ${'${record.id}'}.\`);
    else racecourseCountry.set(record.id, record.country_id);
  }
}`,
);
contracts = contracts.replace(
  "  [paths.roadmap, roadmapText, ['Country-page programme: complete', 'Current Work ID: `WHR-CAL-JAPAN-NAR`', 'Next Work ID: `WHR-CAL-JAPAN-BANEI`', 'Completed Work ID: `WHR-CAL-OPS-V1`', 'WHR-CAL-BASELINE-RECONCILE']],\n  [paths.startHere, startHereText, ['Previous completed implementation Work ID: `WHR-CAL-JAPAN-JRA`', 'WHR-CAL-JAPAN-NAR', 'WHR-CAL-JAPAN-BANEI']],",
  "  [paths.roadmap, roadmapText, ['Country-page programme: complete', 'Completed Work ID: `WHR-CAL-JAPAN-NAR-A-PLUS`', 'Completed Work ID: `WHR-CAL-JAPAN-BANEI-A-PLUS`', 'Completed Work ID: `WHR-CAL-UAE-ERA`', 'Current Work ID: `WHR-CAL-PUBLIC-V1`', 'WHR-CAL-OPS-V1', 'WHR-CAL-BASELINE-RECONCILE']],\n  [paths.startHere, startHereText, ['Previous completed implementation Work ID: `WHR-CAL-JAPAN-JRA`', 'WHR-CAL-JAPAN-NAR', 'WHR-CAL-JAPAN-BANEI', 'Current Work ID: `WHR-CAL-PUBLIC-V1`']],",
);
contracts = contracts.replace(
  "console.log('CURRENT_WORK_ID: WHR-CAL-JAPAN-NAR');\nconsole.log('NEXT_WORK_ID: WHR-CAL-JAPAN-BANEI');",
  "console.log('CURRENT_WORK_ID: WHR-CAL-PUBLIC-V1');\nconsole.log('COMPLETED_SOURCE_WORK_ID: WHR-CAL-UAE-ERA');",
);
fs.writeFileSync(contractsPath, contracts);

replaceRequired(
  'docs/calendar/README.md',
  '- [`dynamic-dates-release-gate.md`](dynamic-dates-release-gate.md) — Dynamic Dates completion and Operations v1 boundary.\n',
  '- [`dynamic-dates-release-gate.md`](dynamic-dates-release-gate.md) — Dynamic Dates completion and Operations v1 boundary.\n- [`public-v1-surface-audit.md`](public-v1-surface-audit.md) — Calendar Public v1 Calendar/Today/Tomorrow shared-surface audit, validator reconciliation, bilingual parity, one-meeting-per-row boundary, and rendered fixture matrix.\n',
);
replaceRequired(
  'docs/calendar/README.md',
  'data/audits/calendar-dynamic-dates-release-gate.json\n',
  'data/audits/calendar-dynamic-dates-release-gate.json\ndata/audits/calendar-public-v1-surface-audit-v1.json\n',
);

replaceRequired(
  'docs/calendar/implementation-roadmap.md',
  'Status: active current programme work\nWork ID: `WHR-CAL-PUBLIC-V1`\n\nRelease criteria include:',
  'Status: active current programme work\nWork ID: `WHR-CAL-PUBLIC-V1`\nCurrent implementation unit: `PUBLIC-V1-SURFACE-AUDIT-01` — in review\n\nRelease criteria include:',
);
replaceRequired(
  'docs/calendar/implementation-roadmap.md',
  '- no participant, betting, result, payout, prediction, full-racecard, raw-source, embedded-video, or direct-stream output.\n\n## Later product stages',
  '- no participant, betting, result, payout, prediction, full-racecard, raw-source, embedded-video, or direct-stream output.\n\nCurrent Public v1 evidence unit:\n\n- Calendar, Today, and Tomorrow share explicit reference-date/timezone resolution;\n- English and Japanese routes use the shared `CalendarDateStatus` and `TimetableMeetingList`;\n- one meeting remains one list row;\n- C/B/B+/A/A+ list visibility and separate meeting-detail boundaries are checked;\n- reproducible current-window and stale-window rendered fixtures are validated;\n- automatic acquisition, approval, promotion, and unattended publication remain disabled.\n\n## Later product stages',
);

const readiness = readJson('data/static/calendar-readiness-registry.json');
const uaeReadiness = readiness.records.find((record) => record.readiness_id === 'united-arab-emirates--uae-national-racing-system--era-season-calendar');
if (!uaeReadiness) throw new Error('UAE Calendar Readiness record missing');
uaeReadiness.evidence_reviewed_at = '2026-07-11';
uaeReadiness.limitations = [
  'C-level meeting date and approved racecourse identity only. No race-time or programme-detail claim. PDF fixture-window extraction is review-only and automatic execution/publication remain disabled.',
];
writeJson('data/static/calendar-readiness-registry.json', readiness);

const racecourses = readJson('data/static/racecourses.json');
const canonicalIds = new Set(racecourses.map((record) => record.id));
const extensions = readJson('data/static/racecourses-extensions.json')
  .filter((record) => !canonicalIds.has(record.id))
  .map((record) => ({
    ...record,
    direction: record.direction ?? 'unknown',
  }));
writeJson('data/static/racecourses-extensions.json', extensions);

console.log('CALENDAR_PUBLIC_V1_SURFACE_AUDIT_SYNC: applied');
console.log(`RACECOURSE_CANONICAL_COUNT: ${racecourses.length}`);
console.log(`RACECOURSE_EXTENSION_COUNT: ${extensions.length}`);
console.log('UAE_READINESS_SCHEMA_RECONCILED: true');
