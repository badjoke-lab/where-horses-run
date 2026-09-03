import fs from 'node:fs';

const TARGET = 'data/static/racecourses-public-timetable-identities-v1.json';
const AUTHORITATIVE_REGISTRIES = [
  'data/static/racecourses.json',
  'data/static/racecourses-extensions.json',
  'data/static/country-page-racecourses-01-04.json',
  'data/static/country-page-racecourses-11-oman.json',
  'data/static/country-page-racecourses-12-zimbabwe.json',
];

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

const reservedSlugs = new Set();
for (const file of AUTHORITATIVE_REGISTRIES) {
  const records = readJson(file);
  if (!Array.isArray(records)) throw new Error(`Racecourse registry must be an array: ${file}`);
  for (const record of records) {
    if (!record?.id || !record?.slug || record.id !== record.slug) {
      throw new Error(`Invalid racecourse identity in ${file}: ${record?.id ?? '<missing>'} / ${record?.slug ?? '<missing>'}`);
    }
    reservedSlugs.add(record.slug);
  }
}

const target = readJson(TARGET);
const seenTarget = new Set();
const kept = [];
const removed = [];
for (const record of target) {
  if (!record?.id || !record?.slug || record.id !== record.slug) {
    throw new Error(`Invalid public timetable racecourse identity: ${record?.id ?? '<missing>'} / ${record?.slug ?? '<missing>'}`);
  }
  if (reservedSlugs.has(record.slug) || seenTarget.has(record.slug)) {
    removed.push(record.slug);
    continue;
  }
  seenTarget.add(record.slug);
  kept.push(record);
}

fs.writeFileSync(TARGET, `${JSON.stringify(kept, null, 2)}\n`);
console.log(JSON.stringify({ before: target.length, after: kept.length, removed }, null, 2));
