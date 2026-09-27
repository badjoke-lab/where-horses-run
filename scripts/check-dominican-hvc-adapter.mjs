import assert from 'node:assert/strict';
import { buildHvcMeetingRecord, parseHvcPanfletosIndex, parseHvcPanfletoText } from './timetable/dominican-hvc-core.mjs';

const index = '<a href="/wp-content/uploads/2026/09/Panfleto-Oficial-Octubre-2026.pdf">Panfleto Oficial Octubre 2026</a>';
const links = parseHvcPanfletosIndex(index);
assert.equal(links.length, 1);
assert.equal(links[0].month, 10);

const text = [
  'LLAMADAS PARA LAS CARRERAS DEL SABADO 03 DE OCTUBRE 2026',
  'LLAMADAS PARA LAS CARRERAS MARTES 06 DE OCTUBRE 2026',
  'LLAMADAS PARA LAS CARRERAS SABADO 24 DE OCTUBRE 2026',
].join(' ');
const rows = parseHvcPanfletoText(text, { sourceUrl: links[0].url });
assert.deepEqual(rows.map((row) => row.date), ['2026-10-03', '2026-10-06', '2026-10-24']);

const record = buildHvcMeetingRecord(rows[0], { checkedAt: '2026-09-27T00:00:00Z' });
assert.equal(record.country_id, 'dominican-republic');
assert.equal(record.authority_id, 'hipodromo-v-centenario');
assert.equal(record.racing_system_id, 'hvc-racing-system');
assert.equal(record.racecourse_id, 'dominican-republic--hipodromo-v-centenario');
assert.equal(record.capability_rank, 'C');
assert.equal(record.first_race_time_local, null);
assert.equal(record.last_race_time_local, null);
assert.deepEqual(record.timetable_rows, []);
assert.equal(record.acquisition_completion.disposition, 'not_applicable');

console.log('DOMINICAN_HVC_ADAPTER: pass');
