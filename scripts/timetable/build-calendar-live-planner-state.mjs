import fs from 'node:fs';
import path from 'node:path';
import { loadCalendarAcquisitionRegistryV1 } from './load-calendar-acquisition-registry.mjs';

const root = process.cwd();
const args = new Map(process.argv.slice(2).map((arg) => {
  const index = arg.indexOf('=');
  return index === -1 ? [arg, true] : [arg.slice(0, index), arg.slice(index + 1)];
}));

const meetingListPath = args.get('--meeting-list') ?? 'data/generated/timetable/public/meeting-list.json';
const policyPath = args.get('--policy') ?? 'data/static/calendar-due-job-policy-v1.json';
const seasonStatePath = args.get('--season-state') ?? 'data/static/calendar-system-season-state-v1.json';
const retryQueuePath = args.get('--retry-queue') ?? null;
const outputPath = args.get('--output');
const asOf = args.get('--as-of') ?? new Date().toISOString();
const windowDays = Number(args.get('--window-days') ?? 30);
const healthyAgeDays = Number(args.get('--healthy-age-days') ?? 14);

if (!outputPath) throw new Error('--output=<path> is required');
if (Number.isNaN(Date.parse(asOf))) throw new Error('--as-of must be a valid ISO date-time');
if (!Number.isInteger(windowDays) || windowDays < 1 || windowDays > 90) throw new Error('--window-days must be an integer from 1 to 90');
if (!Number.isInteger(healthyAgeDays) || healthyAgeDays < 1 || healthyAgeDays > 90) throw new Error('--healthy-age-days must be an integer from 1 to 90');

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.resolve(root, relativePath), 'utf8'));
}

function addDays(date, days) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function maxString(values) {
  return values.filter(Boolean).sort().at(-1) ?? null;
}

function minString(values) {
  return values.filter(Boolean).sort().at(0) ?? null;
}

function dateTimeFromDate(date) {
  return date === null ? null : `${date}T00:00:00Z`;
}

function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function sourceHealth(lastCheckedDate, statuses, planningDate) {
  if (lastCheckedDate === null) return 'degraded';
  if (statuses.includes('unavailable')) return 'unavailable';
  const ageDays = (Date.parse(`${planningDate}T00:00:00Z`) - Date.parse(`${lastCheckedDate}T00:00:00Z`)) / 86400000;
  if (ageDays > healthyAgeDays) return 'degraded';
  return statuses.some((status) => status === 'verified' || status === 'partial' || status === 'stale')
    ? 'healthy'
    : 'degraded';
}

function validateSeasonState(value) {
  const errors = [];
  if (value?.schema_version !== 'calendar-system-season-state-v1') errors.push('season state schema_version differs');
  if (!Array.isArray(value?.records)) return [...errors, 'season state records must be an array'];
  const seen = new Set();
  for (const [index, record] of value.records.entries()) {
    const location = `season state records[${index}]`;
    if (typeof record?.system_id !== 'string' || record.system_id === '') errors.push(`${location}.system_id invalid`);
    if (seen.has(record.system_id)) errors.push(`duplicate season state system ${record.system_id}`);
    seen.add(record.system_id);
    if (!['active', 'offseason', 'unknown'].includes(record?.season_state)) errors.push(`${location}.season_state invalid`);
    if (!validDate(record?.effective_start_date)) errors.push(`${location}.effective_start_date invalid`);
    if (!validDate(record?.effective_end_date_exclusive)) errors.push(`${location}.effective_end_date_exclusive invalid`);
    if (validDate(record?.effective_start_date) && validDate(record?.effective_end_date_exclusive)
      && record.effective_start_date >= record.effective_end_date_exclusive) errors.push(`${location} effective window invalid`);
    if (record?.next_known_meeting_date !== null && !validDate(record?.next_known_meeting_date)) errors.push(`${location}.next_known_meeting_date invalid`);
    if (!validDate(record?.source_checked_date)) errors.push(`${location}.source_checked_date invalid`);
    if (typeof record?.official_source_url !== 'string' || !record.official_source_url.startsWith('https://')) errors.push(`${location}.official_source_url invalid`);
    if (typeof record?.review_note !== 'string' || record.review_note.trim() === '') errors.push(`${location}.review_note invalid`);
  }
  return errors;
}

function reviewedSeasonRecord(seasonState, systemId, planningDate) {
  const record = seasonState.records.find((entry) => entry.system_id === systemId
    && entry.effective_start_date <= planningDate
    && planningDate < entry.effective_end_date_exclusive);
  if (!record) throw new Error(`reviewed season state missing for ${systemId} on ${planningDate}`);
  return record;
}

const meetingList = readJson(meetingListPath);
const policy = readJson(policyPath);
const seasonState = readJson(seasonStatePath);
const seasonErrors = validateSeasonState(seasonState);
if (seasonErrors.length) throw new Error(`invalid reviewed season state: ${seasonErrors.join('; ')}`);
const registry = loadCalendarAcquisitionRegistryV1(root);
const planningDate = asOf.slice(0, 10);
const windowEndExclusive = addDays(planningDate, windowDays);
const tomorrow = addDays(planningDate, 1);
const meetings = Array.isArray(meetingList.meetings) ? meetingList.meetings : [];

const retryQueue = retryQueuePath
  ? readJson(retryQueuePath)
  : {
      schema_version: 'calendar-rank-aware-retry-queue-v1',
      generated_at: asOf,
      entries: [],
    };

const systemStates = [];
for (const rule of policy.system_rules ?? []) {
  const profile = registry.records.find((record) => record.system_id === rule.system_id);
  if (!profile) throw new Error(`Acquisition Registry profile missing for ${rule.system_id}`);
  const reviewedSeason = reviewedSeasonRecord(seasonState, rule.system_id, planningDate);

  const systemMeetings = meetings.filter((meeting) => meeting.authority_id === profile.authority_id);
  const dates = systemMeetings.map((meeting) => meeting.date).filter(Boolean);
  const checkedDates = systemMeetings.map((meeting) => meeting.last_checked_date).filter(Boolean);
  const statuses = systemMeetings.map((meeting) => meeting.source_status).filter(Boolean);
  const latestMeetingDate = maxString(dates);
  const lastCheckedDate = maxString(checkedDates);
  const publicNextMeetingDate = minString(dates.filter((date) => date >= planningDate));
  const nextMeetingDate = publicNextMeetingDate ?? reviewedSeason.next_known_meeting_date;
  const sourceVisibleHorizonEndExclusive = latestMeetingDate === null ? null : addDays(latestMeetingDate, 1);

  const gapStart = sourceVisibleHorizonEndExclusive === null || sourceVisibleHorizonEndExclusive < tomorrow
    ? tomorrow
    : sourceVisibleHorizonEndExclusive;
  const coverageGaps = reviewedSeason.season_state === 'active' && gapStart < windowEndExclusive
    ? [{ start_date: gapStart, end_date_exclusive: windowEndExclusive, timezone: systemMeetings[0]?.timezone ?? 'UTC' }]
    : [];

  systemStates.push({
    system_id: rule.system_id,
    timezone: systemMeetings[0]?.timezone ?? 'UTC',
    season_state: reviewedSeason.season_state,
    source_health: sourceHealth(lastCheckedDate, statuses, planningDate),
    last_successful_collection_at: dateTimeFromDate(lastCheckedDate),
    last_source_revalidation_at: dateTimeFromDate(lastCheckedDate),
    source_visible_horizon_end_exclusive: sourceVisibleHorizonEndExclusive,
    next_meeting_date: reviewedSeason.season_state === 'active' ? nextMeetingDate : reviewedSeason.next_known_meeting_date,
    coverage_gaps: coverageGaps,
  });
}

const state = {
  schema_version: 'calendar-due-job-planner-state-v1',
  as_of: asOf,
  system_states: systemStates,
  retry_queue: retryQueue,
};

const output = path.resolve(root, outputPath);
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(state, null, 2)}\n`);
console.log(JSON.stringify({
  output: path.relative(root, output),
  as_of: asOf,
  window_end_exclusive: windowEndExclusive,
  system_count: systemStates.length,
  active_systems: systemStates.filter((entry) => entry.season_state === 'active').map((entry) => entry.system_id),
  offseason_systems: systemStates.filter((entry) => entry.season_state === 'offseason').map((entry) => entry.system_id),
  systems_with_coverage_gaps: systemStates.filter((entry) => entry.coverage_gaps.length > 0).map((entry) => entry.system_id),
}));
