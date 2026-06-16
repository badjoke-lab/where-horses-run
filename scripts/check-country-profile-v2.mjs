import fs from 'node:fs';
import path from 'node:path';
import { validateBilingual } from './country-profile-v2/validate-bilingual.mjs';
import { validateStructure } from './country-profile-v2/validate-structure.mjs';

const root = process.cwd();
const trackerPath = path.join(root, 'docs/country-pages/98-country-tracker.tsv');

const loadTracker = () => {
  const lines = fs.readFileSync(trackerPath, 'utf8').trimEnd().split(/\r?\n/);
  const headers = lines[0].split('\t');
  return lines.slice(1).map((line) => {
    const values = line.split('\t');
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
  });
};

const listFiles = (input) => {
  const stat = fs.statSync(input);
  if (stat.isFile()) return [input];
  return fs.readdirSync(input)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => path.join(input, name));
};

const validateTrackerLink = (profile, tracker) => {
  const errors = [];
  const row = tracker.find((item) => item.slug === profile.slug);
  if (!row) return [`profile slug is absent from 98-country tracker: ${profile.slug}`];
  if (row.page_kind !== profile.page_kind) {
    errors.push(`page_kind does not match tracker for ${profile.slug}: ${profile.page_kind} != ${row.page_kind}`);
  }
  return errors;
};

const run = () => {
  const input = process.argv[2];
  if (!input) throw new Error('Usage: node scripts/check-country-profile-v2.mjs <file-or-directory>');
  const tracker = loadTracker();
  let failed = false;

  for (const file of listFiles(input)) {
    const profile = JSON.parse(fs.readFileSync(file, 'utf8'));
    const errors = [
      ...validateStructure(profile),
      ...validateBilingual(profile),
      ...validateTrackerLink(profile, tracker)
    ];

    if (errors.length) {
      failed = true;
      console.error(`INVALID ${file}`);
      errors.forEach((error) => console.error(`- ${error}`));
    } else {
      console.log(`VALID ${file}`);
    }
  }

  if (failed) process.exit(1);
};

try {
  run();
} catch (error) {
  console.error(`ERROR: ${error.message}`);
  process.exit(1);
}
