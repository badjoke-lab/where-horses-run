import { readFileSync } from 'node:fs';
import path from 'node:path';
import { loadCalendarReadinessV1 } from './timetable/load-calendar-readiness.mjs';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const read = (file) => readFileSync(path.join(root, file), 'utf8');
const json = (file) => JSON.parse(read(file));

const audit = json('data/audits/calendar-jra-a-plus-pilot-completion.json');
const report = json('data/generated/timetable/jra-refresh-report.json');
const candidates = json('data/candidates/japan-jra-candidates.json');
const list = json('data/generated/timetable/public/meeting-list.json');
const details = json('data/generated/timetable/public/meeting-details.json');
const overrides = json('data/generated/timetable/public/japan-a-plus-overrides.json');
const runtime = json('data/static/japan-a-plus-runtime-control.json');
const readiness = loadCalendarReadinessV1(root);

if (audit.schema_version !== 'calendar-jra-a-plus-pilot-completion-v1') fail('audit schema');
if (audit.work_id !== 'WHR-CAL-JAPAN-JRA-A-PLUS' || audit.status !== 'complete') fail('audit state');
if (audit.next_work_id !== 'WHR-CAL-JAPAN-NAR-A-PLUS') fail('next Work ID');
if (audit.following_work_id !== 'WHR-CAL-JAPAN-BANEI-A-PLUS') fail('following Work ID');

const ready = readiness.records.find((record) => record.readiness_id === 'japan--japan-jra-system--jra-programme');
if (!ready || ready.technical_rank !== 'A+' || ready.public_ceiling !== 'A+') fail('JRA readiness');
const control = runtime.records.find((record) => record.system_id === 'japan-jra-system');
if (!control || control.public_projection_activation !== 'active') fail('JRA runtime activation');

if (report.refresh_window?.from !== '2026-07-01' || report.refresh_window?.to !== '2026-07-31') fail('refresh window');
if (report.publishable_meetings !== 24 || report.a_plus_meetings !== 24 || report.a_level_meetings !== 0) fail('refresh result');
if (candidates.records?.length !== 24 || candidates.review?.status !== 'needs_review') fail('candidate result');

const julyMeetings = list.meetings.filter((meeting) => meeting.country_id === 'japan' && meeting.authority_id === 'jra' && meeting.date?.startsWith('2026-07') && meeting.effective_public_rank === 'A+');
const julyIds = new Set(julyMeetings.map((meeting) => meeting.meeting_id));
const julyDetails = details.details.filter((detail) => julyIds.has(detail.meeting_id));
const allJraDetails = details.details.filter((detail) => detail.country_id === 'japan' && detail.authority_id === 'jra');
const julyRows = julyDetails.reduce((sum, detail) => sum + detail.timetable_rows.length, 0);
const allRows = allJraDetails.reduce((sum, detail) => sum + detail.timetable_rows.length, 0);
if (julyMeetings.length !== 24 || julyDetails.length !== 24 || julyRows !== 288) fail('July public baseline');
if (allJraDetails.length !== 25 || allRows !== 300) fail('total JRA public baseline');

const allowed = new Set(audit.public_baseline.allowed_fields);
for (const detail of allJraDetails) {
  if (detail.effective_public_rank !== 'A+') fail(`${detail.meeting_id}: rank`);
  for (const row of detail.timetable_rows) {
    for (const key of Object.keys(row)) if (!allowed.has(key)) fail(`${detail.meeting_id}: ${key}`);
    for (const key of allowed) if (!(key in row) || row[key] === null || row[key] === '') fail(`${detail.meeting_id}: missing ${key}`);
  }
}
if (overrides.generated_at !== list.generated_at || overrides.generated_at !== details.generated_at) fail('override timestamp');

const manual = read('scripts/timetable/manual-refresh-jra.mjs');
for (const marker of ['sync-jra-derived-artifacts.mjs', "'push', '--force-with-lease'", "'pr', 'create'", 'rollbackGenerated']) {
  if (!manual.includes(marker)) fail(`manual refresh marker ${marker}`);
}
const scheduled = read('.github/workflows/timetable-scheduled-refresh.yml');
if (/^\s*schedule:/m.test(scheduled) || scheduled.includes('cron:')) fail('scheduled refresh active');

for (const file of ['START-HERE.md', 'docs/project-roadmap.md', 'docs/calendar/implementation-roadmap.md']) {
  const text = read(file);
  if (!text.includes('WHR-CAL-JAPAN-NAR-A-PLUS') || !text.includes('WHR-CAL-JAPAN-BANEI-A-PLUS')) fail(`${file}: transition`);
}

if (errors.length) {
  console.error(`CALENDAR_JRA_PILOT_COMPLETION: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}
console.log('CALENDAR_JRA_PILOT_COMPLETION: pass');
console.log(`JULY_MEETINGS: ${julyMeetings.length}`);
console.log(`JULY_ROWS: ${julyRows}`);
console.log(`TOTAL_JRA_DETAILS: ${allJraDetails.length}`);
console.log(`TOTAL_JRA_ROWS: ${allRows}`);
console.log('CURRENT_WORK_ID: WHR-CAL-JAPAN-NAR-A-PLUS');
console.log('NEXT_WORK_ID: WHR-CAL-JAPAN-BANEI-A-PLUS');
