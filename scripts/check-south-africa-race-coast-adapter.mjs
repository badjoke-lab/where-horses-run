import assert from 'node:assert/strict';
import { validateCalendarAuthorityMetadataV1 } from './timetable/calendar-authority-metadata.mjs';
import { buildRaceCoastMeetingRecord,parseRaceCoastFixturesHtml,resolveRaceCoastVenue } from './timetable/south-africa-race-coast-core.mjs';

const html=`<html><body><h1>FIXTURES</h1><p>KZN & WC Fixtures</p><table>
<tr><th>Date</th><th>Day</th><th>Venue</th><th>Features</th></tr>
<tr><td>SEPTEMBER</td><td>25</td><td>FRIDAY</td><td>GREY TURF</td><td></td></tr>
<tr><td></td><td>26</td><td>SATURDAY</td><td>DURBANVILLE</td><td>Matchem Stakes</td></tr>
<tr><td>OCTOBER</td><td>2</td><td>FRIDAY</td><td>GREY POLY</td><td></td></tr>
<tr><td></td><td>4</td><td>SUNDAY</td><td>SCOT</td><td></td></tr>
<tr><td></td><td>7</td><td>WEDNESDAY</td><td>KENILWORTH</td><td></td></tr>
</table></body></html>`;
const parsed=parseRaceCoastFixturesHtml(html,{year:2026,sourceUrl:'https://example.test/fixtures'});
assert.equal(parsed.parse_failures.length,0);assert.equal(parsed.records.length,5);
assert.deepEqual(parsed.records.map(x=>[x.date,x.racecourse_id]),[
 ['2026-09-25','south-africa--hollywoodbets-greyville'],
 ['2026-09-26','south-africa--hollywoodbets-durbanville'],
 ['2026-10-02','south-africa--hollywoodbets-greyville'],
 ['2026-10-04','south-africa--hollywoodbets-scottsville'],
 ['2026-10-07','south-africa--hollywoodbets-kenilworth'],
]);
assert.equal(resolveRaceCoastVenue('GREY POLY').course_context,'poly');
const record=buildRaceCoastMeetingRecord(parsed.records[0],{checkedAt:'2026-09-25T00:00:00Z'});
assert.equal(record.country_id,'south-africa');assert.equal(record.authority_id,'race-coast');assert.equal(record.racing_system_id,'south-africa-race-coast-system');assert.equal(record.capability_rank,'C');assert.equal(record.first_race_time_local,null);assert.equal(record.acquisition_completion.disposition,'not_applicable');
assert.deepEqual(validateCalendarAuthorityMetadataV1({acquisition_attempt:record.acquisition_attempt,acquisition_completion:record.acquisition_completion,evidence_support:record.evidence_support}),[]);
console.log('SOUTH_AFRICA_RACE_COAST_ADAPTER: pass');
