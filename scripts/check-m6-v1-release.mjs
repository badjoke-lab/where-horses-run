import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const release = JSON.parse(fs.readFileSync('data/static/m6-v1-release-v1.json', 'utf8'));
const candidate = JSON.parse(fs.readFileSync('data/static/m6-v1-release-candidate-v1.json', 'utf8'));
const historicalDecision = JSON.parse(fs.readFileSync('data/static/v1-release-decision-v1.json', 'utf8'));
const doc = fs.readFileSync('docs/release/m6-v1-release.md', 'utf8');
const workflow = fs.readFileSync('.github/workflows/m6-v1-release.yml', 'utf8');

const EXPECTED_TAG = 'v1.0.0';
const EXPECTED_TAG_COMMIT = '6d45895fb04ccbc3160e763c54438a4d51dff905';
const EXPECTED_COUNTRIES = [
  'japan',
  'hong-kong',
  'united-arab-emirates',
  'south-korea',
  'turkey',
  'morocco',
];

assert.equal(release.schema_version, 'm6-v1-release-v1');
assert.equal(release.work_id, 'WHR-M6-V1-RELEASE');
assert.equal(release.implementation_unit, 'M6-V1-RELEASE-01');
assert.equal(release.status, 'release_record');
assert.equal(release.effective_when, 'merged_to_main');
assert.equal(release.reviewed_at, '2026-08-17');
assert.equal(release.release_line, 'v1.0');
assert.equal(release.site_origin, 'https://whr.badjoke-lab.com');
assert.deepEqual(release.target_countries, EXPECTED_COUNTRIES);

assert.deepEqual(release.release_candidate, {
  contract: 'data/static/m6-v1-release-candidate-v1.json',
  implementation_unit: 'M6-V1-RELEASE-CANDIDATE-01',
  required_status: 'release_candidate_ready',
  parent_main_commit: 'caabc16098e8abb2dbb9d224adbaba5d31cdf3a0',
});
assert.equal(candidate.schema_version, 'm6-v1-release-candidate-v1');
assert.equal(candidate.implementation_unit, release.release_candidate.implementation_unit);
assert.equal(candidate.status, release.release_candidate.required_status);
assert.equal(candidate.site_origin, release.site_origin);
assert.deepEqual(candidate.target_countries, EXPECTED_COUNTRIES);
assert.equal(candidate.release_actions.m6_release_candidate_complete, true);
assert.equal(candidate.release_actions.m6_final_release_complete, false);
assert.equal(candidate.release_actions.next_work_item, 'PR-102');
assert.equal(candidate.release_actions.next_implementation_unit, 'M6-V1-RELEASE-01');

assert.equal(historicalDecision.schema_version, 'v1-release-decision-v1');
assert.equal(historicalDecision.release_id, 'WHR-V1');
assert.equal(historicalDecision.implementation_unit, 'V1-RELEASE-DECISION-01');
assert.equal(historicalDecision.status, 'complete');
assert.equal(historicalDecision.decision, 'accepted_for_reviewed_static_public_release');

assert.deepEqual(release.release_action, {
  action: 'merge_pr_102_to_main',
  merge_is_release_record_activation: true,
  release_commit_resolved_by_merge: true,
  deployment_performed_by_this_unit: false,
  github_release_created_by_this_unit: false,
});
assert.deepEqual(release.version_tag_policy, {
  existing_tag: EXPECTED_TAG,
  existing_tag_commit: EXPECTED_TAG_COMMIT,
  existing_tag_represents: '2026-07-19 historical WHR-V1 release decision',
  move_existing_tag: false,
  delete_existing_tag: false,
  create_replacement_semver_without_separate_version_decision: false,
  new_tag_created_by_this_unit: false,
});
assert.ok(Object.values(release.final_quality_contract).every((value) => value === true));
assert.deepEqual(release.public_boundary, candidate.public_boundary);
assert.deepEqual(release.automation_boundary, {
  candidate_generation_may_be_automated: true,
  validation_may_be_automated: true,
  human_review_may_be_bypassed: false,
  automatic_publication_enabled: false,
  tag_mutation_enabled: false,
  deployment_enabled_by_gate: false,
});
assert.deepEqual(release.completion, {
  m6_release_candidate_complete: true,
  m6_v1_release_complete_when_merged: true,
  next_stage: 'reviewed_incremental_maintenance',
});

const tagCommit = execFileSync('git', ['rev-list', '-n', '1', EXPECTED_TAG], { encoding: 'utf8' }).trim();
assert.equal(tagCommit, EXPECTED_TAG_COMMIT, `${EXPECTED_TAG} moved from historical release commit`);

for (const marker of [
  'M6-V1-RELEASE-01',
  'PR-101',
  'Japan, Hong Kong, UAE, South Korea, Turkey, and Morocco',
  EXPECTED_TAG,
  EXPECTED_TAG_COMMIT,
  'does not move, delete, or repurpose that tag',
  'No GitHub Release object or deployment is created by this gate',
  'PR-096 through PR-102 roadmap is complete',
  'reviewed incremental maintenance',
]) assert.ok(doc.includes(marker), `release documentation marker missing: ${marker}`);

for (const marker of [
  'permissions:',
  'contents: read',
  'fetch-depth: 0',
  'npm install --package-lock=false',
  'npm run build',
  'node scripts/check-m6-v1-release-candidate.mjs',
  'node scripts/check-m6-v1-release.mjs',
  'git status --porcelain',
]) assert.ok(workflow.includes(marker), `release workflow marker missing: ${marker}`);
for (const forbidden of [
  'contents: write',
  'pull-requests: write',
  'schedule:',
  'cron:',
  'git tag ',
  'git push',
  'gh release',
  'wrangler',
  'cloudflare pages deploy',
]) assert.ok(!workflow.toLowerCase().includes(forbidden.toLowerCase()), `release workflow contains forbidden marker: ${forbidden}`);

console.log('M6_V1_RELEASE: pass');
console.log('RELEASE_EFFECTIVE_WHEN: merged_to_main');
console.log(`RELEASE_LINE: ${release.release_line}`);
console.log(`TARGET_COUNTRIES: ${EXPECTED_COUNTRIES.join(',')}`);
console.log(`HISTORICAL_TAG: ${EXPECTED_TAG}@${tagCommit}`);
console.log('TAG_MUTATION: false');
console.log('GITHUB_RELEASE_CREATED_BY_GATE: false');
console.log('DEPLOYMENT_PERFORMED_BY_GATE: false');
console.log('NEXT_STAGE: reviewed_incremental_maintenance');
