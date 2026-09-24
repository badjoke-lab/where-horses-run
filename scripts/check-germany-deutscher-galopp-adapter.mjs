import assert from 'node:assert/strict';
import { validateCalendarAuthorityMetadataV1 } from './timetable/calendar-authority-metadata.mjs';
import {
  buildGermanyMeetingRecord,
  parseGermanyAnnualCalendarText,
  parseGermanyCalendarHtml,
  resolveGermanyRacecourseId,
} from './timetable/germany-deutscher-galopp-core.mjs';

const pdfText=`RENNTERMINE 2026
September Sa. 26.09. Dresden
So. 27.09. Köln Mehl Mülhens Stiftung Preis von Europa I 3+ 2400 m
Mannheim
Oktober Fr. 02.10. Honzrath
Sa. 03.10. Hoppegarten WETTSTAR.de Preis der Deutschen Einheit III 3+ 2000 m
So. 04.10. Düsseldorf Grosser Preis der Landeshauptstadt Düsseldorf III 3+ 1700 m
Sa. 10.10. Mülheim Silbernes Band der Ruhr L 3+ 3300 m
So. 11.10. Köln WETTSTAR.de Preis des Winterfavoriten III 2 1600 m
Fr. 16.10. Baden-Baden Auktionsrennen 2j. 1400 m
Sa. 17.10. Leipzig
So. 18.10. Baden-Baden Preis der Winterkönigin III 2 S. 1600 m
Sa. 24.10. München Großer Münchener Herbstpreis L 3+ 1300 m
`;
const annual=parseGermanyAnnualCalendarText(pdfText,{sourceUrl:'https://example.test/renntermine2026.pdf'});
assert.deepEqual(annual.records.slice(0,4).map(x=>[x.date,x.racecourse_id]),[
 ['2026-09-26','germany--dresden'],
 ['2026-09-27','germany--koln'],
 ['2026-09-27','germany--mannheim'],
 ['2026-10-02','germany--honzrath'],
]);
assert.equal(resolveGermanyRacecourseId('Köln'),'germany--koln');
assert.equal(resolveGermanyRacecourseId('Berlin-Hoppegarten'),'germany--hoppegarten');

const html=`<html><body><h1>Renntermine</h1><table>
<tr><th>Datum</th><th>Ort</th><th>RNr.</th><th>Renntitel</th><th>Start</th><th>Distanz</th><th>Kategorie</th><th>Preisgeld</th><th>Starter</th><th>Status</th></tr>
<tr><td>26.09.26</td><td>Dresden</td><td>1</td><td>Preis 1</td><td>13:00</td><td>2.000 m</td><td></td><td>9.000 €</td><td>12</td><td>Endg. Starterfeld</td></tr>
<tr><td>26.09.26</td><td>Dresden</td><td>2</td><td>Preis 2</td><td>13:35</td><td>1.200 m</td><td></td><td>5.000 €</td><td>5</td><td>Endg. Starterfeld</td></tr>
<tr><td>26.09.26</td><td>Dresden</td><td>3</td><td>Preis 3</td><td>14:10</td><td>1.900 m</td><td></td><td>5.000 €</td><td>7</td><td>Endg. Starterfeld</td></tr>
<tr><td>27.09.26</td><td>Mannheim</td><td>1</td><td>1. Rennen</td><td>-</td><td>1.400 m</td><td></td><td>5.000 €</td><td>8</td><td>Vorl. Starterfeld</td></tr>
</table></body></html>`;
const parsed=parseGermanyCalendarHtml(html,{sourceUrl:'https://example.test/calendar'});
assert.equal(parsed.parse_failures.length,0);
assert.equal(parsed.race_rows.length,4);
assert.equal(parsed.race_rows[0].distance_m,2000);
assert.equal(parsed.race_rows[3].post_time_local,null);

const checkedAt='2026-09-24T00:00:00Z';
const dresdenSchedule=annual.records.find(x=>x.racecourse_id==='germany--dresden');
const dresden=buildGermanyMeetingRecord(dresdenSchedule,parsed.race_rows.filter(x=>x.racecourse_id==='germany--dresden'),{checkedAt});
assert.equal(dresden.capability_rank,'A');
assert.equal(dresden.first_race_time_local,'13:00');
assert.equal(dresden.last_race_time_local,'14:10');
assert.equal(dresden.acquisition_completion.disposition,'complete_current_best_available');

const mannheimSchedule=annual.records.find(x=>x.racecourse_id==='germany--mannheim');
const mannheim=buildGermanyMeetingRecord(mannheimSchedule,parsed.race_rows.filter(x=>x.racecourse_id==='germany--mannheim'),{checkedAt});
assert.equal(mannheim.capability_rank,'C');
assert.equal(mannheim.acquisition_completion.disposition,'pending_publication');
assert.deepEqual(validateCalendarAuthorityMetadataV1({acquisition_attempt:dresden.acquisition_attempt,acquisition_completion:dresden.acquisition_completion,evidence_support:dresden.evidence_support}),[]);

console.log('GERMANY_DEUTSCHER_GALOPP_ADAPTER: pass');
