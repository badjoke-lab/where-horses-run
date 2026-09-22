import assert from 'node:assert/strict';
import fs from 'node:fs';

const runner = fs.readFileSync('scripts/timetable/run-tjk-current-best-available.mjs', 'utf8');
const workflow = fs.readFileSync('.github/workflows/calendar-unified-official-refresh.yml', 'utf8');

assert.match(runner, /discoverTjkConfirmedNonRunning/, 'TJK runner must invoke bounded official-news discovery');
assert.match(runner, /canonicalTjkMeetingIds/, 'automated TJK non-running evidence must be canonical-bound');
assert.match(runner, /meeting_presence_records:\s*meetingPresenceRecords/, 'TJK artifact must emit meeting presence records');
assert.match(runner, /unmatched_records:\s*unmatchedPresenceRecords/, 'unmatched evidence must remain diagnostic only');
assert.match(runner, /non_running_evidence:/, 'TJK artifact must keep negative-evidence acquisition diagnostics separate');
assert.match(runner, /acquisition_attempt:\s*acquisitionFailure/, 'positive schedule acquisition state must remain separate');
assert.match(workflow, /--artifact=\.calendar-unified\/tjk\.json/, 'TJK artifact must reach meeting-presence publication disposition');
assert.doesNotMatch(runner, /annual\.fixtures[^\n]+confirmed_non_running/, 'annual schedule omission must not infer non-running');

console.log('TJK_NON_RUNNING_RUNNER_INTEGRATION: pass');
