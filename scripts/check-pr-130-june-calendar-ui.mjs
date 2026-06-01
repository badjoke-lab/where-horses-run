import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const expectedGroups = [
  ['japan', 'jra'],
  ['japan', 'nar'],
  ['japan', 'banei'],
  ['hong-kong', 'hkjc'],
  ['united-arab-emirates', 'era'],
  ['united-kingdom', 'bha'],
  ['united-kingdom', 'point-to-point'],
  ['united-kingdom', 'purebred-arabian'],
  ['ireland', 'hri'],
  ['france', 'france-galop'],
  ['france', 'letrot'],
  ['australia', 'racing-australia-thoroughbred'],
  ['australia', 'harness-australia'],
  ['new-zealand', 'loveracing-thoroughbred'],
  ['new-zealand', 'hrnz-harness'],
  ['canada', 'woodbine-thoroughbred'],
  ['canada', 'standardbred-canada'],
  ['south-africa', 'nhra'],
  ['south-africa', '4racing'],
  ['south-africa', 'gold-circle'],
  ['south-korea', 'kra'],
  ['singapore', 'singapore-turf-club'],
  ['united-states', 'equibase-thoroughbred'],
  ['united-states', 'usta-harness'],
  ['united-states', 'aqha-quarter-horse']
];

const terminalCoverageStatuses = new Set(['no_june_meetings', 'legacy_no_active_racing']);

function fail(message) {
  console.error(`[pr-130-june-calendar-ui] ${message}`);
  process.exit(1);
}

function read(relativePath) {
  const filePath = path.join(root, relativePath);
  if (!fs.existsSync(filePath)) fail(`Missing file: ${relativePath}`);
  return fs.readFileSync(filePath, 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

function slug(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function expandRecordSets(data) {
  if (Array.isArray(data.records)) return data.records;
  if (!Array.isArray(data.record_sets)) fail('Expected records or record_sets.');
  return data.record_sets.flatMap((set) => {
    if (!Array.isArray(set.meetings) || set.meetings.length < 1) fail(`${set.country_id}/${set.group_id}: meetings missing.`);
    return set.meetings.map(([meetingDate, racecourse]) => ({
      record_id: `june-2026-${set.country_id}-${set.group_id}-${meetingDate}-${slug(racecourse)}`,
      country_id: set.country_id,
      country_label: set.country_label,
      group_id: set.group_id,
      group_label: set.group_label,
      racecourse,
      meeting_date: meetingDate,
      data_level: set.data_level,
      data_origin: 'real_source',
      first_race_time: null,
      all_race_times: [],
      source_trace: set.source_trace,
      freshness: {
        status: 'real_source_checked',
        basis: 'official_month_calendar',
        source_capture_date: set.source_trace?.source_capture_date,
        last_checked: set.source_trace?.last_checked
      }
    }));
  });
}

function groupKey(item) {
  return `${item.country_id}::${item.group_id}`;
}

const data = readJson('data/generated/timetable/june-2026-calendar.json');
const page = read('src/pages/major-countries/current-timetable.astro');
const records = expandRecordSets(data);
const coverageStatus = data.coverage_status ?? [];

if (data.schema_version !== 'june-2026-calendar-v0') fail('Unexpected schema.');
if (data.month !== '2026-06') fail('Unexpected month.');
if (!page.includes('june-2026-calendar.json')) fail('Current timetable page must import June calendar data.');
if (!page.includes('expandRecordSets')) fail('Current timetable page must expand record_sets.');
if (!page.includes('coverage_status')) fail('Current timetable page must expose coverage_status notes.');

const satisfiedGroupKeys = new Set(records.map(groupKey));
for (const statusRecord of coverageStatus) {
  if (!terminalCoverageStatuses.has(statusRecord.status)) fail(`${groupKey(statusRecord)}: unsupported coverage status ${statusRecord.status}.`);
  if (!statusRecord.source_trace?.source_url?.startsWith('https://')) fail(`${groupKey(statusRecord)}: source URL missing.`);
  if (!statusRecord.source_trace?.parser) fail(`${groupKey(statusRecord)}: parser missing.`);
  if (!statusRecord.source_trace?.last_checked) fail(`${groupKey(statusRecord)}: last_checked missing.`);
  satisfiedGroupKeys.add(groupKey(statusRecord));
}

for (const [countryId, groupId] of expectedGroups) {
  if (!satisfiedGroupKeys.has(`${countryId}::${groupId}`)) fail(`Missing June coverage for ${countryId}/${groupId}.`);
}

for (const record of records) {
  if (record.data_origin !== 'real_source') fail(`${record.record_id}: data_origin must be real_source.`);
  if (!['A', 'B', 'C'].includes(record.data_level)) fail(`${record.record_id}: data_level must be A/B/C.`);
  if (!record.meeting_date?.startsWith('2026-06-')) fail(`${record.record_id}: meeting_date must be in June 2026.`);
  if (!record.racecourse) fail(`${record.record_id}: racecourse missing.`);
  if (!record.source_trace?.source_url?.startsWith('https://')) fail(`${record.record_id}: source URL missing.`);
  if (!record.source_trace?.parser) fail(`${record.record_id}: parser missing.`);
  if (!record.source_trace?.last_checked) fail(`${record.record_id}: last_checked missing.`);
}

for (const value of [...records, ...coverageStatus]) {
  const serialized = JSON.stringify(value).toLowerCase();
  for (const forbidden of ['fixture_source', 'sample', 'mock', 'needs_review', 'not_checked']) {
    if (serialized.includes(forbidden)) fail(`${groupKey(value)}: forbidden marker ${forbidden}.`);
  }
}

console.log('[pr-130-june-calendar-ui] PASS');
