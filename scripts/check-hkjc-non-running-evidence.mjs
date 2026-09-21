import assert from 'node:assert/strict';
import { parseHkjcConfirmedNonRunningHtml } from './timetable/hkjc-fixture-artifact-bridge-core.mjs';

const sourceUrl = 'https://racing.hkjc.com/en-us/local/information/fixture?CalMonth=09&CalYear=2026';
const records = parseHkjcConfirmedNonRunningHtml(`
  <html><body>
    <p>The race meeting originally scheduled for Sunday, 20 September 2026 at Sha Tin Racecourse will be cancelled.</p>
  </body></html>
`, { year: 2026, month: 9, sourceUrl });
assert.equal(records.length, 1);
assert.equal(records[0].date, '2026-09-20');
assert.equal(records[0].racecourse_id, 'sha-tin-racecourse');

const raceOnly = parseHkjcConfirmedNonRunningHtml(`
  <html><body><p>Race 4 at Sha Tin has been cancelled.</p></body></html>
`, { year: 2026, month: 9, sourceUrl });
assert.equal(raceOnly.length, 0, 'race-only cancellation must not become whole-meeting non-running evidence');

const wrongMonth = parseHkjcConfirmedNonRunningHtml(`
  <html><body>
    <p>The race meeting originally scheduled for Sunday, 20 September 2026 at Sha Tin Racecourse will be cancelled.</p>
  </body></html>
`, { year: 2026, month: 10, sourceUrl });
assert.equal(wrongMonth.length, 0);

assert.throws(
  () => parseHkjcConfirmedNonRunningHtml('<p>cancelled</p>', {
    year: 2026, month: 9, sourceUrl: 'https://example.com/fixture',
  }),
  /official HKJC/,
);

console.log('HKJC_NON_RUNNING_EVIDENCE: pass');
