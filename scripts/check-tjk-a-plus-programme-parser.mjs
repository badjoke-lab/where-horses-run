import assert from 'node:assert/strict';
import { deriveBestAvailableRank } from './timetable/best-available-rank.mjs';
import { detectRaceSchedule } from './timetable/tjk-current-future-candidates.mjs';

const html = `
<div>
  <div>1. Koşu 14.30 SATIŞ 2 , 3 Yaşlı İngilizler, 58.00 kg 1400 Çim</div>
  <div>2. Koşu 15.00 CAPRICE KOŞUSU ŞARTLI 1/Dişi , 2 Yaşlı İngilizler, 57.00 kg 1200 Çim</div>
  <div>3. Koşu 15.30 Handikap 15/H2 , 4 ve Yukarı İngilizler, 1800 Kum</div>
  <div>4. Koşu 16.00 ŞARTLI 3 , 3 ve Yukarı İngilizler, 1400 Sentetik</div>
</div>`;

const detected = detectRaceSchedule(html);
assert.deepEqual(detected.conflicts, []);
assert.equal(detected.contiguous, true);
assert.equal(detected.schedule.length, 4);
assert.deepEqual(detected.schedule[0], {
  race_number: 1,
  label: 'Race 1',
  post_time_local: '14:30',
  race_name: 'SATIŞ 2',
  distance_m: 1400,
  surface: 'Turf',
  course_label: 'Turf',
});
assert.equal(detected.schedule[1].race_name, 'CAPRICE KOŞUSU ŞARTLI 1/Dişi');
assert.equal(detected.schedule[1].distance_m, 1200);
assert.equal(detected.schedule[2].surface, 'Dirt');
assert.equal(detected.schedule[3].surface, 'Synthetic');

const first = detected.schedule[0].post_time_local;
const last = detected.schedule.at(-1).post_time_local;
assert.equal(deriveBestAvailableRank({
  first_race_time_local: first,
  last_race_time_local: last,
  timetable_rows: detected.schedule,
}), 'A+');

const incomplete = detectRaceSchedule(`
<div>1. Koşu 14.30 SATIŞ 2 , 3 Yaşlı İngilizler, 58.00 kg</div>
<div>2. Koşu 15.00 ŞARTLI 3 , 3 Yaşlı İngilizler, 57.00 kg 1200 Çim</div>`);
assert.equal(incomplete.schedule.length, 2);
assert.equal(incomplete.schedule[0].distance_m, null);
assert.equal(deriveBestAvailableRank({
  first_race_time_local: incomplete.schedule[0].post_time_local,
  last_race_time_local: incomplete.schedule.at(-1).post_time_local,
  timetable_rows: incomplete.schedule,
}), 'A', 'missing A+ metadata must preserve A rather than fabricate A+');

console.log(JSON.stringify({
  ok: true,
  full_metadata_rank: 'A+',
  partial_metadata_rank: 'A',
  surfaces_checked: ['Turf', 'Dirt', 'Synthetic'],
}, null, 2));
