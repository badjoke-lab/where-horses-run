import fs from 'node:fs';

const file = 'docs/country-pages/98-country-tracker.tsv';
const lines = fs.readFileSync(file, 'utf8').trimEnd().split(/\r?\n/);
const headers = lines[0].split('\t');
const targets = new Set(['13','14','15','16','17','18','19','20']);
const rows = lines.slice(1).map((line) => {
  const values = line.split('\t');
  while (values.length < headers.length) values.push('');
  const row = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
  if (targets.has(row.delivery_no)) {
    row.programme_status = 'published';
    row.en_route_status = 'published';
    row.ja_route_status = 'published';
    row.qa_status = 'passed';
    row.page_published_at = '2026-06-18';
    row.remarks = 'Published after bilingual route and public-boundary QA.';
  }
  return headers.map((header) => row[header] ?? '').join('\t');
});
fs.writeFileSync(file, `${lines[0]}\n${rows.join('\n')}\n`);
