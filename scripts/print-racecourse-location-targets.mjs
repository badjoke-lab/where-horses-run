import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

const sourceFiles = [
  'data/static/racecourses.json',
  'data/static/racecourses-extensions.json',
  'data/static/racecourses-public-timetable-identities-v1.json',
  'data/static/country-page-racecourses-01-04.json',
  'data/static/country-page-racecourses-11-oman.json',
  'data/static/country-page-racecourses-12-zimbabwe.json',
];

const records = sourceFiles.flatMap((relativePath) => {
  const parsed = JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
  if (!Array.isArray(parsed)) throw new Error(`${relativePath} must contain an array`);
  return parsed.map((record) => ({ ...record, __source_file: relativePath }));
});

const seen = new Set();
const rows = [];
for (const record of records) {
  if (typeof record.id !== 'string' || record.id.trim() === '') {
    throw new Error(`${record.__source_file}: record missing id`);
  }
  if (seen.has(record.id)) throw new Error(`duplicate canonical racecourse id: ${record.id}`);
  seen.add(record.id);
  rows.push({
    id: record.id,
    name_en: record.name_en ?? '',
    country_id: record.country_id ?? '',
    source_file: record.__source_file,
  });
}

rows.sort((a, b) => a.id.localeCompare(b.id, 'en'));

console.log('MAP-002 canonical racecourse location targets');
console.log(`count: ${rows.length}`);
for (const row of rows) {
  console.log(`${row.id} | ${row.name_en} | ${row.country_id} | ${row.source_file}`);
}

if (rows.length !== 41) {
  throw new Error(`expected 41 current public racecourses, got ${rows.length}`);
}
