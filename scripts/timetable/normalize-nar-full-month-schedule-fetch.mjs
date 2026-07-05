import fs from 'node:fs';
import path from 'node:path';
import { parseNarMonthlyScheduleGrid } from './parse-nar-monthly-schedule-grid.mjs';

const root = process.cwd();
const nativeFetch = globalThis.fetch;
const month = '2026-07';
const matrixPath = 'data/static/nar-flat-racecourse-compatibility-v1.json';
const legacyCandidatePath = 'data/candidates/nar-monthly-meeting-candidates.json';
const legacyReportPath = 'data/generated/timetable/nar-monthly-collection-report.json';
const outputCandidatePath = 'data/candidates/nar-monthly-2026-07-full-month-candidates.json';
const outputReportPath = 'data/generated/timetable/nar-monthly-2026-07-full-month-collection-report.json';
const matrix = JSON.parse(fs.readFileSync(path.join(root, matrixPath), 'utf8'));
const originalCandidate = fs.readFileSync(path.join(root, legacyCandidatePath), 'utf8');
const originalReport = fs.readFileSync(path.join(root, legacyReportPath), 'utf8');
let schedule = null;
let scheduleMeta = null;

function decodeSchedule(buffer) {
  const tokens = ['月別開催日程', ...matrix.records.map((record) => record.name_ja)];
  return ['utf-8', 'shift_jis'].map((encoding) => {
    try {
      const body = new TextDecoder(encoding).decode(buffer);
      const score = tokens.reduce((sum, token) => sum + body.split(token).length - 1, 0);
      return { encoding, body, score };
    } catch {
      return { encoding, body: '', score: -1 };
    }
  }).sort((a, b) => b.score - a.score)[0];
}

function writeJson(relativePath, value) {
  const absolute = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, `${JSON.stringify(value, null, 2)}\n`);
}

function tokyoDate() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

const asOfDateArg = process.argv.find((value) => value.startsWith('--as-of-date='));
const asOfDate = asOfDateArg ? asOfDateArg.slice('--as-of-date='.length) : tokyoDate();
if (!/^2026-07-\d{2}$/.test(asOfDate)) throw new Error('full-month NAR as-of date must be inside 2026-07.');

globalThis.fetch = async (input, init) => {
  const response = await nativeFetch(input, init);
  const requestUrl = typeof input === 'string' || input instanceof URL ? String(input) : input.url;
  if (!requestUrl.includes('/MonthlyConveneInfo/MonthlyConveneInfoTop')) return response;

  const bytes = Buffer.from(await response.arrayBuffer());
  const decoded = decodeSchedule(bytes);
  schedule = parseNarMonthlyScheduleGrid({
    html: decoded.body,
    month,
    venues: matrix.records.map((record) => ({
      venue_code: record.venue_code,
      racecourse_id: record.racecourse_id,
      name_en: record.name_en,
      name_ja: record.name_ja,
    })),
  });
  scheduleMeta = { url: response.url, status: response.status, encoding: decoded.encoding };
  const anchors = schedule.records.flatMap((record) => record.meetings)
    .map((meeting) => `<a href="${meeting.race_list_url.replaceAll('&', '&amp;')}"></a>`)
    .join('\n');
  const body = Buffer.from(`<html><body>${anchors}</body></html>`, 'utf8');
  const arrayBuffer = body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength);
  return { ok: response.ok, status: response.status, url: response.url, arrayBuffer: async () => arrayBuffer };
};

process.argv.push(`--month=${month}`, '--allow-blockers');
try {
  await import('./collect-nar-monthly-candidates.mjs');
} finally {
  globalThis.fetch = nativeFetch;
}

if (!schedule) throw new Error('full-month NAR schedule grid was not parsed.');
const legacyCandidates = JSON.parse(fs.readFileSync(path.join(root, legacyCandidatePath), 'utf8'));
const legacyReport = JSON.parse(fs.readFileSync(path.join(root, legacyReportPath), 'utf8'));
fs.writeFileSync(path.join(root, legacyCandidatePath), originalCandidate);
fs.writeFileSync(path.join(root, legacyReportPath), originalReport);

const scheduleMeetings = schedule.records.flatMap((record) => record.meetings.map((meeting) => ({
  meeting_id: `nar-${record.racecourse_id}-${meeting.date}`,
  venue_code: record.venue_code,
  racecourse_id: record.racecourse_id,
  racecourse_name_en: record.name_en,
  racecourse_name_ja: record.name_ja,
  date: meeting.date,
  timezone: 'Asia/Tokyo',
  official_race_list_url: meeting.race_list_url,
  race_list_linked_from_schedule: meeting.race_list_linked_from_schedule,
  schedule_status: 'scheduled',
})));
const pendingDetails = [];
const blockers = [];
for (const blocker of legacyCandidates.blockers ?? []) {
  if (blocker.date > asOfDate) pendingDetails.push({ ...blocker, status: 'scheduled_pending_details' });
  else blockers.push(blocker);
}
const generatedAt = new Date().toISOString();
const venueStatuses = schedule.records.map((record) => ({
  venue_code: record.venue_code,
  racecourse_id: record.racecourse_id,
  status: record.meetings.length ? 'has_target_month_meetings' : 'no_meeting_in_target_month',
  meeting_count: record.meetings.length,
  meeting_dates: record.meeting_dates,
}));
const report = {
  schema_version: 'nar-full-month-collection-report-v1', generated_at: generatedAt,
  work_id: 'WHR-CAL-JAPAN-NAR-A-PLUS', target_month: month,
  month_start: '2026-07-01', month_end: '2026-07-31', through_date: null, as_of_date: asOfDate,
  official_schedule_url: scheduleMeta?.url ?? legacyReport.official_schedule_url,
  schedule_http_status: scheduleMeta?.status ?? null, schedule_encoding: scheduleMeta?.encoding ?? null,
  racecourses_checked: venueStatuses.length,
  racecourses_with_meetings: venueStatuses.filter((row) => row.status === 'has_target_month_meetings').length,
  racecourses_without_meetings: venueStatuses.filter((row) => row.status === 'no_meeting_in_target_month').length,
  meetings_scheduled: scheduleMeetings.length,
  complete_a_plus_candidates: legacyCandidates.meetings.length,
  pending_detail_meetings: pendingDetails.length,
  blocked_meetings: blockers.length,
  schedule_scope_complete: true,
  a_plus_detail_scope_complete: pendingDetails.length === 0 && blockers.length === 0,
  partial_cutoff_completion_allowed: false,
  publication_effect: 'none', venue_statuses: venueStatuses, pending_details: pendingDetails, blockers,
};
const candidates = {
  schema_version: 'nar-full-month-candidate-set-v1', generated_at: generatedAt,
  work_id: report.work_id, target_month: month,
  month_start: report.month_start, month_end: report.month_end, through_date: null, as_of_date: asOfDate,
  source: { official_schedule_url: report.official_schedule_url, matrix_path: matrixPath },
  review: { status: 'needs_review', promotion_eligible: false, canonical_write: 'disabled', public_write: 'disabled', raw_source_storage: 'disabled' },
  venue_statuses: venueStatuses, schedule_meetings: scheduleMeetings,
  a_plus_meetings: legacyCandidates.meetings, pending_details: pendingDetails, blockers,
};
writeJson(outputCandidatePath, candidates);
writeJson(outputReportPath, report);
console.log(JSON.stringify(report, null, 2));
console.log(`[nar-full-month] scheduled=${scheduleMeetings.length} a_plus=${legacyCandidates.meetings.length} pending=${pendingDetails.length} blockers=${blockers.length}`);
