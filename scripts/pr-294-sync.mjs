import fs from 'node:fs';
const file = 'docs/country-pages/98-country-tracker.tsv';
const lines = fs.readFileSync(file, 'utf8').trimEnd().split(/\r?\n/);
const headers = lines[0].split('\t');
const targets = new Map([
  ['13','japan'],['14','hong-kong'],['15','new-zealand'],['16','south-africa'],
  ['17','uruguay'],['18','sweden'],['19','denmark'],['20','czech-republic']
]);
const rows = lines.slice(1).map((line) => {
  const values = line.split('\t');
  while (values.length < headers.length) values.push('');
  const row = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
  const slug = targets.get(row.delivery_no);
  if (slug) {
    row.note_status = 'reviewed';
    row.note_ref = `docs/country-page-notes/${row.delivery_no}-${slug}.md`;
    row.evidence_reviewed_at = '2026-06-17';
    if (Number(row.delivery_no) >= 15) row.programme_status = 'note_reviewed';
    row.remarks = 'Reviewed country note complete; next production stage remains.';
  }
  return headers.map((header) => row[header] ?? '').join('\t');
});
fs.writeFileSync(file, `${lines[0]}\n${rows.join('\n')}\n`);
