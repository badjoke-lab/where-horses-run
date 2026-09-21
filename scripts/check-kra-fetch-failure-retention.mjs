import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync('scripts/timetable/run-kra-official-window.mjs', 'utf8');
assert.match(source, /try \{\s*planHtml = await fetchKraHtml\(OFFICIAL_PLAN_URL\)/, 'KRA operation-plan fetch must be guarded');
assert.match(source, /completeness: 'fetch_failed'/, 'KRA plan fetch failure must be explicit');
assert.match(source, /status: 'network_error'/, 'KRA plan fetch failure must use acquisition metadata');
assert.match(source, /records: \[\]/, 'failed KRA plan fetch must emit no replacement observations');
assert.match(source, /UND_ERR_CONNECT_TIMEOUT/, 'KRA connect timeout must map to timeout');
console.log('KRA_FETCH_FAILURE_RETENTION: pass');
