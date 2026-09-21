import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync('scripts/timetable/run-tjk-current-best-available.mjs', 'utf8');
assert.match(source, /try \{\s*annual = await discoverAnnualFixtures/, 'annual discovery must be guarded');
assert.match(source, /status: 'network_error'/, 'annual fetch failure must use acquisition metadata network_error');
assert.match(source, /fixtures: \[\]/, 'failed discovery must emit no replacement observations');
assert.match(source, /error_code: error\?\.name === 'TimeoutError' \? 'timeout' : 'fetch_error'/, 'timeout must be explicit');
assert.doesNotMatch(source, /process\.exit\(1\)/, 'TJK source failure must not terminate the unified refresh');
console.log('TJK_FETCH_FAILURE_RETENTION: pass');
