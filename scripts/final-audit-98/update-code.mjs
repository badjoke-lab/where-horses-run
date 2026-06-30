import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const write = (file, content) => fs.writeFileSync(path.join(root, file), content);

function listFiles(directory) {
  const absolute = path.join(root, directory);
  if (!fs.existsSync(absolute)) return [];
  const output = [];
  for (const entry of fs.readdirSync(absolute)) {
    const relative = path.join(directory, entry).replaceAll('\\', '/');
    const absoluteEntry = path.join(root, relative);
    if (fs.statSync(absoluteEntry).isDirectory()) output.push(...listFiles(relative));
    else output.push(relative);
  }
  return output;
}

const legacyPatterns = [
  /^check-country-page-publication-\d{2}-\d{2}\.mjs$/,
  /^check-country-profiles-\d{2}-\d{2}\.mjs$/,
  /^check-country-notes-\d{2}-\d{2}\.mjs$/,
  /^check-source-test-v2-\d{2}-\d{2}\.mjs$/
];
const legacyExclusions = new Set(['check-country-page-publication-93-98.mjs']);
const legacyGuard = `import { readFileSync as auditReadFileSync } from 'node:fs';
const auditTrackerLines = auditReadFileSync('docs/country-pages/98-country-tracker.tsv', 'utf8').trimEnd().split(/\\r?\\n/);
const auditStatusIndex = auditTrackerLines[0].split('\\t').indexOf('programme_status');
const auditCanonicalComplete = auditTrackerLines.slice(1).every((line) => line.split('\\t')[auditStatusIndex] === 'published');
if (auditCanonicalComplete && process.env.WHR_RUN_LEGACY_WAVE_VALIDATORS !== '1') {
  console.log('LEGACY_WAVE_VALIDATOR_ARCHIVED_AFTER_WHR_AUDIT_98');
  process.exit(0);
}

`;

for (const file of listFiles('scripts')) {
  const name = path.basename(file);
  if (!legacyPatterns.some((pattern) => pattern.test(name)) || legacyExclusions.has(name)) continue;
  const text = read(file);
  if (!text.includes('LEGACY_WAVE_VALIDATOR_ARCHIVED_AFTER_WHR_AUDIT_98')) write(file, `${legacyGuard}${text}`);
}

let programme = read('scripts/check-country-page-programme.mjs');
programme = programme.replace(/const publishedSlugs = \[[\s\S]*?\n\];/, "const publishedSlugs = rows.map((row) => row.slug);");
programme = programme.replace(
  /for \(const \[status, expected\] of Object\.entries\(\{[\s\S]*?\}\)\) \{\n  if \(\(counts\[status\] \?\? 0\) !== expected\) fail\(`tracker must contain \$\{expected\} \$\{status\} rows; found \$\{counts\[status\] \?\? 0\}`\);\n\}/,
  "for (const [status, expected] of Object.entries({ published: 98, profile_ready: 0, source_tested: 0, note_reviewed: 0, page_qa: 0, not_started: 0 })) {\n  if ((counts[status] ?? 0) !== expected) fail(`tracker must contain ${expected} ${status} rows; found ${counts[status] ?? 0}`);\n}"
);
programme = programme.replace(
  "console.log('PROGRAMME_COUNTS: published=68 page_qa=0 profile_ready=8 source_tested=0 note_reviewed=0 not_started=22');",
  "console.log('PROGRAMME_COUNTS: published=98 page_qa=0 profile_ready=0 source_tested=0 note_reviewed=0 not_started=0');"
);
write('scripts/check-country-page-programme.mjs', programme);

write('scripts/check-country-page-programme-roadmap.mjs', `import fs from 'node:fs';

const roadmap = fs.readFileSync('docs/country-pages/programme-roadmap.md', 'utf8');
const tracker = fs.readFileSync('docs/country-pages/98-country-tracker.tsv', 'utf8').trimEnd().split(/\\r?\\n/);
const headers = tracker[0].split('\\t');
const statusIndex = headers.indexOf('programme_status');
const rows = tracker.slice(1).map((line) => line.split('\\t'));
const errors = [];
if (rows.length !== 98) errors.push('tracker row count must be 98');
if (rows.some((row) => row[statusIndex] !== 'published')) errors.push('all tracker rows must be published');
for (const phrase of ['Status: complete canonical roadmap', 'Completed Work ID: WHR-AUDIT-98', 'published:       98', 'bilingual routes exactly 196', 'PR #356']) {
  if (!roadmap.includes(phrase)) errors.push('missing roadmap phrase: ' + phrase);
}
if (errors.length) {
  for (const error of errors) console.error('ERROR: ' + error);
  process.exit(1);
}
console.log('COUNTRY_PAGE_PROGRAMME_ROADMAP_VALID');
console.log('COUNTRY_PAGE_PROGRAMME_COMPLETE: 98 countries / 196 routes');
`);

let calendarCheck = read('scripts/check-calendar-contracts.mjs');
calendarCheck = calendarCheck.replace(
  "requireStringArray(registry?.programme_state?.next_backfill_work_ids, `${paths.registry}.programme_state.next_backfill_work_ids`, { allowEmpty: false });",
  "const nextBackfillWorkIds = requireStringArray(registry?.programme_state?.next_backfill_work_ids, `${paths.registry}.programme_state.next_backfill_work_ids`);\nif (registry?.bootstrap_status === 'complete' && nextBackfillWorkIds.length !== 0) fail(`${paths.registry}.programme_state.next_backfill_work_ids must be empty when complete.`);\nif (registry?.bootstrap_status !== 'complete' && nextBackfillWorkIds.length === 0) fail(`${paths.registry}.programme_state.next_backfill_work_ids must not be empty before completion.`);"
);
calendarCheck = calendarCheck.replace(
  "[paths.roadmap, roadmapText, ['Current Work ID: `WHR-PUB-69-76`', 'Next Work ID: `WHR-ST2-77-84`']],",
  "[paths.roadmap, roadmapText, ['Country-page programme: complete', 'Current Work ID: `WHR-CALENDAR-MAINTENANCE`']],"
);
calendarCheck = calendarCheck.replace(
  "[paths.startHere, startHereText, ['WHR-PROFILE-69-76', 'WHR-PUB-69-76', 'WHR-ST2-77-84']],",
  "[paths.startHere, startHereText, ['Previous completed Work ID: `WHR-AUDIT-98`', 'WHR-CALENDAR-MAINTENANCE']],"
);
calendarCheck = calendarCheck.replace(
  "console.log('CURRENT_WORK_ID: WHR-PUB-69-76');",
  "console.log('CURRENT_WORK_ID: WHR-CALENDAR-MAINTENANCE');"
);
calendarCheck = calendarCheck.replace(
  "console.log('NEXT_WORK_ID: WHR-ST2-77-84');",
  "console.log('COUNTRY_PAGE_PROGRAMME: complete');"
);
write('scripts/check-calendar-contracts.mjs', calendarCheck);

write('scripts/check-project-governance-docs.mjs', `import fs from 'node:fs';

const errors = [];
const files = [
  'START-HERE.md', 'docs/project-roadmap.md', 'docs/governance/document-authority.md',
  'docs/governance/internal-source-handling.md', 'docs/calendar/README.md',
  'docs/calendar/source-test-v2-contract.md', 'docs/calendar/calendar-readiness-contract.md',
  'docs/calendar/machine-readable-contracts.md', 'docs/calendar/implementation-roadmap.md',
  'docs/calendar/current-baseline-audit.md', 'docs/country-pages/completion-contract.md',
  'data/static/source-test-v2.schema.json', 'data/static/calendar-readiness.schema.json',
  'data/static/calendar-readiness-registry.json', 'docs/runbooks/final-country-calendar-audit-98.md'
];
for (const file of files) if (!fs.existsSync(file)) errors.push('missing: ' + file);
const start = fs.readFileSync('START-HERE.md', 'utf8');
const roadmap = fs.readFileSync('docs/project-roadmap.md', 'utf8');
const registry = fs.readFileSync('data/static/calendar-readiness-registry.json', 'utf8');
for (const phrase of ['Previous completed Work ID: \\`WHR-AUDIT-98\\`', 'WHR-CALENDAR-MAINTENANCE']) if (!start.includes(phrase)) errors.push('START-HERE missing ' + phrase);
for (const phrase of ['Country-page programme: complete', 'Current Work ID: \\`WHR-CALENDAR-MAINTENANCE\\`', '98 EN + 98 JA = 196']) if (!roadmap.includes(phrase)) errors.push('roadmap missing ' + phrase);
for (const phrase of ['\"bootstrap_status\": \"complete\"', '\"countries_with_closed_decision\": 98', '\"readiness_records\": 116', '\"next_backfill_work_ids\": []']) if (!registry.includes(phrase)) errors.push('registry missing ' + phrase);
if (errors.length) {
  for (const error of errors) console.error('ERROR: ' + error);
  process.exit(1);
}
console.log('PROJECT_GOVERNANCE_DOCS_VALID');
console.log('CURRENT_WORK_ID: WHR-CALENDAR-MAINTENANCE');
`);

let mergeScript = read('scripts/merge-pr-130-manual-june-records.mjs');
mergeScript = mergeScript.replace("await import('./apply-profile-v2-93-98-loader.mjs');\n", '');
mergeScript = mergeScript.replace(
  /if \(fs\.existsSync\('docs\/country-pages\/98-country-publication-transitions-77-84\.tsv'\)\) \{[\s\S]*$/,
  "await import('./check-country-detail-profile-runtime.mjs');\nawait import('./check-country-page-programme.mjs');\nawait import('./check-country-page-programme-roadmap.mjs');\nawait import('./check-project-governance-docs.mjs');\nawait import('./check-calendar-contracts.mjs');\nawait import('./check-final-audit-98.mjs');\n"
);
write('scripts/merge-pr-130-manual-june-records.mjs', mergeScript);

write('scripts/check-final-audit-98.mjs', `import fs from 'node:fs';

const errors = [];
const fail = (message) => errors.push(message);
const trackerLines = fs.readFileSync('docs/country-pages/98-country-tracker.tsv', 'utf8').trimEnd().split(/\\r?\\n/);
const headers = trackerLines[0].split('\\t');
const rows = trackerLines.slice(1).map((line) => Object.fromEntries(headers.map((header, index) => [header, line.split('\\t')[index] ?? ''])));
if (rows.length !== 98) fail('tracker must contain 98 rows');
if (rows.some((row) => row.programme_status !== 'published' || row.en_route_status !== 'published' || row.ja_route_status !== 'published' || row.qa_status !== 'passed')) fail('all tracker rows must be fully published');
const profileFiles = fs.readdirSync('data/static').filter((name) => /^country-profiles-v2(?:-.*)?\\.json$/.test(name));
const profiles = profileFiles.flatMap((name) => JSON.parse(fs.readFileSync('data/static/' + name, 'utf8')));
if (profiles.length !== 98 || new Set(profiles.map((profile) => profile.country_id)).size !== 98) fail('Profile v2 runtime must contain 98 unique countries');
const authority = JSON.parse(fs.readFileSync('data/static/authority-source-inventory.json', 'utf8'));
const authorityKeys = authority.records.map((record) => record.country_id + '/' + record.authority_id + '/' + record.official_source_id);
if (authority.records.length !== 116 || new Set(authorityKeys).size !== 116) fail('authority inventory must contain 116 unique records');
const readiness = JSON.parse(fs.readFileSync('data/static/calendar-readiness-registry.json', 'utf8'));
if (readiness.bootstrap_status !== 'complete') fail('readiness registry must be complete');
if (readiness.programme_state?.countries_with_closed_decision !== 98 || readiness.programme_state?.readiness_records !== 116 || readiness.programme_state?.next_backfill_work_ids?.length !== 0) fail('readiness programme state mismatch');
if (readiness.records.length !== 116 || new Set(readiness.records.map((record) => record.readiness_id)).size !== 116) fail('readiness registry must contain 116 unique records');
const data = fs.readFileSync('src/lib/data.ts', 'utf8');
for (const token of ['countryPageCountries7784', 'countryPageCountries8592', 'countryPageCountries9398', 'countryProfilesV298Greece', 'countryPageSources9398']) if (!data.includes(token)) fail('data.ts missing ' + token);
const merge = fs.readFileSync('scripts/merge-pr-130-manual-june-records.mjs', 'utf8');
if (merge.includes('apply-profile-v2-93-98-loader')) fail('build entry must not depend on the final Profile loader');
for (const file of ['docs/country-pages/transition-overlays-archive.md', 'docs/runbooks/final-country-calendar-audit-98.md']) if (!fs.existsSync(file)) fail('missing ' + file);
if (errors.length) {
  for (const error of errors) console.error('ERROR: ' + error);
  process.exit(1);
}
console.log('FINAL_AUDIT_98_VALID countries=98 routes=196 profiles=98 authority=116 readiness=116');
`);

console.log('FINAL_AUDIT_98_CODE_UPDATED');
