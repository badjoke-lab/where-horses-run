import fs from 'node:fs';
import assert from 'node:assert/strict';
import {
  IRELAND_HRI_DETAIL_SOURCE_ID,
  buildIrelandHriCandidate,
  enrichIrelandHriCandidateWithRacecards,
  parseIrelandHriFixtureText,
  parseIrelandHriRacecardMonthHtml,
  resolveIrelandHriRacecourseId,
} from './timetable/ireland-hri-fixtures-core.mjs';
import { deriveBestAvailableRank } from './timetable/best-available-rank.mjs';
import { classifyAcquisitionCompletion } from './timetable/acquisition-completion.mjs';

const fixturePath = new URL('../data/fixtures/ireland-hri-fixture-list-observed-v1.txt', import.meta.url);
const text = fs.readFileSync(fixturePath, 'utf8');
const parsed = parseIrelandHriFixtureText(text, { startDate: '2026-09-10', endDateExclusive: '2026-10-10' });
assert.equal(parsed.unknown_venues.length, 0);
assert.equal(parsed.parse_failures.length, 0);
assert.equal(parsed.source_warnings.length, 1);
assert.deepEqual(parsed.source_warnings[0], {
  code: 'known_source_weekday_mismatch',
  date: '2026-10-04',
  source_weekday: 'Sat',
  calendar_weekday: 'Sun',
  venue_label: 'Curragh',
  reason: 'HRI 2026 Tipperary-change revision moved the Curragh fixture from 3 October to 4 October.',
});
assert.equal(parsed.records.length, 41);
assert.deepEqual(parsed.records[0], { date: '2026-09-10', venue_label: 'Laytown', racecourse_id: 'ireland--laytown', source_flags: ['E'] });
assert(parsed.records.some((row) => row.date === '2026-10-04' && row.racecourse_id === 'ireland--curragh'));
assert(!parsed.records.some((row) => row.date === '2026-10-03' && row.racecourse_id === 'ireland--curragh'));
assert.equal(parsed.records.at(-1).date, '2026-10-09');
assert.equal(parsed.records.at(-1).racecourse_id, 'ireland--dundalk');
assert.equal(resolveIrelandHriRacecourseId('Cork'), 'ireland--cork-mallow');
assert.equal(resolveIrelandHriRacecourseId('Down Royal'), 'ireland--down-royal');

const { candidate, diagnostics } = buildIrelandHriCandidate({ text, checkedAt: '2026-09-10T06:00:00Z', startDate: '2026-09-10', endDateExclusive: '2026-10-10' });
assert.equal(diagnostics.records_emitted, 41);
assert.equal(diagnostics.source_warnings.length, 1);
assert(candidate.records.every((record) => record.capability_rank === 'C'));
assert(candidate.records.every((record) => record.first_race_time_local === null && record.last_race_time_local === null));
assert(candidate.records.every((record) => record.timetable_rows.length === 0));
assert.equal(candidate.collection_target_rank, 'best_available');

const synthetic = structuredClone(candidate.records[0]);
synthetic.first_race_time_local = '13:20';
assert.equal(deriveBestAvailableRank(synthetic), 'B');
synthetic.last_race_time_local = '17:05';
assert.equal(deriveBestAvailableRank(synthetic), 'B+');
synthetic.timetable_rows = [{ label: 'Race 1', post_time_local: '13:20' }, { label: 'Race 2', post_time_local: '14:00' }];
assert.equal(deriveBestAvailableRank(synthetic), 'A');

const racecardHtml = `
<div class="race-results">
  <div class="race-result-item">
    <div class="race-result-item-header"><h2><a href=/racecards/details?meeting=2026-270>Ballinrobe</a> - Fri, Sep 11</h2></div>
    <div class="table-responsive">
      <table class="table table-condensed"><tr><td style="width:100px;">15:24</td><td><a href=/racecards/details?meeting=2026-270&race=1524>The Burke\`s Clonbur 3-Y-O Maiden Hurdle</a></td></tr></table>
      <table class="table table-condensed"><tr><td style="width:100px;">15:59</td><td><a href=/racecards/details?meeting=2026-270&race=1559>The Irish Stallion Farms EBF Mares Maiden Hurdle</a></td></tr></table>
      <table class="table table-condensed"><tr><td style="width:100px;">16:34</td><td><a href=/racecards/details?meeting=2026-270&race=1634>The Michael Cawe Suspended Ceilings Handicap Hurdle</a></td></tr></table>
      <table class="table table-condensed"><tr><td style="width:100px;">17:09</td><td><a href=/racecards/details?meeting=2026-270&race=1709>The Irish Stallion Farms EBF Mares Handicap Hurdle</a></td></tr></table>
      <table class="table table-condensed"><tr><td style="width:100px;">17:40</td><td><a href=/racecards/details?meeting=2026-270&race=1740>The P&amp;D Lydon Mares Beginners Steeplechase</a></td></tr></table>
      <table class="table table-condensed"><tr><td style="width:100px;">18:10</td><td><a href=/racecards/details?meeting=2026-270&race=1810>The Lodge At Ashford Castle Handicap Steeplechase</a></td></tr></table>
      <table class="table table-condensed"><tr><td style="width:100px;">18:40</td><td><a href=/racecards/details?meeting=2026-270&race=1840>The Adare Manor Opportunity Handicap Steeplechase</a></td></tr></table>
      <table class="table table-condensed"><tr><td style="width:100px;">19:10</td><td><a href=/racecards/details?meeting=2026-270&race=1910>The John Madden &amp; Sons (Pro-Am) Flat Race</a></td></tr></table>
    </div>
  </div>
  <div class="race-result-item">
    <div class="race-result-item-header"><h2><a href=/racecards/details?meeting=2026-275>Downpatrick</a> - Fri, Sep 18</h2></div>
  </div>
</div>`;

const parsedRacecards = parseIrelandHriRacecardMonthHtml(racecardHtml);
assert.equal(parsedRacecards.unknown_venues.length, 0);
assert.equal(parsedRacecards.parse_failures.length, 0);
assert.equal(parsedRacecards.meetings.length, 2);
const ballinrobeDetail = parsedRacecards.meetings.find((meeting) => meeting.racecourse_id === 'ireland--ballinrobe');
assert(ballinrobeDetail);
assert.equal(ballinrobeDetail.date, '2026-09-11');
assert.equal(ballinrobeDetail.hri_meeting_id, '2026-270');
assert.equal(ballinrobeDetail.races.length, 8);
assert.equal(ballinrobeDetail.races[0].post_time_local, '15:24');
assert.equal(ballinrobeDetail.races.at(-1).post_time_local, '19:10');
assert.equal(ballinrobeDetail.races[4].race_name, 'The P&D Lydon Mares Beginners Steeplechase');
const downpatrickDetail = parsedRacecards.meetings.find((meeting) => meeting.racecourse_id === 'ireland--downpatrick');
assert(downpatrickDetail);
assert.equal(downpatrickDetail.races.length, 0);

const enriched = enrichIrelandHriCandidateWithRacecards(candidate, {
  meetings: parsedRacecards.meetings,
  checkedAt: '2026-09-10T18:31:43Z',
});
const ballinrobe = enriched.records.find((record) => record.date === '2026-09-11' && record.racecourse_id === 'ireland--ballinrobe');
assert(ballinrobe);
assert.equal(ballinrobe.capability_rank, 'A');
assert.equal(ballinrobe.first_race_time_local, '15:24');
assert.equal(ballinrobe.last_race_time_local, '19:10');
assert.equal(ballinrobe.timetable_rows.length, 8);
assert.equal(ballinrobe.source.source_id, IRELAND_HRI_DETAIL_SOURCE_ID);
assert.equal(ballinrobe.detail_observation.status, 'available');
assert.equal(ballinrobe.detail_observation.evaluated_capability_rank, 'A');
assert.notEqual(ballinrobe.capability_rank, 'A+', 'HRI monthly race rows must not fabricate A+ fields');

const downpatrick = enriched.records.find((record) => record.date === '2026-09-18' && record.racecourse_id === 'ireland--downpatrick');
assert(downpatrick);
assert.equal(downpatrick.capability_rank, 'C');
assert.equal(downpatrick.detail_observation.status, 'not_published');
assert.equal(downpatrick.detail_observation.hri_meeting_id, '2026-275');

const profile = { technical_capability_rank: 'A', supported_observation_ranks: ['C', 'A'] };
assert.equal(classifyAcquisitionCompletion(ballinrobe, profile).disposition, 'complete_current_best_available');
assert.equal(classifyAcquisitionCompletion(downpatrick, profile).disposition, 'pending_publication');

const failed = enrichIrelandHriCandidateWithRacecards(candidate, {
  meetings: [],
  sourceErrorsByMonth: { '2026-09': { code: 'racecard_month_fetch_failed' } },
  checkedAt: '2026-09-10T18:31:43Z',
});
const failedBallinrobe = failed.records.find((record) => record.date === '2026-09-11' && record.racecourse_id === 'ireland--ballinrobe');
assert(failedBallinrobe);
assert.equal(failedBallinrobe.capability_rank, 'C');
assert.equal(failedBallinrobe.detail_observation.status, 'source_error');
assert.equal(classifyAcquisitionCompletion(failedBallinrobe, profile).disposition, 'retry_required');

const unexpectedMismatch = text.replace('Thu 10 Laytown (e)', 'Fri 10 Laytown (e)');
const unexpected = parseIrelandHriFixtureText(unexpectedMismatch, { startDate: '2026-09-10', endDateExclusive: '2026-09-11' });
assert(unexpected.parse_failures.some((failure) => failure.code === 'weekday_mismatch' && failure.date === '2026-09-10' && failure.venue_label === 'Laytown'));
assert(unexpected.parse_failures.some((failure) => failure.code === 'no_records_in_requested_window'));

console.log('IRELAND_HRI_FIXTURE_ADAPTER: pass');
console.log('IRELAND_HRI_RACECARD_ENRICHMENT: pass');
