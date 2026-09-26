import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync('scripts/timetable/run-peru-monterrico-official-window.mjs','utf8');
assert.doesNotMatch(source,/successfulDateRequests===0\) throw new Error/, 'Peru total date API failure must not abort unified refresh');
assert.match(source,/status:'network_error'/, 'Peru total date API failure must be explicit acquisition failure');
assert.match(source,/coverage_claim:successfulDateRequests===0\?'fetch_failed'/, 'Peru total date API failure must not claim source coverage');
assert.match(source,/records=\[\], dates=\[\], errors=\[\]/, 'Peru failed discovery starts with zero replacement observations');
assert.match(source,/PERU_MONTERRICO_REUNION_API_PREFIX/, 'Peru detail acquisition must use the official reunion JSON API');
assert.match(source,/for\(let attempt=1;attempt<=3;attempt\+=1\)/, 'Peru official API acquisition must retry transient fetch failures');
assert.doesNotMatch(source,/entryProgrammeLinks\(/, 'non-rendered Programa de Entradas HTML must not be presented as a working production fallback');
console.log('PERU_FETCH_FAILURE_RETENTION: pass');
