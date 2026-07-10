import fs from 'node:fs';
import path from 'node:path';
import {
  buildUaeEraArticleArtifacts,
  parseUaeEraSeasonArticleHtml,
  UAE_ERA_SEASON_ARTICLE_V1,
} from './timetable/uae-era-season-article-parser-core.mjs';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const fixtures = JSON.parse(fs.readFileSync(path.join(root, 'data/fixtures/calendar-uae-era-season-article-parser-fixtures-v1.json'), 'utf8'));

if (fixtures.schema_version !== 'calendar-uae-era-season-article-parser-fixtures-v1') fail('fixture schema differs.');
if (fixtures.work_id !== 'WHR-CAL-UAE-ERA' || fixtures.implementation_unit !== 'UAE-PILOT-02') fail('fixture Work identity differs.');

let observation = null;
try {
  observation = parseUaeEraSeasonArticleHtml(fixtures.valid.html);
} catch (error) {
  fail(`valid article fixture parse failed: ${error.message}`);
}
if (observation) {
  for (const key of ['season_start_year', 'season_end_year', 'opening_date', 'opening_venue_label', 'closing_date', 'total_race_meetings', 'total_racecourses', 'venue_count_sum']) {
    if (!exact(observation[key], fixtures.valid.expected[key])) fail(`valid article ${key} differs.`);
  }
  if (observation.mapped_meetings.length !== fixtures.valid.expected.mapped_meeting_count) fail('mapped meeting count differs.');
  if (observation.unresolved_venue_observations.length !== fixtures.valid.expected.unresolved_venue_count) fail('unresolved venue count differs.');
  if (observation.mapped_meetings[0]?.meeting_id !== fixtures.valid.expected.mapped_meeting_id) fail('mapped meeting ID differs.');
  if (observation.unresolved_venue_observations[0]?.venue_label !== 'Abu Dhabi Turf Club') fail('unresolved opening venue differs.');
  if (observation.unresolved_venue_observations[0]?.reason !== 'canonical_racecourse_id_not_reviewed') fail('unresolved venue reason differs.');
  if (observation.pdf_url !== UAE_ERA_SEASON_ARTICLE_V1.pdf_url) fail('PDF URL observation differs.');
  if (observation.raw_source_storage !== 'disabled') fail('raw source storage boundary differs.');
}

let built = null;
try {
  built = buildUaeEraArticleArtifacts({
    html: fixtures.valid.html,
    generatedAt: '2026-07-11T00:30:00Z',
    checkedAt: '2026-07-11T00:25:00Z',
    batchId: 'uae-era-pilot-02-article-fixture',
    campaignId: 'uae-era-stage-10-pilot',
    jobId: 'uae-era-pilot-02-article-fixture-job',
  });
} catch (error) {
  fail(`valid article artifact build failed: ${error.message}`);
}
if (built) {
  const { candidate, coverage, manifest, report } = built.artifacts;
  if (candidate.records.length !== 1) fail('article artifact candidate count differs.');
  const record = candidate.records[0];
  if (record?.meeting_id !== 'uae-meydan-racecourse-2027-03-27') fail('article candidate meeting differs.');
  if (record?.capability_rank !== 'C') fail('article candidate rank must remain C.');
  if (record?.first_race_time_local !== null || record?.last_race_time_local !== null || record?.timetable_rows?.length !== 0) fail('article candidate emitted time/detail claims.');
  if (coverage.coverage_claim !== 'partial' || manifest.coverage_claim !== 'partial') fail('article coverage must remain partial.');
  if (!exact(coverage.unresolved_dates, ['2026-10-22'])) fail('article unresolved opening date differs.');
  if (!exact(coverage.unresolved_dates, manifest.unresolved_dates)) fail('Coverage/Manifest unresolved dates differ.');
  if (manifest.runner_used !== 'github_actions') fail('article evidence runner identity differs.');
  if (manifest.rank_counts.C !== 1 || Object.entries(manifest.rank_counts).some(([rank, count]) => rank !== 'C' && count !== 0)) fail('article rank counts differ.');
  if (report.network_fetch !== false || report.registry_activation !== false) fail('article report network/Registry boundary differs.');
  if (report.canonical_write !== 'disabled' || report.public_write !== 'disabled' || report.publication_effect !== 'none') fail('article report write/publication boundary differs.');
}

for (const testCase of fixtures.invalid_cases ?? []) {
  const html = fixtures.valid.html.replace(testCase.replace.from, testCase.replace.to);
  let rejected = false;
  try {
    buildUaeEraArticleArtifacts({
      html,
      generatedAt: '2026-07-11T00:30:00Z',
      checkedAt: '2026-07-11T00:25:00Z',
      batchId: `uae-era-pilot-02-${testCase.id}`,
      campaignId: 'uae-era-stage-10-pilot',
      jobId: `uae-era-pilot-02-${testCase.id}-job`,
    });
  } catch {
    rejected = true;
  }
  if (!rejected) fail(`${testCase.id}: invalid article structure unexpectedly passed.`);
}

let unofficialRejected = false;
try {
  parseUaeEraSeasonArticleHtml(fixtures.valid.html, { sourceUrl: 'https://example.com/uae-schedule' });
} catch {
  unofficialRejected = true;
}
if (!unofficialRejected) fail('unofficial article source URL unexpectedly passed.');

const parserSource = fs.readFileSync(path.join(root, 'scripts/timetable/uae-era-season-article-parser-core.mjs'), 'utf8');
for (const forbidden of ['horse_name', 'jockey_name', 'trainer_name', 'odds_value', 'result_payload', 'payout_amount', 'stream_url']) {
  if (parserSource.includes(forbidden)) fail(`parser source contains forbidden field marker ${forbidden}.`);
}

if (errors.length) {
  console.error(`CALENDAR_UAE_ERA_SEASON_ARTICLE_PARSER: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CALENDAR_UAE_ERA_SEASON_ARTICLE_PARSER: pass');
console.log('WORK_ID: WHR-CAL-UAE-ERA');
console.log('IMPLEMENTATION_UNIT: UAE-PILOT-02');
console.log('ARTICLE_ROUTE: official_html');
console.log('ARTICLE_SUMMARY: 64 meetings / 5 racecourses');
console.log('TRUSTED_CANDIDATE: uae-meydan-racecourse-2027-03-27');
console.log('UNRESOLVED_VENUE_DATE: 2026-10-22');
console.log('COVERAGE_CLAIM: partial');
console.log('REGISTRY_ACTIVATION: false');
