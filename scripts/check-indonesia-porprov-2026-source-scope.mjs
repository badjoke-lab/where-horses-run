import assert from 'node:assert/strict';
import { parseBerkudaPacuEventWindow } from './timetable/indonesia-porprov-2026-source-core.mjs';

const valid = '<h2>Jadwal Berkuda Pacu</h2><p>07 Nov 2026 - 08 Nov 2026</p><p>Berkuda Pacu</p><p>Venue: Pacuan Kuda Legok Jawa</p>';
const p = parseBerkudaPacuEventWindow(valid);
assert.equal(p.sourceScopeConfirmed, true);
assert.deepEqual(p.eventWindowDates, ['2026-11-07','2026-11-08']);
assert.equal(p.publicationReady, false);
assert.deepEqual(p.meetingRecords, []);

const falseCases = [
  '<div>07 Nov 2026 - 08 Nov 2026 Venue: Pacuan Kuda Legok Jawa</div>',
  '<div>Jadwal Berkuda Pacu</div><p>07 Nov 2026 - 08 Nov 2026</p><p>Venue: Lapang Lain</p>',
  '<div>Jadwal Berkuda Pacu</div><p>07 Nov 2026 - 08 Nov 2026</p><p>'.concat('Other announcements '.repeat(45), 'Venue: Pacuan Kuda Legok Jawa</p>'),
  '<h2>Jadwal Berkuda Pacu</h2><p>07 Nov 2026 - 09 Nov 2026 Venue: Pacuan Kuda Legok Jawa</p>',
  '<h2>Jadwal Berkuda</h2><p>07 Nov 2026 - 08 Nov 2026 Venue: Pacuan Kuda Legok Jawa</p>',
];
for (const [i, html] of falseCases.entries()) {
  assert.equal(parseBerkudaPacuEventWindow(html).sourceScopeConfirmed, false, 'false-positive scenario ' + (i+1));
}
console.log('INDONESIA_PORPROV_SOURCE_SCOPE_PASS positive=1 negative=5 meeting_records=0');
