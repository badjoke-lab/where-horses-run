import assert from 'node:assert/strict';
import {
 NJ_EXPECTED_TURF_DATES,NJ_RACECOURSE_ID,
 parseMeadowlandsTurfMonth,assertMeadowlandsTurfSeason,buildNjTurfCandidate
} from './timetable/us-nj-meadowlands-turf-core.mjs';
const labels={9:'September',10:'October'};
function sample(month){
  const dates=NJ_EXPECTED_TURF_DATES.filter(d=>Number(d.slice(5,7))===month);
  return '<html><body>Events Monmouth Park @ Meadowlands Turf Meet '+
    dates.map(d=>'<div>Recurring Live Turf Racing '+labels[month]+' '+Number(d.slice(8))+
    ' @ 7:00 PM - 10:00 PM EDT Monmouth Park @ Meadowlands Turf Meet</div>').join(' ')+
    '<div>Harness racing at Meadowlands September 11 @ 6:20 PM</div>'+
    '</body></html>';
}
const sep=parseMeadowlandsTurfMonth(sample(9),9,'https://playmeadowlands.com/events/month/2026-09/');
const oct=parseMeadowlandsTurfMonth(sample(10),10,'https://playmeadowlands.com/events/month/2026-10/');
assert.equal(sep.length,4);assert.equal(oct.length,5);
assert.deepEqual(assertMeadowlandsTurfSeason([...sep,...oct]),NJ_EXPECTED_TURF_DATES);
assert.ok([...sep,...oct].every(r=>r.racecourse_id===NJ_RACECOURSE_ID&&r.racing_type==='thoroughbred-flat'));
assert.deepEqual([...sep,...oct].filter(r=>r.date>='2026-10-12').map(r=>r.date),['2026-10-16']);
const example=buildNjTurfCandidate(oct.at(-1),'2026-10-11T00:00:00Z');
assert.equal(example.capability_rank,'C');assert.equal(example.first_race_time_local,null);
assert.equal(example.racing_type,'thoroughbred-flat');assert.equal(example.timetable_rows.length,0);
assert.throws(()=>assertMeadowlandsTurfSeason(sep));
assert.throws(()=>parseMeadowlandsTurfMonth('<html>Harness racing only</html>',10,'test'));
console.log('US_NJ_MEADOWLANDS_TURF_CONTRACT: pass (nine date C boundary)');
