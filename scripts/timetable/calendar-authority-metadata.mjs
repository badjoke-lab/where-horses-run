import { createHash } from 'node:crypto';

export const CALENDAR_ACQUISITION_ATTEMPT_STATUSES = Object.freeze([
  'success',
  'source_error',
  'network_error',
  'parser_failure',
  'pending_publication',
  'implementation_gap',
  'not_applicable',
]);

export const CALENDAR_ACQUISITION_DISPOSITIONS = Object.freeze([
  'promoted',
  'complete_current_best_available',
  'pending_publication',
  'retry_required',
  'implementation_gap',
  'not_applicable',
]);

const RANKS = new Set(['C', 'B', 'B+', 'A', 'A+']);
const SUPPORT_KEYS = new Set([
  'meeting_identity',
  'meeting_date',
  'race_times',
  'timetable',
  'race_names',
  'distances',
  'surfaces',
  'courses',
  'race_overrides',
]);
const RACE_SUPPORT_KEYS = new Set([
  'race_times',
  'race_names',
  'distances',
  'surfaces',
  'courses',
]);
const CHANGE_ACTIONS = new Set(['correct', 'withdraw', 'invalidate']);
const CHANGE_REASON_TYPES = new Set([
  'official_correction',
  'official_retraction',
  'parser_error',
  'reviewed_correction',
  'other',
]);
const CHANGE_SCOPES = new Set(['meeting', 'detail', 'field']);
const CHANGE_FIELDS = new Set([
  'meeting_identity',
  'meeting_date',
  'race_time',
  'race_name',
  'distance',
  'surface',
  'course',
]);

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function validDateTime(value) {
  if (typeof value !== 'string') return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})[Tt](\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:[Zz]|([+-])(\d{2}):(\d{2}))$/.exec(value);
  if (!match) return false;
  const [, yearText, monthText, dayText, hourText, minuteText, secondText, , offsetHourText, offsetMinuteText] = match;
  const [year, month, day, hour, minute, second] = [yearText, monthText, dayText, hourText, minuteText, secondText].map(Number);
  if (year < 1 || month < 1 || month > 12 || hour > 23 || minute > 59 || second > 59) return false;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  if (day < 1 || day > daysInMonth) return false;
  if (offsetHourText !== undefined && (Number(offsetHourText) > 23 || Number(offsetMinuteText) > 59)) return false;
  return !Number.isNaN(Date.parse(value));
}

function unknownKeys(value, allowed, label, errors) {
  if (!isObject(value)) return;
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) errors.push(`${label} has unsupported field ${key}`);
  }
}

function validateEvidenceProvenance(value, label, errors) {
  if (!isObject(value)) {
    errors.push(`${label} must be an object`);
    return;
  }
  unknownKeys(value, new Set([
    'source_id',
    'official_source_url',
    'observed_at',
    'successfully_verified_at',
    'acquisition_method',
    'review',
  ]), label, errors);
  if (typeof value.source_id !== 'string' || !value.source_id) errors.push(`${label}.source_id is required`);
  if (value.official_source_url !== null
    && (typeof value.official_source_url !== 'string' || !value.official_source_url.startsWith('https://'))) {
    errors.push(`${label}.official_source_url must be HTTPS or null`);
  }
  for (const key of ['observed_at', 'successfully_verified_at']) {
    if (value[key] !== null && !validDateTime(value[key])) errors.push(`${label}.${key} must be an ISO date-time or null`);
  }
  if (!['automatic', 'reviewed'].includes(value.acquisition_method)) errors.push(`${label}.acquisition_method is invalid`);
  if (value.acquisition_method === 'reviewed') {
    if (!isObject(value.review)) {
      errors.push(`${label}.review is required for reviewed evidence`);
    } else {
      unknownKeys(value.review, new Set(['reviewed_at', 'reviewer', 'evidence_reference']), `${label}.review`, errors);
      if (!validDateTime(value.review.reviewed_at)) errors.push(`${label}.review.reviewed_at must be an ISO date-time`);
      if (typeof value.review.reviewer !== 'string' || !value.review.reviewer) errors.push(`${label}.review.reviewer is required`);
      if (value.review.evidence_reference != null
        && (typeof value.review.evidence_reference !== 'string' || !value.review.evidence_reference)) {
        errors.push(`${label}.review.evidence_reference must be a non-empty string or null`);
      }
    }
  } else if ('review' in value) {
    errors.push(`${label}.review is only valid for reviewed evidence`);
  }
}

export function validateCalendarAuthorityMetadataV1(value, label = 'calendar_authority_metadata') {
  const errors = [];
  if (!isObject(value)) return [`${label} must be an object`];
  unknownKeys(value, new Set([
    'acquisition_attempt',
    'acquisition_completion',
    'evidence_support',
    'evidence_changes',
  ]), label, errors);

  if ('acquisition_attempt' in value) {
    const attempt = value.acquisition_attempt;
    if (!isObject(attempt)) {
      errors.push(`${label}.acquisition_attempt must be an object`);
    } else {
      unknownKeys(attempt, new Set(['attempted_at', 'status', 'source_id', 'route_id', 'error_code']), `${label}.acquisition_attempt`, errors);
      if (!validDateTime(attempt.attempted_at)) errors.push(`${label}.acquisition_attempt.attempted_at must be an ISO date-time`);
      if (!CALENDAR_ACQUISITION_ATTEMPT_STATUSES.includes(attempt.status)) errors.push(`${label}.acquisition_attempt.status is invalid`);
      for (const key of ['source_id', 'route_id', 'error_code']) {
        if (attempt[key] != null && (typeof attempt[key] !== 'string' || !attempt[key])) {
          errors.push(`${label}.acquisition_attempt.${key} must be a non-empty string or null`);
        }
      }
    }
  }

  if ('acquisition_completion' in value) {
    const completion = value.acquisition_completion;
    if (!isObject(completion)) {
      errors.push(`${label}.acquisition_completion must be an object`);
    } else {
      unknownKeys(completion, new Set([
        'disposition',
        'observed_rank',
        'technical_capability_rank',
        'evaluated_capability_rank',
        'higher_rank_open',
        'reason',
      ]), `${label}.acquisition_completion`, errors);
      if (!CALENDAR_ACQUISITION_DISPOSITIONS.includes(completion.disposition)) errors.push(`${label}.acquisition_completion.disposition is invalid`);
      for (const key of ['observed_rank', 'technical_capability_rank']) {
        if (!RANKS.has(completion[key])) errors.push(`${label}.acquisition_completion.${key} is invalid`);
      }
      if (completion.evaluated_capability_rank != null && !RANKS.has(completion.evaluated_capability_rank)) {
        errors.push(`${label}.acquisition_completion.evaluated_capability_rank is invalid`);
      }
      if (typeof completion.higher_rank_open !== 'boolean') errors.push(`${label}.acquisition_completion.higher_rank_open must be boolean`);
      if (typeof completion.reason !== 'string' || !completion.reason) errors.push(`${label}.acquisition_completion.reason is required`);
    }
  }

  if ('evidence_support' in value) {
    const support = value.evidence_support;
    if (!isObject(support)) {
      errors.push(`${label}.evidence_support must be an object`);
    } else {
      unknownKeys(support, SUPPORT_KEYS, `${label}.evidence_support`, errors);
      for (const [key, provenance] of Object.entries(support)) {
        if (key !== 'race_overrides') {
          validateEvidenceProvenance(provenance, `${label}.evidence_support.${key}`, errors);
          continue;
        }
        if (!isObject(provenance)) {
          errors.push(`${label}.evidence_support.race_overrides must be an object`);
          continue;
        }
        for (const [raceLabel, override] of Object.entries(provenance)) {
          const overrideLabel = `${label}.evidence_support.race_overrides.${raceLabel}`;
          if (!raceLabel) errors.push(`${label}.evidence_support.race_overrides race label must be non-empty`);
          if (!isObject(override)) {
            errors.push(`${overrideLabel} must be an object`);
            continue;
          }
          unknownKeys(override, RACE_SUPPORT_KEYS, overrideLabel, errors);
          if (Object.keys(override).length === 0) errors.push(`${overrideLabel} must contain at least one race-value group`);
          for (const [group, raceProvenance] of Object.entries(override)) {
            validateEvidenceProvenance(raceProvenance, `${overrideLabel}.${group}`, errors);
          }
        }
      }
    }
  }

  if ('evidence_changes' in value) {
    if (!Array.isArray(value.evidence_changes)) {
      errors.push(`${label}.evidence_changes must be an array`);
    } else {
      for (const [index, change] of value.evidence_changes.entries()) {
        const changeLabel = `${label}.evidence_changes[${index}]`;
        if (!isObject(change)) {
          errors.push(`${changeLabel} must be an object`);
          continue;
        }
        unknownKeys(change, new Set(['target', 'action', 'reason_type', 'reason', 'evidence']), changeLabel, errors);
        const target = change.target;
        if (!isObject(target)) {
          errors.push(`${changeLabel}.target must be an object`);
        } else {
          unknownKeys(target, new Set(['meeting_id', 'scope', 'field', 'race_label']), `${changeLabel}.target`, errors);
          if (typeof target.meeting_id !== 'string' || !target.meeting_id) errors.push(`${changeLabel}.target.meeting_id is required`);
          if (!CHANGE_SCOPES.has(target.scope)) errors.push(`${changeLabel}.target.scope is invalid`);
          if (target.scope === 'field' && !CHANGE_FIELDS.has(target.field)) errors.push(`${changeLabel}.target.field is required for field scope`);
          if (target.field != null && !CHANGE_FIELDS.has(target.field)) errors.push(`${changeLabel}.target.field is invalid`);
          if (target.race_label != null && (typeof target.race_label !== 'string' || !target.race_label)) errors.push(`${changeLabel}.target.race_label must be a non-empty string or null`);
        }
        if (!CHANGE_ACTIONS.has(change.action)) errors.push(`${changeLabel}.action is invalid`);
        if (!CHANGE_REASON_TYPES.has(change.reason_type)) errors.push(`${changeLabel}.reason_type is invalid`);
        if (typeof change.reason !== 'string' || !change.reason) errors.push(`${changeLabel}.reason is required`);
        validateEvidenceProvenance(change.evidence, `${changeLabel}.evidence`, errors);
      }
    }
  }

  return errors;
}

export function mergeEvidenceSupportV1(previous = {}, current = {}) {
  const merged = { ...structuredClone(previous), ...structuredClone(current) };
  const previousOverrides = isObject(previous.race_overrides) ? previous.race_overrides : {};
  const currentOverrides = isObject(current.race_overrides) ? current.race_overrides : {};
  if (Object.keys(previousOverrides).length > 0 || Object.keys(currentOverrides).length > 0) {
    const raceOverrides = structuredClone(previousOverrides);
    for (const [raceLabel, groups] of Object.entries(currentOverrides)) {
      raceOverrides[raceLabel] = {
        ...(raceOverrides[raceLabel] ?? {}),
        ...structuredClone(groups),
      };
    }
    merged.race_overrides = raceOverrides;
  }
  return merged;
}

function withoutPublicationSnapshot(dataset) {
  const copy = { ...dataset };
  delete copy.publication_snapshot;
  return copy;
}

function publicationSnapshotId(meetingListDataset, meetingDetailsDataset) {
  const payload = JSON.stringify({
    meeting_list: withoutPublicationSnapshot(meetingListDataset),
    meeting_details: withoutPublicationSnapshot(meetingDetailsDataset),
  });
  return `sha256:${createHash('sha256').update(payload).digest('hex')}`;
}

export function attachPublicationSnapshotV1(meetingListDataset, meetingDetailsDataset, logicalGeneratedAt) {
  if (!validDateTime(logicalGeneratedAt)) throw new Error('publication snapshot generated_at must be an ISO date-time');
  const snapshot = {
    schema_version: 'calendar-publication-snapshot-v1',
    snapshot_id: publicationSnapshotId(meetingListDataset, meetingDetailsDataset),
    generated_at: logicalGeneratedAt,
  };
  return {
    meetingListDataset: { ...meetingListDataset, publication_snapshot: snapshot },
    meetingDetailsDataset: { ...meetingDetailsDataset, publication_snapshot: snapshot },
  };
}

export function validatePublicationSnapshotPairV1(meetingListDataset, meetingDetailsDataset) {
  const errors = [];
  const listSnapshot = meetingListDataset?.publication_snapshot;
  const detailSnapshot = meetingDetailsDataset?.publication_snapshot;
  if (!isObject(listSnapshot) || !isObject(detailSnapshot)) return ['both public artifacts must have publication_snapshot'];
  if (JSON.stringify(listSnapshot) !== JSON.stringify(detailSnapshot)) errors.push('public artifacts have different publication_snapshot values');
  if (listSnapshot.schema_version !== 'calendar-publication-snapshot-v1') errors.push('publication_snapshot.schema_version is invalid');
  if (!validDateTime(listSnapshot.generated_at)) errors.push('publication_snapshot.generated_at must be an ISO date-time');
  const expectedId = publicationSnapshotId(meetingListDataset, meetingDetailsDataset);
  if (listSnapshot.snapshot_id !== expectedId) errors.push('publication_snapshot.snapshot_id does not match public artifact content');
  return errors;
}
