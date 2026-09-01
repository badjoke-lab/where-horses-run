import fs from 'node:fs';

const policy = JSON.parse(fs.readFileSync('data/static/calendar-due-job-policy-v1.json', 'utf8'));
const bySystem = new Map((policy.system_rules ?? []).map((rule) => [rule.system_id, rule]));

for (const systemId of ['japan-jra-system', 'japan-nar-system', 'japan-banei-system']) {
  const rule = bySystem.get(systemId);
  if (!rule?.enabled) throw new Error(`${systemId}: system must stay enabled`);
  if (!rule.regular_refresh?.enabled) throw new Error(`${systemId}: regular refresh must stay enabled`);
  if (!rule.coverage_gap?.enabled) throw new Error(`${systemId}: coverage-gap discovery must stay enabled`);
  if (!rule.source_revalidation?.enabled) throw new Error(`${systemId}: source revalidation must stay enabled`);
  if (!rule.rank_retry?.enabled) throw new Error(`${systemId}: lower-rank retry must stay enabled`);
  if ((rule.regular_refresh.window_days ?? 0) < 30) throw new Error(`${systemId}: refresh window must cover at least 30 days`);
  if ((rule.coverage_gap.max_window_days ?? 0) < 30) throw new Error(`${systemId}: gap discovery must cover at least 30 days`);
  if ((rule.rank_retry.max_attempt_count ?? 0) < 7) throw new Error(`${systemId}: rank retry must survive publication lead-time changes`);
}

console.log('CALENDAR_JAPAN_CONTINUOUS_REFRESH_POLICY: ok');
