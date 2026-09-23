import assert from 'node:assert/strict';
import { validateCalendarAuthorityMetadataV1 } from './timetable/calendar-authority-metadata.mjs';
import {
  BHA_2026_FIXTURE_PDF_URL,
  applyReviewedBhaSupplement,
  buildBhaFixtureRecord,
  parseBhaFixturePdfItems,
  parseBhaFullYearPage,
  resolveBhaRacecourseId,
} from './timetable/united-kingdom-bha-core.mjs';

const landing=`<html><body><h1>Full Year Fixture List</h1>
<a href="https://media.britishhorseracing.com/bha/Fixture_List/2026_Fixture_List.pdf">2026 Fixture List – PDF</a>
<a href="https://media.britishhorseracing.com/bha/Fixture_List/2027_Fixture_List.pdf">2027 Fixture List – PDF</a>
</body></html>`;
assert.equal(
  parseBhaFullYearPage(landing,{year:2026,sourceUrl:'https://www.britishhorseracing.com/racing/fixtures/full-year/'}),
  BHA_2026_FIXTURE_PDF_URL,
);

const items=[
  {page:7,x:30,y:700,str:'23-Sep'},
  {page:7,x:140,y:700,str:'Wednesday'},
  {page:7,x:250,y:700,str:'GOODWOOD'},
  {page:7,x:400,y:700,str:'Perth'},
  {page:7,x:550,y:700,str:'REDCAR'},
  {page:7,x:700,y:700,str:'KEMPTON PARK (F)'},
  {page:7,x:30,y:680,str:'24-Sep'},
  {page:7,x:140,y:680,str:'Thursday'},
  {page:7,x:250,y:680,str:'NEWMARKET'},
  {page:7,x:400,y:680,str:'Perth'},
  {page:7,x:550,y:680,str:'PONTEFRACT'},
  {page:7,x:700,y:680,str:'CHELMSFORD CITY (F)'},
  {page:7,x:30,y:660,str:'25-Sep'},
  {page:7,x:140,y:660,str:'Friday'},
  {page:7,x:250,y:660,str:'HAYDOCK PARK'},
  {page:7,x:400,y:660,str:'NEWMARKET'},
  {page:7,x:550,y:660,str:'Worcester'},
  {page:7,x:700,y:660,str:'NEWCASTLE (F)'},
];
const annual=parseBhaFixturePdfItems(items,{year:2026,sourceUrl:BHA_2026_FIXTURE_PDF_URL});
assert.deepEqual(
  annual.filter(row=>row.date==='2026-09-23').map(row=>row.racecourse_id),
  ['goodwood-racecourse','kempton-park-racecourse','perth-racecourse','redcar-racecourse'],
);
assert.equal(resolveBhaRacecourseId('Catterick Bridge'),'catterick-racecourse');
assert.equal(resolveBhaRacecourseId('Stratford-On-Avon'),'stratford-upon-avon-racecourse');
assert.equal(resolveBhaRacecourseId('KEMPTON PARK (F)'),'kempton-park-racecourse');

const supplement={
  annual_source_url:BHA_2026_FIXTURE_PDF_URL,
  fixtures:[
    {date:'2026-09-24',racecourse_ids:['newmarket-racecourse','perth-racecourse','pontefract-racecourse','southwell-racecourse']},
  ],
  source_overrides:{
    'bha-southwell-racecourse-2026-09-24':'https://www.britishhorseracing.com/press_releases/bha-confirms-transfer-of-fixtures-from-chelmsford-city-and-bath/',
  },
};
const reviewed=applyReviewedBhaSupplement(annual,supplement);
assert.equal(reviewed.some(row=>row.date==='2026-09-24'&&row.racecourse_id==='chelmsford-city-racecourse'),false);
const southwell=reviewed.find(row=>row.date==='2026-09-24'&&row.racecourse_id==='southwell-racecourse');
assert.ok(southwell);
assert.equal(southwell.source_kind,'reviewed_bha_transfer_override');

const checkedAt='2026-09-23T08:00:00Z';
const record=buildBhaFixtureRecord(southwell,{checkedAt});
assert.equal(record.country_id,'united-kingdom');
assert.equal(record.authority_id,'british-horseracing-authority');
assert.equal(record.racing_system_id,'united-kingdom-bha-system');
assert.equal(record.capability_rank,'C');
assert.equal(record.first_race_time_local,null);
assert.equal(record.acquisition_completion.disposition,'complete_current_best_available');
assert.equal(record.acquisition_completion.observed_rank,'C');
assert.equal(record.acquisition_completion.technical_capability_rank,'C');
assert.equal(record.acquisition_completion.higher_rank_open,false);
assert.deepEqual(validateCalendarAuthorityMetadataV1({
  acquisition_attempt:record.acquisition_attempt,
  acquisition_completion:record.acquisition_completion,
  evidence_support:record.evidence_support,
}),[]);

console.log('UNITED_KINGDOM_BHA_ADAPTER: pass');
