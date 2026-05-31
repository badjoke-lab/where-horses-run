import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

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
  fail('Missing package entry.');
}

if (!wiredEntrypoint.includes('scripts/check-pr-116-aqha-level-a.mjs')) {
  fail('Missing PR-116 validator call.');
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

const pr118 = spawnSync('node', ['scripts/check-pr-118-us-level-a-expansion.mjs'], {
  cwd: root,
  encoding: 'utf8'
});
if (pr118.status !== 0) {
  console.error(pr118.stdout);
  console.error(pr118.stderr);
  fail('PR-118 check not ok.');
}
console.log(pr118.stdout.trim());

console.log('[pr-117-level-a-wiring] PASS');
