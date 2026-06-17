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
  text = replaceOnce(text,
`const productionProfilesPath = path.join(root, 'data/static/country-profiles-v2.json');
const productionProfiles = JSON.parse(fs.readFileSync(productionProfilesPath, 'utf8'));
const productionProfileIds = new Set(productionProfiles.map((profile) => profile.country_id));`,
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
  chile.distributor_source_ids = [
    'chile-club-hipico-concepcion-home',
    'chile-valparaiso-sporting-home',
    'chile-club-hipico-santiago-home',
    'chile-hipodromo-chile-home',
    'chile-teletrak-calendar'
  ];
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
    'chile-club-hipico-concepcion-home', 'chile-valparaiso-sporting-home',
    'chile-club-hipico-santiago-home', 'chile-hipodromo-chile-home',
    'chile-teletrak-calendar', 'peru-monterrico-home', 'peru-monterrico-programmes',
    'mexico-hipodromo-las-americas-candidate', 'brazil-jockey-club-brasileiro',
    'brazil-gavea-programme', 'brazil-jockey-club-sao-paulo',
    'brazil-cidade-jardim-programme', 'brazil-jockey-club-rio-grande-do-sul',
    'brazil-cristal-programme', 'brazil-jockey-club-sorocaba',
    'brazil-sorocaba-programme'
  ]);
  for (const source of inventory.sources) {
    if (registeredSourceIds.has(source.id)) source.registry_status = 'registered';
    if (source.country_id === 'chile' && source.id !== 'chile-teletrak-calendar') source.role = 'supplementary';
    if (source.id === 'peru-monterrico-home') source.role = 'supplementary';
  }

  write(file, `${JSON.stringify(inventory, null, 2)}\n`);
}

console.log('PR_290_SYNC_COMPLETE');
