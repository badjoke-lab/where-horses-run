import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const write = (file, content) => fs.writeFileSync(path.join(root, file), content);
const replaceOnce = (content, before, after, label) => {
  const count = content.split(before).length - 1;
  if (count !== 1) throw new Error(`${label}: expected one match, found ${count}`);
  return content.replace(before, after);
};

// Advance only delivery entries 01-04 to profile_ready.
{
  const file = 'docs/country-pages/98-country-tracker.tsv';
  const lines = read(file).trimEnd().split(/\r?\n/);
  const headers = lines[0].split('\t');
  const targets = new Set(['01', '02', '03', '04']);
  const updated = lines.slice(1).map((line) => {
    const values = line.split('\t');
    const row = Object.fromEntries(headers.map((key, index) => [key, values[index] ?? '']));
    if (!targets.has(row.delivery_no)) return line;
    row.programme_status = 'profile_ready';
    row.profile_status = 'reviewed';
    row.en_route_status = 'complete';
    row.ja_route_status = 'complete';
    row.qa_status = 'not_started';
    row.profile_last_reviewed = '2026-06-17';
    row.page_published_at = '';
    row.remarks = 'Reviewed profile-v2 and bilingual routes ready; formal QA and publication remain.';
    return headers.map((key) => row[key] ?? '').join('\t');
  });
  write(file, `${lines[0]}\n${updated.join('\n')}\n`);
}

// Materialize the identifiers introduced by this profile batch.
{
  const file = 'data/static/country-page-id-inventory-01-12.json';
  const inventory = JSON.parse(read(file));
  const principalByDelivery = new Map([
    ['01', ['meydan-racecourse']],
    ['02', ['seoul-racecourse']],
    ['03', ['istanbul-racecourse']],
    ['04', ['casablanca-anfa-racecourse']]
  ]);
  for (const country of inventory.countries) {
    if (!principalByDelivery.has(country.delivery_no)) continue;
    country.principal_racecourse_status = 'confirmed';
    country.principal_racecourse_ids = principalByDelivery.get(country.delivery_no);
  }
  const registeredSources = new Set([
    'uae-emirates-racing-calendar',
    'south-korea-kra-home',
    'south-korea-kra-raceday',
    'turkey-tjk-home',
    'turkey-tjk-programme',
    'morocco-faras-programme'
  ]);
  for (const source of inventory.sources) {
    if (registeredSources.has(source.id)) source.registry_status = 'registered';
  }
  const registeredRacecourses = new Set(['istanbul-racecourse', 'casablanca-anfa-racecourse']);
  for (const racecourse of inventory.racecourses) {
    if (registeredRacecourses.has(racecourse.id)) racecourse.registry_status = 'registered';
  }
  write(file, `${JSON.stringify(inventory, null, 2)}\n`);
}

// Make the programme validator derive first-batch status from production v2 profiles.
{
  const file = 'scripts/check-country-page-programme.mjs';
  let content = read(file);
  content = replaceOnce(content,
`for (const [deliveryNo, slug] of expectedFirstBatch) {
  const row = rows.find((entry) => entry.delivery_no === deliveryNo);
  if (!row || row.slug !== slug) fail(\`delivery \${deliveryNo} must be \${slug}\`);
  if (row?.programme_status !== 'note_reviewed') fail(\`delivery \${deliveryNo} must remain note_reviewed until page implementation\`);
}`,
`const productionProfilesPath = path.join(root, 'data/static/country-profiles-v2.json');
const productionProfiles = JSON.parse(fs.readFileSync(productionProfilesPath, 'utf8'));
const productionProfileIds = new Set(productionProfiles.map((profile) => profile.country_id));

for (const [deliveryNo, slug] of expectedFirstBatch) {
  const row = rows.find((entry) => entry.delivery_no === deliveryNo);
  if (!row || row.slug !== slug) fail(\`delivery \${deliveryNo} must be \${slug}\`);
  const hasProductionProfile = productionProfileIds.has(slug);
  const expectedProgrammeStatus = hasProductionProfile ? 'profile_ready' : 'note_reviewed';
  if (row?.programme_status !== expectedProgrammeStatus) {
    fail(\`delivery \${deliveryNo} must be \${expectedProgrammeStatus}; found \${row?.programme_status}\`);
  }
  if (hasProductionProfile) {
    if (row.profile_status !== 'reviewed') fail(\`delivery \${deliveryNo} profile must be reviewed\`);
    if (row.en_route_status !== 'complete' || row.ja_route_status !== 'complete') {
      fail(\`delivery \${deliveryNo} reviewed profile requires complete EN and JA routes\`);
    }
  } else if (row.profile_status !== 'not_started') {
    fail(\`delivery \${deliveryNo} without a production profile must remain not_started\`);
  }
}`,
    'programme first-batch block');
  content = replaceOnce(content,
`if ((statusCounts.published ?? 0) !== 0) fail('initial tracker must not claim any formally published country pages');
if ((statusCounts.note_reviewed ?? 0) !== 12) fail('initial tracker must contain 12 note_reviewed rows');
if ((statusCounts.profile_ready ?? 0) !== 2) fail('initial tracker must contain two profile_ready legacy seeds');
if ((statusCounts.not_started ?? 0) !== 84) fail('initial tracker must contain 84 not_started rows');`,
`const firstBatchProfileCount = expectedFirstBatch.filter(([, slug]) => productionProfileIds.has(slug)).length;
if ((statusCounts.published ?? 0) !== 0) fail('tracker must not claim formally published country pages before QA');
if ((statusCounts.note_reviewed ?? 0) !== 12 - firstBatchProfileCount) {
  fail(\`tracker must contain \${12 - firstBatchProfileCount} note_reviewed rows\`);
}
if ((statusCounts.profile_ready ?? 0) !== 2 + firstBatchProfileCount) {
  fail(\`tracker must contain \${2 + firstBatchProfileCount} profile_ready rows\`);
}
if ((statusCounts.not_started ?? 0) !== 84) fail('tracker must contain 84 not_started rows');`,
    'programme count block');
  content = replaceOnce(content,
`  console.log('FIRST_BATCH_VALID: 12 reviewed notes');
  console.log('LEGACY_SEEDS_VALID: Japan and Hong Kong profile_ready');`,
`  console.log(\`FIRST_BATCH_VALID: \${firstBatchProfileCount} profiles ready, \${12 - firstBatchProfileCount} reviewed notes\`);
  console.log('LEGACY_SEEDS_VALID: Japan and Hong Kong profile_ready');`,
    'programme log block');
  write(file, content);
}

// Extend the ID validator to profile batches and derive tracker expectations dynamically.
{
  const file = 'scripts/check-country-page-id-inventory-01-12.mjs';
  let content = read(file);
  content = replaceOnce(content,
`const sourcesPath = path.join(root, 'data/static/sources.json');
const racecoursePaths = [
  path.join(root, 'data/static/racecourses.json'),
  path.join(root, 'data/static/racecourses-extensions.json')
];`,
`const profilesPath = path.join(root, 'data/static/country-profiles-v2.json');
const sourcePaths = [
  path.join(root, 'data/static/sources.json'),
  path.join(root, 'data/static/country-page-sources-01-04.json')
];
const racecoursePaths = [
  path.join(root, 'data/static/racecourses.json'),
  path.join(root, 'data/static/racecourses-extensions.json'),
  path.join(root, 'data/static/country-page-racecourses-01-04.json')
];`,
    'ID registry paths');
  content = replaceOnce(content,
`const countries = readJson(countriesPath);
const sources = readJson(sourcesPath);
const racecourses = racecoursePaths.flatMap(readJson);`,
`const countries = readJson(countriesPath);
const profiles = readJson(profilesPath);
const profileIds = new Set(profiles.map((profile) => profile.country_id));
const sources = sourcePaths.filter(fs.existsSync).flatMap(readJson);
const racecourses = racecoursePaths.filter(fs.existsSync).flatMap(readJson);`,
    'ID registry reads');
  content = replaceOnce(content,
`    if (trackerRow.programme_status !== 'note_reviewed') fail(\`\${entry.slug} must remain note_reviewed in PR 288\`);
    if (trackerRow.profile_status !== 'not_started') fail(\`\${entry.slug} profile status must not advance in PR 288\`);`,
`    const hasProfile = profileIds.has(entry.country_id);
    const expectedProgrammeStatus = hasProfile ? 'profile_ready' : 'note_reviewed';
    const expectedProfileStatus = hasProfile ? 'reviewed' : 'not_started';
    if (trackerRow.programme_status !== expectedProgrammeStatus) {
      fail(\`\${entry.slug} programme status must be \${expectedProgrammeStatus}\`);
    }
    if (trackerRow.profile_status !== expectedProfileStatus) {
      fail(\`\${entry.slug} profile status must be \${expectedProfileStatus}\`);
    }
    if (hasProfile && (trackerRow.en_route_status !== 'complete' || trackerRow.ja_route_status !== 'complete')) {
      fail(\`\${entry.slug} production profile requires complete EN and JA routes\`);
    }`,
    'ID tracker state block');
  write(file, content);
}

// Ensure related workflows run when batch registries change.
{
  const file = '.github/workflows/country-page-id-inventory-01-12.yml';
  let content = read(file);
  content = content.replaceAll(
    "      - 'data/static/country-page-id-inventory-01-12.json'\n",
    "      - 'data/static/country-page-id-inventory-01-12.json'\n      - 'data/static/country-profiles-v2.json'\n      - 'data/static/country-page-sources-*.json'\n      - 'data/static/country-page-racecourses-*.json'\n"
  );
  write(file, content);
}

{
  const file = '.github/workflows/country-detail-profile-runtime.yml';
  let content = read(file);
  content = content.replaceAll(
    "      - 'data/static/country-profiles-v2.json'\n",
    "      - 'data/static/country-profiles-v2.json'\n      - 'data/static/country-page-sources-*.json'\n      - 'data/static/country-page-racecourses-*.json'\n"
  );
  write(file, content);
}

console.log('PR_289_COORDINATED_UPDATE_COMPLETE');
