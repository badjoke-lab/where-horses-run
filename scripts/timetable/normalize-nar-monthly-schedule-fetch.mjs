import fs from 'node:fs';
import path from 'node:path';
import { parseNarMonthlyScheduleGrid } from './parse-nar-monthly-schedule-grid.mjs';

const nativeFetch = globalThis.fetch;
const root = process.cwd();
const reportPath = path.join(root, 'data/generated/timetable/nar-monthly-collection-report.json');
const matrixPath = path.join(root, 'data/static/nar-flat-racecourse-compatibility-v1.json');
const matrix = JSON.parse(fs.readFileSync(matrixPath, 'utf8'));
let scheduledMeetings = [];

function decodeScheduleBody(buffer) {
  const tokens = ['月別開催日程', '門別', '盛岡', '浦和', '船橋', '大井', '川崎', '金沢', '笠松', '名古屋', '園田', '高知', '佐賀'];
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

function requestedBoundary(argv) {
  let month = '2026-07';
  let throughDate = null;
  for (const value of argv) {
    if (/^\d{4}-\d{2}$/.test(value)) month = value;
    else if (value.startsWith('--month=')) month = value.slice('--month='.length);
    else if (/^\d{4}-\d{2}-\d{2}$/.test(value)) throughDate = value;
    else if (value.startsWith('--through-date=')) throughDate = value.slice('--through-date='.length);
  }
  return { month, throughDate };
}

const boundary = requestedBoundary(process.argv.slice(2));
const venueScope = matrix.records.map((record) => ({
  venue_code: record.venue_code,
  racecourse_id: record.racecourse_id,
  name_en: record.name_en,
  name_ja: record.name_ja,
  schedule_aliases: record.name_ja === '大井' ? ['大井'] : [],
}));

globalThis.fetch = async (input, init) => {
  const response = await nativeFetch(input, init);
  const requestUrl = typeof input === 'string' || input instanceof URL ? String(input) : input.url;
  if (!requestUrl.includes('/MonthlyConveneInfo/MonthlyConveneInfoTop')) return response;

  const body = Buffer.from(await response.arrayBuffer());
  const decoded = decodeScheduleBody(body);
  const parsed = parseNarMonthlyScheduleGrid({ html: decoded.body, month: boundary.month, venues: venueScope });
  scheduledMeetings = parsed.records
    .flatMap((record) => record.meetings.map((meeting) => ({ ...meeting, venue_code: record.venue_code, racecourse_id: record.racecourse_id })))
    .filter((meeting) => !boundary.throughDate || meeting.date <= boundary.throughDate)
    .sort((a, b) => a.venue_code.localeCompare(b.venue_code) || a.date.localeCompare(b.date));

  const syntheticAnchors = scheduledMeetings
    .map((meeting) => `<a href="${meeting.race_list_url.replaceAll('&', '&amp;')}"></a>`)
    .join('\n');
  const normalizedBody = Buffer.from(`<html><body>\n${syntheticAnchors}\n</body></html>\n`, 'utf8');
  const normalizedArrayBuffer = normalizedBody.buffer.slice(
    normalizedBody.byteOffset,
    normalizedBody.byteOffset + normalizedBody.byteLength,
  );

  return {
    ok: response.ok,
    status: response.status,
    url: response.url,
    arrayBuffer: async () => normalizedArrayBuffer,
  };
};

await import('./collect-nar-monthly-candidates.mjs');

if (!fs.existsSync(reportPath)) throw new Error('NAR monthly collection report was not written.');
const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
if (scheduledMeetings.length === 0) {
  throw new Error('Monthly schedule parser discovered zero in-scope meetings.');
}
if (report.meetings_scheduled !== scheduledMeetings.length) {
  throw new Error(`Monthly schedule count mismatch: schedule=${scheduledMeetings.length} report=${report.meetings_scheduled}.`);
}
console.log(`[nar-monthly] full-month scheduled meetings in scope: ${scheduledMeetings.length}`);
