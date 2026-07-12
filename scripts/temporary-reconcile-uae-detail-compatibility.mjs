import fs from 'node:fs';

const replaceRegex = (file, pattern, replacement, label) => {
  const current = fs.readFileSync(file, 'utf8');
  if (!pattern.test(current)) throw new Error(`${file}: ${label} marker missing`);
  fs.writeFileSync(file, current.replace(pattern, replacement));
};

const uaeCoreChecker = 'scripts/check-calendar-uae-era-season-calendar-core.mjs';
const uaeReplacement = `const readinessRecord = readiness.records.find((record) => record.readiness_id === baseline.readiness_id);
if (!readinessRecord) fail('UAE schedule readiness record missing.');
else {
  if (readinessRecord.country_id !== UAE_ERA_SEASON_CALENDAR_V1.country_id) fail('readiness country differs.');
  if (readinessRecord.system_id !== UAE_ERA_SEASON_CALENDAR_V1.system_id) fail('readiness system differs.');
  if (readinessRecord.technical_rank !== 'C' || readinessRecord.public_ceiling !== 'C') fail('current schedule readiness rank differs.');
  if (!exact(readinessRecord.racecourse_ids, ['meydan-racecourse', 'abu-dhabi-turf-club', 'al-ain-racecourse', 'jebel-ali-racecourse', 'sharjah-racecourse'])) fail('current schedule readiness racecourse IDs differ.');
  if (readinessRecord.readiness !== 'prototype_ready' || readinessRecord.implementation_status !== 'fixture_validated') fail('current schedule readiness implementation state differs.');
  if (readinessRecord.automation_mode !== 'semi_automatic') fail('current schedule readiness automation mode differs.');
  if (readinessRecord.confirmed_fields?.meeting_date !== true || readinessRecord.confirmed_fields?.racecourse !== true) fail('readiness C fields missing.');
  for (const field of ['first_race_time', 'last_race_time', 'per_race_post_times', 'race_name', 'distance', 'surface', 'course']) {
    if (readinessRecord.confirmed_fields?.[field] !== false) fail('schedule readiness field ' + field + ' must remain false.');
  }
}
const detailReadinessRecord = readiness.records.find((record) => record.readiness_id === 'united-arab-emirates--uae-national-racing-system--era-racecard-public-timetable');
if (!detailReadinessRecord) fail('UAE detail recovery readiness record missing.');
else {
  if (detailReadinessRecord.technical_rank !== 'A' || detailReadinessRecord.public_ceiling !== 'A') fail('UAE detail recovery rank differs.');
  if (detailReadinessRecord.authority_source_key !== 'united-arab-emirates/emirates-racing-authority/era-racecard-public-timetable') fail('UAE detail recovery source differs.');
}

if (sourceTest`;
replaceRegex(
  uaeCoreChecker,
  /const readinessRecord = readiness\.records\.find\([\s\S]*?\n}\n\nif \(sourceTest/,
  uaeReplacement,
  'current schedule readiness block',
);

const hkjcChecker = 'scripts/check-calendar-hkjc-pilot-reconciliation.mjs';
const hkjcReplacement = `for (const [label, text] of [['project roadmap', projectRoadmap], ['implementation roadmap', implementationRoadmap]]) {
  if (!text.includes('Completed Work ID:') || !text.includes('WHR-CAL-HONG-KONG-HKJC')) fail(label + ' missing completed HKJC Work ID.');
  if (!text.includes('Current Work ID:') || !text.includes('WHR-CAL-PUBLIC-V1')) fail(label + ' missing current Public v1 Work ID.');
  if (!text.includes('HKJC-PILOT-02')) fail(label + ' missing HKJC-PILOT-02 history marker.');
}`;
replaceRegex(
  hkjcChecker,
  /for \(const \[label, text\] of \[\['project roadmap',[\s\S]*?\n}\n\nif \(errors\.length\)/,
  `${hkjcReplacement}\n\nif (errors.length)`,
  'roadmap history/current Work ID block',
);

console.log('UAE_DETAIL_COMPATIBILITY_SYNC: applied');
