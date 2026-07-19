import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const paths = {
  jra: 'data/candidates/jra-horizon-recovery-2026-08-01-through-2026-08-16.json',
  banei: 'data/candidates/banei-horizon-recovery-2026-08-15-through-2026-08-17.json',
  canonical: 'data/generated/timetable/canonical/meetings.json',
  publicMeetings: 'data/generated/timetable/public/meeting-list.json',
  audit: 'data/audits/calendar-current-horizon-recovery-2026-07-19-v1.json',
  duePolicy: 'data/static/calendar-due-job-policy-v1.json',
};

const jra = readJson(paths.jra);
const banei = readJson(paths.banei);
const canonical = readJson(paths.canonical);
const publicMeetings = readJson(paths.publicMeetings);
const audit = readJson(paths.audit);
const duePolicy = readJson(paths.duePolicy);

const expectedJraDates = ['2026-08-01', '2026-08-02', '2026-08-08', '2026-08-09', '2026-08-15', '2026-08-16'];
const expectedJraRacecourses = ['chukyo-racecourse', 'niigata-racecourse', 'sapporo-racecourse'];
const expectedBaneiDates = ['2026-08-15', '2026-08-16', '2026-08-17'];
const expectedJraUrls = new Map(expectedJraDates.map((date) => [
  date,
  `https://www.jra.go.jp/keiba/calendar2026/2026/8/${date.slice(5, 7)}${date.slice(8, 10)}.html`,
]));
const expectedBaneiUrl = 'https://sp.keiba.go.jp/KeibaWebSP/MonthlyConveneInfo/S_ConveneNiteiRacecourse?k_jyo=%E5%B8%AF%E5%BA%83%E3%81%B0&k_month=8&k_year=2026';

function validateDataset(dataset, expected) {
  if (dataset.schema_version !== 'timetable-candidate-v1') fail(`${expected.label} schema_version differs`);
  if (dataset.generated_at !== '2026-07-19T15:15:00Z') fail(`${expected.label} generated_at differs`);
  if (dataset.adapter_id !== expected.adapterId) fail(`${expected.label} adapter_id differs`);
  if (dataset.country_id !== 'japan') fail(`${expected.label} country_id differs`);
  if (dataset.authority_id !== expected.authorityId) fail(`${expected.label} authority_id differs`);
  if (dataset.source_id !== expected.sourceId) fail(`${expected.label} source_id differs`);
  if (!exact(dataset.candidate_window, expected.window)) fail(`${expected.label} candidate_window differs`);
  if (!Array.isArray(dataset.records) || dataset.records.length !== expected.recordCount) fail(`${expected.label} record count differs`);
  if (!dataset.review || dataset.review.status !== 'needs_review') fail(`${expected.label} top-level review must need review`);
  if (dataset.review?.reviewed_at !== null || dataset.review?.reviewer !== null || dataset.review?.promotion_target !== null) {
    fail(`${expected.label} review metadata must not imply approval or promotion`);
  }

  const candidateIds = new Set();
  const meetingIds = new Set();
  for (const [index, record] of (dataset.records ?? []).entries()) {
    const location = `${expected.label}.records[${index}]`;
    if (candidateIds.has(record.candidate_id)) fail(`${location} duplicate candidate_id`);
    if (meetingIds.has(record.meeting_id)) fail(`${location} duplicate meeting_id`);
    candidateIds.add(record.candidate_id);
    meetingIds.add(record.meeting_id);
    if (record.country_id !== 'japan' || record.authority_id !== expected.authorityId || record.racing_system_id !== expected.systemId) fail(`${location} identity differs`);
    if (record.capability_rank !== 'C') fail(`${location} must remain C rank`);
    if (record.first_race_time_local !== null || record.last_race_time_local !== null) fail(`${location} must not claim race times`);
    if (!Array.isArray(record.timetable_rows) || record.timetable_rows.length !== 0) fail(`${location} must not claim timetable rows`);
    if (record.confidence !== 'medium') fail(`${location} confidence differs`);
    if (record.review_status !== 'needs_review') fail(`${location} must remain needs_review`);
    if (record.source?.source_id !== expected.sourceId || record.source?.checked_at !== '2026-07-19T15:15:00Z' || record.source?.extraction_method !== 'reviewed_snapshot') fail(`${location} source metadata differs`);
    if (typeof record.source?.official_url !== 'string' || !record.source.official_url.startsWith('https://')) fail(`${location} official URL invalid`);
    if (typeof record.notes !== 'string' || !record.notes.includes('No race times or programme rows are claimed')) fail(`${location} bounded-evidence note missing`);
  }
}

validateDataset(jra, {
  label: 'JRA',
  adapterId: 'jra-horizon-recovery-reviewed-programme-v1',
  authorityId: 'jra',
  systemId: 'japan-jra-system',
  sourceId: 'jra-programme',
  window: { start_date: '2026-08-01', end_date_exclusive: '2026-08-17', timezone: 'Asia/Tokyo' },
  recordCount: 18,
});
validateDataset(banei, {
  label: 'Banei',
  adapterId: 'banei-horizon-recovery-reviewed-schedule-v1',
  authorityId: 'banei-tokachi',
  systemId: 'japan-banei-system',
  sourceId: 'banei-official-schedule',
  window: { start_date: '2026-08-15', end_date_exclusive: '2026-08-18', timezone: 'Asia/Tokyo' },
  recordCount: 3,
});

const jraByDate = new Map();
for (const record of jra.records ?? []) {
  if (!expectedJraDates.includes(record.date)) fail(`unexpected JRA date ${record.date}`);
  if (!expectedJraRacecourses.includes(record.racecourse_id)) fail(`unexpected JRA racecourse ${record.racecourse_id}`);
  if (record.meeting_id !== `jra-${record.racecourse_id}-${record.date}`) fail(`JRA meeting ID differs for ${record.date}/${record.racecourse_id}`);
  if (record.candidate_id !== `candidate-${record.meeting_id}`) fail(`JRA candidate ID differs for ${record.meeting_id}`);
  if (record.source.official_url !== expectedJraUrls.get(record.date)) fail(`JRA official URL differs for ${record.date}`);
  const values = jraByDate.get(record.date) ?? [];
  values.push(record.racecourse_id);
  jraByDate.set(record.date, values);
}
for (const date of expectedJraDates) {
  if (!exact((jraByDate.get(date) ?? []).sort(), [...expectedJraRacecourses].sort())) fail(`JRA racecourse set differs for ${date}`);
}

if (!exact((banei.records ?? []).map((record) => record.date), expectedBaneiDates)) fail('Banei recovery dates differ');
for (const record of banei.records ?? []) {
  if (record.racecourse_id !== 'obihiro-racecourse') fail(`Banei racecourse differs for ${record.date}`);
  if (record.meeting_id !== `banei-obihiro-racecourse-${record.date}`) fail(`Banei meeting ID differs for ${record.date}`);
  if (record.candidate_id !== `candidate-${record.meeting_id}`) fail(`Banei candidate ID differs for ${record.date}`);
  if (record.source.official_url !== expectedBaneiUrl) fail(`Banei official URL differs for ${record.date}`);
}

const canonicalIds = new Set((canonical.meetings ?? []).map((meeting) => meeting.meeting_id));
const publicIds = new Set((publicMeetings.meetings ?? []).map((meeting) => meeting.meeting_id));
for (const record of [...(jra.records ?? []), ...(banei.records ?? [])]) {
  if (canonicalIds.has(record.meeting_id)) fail(`recovery candidate already exists in Canonical: ${record.meeting_id}`);
  if (publicIds.has(record.meeting_id)) fail(`recovery candidate already exists in public projection: ${record.meeting_id}`);
}

const auditBySystem = new Map((audit.systems ?? []).map((record) => [record.system_id, record]));
if (!exact(auditBySystem.get('japan-jra-system')?.expected_meeting_dates, expectedJraDates)) fail('JRA candidates differ from recovery audit dates');
if (!exact(auditBySystem.get('japan-banei-system')?.expected_meeting_dates, expectedBaneiDates)) fail('Banei candidates differ from recovery audit dates');

const baneiRule = duePolicy.system_rules.find((rule) => rule.system_id === 'japan-banei-system');
if (!baneiRule || baneiRule.regular_refresh.enabled || baneiRule.coverage_gap.enabled || baneiRule.source_revalidation.enabled) {
  fail('Banei ordinary daily acquisition boundary changed while adding manual candidates');
}

const serialized = JSON.stringify({ jra, banei }).toLowerCase();
for (const prohibited of ['horse_name', 'jockey', 'trainer', 'owner', 'breeder', 'odds', 'payout', 'prediction', 'raw_html', 'credential', 'cookie', 'secret']) {
  if (serialized.includes(prohibited)) fail(`recovery candidates contain prohibited fragment ${prohibited}`);
}

if (errors.length) {
  console.error(`CALENDAR_HORIZON_RECOVERY_CANDIDATES: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CALENDAR_HORIZON_RECOVERY_CANDIDATES: pass');
console.log('JRA_CANDIDATES: 18 / C / needs_review');
console.log('BANEI_CANDIDATES: 3 / C / needs_review');
console.log('NAR_CANDIDATES: separate hosted acquisition path');
console.log('CANONICAL_WRITES: none');
console.log('PUBLIC_WRITES: none');
