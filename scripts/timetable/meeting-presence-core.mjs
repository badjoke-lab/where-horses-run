const STATES = new Set(['present', 'absent_unconfirmed', 'confirmed_non_running']);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

export function validateMeetingPresenceRegistry(registry) {
  assert(registry?.schema_version === 'calendar-meeting-presence-v1', 'meeting presence registry schema is invalid');
  assert(Array.isArray(registry.records), 'meeting presence registry records must be an array');
  const seen = new Set();
  for (const row of registry.records) {
    assert(typeof row.meeting_id === 'string' && row.meeting_id, 'meeting presence record has no meeting_id');
    assert(!seen.has(row.meeting_id), `duplicate meeting presence record ${row.meeting_id}`);
    seen.add(row.meeting_id);
    assert(STATES.has(row.state), `${row.meeting_id} has invalid meeting presence state ${row.state}`);
    if (row.state === 'confirmed_non_running') {
      assert(row.scope === 'whole_meeting', `${row.meeting_id} confirmed_non_running must apply to whole_meeting`);
      assert(row.evidence_type === 'official_explicit_non_running' || row.evidence_type === 'reviewed_official_non_running',
        `${row.meeting_id} confirmed_non_running requires accepted explicit official evidence`);
      assert(/^https:\/\//.test(row.official_source_url ?? ''), `${row.meeting_id} confirmed_non_running requires official_source_url`);
      assert(/^\d{4}-\d{2}-\d{2}$/.test(row.reviewed_at ?? ''), `${row.meeting_id} confirmed_non_running requires reviewed_at`);
    }
  }
  return registry;
}

export function confirmedNonRunningMeetingIds(registry) {
  validateMeetingPresenceRegistry(registry);
  return registry.records.filter((row) => row.state === 'confirmed_non_running').map((row) => row.meeting_id);
}

export function meetingPresenceState(registry, meetingId) {
  validateMeetingPresenceRegistry(registry);
  return registry.records.find((row) => row.meeting_id === meetingId)?.state ?? 'absent_unconfirmed';
}
