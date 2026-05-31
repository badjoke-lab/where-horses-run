import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const snapshotPath = path.join(root, 'data/generated/timetable/live-source-snapshot.json');
const outputDir = path.join(root, 'data/generated/timetable');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(relativePath, data) {
  const filePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

function healthStatus(record) {
  if (record.fetch_status === 'ok') return 'reachable';
  if (record.fetch_status === 'not_run') return 'not_checked';
  return 'needs_review';
}

function countBy(records, field, value) {
  return records.filter((record) => record[field] === value).length;
}

const snapshot = readJson(snapshotPath);
const records = snapshot.records ?? [];
const generatedAt = new Date().toISOString();

const health = {
  schema_version: 'timetable-source-health-v1',
  generated_at: generatedAt,
  mode: snapshot.mode,
  source_snapshot_generated_at: snapshot.generated_at,
  source_count: records.length,
  reachable_sources: countBy(records, 'fetch_status', 'ok'),
  not_run_sources: countBy(records, 'fetch_status', 'not_run'),
  review_sources: records.filter((record) => !['ok', 'not_run'].includes(record.fetch_status)).length,
  sources: records.map((record) => ({
    country_id: record.country_id,
    group_id: record.group_id,
    source_kind: record.source_kind,
    parser: record.parser,
    target_level: record.target_level,
    source_url: record.source_url,
    final_url: record.final_url,
    health_status: healthStatus(record),
    fetch_status: record.fetch_status,
    http_status: record.http_status,
    content_type: record.content_type,
    content_length: record.content_length,
    content_sha256: record.content_sha256,
    checked_at: record.checked_at
  }))
};

const updateReport = {
  schema_version: 'timetable-update-report-v1',
  generated_at: generatedAt,
  command: 'apply-live-source-snapshot',
  mode: snapshot.mode,
  source_snapshot_generated_at: snapshot.generated_at,
  sources_checked: records.length,
  reachable_sources: health.reachable_sources,
  not_run_sources: health.not_run_sources,
  review_sources: health.review_sources,
  new_records: 0,
  promoted_records: {
    D_to_C: 0,
    C_to_B: 0,
    C_to_A: 0,
    B_to_A: 0
  },
  parser_errors: [],
  source_results: records.map((record) => ({
    country_id: record.country_id,
    group_id: record.group_id,
    source_kind: record.source_kind,
    parser: record.parser,
    target_level: record.target_level,
    fetch_status: record.fetch_status,
    http_status: record.http_status,
    content_sha256: record.content_sha256,
    sample_text: record.sample_text,
    checked_at: record.checked_at
  }))
};

writeJson('data/generated/timetable/source-health.json', health);
writeJson('data/generated/timetable/update-report.json', updateReport);
console.log(`[apply-live-source-snapshot] ${snapshot.mode} sources=${records.length}`);
