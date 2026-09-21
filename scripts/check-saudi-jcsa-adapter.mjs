import assert from 'node:assert/strict';
import { validateCalendarAuthorityMetadataV1 } from './timetable/calendar-authority-metadata.mjs';
import {
  buildJcsaMeetingRecord,
  parseJcsaRacePage,
  parseJcsaVenueSeason,
  resolveJcsaVenueForDate,
} from './timetable/saudi-jcsa-core.mjs';

const taifHtml='<html><body><h1>King Khalid Racecourse, Taif</h1><p>Taif Racing Season 2026 runs from 24 July to 26 September 2026</p></body></html>';
const riyadhHtml='<html><body><h1>King Abdulaziz Racecourse, Riyadh</h1><p>The 2026–2027 Riyadh Racing Season runs from 16 October 2026 to 17 April 2027</p></body></html>';
const taif=parseJcsaVenueSeason(taifHtml,{venueKey:'taif'});
const riyadh=parseJcsaVenueSeason(riyadhHtml,{venueKey:'riyadh'});
assert.equal(taif.start_date,'2026-07-24');
assert.equal(taif.end_date,'2026-09-26');
assert.equal(riyadh.start_date,'2026-10-16');
assert.equal(riyadh.end_date,'2027-04-17');
assert.equal(resolveJcsaVenueForDate('2026-09-25',[taif,riyadh]).racecourse_id,'king-khalid-racecourse');
assert.equal(resolveJcsaVenueForDate('2026-10-16',[taif,riyadh]).racecourse_id,'king-abdulaziz-racecourse');
assert.equal(resolveJcsaVenueForDate('2026-10-01',[taif,riyadh]),null);

const raceHtml='<html><body><p>Season 1447 · Meeting 13</p><h1>King Khalid Racecourse Championship Prep Race Meeting 13</h1><p>Friday, 4th September 2026</p><div>Results R1 Local Bred Handicap 0-65 04:30pm SAR 75,000</div><div>Results R2 Special Maiden 05:00pm SAR 45,000</div><div>Results R3 Arabian Horses 05:30pm SAR 45,000</div></body></html>';
const parsed=parseJcsaRacePage(raceHtml,{expectedDate:'2026-09-04',venue:taif});
assert.equal(parsed.status,'present');
assert.equal(parsed.meeting_no,13);
assert.equal(parsed.timetable_rows.length,3);
assert.equal(parsed.timetable_rows[0].post_time_local,'16:30');
assert.equal(parsed.timetable_rows[2].post_time_local,'17:30');

const record=buildJcsaMeetingRecord({date:'2026-09-04',venue:taif,raceHtml,checkedAt:'2026-09-21T12:00:00Z'});
assert.equal(record.country_id,'saudi-arabia');
assert.equal(record.capability_rank,'A');
assert.equal(record.acquisition_completion.disposition,'complete_current_best_available');
assert.deepEqual(validateCalendarAuthorityMetadataV1({acquisition_attempt:record.acquisition_attempt,evidence_support:record.evidence_support},record.meeting_id),[]);

const pendingHtml='<html><body><p>Season 1447 · Meeting 19</p><h1>King Faisal Cup Race Meeting 19</h1><p>Friday, 25th September 2026</p></body></html>';
const pending=buildJcsaMeetingRecord({date:'2026-09-25',venue:taif,raceHtml:pendingHtml,checkedAt:'2026-09-21T12:00:00Z'});
assert.equal(pending.capability_rank,'C');
assert.equal(pending.acquisition_completion.disposition,'pending_publication');

assert.equal(parseJcsaRacePage('<html><body>No meeting available</body></html>',{expectedDate:'2026-09-25',venue:taif}).status,'absent_unconfirmed');
console.log('SAUDI_JCSA_ADAPTER: pass');
