function unique(values) {
  return [...new Set(values)].sort();
}

export function reconcileDetailBlockerRetries(artifacts, aggregate) {
  const scheduleCandidateIds = new Set((aggregate.scheduleCandidates ?? []).map((candidate) => candidate.meeting_id));
  const blockerIds = (aggregate.detailBlockers ?? []).map((blocker) => blocker.meeting_id);
  const blockerDates = (aggregate.detailBlockers ?? []).map((blocker) => blocker.date);

  artifacts.coverage.unresolved_meeting_ids = unique([
    ...(artifacts.coverage.unresolved_meeting_ids ?? []),
    ...blockerIds,
  ]);
  artifacts.coverage.unresolved_dates = unique([
    ...(artifacts.coverage.unresolved_dates ?? []),
    ...blockerDates,
  ]);

  artifacts.retries.meeting_targets = [...artifacts.coverage.unresolved_meeting_ids];
  artifacts.retries.date_targets = [...artifacts.coverage.unresolved_dates];

  for (const blocker of aggregate.detailBlockers ?? []) {
    if (scheduleCandidateIds.has(blocker.meeting_id)) continue;
    const key = 'selected_detail_retry_required';
    artifacts.retries.reason_counts[key] = (artifacts.retries.reason_counts[key] ?? 0) + 1;
  }

  return artifacts;
}
