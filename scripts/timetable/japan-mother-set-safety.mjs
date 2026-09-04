export const REQUIRED_JAPAN_MOTHER_SET_SOURCES = [
  'jra-racing-calendar-programme',
  'nar-monthly-convene-info',
  'banei-official-schedule',
  'nankankeiba-south-kanto-calendar',
  'iwatekeiba-official-calendar',
  'hyogo-urban-keiba-official-calendar',
];

export const SOUTH_KANTO_RACECOURSE_IDS = new Set([
  'urawa-racecourse',
  'funabashi-racecourse',
  'oi-racecourse',
  'kawasaki-racecourse',
]);

export const IWATE_RACECOURSE_IDS = new Set([
  'morioka-racecourse',
  'mizusawa-racecourse',
]);

export const HYOGO_RACECOURSE_IDS = new Set([
  'sonoda-racecourse',
  'himeji-racecourse',
]);

function sameMeetingIdentity(left, right) {
  return left.meeting_id === right.meeting_id
    && left.date === right.date
    && left.authority_id === right.authority_id
    && left.racecourse_id === right.racecourse_id;
}

export function mergeOfficialPositiveEvidence(...meetingSets) {
  const merged = new Map();
  for (const meetings of meetingSets) {
    for (const meeting of meetings) {
      if (!meeting?.meeting_id) throw new Error('official meeting is missing meeting_id');
      const previous = merged.get(meeting.meeting_id);
      if (!previous) {
        merged.set(meeting.meeting_id, meeting);
        continue;
      }
      if (!sameMeetingIdentity(previous, meeting)) throw new Error(`official source identity conflict: ${meeting.meeting_id}`);
      merged.set(meeting.meeting_id, {
        ...meeting,
        ...previous,
        venue_code: previous.venue_code ?? meeting.venue_code,
      });
    }
  }
  return [...merged.values()].sort((a, b) => a.date.localeCompare(b.date) || a.meeting_id.localeCompare(b.meeting_id));
}

export function assessMotherSetCompleteness(rows, requiredSourceIds = REQUIRED_JAPAN_MOTHER_SET_SOURCES) {
  const byId = new Map(rows.map((row) => [row.source_id, row]));
  const missing_source_ids = requiredSourceIds.filter((sourceId) => !byId.has(sourceId));
  const incomplete_source_ids = requiredSourceIds.filter((sourceId) => byId.has(sourceId) && byId.get(sourceId).completeness !== 'complete');
  return {
    complete: missing_source_ids.length === 0 && incomplete_source_ids.length === 0,
    missing_source_ids,
    incomplete_source_ids,
  };
}

export function requiredMotherSetSourcesForMeeting(row) {
  if (row?.authority_id === 'jra' || row?.meeting_id?.startsWith('jra-')) {
    return ['jra-racing-calendar-programme'];
  }
  if (row?.authority_id === 'banei-tokachi' || row?.meeting_id?.startsWith('banei-')) {
    return ['banei-official-schedule'];
  }
  if (row?.authority_id === 'nar-local-government-racing' || row?.meeting_id?.startsWith('nar-')) {
    if (SOUTH_KANTO_RACECOURSE_IDS.has(row?.racecourse_id)) {
      return ['nar-monthly-convene-info', 'nankankeiba-south-kanto-calendar'];
    }
    if (IWATE_RACECOURSE_IDS.has(row?.racecourse_id)) {
      return ['nar-monthly-convene-info', 'iwatekeiba-official-calendar'];
    }
    if (HYOGO_RACECOURSE_IDS.has(row?.racecourse_id)) {
      return ['nar-monthly-convene-info', 'hyogo-urban-keiba-official-calendar'];
    }
    // Regional/operator mother-set sources for the remaining NAR venues are not
    // wired yet. Until they are, absence from the national NAR page alone is not
    // sufficient negative evidence to remove an existing public meeting.
    return null;
  }
  return null;
}

export function canReconcileMeetingAbsence(row, sourceCompletenessRows) {
  const required = requiredMotherSetSourcesForMeeting(row);
  if (!required?.length) return false;
  return assessMotherSetCompleteness(sourceCompletenessRows, required).complete;
}

export function selectPublicAbsenceReconciliation({
  publicMeetings,
  officialMeetingIds,
  rangeDates,
  sourceCompletenessRows,
}) {
  const officialIds = officialMeetingIds instanceof Set ? officialMeetingIds : new Set(officialMeetingIds ?? []);
  const dates = rangeDates instanceof Set ? rangeDates : new Set(rangeDates ?? []);
  const stale = (publicMeetings ?? []).filter((row) => row?.country_id === 'japan'
    && dates.has(row.date)
    && !officialIds.has(row.meeting_id));
  const removed = [];
  const preserved = [];
  for (const row of stale) {
    (canReconcileMeetingAbsence(row, sourceCompletenessRows) ? removed : preserved).push(row.meeting_id);
  }
  return {
    removed_meeting_ids: [...new Set(removed)].sort(),
    preserved_meeting_ids: [...new Set(preserved)].sort(),
  };
}
