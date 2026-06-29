import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const write = (file, content) => fs.writeFileSync(path.join(root, file), content.endsWith('\n') ? content : `${content}\n`, 'utf8');
const readJson = (file) => JSON.parse(read(file));
const writeJson = (file, value) => write(file, JSON.stringify(value, null, 2));

const material = readJson('scripts/source-test-v2-69-76-materialization.json');
const { entries, date, update_date: updateDate } = material;

const authorityPath = 'data/static/authority-source-inventory.json';
const authority = readJson(authorityPath);
const authorityKey = (record) => `${record.country_id}/${record.authority_id}/${record.official_source_id}`;
const authorityKeys = new Set(authority.records.map(authorityKey));
for (const entry of entries) {
  const key = authorityKey(entry.authority);
  if (!authorityKeys.has(key)) {
    authority.records.push(entry.authority);
    authorityKeys.add(key);
  }
}
if (authority.records.length !== 94) throw new Error(`Expected 94 authority records; found ${authority.records.length}`);
writeJson(authorityPath, authority);

const registryPath = 'data/static/calendar-readiness-registry.json';
const registry = readJson(registryPath);
const readinessIds = new Set(registry.records.map((record) => record.readiness_id));
for (const entry of entries) {
  const sourcePath = `docs/timetable-source-tests/${entry.delivery_no}-${entry.slug}/source-test-v2.json`;
  const summary = readJson(sourcePath);
  for (const sourceRecord of summary.records) {
    if (readinessIds.has(sourceRecord.readiness_id)) continue;
    registry.records.push({
      ...sourceRecord,
      country_id: entry.slug,
      country_tracker_delivery_no: entry.delivery_no,
      checked_date: summary.checked_date,
      evidence_reviewed_at: summary.evidence_reviewed_at,
      source_test_ref: sourcePath
    });
    readinessIds.add(sourceRecord.readiness_id);
  }
}
registry.programme_state.countries_with_closed_decision = 76;
registry.programme_state.readiness_records = 94;
registry.programme_state.next_backfill_work_ids = ['WHR-ST2-77-84'];
registry.last_updated = updateDate;
if (registry.records.length !== 94) throw new Error(`Expected 94 readiness records; found ${registry.records.length}`);
writeJson(registryPath, registry);

const trackerPath = 'docs/country-pages/98-country-tracker.tsv';
const lines = read(trackerPath).trimEnd().split(/\r?\n/);
const headers = lines[0].split('\t');
const index = Object.fromEntries(headers.map((name, position) => [name, position]));
const rows = lines.slice(1).map((line) => line.split('\t'));
for (const entry of entries) {
  const row = rows.find((candidate) => candidate[index.delivery_no] === entry.delivery_no);
  if (!row || row[index.slug] !== entry.slug) throw new Error(`Tracker identity missing: ${entry.delivery_no}-${entry.slug}`);
  row[index.programme_status] = 'source_tested';
  row[index.acquisition_status] = entry.acquisition_status;
  row[index.source_last_checked] = date;
  row[index.evidence_reviewed_at] = date;
  row[index.remarks] = entry.remark;
}
write(trackerPath, [headers.join('\t'), ...rows.map((row) => row.join('\t'))].join('\n'));

console.log('MATERIALIZED_SOURCE_TEST_V2_69_76 authority=94 readiness=94 source_tested=8');
