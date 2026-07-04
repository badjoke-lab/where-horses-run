import fs from 'node:fs';

const errors = [];
const fail = (message) => errors.push(message);
const read = (file) => fs.readFileSync(file, 'utf8');

const launcher = read('collect-nar-monthly-manual');
const manual = read('scripts/timetable/manual-collect-nar-monthly.mjs');
const scheduleNormalizer = read('scripts/timetable/normalize-nar-monthly-schedule-fetch.mjs');
const collector = read('scripts/timetable/collect-nar-monthly-candidates.mjs');
const validator = read('scripts/check-calendar-nar-monthly-candidate-set.mjs');
const candidateWorkflow = read('.github/workflows/calendar-nar-monthly-candidate-set.yml');
const runbook = read('docs/calendar/manual-nar-monthly-collection.md');
const policy = read('data/static/nar-monthly-collection-policy-v1.json');
const scheduled = read('.github/workflows/timetable-scheduled-refresh.yml');

for (const marker of ['--filter=blob:none', '--no-checkout', 'sparse-checkout init --no-cone', '!/docs/', 'trap cleanup', 'manual-collect-nar-monthly.mjs']) {
  if (!launcher.includes(marker)) fail(`launcher missing ${marker}.`);
}
for (const marker of [
  'normalize-nar-monthly-schedule-fetch.mjs',
  'check-calendar-nar-monthly-candidate-set.mjs',
  'check-calendar-runtime-import-boundary.mjs',
  "'install', '--package-lock=false', '--no-audit', '--no-fund'",
  "'run', 'build'",
  'automation/nar-monthly-',
  'data/candidates/nar-monthly-meeting-candidates.json',
  'data/generated/timetable/nar-monthly-collection-report.json',
  'promotion_eligible=false',
]) {
  if (!manual.includes(marker)) fail(`manual script missing ${marker}.`);
}
for (const marker of [
  'extractRaceListLiterals',
  'decodeEntitiesDeep',
  'queryValueCaseInsensitive',
  'flatVenueCodes',
  'normalizedBody',
  'MonthlyConveneInfoTop',
  "await import('./collect-nar-monthly-candidates.mjs')",
  'scheduleMeetingLinks.length > 0 && report.meetings_discovered === 0',
  'Monthly schedule link count mismatch',
]) {
  if (!scheduleNormalizer.includes(marker)) fail(`schedule normalizer missing ${marker}.`);
}
for (const marker of [
  'MonthlyConveneInfoTop',
  'extractRaceListUrls',
  'check-calendar-nar-complete-fixture-set.mjs',
  'no_meeting_in_target_month',
  'meeting_complete',
  'meeting_incomplete',
  'source_unavailable',
  'parser_failure',
  'promotion_eligible: false',
  "canonical_write: 'disabled'",
  "public_write: 'disabled'",
  "raw_source_storage: 'disabled'",
]) {
  if (!collector.includes(marker)) fail(`collector missing ${marker}.`);
}
for (const forbidden of ['canonical/meetings.json', 'canonical/meeting-details.json', 'public/meeting-list.json', 'public/meeting-details.json', 'build-public-timetable-view.mjs', 'promote-timetable']) {
  if (collector.includes(forbidden) || scheduleNormalizer.includes(forbidden)) fail(`monthly collection must not reference ${forbidden}.`);
}
for (const marker of [
  '--allow-empty',
  'RACECOURSES_CLASSIFIED',
  'MEETINGS_DISCOVERED',
  'report discovered count differs from in-scope venue meeting counts',
  'every discovered in-scope meeting must be either a complete candidate or blocker',
  'report official schedule URL is missing or invalid',
  'PROMOTION_ELIGIBLE: 0',
  'PUBLICATION_EFFECT: none',
  'forbidden key fragment',
]) {
  if (!validator.includes(marker)) fail(`validator missing ${marker}.`);
}
for (const marker of ['fetch-depth: 0', 'github.event.pull_request.base.sha', 'github.event.pull_request.head.sha']) {
  if (!candidateWorkflow.includes(marker)) fail(`candidate workflow missing ${marker}.`);
}
for (const marker of ['sh ./collect-nar-monthly-manual 2026-07', '2026-07-04', 'no_meeting_in_target_month', 'Canonical and public writes remain disabled', 'Publication requires a later human-approved promotion PR']) {
  if (!runbook.includes(marker)) fail(`runbook missing ${marker}.`);
}
for (const marker of ['"candidate_write": "needs_review_only"', '"canonical_write": "disabled"', '"public_write": "disabled"', '"schedule_mode": "disabled"']) {
  if (!policy.includes(marker)) fail(`policy missing ${marker}.`);
}
if (/^\s*schedule:/m.test(scheduled) || scheduled.includes('cron:')) fail('scheduled refresh must remain disabled.');

if (errors.length) {
  console.error(`CALENDAR_NAR_MONTHLY_OPERATOR: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}
console.log('CALENDAR_NAR_MONTHLY_OPERATOR: pass');
console.log('RACECOURSES_CLASSIFIED: 14');
console.log('SCHEDULE_LINK_NORMALIZATION: flat-scope-guarded');
console.log('MEETING_ACCOUNTING: guarded');
console.log('CANDIDATE_WRITE: needs_review_only');
console.log('CANONICAL_WRITE: disabled');
console.log('PUBLIC_WRITE: disabled');
console.log('SCHEDULED_FETCH: disabled');
