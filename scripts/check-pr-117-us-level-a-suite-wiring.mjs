import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function fail(message) {
  console.error(`[pr-117-level-a-wiring] ${message}`);
  process.exit(1);
}

function read(relativePath) {
  const filePath = path.join(root, relativePath);
  if (!fs.existsSync(filePath)) fail(`Missing file: ${relativePath}`);
  return fs.readFileSync(filePath, 'utf8');
}

const packageJson = read('package.json');
const wiredEntrypoint = read('scripts/check-pr-115-usta-level-a.mjs');
const aqhaValidator = read('scripts/check-pr-116-aqha-level-a.mjs');
const aqhaGenerator = read('scripts/generate-pr-116-aqha-level-a.mjs');

if (!packageJson.includes('validate:pr-115-usta-level-a')) {
  fail('Expected package.json to keep validate:pr-115-usta-level-a wired into npm run check.');
}

if (!wiredEntrypoint.includes('scripts/check-pr-116-aqha-level-a.mjs')) {
  fail('Expected the wired PR-115 entrypoint to invoke the PR-116 AQHA validator.');
}

if (!wiredEntrypoint.includes('PR-116 validator failed')) {
  fail('Expected explicit PR-116 failure text in the wired entrypoint.');
}

for (const required of [
  'country_id',
  'aqha-quarter-horse',
  'data_level',
  'races',
  'first_race_time',
  'promotes_from'
]) {
  if (!aqhaValidator.includes(required)) fail(`AQHA validator must check ${required}.`);
}

if (!aqhaGenerator.includes('pr-116-aqha-level-a-v0')) {
  fail('AQHA generator schema marker is missing.');
}

console.log('[pr-117-level-a-wiring] PASS: PR-116 validation is intentionally wired through the existing package check entrypoint.');
