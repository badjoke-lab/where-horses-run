export const MEETING_STREAM_STATES = Object.freeze({
  LIVE: 'live',
  KNOWN: 'known',
  UNKNOWN: 'unknown',
});

export function deriveMeetingStreamState({
  hasOfficialDestination = false,
  detectorStatus = 'unknown',
  eventDate = '',
  sourceDate = '',
} = {}) {
  if (!hasOfficialDestination) return MEETING_STREAM_STATES.UNKNOWN;

  const matchingEvent = Boolean(sourceDate && eventDate && sourceDate === eventDate);
  if (detectorStatus === 'live' && matchingEvent) return MEETING_STREAM_STATES.LIVE;

  // A reviewed official destination may exist even when the detector is
  // offline, stale, unavailable, for another date, or otherwise unverified.
  // None of those conditions are evidence of a current live broadcast.
  return MEETING_STREAM_STATES.KNOWN;
}
