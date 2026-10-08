import assert from 'node:assert/strict';
import fs from 'node:fs';

const workflows = [
  ['unified', '.github/workflows/calendar-unified-official-refresh.yml', 'unified-smoke'],
  ['near', '.github/workflows/calendar-near-official-refresh.yml', 'near-smoke'],
];

for (const [label, path, smokeGroup] of workflows) {
  const text = fs.readFileSync(path, 'utf8');
  assert.match(text, /stage_remaining_state\(\)\s*\{/, label + ': stage_remaining_state helper missing');
  assert.match(text, /wait_for_main_quiet\(\)\s*\{/, label + ': wait_for_main_quiet helper missing');
  assert.match(text, /required_stable_seconds=600/, label + ': 10-minute main quiet gate missing');
  assert.match(text, /max_wait_seconds=1800/, label + ': bounded quiet wait missing');
  assert.match(text, /max_attempts=5/, label + ': persistence retry budget missing');
  assert.match(text, /calendar-unified-family-\$\{\{ github\.event_name == 'pull_request'/, label + ': shared production concurrency family missing');
  assert.ok(text.includes("'" + smokeGroup + "' || 'production'"), label + ': expected smoke/production concurrency split missing');
  assert.match(text, /Rolling-state persistence exhausted \$max_attempts bounded candidate attempts/, label + ': terminal persistence guard missing');
}
const near = fs.readFileSync('.github/workflows/calendar-near-official-refresh.yml', 'utf8');
assert.match(near, /pull_request:\s*\n\s+paths:/, 'near: pull_request smoke trigger missing');

console.log('CALENDAR_PERSISTENCE_CONTENTION_CONTRACT: pass');
