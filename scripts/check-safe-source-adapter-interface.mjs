import { readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const source = readFileSync(path.join(root, 'src/lib/timetable/source-adapter.ts'), 'utf8');
const errors = [];

function fail(message) {
  errors.push(message);
}

for (const required of [
  'export interface SafeSourceAdapter',
  'SourceAdapterSafetyPolicy',
  'storeSourceBody: false',
  'storeRawMarkup: false',
  'publishWithoutReview: false',
  "allowedOutput: 'meeting_level_only'",
  'generateCandidates',
  'TimetableCandidateFile',
  'TimetableCandidateRecord',
  "schema_version: 'timetable-candidates-v0'",
  "review_status: CandidateReviewStatus",
  "mode: SafeSourceAdapterMode"
]) {
  if (!source.includes(required)) {
    fail(`source-adapter.ts must include: ${required}`);
  }
}

for (const forbidden of [
  'racecardHtml',
  'rawHtml',
  'sourceBody',
  'odds',
  'payout',
  'prediction',
  'tipText'
]) {
  if (source.includes(forbidden)) {
    fail(`source-adapter.ts must not include forbidden field: ${forbidden}`);
  }
}

if (errors.length) {
  console.error('Safe source adapter interface check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Safe source adapter interface check passed.');
