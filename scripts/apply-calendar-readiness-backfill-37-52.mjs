import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const root = process.cwd();
const resolve = (relativePath) => path.join(root, relativePath);

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(resolve(relativePath), 'utf8'));
}

function writeJson(relativePath, value) {
  fs.writeFileSync(resolve(relativePath), `${JSON.stringify(value, null, 2)}\n`);
}

function decodeRecords(relativePath) {
  const encoded = fs.readFileSync(resolve(relativePath), 'utf8').trim();
  const decoded = zlib.inflateSync(Buffer.from(encoded, 'base64')).toString('utf8');
  const parsed = JSON.parse(decoded);
  if (Array.isArray(parsed)) return parsed;
  if (Array.isArray(parsed?.records)) return parsed.records;
  throw new Error(`${relativePath} must decode to an array or an object with records[]`);
}

function replaceRequired(relativePath, before, after, expectedCount = 1) {
  const absolutePath = resolve(relativePath);
  const original = fs.readFileSync(absolutePath, 'utf8');
  const actualCount = original.split(before).length - 1;
  if (actualCount !== expectedCount) {
    throw new Error(`${relativePath}: expected ${expectedCount} occurrence(s), found ${actualCount}: ${before}`);
  }
  fs.writeFileSync(absolutePath, original.split(before).join(after));
}

const authorityPath = 'data/static/authority-source-inventory.json';
const registryPath = 'data/static/calendar-readiness-registry.json';
const authorityTmp = '.tmp/calendar-readiness-authority-additions-37-52.zlib.b64';
const readinessTmp = '.tmp/calendar-readiness-record-additions-37-52.zlib.b64';

const authorityInventory = readJson(authorityPath);
const registry = readJson(registryPath);
const authorityAdditions = decodeRecords(authorityTmp);
const readinessAdditions = decodeRecords(readinessTmp);

if (authorityInventory.records.length !== 52) throw new Error(`Expected 52 existing authority records; found ${authorityInventory.records.length}`);
if (registry.records.length !== 51) throw new Error(`Expected 51 existing readiness records; found ${registry.records.length}`);
if (authorityAdditions.length !== 18) throw new Error(`Expected 18 authority additions; found ${authorityAdditions.length}`);
if (readinessAdditions.length !== 19) throw new Error(`Expected 19 readiness additions; found ${readinessAdditions.length}`);

const authorityKey = (record) => `${record.country_id}/${record.authority_id}/${record.official_source_id}`;
const existingAuthorityKeys = new Set(authorityInventory.records.map(authorityKey));
for (const record of authorityAdditions) {
  const key = authorityKey(record);
  if (existingAuthorityKeys.has(key)) throw new Error(`Duplicate authority/source key: ${key}`);
  existingAuthorityKeys.add(key);
}

const existingReadinessIds = new Set(registry.records.map((record) => record.readiness_id));
for (const record of readinessAdditions) {
  if (existingReadinessIds.has(record.readiness_id)) throw new Error(`Duplicate readiness_id: ${record.readiness_id}`);
  existingReadinessIds.add(record.readiness_id);
}

authorityInventory.records.push(...authorityAdditions);
registry.records.push(...readinessAdditions);
registry.bootstrap_status = 'complete_01_52';
registry.programme_state = {
  country_target: 98,
  countries_with_closed_decision: 52,
  readiness_records: 70,
  next_backfill_work_ids: [],
};

if (authorityInventory.records.length !== 70) throw new Error('Final authority inventory must contain 70 records');
if (registry.records.length !== 70) throw new Error('Final readiness registry must contain 70 records');

writeJson(authorityPath, authorityInventory);
writeJson(registryPath, registry);

replaceRequired(
  'START-HERE.md',
  'Current Work ID:\n\n```text\nWHR-CAL-BACKFILL-37-52\n```\n\nNext Work ID:\n\n```text\nWHR-CP-PROFILE-45-52\n```',
  'Current Work ID:\n\n```text\nWHR-CP-PROFILE-45-52\n```\n\nNext Work ID:\n\n```text\nWHR-CP-PUB-45-52\n```'
);

replaceRequired('docs/project-roadmap.md', 'Current Work ID: `WHR-CAL-BACKFILL-37-52`', 'Current Work ID: `WHR-CP-PROFILE-45-52`', 2);
replaceRequired('docs/project-roadmap.md', 'Next Work ID: `WHR-CP-PROFILE-45-52`', 'Next Work ID: `WHR-CP-PUB-45-52`');
replaceRequired(
  'docs/project-roadmap.md',
  '- Calendar Readiness decisions are closed for entries 01-36; entries 37-52 remain to be backfilled.',
  '- Calendar Readiness decisions are closed for entries 01-52, covering 52 countries and 70 system/source records.'
);
replaceRequired(
  'docs/project-roadmap.md',
  '- `WHR-CAL-BACKFILL-21-36` via PR #322 with 16 additional countries and 21 additional system/source records.\n\nCurrent Work ID: `WHR-CP-PROFILE-45-52`',
  '- `WHR-CAL-BACKFILL-21-36` via PR #322 with 16 additional countries and 21 additional system/source records.\n- `WHR-CAL-BACKFILL-37-52` via PR #323 with 16 additional countries and 19 additional system/source records.\n\nCalendar Readiness backfill 01-52 is complete.\n\nCurrent Work ID: `WHR-CP-PROFILE-45-52`'
);

replaceRequired('docs/country-pages/programme-roadmap.md', 'Last roadmap review: 2026-06-28', 'Last roadmap review: 2026-06-29');
replaceRequired(
  'docs/country-pages/programme-roadmap.md',
  'Latest confirmed merge: PR #322\nPublication gate: PR #319 — entries 37-44 published after approved rendered preview\nCurrent Work ID: WHR-CAL-BACKFILL-37-52\nNext working branch: calendar-readiness-backfill-37-52',
  'Latest completed Calendar Readiness change: PR #323\nPublication gate: PR #319 — entries 37-44 published after approved rendered preview\nCurrent Work ID: WHR-CP-PROFILE-45-52\nNext working branch: country-profiles-45-52'
);
replaceRequired(
  'docs/country-pages/programme-roadmap.md',
  'PR #322 closes Calendar Readiness decisions for entries 21-36, bringing the cumulative state to 36 countries and 51 system/source records. Entries 37-52 are the active Readiness backfill, and Profile v2 work for entries 45-52 remains queued.',
  'PR #323 completes Calendar Readiness decisions for entries 37-52, bringing the cumulative state to 52 countries and 70 system/source records. Profile v2 work for entries 45-52 is now active.'
);
replaceRequired(
  'docs/country-pages/programme-roadmap.md',
  '| #322 | Calendar Readiness | Closed entries 21-36 with 21 additional system/source decisions; implementation remains not started. |',
  '| #322 | merged | Closed entries 21-36 with 21 additional system/source decisions; implementation remains not started. |\n| #323 | Calendar Readiness | Completes entries 37-52 with 19 additional system/source decisions; implementation remains not started. |'
);
replaceRequired(
  'docs/country-pages/programme-roadmap.md',
  '| #314 | next | Add Profile v2 records and reach `profile_ready`. |\n| #315 | planned | QA and publish sixteen routes after one final rendered preview. |',
  '| `WHR-CP-PROFILE-45-52` | next | Add Profile v2 records and reach `profile_ready`. |\n| `WHR-CP-PUB-45-52` | planned | QA and publish sixteen routes after one final rendered preview. |'
);

replaceRequired('docs/runbooks/calendar-readiness-backfill-37-52.md', 'Status: in progress', 'Status: complete');
replaceRequired(
  'docs/runbooks/calendar-readiness-backfill-37-52.md',
  'Italy, Norway, and Switzerland retain separate racing systems. Partial national coverage remains explicitly scoped. Technical Rank does not raise Public Ceiling. No active acquisition implementation is claimed.',
  'Italy, Norway, and Switzerland retain separate racing systems. Partial national coverage remains explicitly scoped. Technical Rank does not raise Public Ceiling. No active acquisition implementation is claimed. Calendar Readiness backfill 01-52 is complete.'
);

replaceRequired(
  'scripts/check-calendar-contracts.mjs',
  "requireAllowed(registry?.bootstrap_status, ['pending_backfill_01_52', 'backfill_in_progress', 'source_test_v2_active', 'complete'], `${paths.registry}.bootstrap_status`);\nif (!isPlainObject(registry?.programme_state)) fail(`${paths.registry}.programme_state must be an object.`);\nif (registry?.programme_state?.country_target !== 98) fail(`${paths.registry}.programme_state.country_target must be 98.`);\nrequireStringArray(registry?.programme_state?.next_backfill_work_ids, `${paths.registry}.programme_state.next_backfill_work_ids`, { allowEmpty: false });",
  "requireAllowed(registry?.bootstrap_status, ['pending_backfill_01_52', 'backfill_in_progress', 'complete_01_52', 'source_test_v2_active', 'complete'], `${paths.registry}.bootstrap_status`);\nif (!isPlainObject(registry?.programme_state)) fail(`${paths.registry}.programme_state must be an object.`);\nif (registry?.programme_state?.country_target !== 98) fail(`${paths.registry}.programme_state.country_target must be 98.`);\nconst nextBackfillWorkIds = requireStringArray(registry?.programme_state?.next_backfill_work_ids, `${paths.registry}.programme_state.next_backfill_work_ids`);\nif (registry?.bootstrap_status === 'complete_01_52' && nextBackfillWorkIds.length !== 0) fail(`${paths.registry}.programme_state.next_backfill_work_ids must be empty after 01-52 completion.`);\nif (registry?.bootstrap_status !== 'complete_01_52' && nextBackfillWorkIds.length === 0) fail(`${paths.registry}.programme_state.next_backfill_work_ids must not be empty before 01-52 completion.`);"
);
replaceRequired(
  'scripts/check-calendar-contracts.mjs',
  "[paths.roadmap, roadmapText, ['Current Work ID: `WHR-CAL-BACKFILL-37-52`', 'Next Work ID: `WHR-CP-PROFILE-45-52`']],\n  [paths.startHere, startHereText, ['WHR-CAL-BACKFILL-37-52', 'WHR-CP-PROFILE-45-52']],",
  "[paths.roadmap, roadmapText, ['Current Work ID: `WHR-CP-PROFILE-45-52`', 'Next Work ID: `WHR-CP-PUB-45-52`']],\n  [paths.startHere, startHereText, ['WHR-CP-PROFILE-45-52', 'WHR-CP-PUB-45-52']],"
);
replaceRequired('scripts/check-calendar-contracts.mjs', "console.log('CURRENT_WORK_ID: WHR-CAL-BACKFILL-37-52');\nconsole.log('NEXT_WORK_ID: WHR-CP-PROFILE-45-52');", "console.log('CURRENT_WORK_ID: WHR-CP-PROFILE-45-52');\nconsole.log('NEXT_WORK_ID: WHR-CP-PUB-45-52');");

replaceRequired(
  'scripts/check-project-governance-docs.mjs',
  "'Current Work ID: `WHR-CAL-BACKFILL-37-52`',\n    'Next Work ID: `WHR-CP-PROFILE-45-52`',",
  "'Current Work ID: `WHR-CP-PROFILE-45-52`',\n    'Next Work ID: `WHR-CP-PUB-45-52`',"
);
replaceRequired(
  'scripts/check-project-governance-docs.mjs',
  "'START-HERE.md': ['WHR-CAL-BACKFILL-37-52', 'WHR-CP-PROFILE-45-52', 'calendar-readiness-registry.json'],",
  "'START-HERE.md': ['WHR-CP-PROFILE-45-52', 'WHR-CP-PUB-45-52', 'calendar-readiness-registry.json'],"
);
replaceRequired(
  'scripts/check-project-governance-docs.mjs',
  "'data/static/calendar-readiness-registry.json': [\n    'backfill_in_progress',\n    'WHR-CAL-BACKFILL-37-52',\n  ],",
  "'data/static/calendar-readiness-registry.json': [\n    'complete_01_52',\n    '\"countries_with_closed_decision\": 52',\n    '\"next_backfill_work_ids\": []',\n  ],"
);
replaceRequired('scripts/check-project-governance-docs.mjs', "console.log('CURRENT_WORK_ID: WHR-CAL-BACKFILL-37-52');\nconsole.log('NEXT_WORK_ID: WHR-CP-PROFILE-45-52');", "console.log('CURRENT_WORK_ID: WHR-CP-PROFILE-45-52');\nconsole.log('NEXT_WORK_ID: WHR-CP-PUB-45-52');");

replaceRequired(
  'scripts/check-country-page-programme-roadmap.mjs',
  'for (const pr of [284, 311, 316, 317, 319, 321, 322, 340]) {',
  'for (const pr of [284, 311, 316, 317, 319, 321, 322, 323, 340]) {'
);
replaceRequired(
  'scripts/check-country-page-programme-roadmap.mjs',
  "'Current Work ID: WHR-CAL-BACKFILL-37-52',\n  'Next working branch: calendar-readiness-backfill-37-52',\n  'Latest confirmed merge: PR #322',",
  "'Current Work ID: WHR-CP-PROFILE-45-52',\n  'Next working branch: country-profiles-45-52',\n  'Latest completed Calendar Readiness change: PR #323',"
);
replaceRequired('scripts/check-country-page-programme-roadmap.mjs', "console.log('KEY_PRS: 284,311,316,317,319,321,322,340');\nconsole.log('CURRENT_WORK: entries 01-36 readiness closed; current Work ID WHR-CAL-BACKFILL-37-52');", "console.log('KEY_PRS: 284,311,316,317,319,321,322,323,340');\nconsole.log('CURRENT_WORK: entries 01-52 readiness closed; current Work ID WHR-CP-PROFILE-45-52');");

fs.rmSync(resolve(authorityTmp));
fs.rmSync(resolve(readinessTmp));

console.log('APPLIED_CALENDAR_READINESS_BACKFILL_37_52 authority=70 readiness=70 countries=52');
