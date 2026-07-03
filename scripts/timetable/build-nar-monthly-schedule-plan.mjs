import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const matrixPath = 'data/static/nar-flat-racecourse-compatibility-v1.json';
const defaultOutputPath = 'data/generated/timetable/nar-monthly-schedule-plan.json';
const timeoutMs = 25_000;

function parseArgs(argv) {
  const args = { month: '2026-07', output: defaultOutputPath, dryRun: false };
  for (const value of argv) {
    if (value === '--dry-run') args.dryRun = true;
    else if (value.startsWith('--month=')) args.month = value.slice('--month='.length);
    else if (value.startsWith('--output=')) args.output = value.slice('--output='.length);
    else throw new Error(`Unknown argument: ${value}`);
  }
  if (!/^\d{4}-\d{2}$/.test(args.month)) throw new Error('--month must be YYYY-MM.');
  return args;
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

function writeJson(relativePath, value) {
  const absolute = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, `${JSON.stringify(value, null, 2)}\n`);
}

function decodeEntities(value) {
  return String(value ?? '')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)));
}

function monthUrl(month) {
  const [year, mm] = month.split('-');
  const monthNumber = String(Number(mm));
  return `https://www.keiba.go.jp/KeibaWeb/MonthlyConveneInfo/MonthlyConveneInfoTop?k_month=${monthNumber}&k_year=${year}`;
}

async function fetchText(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'user-agent': 'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; review-controlled monthly schedule planner)',
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'accept-language': 'ja,en-US;q=0.8,en;q=0.6',
      },
    });
    const text = await response.text();
    return { ok: response.ok, status: response.status, final_url: response.url, body: text };
  } finally {
    clearTimeout(timer);
  }
}

function extractRaceListUrls(html, month) {
  const found = [];
  for (const match of html.matchAll(/href=["']([^"']*RaceList[^"']*k_babaCode=\d{1,2}[^"']*k_raceDate=[^"']+)["']/gi)) {
    const href = decodeEntities(match[1]);
    const url = new URL(href, 'https://www.keiba.go.jp/');
    const code = url.searchParams.get('k_babaCode')?.padStart(2, '0');
    const rawDate = url.searchParams.get('k_raceDate');
    if (!code || !rawDate) continue;
    const isoDate = rawDate.replaceAll('/', '-');
    if (!isoDate.startsWith(month)) continue;
    found.push({ venue_code: code, date: isoDate, race_list_url: url.toString() });
  }
  const dedup = new Map();
  for (const row of found) dedup.set(`${row.venue_code}:${row.date}`, row);
  return [...dedup.values()].sort((a, b) => a.venue_code.localeCompare(b.venue_code) || a.date.localeCompare(b.date));
}

const args = parseArgs(process.argv.slice(2));
const matrix = readJson(matrixPath);
const url = monthUrl(args.month);
const response = await fetchText(url);
if (!response.ok) {
  throw new Error(`Monthly schedule fetch failed: HTTP ${response.status}`);
}

const links = extractRaceListUrls(response.body, args.month);
const linksByCode = new Map();
for (const link of links) {
  if (!linksByCode.has(link.venue_code)) linksByCode.set(link.venue_code, []);
  linksByCode.get(link.venue_code).push({ date: link.date, race_list_url: link.race_list_url });
}

const records = matrix.records.map((record) => {
  const meetings = linksByCode.get(record.venue_code) ?? [];
  const state = meetings.length > 0 ? 'has_target_month_meetings' : 'no_meeting_in_target_month';
  return {
    venue_code: record.venue_code,
    racecourse_id: record.racecourse_id,
    name_en: record.name_en,
    name_ja: record.name_ja,
    target_month_state: state,
    meeting_dates: meetings.map((meeting) => meeting.date),
    race_list_urls: meetings,
    candidate_action: state === 'has_target_month_meetings' ? 'collect_every_meeting' : 'record_status_only',
  };
});

const output = {
  schema_version: 'nar-monthly-schedule-plan-v1',
  generated_at: new Date().toISOString(),
  work_id: 'WHR-CAL-JAPAN-NAR-A-PLUS',
  target_month: args.month,
  official_schedule_url: response.final_url,
  source_http_status: response.status,
  matrix_path: matrixPath,
  racecourses_checked: records.length,
  racecourses_with_meetings: records.filter((record) => record.target_month_state === 'has_target_month_meetings').length,
  racecourses_without_meetings: records.filter((record) => record.target_month_state === 'no_meeting_in_target_month').length,
  meeting_dates_discovered: records.reduce((sum, record) => sum + record.meeting_dates.length, 0),
  classification_rule: 'no meeting in the selected month is a recorded status, not a failure',
  records,
};

if (!args.dryRun) writeJson(args.output, output);
console.log(JSON.stringify(output, null, 2));
if (output.racecourses_checked !== 14) process.exit(1);
