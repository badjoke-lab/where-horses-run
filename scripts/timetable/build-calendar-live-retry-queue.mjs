import fs from 'node:fs';
import path from 'node:path';
import { loadCalendarAcquisitionRegistryV1 } from './load-calendar-acquisition-registry.mjs';
import {
  validateRankAwareRetryQueueV1,
  validateRetryEntryAgainstCanonicalMeetingV1,
  validateRetryEntryAgainstRegistryV1,
} from './rank-aware-retry-queue-validation.mjs';

const root = process.cwd();
const args = new Map(process.argv.slice(2).map((arg) => {
  const index = arg.indexOf('=');
  return index === -1 ? [arg, true] : [arg.slice(0, index), arg.slice(index + 1)];
}));

const canonicalPath = args.get('--canonical') ?? 'data/generated/timetable/canonical/meetings.json';
const policyPath = args.get('--policy') ?? 'data/static/calendar-due-job-policy-v1.json';
const outputPath = args.get('--output');
const asOf = args.get('--as-of') ?? new Date().toISOString();
if (!outputPath) throw new Error('--output=<path> is required');
if (Number.isNaN(Date.parse(asOf))) throw new Error('--as-of must be a valid ISO date-time');

const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.resolve(root, relativePath), 'utf8'));
const canonical = readJson(canonicalPath);
const policy = readJson(policyPath);
const registry = loadCalendarAcquisitionRegistryV1(root);
const profile = registry.records.find((record) => record.system_id === 'japan-nar-system');
if (!profile) throw new Error('japan-nar-system Registry profile missing');
const rule = policy.system_rules?.find((record) => record.system_id === 'japan-nar-system');
if (!rule?.rank_retry?.enabled) throw new Error('japan-nar-system rank retry must be enabled');
if (!Number.isInteger(rule.rank_retry.max_attempt_count) || rule.rank_retry.max_attempt_count < 1) {
  throw new Error('japan-nar-system max_attempt_count must be positive');
}

function tokyoDate(value) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(value));
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

function addDays(date, days) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

const planningDate = tokyoDate(asOf);
const oldestEligibleDate = addDays(planningDate, -(rule.rank_retry.max_attempt_count - 1));
const canonicalMeetings = Array.isArray(canonical.meetings) ? canonical.meetings : [];
const canonicalById = new Map(canonicalMeetings.map((meeting) => [meeting.meeting_id, meeting]));

const entries = canonicalMeetings
  .filter((meeting) => meeting.authority_id === profile.authority_id)
  .filter((meeting) => meeting.capability_rank === 'C')
  .filter((meeting) => typeof meeting.date === 'string' && oldestEligibleDate <= meeting.date && meeting.date <= planningDate)
  .sort((left, right) => left.meeting_id.localeCompare(right.meeting_id))
  .map((meeting) => ({
    meeting_id: meeting.meeting_id,
    system_id: profile.system_id,
    current_reviewed_rank: meeting.capability_rank,
    latest_observed_rank: meeting.capability_rank,
    collection_target_rank: profile.collection_target_rank,
    missing_fields: ['first_race_time_local', 'last_race_time_local', 'timetable_rows'],
    retry_reason: 'rank_upgrade_retry',
    retry_scope: {
      mode: 'selected_meetings',
      meeting_ids: [meeting.meeting_id],
    },
    primary_runner: profile.primary_runner,
    fallback_runner: profile.fallback_runner,
    adapter_id: profile.detail_adapter_id,
    next_eligible_retry_at: null,
    attempt_count: 0,
    last_attempt_at: null,
  }));

const queue = {
  schema_version: 'calendar-rank-aware-retry-queue-v1',
  generated_at: asOf,
  entries,
};

const errors = validateRankAwareRetryQueueV1(queue);
for (const entry of entries) {
  errors.push(...validateRetryEntryAgainstRegistryV1(entry, registry).map((error) => `${entry.meeting_id}: ${error}`));
  errors.push(...validateRetryEntryAgainstCanonicalMeetingV1(entry, canonicalById.get(entry.meeting_id), registry).map((error) => `${entry.meeting_id}: ${error}`));
}
if (errors.length) throw new Error(`live retry queue invalid: ${errors.join('; ')}`);

const output = path.resolve(root, outputPath);
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(queue, null, 2)}\n`);
console.log(JSON.stringify({
  output: path.relative(root, output),
  generated_at: asOf,
  planning_date: planningDate,
  oldest_eligible_date: oldestEligibleDate,
  entry_count: entries.length,
  meeting_ids: entries.map((entry) => entry.meeting_id),
  source: 'canonical_dynamic_no_fixed_meeting_ids',
}));
