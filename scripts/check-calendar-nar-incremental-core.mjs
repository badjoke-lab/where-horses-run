import { readFileSync } from 'node:fs';
import {
  aggregateMonthlyScratch,
  buildIncrementalArtifacts,
  monthsInWindow,
  parseIncrementalArgs,
} from './timetable/nar-incremental-core.mjs';
import { validateCoverageObservation } from './timetable/coverage-observation-validation.mjs';

const errors = [];
const fail = (message) => errors.push(message);
const matrix = JSON.parse(readFileSync('data/static/nar-flat-racecourse-compatibility-v1.json', 'utf8'));
const [first, second] = matrix.records;

const cross = parseIncrementalArgs([
  '--start-date=2026-07-20',
  '--end-date-exclusive=2026-08-10',
], matrix.records);
if (JSON.stringify(monthsInWindow('2026-07-20', '2026-08-10')) !== JSON.stringify(['2026-07', '2026-08'])) fail('cross-month enumeration differs.');
if (cross.monthGroups.length !== 2) fail('cross-month grouping differs.');
if (cross.monthGroups[0].startDate !== '2026-07-20' || cross.monthGroups[0].endDateExclusive !== '2026-08-01') fail('July intersection differs.');
if (cross.monthGroups[1].startDate !== '2026-08-01' || cross.monthGroups[1].endDateExclusive !== '2026-08-10') fail('August intersection differs.');

const selectedA = `nar-${first.racecourse_id}-2026-07-21`;
const selectedB = `nar-${second.racecourse_id}-2026-08-03`;
const selected = parseIncrementalArgs([
  `--meeting-id=${selectedA}`,
  `--meeting-id=${selectedB}`,
], matrix.records);
if (selected.collectionMode !== 'selected_meetings' || selected.monthGroups.length !== 2) fail('selected meeting grouping differs.');

function meeting(record, date) {
  return {
    schema_version: 'nar-monthly-meeting-candidate-v1',
    candidate_id: `nar-${record.racecourse_id}-${date}`,
    racecourse_id: record.racecourse_id,
    venue_code: record.venue_code,
    date,
    review: { status: 'needs_review', promotion_eligible: false },
  };
}
function run(month, meetings, blockers = []) {
  return {
    candidates: {
      schema_version: 'nar-monthly-meeting-candidates-v1',
      meetings,
      blockers,
    },
    report: {
      schema_version: 'nar-monthly-collection-report-v1',
      official_schedule_url: `https://www.keiba.go.jp/KeibaWeb/MonthlyConveneInfo/MonthlyConveneInfoTop?k_month=${Number(month.slice(5))}&k_year=${month.slice(0, 4)}`,
      meetings_discovered: meetings.length + blockers.length,
    },
  };
}

const meetingA = meeting(first, '2026-07-01');
const meetingB = meeting(second, '2026-07-02');
const blocker = {
  venue_code: first.venue_code,
  racecourse_id: first.racecourse_id,
  date: '2026-07-03',
  status: 'parser_failure',
  blockers: [{ reason: 'test' }],
};
const aggregate = aggregateMonthlyScratch([
  run('2026-07', [meetingA, meetingB], [blocker]),
  run('2026-07', [meetingA]),
]);
if (aggregate.meetings.length !== 2) fail('overlap candidate deduplication differs.');
if (aggregate.blockers.length !== 1) fail('blocker aggregation differs.');

const partial = parseIncrementalArgs([
  '--start-date=2026-07-01',
  '--end-date-exclusive=2026-07-06',
], matrix.records);
const artifacts = buildIncrementalArtifacts({
  parsedArgs: partial,
  aggregate,
  checkedAt: '2026-07-07T00:00:00.000Z',
});
if (artifacts.coverage.coverage_claim !== 'partial') fail('partial coverage claim differs.');
if (artifacts.coverage.observed_scope.end_date_exclusive !== '2026-07-04') fail('source horizon differs.');
for (const date of ['2026-07-03', '2026-07-04', '2026-07-05']) {
  if (!artifacts.coverage.unresolved_dates.includes(date)) fail(`missing unresolved date ${date}.`);
}
if (JSON.stringify(artifacts.coverage.unresolved_dates) !== JSON.stringify(artifacts.retries.date_targets)) fail('coverage and retry dates differ.');
if (JSON.stringify(artifacts.coverage.unresolved_meeting_ids) !== JSON.stringify(artifacts.retries.meeting_targets)) fail('coverage and retry meeting IDs differ.');
if (artifacts.retries.scheduled_retry !== 'disabled') fail('scheduled retry must remain disabled.');
if (artifacts.report.publication_effect !== 'none' || artifacts.report.canonical_write !== 'disabled' || artifacts.report.public_write !== 'disabled') fail('write boundary differs.');

const coverageResult = validateCoverageObservation(artifacts.coverage);
if (!coverageResult.valid) fail(`Coverage Observation invalid: ${coverageResult.errors.join(' | ')}`);

if (errors.length) {
  console.error(`CALENDAR_NAR_INCREMENTAL_CORE: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}
console.log('CALENDAR_NAR_INCREMENTAL_CORE: pass');
console.log('DATE_WINDOW_MODE: supported');
console.log('CROSS_MONTH_WINDOW: supported');
console.log('SELECTED_MEETING_SCOPE: supported');
console.log('OVERLAP_DEDUPLICATION: deterministic');
console.log('PARTIAL_SOURCE_HORIZON: valid');
console.log('RETRY_TARGETS: explicit');
console.log('CANONICAL_WRITE: disabled');
console.log('PUBLIC_WRITE: disabled');
