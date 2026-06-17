import fs from 'node:fs';

const profileFiles = [
  'data/static/country-profiles-v2-05-chile.json',
  'data/static/country-profiles-v2-06-peru.json',
  'data/static/country-profiles-v2-07-mexico.json',
  'data/static/country-profiles-v2-08-brazil.json'
];
for (const file of profileFiles) {
  const profiles = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const profile of profiles) profile.last_reviewed = '2026-06-17';
  fs.writeFileSync(file, `${JSON.stringify(profiles, null, 2)}\n`);
}

const trackerPath = 'docs/country-pages/98-country-tracker.tsv';
const lines = fs.readFileSync(trackerPath, 'utf8').trimEnd().split(/\r?\n/);
const headers = lines[0].split('\t');
const output = lines.slice(1).map((line) => {
  const values = line.split('\t');
  while (values.length < headers.length) values.push('');
  const row = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
  if (['05', '06', '07', '08'].includes(row.delivery_no)) row.profile_last_reviewed = '2026-06-17';
  return headers.map((header) => row[header] ?? '').join('\t');
});
fs.writeFileSync(trackerPath, `${lines[0]}\n${output.join('\n')}\n`);

console.log('PR_290_DATES_NORMALIZED');
