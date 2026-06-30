import fs from 'node:fs';

const errors = [];
const fail = (message) => errors.push(message);
const trackerLines = fs.readFileSync('docs/country-pages/98-country-tracker.tsv', 'utf8').trimEnd().split(/\r?\n/);
const headers = trackerLines[0].split('\t');
const rows = trackerLines.slice(1).map((line) => Object.fromEntries(headers.map((header, index) => [header, line.split('\t')[index] ?? ''])));
if (rows.length !== 98) fail('tracker must contain 98 rows');
if (rows.some((row) => row.programme_status !== 'published' || row.en_route_status !== 'published' || row.ja_route_status !== 'published' || row.qa_status !== 'passed')) fail('all tracker rows must be fully published');
const profileFiles = fs.readdirSync('data/static').filter((name) => /^country-profiles-v2(?:-.*)?\.json$/.test(name));
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
