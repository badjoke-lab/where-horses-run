import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const allowEmpty = process.argv.includes('--allow-empty');
const candidatePath = path.join(root, 'data/candidates/banei-monthly-2026-07-full-month-candidates.json');
const reportPath = path.join(root, 'data/generated/timetable/banei-monthly-2026-07-full-month-collection-report.json');
const expectedDates = [
  '2026-07-04', '2026-07-05', '2026-07-06',
  '2026-07-11', '2026-07-12', '2026-07-13',
  '2026-07-18', '2026-07-19', '2026-07-20',
  '2026-07-25', '2026-07-26', '2026-07-27',
];
const errors = [];
const fail = (message) => errors.push(message);

if ((!fs.existsSync(candidatePath) || !fs.existsSync(reportPath)) && allowEmpty) {
  console.log('CALENDAR_BANEI_FULL_MONTH_CANDIDATE_SET: empty-allowed');
  process.exit(0);
}
if (!fs.existsSync(candidatePath)) fail('Banei full-month candidate file is missing.');
if (!fs.existsSync(reportPath)) fail('Banei full-month report file is missing.');

const readJson = (file) => fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null;
const candidates = readJson(candidatePath);
const report = readJson(reportPath);

if (candidates?.schema_version !== 'banei-full-month-candidate-set-v1') fail('candidate schema differs.');
if (report?.schema_version !== 'banei-full-month-collection-report-v1') fail('report schema differs.');
if (candidates?.work_id !== 'WHR-CAL-JAPAN-BANEI-A-PLUS' || report?.work_id !== 'WHR-CAL-JAPAN-BANEI-A-PLUS') fail('Banei Work ID differs.');
if (candidates?.target_month !== '2026-07' || report?.target_month !== '2026-07') fail('target month must be 2026-07.');
for (const value of [candidates, report]) {
  if (value?.month_start !== '2026-07-01' || value?.month_end !== '2026-07-31' || value?.through_date !== null) fail('full-month boundary differs.');
}
if (candidates?.generated_at !== report?.generated_at) fail('candidate/report generated_at differs.');
if (!String(report?.official_schedule_url ?? '').startsWith('https://www.banei-keiba.or.jp/race_schedule.php')) fail('official Banei schedule URL differs.');
if (report?.schedule_http_status !== 200) fail('Banei schedule HTTP status must be 200.');
if (!['utf-8', 'shift_jis'].includes(report?.schedule_encoding)) fail('Banei schedule encoding differs.');
if (report?.racecourse_id !== 'obihiro-racecourse') fail('Banei racecourse scope must be Obihiro only.');
if (report?.schedule_scope_complete !== true || report?.partial_cutoff_completion_allowed !== false) fail('Banei full-month completion boundary differs.');
if (report?.publication_effect !== 'none') fail('collection publication effect must remain none.');

if (candidates?.review?.status !== 'needs_review' || candidates?.review?.promotion_eligible !== false) fail('candidate review status differs.');
if (candidates?.review?.canonical_write !== 'disabled' || candidates?.review?.public_write !== 'disabled' || candidates?.review?.raw_source_storage !== 'disabled') fail('candidate write boundary differs.');
if (candidates?.source?.source_id !== 'banei-official-schedule') fail('candidate source ID differs.');
if (candidates?.source?.storage_policy !== 'public_safe_extracted_fields_only_no_raw_html') fail('candidate storage policy differs.');

const meetings = candidates?.meetings ?? [];
const dates = meetings.map((meeting) => meeting.date).sort();
if (JSON.stringify(dates) !== JSON.stringify(expectedDates)) fail(`Banei July meeting dates differ: ${dates.join(', ')}`);
if (report?.meetings_scheduled !== expectedDates.length) fail('Banei July meeting count must be 12.');
if (JSON.stringify((report?.meeting_dates ?? []).slice().sort()) !== JSON.stringify(expectedDates)) fail('report meeting dates differ.');
if (new Set(dates).size !== dates.length) fail('duplicate Banei meeting dates found.');
if (report?.time_summary_available + report?.pending_detail_meetings !== report?.meetings_scheduled) fail('Banei meeting-state counts do not sum to scheduled meetings.');

for (const meeting of meetings) {
  const prefix = meeting.meeting_id ?? meeting.date ?? 'unknown';
  if (meeting.meeting_id !== `banei-obihiro-racecourse-${meeting.date}`) fail(`${prefix} meeting ID differs.`);
  if (meeting.country_id !== 'japan' || meeting.authority_id !== 'banei-tokachi' || meeting.racing_system_id !== 'japan-banei-system') fail(`${prefix} identity differs.`);
  if (meeting.racecourse_id !== 'obihiro-racecourse' || meeting.timezone !== 'Asia/Tokyo') fail(`${prefix} racecourse/timezone differs.`);
  if (!['time_summary_available', 'scheduled_pending_details'].includes(meeting.schedule_status)) fail(`${prefix} schedule status differs.`);
  if (meeting.schedule_status === 'time_summary_available') {
    if (!/^\d{2}:\d{2}$/.test(meeting.first_race_time_local ?? '') || !/^\d{2}:\d{2}$/.test(meeting.last_race_time_local ?? '')) fail(`${prefix} time summary is incomplete.`);
  } else if (meeting.first_race_time_local !== null || meeting.last_race_time_local !== null) {
    fail(`${prefix} pending-detail meeting must not invent race times.`);
  }
}

const serialized = `${JSON.stringify(candidates)} ${JSON.stringify(report)}`.toLowerCase();
for (const forbidden of ['horse_name', 'jockey_name', 'trainer_name', 'odds', 'payout', 'prediction', 'raw_html', 'source_body', 'stream_url']) {
  if (serialized.includes(`\"${forbidden}\"`)) fail(`forbidden key present: ${forbidden}`);
}

if (errors.length) {
  console.error(`CALENDAR_BANEI_FULL_MONTH_CANDIDATE_SET: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}
console.log('CALENDAR_BANEI_FULL_MONTH_CANDIDATE_SET: pass');
console.log(`MEETINGS_SCHEDULED: ${meetings.length}`);
console.log(`TIME_SUMMARY_AVAILABLE: ${report.time_summary_available}`);
console.log(`PENDING_DETAILS: ${report.pending_detail_meetings}`);
console.log('MONTH_BOUNDARY: 2026-07-01..2026-07-31');
console.log('PUBLICATION_EFFECT: none');
