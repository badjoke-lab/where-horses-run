import assert from 'node:assert/strict';
import {parseBtcWinterFixtures2026,buildBtcCMeeting,BTC_VENUE} from './timetable/india-bangalore-winter-2026-core.mjs';
const all=[
'2026-11-01','2026-11-08','2026-11-13','2026-11-20','2026-11-27','2026-11-28',
'2026-12-04','2026-12-11','2026-12-12','2026-12-18','2026-12-25',
'2027-01-02','2027-01-08','2027-01-09','2027-01-15','2027-01-25',
'2027-01-26','2027-02-05','2027-02-12','2027-02-13','2027-02-19',
'2027-02-27','2027-03-12','2027-03-13'];
assert.equal(all.length,24);
const ordinal=i=>i%100>=11&&i%100<=13?'th':({1:'st',2:'nd',3:'rd'}[i%10]||'th');
const mock='<h5>Fixtures for Bangalore Winter Meeting 2026-27</h5><table><tr><th>Day</th><th>Date</th><th>Featured Events</th></tr>'+
 all.map((d,i)=>'<tr><td>'+(i+1)+ordinal(i+1)+' Day</td><td>'+d+'</td><td>No copy</td></tr>').join('')+
 '</table><p>DISCLAIMER</p>';
const rows=parseBtcWinterFixtures2026(mock);
assert.deepEqual(rows.map(x=>x.date),all);
assert.ok(rows.every(x=>x.racecourse_id===BTC_VENUE));
const meeting=buildBtcCMeeting(rows[0],{checkedAt:'2026-10-25T00:00:00Z'});
assert.equal(meeting.capability_rank,'C');
assert.equal(meeting.first_race_time_local,null);
assert.equal(meeting.last_race_time_local,null);
assert.deepEqual(meeting.timetable_rows,[]);
assert.equal(meeting.review_status,'needs_review');
assert.throws(()=>parseBtcWinterFixtures2026(mock.replace('2026-11-08','2026-11-01')),/duplicate or out of order/);
assert.throws(()=>parseBtcWinterFixtures2026(mock.replace('2027-03-13','2027-03-14')),/horizon|outside source season/);
assert.throws(()=>parseBtcWinterFixtures2026(mock.replace('2026-11-13','2026-11-44')),/invalid fixture date/);
assert.throws(()=>parseBtcWinterFixtures2026(mock.replace('2026-27','2027-28')),/heading missing/);
assert.throws(()=>parseBtcWinterFixtures2026(mock.replace(/<tr><td>24th Day[\s\S]*?<\/tr>/,' ')),/denominator drift/);
console.log('INDIA_BANGALORE_CORE_PASS official winter 2026-27 fixed-venue 24-date C-only candidate');
