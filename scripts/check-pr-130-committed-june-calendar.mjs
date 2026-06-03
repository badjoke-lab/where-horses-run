import fs from 'node:fs';

const expectedGroups = [
  ['japan', 'jra'], ['japan', 'nar'], ['japan', 'banei'], ['hong-kong', 'hkjc'],
  ['united-arab-emirates', 'era'], ['united-kingdom', 'bha'], ['united-kingdom', 'point-to-point'],
  ['united-kingdom', 'purebred-arabian'], ['ireland', 'hri'], ['france', 'france-galop'],
  ['france', 'letrot'], ['australia', 'racing-australia-thoroughbred'], ['australia', 'harness-australia'],
  ['new-zealand', 'loveracing-thoroughbred'], ['new-zealand', 'hrnz-harness'], ['canada', 'woodbine-thoroughbred'],
  ['canada', 'standardbred-canada'], ['south-africa', 'nhra'], ['south-africa', '4racing'],
  ['south-africa', 'gold-circle'], ['south-korea', 'kra'], ['singapore', 'singapore-turf-club'],
  ['united-states', 'equibase-thoroughbred'], ['united-states', 'usta-harness'], ['united-states', 'aqha-quarter-horse']
];

const data = JSON.parse(fs.readFileSync('data/generated/timetable/june-2026-calendar.json', 'utf8'));
const covered = new Set();

for (const set of data.record_sets || []) {
  if ((set.meetings || []).length > 0) covered.add(`${set.country_id}::${set.group_id}`);
}
for (const statusRecord of data.coverage_status || []) {
  covered.add(`${statusRecord.country_id}::${statusRecord.group_id}`);
}

const missing = expectedGroups
  .map(([countryId, groupId]) => `${countryId}::${groupId}`)
  .filter((key) => !covered.has(key));

if (missing.length > 0) {
  console.error('[pr-130-committed-june-calendar] committed June calendar is incomplete:');
  for (const key of missing) console.error(`- ${key}`);
  process.exit(1);
}

console.log(`[pr-130-committed-june-calendar] PASS ${covered.size} committed groups/statuses`);
