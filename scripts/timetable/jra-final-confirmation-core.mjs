const DATE_TIME_ERROR = 'must be a valid ISO date-time';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function parseTime(value, label) {
  assert(typeof value === 'string' && value.trim(), `${label} ${DATE_TIME_ERROR}`);
  const timestamp = Date.parse(value);
  assert(!Number.isNaN(timestamp), `${label} ${DATE_TIME_ERROR}`);
  return timestamp;
}

function maxDate(values) {
  return values.filter(Boolean).sort().at(-1) ?? null;
}

function hostOf(value, label) {
  const url = new URL(value);
  assert(url.protocol === 'https:', `${label} must use HTTPS`);
  return url.hostname;
}

function compareRows(plannedRows, finalRows) {
  const changes = [];
  const max = Math.max(plannedRows.length, finalRows.length);
  for (let index = 0; index < max; index += 1) {
    const planned = plannedRows[index] ?? null;
    const final = finalRows[index] ?? null;
    if (!planned || !final) {
      changes.push({ index: index + 1, type: planned ? 'removed_row' : 'added_row' });
      continue;
    }
    const fields = ['label', 'post_time_local', 'race_name', 'distance_m', 'surface', 'course_label'];
    const changedFields = fields.filter((field) => (planned[field] ?? null) !== (final[field] ?? null));
    if (changedFields.length) changes.push({ index: index + 1, type: 'changed_row', fields: changedFields });
  }
  return changes;
}

export function evaluateJraFinalConfirmation({ planned, final, control, readinessRegistry, authorityInventory }) {
  assert(planned?.schema_version === 'jra-planned-program-intake-v1', 'planned intake schema is invalid');
  assert(final?.schema_version === 'jra-final-program-intake-v1', 'final intake schema is invalid');
  assert(control?.schema_version === 'jra-pilot-control-v1', 'JRA pilot control schema is invalid');
  assert(readinessRegistry?.schema_version === 'calendar-readiness-registry-v1', 'Calendar Readiness schema is invalid');
  assert(authorityInventory?.schema_version === 'authority-source-inventory-v1', 'Authority/Source schema is invalid');

  const readinessMatches = readinessRegistry.records.filter((record) => record.authority_source_key === control.source_key);
  assert(readinessMatches.length === 1, 'JRA readiness source must be unique');
  const readiness = readinessMatches[0];
  const inventory = authorityInventory.records.find((record) =>
    record.country_id === 'japan' && record.authority_id === 'jra' && record.official_source_id === 'jra-programme'
  );
  assert(inventory, 'JRA authority/source record is missing');

  const blockers = [];
  if (final.source_stage !== 'final_program') blockers.push('source_stage_not_final');

  const cutoff = parseTime(planned.final_confirmation_after, 'planned.final_confirmation_after');
  const finalGeneratedAt = parseTime(final.generated_at, 'final.generated_at');
  if (finalGeneratedAt < cutoff) blockers.push('final_confirmation_too_early');

  const registryMinimumDate = maxDate([readiness.checked_date, inventory.last_checked_date]);
  const finalCheckedDates = final.records.map((record) => record.source?.checked_at?.slice(0, 10)).filter(Boolean).sort();
  const finalCheckedDate = finalCheckedDates.at(-1) ?? null;
  if (!finalCheckedDate || finalCheckedDate < registryMinimumDate) blockers.push('source_fixture_predates_registry');

  const plannedById = new Map(planned.records.map((record) => [record.meeting_id, record]));
  const finalById = new Map(final.records.map((record) => [record.meeting_id, record]));
  const plannedIds = [...plannedById.keys()].sort();
  const finalIds = [...finalById.keys()].sort();
  const addedMeetingIds = finalIds.filter((id) => !plannedById.has(id));
  const removedMeetingIds = plannedIds.filter((id) => !finalById.has(id));
  const changedMeetings = [];

  for (const meetingId of finalIds.filter((id) => plannedById.has(id))) {
    const before = plannedById.get(meetingId);
    const after = finalById.get(meetingId);
    const identityFields = ['country_id', 'authority_id', 'racing_system_id', 'racecourse_id', 'date', 'timezone'];
    const identityChanges = identityFields.filter((field) => before[field] !== after[field]);
    const rowChanges = compareRows(before.timetable_rows ?? [], after.timetable_rows ?? []);
    const timeChanges = ['first_race_time_local', 'last_race_time_local'].filter((field) => before[field] !== after[field]);
    if (identityChanges.length || timeChanges.length || rowChanges.length) {
      changedMeetings.push({ meeting_id: meetingId, identity_fields: identityChanges, time_fields: timeChanges, row_changes: rowChanges });
    }
  }

  const officialHost = hostOf(inventory.official_source_url, 'inventory official source');
  let structuralPass = true;
  for (const record of final.records) {
    if (record.country_id !== 'japan' || record.authority_id !== 'jra' || record.racing_system_id !== control.system_id) structuralPass = false;
    if (record.source?.source_id !== 'jra-programme') structuralPass = false;
    if (!control.allowed_hosts.includes(hostOf(record.source.official_url, `${record.meeting_id} official source`))) structuralPass = false;
    if (hostOf(record.source.official_url, `${record.meeting_id} official source`) !== officialHost) structuralPass = false;
    if (readiness.racecourse_ids.length > 0 && !readiness.racecourse_ids.includes(record.racecourse_id)) structuralPass = false;
    if (!Array.isArray(record.timetable_rows) || record.timetable_rows.length === 0) structuralPass = false;
    if (record.timetable_rows?.[0]?.post_time_local !== record.first_race_time_local) structuralPass = false;
    if (record.timetable_rows?.at(-1)?.post_time_local !== record.last_race_time_local) structuralPass = false;
  }
  if (!structuralPass) blockers.push('final_program_structure_invalid');

  const review = final.review ?? {};
  const approved = review.status === 'approved' && typeof review.reviewer === 'string' && review.reviewer.trim() && typeof review.reviewed_at === 'string';
  if (!approved) blockers.push('human_review_required');
  else if (parseTime(review.reviewed_at, 'final.review.reviewed_at') < finalGeneratedAt) blockers.push('review_predates_final_fixture');

  const uniqueBlockers = [...new Set(blockers)];
  return {
    schema_version: 'jra-final-confirmation-review-v1',
    work_id: 'WHR-CAL-JAPAN-JRA',
    generated_at: final.generated_at,
    source_stage: final.source_stage,
    source: {
      registry_minimum_date: registryMinimumDate,
      final_checked_date: finalCheckedDate,
      confirmation_cutoff: planned.final_confirmation_after,
      final_confirmation_time_pass: finalGeneratedAt >= cutoff,
      official_host: officialHost
    },
    comparison: {
      planned_meeting_count: planned.records.length,
      final_meeting_count: final.records.length,
      added_meeting_ids: addedMeetingIds,
      removed_meeting_ids: removedMeetingIds,
      changed_meetings: changedMeetings,
      has_changes: addedMeetingIds.length > 0 || removedMeetingIds.length > 0 || changedMeetings.length > 0
    },
    review: {
      status: review.status ?? 'needs_review',
      reviewer: review.reviewer ?? null,
      reviewed_at: review.reviewed_at ?? null,
      approved: Boolean(approved)
    },
    candidate_generation: {
      permitted: uniqueBlockers.length === 0,
      blockers: uniqueBlockers
    },
    boundaries: {
      network_fetch_performed: false,
      candidate_generated: false,
      candidate_approved: false,
      canonical_written: false,
      public_projection_written: false
    }
  };
}
