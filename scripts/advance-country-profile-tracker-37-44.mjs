import fs from 'node:fs';

const file = 'docs/country-pages/98-country-tracker.tsv';
const lines = fs.readFileSync(file, 'utf8').trimEnd().split(/\r?\n/);
const headers = lines[0].split('\t');
const index = Object.fromEntries(headers.map((name, position) => [name, position]));
const remarks = {
  '37': 'Reviewed profile v2 completed; publication QA remains.',
  '38': 'Reviewed RBSC-scoped profile completed; wider country coverage remains unresolved.',
  '39': 'Reviewed PHILRACOM calendar profile completed; publication QA remains.',
  '40': 'Reviewed regulator and organiser profile completed; publication QA remains.',
  '41': 'Reviewed Palermo-scoped profile completed; wider racecourse coverage remains incomplete.',
  '42': 'Reviewed Deutscher Galopp profile completed; other horse-racing codes remain unreviewed.',
  '43': 'Reviewed MASAF trot and gallop profile completed; publication QA remains.',
  '44': 'Reviewed gallop-scoped profile completed; wider horse-racing code coverage remains incomplete.'
};

const output = [lines[0]];
for (const line of lines.slice(1)) {
  const row = line.split('\t');
  if (remarks[row[index.delivery_no]]) {
    row[index.programme_status] = 'profile_ready';
    row[index.profile_status] = 'reviewed';
    row[index.en_route_status] = 'complete';
    row[index.ja_route_status] = 'complete';
    row[index.qa_status] = 'not_started';
    row[index.profile_last_reviewed] = '2026-06-20';
    row[index.page_published_at] = '';
    row[index.remarks] = remarks[row[index.delivery_no]];
  }
  output.push(row.join('\t'));
}
fs.writeFileSync(file, `${output.join('\n')}\n`);
console.log('COUNTRY_PROFILE_TRACKER_37_44_UPDATED');
