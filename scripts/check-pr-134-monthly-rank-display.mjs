import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function fail(message) {
  console.error(`[pr-134-monthly-rank-display] ${message}`);
  process.exit(1);
}

function read(relativePath) {
  const filePath = path.join(root, relativePath);
  if (!fs.existsSync(filePath)) fail(`Missing file: ${relativePath}`);
  return fs.readFileSync(filePath, 'utf8');
}

const component = read('src/components/CurrentTimetableRecords.astro');
const notes = read('PR-134.md');

const requiredComponentSnippets = [
  "const rankLabels = new Set(['A', 'B+', 'B', 'C'])",
  'function timeLabelFor(record)',
  'function raceCountLabelFor(record)',
  'function detailsLabelFor(record)',
  'Time unknown',
  'First ${firstRaceTime}',
  '${firstRaceTime}–${lastRaceTime}',
  'View meeting',
  'Source',
  'Monthly listings stay at one row per meeting',
  'A-rank records are not expanded into race-by-race rows here'
];

for (const snippet of requiredComponentSnippets) {
  if (!component.includes(snippet)) fail(`Component missing required snippet: ${snippet}`);
}

if (component.includes('<h4>All race times</h4>')) fail('Monthly component must not render an All race times section.');
if (component.includes('record.all_race_times.map')) fail('Monthly component must not map all_race_times into monthly rows.');

const requiredNoteSnippets = [
  'C: `Time unknown`',
  'B: `First 10:05`',
  'B+: `10:05–16:30`',
  'A: `10:05–16:30`',
  'not a meeting end time'
];

for (const snippet of requiredNoteSnippets) {
  if (!notes.includes(snippet)) fail(`PR note missing required snippet: ${snippet}`);
}

console.log('[pr-134-monthly-rank-display] PASS');
