import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const write = (file, content) => {
  const target = path.join(root, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
};
const parseJson = (file) => JSON.parse(read(file));
const writeJson = (file, value) => write(file, `${JSON.stringify(value, null, 2)}\n`);

function parseTsv(text) {
  const lines = text.replace(/\r\n/g, '\n').trimEnd().split('\n');
  const headers = lines.shift().split('\t');
  const rows = lines.filter(Boolean).map((line) => {
    const values = line.split('\t');
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
  });
  return { headers, rows };
}

function writeTsv(file, headers, rows) {
  const lines = [headers.join('\t'), ...rows.map((row) => headers.map((header) => row[header] ?? '').join('\t'))];
  write(file, `${lines.join('\n')}\n`);
}

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

export const transitionFiles = [
  'docs/country-pages/98-country-tracker-transitions.tsv',
  'docs/country-pages/98-country-source-test-transitions-77-84.tsv',
  'docs/country-pages/98-country-note-transitions-77-84.tsv',
  'docs/country-pages/98-country-profile-transitions-77-84.tsv',
  'docs/country-pages/98-country-publication-transitions-77-84.tsv',
  'docs/country-pages/98-country-source-test-transitions-85-92.tsv',
  'docs/country-pages/98-country-note-transitions-85-92.tsv',
  'docs/country-pages/98-country-profile-transitions-85-92.tsv',
  'docs/country-pages/98-country-publication-transitions-85-92.tsv',
  'docs/country-pages/98-country-source-test-transitions-93-98.tsv',
  'docs/country-pages/98-country-note-transitions-93-98.tsv',
  'docs/country-pages/98-country-profile-transitions-93-98.tsv',
  'docs/country-pages/98-country-publication-transitions-93-98.tsv'
];

const trackerPath = 'docs/country-pages/98-country-tracker.tsv';
const tracker = parseTsv(read(trackerPath));
const trackerByDelivery = new Map(tracker.rows.map((row) => [row.delivery_no, row]));
for (const file of transitionFiles) {
  if (!fs.existsSync(path.join(root, file))) throw new Error(`Missing transition file: ${file}`);
  for (const change of parseTsv(read(file)).rows) {
    const row = trackerByDelivery.get(change.delivery_no);
    if (!row) throw new Error(`${file}: unknown delivery ${change.delivery_no}`);
    for (const [field, value] of Object.entries(change)) {
      if (field !== 'delivery_no' && value !== '') row[field] = value;
    }
  }
}
const canonicalTrackerRows = [...trackerByDelivery.values()].sort((a, b) => a.delivery_no.localeCompare(b.delivery_no));
if (canonicalTrackerRows.length !== 98 || canonicalTrackerRows.some((row) => row.programme_status !== 'published')) {
  throw new Error('Canonical tracker must contain 98 published rows.');
}
writeTsv(trackerPath, tracker.headers, canonicalTrackerRows);
console.log('FINAL_AUDIT_TRACKER_COMPACTED rows=98 published=98');

const sourceTestFiles = listFiles('docs/timetable-source-tests').filter((file) => file.endsWith('/source-test-v2.json'));
const sourceTests = new Map(sourceTestFiles.map((file) => [file, parseJson(file)]));

const authorityPath = 'data/static/authority-source-inventory.json';
const authority = parseJson(authorityPath);
const authorityMap = new Map(
  authority.records.map((record) => [`${record.country_id}/${record.authority_id}/${record.official_source_id}`, record])
);
const authorityOverlayFiles = [
  'data/static/authority-source-inventory-77-84.json',
  'data/static/authority-source-inventory-85-92.json',
  'data/static/authority-source-inventory-93-98.json'
];

function sourceKind(record) {
  if (record.confirmed_fields?.per_race_post_times || record.confirmed_fields?.first_race_time) return 'timetable';
  if (record.confirmed_fields?.meeting_date) return 'calendar';
  return 'official_link';
}

function racecourseScope(coverage) {
  if (coverage === 'countrywide') return 'countrywide';
  if (coverage === 'authority_wide') return 'all_authority_racecourses';
  if (coverage === 'subset_of_authority_racecourses') return 'subset_of_authority_racecourses';
  if (coverage === 'single_racecourse') return 'single_racecourse';
  return 'unknown';
}

for (const file of authorityOverlayFiles) {
  const overlay = parseJson(file);
  for (const record of overlay.records ?? []) {
    const parts = record.authority_source_key.split('/');
    const countryId = parts.shift();
    const authorityId = parts.shift();
    const officialSourceId = parts.join('-');
    if (!countryId || !authorityId || !officialSourceId) throw new Error(`${file}: invalid authority_source_key`);
    const summary = sourceTests.get(record.source_test_ref);
    if (!summary) throw new Error(`${file}: missing source test ${record.source_test_ref}`);
    const sourceRecord = summary.records.find((item) => item.authority_source_key === record.authority_source_key);
    if (!sourceRecord) throw new Error(`${file}: authority key not found in source test`);
    authorityMap.set(record.authority_source_key, {
      country_id: countryId,
      authority_id: authorityId,
      authority_name_en: record.authority_name_en,
      authority_name_local: null,
      authority_type: 'other',
      racecourse_scope: racecourseScope(sourceRecord.coverage_scope),
      official_source_id: officialSourceId,
      official_source_url: record.official_source_url,
      source_kind: sourceKind(sourceRecord),
      source_status: record.source_status,
      last_checked_date: summary.checked_date,
      capability_rank: record.capability_rank,
      adapter_candidate_status: sourceRecord.readiness === 'blocked' ? 'blocked' : 'candidate',
      notes: `Public-safe canonical reference consolidated from ${record.source_test_ref}. No adapter, scraper, parser, or live-fetch implementation is claimed.`
    });
  }
}

const deliveryBySlug = new Map(canonicalTrackerRows.map((row) => [row.slug, row.delivery_no]));
authority.records = [...authorityMap.values()].sort((a, b) =>
  (deliveryBySlug.get(a.country_id) ?? '99').localeCompare(deliveryBySlug.get(b.country_id) ?? '99') ||
  `${a.country_id}/${a.authority_id}/${a.official_source_id}`.localeCompare(`${b.country_id}/${b.authority_id}/${b.official_source_id}`)
);
if (authority.records.length !== 116) throw new Error(`Expected 116 authority records; found ${authority.records.length}`);
writeJson(authorityPath, authority);
console.log('FINAL_AUDIT_AUTHORITY_COMPACTED records=116');

const readinessPath = 'data/static/calendar-readiness-registry.json';
const readiness = parseJson(readinessPath);
const readinessMap = new Map(readiness.records.map((record) => [record.readiness_id, record]));

for (const [file, summary] of sourceTests) {
  for (const record of summary.records ?? []) {
    readinessMap.set(record.readiness_id, {
      readiness_id: record.readiness_id,
      country_id: summary.country_id,
      country_tracker_delivery_no: summary.delivery_no,
      system_id: record.system_id,
      system_name_en: record.system_name_en,
      authority_source_key: record.authority_source_key ?? null,
      racecourse_ids: record.racecourse_ids ?? [],
      coverage_scope: record.coverage_scope,
      technical_rank: record.technical_rank,
      public_ceiling: record.public_ceiling,
      confirmed_fields: record.confirmed_fields,
      source_format: record.source_format,
      access_mode: record.access_mode,
      automation_mode: record.automation_mode,
      refresh_classes: record.refresh_classes,
      readiness: record.readiness,
      implementation_status: record.implementation_status,
      fallback: record.fallback,
      source_status: record.source_status,
      checked_date: summary.checked_date,
      evidence_reviewed_at: summary.evidence_reviewed_at,
      revalidation_trigger: record.revalidation_trigger,
      blocked_reason: record.blocked_reason ?? null,
      source_test_ref: file,
      limitations: record.limitations ?? [],
      notes: record.notes
    });
  }
}

readiness.records = [...readinessMap.values()].sort((a, b) =>
  a.country_tracker_delivery_no.localeCompare(b.country_tracker_delivery_no) ||
  a.readiness_id.localeCompare(b.readiness_id)
);
const closedCountries = new Set(readiness.records.map((record) => record.country_id));
readiness.bootstrap_status = 'complete';
readiness.programme_state = {
  country_target: 98,
  countries_with_closed_decision: closedCountries.size,
  readiness_records: readiness.records.length,
  next_backfill_work_ids: []
};
if (closedCountries.size !== 98 || readiness.records.length !== 116) {
  throw new Error(`Expected readiness 98 countries / 116 records; found ${closedCountries.size} / ${readiness.records.length}`);
}
writeJson(readinessPath, readiness);
console.log('FINAL_AUDIT_READINESS_COMPACTED countries=98 records=116');

await import('../apply-profile-v2-93-98-loader.mjs');
const dataText = read('src/lib/data.ts');
for (const token of [
  'countryPageCountries7784',
  'countryPageCountries8592',
  'countryPageCountries9398',
  'countryProfilesV298Greece',
  'countryPageSources9398'
]) {
  if (!dataText.includes(token)) throw new Error(`src/lib/data.ts missing canonical token ${token}`);
}

console.log('FINAL_AUDIT_98_DATA_COMPACTED');
