import { deriveBestAvailableRank, rankIndex } from './best-available-rank.mjs';
import {
  mergeEvidenceSupportV1,
  validateCalendarAuthorityMetadataV1,
} from './calendar-authority-metadata.mjs';

const MEETING_IDENTITY_FIELDS = ['country_id', 'authority_id', 'racing_system_id', 'racecourse_id', 'timezone'];
const ATTEMPT_FAILURE_STATUSES = new Set([
  'source_error',
  'network_error',
  'parser_failure',
  'pending_publication',
  'implementation_gap',
  'not_applicable',
]);

function clone(value) {
  return value == null ? value : structuredClone(value);
}

function meaningful(value) {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  return true;
}

function mergeMeaningful(previous = {}, current = {}) {
  const next = { ...clone(previous) };
  for (const [key, value] of Object.entries(current ?? {})) {
    if (meaningful(value)) next[key] = clone(value);
  }
  return next;
}

function mergeEvidenceChanges(previous = [], current = []) {
  return [...new Map([...(previous ?? []), ...(current ?? [])]
    .map((change) => [JSON.stringify(change), clone(change)])).values()];
}

function explicitAttemptFailed(attempt) {
  return Boolean(attempt && ATTEMPT_FAILURE_STATUSES.has(attempt.status));
}

function authorityMetadataForValidation({
  candidateMeeting,
  acquisitionCompletion,
  acquisitionAttempt,
  evidenceChanges,
}) {
  return {
    ...(acquisitionAttempt !== undefined ? { acquisition_attempt: acquisitionAttempt } : {}),
    ...(acquisitionCompletion ? { acquisition_completion: acquisitionCompletion } : {}),
    ...(candidateMeeting?.evidence_support ? { evidence_support: candidateMeeting.evidence_support } : {}),
    ...(evidenceChanges?.length ? { evidence_changes: evidenceChanges } : {}),
  };
}

function assertAuthorityMetadataValid(args) {
  const metadata = authorityMetadataForValidation(args);
  const errors = validateCalendarAuthorityMetadataV1(metadata, args.candidateMeeting?.meeting_id ?? 'canonical_acceptance');
  if (errors.length) throw new Error(errors.join('; '));
}

export function mergeCanonicalTimetableRowsV1(previousRows = [], currentRows = [], { replace = false } = {}) {
  const incoming = Array.isArray(currentRows) ? currentRows : [];
  const previous = Array.isArray(previousRows) ? previousRows : [];
  if (replace) return incoming.map((row) => clone(row));
  if (incoming.length === 0) return previous.map((row) => clone(row));

  const incomingByLabel = new Map();
  for (const row of incoming) {
    if (!meaningful(row?.label)) continue;
    incomingByLabel.set(row.label, row);
  }

  const merged = previous.map((row) => {
    const incomingRow = incomingByLabel.get(row.label);
    if (!incomingRow) return clone(row);
    incomingByLabel.delete(row.label);
    return mergeMeaningful(row, incomingRow);
  });

  for (const row of incoming) {
    if (!meaningful(row?.label) || !incomingByLabel.has(row.label)) continue;
    merged.push(clone(row));
    incomingByLabel.delete(row.label);
  }
  return merged;
}

export function canonicalEvidenceRankV1(meeting, detail = null) {
  return deriveBestAvailableRank(meeting ?? {}, detail?.timetable_rows ?? []);
}

export function normalizeStoredCanonicalV1(meeting, detail = null) {
  if (!meeting) return { meeting: null, detail, changed: false };
  const evidenceRank = canonicalEvidenceRankV1(meeting, detail);
  const nextMeeting = meeting.capability_rank === evidenceRank
    ? meeting
    : {
        ...meeting,
        capability_rank: evidenceRank,
        display_status: evidenceRank === 'C' ? 'partial' : 'displayable',
      };
  const nextDetail = detail
    ? (detail.capability_rank === evidenceRank ? detail : { ...detail, capability_rank: evidenceRank })
    : null;
  return {
    meeting: nextMeeting,
    detail: nextDetail,
    changed: nextMeeting !== meeting || nextDetail !== detail,
  };
}

export function retainCurrentAcquisitionStateV1(meeting, {
  acquisitionCompletion = null,
  acquisitionAttempt = undefined,
} = {}) {
  if (!meeting) return { meeting, changed: false };
  const next = {
    ...meeting,
    ...(acquisitionCompletion ? { acquisition_completion: clone(acquisitionCompletion) } : {}),
    ...(acquisitionAttempt !== undefined ? { acquisition_attempt: clone(acquisitionAttempt) } : {}),
  };
  return {
    meeting: next,
    changed: JSON.stringify(next) !== JSON.stringify(meeting),
  };
}

function mergeAuthorityMetadata(previous, current, {
  acceptCurrentEvidence = true,
  consumedEvidenceChanges = [],
} = {}) {
  const next = {};
  const previousSupport = previous?.evidence_support;
  const currentSupport = acceptCurrentEvidence ? current?.evidence_support : null;
  if (previousSupport || currentSupport) {
    next.evidence_support = currentSupport
      ? mergeEvidenceSupportV1(previousSupport, currentSupport)
      : clone(previousSupport);
  }
  const combinedChanges = mergeEvidenceChanges(
    previous?.evidence_changes,
    [
      ...(current?.evidence_changes ?? []),
      ...(consumedEvidenceChanges ?? []),
    ],
  );
  if (combinedChanges.length) next.evidence_changes = combinedChanges;
  return next;
}

function candidateRowByLabel(candidateDetail, label) {
  return (candidateDetail?.timetable_rows ?? []).find((row) => row.label === label) ?? null;
}

function syncDetailIdentity(meeting, detail) {
  if (!detail) return detail;
  return {
    ...detail,
    meeting_id: meeting.meeting_id,
    country_id: meeting.country_id,
    authority_id: meeting.authority_id,
    racecourse_id: meeting.racecourse_id,
    date: meeting.date,
    timezone: meeting.timezone,
  };
}

function applyFieldChange({ meeting, detail, candidateMeeting, candidateDetail, change }) {
  const target = change.target ?? {};
  const remove = change.action === 'withdraw' || change.action === 'invalidate';

  if (target.field === 'meeting_date') {
    if (remove) throw new Error('meeting_date cannot be withdrawn from an existing canonical meeting');
    if (!meaningful(candidateMeeting?.date)) throw new Error('meeting_date correction requires candidate date');
    const nextMeeting = { ...meeting, date: candidateMeeting.date };
    return {
      meeting: nextMeeting,
      detail: detail ? { ...detail, date: candidateMeeting.date } : detail,
    };
  }

  if (target.field === 'meeting_identity') {
    if (remove) throw new Error('meeting_identity cannot be withdrawn from an existing canonical meeting');
    const identity = {};
    for (const key of MEETING_IDENTITY_FIELDS) {
      if (meaningful(candidateMeeting?.[key])) identity[key] = candidateMeeting[key];
    }
    if (Object.keys(identity).length === 0) throw new Error('meeting_identity correction requires candidate identity fields');
    const nextMeeting = { ...meeting, ...identity };
    return {
      meeting: nextMeeting,
      detail: syncDetailIdentity(nextMeeting, detail),
    };
  }

  const fieldMap = {
    race_time: 'post_time_local',
    race_name: 'race_name',
    distance: 'distance_m',
    surface: 'surface',
    course: 'course_label',
  };
  const field = fieldMap[target.field];
  if (!field) throw new Error(`unsupported field correction target: ${target.field}`);
  if (!target.race_label) throw new Error(`${target.field} correction requires race_label`);
  if (!detail) throw new Error(`correction target detail is missing for ${target.race_label}`);

  const rows = (detail.timetable_rows ?? []).map((row) => ({ ...row }));
  const index = rows.findIndex((row) => row.label === target.race_label);
  if (index < 0) throw new Error(`correction target race not found: ${target.race_label}`);

  if (remove) {
    delete rows[index][field];
  } else {
    const candidateRow = candidateRowByLabel(candidateDetail, target.race_label);
    if (!candidateRow || !meaningful(candidateRow[field])) {
      throw new Error(`${target.field} correction requires candidate value for ${target.race_label}`);
    }
    rows[index][field] = clone(candidateRow[field]);
  }
  return { meeting, detail: { ...detail, timetable_rows: rows } };
}

function applyEvidenceChanges({ meeting, detail, candidateMeeting, candidateDetail, evidenceChanges }) {
  let currentMeeting = meeting;
  let currentDetail = detail;
  let detailWithdrawn = false;

  for (const change of evidenceChanges ?? []) {
    if (change?.target?.meeting_id && change.target.meeting_id !== currentMeeting?.meeting_id) continue;

    if (change.target?.scope === 'field') {
      ({ meeting: currentMeeting, detail: currentDetail } = applyFieldChange({
        meeting: currentMeeting,
        detail: currentDetail,
        candidateMeeting,
        candidateDetail,
        change,
      }));
      continue;
    }

    if (change.target?.scope === 'detail') {
      if (change.action === 'withdraw' || change.action === 'invalidate') {
        currentDetail = null;
        detailWithdrawn = true;
      } else if (change.action === 'correct') {
        if (!candidateDetail) throw new Error('detail correction requires candidate detail');
        currentDetail = clone(candidateDetail);
      }
      continue;
    }

    if (change.target?.scope === 'meeting') {
      if (change.action === 'correct') {
        currentMeeting = mergeMeaningful(currentMeeting, candidateMeeting);
        currentDetail = candidateDetail ? clone(candidateDetail) : currentDetail;
        continue;
      }
      throw new Error('meeting-level withdrawal/invalidation requires an explicit removal workflow');
    }
  }

  return { meeting: currentMeeting, detail: currentDetail, detailWithdrawn };
}

function synchronizeDerivedTimes(meeting, detail, { detailWithdrawn = false } = {}) {
  if (detailWithdrawn) {
    return {
      ...meeting,
      first_race_time_local: null,
      last_race_time_local: null,
    };
  }
  const timedRows = (detail?.timetable_rows ?? []).filter((row) => meaningful(row?.post_time_local));
  if (!timedRows.length) return meeting;
  return {
    ...meeting,
    first_race_time_local: timedRows[0].post_time_local,
    last_race_time_local: timedRows.at(-1).post_time_local,
  };
}

export function acceptCanonicalObservationV1({
  previousMeeting = null,
  previousDetail = null,
  candidateMeeting,
  candidateDetail = null,
  acquisitionCompletion = null,
  acquisitionAttempt = undefined,
  explicitCorrection = false,
  evidenceChanges = candidateMeeting?.evidence_changes ?? [],
} = {}) {
  if (!candidateMeeting?.meeting_id) throw new Error('candidate meeting_id is required');

  assertAuthorityMetadataValid({
    candidateMeeting,
    acquisitionCompletion,
    acquisitionAttempt,
    evidenceChanges,
  });

  const normalizedPrevious = normalizeStoredCanonicalV1(previousMeeting, previousDetail);
  const priorMeeting = normalizedPrevious.meeting;
  const priorDetail = normalizedPrevious.detail;
  const candidateRank = canonicalEvidenceRankV1(candidateMeeting, candidateDetail);
  const priorRank = priorMeeting ? canonicalEvidenceRankV1(priorMeeting, priorDetail) : null;
  const failedAttempt = explicitAttemptFailed(acquisitionAttempt);
  const targetedOnly = !explicitCorrection && (evidenceChanges?.length ?? 0) > 0;

  let meeting;
  let detail;
  let decision;

  if (explicitCorrection && !failedAttempt) {
    meeting = {
      ...(priorMeeting ?? {}),
      ...clone(candidateMeeting),
    };
    detail = candidateDetail ? clone(candidateDetail) : null;
    decision = 'authoritative_replacement';
  } else if (!priorMeeting) {
    meeting = clone(candidateMeeting);
    detail = candidateDetail ? clone(candidateDetail) : null;
    decision = failedAttempt ? 'accepted_schedule_with_failed_attempt' : 'accepted_new';
  } else if (failedAttempt) {
    meeting = clone(priorMeeting);
    detail = clone(priorDetail);
    decision = 'retained_stronger_evidence';
  } else if (targetedOnly) {
    meeting = clone(priorMeeting);
    detail = clone(priorDetail);
    decision = 'targeted_evidence_change';
  } else {
    meeting = mergeMeaningful(priorMeeting, candidateMeeting);
    const mergedRows = mergeCanonicalTimetableRowsV1(
      priorDetail?.timetable_rows,
      candidateDetail?.timetable_rows,
    );
    detail = mergedRows.length
      ? {
          ...(priorDetail ?? {}),
          ...(candidateDetail ?? {}),
          timetable_rows: mergedRows,
        }
      : clone(priorDetail);

    if (priorRank != null && rankIndex(candidateRank) < rankIndex(priorRank)) {
      meeting.source_trace = clone(priorMeeting.source_trace);
      meeting.freshness = clone(priorMeeting.freshness);
      if (detail && priorDetail) {
        detail.source_trace = clone(priorDetail.source_trace);
        detail.freshness = clone(priorDetail.freshness);
      }
      decision = 'retained_stronger_evidence';
    } else {
      decision = 'accepted_observation';
    }
  }

  const applied = applyEvidenceChanges({
    meeting,
    detail,
    candidateMeeting,
    candidateDetail,
    evidenceChanges,
  });
  meeting = applied.meeting;
  detail = applied.detail;

  const acceptCurrentEvidence = !failedAttempt;
  const metadata = mergeAuthorityMetadata(priorMeeting, candidateMeeting, {
    acceptCurrentEvidence,
    consumedEvidenceChanges: evidenceChanges,
  });
  meeting = {
    ...(meeting ?? {}),
    ...metadata,
    ...(acquisitionCompletion ? { acquisition_completion: clone(acquisitionCompletion) } : {}),
    ...(acquisitionAttempt !== undefined ? { acquisition_attempt: clone(acquisitionAttempt) } : {}),
  };

  if (detail) {
    const detailMetadata = mergeAuthorityMetadata(priorDetail, candidateDetail ?? candidateMeeting, {
      acceptCurrentEvidence,
      consumedEvidenceChanges: evidenceChanges,
    });
    detail = { ...detail, ...detailMetadata };
  }

  meeting = synchronizeDerivedTimes(meeting, detail, { detailWithdrawn: applied.detailWithdrawn });
  detail = syncDetailIdentity(meeting, detail);

  const finalRank = canonicalEvidenceRankV1(meeting, detail);
  meeting = {
    ...meeting,
    capability_rank: finalRank,
    display_status: finalRank === 'C' ? 'partial' : 'displayable',
  };
  if (detail) detail = { ...detail, capability_rank: finalRank };

  return {
    meeting,
    detail,
    decision,
    observed_rank: candidateRank,
    retained_rank: finalRank,
    previous_rank: priorRank,
    normalized_previous_changed: normalizedPrevious.changed,
  };
}
