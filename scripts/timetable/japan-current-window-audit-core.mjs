const RANKS = Object.freeze(['C', 'B', 'B+', 'A', 'A+']);
const RANK_INDEX = new Map(RANKS.map((rank, index) => [rank, index]));
const SYSTEM_IDS = Object.freeze(['japan-jra-system', 'japan-nar-system', 'japan-banei-system']);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function validDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

function exact(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function profileMap(registry) {
  return new Map((registry?.records ?? []).map((record) => [record.system_id, record]));
}

function executorMap(compatibility) {
  return new Map((compatibility?.executors ?? []).map((record) => [`${record.system_id}:${record.runner}`, record]));
}

function rankCounts(records) {
  const counts = Object.fromEntries(RANKS.map((rank) => [rank, 0]));
  for (const record of records) {
    assert(RANK_INDEX.has(record.capability_rank), `${record.meeting_id} has unsupported rank ${record.capability_rank}`);
    counts[record.capability_rank] += 1;
  }
  return counts;
}

function operationalState({ meetingCount, targetReadyCount, retryRequiredCount, policy }) {
  if (meetingCount === 0) return 'no_canonical_meetings_in_window';
  if (retryRequiredCount === 0 && targetReadyCount === meetingCount) return 'current_window_at_target_rank';
  if (policy.supports_rank_upgrade_retry) return 'selected_meeting_retry_required';
  return 'manual_refresh_required';
}

function validatePolicy(policy) {
  assert(policy?.schema_version === 'calendar-japan-current-window-policy-v1', 'Japan current-window policy schema differs');
  assert(policy.work_id === 'WHR-CAL-JAPAN-CURRENT-WINDOW-OPERATIONS', 'Japan current-window Work ID differs');
  assert(policy.implementation_unit === 'JAPAN-CURRENT-WINDOW-01', 'Japan current-window implementation unit differs');
  assert(validDate(policy.window?.start_date) && validDate(policy.window?.end_date_exclusive), 'Japan current-window dates are invalid');
  assert(policy.window.start_date < policy.window.end_date_exclusive, 'Japan current-window dates are not increasing');
  assert(policy.window.timezone === 'Asia/Tokyo', 'Japan current-window timezone differs');
  assert(policy.target_rank === 'A+', 'Japan current-window target rank must remain A+');
  assert(Array.isArray(policy.systems) && policy.systems.length === 3, 'Japan current-window policy must contain three systems');
  assert(exact(policy.systems.map((record) => record.system_id), SYSTEM_IDS), 'Japan current-window system order differs');
  assert(Object.values(policy.side_effect_boundary ?? {}).every((value) => value === false), 'Japan current-window side-effect boundary must remain all false');
}

export function buildJapanCurrentWindowAuditV1({
  policy,
  canonical,
  acquisitionRegistry,
  runnerCompatibility,
  generatedAt,
}) {
  validatePolicy(policy);
  assert(canonical?.schema_version === 'canonical-timetable-v0', 'Canonical timetable schema differs');
  assert(Array.isArray(canonical.meetings), 'Canonical meetings must be an array');
  assert(acquisitionRegistry?.schema_version === 'calendar-acquisition-registry-v1', 'Acquisition Registry schema differs');
  assert(runnerCompatibility?.schema_version === 'calendar-runner-compatibility-contract-v1', 'Runner Compatibility schema differs');
  assert(typeof generatedAt === 'string' && !Number.isNaN(Date.parse(generatedAt)), 'generatedAt must be a valid ISO date-time');

  const profiles = profileMap(acquisitionRegistry);
  const executors = executorMap(runnerCompatibility);
  const windowRecords = canonical.meetings.filter((meeting) => (
    meeting.country_id === 'japan'
    && meeting.date >= policy.window.start_date
    && meeting.date < policy.window.end_date_exclusive
  ));

  const systems = policy.systems.map((systemPolicy) => {
    const profile = profiles.get(systemPolicy.system_id);
    assert(profile, `Acquisition Registry profile missing ${systemPolicy.system_id}`);
    assert(profile.profile_status === 'active', `${systemPolicy.system_id} must remain active`);
    assert(profile.authority_id === systemPolicy.authority_id, `${systemPolicy.system_id} authority differs`);
    assert(profile.primary_runner === systemPolicy.primary_runner, `${systemPolicy.system_id} primary runner differs`);
    assert(profile.fallback_runner === systemPolicy.fallback_runner, `${systemPolicy.system_id} fallback runner differs`);
    assert(profile.technical_capability_rank === 'A+' && profile.public_ceiling === 'A+', `${systemPolicy.system_id} A+ capability/ceiling differs`);
    assert(exact(profile.supported_observation_ranks, systemPolicy.expected_observation_ranks), `${systemPolicy.system_id} observation ranks differ`);
    assert(profile.supports_selected_meetings === systemPolicy.supports_selected_meetings, `${systemPolicy.system_id} selected-meeting support differs`);
    assert(profile.supports_rank_upgrade_retry === systemPolicy.supports_rank_upgrade_retry, `${systemPolicy.system_id} retry support differs`);

    const executor = executors.get(`${systemPolicy.system_id}:${systemPolicy.primary_runner}`);
    assert(executor, `primary executor missing ${systemPolicy.system_id}/${systemPolicy.primary_runner}`);
    assert(executor.executor_id === systemPolicy.executor_id, `${systemPolicy.system_id} executor differs`);
    assert(executor.entry_point === systemPolicy.entry_point, `${systemPolicy.system_id} entry point differs`);
    assert(exact(executor.supported_collection_modes, systemPolicy.supported_collection_modes), `${systemPolicy.system_id} collection modes differ`);

    const records = windowRecords
      .filter((meeting) => meeting.authority_id === systemPolicy.authority_id)
      .sort((left, right) => left.date.localeCompare(right.date) || left.meeting_id.localeCompare(right.meeting_id));
    const counts = rankCounts(records);
    const targetReady = records.filter((meeting) => meeting.capability_rank === policy.target_rank);
    const retryRequired = records.filter((meeting) => RANK_INDEX.get(meeting.capability_rank) < RANK_INDEX.get(policy.target_rank));
    const displayable = records.filter((meeting) => meeting.display_status === 'displayable');
    const partial = records.filter((meeting) => meeting.display_status === 'partial');
    const sourceIds = [...new Set(records.map((meeting) => meeting.source_trace?.source_id).filter(Boolean))].sort();
    const lastCheckedDates = records.map((meeting) => meeting.freshness?.last_checked_date).filter(validDate).sort();

    return {
      system_id: systemPolicy.system_id,
      authority_id: systemPolicy.authority_id,
      operating_route: systemPolicy.operating_route,
      primary_runner: profile.primary_runner,
      fallback_runner: profile.fallback_runner,
      executor_id: executor.executor_id,
      entry_point: executor.entry_point,
      supported_collection_modes: structuredClone(executor.supported_collection_modes),
      supports_selected_meetings: profile.supports_selected_meetings,
      supports_rank_upgrade_retry: profile.supports_rank_upgrade_retry,
      canonical_meeting_count: records.length,
      rank_counts: counts,
      target_rank: policy.target_rank,
      target_ready_count: targetReady.length,
      retry_required_count: retryRequired.length,
      displayable_count: displayable.length,
      partial_count: partial.length,
      first_meeting_date: records[0]?.date ?? null,
      last_meeting_date: records.at(-1)?.date ?? null,
      latest_source_check_date: lastCheckedDates.at(-1) ?? null,
      source_ids: sourceIds,
      target_ready_meeting_ids: targetReady.map((meeting) => meeting.meeting_id),
      retry_required_meeting_ids: retryRequired.map((meeting) => meeting.meeting_id),
      low_rank_action: systemPolicy.low_rank_action,
      operational_state: operationalState({
        meetingCount: records.length,
        targetReadyCount: targetReady.length,
        retryRequiredCount: retryRequired.length,
        policy: systemPolicy,
      }),
    };
  });

  const totalMeetings = systems.reduce((sum, system) => sum + system.canonical_meeting_count, 0);
  const totalTargetReady = systems.reduce((sum, system) => sum + system.target_ready_count, 0);
  const totalRetryRequired = systems.reduce((sum, system) => sum + system.retry_required_count, 0);
  const systemsWithoutMeetings = systems.filter((system) => system.canonical_meeting_count === 0).map((system) => system.system_id);
  const systemsRequiringAction = systems.filter((system) => !['current_window_at_target_rank'].includes(system.operational_state)).map((system) => system.system_id);

  return {
    schema_version: 'calendar-japan-current-window-audit-v1',
    work_id: policy.work_id,
    implementation_unit: policy.implementation_unit,
    generated_at: generatedAt,
    canonical_generated_at: canonical.generated_at,
    window: structuredClone(policy.window),
    target_rank: policy.target_rank,
    summary: {
      system_count: systems.length,
      canonical_meeting_count: totalMeetings,
      target_ready_count: totalTargetReady,
      retry_required_count: totalRetryRequired,
      systems_without_canonical_meetings: systemsWithoutMeetings,
      systems_requiring_action: systemsRequiringAction,
    },
    systems,
    interpretation: {
      no_canonical_meetings_in_window: 'The current Canonical dataset has no meetings for this system in the selected window. This is an absence-of-current-data finding, not a claim that no official racing exists.',
      current_window_at_target_rank: 'All Canonical meetings in the selected window are reviewed at A+.',
      selected_meeting_retry_required: 'At least one Canonical meeting is below A+ and the system has an evidence-backed selected-meeting retry route.',
      manual_refresh_required: 'At least one Canonical meeting is below A+ or absent, but the system does not expose selected-meeting retry through the shared control plane.',
    },
    side_effect_boundary: structuredClone(policy.side_effect_boundary),
  };
}

export function validateJapanCurrentWindowAuditV1(audit) {
  const errors = [];
  if (audit?.schema_version !== 'calendar-japan-current-window-audit-v1') errors.push('audit schema differs');
  if (audit?.work_id !== 'WHR-CAL-JAPAN-CURRENT-WINDOW-OPERATIONS') errors.push('audit Work ID differs');
  if (audit?.implementation_unit !== 'JAPAN-CURRENT-WINDOW-01') errors.push('audit implementation unit differs');
  if (!validDate(audit?.window?.start_date) || !validDate(audit?.window?.end_date_exclusive) || audit.window.start_date >= audit.window.end_date_exclusive) errors.push('audit window differs');
  if (audit?.window?.timezone !== 'Asia/Tokyo') errors.push('audit timezone differs');
  if (audit?.target_rank !== 'A+') errors.push('audit target rank differs');
  if (!Array.isArray(audit?.systems) || audit.systems.length !== 3) errors.push('audit system count differs');
  if (!exact(audit?.systems?.map((record) => record.system_id), SYSTEM_IDS)) errors.push('audit system order differs');
  for (const system of audit?.systems ?? []) {
    const totalRanks = Object.values(system.rank_counts ?? {}).reduce((sum, value) => sum + value, 0);
    if (totalRanks !== system.canonical_meeting_count) errors.push(`${system.system_id} rank counts do not close`);
    if (system.target_ready_count + system.retry_required_count !== system.canonical_meeting_count) errors.push(`${system.system_id} target/retry counts do not close`);
    if (system.displayable_count + system.partial_count > system.canonical_meeting_count) errors.push(`${system.system_id} display counts exceed total`);
    if (system.target_ready_meeting_ids.length !== system.target_ready_count) errors.push(`${system.system_id} target-ready IDs differ`);
    if (system.retry_required_meeting_ids.length !== system.retry_required_count) errors.push(`${system.system_id} retry IDs differ`);
    if (system.supports_rank_upgrade_retry && system.retry_required_count > 0 && system.operational_state !== 'selected_meeting_retry_required') errors.push(`${system.system_id} retry state differs`);
    if (!system.supports_rank_upgrade_retry && system.retry_required_count > 0 && system.operational_state !== 'manual_refresh_required') errors.push(`${system.system_id} manual-refresh state differs`);
    if (system.canonical_meeting_count === 0 && system.operational_state !== 'no_canonical_meetings_in_window') errors.push(`${system.system_id} empty-window state differs`);
  }
  const totalMeetings = (audit?.systems ?? []).reduce((sum, system) => sum + system.canonical_meeting_count, 0);
  const totalReady = (audit?.systems ?? []).reduce((sum, system) => sum + system.target_ready_count, 0);
  const totalRetry = (audit?.systems ?? []).reduce((sum, system) => sum + system.retry_required_count, 0);
  if (audit?.summary?.canonical_meeting_count !== totalMeetings) errors.push('summary meeting count differs');
  if (audit?.summary?.target_ready_count !== totalReady) errors.push('summary target-ready count differs');
  if (audit?.summary?.retry_required_count !== totalRetry) errors.push('summary retry count differs');
  if (Object.values(audit?.side_effect_boundary ?? {}).some((value) => value !== false)) errors.push('audit side-effect boundary differs');
  return errors;
}

export const japanCurrentWindowAuditContractV1 = Object.freeze({
  ranks: RANKS,
  systems: SYSTEM_IDS,
});
