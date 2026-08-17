import assert from 'node:assert/strict';
import fs from 'node:fs';

const contract = JSON.parse(fs.readFileSync('data/static/m6-v1-release-candidate-v1.json', 'utf8'));
const historicalDecision = JSON.parse(fs.readFileSync('data/static/v1-release-decision-v1.json', 'utf8'));
const coverageAddition = JSON.parse(fs.readFileSync('data/static/m6-country-coverage-route-addition-v1.json', 'utf8'));
const sourceFreshness = JSON.parse(fs.readFileSync('data/static/m6-source-freshness-badges-v1.json', 'utf8'));
const methodsFinal = JSON.parse(fs.readFileSync('data/static/m6-methods-data-policy-final-v1.json', 'utf8'));
const seoFinal = JSON.parse(fs.readFileSync('data/generated/m6-seo-sitemap-metadata-final.json', 'utf8'));
const coverageModel = fs.readFileSync('src/lib/timetable/coverageDashboard.ts', 'utf8');
const doc = fs.readFileSync('docs/release/m6-v1-release-candidate.md', 'utf8');
const workflow = fs.readFileSync('.github/workflows/m6-v1-release-candidate.yml', 'utf8');

const expectedCountries = [
  'japan',
  'hong-kong',
  'united-arab-emirates',
  'south-korea',
  'turkey',
  'morocco',
];
const expectedWorkItems = ['PR-096', 'PR-097', 'PR-098', 'PR-099', 'PR-100'];
const expectedCheckers = [
  'scripts/check-m6-mobile-timetable-ux.mjs',
  'scripts/check-m6-country-coverage-matrix.mjs',
  'scripts/check-m6-source-freshness-badges.mjs',
  'scripts/check-m6-methods-data-policy-final.mjs',
  'scripts/check-m6-seo-sitemap-metadata-final.mjs',
];

assert.equal(contract.schema_version, 'm6-v1-release-candidate-v1');
assert.equal(contract.work_id, 'WHR-M6-V1-RELEASE-CANDIDATE');
assert.equal(contract.implementation_unit, 'M6-V1-RELEASE-CANDIDATE-01');
assert.equal(contract.status, 'release_candidate_ready');
assert.equal(contract.reviewed_at, '2026-08-17');
assert.equal(contract.site_origin, 'https://whr.badjoke-lab.com');
assert.deepEqual(contract.target_countries, expectedCountries);
assert.deepEqual(contract.m6_completed_work.map((item) => item.work_item), expectedWorkItems);
assert.deepEqual(contract.m6_completed_work.map((item) => item.checker), expectedCheckers);
for (const checker of expectedCheckers) assert.ok(fs.existsSync(checker), `missing required M6 checker: ${checker}`);
assert.ok(Object.values(contract.quality_contract).every((value) => value === true));

assert.deepEqual(contract.historical_v1_baseline, {
  release_decision_contract: 'data/static/v1-release-decision-v1.json',
  release_id: 'WHR-V1',
  implementation_unit: 'V1-RELEASE-DECISION-01',
  decision: 'accepted_for_reviewed_static_public_release',
  baseline_commit: '57da4a73d0646603eb59e3f5faff9ceaf5a3213e',
  preserved_as_historical_evidence: true,
});
assert.equal(historicalDecision.schema_version, 'v1-release-decision-v1');
assert.equal(historicalDecision.release_id, contract.historical_v1_baseline.release_id);
assert.equal(historicalDecision.implementation_unit, contract.historical_v1_baseline.implementation_unit);
assert.equal(historicalDecision.status, 'complete');
assert.equal(historicalDecision.decision, contract.historical_v1_baseline.decision);
assert.equal(historicalDecision.candidate_baseline.baseline_commit, contract.historical_v1_baseline.baseline_commit);

assert.equal(coverageAddition.schema_version, 'm6-country-coverage-route-addition-v1');
assert.equal(coverageAddition.implementation_unit, 'M6-COUNTRY-COVERAGE-MATRIX-01');
assert.equal(coverageAddition.status, 'reviewed_route_addition');
assert.equal(coverageAddition.new_route_family, false);
assert.equal(coverageAddition.new_public_data_class, false);
assert.deepEqual(coverageAddition.routes, [
  { language: 'en', path: '/about/data-coverage/' },
  { language: 'ja', path: '/ja/about/data-coverage/' },
]);

assert.equal(sourceFreshness.schema_version, 'm6-source-freshness-badges-v1');
assert.equal(sourceFreshness.implementation_unit, 'M6-SOURCE-FRESHNESS-BADGES-01');
assert.equal(sourceFreshness.status, 'implemented');
assert.equal(sourceFreshness.boundary.changes_public_timetable_fields, false);
assert.equal(sourceFreshness.boundary.changes_publication_rank, false);
assert.equal(sourceFreshness.boundary.adds_raw_source_content, false);
assert.equal(sourceFreshness.boundary.adds_odds_results_payouts_or_participants, false);

assert.equal(methodsFinal.schema_version, 'm6-methods-data-policy-final-v1');
assert.equal(methodsFinal.implementation_unit, 'M6-METHODS-DATA-POLICY-FINAL-01');
assert.equal(methodsFinal.status, 'finalized');
assert.equal(methodsFinal.publication_boundary.rank_a_plus_lightweight_programme_summary_on_meeting_detail_only, true);
assert.equal(methodsFinal.publication_boundary.complete_racecards_excluded, true);
assert.equal(methodsFinal.publication_boundary.entries_participants_odds_results_payouts_predictions_excluded, true);
assert.equal(methodsFinal.publication_boundary.copied_official_body_or_raw_html_excluded, true);
assert.equal(methodsFinal.automation_boundary.human_review_may_be_bypassed, false);
assert.equal(methodsFinal.automation_boundary.automatic_publication_enabled, false);

assert.equal(seoFinal.schema_version, '1.0.0');
assert.equal(seoFinal.release_stage, 'M6');
assert.equal(seoFinal.work_item, 'PR-100');
assert.equal(seoFinal.site_origin, contract.site_origin);
assert.equal(seoFinal.public_boundary.does_not_expand_routes, true);

for (const countryId of expectedCountries) {
  assert.match(coverageModel, new RegExp(`id: '${countryId}'`), `coverage model missing RC country ${countryId}`);
}

assert.deepEqual(contract.public_boundary, {
  existing_route_families_only: true,
  reviewed_route_additions_only: true,
  existing_public_data_classes_only: true,
  rank_a_plus_programme_summary_meeting_detail_only: true,
  complete_racecards_allowed: false,
  entries_or_participants_allowed: false,
  odds_results_payouts_predictions_allowed: false,
  raw_source_body_or_html_allowed: false,
  unreviewed_candidate_publication_allowed: false,
});
assert.deepEqual(contract.automation_boundary, {
  candidate_generation_may_be_automated: true,
  validation_may_be_automated: true,
  human_review_may_be_bypassed: false,
  automatic_publication_enabled: false,
  release_tag_creation_enabled_by_gate: false,
  deployment_enabled_by_gate: false,
});
assert.deepEqual(contract.release_actions, {
  m6_release_candidate_complete: true,
  m6_final_release_complete: false,
  release_tag_created_by_this_unit: false,
  github_release_created_by_this_unit: false,
  deployment_performed_by_this_unit: false,
  next_work_item: 'PR-102',
  next_implementation_unit: 'M6-V1-RELEASE-01',
});

for (const marker of [
  'M6-V1-RELEASE-CANDIDATE-01',
  'PR-096', 'PR-097', 'PR-098', 'PR-099', 'PR-100',
  'Japan, Hong Kong, UAE, South Korea, Turkey, and Morocco',
  'full current public-page mobile sweep',
  'full current public-page accessibility sweep',
  'PR-102',
]) assert.ok(doc.includes(marker), `RC documentation marker missing: ${marker}`);

for (const marker of [
  'permissions:',
  'contents: read',
  'npm install --package-lock=false',
  'npm run build',
  'node scripts/check-m6-mobile-timetable-ux.mjs',
  'node scripts/check-m6-country-coverage-matrix.mjs',
  'node scripts/check-m6-source-freshness-badges.mjs',
  'node scripts/check-m6-methods-data-policy-final.mjs',
  'node scripts/check-m6-seo-sitemap-metadata-final.mjs',
  'node scripts/run-v1-mobile-qa-browser.mjs',
  'node scripts/check-v1-mobile-qa.mjs',
  'node scripts/run-v1-accessibility-qa-browser.mjs',
  'node scripts/check-v1-accessibility-qa.mjs',
  'node scripts/run-v1-performance-qa.mjs',
  'node scripts/check-v1-performance-qa.mjs',
  'node scripts/check-v1-release-readiness.mjs',
  'node scripts/check-v1-release-decision.mjs',
  'node scripts/check-m6-v1-release-candidate.mjs',
  'git status --porcelain',
]) assert.ok(workflow.includes(marker), `RC workflow marker missing: ${marker}`);
for (const forbidden of ['contents: write', 'pull-requests: write', 'schedule:', 'cron:', 'git tag', 'gh release', 'git push', 'wrangler', 'cloudflare pages deploy']) {
  assert.ok(!workflow.toLowerCase().includes(forbidden.toLowerCase()), `RC workflow contains forbidden marker: ${forbidden}`);
}

console.log('M6_V1_RELEASE_CANDIDATE: pass');
console.log('M6_COMPLETED_WORK_ITEMS: PR-096,PR-097,PR-098,PR-099,PR-100');
console.log(`TARGET_COUNTRIES: ${expectedCountries.join(',')}`);
console.log('HISTORICAL_V1_RELEASE_DECISION_PRESERVED: true');
console.log('CURRENT_MOBILE_SWEEP_REQUIRED: true');
console.log('CURRENT_ACCESSIBILITY_SWEEP_REQUIRED: true');
console.log('CURRENT_PERFORMANCE_SWEEP_REQUIRED: true');
console.log('M6_FINAL_RELEASE_COMPLETE: false');
console.log('NEXT_WORK_ITEM: PR-102');
