import { readFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const errors = [];

function fail(message) {
  errors.push(message);
}

function read(relativePath) {
  return readFileSync(path.join(root, relativePath), 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

const script = read('scripts/promote-timetable-candidates.mjs');
const overlay = readJson('data/candidates/promotion-approved.overlay.sample.json');

const check = spawnSync(process.execPath, [
  'scripts/promote-timetable-candidates.mjs',
  '--input',
  'data/candidates/promotion-approved.sample.json',
  '--output',
  'data/candidates/promotion-approved.overlay.sample.json',
  '--check'
], {
  cwd: root,
  encoding: 'utf8'
});

if (check.status !== 0) {
  fail(`promotion --check failed: ${check.stderr || check.stdout}`);
}

if (overlay.schema_version !== 'timetable-overlay-promoted-v0') fail('overlay sample must use timetable-overlay-promoted-v0');
if (overlay.records.length !== 1) fail('overlay sample must promote only one approved record');
if (overlay.records[0]?.racecourse_id !== 'sample-racecourse') fail('approved sample racecourse missing from overlay');
if (JSON.stringify(overlay).includes('unreviewed-racecourse')) fail('needs_review sample must not be promoted');
if (overlay.records[0]?.status !== 'source-reviewed') fail('promoted overlay records must use source-reviewed status');

for (const required of [
  "record.review_status !== 'approved'",
  "const approvedRecords = (candidateFile.records ?? []).filter((record) => record.review_status === 'approved')",
  "status: 'source-reviewed'",
  "needs_review",
  "rejected",
  "raw html",
  "source body",
  "odds",
  "results",
  "payouts",
  "prediction",
  "tips"
]) {
  if (!script.includes(required)) fail(`promotion script must include: ${required}`);
}

if (errors.length) {
  console.error('Timetable candidate promotion check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Timetable candidate promotion check passed.');
