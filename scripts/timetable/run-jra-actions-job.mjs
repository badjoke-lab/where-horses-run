import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { validateCoverageObservation } from './coverage-observation-validation.mjs';

const root = process.cwd();
const executionArg = process.argv.find((arg) => arg.startsWith('--execution='));
if (!executionArg) throw new Error('--execution=<path> is required');
const executionPath = path.resolve(root, executionArg.slice('--execution='.length));
const execution = JSON.parse(fs.readFileSync(executionPath, 'utf8'));
const monthNames = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
const protectedPaths = [
  'data/generated/timetable/canonical/meetings.json',
  'data/generated/timetable/canonical/meeting-details.json',
  'data/generated/timetable/public/meeting-list.json',
  'data/generated/timetable/public/meeting-details.json',
  'data/generated/timetable/public/japan-a-plus-overrides.json',
];

function assert(condition, message) { if (!condition) throw new Error(message); }
function readJson(relativePath) { return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8')); }
function writeJson(relativePath, value) {
  const absolute = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, `${JSON.stringify(value, null, 2)}\n`);
}
function snapshotProtectedFiles() {
  return new Map(protectedPaths.map((relativePath) => {
    const absolute = path.join(root, relativePath);
    return [relativePath, fs.existsSync(absolute) ? fs.readFileSync(absolute) : null];
  }));
}
function restoreProtectedFiles(snapshot) {
  for (const [relativePath, bytes] of snapshot.entries()) {
    const absolute = path.join(root, relativePath);
    if (bytes === null) fs.rmSync(absolute, { force: true });
    else { fs.mkdirSync(path.dirname(absolute), { recursive: true }); fs.writeFileSync(absolute, bytes); }
  }
}
function enumerateMonths(startDate, endDateExclusive) {
  const result = [];
  const cursor = new Date(`${startDate.slice(0,7)}-01T00:00:00Z`);
  const end = new Date(`${endDateExclusive}T00:00:00Z`);
  while (cursor < end) {
    result.push({ year: cursor.getUTCFullYear(), month: cursor.getUTCMonth() + 1 });
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return result;
}
async function fetchMonthRacingDates(year, month) {
  const url = `https://jra.jp/keiba/calendar${year}/${monthNames[month - 1]}.html`;
  const response = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0', accept: 'text/html,*/*;q=0.8' } });
  if (!response.ok) throw new Error(`JRA monthly schedule returned HTTP ${response.status}: ${url}`);
  const html = await response.text();
  const mm = String(month).padStart(2, '0');
  const dates = new Set();
  for (const match of html.matchAll(/(\d{4})\.html/gi)) {
    const mmdd = match[1];
    if (!mmdd.startsWith(mm)) continue;
    const day = mmdd.slice(2);
    const candidate = `${year}-${mm}-${day}`;
    const parsed = new Date(`${candidate}T00:00:00Z`);
    if (!Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === candidate) dates.add(candidate);
  }
  return { url, dates: [...dates].sort() };
}
async function discoverRacingDates(scope) {
  const discovered = [];
  const scheduleSources = [];
  for (const { year, month } of enumerateMonths(scope.start_date, scope.end_date_exclusive)) {
    const result = await fetchMonthRacingDates(year, month);
    scheduleSources.push({ url: result.url, dates: result.dates });
    discovered.push(...result.dates.filter((date) => date >= scope.start_date && date < scope.end_date_exclusive));
  }
  return { dates: [...new Set(discovered)].sort(), scheduleSources };
}
function runRefreshForDate(date) {
  const result = spawnSync(process.execPath, ['scripts/timetable/refresh-jra.mjs', `--from=${date}`, `--to=${date}`], {
    cwd: root, stdio: 'inherit',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`refresh-jra.mjs exited with status ${result.status} for ${date}`);
  return {
    report: readJson('data/generated/timetable/jra-refresh-report.json'),
    normalized: readJson('data/generated/timetable/jra-normalized-timetable.json'),
    details: readJson('data/generated/timetable/jra-normalized-meeting-details.json'),
  };
}
function assertExecution(value) {
  assert(value.schema_version === 'calendar-runner-execution-v1', 'execution schema mismatch');
  assert(value.system_id === 'japan-jra-system', 'JRA Actions executor requires japan-jra-system');
  assert(value.runner_used === 'github_actions', 'JRA Actions executor requires github_actions runner');
  assert(value.executor_id === 'jra-programme-actions', 'JRA Actions executor_id mismatch');
  assert(value.collection_mode === 'date_window', 'JRA Actions executor supports date_window only');
  assert(value.requested_scope?.kind === 'date_window', 'JRA Actions executor requires date_window requested scope');
  assert(value.requested_scope?.timezone === 'Asia/Tokyo', 'JRA Actions executor requires Asia/Tokyo timezone');
  assert(value.source_route?.schedule_source_id === 'jra-programme', 'JRA schedule source mismatch');
  assert(value.source_route?.detail_source_id === 'jra-programme', 'JRA detail source mismatch');
  assert(value.review_required === true, 'JRA hosted acquisition must remain review-required');
  for (const [key, enabled] of Object.entries(value.side_effect_boundary ?? {})) assert(enabled === false, `JRA hosted acquisition side effect ${key} must remain false`);
}
function candidateFromOutputs(normalized, details, executionValue) {
  const detailsById = new Map((details.details ?? []).map((detail) => [detail.meeting_id, detail]));
  return {
    schema_version: 'timetable-candidate-v1', generated_at: normalized.generated_at,
    adapter_id: 'jra-programme-actions-review-v1', country_id: 'japan', authority_id: 'jra', source_id: 'jra-programme',
    candidate_window: { start_date: executionValue.requested_scope.start_date, end_date_exclusive: executionValue.requested_scope.end_date_exclusive, timezone: 'Asia/Tokyo' },
    records: (normalized.records ?? []).map((record) => {
      const detail = detailsById.get(record.meeting_id);
      return {
        candidate_id: `candidate-${record.meeting_id}`, meeting_id: record.meeting_id,
        country_id: record.country_id, authority_id: record.authority_id, racing_system_id: 'japan-jra-system',
        racecourse_id: record.racecourse_id, date: record.date, timezone: record.timezone,
        capability_rank: record.capability_rank, first_race_time_local: record.first_race_time_local,
        last_race_time_local: record.last_race_time_local, timetable_rows: detail?.timetable_rows ?? [],
        source: { source_id: 'jra-programme', official_url: record.official_source_url, checked_at: normalized.generated_at, extraction_method: 'live_fetch_program_row_parser' },
        confidence: 'high', review_status: 'needs_review',
        notes: 'Hosted JRA official programme acquisition. Review required before canonical/public promotion.',
      };
    }),
    review: { status: 'needs_review', reviewed_at: null, reviewer: null, promotion_target: 'canonical-timetable-v0', source_run_id: executionValue.batch_id },
  };
}
function buildCoverage(report, executionValue) {
  const errors = (report.statuses ?? []).filter((entry) => ['network_error','http_error'].includes(entry.status)).map((entry) => ({
    code: entry.status === 'network_error' ? 'source_unavailable' : 'unexpected_response', scope_ref: entry.date,
    message: entry.network_error || `JRA programme returned HTTP ${entry.http_status}`,
  }));
  const coverage = {
    schema_version: 'calendar-coverage-observation-v1', run_id: executionValue.batch_id,
    system_id: 'japan-jra-system', source_id: 'jra-programme', checked_at: report.generated_at,
    requested_scope: executionValue.requested_scope, observed_scope: executionValue.requested_scope, collection_mode: 'date_window',
    records_discovered: report.meetings_extracted ?? 0, records_updated: report.publishable_meetings ?? 0,
    unresolved_dates: [], unresolved_meeting_ids: [], source_errors: errors,
    coverage_claim: errors.length ? 'partial' : 'source_window_complete', completion_audit_ref: null,
  };
  const validation = validateCoverageObservation(coverage);
  if (!validation.valid) throw new Error(`JRA coverage observation invalid: ${validation.errors.join('; ')}`);
  return coverage;
}

assertExecution(execution);
const scope = execution.requested_scope;
const protectedSnapshot = snapshotProtectedFiles();
try {
  const discovery = await discoverRacingDates(scope);
  assert(discovery.dates.length > 0, `JRA monthly schedule exposed no racing dates in ${scope.start_date}..${scope.end_date_exclusive}`);
  const allRecords = [];
  const allDetails = [];
  const statuses = [];
  let generatedAt = new Date().toISOString();
  for (const date of discovery.dates) {
    const output = runRefreshForDate(date);
    generatedAt = output.report.generated_at;
    allRecords.push(...(output.normalized.records ?? []));
    allDetails.push(...(output.details.details ?? []));
    statuses.push(...(output.report.statuses ?? []));
  }
  const normalized = { schema_version: 'jra-normalized-timetable-v0', generated_at: generatedAt, refresh_window: { from: scope.start_date, to: scope.end_date_exclusive }, records: allRecords };
  const details = { schema_version: 'jra-normalized-meeting-details-v0', generated_at: generatedAt, refresh_window: { from: scope.start_date, to: scope.end_date_exclusive }, details: allDetails };
  const report = {
    schema_version: 'jra-hosted-date-window-report-v1', generated_at: generatedAt,
    refresh_window: { from: scope.start_date, to_exclusive: scope.end_date_exclusive },
    monthly_schedule_sources: discovery.scheduleSources, racing_dates_discovered: discovery.dates,
    dates_checked: discovery.dates.length, meetings_extracted: allRecords.length, publishable_meetings: allRecords.length,
    a_plus_meetings: allRecords.filter((record) => record.capability_rank === 'A+').length,
    a_level_meetings: allRecords.filter((record) => record.capability_rank === 'A').length, statuses,
  };
  const outputRoot = `data/generated/timetable/actions-multi-job/${execution.batch_id}`;
  const candidate = candidateFromOutputs(normalized, details, execution);
  const coverage = buildCoverage(report, execution);
  writeJson(`${outputRoot}/candidates.json`, candidate);
  writeJson(`${outputRoot}/coverage-observation.json`, coverage);
  writeJson(`${outputRoot}/collection-report.json`, report);
  writeJson(`${outputRoot}/normalized-timetable.json`, normalized);
  writeJson(`${outputRoot}/normalized-meeting-details.json`, details);
  console.log(JSON.stringify({ execution_mode: 'live_review_artifact_only', batch_id: execution.batch_id,
    racing_dates_discovered: discovery.dates.length, records_discovered: coverage.records_discovered,
    review_candidates: candidate.records.length, a_plus_meetings: report.a_plus_meetings, a_level_meetings: report.a_level_meetings,
    source_error_count: coverage.source_errors.length, output_dir: outputRoot, canonical_write: false, public_write: false }));
} finally {
  restoreProtectedFiles(protectedSnapshot);
}
