import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  evaluateSourceFreshness,
  SOURCE_REVIEW_DUE_AFTER_DAYS,
} from '../src/lib/sourceFreshnessState.mjs';

const contract = JSON.parse(fs.readFileSync('data/static/m6-source-freshness-badges-v1.json', 'utf8'));
const readiness = JSON.parse(fs.readFileSync('data/static/calendar-readiness-registry.json', 'utf8'));
const model = fs.readFileSync('src/lib/timetable/coverageDashboard.ts', 'utf8');
const badge = fs.readFileSync('src/components/SourceFreshnessBadge.astro', 'utf8');
const dashboard = fs.readFileSync('src/components/CalendarCoverageDashboard.astro', 'utf8');
const matrix = fs.readFileSync('src/components/CountryCoverageMatrix.astro', 'utf8');
const enPage = fs.readFileSync('src/pages/about/data-coverage.astro', 'utf8');
const jaPage = fs.readFileSync('src/pages/ja/about/data-coverage.astro', 'utf8');
const workflow = fs.readFileSync('.github/workflows/m6-source-freshness-badges.yml', 'utf8');

assert.equal(SOURCE_REVIEW_DUE_AFTER_DAYS, 30);
assert.deepEqual(
  evaluateSourceFreshness({ checkedDate: '2026-07-17', referenceDate: '2026-08-16' }),
  { status: 'current', ageDays: 30, reviewDueAfterDays: 30 },
);
assert.deepEqual(
  evaluateSourceFreshness({ checkedDate: '2026-07-16', referenceDate: '2026-08-16' }),
  { status: 'review_due', ageDays: 31, reviewDueAfterDays: 30 },
);
assert.deepEqual(
  evaluateSourceFreshness({ checkedDate: null, referenceDate: '2026-08-16' }),
  { status: 'unknown', ageDays: null, reviewDueAfterDays: 30 },
);
assert.deepEqual(
  evaluateSourceFreshness({ checkedDate: '2026-08-17', referenceDate: '2026-08-16' }),
  { status: 'current', ageDays: 0, reviewDueAfterDays: 30 },
);
assert.throws(
  () => evaluateSourceFreshness({ checkedDate: '2026-02-30', referenceDate: '2026-08-16' }),
  /real calendar date/,
);

assert.equal(contract.schema_version, 'm6-source-freshness-badges-v1');
assert.equal(contract.work_id, 'WHR-M6-SOURCE-FRESHNESS-BADGES');
assert.equal(contract.implementation_unit, 'M6-SOURCE-FRESHNESS-BADGES-01');
assert.equal(contract.status, 'implemented');
assert.equal(contract.source_of_checked_dates, 'data/static/calendar-readiness-registry.json records[].checked_date');
assert.equal(contract.reference_date_source, 'shared calendar date context');
assert.equal(contract.aggregation.country_badge_checked_date, 'oldest checked_date across readiness records used by the country coverage aggregate');
assert.equal(contract.aggregation.missing_checked_date, 'unknown');
assert.equal(contract.freshness_policy.current_through_days, 30);
assert.equal(contract.freshness_policy.review_due_when_age_days_greater_than, 30);
assert.deepEqual(contract.surfaces, ['calendar_coverage_dashboard', 'country_coverage_matrix']);
assert.deepEqual(contract.boundary, {
  uses_existing_review_metadata_only: true,
  changes_source_capability: false,
  changes_public_timetable_fields: false,
  changes_publication_rank: false,
  changes_candidate_or_promotion_behavior: false,
  adds_raw_source_content: false,
  adds_odds_results_payouts_or_participants: false,
  changes_historical_v1_baseline: false,
});

const targetIds = ['japan', 'hong-kong', 'united-arab-emirates', 'south-korea', 'turkey', 'morocco'];
for (const countryId of targetIds) {
  const records = readiness.records.filter((record) => record.country_id === countryId);
  assert.ok(records.length > 0, `missing readiness records for ${countryId}`);
  assert.ok(records.every((record) => typeof record.checked_date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(record.checked_date)), `missing checked_date for ${countryId}`);
}

assert.match(model, /source_checked_date: string \| null/);
assert.match(model, /function sourceCheckedDate/);
assert.match(model, /records\.some\(\(record\) => !record\.checked_date\)/);
assert.match(model, /records\.map\(\(record\) => record\.checked_date as string\)\.sort\(\)\[0\]/);
assert.match(model, /source_checked_date: sourceCheckedDate\(records\)/);

for (const surface of [dashboard, matrix]) {
  assert.match(surface, /SourceFreshnessBadge/);
  assert.match(surface, /getTimetableDateContext/);
  assert.match(surface, /freshnessReferenceDate = getTimetableDateContext\(\)\.today/);
  assert.match(surface, /country\.source_checked_date/);
  assert.match(surface, /data-source-checked-date/);
  assert.doesNotMatch(surface, /Date\.now\(|new Date\(/);
  assert.doesNotMatch(surface, /<style>/);
}
assert.match(dashboard, /Source freshness/);
assert.match(dashboard, /ソース鮮度/);
assert.match(dashboard, /oldest check date/);
assert.match(matrix, /sourceFreshness: 'Source freshness'/);
assert.match(matrix, /sourceFreshness: 'ソース鮮度'/);
assert.match(matrix, /data-freshness-reference-date/);

assert.match(badge, /SOURCE_REVIEW_DUE_AFTER_DAYS/);
assert.match(badge, /data-source-freshness/);
assert.match(badge, /Review due/);
assert.match(badge, /再確認推奨/);
assert.match(badge, /Check date unknown/);
assert.match(badge, /確認日不明/);
assert.match(badge, /coverage-status--limited/);
assert.match(badge, /coverage-status--blocked/);
assert.doesNotMatch(badge, /<style>/);

assert.match(enPage, /oldest checked date/);
assert.match(enPage, /no more than 30 days/);
assert.match(jaPage, /最も古い確認日/);
assert.match(jaPage, /30日を超えれば/);

for (const text of [model, badge, dashboard, matrix, enPage, jaPage]) {
  assert.doesNotMatch(text, /odds|payouts?|results?|jockeys?|trainers?|raw_html|raw source content|full racecard/i);
}

for (const marker of [
  'permissions:',
  'contents: read',
  'npm install --package-lock=false',
  'npm run build',
  'node scripts/check-m6-source-freshness-badges.mjs',
  'node scripts/check-m6-country-coverage-matrix.mjs',
  'git diff --exit-code',
]) assert.match(workflow, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
for (const forbidden of ['contents: write', 'pull-requests: write', 'schedule:', 'cron:', 'deploy', 'wrangler']) {
  assert.ok(!workflow.toLowerCase().includes(forbidden.toLowerCase()), `workflow contains forbidden marker: ${forbidden}`);
}

console.log('M6 source freshness badges check passed.');
console.log(`SOURCE_REVIEW_DUE_AFTER_DAYS: ${SOURCE_REVIEW_DUE_AFTER_DAYS}`);
console.log('AGGREGATION: oldest checked_date across contributing country readiness records');
console.log('MISSING_DATE: unknown');
console.log('SURFACES: calendar coverage dashboard, country coverage matrix');
console.log('NEW_CSS: 0');
console.log('PUBLICATION_BOUNDARY_CHANGED: false');
