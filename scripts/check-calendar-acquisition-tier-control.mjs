import { readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const trackerPath = 'docs/country-pages/98-country-tracker.tsv';
const controlPath = 'data/static/calendar-acquisition-tier-control.json';
const registryPath = 'data/static/calendar-acquisition-registry.json';
const workflowPath = '.github/workflows/calendar-unified-official-refresh.yml';

const readText = (relativePath) => readFileSync(path.join(root, relativePath), 'utf8');
const readJson = (relativePath) => JSON.parse(readText(relativePath));
const fail = (message) => {
  console.error(`[calendar-acquisition-tier-control] ${message}`);
  process.exit(1);
};

const trackerLines = readText(trackerPath).trim().split(/\r?\n/);
const trackerHeader = trackerLines.shift().split('\t');
const slugIndex = trackerHeader.indexOf('slug');
if (slugIndex < 0) fail(`${trackerPath} must contain slug column.`);
const trackerSlugs = trackerLines.map((line) => line.split('\t')[slugIndex]).filter(Boolean);
if (trackerSlugs.length !== 98) fail(`tracker must contain 98 tiers; got ${trackerSlugs.length}.`);
if (new Set(trackerSlugs).size !== trackerSlugs.length) fail('tracker contains duplicate slugs.');

const control = readJson(controlPath);
if (control.schema_version !== 'calendar-acquisition-tier-control-v1') fail('control schema_version differs.');
if (control.target_tracker !== trackerPath) fail('control target_tracker differs.');

const categories = [
  'automated',
  'ledger_accounted_unwired',
  'fanout_normalization_incomplete',
  'source_unresolved',
  'dormant',
];
const seen = new Map();
for (const category of categories) {
  const values = control.tiers?.[category];
  if (!Array.isArray(values)) fail(`tiers.${category} must be an array.`);
  if (new Set(values).size !== values.length) fail(`tiers.${category} contains duplicates.`);
  for (const slug of values) {
    if (!trackerSlugs.includes(slug)) fail(`tiers.${category} contains unknown tracker slug ${slug}.`);
    if (seen.has(slug)) fail(`${slug} appears in both ${seen.get(slug)} and ${category}.`);
    seen.set(slug, category);
  }
}

const missing = trackerSlugs.filter((slug) => !seen.has(slug));
if (missing.length) fail(`control is missing tracker tiers: ${missing.join(', ')}.`);
if (seen.size !== trackerSlugs.length) fail(`control coverage differs: ${seen.size}/${trackerSlugs.length}.`);

for (const category of categories) {
  const expected = control.expected_counts?.[category];
  if (expected !== control.tiers[category].length) {
    fail(`expected_counts.${category}=${expected} but actual=${control.tiers[category].length}.`);
  }
}
if (control.expected_counts?.target !== trackerSlugs.length) fail('expected_counts.target differs from tracker count.');

const registry = readJson(registryPath);
const registryAutomated = [...new Set((registry.records ?? []).map((record) => record.country_id))].sort();
const controlledAutomated = [...control.tiers.automated].sort();
if (JSON.stringify(registryAutomated) !== JSON.stringify(controlledAutomated)) {
  fail(`automated tier set differs from Acquisition Registry country coverage: registry=${registryAutomated.join(',')} control=${controlledAutomated.join(',')}.`);
}

const workflow = readText(workflowPath);
const workflowEvidence = {
  japan: 'run-japan-zero-based-30d.mjs',
  'hong-kong': '--country-id=hong-kong',
  'united-arab-emirates': '--country-id=united-arab-emirates',
  'south-korea': '--country-id=south-korea',
  turkey: '--country-id=turkey',
};
for (const slug of control.tiers.automated) {
  const evidence = workflowEvidence[slug];
  if (!evidence || !workflow.includes(evidence)) fail(`unified refresh implementation evidence missing for automated tier ${slug}.`);
}

const unresolved = new Set(control.tiers.source_unresolved);
for (const slug of ['libya', 'oman']) if (!unresolved.has(slug)) fail(`${slug} must remain source_unresolved until a stable forward source is recovered.`);

const dormant = new Set(control.tiers.dormant);
for (const slug of ['singapore', 'macau', 'greece']) if (!dormant.has(slug)) fail(`${slug} must remain dormant unless the tracker scope changes.`);

console.log('[calendar-acquisition-tier-control] PASS');
console.log(`TARGET_TIERS: ${trackerSlugs.length}`);
for (const category of categories) console.log(`${category.toUpperCase()}: ${control.tiers[category].length}`);
