import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const targetMonth = '2026-07';
const candidatePath = 'data/candidates/banei-monthly-2026-07-full-month-candidates.json';
const reportPath = 'data/generated/timetable/banei-monthly-2026-07-full-month-collection-report.json';
const sourceUrl = (() => {
  const epoch = Math.floor(Date.parse(`${targetMonth}-01T00:00:00+09:00`) / 1000);
  return `https://www.banei-keiba.or.jp/race_schedule.php?c=mon&d=${epoch}`;
})();

function decodeEntities(value) {
  return String(value ?? '')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)));
}

function text(value) {
  return decodeEntities(value)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[\s\u3000]+/g, ' ')
    .trim();
}

function decodeBody(buffer) {
  const tokens = ['開催日程／時刻', '月間開催日程', 'ばんえい開催', '帯広競馬場'];
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

function parseRows(html) {
  const rows = [];
  for (const rowMatch of html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = [];
    for (const cellMatch of (rowMatch[1] ?? '').matchAll(/<(td|th)\b[^>]*>([\s\S]*?)<\/\1>/gi)) {
      const raw = cellMatch[2] ?? '';
      const urls = [...raw.matchAll(/href=["']([^"']+)["']/gi)].map((match) => {
        try {
          return new URL(decodeEntities(match[1]), sourceUrl).toString();
        } catch {
          return null;
        }
      }).filter(Boolean);
      cells.push({ text: text(raw), raw, urls });
    }
    if (cells.length) rows.push(cells);
  }
  return rows;
}

function dayValues(row) {
  return row.slice(1).map((cell) => Number(cell.text.match(/^\s*(\d{1,2})\s*$/)?.[1])).filter((value) => Number.isInteger(value));
}

function isMeetingCell(cell) {
  if (!cell) return false;
  if (cell.text.includes('帯広競馬場')) return true;
  return cell.urls.some((url) => {
    try {
      const host = new URL(url).hostname.toLowerCase();
      return host === 'www2.keiba.go.jp' || host === 'www.keiba.go.jp';
    } catch {
      return false;
    }
  });
}

function raceTime(cell, raceNumber) {
  if (!cell) return null;
  const match = cell.text.match(new RegExp(`第?${raceNumber}R\\s*(\\d{1,2}:\\d{2})`, 'i'));
  if (!match) return null;
  const [hour, minute] = match[1].split(':').map(Number);
  if (hour > 23 || minute > 59) return null;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function parseMonthlySchedule(html) {
  const rows = parseRows(html);
  const meetings = [];
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    const first = row[0]?.text ?? '';
    if (first !== '日付') continue;
    const days = dayValues(row);
    if (!days.length) continue;
    const scheduleRow = rows.slice(index + 1, index + 5).find((candidate) => (candidate[0]?.text ?? '').includes('ばんえい開催'));
    if (!scheduleRow) throw new Error(`Could not find Banei schedule row after day row ${days.join(',')}.`);
    const dayCells = row.slice(1);
    const scheduleCells = scheduleRow.slice(1);
    if (scheduleCells.length < dayCells.length) throw new Error(`Banei schedule row is shorter than day row ${days.join(',')}.`);
    for (let offset = 0; offset < dayCells.length; offset += 1) {
      const day = Number(dayCells[offset]?.text.match(/^\s*(\d{1,2})\s*$/)?.[1]);
      if (!Number.isInteger(day) || day < 1 || day > 31) continue;
      const cell = scheduleCells[offset];
      if (!isMeetingCell(cell)) continue;
      const date = `${targetMonth}-${String(day).padStart(2, '0')}`;
      const firstRace = raceTime(cell, 1);
      const lastRace = raceTime(cell, 12);
      meetings.push({
        meeting_id: `banei-obihiro-racecourse-${date}`,
        country_id: 'japan',
        authority_id: 'banei-tokachi',
        racing_system_id: 'japan-banei-system',
        racecourse_id: 'obihiro-racecourse',
        date,
        timezone: 'Asia/Tokyo',
        first_race_time_local: firstRace,
        last_race_time_local: lastRace,
        schedule_status: firstRace && lastRace ? 'time_summary_available' : 'scheduled_pending_details',
      });
    }
  }
  const dedup = new Map(meetings.map((meeting) => [meeting.date, meeting]));
  return [...dedup.values()].sort((a, b) => a.date.localeCompare(b.date));
}

function writeJson(relativePath, value) {
  const absolute = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, `${JSON.stringify(value, null, 2)}\n`);
}

const response = await fetch(sourceUrl, {
  redirect: 'follow',
  headers: {
    'user-agent': 'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; review-controlled Banei full-month collector)',
    accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'accept-language': 'ja,en-US;q=0.8,en;q=0.6',
  },
});
if (!response.ok) throw new Error(`Banei monthly schedule fetch failed: HTTP ${response.status}`);
const decoded = decodeBody(Buffer.from(await response.arrayBuffer()));
const meetings = parseMonthlySchedule(decoded.body);
if (!meetings.length) throw new Error('Banei full-month schedule parser found no July meetings.');

const generatedAt = new Date().toISOString();
const report = {
  schema_version: 'banei-full-month-collection-report-v1',
  generated_at: generatedAt,
  work_id: 'WHR-CAL-JAPAN-BANEI-A-PLUS',
  target_month: targetMonth,
  month_start: '2026-07-01',
  month_end: '2026-07-31',
  through_date: null,
  official_schedule_url: response.url,
  schedule_http_status: response.status,
  schedule_encoding: decoded.encoding,
  racecourse_id: 'obihiro-racecourse',
  meetings_scheduled: meetings.length,
  time_summary_available: meetings.filter((meeting) => meeting.schedule_status === 'time_summary_available').length,
  pending_detail_meetings: meetings.filter((meeting) => meeting.schedule_status === 'scheduled_pending_details').length,
  schedule_scope_complete: true,
  partial_cutoff_completion_allowed: false,
  publication_effect: 'none',
  meeting_dates: meetings.map((meeting) => meeting.date),
};
const candidates = {
  schema_version: 'banei-full-month-candidate-set-v1',
  generated_at: generatedAt,
  work_id: report.work_id,
  target_month: targetMonth,
  month_start: report.month_start,
  month_end: report.month_end,
  through_date: null,
  source: {
    source_id: 'banei-official-schedule',
    official_schedule_url: report.official_schedule_url,
    storage_policy: 'public_safe_extracted_fields_only_no_raw_html',
  },
  review: {
    status: 'needs_review',
    promotion_eligible: false,
    canonical_write: 'disabled',
    public_write: 'disabled',
    raw_source_storage: 'disabled',
  },
  meetings,
};
writeJson(candidatePath, candidates);
writeJson(reportPath, report);
console.log(JSON.stringify(report, null, 2));
console.log(`[banei-full-month] scheduled=${report.meetings_scheduled} time_summary=${report.time_summary_available} pending=${report.pending_detail_meetings}`);
