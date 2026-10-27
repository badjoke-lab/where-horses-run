import assert from 'node:assert/strict';
import {PORPROV_DAYS,parseKoniDay,parseKoniDiscipline,parseOrganizer,buildC} from './timetable/indonesia-porprov-2026-c-source-core.mjs';
const organizer='<h2>Jadwal Berkuda Pacu</h2><p>07 Nov 2026 - 08 Nov 2026</p><p>Venue: Pacuan Kuda Legok Jawa</p>';
const sports='<h2>Berkuda Pacuan</h2><p>7-8 November Pacuan Kuda Legok Jawa,Kabupaten Pangandaran</p><p>Kelas F 1.000 M</p><p>Kelas Terbuka 2.000 M</p>';
assert.equal(parseOrganizer(organizer).sourceScopeConfirmed,true);
assert.equal(parseKoniDiscipline(sports),true);
const seen=[];
for (const d of PORPROV_DAYS) {
 const page='<h1>'+d.dayName+', '+d.n+' November 2026</h1><h2>Cabor bertanding</h2><p>Berkuda Berkuda Pacuan Pacuan Kuda Legok Jawa,Kabupaten Pangandaran 7-8 November '+d.firstOrLast+'</p>';
 const observation=parseKoniDay(page,d),row=buildC(observation);
 assert.equal(row.capability_rank,'C');
 assert.equal(row.racecourse_id,'indonesia--legokjawa-racecourse');
 assert.equal(row.date,d.date);
 assert.equal(row.timetable_rows.length,0);
 assert.equal(row.first_race_time_local,null);
 seen.push(row.meeting_id);
 assert.throws(()=>parseKoniDay(page.replace('Legok Jawa','Other Place'),d),/fingerprint/);
 assert.throws(()=>parseKoniDay(page.replace('Cabor bertanding','Other').replace('Berkuda Pacuan','Berkuda Equestrian'),d),/fingerprint/);
}
assert.equal(new Set(seen).size,2);
assert.throws(()=>parseKoniDiscipline(sports.replace('Legok Jawa','Other Place')),/fingerprint/);
assert.throws(()=>parseOrganizer(organizer.replace('Berkuda Pacu','Berkuda Equestrian')),/fingerprint/);
console.log('INDONESIA_PORPROV_C_ADAPTER_PASS 2 positive dates, no times, 6 negative drift guards');
