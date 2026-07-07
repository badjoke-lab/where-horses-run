import fs from 'node:fs';
import path from 'node:path';
import { parseNarMonthlyScheduleGrid } from './parse-nar-monthly-schedule-grid.mjs';
import { parseMeetingId, raceListUrl } from './nar-incremental-core.mjs';

const nativeFetch = globalThis.fetch;
const root = process.cwd();
const matrixPath = path.join(root, 'data/static/nar-flat-racecourse-compatibility-v1.json');
const reportPath = path.join(root, 'data/generated/timetable/nar-monthly-collection-report.json');
const scheduleScratchPath = path.join(root, 'data/generated/timetable/nar-schedule-observation-scratch.json');
const matrix = JSON.parse(fs.readFileSync(matrixPath, 'utf8'));

function parseArgs(argv) {
  const args = {
    month: null,
    startDate: null,
    endDateExclusive: null,
    meetingIds: [],
  };
  for (const value of argv) {
    if (value.startsWith('--month=')) args.month = value.slice('--month='.length);
    else if (value.startsWith('--start-date=')) args.startDate = value.slice('--start-date='.length);
    else if (value.startsWith('--end-date-exclusive=')) args.endDateExclusive = value.slice('--end-date-exclusive='.length);
    else if (value.startsWith('--meeting-id=')) args.meetingIds.push(value.slice('--meeting-id='.length));
    else if (value.startsWith('--meeting-ids=')) args.meetingIds.push(...value.slice('--meeting-ids='.length).split(',').filter(Boolean));
    else throw new Error(`Unknown argument: ${value}`);
  }
  if (!/^\d{4}-\d{2}$/.test(args.month ?? '')) throw new Error('--month=YYYY-MM is required.');
  args.meetingIds = [...new Set(args.meetingIds)].sort();
  const selectedMode = args.meetingIds.length > 0;
  const windowMode = args.startDate !== null || args.endDateExclusive !== null;
  if (selectedMode === windowMode) throw new Error('Provide either start/end window or selected meeting IDs.');
  if (windowMode) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(args.startDate ?? '') || !/^\d{4}-\d{2}-\d{2}$/.test(args.endDateExclusive ?? '')) {
      throw new Error('Date-window arguments must use YYYY-MM-DD.');
    }
    if (args.startDate >= args.endDateExclusive) throw new Error('end-date-exclusive must be after start-date.');
  }
  return { ...args, selectedMode, windowMode };
}

function decodeSchedule(buffer) {
  const venueTokens = matrix.records.map((record) => record.name_ja);
  const tokens = ['地方競馬', '開催', ...venueTokens];
  return ['utf-8', 'shift_jis']
    .map((encoding) => {
      try {
        const body = new TextDecoder(encoding).decode(buffer);
        const score = tokens.reduce((sum, token) => sum + body.split(token).length - 1, 0);
        return { encoding, body, score };
      } catch {
        return { encoding, body: '', score: -1 };
      }
    })
    .sort((a, b) => b.score - a.score)[0];
}

function syntheticResponse(response, anchors) {
  const body = Buffer.from(`<html><body>\n${anchors}\n</body></html>\n`, 'utf8');
  const arrayBuffer = body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength);
  return {
    ok: response.ok,
    status: response.status,
    url: response.url,
    arrayBuffer: async () => arrayBuffer,
  };
}

function scheduleMeetingRecord(record, meeting, officialScheduleUrl) {
  const meetingId = `nar-${record.racecourse_id}-${meeting.date}`;
  return {
    meeting_id: meetingId,
    venue_code: record.venue_code,
    racecourse_id: record.racecourse_id,
    racecourse_name_en: record.name_en,
    racecourse_name_ja: record.name_ja,
    date: meeting.date,
    timezone: 'Asia/Tokyo',
    schedule_marker: meeting.schedule_marker,
    race_list_url: meeting.race_list_url,
    race_list_linked_from_schedule: meeting.race_list_linked_from_schedule,
    official_schedule_url: officialScheduleUrl,
  };
}

const args = parseArgs(process.argv.slice(2));
const selectedIds = new Set(args.meetingIds);
let scheduleMeetings = [];
let detailTargets = [];
let officialScheduleUrl = null;
let scheduleHttpStatus = null;
let scheduleEncoding = null;

const selectedDirectTargets = args.selectedMode
  ? args.meetingIds
      .map((meetingId) => parseMeetingId(meetingId, matrix.records))
      .filter((meeting) => meeting.month === args.month)
      .map((meeting) => ({
        meeting_id: meeting.meeting_id,
        venue_code: meeting.venue_code,
        racecourse_id: meeting.racecourse_id,
        date: meeting.date,
        race_list_url: raceListUrl(meeting.venue_code, meeting.date),
      }))
  : [];

globalThis.fetch = async (input, init) => {
  const response = await nativeFetch(input, init);
  const requestUrl = typeof input === 'string' || input instanceof URL ? String(input) : input.url;
  if (!requestUrl.includes('/MonthlyConveneInfo/MonthlyConveneInfoTop')) return response;

  const buffer = await response.arrayBuffer();
  const decoded = decodeSchedule(buffer);
  officialScheduleUrl = response.url;
  scheduleHttpStatus = response.status;
  scheduleEncoding = decoded.encoding;

  if (!response.ok) return syntheticResponse(response, '');

  const parsed = parseNarMonthlyScheduleGrid({ html: decoded.body, month: args.month, venues: matrix.records });
  const observed = [];
  for (const record of parsed.records) {
    for (const meeting of record.meetings ?? []) {
      const item = scheduleMeetingRecord(record, meeting, response.url);
      if (args.windowMode && !(item.date >= args.startDate && item.date < args.endDateExclusive)) continue;
      if (args.selectedMode && !selectedIds.has(item.meeting_id)) continue;
      observed.push(item);
    }
  }
  scheduleMeetings = observed.sort((a, b) => a.meeting_id.localeCompare(b.meeting_id));

  if (args.selectedMode) {
    detailTargets = selectedDirectTargets;
  } else {
    detailTargets = scheduleMeetings.map((meeting) => ({
      meeting_id: meeting.meeting_id,
      venue_code: meeting.venue_code,
      racecourse_id: meeting.racecourse_id,
      date: meeting.date,
      race_list_url: meeting.race_list_url,
    }));
  }

  const anchors = detailTargets
    .map((meeting) => `<a href="${meeting.race_list_url.replaceAll('&', '&amp;')}"></a>`)
    .join('\n');
  return syntheticResponse(response, anchors);
};

process.argv = [process.argv[0], process.argv[1], `--month=${args.month}`, '--allow-blockers'];
await import('./collect-nar-monthly-candidates.mjs');

if (!fs.existsSync(reportPath)) throw new Error('NAR monthly detail scratch report was not written.');
const detailReport = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
if (detailReport.meetings_discovered !== detailTargets.length) {
  throw new Error(`Schedule/detail target mismatch: targets=${detailTargets.length} collector=${detailReport.meetings_discovered}.`);
}

const scratch = {
  schema_version: 'nar-schedule-observation-scratch-v1',
  generated_at: detailReport.generated_at,
  work_id: 'WHR-CAL-JAPAN-NAR-A-PLUS',
  target_month: args.month,
  collection_mode: args.selectedMode ? 'selected_meetings' : 'date_window',
  official_schedule_url: officialScheduleUrl,
  source_http_status: scheduleHttpStatus,
  source_encoding: scheduleEncoding,
  racecourses_checked: matrix.records.length,
  meetings_scheduled: scheduleMeetings.length,
  detail_targets: detailTargets.length,
  meetings: scheduleMeetings,
};

fs.mkdirSync(path.dirname(scheduleScratchPath), { recursive: true });
fs.writeFileSync(scheduleScratchPath, `${JSON.stringify(scratch, null, 2)}\n`);
console.log(`[nar-schedule-aware] month=${args.month} scheduled=${scheduleMeetings.length} detail-targets=${detailTargets.length}`);
