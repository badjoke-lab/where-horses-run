import fs from 'node:fs';

const file = 'docs/country-pages/98-country-tracker.tsv';
const lines = fs.readFileSync(file, 'utf8').trimEnd().split(/\r?\n/);
const headers = lines[0].split('\t');
const targetRows = new Set(['01','02','03','04','05','06','07','08','09','10','11','12']);
const result = lines.slice(1).map((line) => {
  const values = line.split('\t');
  while (values.length < headers.length) values.push('');
  const row = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
  if (targetRows.has(row.delivery_no)) {
    Object.assign(row, {
      programme_status: 'page_qa',
      profile_status: 'reviewed',
      en_route_status: 'complete',
      ja_route_status: 'complete',
      qa_status: 'passed',
      page_published_at: ''
    });
    row.remarks = 'Bilingual route, metadata, responsive, accessibility, and public-boundary QA passed.';
  }
  return headers.map((header) => row[header] ?? '').join('\t');
});
fs.writeFileSync(file, `${lines[0]}\n${result.join('\n')}\n`);
