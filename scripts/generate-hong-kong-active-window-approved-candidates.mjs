import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outputPath = path.join(root, 'data/candidates/hong-kong-active-window-approved-candidates.json');
const checkOnly = process.argv.includes('--check');

function readJson(relativePath) {
  return JSON.parse(readFileSync(path.join(root, relativePath), 'utf8'));
}

const sourceFile = readJson('data/candidates/hong-kong-hkjc-candidates.json');
const generatedAt = sourceFile.generated_at;
const records = (sourceFile.records ?? [])
  .map((record) => ({
    ...record,
    status: 'source-reviewed',
    review_status: 'approved',
    notes: `${record.notes} PR-074 approved active-window review bundle.`
  }))
  .sort((a, b) => `${a.date}:${a.racing_system_id}:${a.racecourse_id}`.localeCompare(`${b.date}:${b.racing_system_id}:${b.racecourse_id}`));

const candidateFile = {
  schema_version: 'timetable-candidates-v0',
  generated_at: generatedAt,
  source_adapter_id: 'hong-kong-active-window-reviewed-bundle',
  country_id: 'hong-kong',
  candidate_window: sourceFile.candidate_window,
  records,
  review: {
    review_status: 'approved',
    reviewed_at: generatedAt,
    reviewer: 'PR-074',
    summary: 'Reviewed Hong Kong active-window bundle from HKJC candidates.',
    promotion_target: 'data/generated/timetables.json'
  }
};

const serialized = `${JSON.stringify(candidateFile, null, 2)}\n`;

if (checkOnly) {
  if (!existsSync(outputPath)) process.exit(1);
  if (readFileSync(outputPath, 'utf8') !== serialized) process.exit(1);
  console.log('Hong Kong active-window approved candidate output is up to date.');
} else {
  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, serialized);
  console.log(`Wrote ${path.relative(root, outputPath)} with ${candidateFile.records.length} records.`);
}
