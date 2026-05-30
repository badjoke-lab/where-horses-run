import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outputPath = path.join(root, 'data/candidates/japan-active-window-approved-candidates.json');
const checkOnly = process.argv.includes('--check');

function readJson(relativePath) {
  return JSON.parse(readFileSync(path.join(root, relativePath), 'utf8'));
}

const files = [
  readJson('data/candidates/japan-jra-candidates.json'),
  readJson('data/candidates/japan-nar-candidates.json'),
  readJson('data/candidates/japan-banei-candidates.json')
];

const generatedAt = files[0].generated_at;
const records = files
  .flatMap((file) => file.records ?? [])
  .map((record) => ({
    ...record,
    status: 'source-reviewed',
    review_status: 'approved',
    notes: `${record.notes} PR-071 review bundle.`
  }))
  .sort((a, b) => `${a.date}:${a.racing_system_id}:${a.racecourse_id}`.localeCompare(`${b.date}:${b.racing_system_id}:${b.racecourse_id}`));

const candidateFile = {
  schema_version: 'timetable-candidates-v0',
  generated_at: generatedAt,
  source_adapter_id: 'japan-active-window-reviewed-bundle',
  country_id: 'japan',
  candidate_window: files[0].candidate_window,
  records,
  review: {
    review_status: 'approved',
    reviewed_at: generatedAt,
    reviewer: 'PR-071',
    summary: 'Reviewed Japan active-window bundle from JRA, NAR, and Banei candidates.',
    promotion_target: 'data/generated/japan-active-timetable-records.json'
  }
};

const serialized = `${JSON.stringify(candidateFile, null, 2)}\n`;

if (checkOnly) {
  if (!existsSync(outputPath)) process.exit(1);
  if (readFileSync(outputPath, 'utf8') !== serialized) process.exit(1);
  console.log('Japan active-window approved candidate output is up to date.');
} else {
  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, serialized);
  console.log(`Wrote ${path.relative(root, outputPath)} with ${candidateFile.records.length} records.`);
}
