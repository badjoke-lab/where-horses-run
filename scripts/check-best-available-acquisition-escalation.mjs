import fs from 'node:fs';
import assert from 'node:assert/strict';

const collectors = [
  {
    name: 'Chile',
    runner: 'scripts/timetable/run-chile-teletrak-official-window.mjs',
    required: [/retry_every_refresh_until_a_plus/, /lower_rank_is_terminal:\s*false/, /detail_routes_attempted/, /detail_routes_pending_publication/],
  },
  {
    name: 'Morocco',
    runner: 'scripts/timetable/run-sorec-official-window.mjs',
    required: [/retry_every_refresh_until_a_plus/, /lower_rank_is_terminal:\s*false/, /detail_routes_attempted/, /detail_routes_pending_publication/],
  },
  {
    name: 'Ireland',
    runner: 'scripts/timetable/run-ireland-hri-official-window.mjs',
    required: [/retry_every_refresh_until_a_plus/, /lower_rank_is_terminal:\s*false/, /detail_routes_attempted/, /detail_routes_pending_publication/],
  },
];

for (const collector of collectors) {
  const source = fs.readFileSync(collector.runner, 'utf8');
  assert.match(source, /collection_target_rank:\s*['"]best_available['"]/, `${collector.name}: collector must declare Best Available`);
  for (const pattern of collector.required) assert.match(source, pattern, `${collector.name}: missing acquisition-escalation contract ${pattern}`);
}

const workflow = fs.readFileSync('.github/workflows/calendar-unified-official-refresh.yml', 'utf8');
assert.match(workflow, /check-best-available-acquisition-escalation\.mjs/, 'unified Calendar refresh must enforce the acquisition-escalation contract');

console.log('BEST_AVAILABLE_ACQUISITION_ESCALATION: pass');
