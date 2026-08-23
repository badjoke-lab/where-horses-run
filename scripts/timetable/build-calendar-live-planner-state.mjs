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
const sourceHealthStatePath = args.get('--source-health-state') ?? 'data/static/calendar-reviewed-source-health-v1.json';
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

function validDateTime(value) {
  return typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Date.parse(value));
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
  const bySystem = new Map();
  for (const [index, record] of value.records.entries()) {
    const location = `season state records[${index}]`;
    if (typeof record?.system_id !== 'string' || record.system_id === '') errors.push(`${location}.system_id invalid`);
    if (!['active', 'offseason', 'unknown'].includes(record?.season_state)) errors.push(`${location}.season_state invalid`);
    if (!validDate(record?.effective_start_date)) errors.push(`${location}.effective_start_date invalid`);
    if (!validDate(record?.effective_end_date_exclusive)) errors.push(`${location}.effective_end_date_exclusive invalid`);
    if (validDate(record?.effective_start_date) && validDate(record?.effective_end_date_exclusive)
      && record.effective_start_date >= record.effective_end_date_exclusive) errors.push(`${location} effective window invalid`);
    if (record?.next_known_meeting_date !== null && !validDate(record?.next_known_meeting_date)) errors.push(`${location}.next_known_meeting_date invalid`);
    if (!validDate(record?.source_checked_date)) errors.push(`${location}.source_checked_date invalid`);
    if (typeof record?.official_source_url !== 'string' || !record.official_source_url.startsWith('https://')) errors.push(`${location}.official_source_url invalid`);
    if (typeof record?.review_note !== 'string' || record.review_note.trim() === '') errors.push(`${location}.review_note invalid`);
    const list = bySystem.get(record.system_id) ?? [];
    list.push(record);
    bySystem.set(record.system_id, list);
  }
  for (const [systemId, records] of bySystem.entries()) {
    const ordered = [...records].sort((left, right) => left.effective_start_date.localeCompare(right.effective_start_date));
    for (let index = 1; index < ordered.length; index += 1) {
      if (ordered[index - 1].effective_end_date_exclusive > ordered[index].effective_start_date) {
        errors.push(`overlapping season state windows for ${systemId}`);
      }
    }
  }
  return errors;
}

function validateReviewedSourceHealth(value) {
  const errors = [];
  if (value?.schema_version !== 'calendar-reviewed-source-health-v1') errors.push('reviewed source health schema_version differs');
  if (!validDateTime(value?.generated_at)) errors.push('reviewed source health generated_at invalid');
  if (!Array.isArray(value?.records)) return [...errors, 'reviewed source health records must be an array'];
  const identities = new Set();
  for (const [index, record] of value.records.entries()) {
    const location = `reviewed source health records[${index}]`;
    if (typeof record?.system_id !== 'string' || record.system_id === '') errors.push(`${location}.system_id invalid`);
    if (!validDateTime(record?.checked_at)) errors.push(`${location}.checked_at invalid`);
    if (!['healthy', 'degraded', 'unavailable'].includes(record?.source_health)) errors.push(`${location}.source_health invalid`);
    if (record?.review_state !== 'reviewed') errors.push(`${location}.review_state must be reviewed`);
    if (typeof record?.reviewer !== 'string' || record.reviewer.trim() === '') errors.push(`${location}.reviewer invalid`);
    if (!Array.isArray(record?.evidence_urls) || record.evidence_urls.length === 0
      || record.evidence_urls.some((url) => typeof url !== 'string' || !url.startsWith('https://'))) {
      errors.push(`${location}.evidence_urls invalid`);
    }
    if (typeof record?.evidence_note !== 'string' || record.evidence_note.trim() === '') errors.push(`${location}.evidence_note invalid`);
    const identity = `${record?.system_id ?? ''}:${record?.checked_at ?? ''}`;
    if (identities.has(identity)) errors.push(`duplicate reviewed source health identity ${identity}`);
    identities.add(identity);
  }
  return errors;
}

function reviewedSeasonRecord(seasonState, systemId, planningDate) {
  const records = seasonState.records.filter((entry) => entry.system_id === systemId
    && entry.effective_start_date <= planningDate
    && planningDate < entry.effective_end_date_exclusive);
  if (records.length !== 1) throw new Error(`reviewed season state must resolve exactly once for ${systemId} on ${planningDate}`);
  return records[0];
}

function futureActiveSeasonRecord(seasonState, systemId, planningDate, windowEndExclusive) {
  return seasonState.records
    .filter((entry) => entry.system_id === systemId
      && entry.season_state === 'active'
      && planningDate < entry.effective_start_date
      && entry.effective_start_date < windowEndExclusive)
    .sort((left, right) => left.effective_start_date.localeCompare(right.effective_start_date))[0] ?? null;
}

function latestReviewedSourceHealthRecord(sourceHealthState, systemId, cutoff) {
  return sourceHealthState.records
    .filter((entry) => entry.system_id === systemId && Date.parse(entry.checked_at) <= Date.parse(cutoff))
    .sort((left, right) => left.checked_at.localeCompare(right.checked_at))
    .at(-1) ?? null;
}

function resolveSourceHealth({ sourceHealthState, systemId, lastCheckedDate, statuses, planningDate, asOf }) {
  const publicCheckedAt = dateTimeFromDate(lastCheckedDate);
  const reviewed = latestReviewedSourceHealthRecord(sourceHealthState, systemId, asOf);
  if (reviewed !== null && (publicCheckedAt === null || Date.parse(reviewed.checked_at) >= Date.parse(publicCheckedAt))) {
    const ageDays = (Date.parse(asOf) - Date.parse(reviewed.checked_at)) / 86400000;
    return {
      source_health: ageDays > healthyAgeDays ? 'degraded' : reviewed.source_health,
      last_source_revalidation_at: reviewed.checked_at,
    };
  }
  return {
    source_health: sourceHealth(lastCheckedDate, statuses, planningDate),
    last_source_revalidation_at: publicCheckedAt,
  };
}

const meetingList = readJson(meetingListPath);
const policy = readJson(policyPath);
const seasonState = readJson(seasonStatePath);
const sourceHealthState = readJson(sourceHealthStatePath);
const seasonErrors = validateSeasonState(seasonState);
if (seasonErrors.length) throw new Error(`invalid reviewed season state: ${seasonErrors.join('; ')}`);
const sourceHealthErrors = validateReviewedSourceHealth(sourceHealthState);
if (sourceHealthErrors.length) throw new Error(`invalid reviewed source health state: ${sourceHealthErrors.join('; ')}`);
const registry = loadCalendarAcquisitionRegistryV1(root);
for (const record of sourceHealthState.records) {
  if (!registry.records.some((entry) => entry.system_id === record.system_id)) {
    throw new Error(`reviewed source health Registry profile missing for ${record.system_id}`);
  }
}
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
  const futureActiveSeason = reviewedSeason.season_state === 'offseason'
    ? futureActiveSeasonRecord(seasonState, rule.system_id, planningDate, windowEndExclusive)
    : null;

  const systemMeetings = meetings.filter((meeting) => meeting.authority_id === profile.authority_id);
  const dates = systemMeetings.map((meeting) => meeting.date).filter(Boolean);
  const checkedDates = systemMeetings.map((meeting) => meeting.last_checked_date).filter(Boolean);
  const statuses = systemMeetings.map((meeting) => meeting.source_status).filter(Boolean);
  const latestMeetingDate = maxString(dates);
  const lastCheckedDate = maxString(checkedDates);
  const publicNextMeetingDate = minString(dates.filter((date) => date >= planningDate));
  const nextMeetingDate = publicNextMeetingDate ?? reviewedSeason.next_known_meeting_date ?? futureActiveSeason?.next_known_meeting_date ?? null;
  const sourceVisibleHorizonEndExclusive = latestMeetingDate === null ? null : addDays(latestMeetingDate, 1);
  const resolvedSourceHealth = resolveSourceHealth({
    sourceHealthState,
    systemId: rule.system_id,
    lastCheckedDate,
    statuses,
    planningDate,
    asOf,
  });

  const gapStart = sourceVisibleHorizonEndExclusive === null || sourceVisibleHorizonEndExclusive < tomorrow
    ? tomorrow
    : sourceVisibleHorizonEndExclusive;
  let coverageGaps = [];
  if (reviewedSeason.season_state === 'active') {
    const activeEnd = reviewedSeason.effective_end_date_exclusive < windowEndExclusive
      ? reviewedSeason.effective_end_date_exclusive
      : windowEndExclusive;
    if (gapStart < activeEnd) {
      coverageGaps = [{ start_date: gapStart, end_date_exclusive: activeEnd, timezone: systemMeetings[0]?.timezone ?? 'UTC' }];
    }
  } else if (reviewedSeason.season_state === 'offseason' && futureActiveSeason !== null) {
    const futureStart = gapStart > futureActiveSeason.effective_start_date ? gapStart : futureActiveSeason.effective_start_date;
    const futureEnd = futureActiveSeason.effective_end_date_exclusive < windowEndExclusive
      ? futureActiveSeason.effective_end_date_exclusive
      : windowEndExclusive;
    if (futureStart < futureEnd) {
      coverageGaps = [{ start_date: futureStart, end_date_exclusive: futureEnd, timezone: systemMeetings[0]?.timezone ?? 'UTC' }];
    }
  }

  systemStates.push({
    system_id: rule.system_id,
    timezone: systemMeetings[0]?.timezone ?? 'UTC',
    season_state: reviewedSeason.season_state,
    future_active_start_date: futureActiveSeason?.effective_start_date ?? null,
    source_health: resolvedSourceHealth.source_health,
    last_successful_collection_at: dateTimeFromDate(lastCheckedDate),
    last_source_revalidation_at: resolvedSourceHealth.last_source_revalidation_at,
    source_visible_horizon_end_exclusive: sourceVisibleHorizonEndExclusive,
    next_meeting_date: nextMeetingDate,
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
  future_wake_up_systems: systemStates.filter((entry) => entry.future_active_start_date !== null).map((entry) => entry.system_id),
  systems_with_coverage_gaps: systemStates.filter((entry) => entry.coverage_gaps.length > 0).map((entry) => entry.system_id),
}));
