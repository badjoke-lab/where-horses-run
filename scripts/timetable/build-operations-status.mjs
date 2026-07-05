import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const argv = process.argv.slice(2);
const valueOf = (name) => {
  const index = argv.indexOf(name);
  return index >= 0 ? argv[index + 1] : null;
};
const check = argv.includes('--check');
const dryRun = argv.includes('--dry-run');
if (check && dryRun) throw new Error('--check and --dry-run are mutually exclusive.');

const readJson = (file) => JSON.parse(readFileSync(path.join(root, file), 'utf8'));
const asDate = (value, label) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? '')) throw new Error(`${label} must use YYYY-MM-DD.`);
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) throw new Error(`${label} is invalid.`);
  return value;
};
const ageDays = (from, to) => Math.floor((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000);
const addDays = (value, days) => {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};
const thresholds = { daily: 2, near_meeting: 2, weekly: 8, monthly: 35, seasonal: 190, event_driven: 90, manual: 120, none: null };
const thresholdOf = (classes) => {
  const values = (classes ?? []).map((item) => thresholds[item]).filter(Number.isInteger);
  return values.length ? Math.min(...values) : null;
};

const referenceDate = asDate(valueOf('--reference-date') ?? process.env.WHR_CALENDAR_REFERENCE_DATE ?? new Date().toISOString().slice(0, 10), 'reference date');
const outputPath = valueOf('--output') ?? 'data/generated/timetable/operations-status.json';
const readiness = readJson('data/static/calendar-readiness-registry.json');
const inventory = readJson('data/static/authority-source-inventory.json');
const meetings = readJson('data/generated/timetable/public/meeting-list.json');
const details = readJson('data/generated/timetable/public/meeting-details.json');
const jraCandidate = readJson('data/candidates/japan-jra-candidates.json');

const sourceRows = readiness.records.map((record) => {
  const thresholdDays = thresholdOf(record.refresh_classes);
  const days = ageDays(record.checked_date, referenceDate);
  const due = thresholdDays !== null && days > thresholdDays;
  let action = 'none';
  if (record.readiness === 'blocked') action = 'blocked_review';
  else if (record.readiness === 'not_applicable') action = 'none';
  else if (due && record.automation_mode === 'link_only') action = 'link_revalidation_due';
  else if (due && ['manual_import', 'manual_confirmation'].includes(record.automation_mode)) action = 'manual_revalidation_due';
  else if (due) action = 'source_revalidation_due';
  else if (record.source_status === 'unavailable') action = 'source_unavailable_review';
  return {
    readiness_id: record.readiness_id,
    country_id: record.country_id,
    authority_source_key: record.authority_source_key,
    readiness: record.readiness,
    implementation_status: record.implementation_status,
    automation_mode: record.automation_mode,
    source_status: record.source_status,
    refresh_classes: record.refresh_classes,
    checked_date: record.checked_date,
    age_days: days,
    threshold_days: thresholdDays,
    revalidation_due: due,
    action,
    fallback: record.fallback
  };
}).sort((a, b) => `${a.action}:${a.country_id}:${a.readiness_id}`.localeCompare(`${b.action}:${b.country_id}:${b.readiness_id}`));

const jraInventory = inventory.records.find((record) => record.country_id === 'japan' && record.authority_id === 'jra' && record.official_source_id === 'jra-programme');
const jraReadiness = readiness.records.find((record) => record.authority_source_key === 'japan/jra/jra-programme');
const jraChecked = jraCandidate.records.map((record) => record.source.checked_at.slice(0, 10)).sort().at(-1);
const registryMinimum = [jraInventory?.last_checked_date, jraReadiness?.checked_date].filter(Boolean).sort().at(-1);
const jraFreshnessBlocked = Boolean(jraChecked && registryMinimum && jraChecked < registryMinimum);
const meetingDates = meetings.meetings.map((meeting) => meeting.date).sort();
const windowEnd = addDays(referenceDate, 30);
const windowMeetings = meetings.meetings.filter((meeting) => meeting.date >= referenceDate && meeting.date < windowEnd);
const projectionDate = meetings.generated_at.slice(0, 10);
const actionCounts = Object.fromEntries([...new Set(sourceRows.map((row) => row.action))].sort().map((action) => [action, sourceRows.filter((row) => row.action === action).length]));

const status = {
  schema_version: 'calendar-operations-status-v1',
  as_of_date: referenceDate,
  generated_at: `${referenceDate}T00:00:00.000Z`,
  mode: 'review_only_no_network',
  boundaries: {
    network_fetch_performed: false,
    canonical_written: false,
    public_projection_written: false,
    scheduled_refresh_active: false
  },
  source_summary: {
    readiness_record_count: sourceRows.length,
    revalidation_due_count: sourceRows.filter((row) => row.revalidation_due).length,
    blocked_count: sourceRows.filter((row) => row.readiness === 'blocked').length,
    unavailable_count: sourceRows.filter((row) => row.source_status === 'unavailable').length,
    action_counts: actionCounts
  },
  candidate_summary: {
    path: 'data/candidates/japan-jra-candidates.json',
    adapter_id: jraCandidate.adapter_id,
    review_status: jraCandidate.review.status,
    record_count: jraCandidate.records.length,
    source_checked_date: jraChecked,
    registry_minimum_date: registryMinimum,
    promotion_blocked_by_freshness: jraFreshnessBlocked,
    action: jraFreshnessBlocked ? 'refresh_before_promotion' : 'human_review_required'
  },
  public_projection: {
    generated_at: meetings.generated_at,
    generated_date: projectionDate,
    age_days: ageDays(projectionDate, referenceDate),
    meeting_count: meetings.meetings.length,
    detail_count: details.details.length,
    earliest_meeting_date: meetingDates[0] ?? null,
    latest_meeting_date: meetingDates.at(-1) ?? null,
    current_window_start: referenceDate,
    current_window_end_exclusive: windowEnd,
    current_window_meeting_count: windowMeetings.length,
    stale_for_current_window: projectionDate < referenceDate
  },
  sources: sourceRows,
  operator_actions: sourceRows.filter((row) => row.action !== 'none').map((row) => ({
    type: row.action,
    key: row.readiness_id,
    country_id: row.country_id,
    reason: row.revalidation_due ? `checked ${row.age_days} days ago; threshold ${row.threshold_days} days` : `readiness=${row.readiness}; source_status=${row.source_status}`
  })).concat({
    type: jraFreshnessBlocked ? 'refresh_before_promotion' : 'human_review_required',
    key: 'data/candidates/japan-jra-candidates.json',
    country_id: 'japan',
    reason: jraFreshnessBlocked ? `candidate source ${jraChecked} predates registry ${registryMinimum}` : `candidate review_status=${jraCandidate.review.status}`
  }).sort((a, b) => `${a.type}:${a.country_id}:${a.key}`.localeCompare(`${b.type}:${b.country_id}:${b.key}`))
};

const serialized = `${JSON.stringify(status, null, 2)}\n`;
if (dryRun) {
  console.log(JSON.stringify({ as_of_date: referenceDate, source_summary: status.source_summary, candidate_summary: status.candidate_summary, public_projection: status.public_projection, operator_action_count: status.operator_actions.length }, null, 2));
  process.exit(0);
}
const absoluteOutput = path.isAbsolute(outputPath) ? outputPath : path.join(root, outputPath);
if (check) {
  if (!existsSync(absoluteOutput) || readFileSync(absoluteOutput, 'utf8') !== serialized) throw new Error(`Operations status is stale for ${referenceDate}.`);
  console.log(`CALENDAR_OPERATIONS_STATUS: current as_of=${referenceDate}`);
  process.exit(0);
}
mkdirSync(path.dirname(absoluteOutput), { recursive: true });
writeFileSync(absoluteOutput, serialized);
console.log(`CALENDAR_OPERATIONS_STATUS: wrote ${outputPath} actions=${status.operator_actions.length}`);
