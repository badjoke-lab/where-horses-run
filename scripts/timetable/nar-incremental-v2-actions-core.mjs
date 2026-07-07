import { batchPaths } from './nar-incremental-v2-core.mjs';
import { isRealDate } from './nar-incremental-core.mjs';

const BATCH_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MODES = new Set(['date_window', 'selected_meetings']);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function value(env, key) {
  return String(env[key] ?? '').trim();
}

function normalizeMeetingIds(raw) {
  return [...new Set(
    String(raw ?? '')
      .split(/[\s,]+/)
      .map((item) => item.trim())
      .filter(Boolean),
  )].sort();
}

export function buildActionsCollectionPlan(env = process.env) {
  const batchId = value(env, 'WHR_BATCH_ID');
  const mode = value(env, 'WHR_MODE');
  const startDate = value(env, 'WHR_START_DATE');
  const endDateExclusive = value(env, 'WHR_END_DATE_EXCLUSIVE');
  const meetingIds = normalizeMeetingIds(env.WHR_MEETING_IDS);
  const checkedAt = value(env, 'WHR_CHECKED_AT');

  assert(BATCH_ID_PATTERN.test(batchId), 'WHR_BATCH_ID is required and must use lowercase kebab-case.');
  assert(MODES.has(mode), 'WHR_MODE must be date_window or selected_meetings.');

  const args = [`--batch-id=${batchId}`];

  if (mode === 'date_window') {
    assert(isRealDate(startDate), 'WHR_START_DATE must be a real YYYY-MM-DD date for date_window mode.');
    assert(isRealDate(endDateExclusive), 'WHR_END_DATE_EXCLUSIVE must be a real YYYY-MM-DD date for date_window mode.');
    assert(startDate < endDateExclusive, 'WHR_END_DATE_EXCLUSIVE must be after WHR_START_DATE.');
    assert(meetingIds.length === 0, 'WHR_MEETING_IDS must be empty for date_window mode.');
    args.push(`--start-date=${startDate}`, `--end-date-exclusive=${endDateExclusive}`);
  } else {
    assert(startDate === '' && endDateExclusive === '', 'date fields must be empty for selected_meetings mode.');
    assert(meetingIds.length > 0, 'WHR_MEETING_IDS is required for selected_meetings mode.');
    for (const meetingId of meetingIds) {
      assert(/^nar-[a-z0-9]+(?:-[a-z0-9]+)*-\d{4}-\d{2}-\d{2}$/.test(meetingId), `invalid NAR meeting ID: ${meetingId}`);
    }
    args.push(`--meeting-ids=${meetingIds.join(',')}`);
  }

  if (checkedAt) {
    assert(!Number.isNaN(Date.parse(checkedAt)), 'WHR_CHECKED_AT must be a valid date-time when provided.');
    args.push(`--checked-at=${checkedAt}`);
  }

  return Object.freeze({
    batchId,
    mode,
    args: Object.freeze(args),
    artifactPaths: Object.freeze(batchPaths(batchId)),
  });
}

export const narIncrementalV2ActionsModes = Object.freeze([...MODES]);
