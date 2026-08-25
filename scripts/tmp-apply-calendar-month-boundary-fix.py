from pathlib import Path

planner_path = Path('scripts/timetable/due-job-planner.mjs')
planner = planner_path.read_text()

old_split = '''function splitDateWindow(gap, maxDays) {
  const windows = [];
  let cursor = gap.start_date;
  while (cursor < gap.end_date_exclusive) {
    const proposed = addDays(cursor, maxDays);
    const end = proposed < gap.end_date_exclusive ? proposed : gap.end_date_exclusive;
    windows.push({
      start_date: cursor,
      end_date_exclusive: end,
      timezone: gap.timezone,
    });
    cursor = end;
  }
  return windows;
}'''
new_split = '''function nextMonthStart(date) {
  const [year, month] = date.slice(0, 7).split('-').map(Number);
  return new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 10);
}

function splitDateWindow(gap, maxDays, allowCrossMonth = true) {
  const windows = [];
  let cursor = gap.start_date;
  while (cursor < gap.end_date_exclusive) {
    const proposed = addDays(cursor, maxDays);
    const boundedEnd = proposed < gap.end_date_exclusive ? proposed : gap.end_date_exclusive;
    const monthBoundary = nextMonthStart(cursor);
    const end = !allowCrossMonth && monthBoundary < boundedEnd ? monthBoundary : boundedEnd;
    windows.push({
      start_date: cursor,
      end_date_exclusive: end,
      timezone: gap.timezone,
    });
    cursor = end;
  }
  return windows;
}'''
if planner.count(old_split) != 1:
    raise SystemExit(f'splitDateWindow anchor count differs: {planner.count(old_split)}')
planner = planner.replace(old_split, new_split)

old_gap_call = 'splitDateWindow(gap, rule.coverage_gap.max_window_days)'
if planner.count(old_gap_call) != 2:
    raise SystemExit(f'coverage split anchor count differs: {planner.count(old_gap_call)}')
planner = planner.replace(old_gap_call, 'splitDateWindow(gap, rule.coverage_gap.max_window_days, profile.supports_cross_month_window === true)')

old_revalidation = '''        const end = addDays(startDate, rule.source_revalidation.window_days);
        addJob(makeJob({
          jobId: `due-${token}-source-revalidation-001`,
          campaignId,
          systemId: systemState.system_id,
          mode: 'date_window',
          scope: { start_date: startDate, end_date_exclusive: end, timezone: systemState.timezone },
          rankStrategy: 'best_available',
          targetRank: null,
          reason: 'source_revalidation',
          requestedAt: state.as_of,
        }), 'source_health', `Source health is ${systemState.source_health}; bounded revalidation interval is due.`);'''
new_revalidation = '''        const end = addDays(startDate, rule.source_revalidation.window_days);
        const scopes = splitDateWindow(
          { start_date: startDate, end_date_exclusive: end, timezone: systemState.timezone },
          rule.source_revalidation.window_days,
          profile.supports_cross_month_window === true,
        );
        for (const [index, scope] of scopes.entries()) {
          addJob(makeJob({
            jobId: `due-${token}-source-revalidation-${String(index + 1).padStart(3, '0')}`,
            campaignId,
            systemId: systemState.system_id,
            mode: 'date_window',
            scope,
            rankStrategy: 'best_available',
            targetRank: null,
            reason: 'source_revalidation',
            requestedAt: state.as_of,
          }), 'source_health', `Source health is ${systemState.source_health}; bounded revalidation interval ${scope.start_date}..${scope.end_date_exclusive} is due.`);
        }'''
if planner.count(old_revalidation) != 1:
    raise SystemExit(f'source revalidation anchor count differs: {planner.count(old_revalidation)}')
planner = planner.replace(old_revalidation, new_revalidation)

old_regular = '''    if (rule.regular_refresh.enabled && profile.supports_date_window && !horizonPlanned && (stale || proximityDue)) {
      addJob(makeJob({
        jobId: `due-${token}-regular-refresh-001`,
        campaignId,
        systemId: systemState.system_id,
        mode: 'date_window',
        scope: { start_date: startDate, end_date_exclusive: regularEnd, timezone: systemState.timezone },
        rankStrategy: 'best_available',
        targetRank: null,
        reason: 'regular_refresh',
        requestedAt: state.as_of,
      }), 'regular_refresh', `Regular refresh due: stale=${stale}, meeting_proximity_due=${proximityDue}, age_hours=${Math.floor(freshnessAge)}.`);
    }'''
new_regular = '''    if (rule.regular_refresh.enabled && profile.supports_date_window && !horizonPlanned && (stale || proximityDue)) {
      const scopes = splitDateWindow(
        { start_date: startDate, end_date_exclusive: regularEnd, timezone: systemState.timezone },
        rule.regular_refresh.window_days,
        profile.supports_cross_month_window === true,
      );
      for (const [index, scope] of scopes.entries()) {
        addJob(makeJob({
          jobId: `due-${token}-regular-refresh-${String(index + 1).padStart(3, '0')}`,
          campaignId,
          systemId: systemState.system_id,
          mode: 'date_window',
          scope,
          rankStrategy: 'best_available',
          targetRank: null,
          reason: 'regular_refresh',
          requestedAt: state.as_of,
        }), 'regular_refresh', `Regular refresh ${scope.start_date}..${scope.end_date_exclusive} due: stale=${stale}, meeting_proximity_due=${proximityDue}, age_hours=${Math.floor(freshnessAge)}.`);
      }
    }'''
if planner.count(old_regular) != 1:
    raise SystemExit(f'regular refresh anchor count differs: {planner.count(old_regular)}')
planner = planner.replace(old_regular, new_regular)
planner_path.write_text(planner)

check_path = Path('scripts/check-calendar-due-job-planner.mjs')
check = check_path.read_text()
anchor = '''  const cappedPolicy = structuredClone(policy);'''
regression = '''  const monthBoundaryState = structuredClone(fixtures.state);
  monthBoundaryState.as_of = '2026-08-25T01:46:04Z';
  monthBoundaryState.system_states = [structuredClone(fixtures.state.system_states.find((state) => state.system_id === 'japan-jra-system'))];
  const monthBoundaryJra = monthBoundaryState.system_states[0];
  monthBoundaryJra.season_state = 'active';
  monthBoundaryJra.source_health = 'healthy';
  monthBoundaryJra.last_successful_collection_at = '2026-08-24T00:00:00Z';
  monthBoundaryJra.last_source_revalidation_at = '2026-08-24T00:00:00Z';
  monthBoundaryJra.next_meeting_date = '2026-08-29';
  monthBoundaryJra.coverage_gaps = [];
  monthBoundaryState.retry_queue.entries = [];
  try {
    const monthBoundaryPlan = planDueJobsV1(policy, monthBoundaryState, registry);
    const jraWindows = monthBoundaryPlan.collection_plan.jobs
      .filter((job) => job.system_id === 'japan-jra-system' && job.reason === 'regular_refresh')
      .map((job) => ({ job_id: job.job_id, ...job.requested_scope }));
    const expectedJraWindows = [
      { job_id: 'due-japan-jra-regular-refresh-001', start_date: '2026-08-26', end_date_exclusive: '2026-09-01', timezone: 'Asia/Tokyo' },
      { job_id: 'due-japan-jra-regular-refresh-002', start_date: '2026-09-01', end_date_exclusive: '2026-09-02', timezone: 'Asia/Tokyo' },
    ];
    if (!exact(jraWindows, expectedJraWindows)) fail(`JRA month-boundary regular refresh split differs: ${JSON.stringify(jraWindows)}`);
  } catch (error) {
    fail(`JRA month-boundary scenario failed: ${error.message}`);
  }

'''
if check.count(anchor) != 1:
    raise SystemExit(f'check insertion anchor count differs: {check.count(anchor)}')
check = check.replace(anchor, regression + anchor)
check_path.write_text(check)

workflow_path = Path('.github/workflows/calendar-daily-acquisition.yml')
workflow = workflow_path.read_text()
planner_path_anchor = "      - 'scripts/timetable/build-calendar-live-planner-state.mjs'\n"
if workflow.count(planner_path_anchor) != 2:
    raise SystemExit(f'daily planner path anchor count differs: {workflow.count(planner_path_anchor)}')
workflow = workflow.replace(planner_path_anchor, planner_path_anchor + "      - 'scripts/timetable/due-job-planner.mjs'\n")
check_path_anchor = "      - 'scripts/check-calendar-actions-multi-job.mjs'\n"
if workflow.count(check_path_anchor) != 2:
    raise SystemExit(f'daily check path anchor count differs: {workflow.count(check_path_anchor)}')
workflow = workflow.replace(check_path_anchor, check_path_anchor + "      - 'scripts/check-calendar-due-job-planner.mjs'\n")
workflow_path.write_text(workflow)
