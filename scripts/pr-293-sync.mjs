import fs from 'node:fs';

const file = 'docs/country-pages/98-country-tracker.tsv';
const lines = fs.readFileSync(file, 'utf8').trimEnd().split(/\r?\n/);
const headers = lines[0].split('\t');
const states = new Map([
  ['13', ['profile_ready', 'remote_partial', 'Existing reviewed seed profile; JRA timetable confirmed, NAR and Banei completion remains system-specific.']],
  ['14', ['profile_ready', 'remote_complete', 'Existing reviewed seed profile; HKJC fixture and timetable source test complete.']],
  ['15', ['source_tested', 'remote_partial', 'Thoroughbred timetable capability confirmed; harness calendar remains a separate system.']],
  ['16', ['source_tested', 'remote_partial', '4Racing and Gold Circle operator routes confirmed; no single national feed claimed.']],
  ['17', ['source_tested', 'remote_complete', 'Official calendar-level date and venue coverage confirmed at rank C.']],
  ['18', ['source_tested', 'remote_complete', 'Svensk Galopp calendar-level date and venue coverage confirmed at rank C.']],
  ['19', ['source_tested', 'remote_partial', 'Official race days and venues confirmed; complete timetable remains pending.']],
  ['20', ['source_tested', 'remote_partial', 'Official dated meetings and venues confirmed; per-race timetable remains pending.']]
]);
const output = lines.slice(1).map((line) => {
  const values = line.split('\t');
  while (values.length < headers.length) values.push('');
  const row = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
  const state = states.get(row.delivery_no);
  if (state) {
    row.programme_status = state[0];
    row.acquisition_status = state[1];
    row.source_last_checked = '2026-06-17';
    row.remarks = state[2];
  }
  return headers.map((header) => row[header] ?? '').join('\t');
});
fs.writeFileSync(file, `${lines[0]}\n${output.join('\n')}\n`);
console.log('PR_293_TRACKER_SYNC_COMPLETE');
