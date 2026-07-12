import fs from 'node:fs';

const readinessPath = 'data/static/calendar-readiness-registry.json';
const pilotCheckerPath = 'scripts/check-calendar-uae-era-pilot-06-profile-foundation.mjs';
const handoffCheckerPath = 'scripts/check-calendar-uae-era-handoff-decision.mjs';
const backfillCheckerPath = 'scripts/check-calendar-readiness-backfill-37-52.mjs';

const scheduleId = 'united-arab-emirates--uae-national-racing-system--era-season-calendar';
const detailId = 'united-arab-emirates--uae-national-racing-system--era-racecard-public-timetable';
const venueIds = [
  'meydan-racecourse',
  'abu-dhabi-turf-club',
  'al-ain-racecourse',
  'jebel-ali-racecourse',
  'sharjah-racecourse',
];

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const writeJson = (file, value) => fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
const replaceRegex = (file, pattern, replacement, label) => {
  const current = fs.readFileSync(file, 'utf8');
  if (!pattern.test(current)) throw new Error(`${file}: ${label} marker missing`);
  fs.writeFileSync(file, current.replace(pattern, replacement));
};

const registry = readJson(readinessPath);
const scheduleIndex = registry.records.findIndex((record) => record.readiness_id === scheduleId);
if (scheduleIndex < 0) throw new Error('UAE schedule readiness record missing');

const current = registry.records[scheduleIndex];
const sourceTestRef = current.source_test_ref;
const shared = {
  country_id: 'united-arab-emirates',
  country_tracker_delivery_no: '01',
  system_id: 'uae-national-racing-system',
  system_name_en: current.system_name_en ?? 'UAE National Racing System',
  racecourse_ids: venueIds,
  coverage_scope: 'countrywide',
  source_format: 'mixed',
  automation_mode: 'semi_automatic',
  readiness: 'prototype_ready',
  implementation_status: 'fixture_validated',
  blocked_reason: null,
  source_test_ref: sourceTestRef,
};

const scheduleRecord = {
  ...current,
  ...shared,
  readiness_id: scheduleId,
  authority_source_key: 'united-arab-emirates/emirates-racing-authority/era-season-calendar',
  technical_rank: 'C',
  public_ceiling: 'C',
  confirmed_fields: {
    meeting_date: true,
    racecourse: true,
    first_race_time: false,
    last_race_time: false,
    per_race_post_times: false,
    race_name: false,
    distance: false,
    surface: false,
    course: false,
  },
  access_mode: 'direct',
  refresh_classes: ['seasonal', 'manual'],
  fallback: 'keep_last_verified_and_mark_stale',
  source_status: 'verified',
  checked_date: '2026-07-11',
  evidence_reviewed_at: '2026-07-11',
  revalidation_trigger: 'Revalidate when ERA replaces the reviewed season-calendar PDF, changes the five-venue grid, or the fixed source-visible horizon no longer closes to the reviewed 64 meetings.',
  limitations: [
    'C-level meeting date and approved racecourse identity only.',
    'The reviewed season-calendar route does not claim race times or per-race detail.',
    'Automatic approval, canonical promotion, public writing, and unattended publication remain disabled.',
  ],
  notes: 'Historical reviewed UAE schedule route: 64 meetings across Meydan, Abu Dhabi, Al Ain, Jebel Ali, and Sharjah for the fixed 2026-10-22 through 2027-04-15 source-visible season window.',
};

const detailRecord = {
  ...current,
  ...shared,
  readiness_id: detailId,
  authority_source_key: 'united-arab-emirates/emirates-racing-authority/era-racecard-public-timetable',
  technical_rank: 'A',
  public_ceiling: 'A',
  confirmed_fields: {
    meeting_date: true,
    racecourse: true,
    first_race_time: true,
    last_race_time: true,
    per_race_post_times: true,
    race_name: false,
    distance: true,
    surface: true,
    course: false,
  },
  access_mode: 'date_route',
  refresh_classes: ['weekly', 'near_meeting', 'manual'],
  fallback: 'downgrade_to_C',
  source_status: 'verified',
  checked_date: '2026-07-13',
  evidence_reviewed_at: '2026-07-13',
  revalidation_trigger: 'Revalidate when ERA changes its racecard date/race route, Race 1-N navigation stops closing continuously, or a source-visible meeting cannot reproduce reviewed A-level post-time fields.',
  limitations: [
    'A-level detail exists only after the official ERA racecard becomes source-visible.',
    'Race names are not consistently present, so A+ is not claimed.',
    'Shared automatic near-meeting retry execution, automatic approval, canonical promotion, public writing, and unattended publication remain disabled.',
  ],
  notes: 'Official ERA live evidence run 29199123357 proved 10 Al Ain races on 2026-04-10 from 17:00 through 21:30 at Rank A with zero source errors; artifact 8261852673, sha256:7c6cc386a8092d86b2d603fdea3aa9b890558c89b5f8bfb798af69ae1f9dc379.',
};

registry.records = registry.records.filter((record) => record.readiness_id !== detailId);
const restoredIndex = registry.records.findIndex((record) => record.readiness_id === scheduleId);
registry.records.splice(restoredIndex, 1, scheduleRecord, detailRecord);
registry.programme_state.readiness_records = registry.records.length;
writeJson(readinessPath, registry);

const pilotReplacement = `const uaeScheduleReadiness = readiness.records.find((record) => record.readiness_id === '${scheduleId}');
if (!uaeScheduleReadiness) fail('UAE schedule Readiness record missing.');
else {
  if (!exact(uaeScheduleReadiness.racecourse_ids, expectedIds)) fail('UAE schedule Readiness racecourse scope differs.');
  if (uaeScheduleReadiness.authority_source_key !== 'united-arab-emirates/emirates-racing-authority/era-season-calendar') fail('UAE schedule Readiness source key differs.');
  if (uaeScheduleReadiness.technical_rank !== 'C' || uaeScheduleReadiness.public_ceiling !== 'C') fail('UAE schedule Readiness rank boundary differs.');
  if (uaeScheduleReadiness.access_mode !== 'direct' || !exact(uaeScheduleReadiness.refresh_classes, ['seasonal', 'manual'])) fail('UAE schedule Readiness route differs.');
  if (uaeScheduleReadiness.fallback !== 'keep_last_verified_and_mark_stale') fail('UAE schedule Readiness fallback differs.');
  if (uaeScheduleReadiness.checked_date !== '2026-07-11') fail('UAE schedule Readiness review date differs.');
}
const uaeDetailReadiness = readiness.records.find((record) => record.readiness_id === '${detailId}');
if (!uaeDetailReadiness) fail('UAE detail Readiness record missing.');
else {
  if (!exact(uaeDetailReadiness.racecourse_ids, expectedIds)) fail('UAE detail Readiness racecourse scope differs.');
  if (uaeDetailReadiness.authority_source_key !== 'united-arab-emirates/emirates-racing-authority/era-racecard-public-timetable') fail('UAE detail Readiness source key differs.');
  if (uaeDetailReadiness.technical_rank !== 'A' || uaeDetailReadiness.public_ceiling !== 'A') fail('UAE detail Readiness recovered rank boundary differs.');
  if (uaeDetailReadiness.access_mode !== 'date_route' || !uaeDetailReadiness.refresh_classes.includes('near_meeting')) fail('UAE detail Readiness route differs.');
  if (uaeDetailReadiness.fallback !== 'downgrade_to_C') fail('UAE detail Readiness fallback differs.');
  if (uaeDetailReadiness.checked_date !== '2026-07-13') fail('UAE detail Readiness review date differs.');
}

const uaeSource =`;
replaceRegex(
  pilotCheckerPath,
  /const uaeReadiness = readiness\.records\.find\([\s\S]*?\nconst uaeSource =/,
  pilotReplacement,
  'UAE Readiness block',
);

const handoffReplacement = `const scheduleReadinessRecord = readiness.records.find((record) => record.readiness_id === '${scheduleId}');
if (!scheduleReadinessRecord) fail('UAE historical schedule Readiness record missing.');
else {
  if (!exact(scheduleReadinessRecord.racecourse_ids, ['meydan-racecourse','abu-dhabi-turf-club','al-ain-racecourse','jebel-ali-racecourse','sharjah-racecourse'])) fail('UAE schedule Readiness racecourse scope differs.');
  if (scheduleReadinessRecord.readiness !== 'prototype_ready' || scheduleReadinessRecord.implementation_status !== 'fixture_validated') fail('UAE schedule Readiness accepted state differs.');
  if (scheduleReadinessRecord.technical_rank !== 'C' || scheduleReadinessRecord.public_ceiling !== 'C') fail('UAE historical schedule Readiness boundary differs.');
}
const detailReadinessRecord = readiness.records.find((record) => record.readiness_id === '${detailId}');
if (!detailReadinessRecord) fail('UAE current detail Readiness record missing.');
else {
  if (detailReadinessRecord.technical_rank !== 'A' || detailReadinessRecord.public_ceiling !== 'A') fail('UAE current detail Readiness boundary differs.');
  if (detailReadinessRecord.authority_source_key !== 'united-arab-emirates/emirates-racing-authority/era-racecard-public-timetable') fail('UAE current detail source key differs.');
}

const executor =`;
replaceRegex(
  handoffCheckerPath,
  /const readinessRecord = readiness\.records\.find\([\s\S]*?\nconst executor =/,
  handoffReplacement,
  'UAE current/historical Readiness block',
);

let backfill = fs.readFileSync(backfillCheckerPath, 'utf8');
backfill = backfill.replace(
  `const postBackfillTransitionIds = new Set([\n  '${scheduleId}',\n]);`,
  `const postBackfillTransitionIds = new Set([\n  '${scheduleId}',\n]);\nconst postBackfillRecoveryIds = new Set([\n  '${detailId}',\n]);`,
);
backfill = backfill.replace(
  `const baselineRecords = (registry.records ?? []).filter((record) => first52Countries.has(record.country_id));`,
  `const baselineRecords = (registry.records ?? []).filter((record) => first52Countries.has(record.country_id) && !postBackfillRecoveryIds.has(record.readiness_id));`,
);
backfill = backfill.replace(
  `const uaeTransition = (registry.records ?? []).find((record) => postBackfillTransitionIds.has(record.readiness_id));`,
  `const uaeRecovery = (registry.records ?? []).find((record) => postBackfillRecoveryIds.has(record.readiness_id));\nif (!uaeRecovery) fail('UAE detail recovery readiness record is missing');\nelse {\n  if (uaeRecovery.country_tracker_delivery_no !== '01') fail('UAE detail recovery delivery number differs');\n  if (uaeRecovery.readiness !== 'prototype_ready' || uaeRecovery.implementation_status !== 'fixture_validated') fail('UAE detail recovery implementation state differs');\n  if (uaeRecovery.technical_rank !== 'A' || uaeRecovery.public_ceiling !== 'A') fail('UAE detail recovery rank boundary differs');\n  if ((uaeRecovery.racecourse_ids ?? []).length !== 5) fail('UAE detail recovery must retain five approved racecourse IDs');\n}\n\nconst uaeTransition = (registry.records ?? []).find((record) => postBackfillTransitionIds.has(record.readiness_id));`,
);
if (!backfill.includes('postBackfillRecoveryIds') || !backfill.includes('UAE detail recovery readiness record is missing')) {
  throw new Error('readiness backfill checker synchronization failed');
}
fs.writeFileSync(backfillCheckerPath, backfill);

console.log(JSON.stringify({
  schedule_readiness_id: scheduleId,
  detail_readiness_id: detailId,
  readiness_records: registry.records.length,
  schedule_rank: scheduleRecord.technical_rank,
  detail_rank: detailRecord.technical_rank,
}));
