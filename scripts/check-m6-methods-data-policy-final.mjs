import assert from 'node:assert/strict';
import fs from 'node:fs';

const finalContract = JSON.parse(fs.readFileSync('data/static/m6-methods-data-policy-final-v1.json', 'utf8'));
const historicalContract = JSON.parse(fs.readFileSync('data/static/methods-data-policy-contract-v1.json', 'utf8'));
const sourceFreshnessContract = JSON.parse(fs.readFileSync('data/static/m6-source-freshness-badges-v1.json', 'utf8'));
const publicFreshnessState = fs.readFileSync('src/lib/timetable/publicFreshnessState.mjs', 'utf8');
const component = fs.readFileSync('src/components/MethodsPage.astro', 'utf8');
const humanReviewWorkflow = fs.readFileSync('.github/workflows/m5-human-review.yml', 'utf8');
const humanReviewChecker = fs.readFileSync('scripts/check-m5-human-review-workflow.mjs', 'utf8');
const doc = fs.readFileSync('docs/release/m6-methods-data-policy-final.md', 'utf8');
const workflow = fs.readFileSync('.github/workflows/m6-methods-data-policy-final.yml', 'utf8');

assert.equal(finalContract.schema_version, 'm6-methods-data-policy-final-v1');
assert.equal(finalContract.work_id, 'WHR-M6-METHODS-DATA-POLICY-FINAL');
assert.equal(finalContract.implementation_unit, 'M6-METHODS-DATA-POLICY-FINAL-01');
assert.equal(finalContract.status, 'finalized');
assert.equal(finalContract.reviewed_at, '2026-08-16');
assert.equal(finalContract.baseline_contract, 'data/static/methods-data-policy-contract-v1.json');
assert.deepEqual(finalContract.structural_contract, {
  methods_pages: 2,
  languages: 2,
  sections_per_page: 9,
  paragraphs_per_section: 2,
  historical_titles_and_descriptions_preserved: true,
  historical_navigation_preserved: true,
});
assert.ok(Object.values(finalContract.final_topics).every((value) => value === true));
assert.deepEqual(finalContract.freshness_contract, {
  source_freshness_current_through_days: 30,
  source_freshness_review_due_after_days: 30,
  source_freshness_aggregate_date: 'oldest checked date among readiness records contributing to the country coverage aggregate',
  source_freshness_missing_date: 'unknown',
  meeting_stale_after_days: 1,
  source_and_meeting_freshness_are_distinct: true,
});
assert.ok(Object.values(finalContract.publication_boundary).every((value) => value === true));
assert.deepEqual(finalContract.automation_boundary, {
  candidate_generation_may_be_automated: true,
  validation_may_be_automated: true,
  human_review_may_be_bypassed: false,
  automatic_publication_enabled: false,
  automatic_merge_or_deployment_enabled: false,
});

assert.equal(historicalContract.schema_version, 'methods-data-policy-contract-v1');
assert.equal(historicalContract.work_id, 'WHR-SEO-PUBLIC-CONTENT-V1');
assert.equal(historicalContract.implementation_unit, 'METHODS-DATA-POLICY-01');
assert.equal(historicalContract.reviewed_at, '2026-07-18');
assert.equal(historicalContract.scope.sections_per_page, 9);
assert.equal(historicalContract.scope.paragraphs_per_page, 18);

assert.equal(sourceFreshnessContract.freshness_policy.current_through_days, 30);
assert.equal(sourceFreshnessContract.freshness_policy.review_due_when_age_days_greater_than, 30);
assert.match(publicFreshnessState, /DEFAULT_STALE_AFTER_DAYS = 1/);

const enMarkers = [
  'source capability is kept separate from the reviewed scope already published',
  'Candidates, diffs, and run records are review material',
  'does not bypass human review or publish unreviewed data',
  'meeting-level stale warnings use the shared Calendar reference date',
  'Country source-freshness badges use the oldest checked date',
  'Current through 30 days',
  'Review due after 30 days',
  'more than one day older than the shared Calendar reference date',
  'A+ is a lightweight programme summary on meeting-detail pages',
  'complete racecards, copied official-source text, or raw HTML',
];
const jaMarkers = [
  '公式ソースから確認できる能力とレビュー後に公開済みの範囲も分けて扱います',
  '候補、差分、実行記録はレビュー用',
  '人のレビューを省略して公開へ進めません',
  '開催単位の古い確認には共通Calendar基準日からの鮮度警告',
  '最も古い確認日を使い',
  '30日を超えると「再確認推奨」',
  '1日を超えて古い場合にstale警告',
  'A+は開催詳細ページに限り',
  '公式本文やraw HTMLの転載は扱いません',
];
for (const marker of [...enMarkers, ...jaMarkers]) assert.ok(component.includes(marker), `final Methods marker missing: ${marker}`);

const sectionHeadingCount = [...component.matchAll(/heading: '[1-9]\. /g)].length;
assert.equal(sectionHeadingCount, 18, 'bilingual Methods section count changed');
const relatedHrefCount = [...component.matchAll(/href: '\/(?:ja\/)?(?:about|faq|disclaimer|sources)\/'/g)].length;
assert.equal(relatedHrefCount, 8, 'Methods related navigation changed');

assert.match(humanReviewWorkflow, /contents: read/);
assert.match(humanReviewWorkflow, /workflow_dispatch/);
assert.doesNotMatch(humanReviewWorkflow, /contents:\s*write/);
assert.match(humanReviewChecker, /human review/i);

for (const marker of [
  'M6-METHODS-DATA-POLICY-FINAL-01',
  'Human review remains required',
  'Current through 30 days',
  'more than one day older',
  'historical `methods-data-policy-contract-v1.json`',
]) assert.ok(doc.includes(marker), `final Methods documentation marker missing: ${marker}`);

for (const marker of [
  'permissions:',
  'contents: read',
  'npm install --package-lock=false',
  'npm run build',
  'node scripts/check-methods-data-policy.mjs',
  'node scripts/check-m6-methods-data-policy-final.mjs',
  'node scripts/check-m5-human-review-workflow.mjs',
  'node scripts/check-m6-source-freshness-badges.mjs',
  'git diff --exit-code',
]) assert.ok(workflow.includes(marker), `final Methods workflow marker missing: ${marker}`);
for (const forbidden of ['contents: write', 'pull-requests: write', 'schedule:', 'cron:', 'deploy', 'wrangler']) {
  assert.ok(!workflow.toLowerCase().includes(forbidden.toLowerCase()), `final Methods workflow contains forbidden marker: ${forbidden}`);
}

console.log('M6 Methods / Data Policy final check passed.');
console.log('STRUCTURE: 2 pages, 9 sections per language, 18 paragraphs per language');
console.log('HUMAN_REVIEW_REQUIRED: true');
console.log('SOURCE_FRESHNESS_CURRENT_THROUGH_DAYS: 30');
console.log('MEETING_STALE_AFTER_DAYS: 1');
console.log('HISTORICAL_METHODS_CONTRACT_REWRITTEN: false');
console.log('PUBLICATION_BOUNDARY_CHANGED: false');
