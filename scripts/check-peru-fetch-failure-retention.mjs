import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync('scripts/timetable/run-peru-monterrico-official-window.mjs','utf8');
assert.doesNotMatch(source,/successfulDateRequests===0\) throw new Error/, 'Peru total date API failure must not abort unified refresh');
assert.match(source,/status:'network_error'/, 'Peru total date API failure must be explicit acquisition failure');
assert.match(source,/coverage_claim:successfulDateRequests===0\?'fetch_failed'/, 'Peru failed window must not claim source coverage');
assert.match(source,/records=\[\], dates=\[\], errors=\[\]/, 'Peru failed discovery starts with zero replacement observations');
console.log('PERU_FETCH_FAILURE_RETENTION: pass');
