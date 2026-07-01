const TOP_LEVEL_KEYS = [
  'schema_version',
  'work_id',
  'generated_at',
  'source_stage',
  'source_stage_note',
  'final_confirmation_after',
  'review_status',
  'promotion_eligible',
  'review',
  'records',
  'boundaries'
];

const RECORD_KEYS = [
  'meeting_id',
  'country_id',
  'authority_id',
  'racing_system_id',
  'racecourse_id',
  'racecourse_name',
  'meeting_label_ja',
  'date',
  'timezone',
  'source_stage',
  'promotion_eligible',
  'first_race_time_local',
  'last_race_time_local',
  'timetable_rows',
  'source'
];

const ROW_KEYS = [
  'label',
  'post_time_local',
  'race_name',
  'distance_m',
  'surface',
  'course_label'
];

const SOURCE_KEYS = ['source_id', 'official_url', 'checked_at', 'acquisition_method'];
const REVIEW_KEYS = ['status', 'reviewer', 'reviewed_at', 'summary'];
const BOUNDARY_KEYS = [
  'source_body_stored',
  'participant_data_stored',
  'betting_data_stored',
  'result_data_stored',
  'candidate_generated',
  'canonical_written',
  'public_projection_written'
];

const REQUIRED_TOP_LEVEL_KEYS = [
  'schema_version',
  'work_id',
  'generated_at',
  'source_stage',
  'final_confirmation_after',
  'promotion_eligible',
  'review',
  'records',
  'boundaries'
];

const PROHIBITED_KEY_FRAGMENTS = [
  'horse_name',
  'jockey_name',
  'trainer_name',
  'runner',
  'entries',
  'odds',
  'payout',
  'prediction',
  'tip',
  'raw_html',
  'raw_body',
  'source_body_content',
  'stream_url',
  'credential',
  'cookie',
  'secret',
  'access_token'
];

const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function requireExactKeys(value, allowed, required, label, errors) {
  if (!isObject(value)) {
    errors.push(`${label} must be an object.`);
    return false;
  }
  for (const key of required) {
    if (!Object.hasOwn(value, key)) errors.push(`${label}.${key} is required.`);
  }
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) errors.push(`${label}.${key} is not allowed.`);
  }
  return true;
}

function requireIsoDateTime(value, label, errors) {
  if (!isNonEmptyString(value) || Number.isNaN(Date.parse(value))) {
    errors.push(`${label} must be a valid ISO date-time.`);
  }
}

function requireDate(value, label, errors) {
  if (!DATE_PATTERN.test(value ?? '')) {
    errors.push(`${label} must use YYYY-MM-DD.`);
    return;
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    errors.push(`${label} must be a real calendar date.`);
  }
}

function requireTime(value, label, errors) {
  if (!TIME_PATTERN.test(value ?? '')) errors.push(`${label} must use HH:MM.`);
}

function requireHttpsJraUrl(value, allowedHosts, label, errors) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') errors.push(`${label} must use HTTPS.`);
    if (!allowedHosts.includes(url.hostname)) errors.push(`${label} must use an allowed JRA host.`);
  } catch {
    errors.push(`${label} must be a valid URL.`);
  }
}

function walkProhibitedKeys(value, label, errors) {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => walkProhibitedKeys(entry, `${label}[${index}]`, errors));
    return;
  }
  if (!isObject(value)) return;
  for (const [key, child] of Object.entries(value)) {
    const normalized = key.toLowerCase();
    if (PROHIBITED_KEY_FRAGMENTS.some((fragment) => normalized.includes(fragment))) {
      errors.push(`${label}.${key} uses a prohibited key.`);
    }
    walkProhibitedKeys(child, `${label}.${key}`, errors);
  }
}

export function validateJraFinalProgramIntake(value, control = null) {
  const errors = [];
  const allowedHosts = Array.isArray(control?.allowed_hosts) && control.allowed_hosts.length
    ? control.allowed_hosts
    : ['www.jra.go.jp', 'jra.jp'];
  const expectedSystemId = control?.system_id ?? 'japan-jra-system';

  if (!requireExactKeys(value, TOP_LEVEL_KEYS, REQUIRED_TOP_LEVEL_KEYS, 'final', errors)) {
    return { valid: false, errors };
  }

  if (value.schema_version !== 'jra-final-program-intake-v1') errors.push('final.schema_version must be jra-final-program-intake-v1.');
  if (value.work_id !== 'WHR-CAL-JAPAN-JRA') errors.push('final.work_id must be WHR-CAL-JAPAN-JRA.');
  if (value.source_stage !== 'final_program') errors.push('final.source_stage must be final_program.');
  if (value.promotion_eligible !== false) errors.push('final.promotion_eligible must be false.');
  if (value.source_stage_note !== undefined && !isNonEmptyString(value.source_stage_note)) errors.push('final.source_stage_note must be a non-empty string when present.');
  requireIsoDateTime(value.generated_at, 'final.generated_at', errors);
  requireIsoDateTime(value.final_confirmation_after, 'final.final_confirmation_after', errors);

  if (value.review_status !== undefined && !['needs_review', 'approved'].includes(value.review_status)) {
    errors.push('final.review_status must be needs_review or approved when present.');
  }

  if (requireExactKeys(value.review, REVIEW_KEYS, ['status', 'reviewer', 'reviewed_at'], 'final.review', errors)) {
    if (!['needs_review', 'approved'].includes(value.review.status)) errors.push('final.review.status must be needs_review or approved.');
    if (value.review.summary !== undefined && typeof value.review.summary !== 'string') errors.push('final.review.summary must be a string when present.');
    if (value.review.status === 'approved') {
      if (!isNonEmptyString(value.review.reviewer)) errors.push('final.review.reviewer is required for approved input.');
      requireIsoDateTime(value.review.reviewed_at, 'final.review.reviewed_at', errors);
    } else {
      if (value.review.reviewer !== null) errors.push('final.review.reviewer must be null while needs_review.');
      if (value.review.reviewed_at !== null) errors.push('final.review.reviewed_at must be null while needs_review.');
    }
    if (value.review_status !== undefined && value.review_status !== value.review.status) {
      errors.push('final.review_status must match final.review.status.');
    }
  }

  if (requireExactKeys(value.boundaries, BOUNDARY_KEYS, BOUNDARY_KEYS, 'final.boundaries', errors)) {
    for (const key of BOUNDARY_KEYS) {
      if (value.boundaries[key] !== false) errors.push(`final.boundaries.${key} must be false.`);
    }
  }

  if (!Array.isArray(value.records) || value.records.length === 0) {
    errors.push('final.records must be a non-empty array.');
  } else {
    const seenMeetingIds = new Set();
    for (const [recordIndex, record] of value.records.entries()) {
      const label = `final.records[${recordIndex}]`;
      if (!requireExactKeys(record, RECORD_KEYS, RECORD_KEYS, label, errors)) continue;

      if (!ID_PATTERN.test(record.meeting_id ?? '')) errors.push(`${label}.meeting_id must be a stable ID.`);
      if (seenMeetingIds.has(record.meeting_id)) errors.push(`${label}.meeting_id duplicates ${record.meeting_id}.`);
      seenMeetingIds.add(record.meeting_id);
      if (record.country_id !== 'japan') errors.push(`${label}.country_id must be japan.`);
      if (record.authority_id !== 'jra') errors.push(`${label}.authority_id must be jra.`);
      if (record.racing_system_id !== expectedSystemId) errors.push(`${label}.racing_system_id must match JRA pilot control.`);
      if (!ID_PATTERN.test(record.racecourse_id ?? '')) errors.push(`${label}.racecourse_id must be a stable ID.`);
      if (!isNonEmptyString(record.racecourse_name)) errors.push(`${label}.racecourse_name must be a non-empty string.`);
      if (!isNonEmptyString(record.meeting_label_ja)) errors.push(`${label}.meeting_label_ja must be a non-empty string.`);
      requireDate(record.date, `${label}.date`, errors);
      if (record.timezone !== 'Asia/Tokyo') errors.push(`${label}.timezone must be Asia/Tokyo.`);
      if (record.source_stage !== 'final_program') errors.push(`${label}.source_stage must be final_program.`);
      if (record.promotion_eligible !== false) errors.push(`${label}.promotion_eligible must be false.`);
      requireTime(record.first_race_time_local, `${label}.first_race_time_local`, errors);
      requireTime(record.last_race_time_local, `${label}.last_race_time_local`, errors);

      if (!Array.isArray(record.timetable_rows) || record.timetable_rows.length === 0) {
        errors.push(`${label}.timetable_rows must be a non-empty array.`);
      } else {
        for (const [rowIndex, row] of record.timetable_rows.entries()) {
          const rowLabel = `${label}.timetable_rows[${rowIndex}]`;
          if (!requireExactKeys(row, ROW_KEYS, ROW_KEYS, rowLabel, errors)) continue;
          if (row.label !== `Race ${rowIndex + 1}`) errors.push(`${rowLabel}.label must equal Race ${rowIndex + 1}.`);
          requireTime(row.post_time_local, `${rowLabel}.post_time_local`, errors);
          if (row.race_name !== null && !isNonEmptyString(row.race_name)) errors.push(`${rowLabel}.race_name must be a non-empty string or null.`);
          if (row.distance_m !== null && (!Number.isInteger(row.distance_m) || row.distance_m < 1)) errors.push(`${rowLabel}.distance_m must be a positive integer or null.`);
          if (row.surface !== null && !isNonEmptyString(row.surface)) errors.push(`${rowLabel}.surface must be a non-empty string or null.`);
          if (row.course_label !== null && !isNonEmptyString(row.course_label)) errors.push(`${rowLabel}.course_label must be a non-empty string or null.`);
        }
        if (record.timetable_rows[0]?.post_time_local !== record.first_race_time_local) errors.push(`${label}.first_race_time_local must match the first timetable row.`);
        if (record.timetable_rows.at(-1)?.post_time_local !== record.last_race_time_local) errors.push(`${label}.last_race_time_local must match the last timetable row.`);
      }

      if (requireExactKeys(record.source, SOURCE_KEYS, SOURCE_KEYS, `${label}.source`, errors)) {
        if (record.source.source_id !== 'jra-programme') errors.push(`${label}.source.source_id must be jra-programme.`);
        requireHttpsJraUrl(record.source.official_url, allowedHosts, `${label}.source.official_url`, errors);
        requireIsoDateTime(record.source.checked_at, `${label}.source.checked_at`, errors);
        if (record.source.acquisition_method !== 'reviewed_final_program_fixture') {
          errors.push(`${label}.source.acquisition_method must be reviewed_final_program_fixture.`);
        }
      }
    }
  }

  walkProhibitedKeys(value, 'final', errors);
  return { valid: errors.length === 0, errors };
}

export function assertJraFinalProgramIntake(value, control = null) {
  const result = validateJraFinalProgramIntake(value, control);
  if (!result.valid) {
    throw new Error(`JRA final-program intake validation failed: ${result.errors.join(' | ')}`);
  }
  return value;
}

export const jraFinalProgramIntakeContract = Object.freeze({
  schema_version: 'jra-final-program-intake-v1',
  top_level_keys: TOP_LEVEL_KEYS,
  record_keys: RECORD_KEYS,
  row_keys: ROW_KEYS,
  source_keys: SOURCE_KEYS,
  review_keys: REVIEW_KEYS,
  boundary_keys: BOUNDARY_KEYS,
  prohibited_key_fragments: PROHIBITED_KEY_FRAGMENTS
});
