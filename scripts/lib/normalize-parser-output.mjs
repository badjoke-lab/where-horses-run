const generatedStatusValues = new Set(['placeholder', 'ok', 'partial', 'stale', 'failed', 'unknown']);
const parserToGeneratedStatus = {
  ok: 'ok',
  partial: 'partial',
  empty: 'partial',
  stale: 'stale',
  failed: 'failed',
  skipped: 'partial',
  unknown: 'unknown'
};

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function firstString(...values) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim() !== '') return value;
  }
  return '';
}

export function normalizeParserStatus(status) {
  if (typeof status !== 'string') return 'unknown';
  const normalized = parserToGeneratedStatus[status] ?? status;
  return generatedStatusValues.has(normalized) ? normalized : 'unknown';
}

export function normalizeParserMeeting(meeting, parserOutput = {}) {
  const sourceId = firstString(meeting?.source_id, parserOutput.source_id, 'unknown-source');
  const countryId = firstString(meeting?.country_id, 'unknown-country');
  const trackId = firstString(meeting?.track_id, 'unknown-track');
  const localDate = firstString(meeting?.local_date, 'unknown-date');

  return {
    meeting_id: firstString(
      meeting?.meeting_id,
      `${sourceId}-${trackId}-${localDate}`
    ),
    country_id: countryId,
    track_id: trackId,
    track_name: firstString(meeting?.track_name, 'Unknown track'),
    local_date: localDate,
    timezone: firstString(meeting?.timezone, 'UTC'),
    source_id: sourceId,
    source_url: firstString(meeting?.source_url, ''),
    status: firstString(meeting?.status, 'unknown'),
    racing_type: firstString(meeting?.racing_type, 'unknown'),
    notes: firstString(meeting?.notes, 'Normalized from parser output.')
  };
}

export function normalizeParserOutput(parserOutput, options = {}) {
  const generatedAt = firstString(
    options.generatedAt,
    parserOutput?.generated_at,
    parserOutput?.fixture_generated_at,
    new Date(0).toISOString()
  );

  const meetings = asArray(parserOutput?.meetings).map((meeting) =>
    normalizeParserMeeting(meeting, parserOutput)
  );

  const sourceSet = new Set();
  for (const meeting of meetings) {
    if (meeting.source_id) sourceSet.add(meeting.source_id);
  }
  if (typeof parserOutput?.source_id === 'string' && parserOutput.source_id.trim() !== '') {
    sourceSet.add(parserOutput.source_id);
  }

  const notes = [
    ...asArray(parserOutput?.warnings),
    ...asArray(parserOutput?.errors)
  ].filter((item) => typeof item === 'string' && item.trim() !== '');

  return {
    generated_at: generatedAt,
    status: normalizeParserStatus(parserOutput?.status),
    meetings,
    sources: [...sourceSet].sort(),
    notes
  };
}
