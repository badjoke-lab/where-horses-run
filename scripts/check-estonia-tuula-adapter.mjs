import assert from 'node:assert/strict';
import { buildEstoniaMeetingRecord, parseEstoniaAnnualCalendar } from './timetable/estonia-tuula-core.mjs';

const html = '<html><body><h1>2026. aasta ürituste kalender</h1>' +
  '<section><h4>Traavivõistlused</h4><p>19.09.2026</p></section>' +
  '<section><h4>Baby Race 2026 poolfinaal</h4><p>03.10.2026</p></section>' +
  '<section><h4>Baby Race 2026 finaal</h4><p>17.10.2026</p></section>' +
  '<section><h4>Avatud talude päev / traavivõistluseid ei toimu</h4><p>26.07.2026</p></section>' +
  '</body></html>';

const rows = parseEstoniaAnnualCalendar(html);
assert.deepEqual(rows.map((row) => row.date), ['2026-09-19', '2026-10-03', '2026-10-17']);
assert.equal(rows.some((row) => row.date === '2026-07-26'), false);

const record = buildEstoniaMeetingRecord(rows[1], { checkedAt: '2026-09-27T00:00:00Z' });
assert.equal(record.country_id, 'estonia');
assert.equal(record.authority_id, 'estonian-trotting-union');
assert.equal(record.racing_system_id, 'tuula-trotting-system');
assert.equal(record.racecourse_id, 'estonia--tuula-hipodroom');
assert.equal(record.capability_rank, 'C');
assert.equal(record.first_race_time_local, null);
assert.equal(record.last_race_time_local, null);
assert.equal(record.acquisition_completion.disposition, 'not_applicable');

console.log('ESTONIA_TUULA_ADAPTER: pass');
