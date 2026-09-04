export const REQUIRED_JAPAN_MOTHER_SET_SOURCES = [
  'jra-racing-calendar-programme',
  'nar-monthly-convene-info',
  'banei-official-schedule',
  'nankankeiba-south-kanto-calendar',
];

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
