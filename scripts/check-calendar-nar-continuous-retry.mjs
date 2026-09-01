import fs from 'node:fs';

const policy = JSON.parse(fs.readFileSync('data/static/calendar-due-job-policy-v1.json', 'utf8'));
const rule = policy.system_rules.find((entry) => entry.system_id === 'japan-nar-system');
if (!rule?.enabled) throw new Error('NAR due-job rule must remain enabled');
if (!rule.regular_refresh?.enabled || rule.regular_refresh.window_days < 30) throw new Error('NAR regular refresh must cover 30 days');
if (!rule.coverage_gap?.enabled || rule.coverage_gap.max_window_days < 30) throw new Error('NAR coverage-gap discovery must cover 30 days');
if (!rule.source_revalidation?.enabled || rule.source_revalidation.window_days < 30) throw new Error('NAR source revalidation must cover 30 days');
if (!rule.rank_retry?.enabled) throw new Error('NAR rank retry must remain enabled');
if (rule.rank_retry.max_selected_meetings_per_job < 25) throw new Error('NAR rank retry batch must remain bounded but useful');
if (rule.rank_retry.max_attempt_count < 7) throw new Error('NAR retry must survive normal programme publication lead time');
for (const key of ['automatic_approval','automatic_promotion','automatic_publication','automatic_deployment']) {
  if (policy.scheduler[key] !== false) throw new Error(`${key} must remain false`);
}
console.log('CALENDAR_NAR_CONTINUOUS_RETRY: pass');
