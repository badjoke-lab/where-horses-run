import assert from 'node:assert/strict';
import { validateCalendarAuthorityMetadataV1 } from './timetable/calendar-authority-metadata.mjs';
import { buildFinlandMeetingRecord, parseFinlandCalendarHtml, resolveFinlandRacecourse } from './timetable/finland-hippos-core.mjs';

assert.equal(resolveFinlandRacecourse('Helsinki, Vermo').racecourse_id,'finland--vermo');
assert.equal(resolveFinlandRacecourse('Tampere, Teivo').racecourse_id,'finland--tampere');
assert.equal(resolveFinlandRacecourse('Oulu, Äimärautio').racecourse_id,'finland--oulu');

const html=`<html><body><h2>Kilpailutiedot</h2><p>Ravitapahtumia yhteensä 444 kpl</p><table>
<tr><th>Pvm.</th><th>Klo</th><th>Rata</th><th>Tyyppi</th></tr>
<tr><td>pe 25.9.2026</td><td>18:00</td><td>Turku, Metsämäki</td><td>Toto5</td></tr>
<tr><td>la 26.9.2026</td><td>13:00</td><td>Tampere, Teivo</td><td>Toto75</td></tr>
<tr><td>su 27.9.2026</td><td>PERUTTU</td><td>Lahti, Jokimaa, KILPAILUT PERUTTU</td><td>Toto4</td></tr>
<tr><td>ma 28.9.2026</td><td>18:00</td><td>Paikallisravit, Testipaikka</td><td>Paikallisravit</td></tr>
</table></body></html>`;
const parsed=parseFinlandCalendarHtml(html,{sourceUrl:'https://example.test/calendar'});
assert.equal(parsed.records.length,2);
assert.equal(parsed.cancelled.length,1);
assert.equal(parsed.unknown_venues.length,1);
assert.deepEqual(parsed.records.map(x=>[x.date,x.racecourse_id]),[
 ['2026-09-25','finland--turku'],['2026-09-26','finland--tampere']
]);
const rec=buildFinlandMeetingRecord(parsed.records[0],{checkedAt:'2026-09-25T00:00:00Z'});
assert.equal(rec.capability_rank,'C');
assert.equal(rec.first_race_time_local,null);
assert.equal(rec.detail_observation.published_meeting_time_local,'18:00');
assert.deepEqual(validateCalendarAuthorityMetadataV1({acquisition_attempt:rec.acquisition_attempt,acquisition_completion:rec.acquisition_completion,evidence_support:rec.evidence_support}),[]);
console.log('FINLAND_HIPPOS_ADAPTER: pass');
