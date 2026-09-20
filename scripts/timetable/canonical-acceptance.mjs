import { deriveBestAvailableRank, rankIndex } from './best-available-rank.mjs';
import { mergeEvidenceSupportV1 } from './calendar-authority-metadata.mjs';

const DETAIL_FIELDS = ['post_time_local', 'race_name', 'distance_m', 'surface', 'course_label'];
const MEETING_IDENTITY_FIELDS = ['country_id', 'authority_id', 'racing_system_id', 'racecourse_id', 'timezone'];

function clone(value) {
  return value == null ? value : structuredClone(value);
}

function defined(value) {
  return value !== undefined && value !== null;
}

function mergeDefined(previous = {}, current = {}) {
  const next = { ...clone(previous) };
  for (const [key, value] of Object.entries(current ?? {})) {
    if (defined(value)) next[key] = clone(value);
  }
  return next;
}

function mergeEvidenceChanges(previous = [], current = []) {
  return [...new Map([...(previous ?? []), ...(current ?? [])]
    .map((change) => [JSON.stringify(change), clone(change)])).values()];
}

export function mergeCanonicalTimetableRowsV1(previousRows = [], currentRows = [], { replace = false } = {}) {
  const incoming = Array.isArray(currentRows) ? currentRows : [];
  const previous = Array.isArray(previousRows) ? previousRows : [];
  if (replace) return incoming.map((row) => clone(row));
  if (incoming.length === 0) return previous.map((row) => clone(row));

  const previousByLabel = new Map(previous.map((row) => [row.label, row]));
  const merged = incoming.map((row) => mergeDefined(previousByLabel.get(row.label) ?? {}, row));
  const incomingLabels = new Set(incoming.map((row) => row.label));
  for (const row of previous) {
    if (!incomingLabels.has(row.label)) merged.push(clone(row));
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
  const nextDetail = ['A', 'A+'].includes(evidenceRank) && detail
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

function mergeAuthorityMetadata(previous, current) {
  const next = {};
  if (previous?.evidence_support || current?.evidence_support) {
    next.evidence_support = mergeEvidenceSupportV1(previous?.evidence_support, current?.evidence_support);
  }
  if (previous?.evidence_changes || current?.evidence_changes) {
    next.evidence_changes = mergeEvidenceChanges(previous?.evidence_changes, current?.evidence_changes);
  }
  return next;
}

function candidateRowByLabel(candidateDetail, label) {
  return (candidateDetail?.timetable_rows ?? []).find((row) => row.label === label) ?? null;
}

function applyFieldChange({ meeting, detail, candidateMeeting, candidateDetail, change }) {
  const target = change.target ?? {};
  const remove = change.action === 'withdraw' || change.action === 'invalidate';
  if (target.field === 'meeting_date') {
    if (remove) throw new Error('meeting_date cannot be withdrawn from an existing canonical meeting');
    if (!defined(candidateMeeting?.date)) throw new Error('meeting_date correction requires candidate date');
    return { meeting: { ...meeting, date: candidateMeeting.date }, detail };
  }
  if (target.field === 'meeting_identity') {
    if (remove) throw new Error('meeting_identity cannot be withdrawn from an existing canonical meeting');
    const identity = {};
    for (const key of MEETING_IDENTITY_FIELDS) {
      if (defined(candidateMeeting?.[key])) identity[key] = candidateMeeting[key];
    }
    if (Object.keys(identity).length === 0) throw new Error('meeting_identity correction requires candidate identity fields');
    return { meeting: { ...meeting, ...identity }, detail };
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
  const rows = (detail?.timetable_rows ?? []).map((row) => ({ ...row }));
  const index = rows.findIndex((row) => row.label === target.race_label);
  if (index < 0) throw new Error(`correction target race not found: ${target.race_label}`);
  if (remove) {
    delete rows[index][field];
  } else {
    const candidateRow = candidateRowByLabel(candidateDetail, target.race_label);
    if (!candidateRow || !defined(candidateRow[field])) {
      throw new Error(`${target.field} correction requires candidate value for ${target.race_label}`);
    }
    rows[index][field] = clone(candidateRow[field]);
  }
  return { meeting, detail: { ...detail, timetable_rows: rows } };
}

function applyEvidenceChanges({ meeting, detail, candidateMeeting, candidateDetail, evidenceChanges }) {
  let currentMeeting = meeting;
  let currentDetail = detail;
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
      } else if (change.action === 'correct') {
        if (!candidateDetail) throw new Error('detail correction requires candidate detail');
        currentDetail = clone(candidateDetail);
      }
      continue;
    }
    if (change.target?.scope === 'meeting') {
      if (change.action === 'correct') {
        currentMeeting = mergeDefined(currentMeeting, candidateMeeting);
        currentDetail = candidateDetail ? clone(candidateDetail) : currentDetail;
        continue;
      }
      throw new Error('meeting-level withdrawal/invalidation requires an explicit removal workflow');
    }
  }
  return { meeting: currentMeeting, detail: currentDetail };
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

  const normalizedPrevious = normalizeStoredCanonicalV1(previousMeeting, previousDetail);
  const priorMeeting = normalizedPrevious.meeting;
  const priorDetail = normalizedPrevious.detail;
  const candidateRank = canonicalEvidenceRankV1(candidateMeeting, candidateDetail);

  let meeting;
  let detail;
  let decision;

  if (explicitCorrection) {
    meeting = {
      ...(priorMeeting ?? {}),
      ...clone(candidateMeeting),
    };
    detail = ['A', 'A+'].includes(candidateRank) && candidateDetail ? clone(candidateDetail) : null;
    decision = 'authoritative_replacement';
  } else if (!priorMeeting) {
    meeting = clone(candidateMeeting);
    detail = candidateDetail ? clone(candidateDetail) : null;
    decision = 'accepted_new';
  } else {
    meeting = mergeDefined(priorMeeting, candidateMeeting);
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
      : null;
    const priorRank = canonicalEvidenceRankV1(priorMeeting, priorDetail);
    decision = rankIndex(candidateRank) < rankIndex(priorRank)
      ? 'retained_stronger_evidence'
      : 'accepted_observation';
  }

  ({ meeting, detail } = applyEvidenceChanges({
    meeting,
    detail,
    candidateMeeting,
    candidateDetail,
    evidenceChanges,
  }));

  const metadata = mergeAuthorityMetadata(priorMeeting, candidateMeeting);
  meeting = {
    ...(meeting ?? {}),
    ...metadata,
    ...(acquisitionCompletion ? { acquisition_completion: clone(acquisitionCompletion) } : {}),
    ...(acquisitionAttempt !== undefined ? { acquisition_attempt: clone(acquisitionAttempt) } : {}),
  };
  if (detail) {
    const detailMetadata = mergeAuthorityMetadata(priorDetail, candidateDetail ?? candidateMeeting);
    detail = { ...detail, ...detailMetadata };
  }

  if (detail?.timetable_rows?.length) {
    meeting = {
      ...meeting,
      first_race_time_local: detail.timetable_rows[0]?.post_time_local ?? null,
      last_race_time_local: detail.timetable_rows.at(-1)?.post_time_local ?? null,
    };
  }

  const finalRank = canonicalEvidenceRankV1(meeting, detail);
  meeting = {
    ...meeting,
    capability_rank: finalRank,
    display_status: finalRank === 'C' ? 'partial' : 'displayable',
  };
  if (['A', 'A+'].includes(finalRank) && detail) detail = { ...detail, capability_rank: finalRank };
  else detail = null;

  return {
    meeting,
    detail,
    decision,
    observed_rank: candidateRank,
    retained_rank: finalRank,
    previous_rank: priorMeeting ? canonicalEvidenceRankV1(priorMeeting, priorDetail) : null,
    normalized_previous_changed: normalizedPrevious.changed,
  };
}
