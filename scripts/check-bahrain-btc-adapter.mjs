import assert from 'node:assert/strict';
import { validateCalendarAuthorityMetadataV1 } from './timetable/calendar-authority-metadata.mjs';
import {
  BTC_RACECOURSE_ID,
  buildBtcDetailedRecord,
  buildBtcFixtureRecord,
  parseBtcRacecardPage,
  parseBtcSeasonProgrammePage,
} from './timetable/bahrain-btc-core.mjs';

const seasonUrl='https://bahrainturfclub.com/racing/rehc-racing-season-imported';
const seasonHtml=`<html><body>
<h1>Imported Race Programme</h1>
<p>2026-27 season: 30 Race Meetings (30th October 2026 - 16th April 2027)</p>
<div>October 2026</div>
<div>30 October 2026 | 0-90 1000m (Str) | Maiden 1600m</div>
<div>6 November 2026 | 0-85 1400m | Maiden 1400m</div>
<div>13 November 2026 | Bahrain International Trophy 2000m</div>
<div>13 November 2026 | duplicated local programme date</div>
</body></html>`;
const schedule=parseBtcSeasonProgrammePage(seasonHtml,{sourceUrl:seasonUrl});
assert.equal(schedule.length,3);
assert.deepEqual(schedule.map(row=>row.date),['2026-10-30','2026-11-06','2026-11-13']);
assert(schedule.every(row=>row.racecourse_id===BTC_RACECOURSE_ID));

const racecardUrl='https://bahrainturfclub.com/racecard/2026-10-30/1/entries';
const racecardHtml=`<html><head><title>Entries for race 1 on 30 October 2026</title></head><body>
<h1>Entries for 30 October 2026</h1>
<nav>Back Race 1 4:00 pm Race 2 4:30 pm Race 3 5:05 pm Race 4 5:40 pm</nav>
</body></html>`;
const detail=parseBtcRacecardPage(racecardHtml,{date:'2026-10-30',sourceUrl:racecardUrl});
assert.deepEqual(detail.timetable_rows,[
  {label:'Race 1',post_time_local:'16:00'},
  {label:'Race 2',post_time_local:'16:30'},
  {label:'Race 3',post_time_local:'17:05'},
  {label:'Race 4',post_time_local:'17:40'},
]);

const checkedAt='2026-09-24T00:00:00Z';
const fixture=buildBtcFixtureRecord(schedule[0],{checkedAt});
assert.equal(fixture.capability_rank,'C');
assert.equal(fixture.acquisition_completion.disposition,'pending_publication');
assert.equal(fixture.acquisition_completion.observed_rank,'C');
assert.equal(fixture.acquisition_completion.technical_capability_rank,'A');
assert.equal(fixture.acquisition_completion.higher_rank_open,true);
assert.deepEqual(validateCalendarAuthorityMetadataV1({
  acquisition_attempt:fixture.acquisition_attempt,
  acquisition_completion:fixture.acquisition_completion,
  evidence_support:fixture.evidence_support,
}),[]);

const detailed=buildBtcDetailedRecord(schedule[0],detail,{checkedAt});
assert.equal(detailed.capability_rank,'A');
assert.equal(detailed.first_race_time_local,'16:00');
assert.equal(detailed.last_race_time_local,'17:40');
assert.equal(detailed.acquisition_completion.disposition,'complete_current_best_available');
assert.equal(detailed.acquisition_completion.higher_rank_open,false);
assert.deepEqual(validateCalendarAuthorityMetadataV1({
  acquisition_attempt:detailed.acquisition_attempt,
  acquisition_completion:detailed.acquisition_completion,
  evidence_support:detailed.evidence_support,
}),[]);

console.log('BAHRAIN_BTC_ADAPTER: pass');
