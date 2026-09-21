import assert from 'node:assert/strict';
import {
  detectUaeEraConfirmedNonRunning,
} from './timetable/uae-era-detail-artifact-core.mjs';

const sourceUrl = 'https://emiratesracing.com/racecard/2026-03-04/1/declarations';
const explicit = detectUaeEraConfirmedNonRunning(`
  <html><body>
    <h1>04 Mar 2026</h1>
    <div>Meydan</div>
    <h2>THIS MEETING HAS BEEN CANCELLED</h2>
    <div>TRIAL</div>
  </body></html>
`, { sourceUrl });
assert.equal(explicit.confirmed_non_running, true);
assert.equal(explicit.date, '2026-03-04');
assert.equal(explicit.evidence_phrase, 'THIS MEETING HAS BEEN CANCELLED');

const ordinary = detectUaeEraConfirmedNonRunning(`
  <html><body><h1>04 Mar 2026</h1><div>Meydan</div><div>Race 1</div></body></html>
`, { sourceUrl });
assert.equal(ordinary.confirmed_non_running, false);

const raceOnly = detectUaeEraConfirmedNonRunning(`
  <html><body><div>Race 1 has been cancelled</div></body></html>
`, { sourceUrl });
assert.equal(raceOnly.confirmed_non_running, false, 'race-only cancellation must not suppress the whole meeting');

assert.throws(
  () => detectUaeEraConfirmedNonRunning('<h1>THIS MEETING HAS BEEN CANCELLED</h1>', {
    sourceUrl: 'https://example.com/racecard/2026-03-04/1/declarations',
  }),
  /official emiratesracing.com/,
);

console.log('UAE_ERA_NON_RUNNING_EVIDENCE: pass');
