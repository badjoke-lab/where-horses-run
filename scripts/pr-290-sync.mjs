import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const write = (file, value) => fs.writeFileSync(path.join(root, file), value);
const replaceOnce = (text, before, after, label) => {
  const count = text.split(before).length - 1;
  if (count !== 1) throw new Error(`${label}: expected one match, found ${count}`);
  return text.replace(before, after);
};

{
  const file = 'scripts/check-country-page-programme.mjs';
  let text = read(file);
  const before = `const productionProfilesPath = path.join(root, 'data/static/country-profiles-v2.json');
const productionProfiles = JSON.parse(fs.readFileSync(productionProfilesPath, 'utf8'));
const productionProfileIds = new Set(productionProfiles.map((profile) => profile.country_id));`;
  if (text.includes(before)) {
    text = replaceOnce(text, before,
`const staticDirectory = path.join(root, 'data/static');
const productionProfileFiles = fs.readdirSync(staticDirectory)
  .filter((name) => /^country-profiles-v2(?:-.*)?\\.json$/.test(name))
  .sort();
const productionProfiles = productionProfileFiles.flatMap((fileName) => {
  const value = JSON.parse(fs.readFileSync(path.join(staticDirectory, fileName), 'utf8'));
  if (!Array.isArray(value)) {
    fail(\`\${fileName} must contain an array\`);
    return [];
  }
  return value;
});
const productionProfileIds = new Set(productionProfiles.map((profile) => profile.country_id));`,
      'programme profile loader');
    write(file, text);
  }
}

{
  const file = 'docs/country-pages/98-country-tracker.tsv';
  const lines = read(file).trimEnd().split(/\r?\n/);
  const headers = lines[0].split('\t');
  const targets = new Set(['05', '06', '07', '08']);
  const output = lines.slice(1).map((line) => {
    const values = line.split('\t');
    while (values.length < headers.length) values.push('');
    const row = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
    if (targets.has(row.delivery_no)) {
      row.programme_status = 'profile_ready';
      row.profile_status = 'reviewed';
      row.en_route_status = 'complete';
      row.ja_route_status = 'complete';
      row.qa_status = 'not_started';
      row.profile_last_reviewed = '2026-06-18';
      row.page_published_at = '';
      row.remarks = row.delivery_no === '07'
        ? 'Reviewed pending profile-v2 ready; source reachability and formal QA remain.'
        : 'Reviewed profile-v2 and bilingual routes ready; formal QA and publication remain.';
    }
    return headers.map((header) => row[header] ?? '').join('\t');
  });
  write(file, `${lines[0]}\n${output.join('\n')}\n`);
}

{
  const file = 'data/static/country-page-id-inventory-01-12.json';
  const inventory = JSON.parse(read(file));
  const countryByDelivery = new Map(inventory.countries.map((country) => [country.delivery_no, country]));
  const chile = countryByDelivery.get('05');
  chile.organiser_status = 'pending';
  chile.organiser_source_ids = [];
  chile.distributor_source_ids = ['chile-club-hipico-concepcion-home','chile-valparaiso-sporting-home','chile-club-hipico-santiago-home','chile-hipodromo-chile-home','chile-teletrak-calendar'];
  chile.principal_racecourse_ids = ['hipodromo-chile'];
  const peru = countryByDelivery.get('06');
  peru.organiser_status = 'pending';
  peru.organiser_source_ids = [];
  peru.distributor_source_ids = ['peru-monterrico-home', 'peru-monterrico-programmes'];
  peru.principal_racecourse_status = 'pending';
  peru.principal_racecourse_ids = [];
  const brazil = countryByDelivery.get('08');
  brazil.country_registry_status = 'registered';
  brazil.principal_racecourse_status = 'pending';
  brazil.principal_racecourse_ids = [];
  const registeredSourceIds = new Set([
    'chile-club-hipico-concepcion-home','chile-valparaiso-sporting-home','chile-club-hipico-santiago-home','chile-hipodromo-chile-home','chile-teletrak-calendar',
    'peru-monterrico-home','peru-monterrico-programmes','mexico-hipodromo-las-americas-candidate',
    'brazil-jockey-club-brasileiro','brazil-gavea-programme','brazil-jockey-club-sao-paulo','brazil-cidade-jardim-programme',
    'brazil-jockey-club-rio-grande-do-sul','brazil-cristal-programme','brazil-jockey-club-sorocaba','brazil-sorocaba-programme'
  ]);
  for (const source of inventory.sources) {
    if (registeredSourceIds.has(source.id)) source.registry_status = 'registered';
    if (source.country_id === 'chile' && source.id !== 'chile-teletrak-calendar') source.role = 'supplementary';
    if (source.id === 'peru-monterrico-home') source.role = 'supplementary';
  }
  write(file, `${JSON.stringify(inventory, null, 2)}\n`);
}

{
  const file = 'scripts/check-country-page-id-inventory-01-12.mjs';
  let text = read(file);
  const oldPaths = `const countriesPath = path.join(root, 'data/static/countries.json');
const profilesPath = path.join(root, 'data/static/country-profiles-v2.json');
const sourcePaths = [
  path.join(root, 'data/static/sources.json'),
  path.join(root, 'data/static/country-page-sources-01-04.json')
];
const racecoursePaths = [
  path.join(root, 'data/static/racecourses.json'),
  path.join(root, 'data/static/racecourses-extensions.json'),
  path.join(root, 'data/static/country-page-racecourses-01-04.json')
];`;
  if (text.includes(oldPaths)) {
    text = replaceOnce(text, oldPaths,
`const staticDirectory = path.join(root, 'data/static');
const filesMatching = (pattern) => fs.readdirSync(staticDirectory)
  .filter((name) => pattern.test(name))
  .sort()
  .map((name) => path.join(staticDirectory, name));
const countryPaths = [path.join(staticDirectory, 'countries.json'), ...filesMatching(/^country-page-countries-.*\\.json$/)];
const profilePaths = filesMatching(/^country-profiles-v2(?:-.*)?\\.json$/);
const sourcePaths = [path.join(staticDirectory, 'sources.json'), ...filesMatching(/^country-page-sources-.*\\.json$/)];
const racecoursePaths = [
  path.join(staticDirectory, 'racecourses.json'),
  path.join(staticDirectory, 'racecourses-extensions.json'),
  ...filesMatching(/^country-page-racecourses-.*\\.json$/)
];`, 'ID registry paths');
  }
  const oldReads = `const countries = readJson(countriesPath);
const profiles = readJson(profilesPath);
const profileIds = new Set(profiles.map((profile) => profile.country_id));
const sources = sourcePaths.filter(fs.existsSync).flatMap(readJson);
const racecourses = racecoursePaths.filter(fs.existsSync).flatMap(readJson);`;
  if (text.includes(oldReads)) {
    text = replaceOnce(text, oldReads,
`const countries = countryPaths.filter(fs.existsSync).flatMap(readJson);
const profiles = profilePaths.filter(fs.existsSync).flatMap(readJson);
const profileIds = new Set(profiles.map((profile) => profile.country_id));
const sources = sourcePaths.filter(fs.existsSync).flatMap(readJson);
const racecourses = racecoursePaths.filter(fs.existsSync).flatMap(readJson);`, 'ID registry reads');
  }
  write(file, text);
}

for (const file of ['.github/workflows/country-detail-profile-runtime.yml', '.github/workflows/country-page-id-inventory-01-12.yml']) {
  let text = read(file);
  text = text.replaceAll("      - 'data/static/country-profiles-v2.json'\n", "      - 'data/static/country-profiles-v2*.json'\n      - 'data/static/country-page-countries-*.json'\n");
  write(file, text);
}

console.log('PR_290_SYNC_COMPLETE');
