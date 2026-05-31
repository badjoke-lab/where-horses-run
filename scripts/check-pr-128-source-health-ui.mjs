import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function fail(message) {
  console.error(`[pr-128-source-health-ui] ${message}`);
  process.exit(1);
}

function read(relativePath) {
  const filePath = path.join(root, relativePath);
  if (!fs.existsSync(filePath)) fail(`Missing file: ${relativePath}`);
  return fs.readFileSync(filePath, 'utf8');
}

const page = read('src/pages/major-countries/source-health.astro');
const registry = read('data/source-registry/major-country-sources.json');

for (const text of [
  'Timetable source health',
  'registry.sources',
  'source.status',
  'source.source_kind',
  'source.target_level',
  'source.parser',
  'source.refresh_cadence',
  'source.url'
]) {
  if (!page.includes(text)) fail(`Page missing ${text}.`);
}

for (const country of [
  'japan',
  'hong-kong',
  'united-arab-emirates',
  'united-kingdom',
  'ireland',
  'france',
  'australia',
  'new-zealand',
  'canada',
  'south-africa',
  'south-korea',
  'singapore',
  'united-states'
]) {
  if (!registry.includes(country)) fail(`Registry missing ${country}.`);
}

console.log('[pr-128-source-health-ui] PASS');
