import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync('scripts/timetable/run-kra-official-window.mjs', 'utf8');

assert.match(source, /const DETAIL_CHILD_TIMEOUT_MS = \d[\d_]*;/, 'KRA detail collection must declare a bounded child timeout');
assert.match(source, /timeout:\s*DETAIL_CHILD_TIMEOUT_MS/, 'KRA detail child process must use the bounded timeout');
assert.match(source, /killSignal:\s*'SIGKILL'/, 'KRA detail child process must be force-terminated after the bound');
assert.match(source, /detail_collection:/, 'KRA artifact must expose detail collection diagnostics');

console.log('KRA_WINDOW_BOUNDS: pass');
