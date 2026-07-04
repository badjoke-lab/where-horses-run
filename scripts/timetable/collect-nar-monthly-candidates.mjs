import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const matrixPath = 'data/static/nar-flat-racecourse-compatibility-v1.json';
const candidatePath = 'data/candidates/nar-monthly-meeting-candidates.json';
const reportPath = 'data/generated/timetable/nar-monthly-collection-report.json';
const timeoutMs = 25_000;
const delayMs = 140;

function parseArgs(argv) {
  const args = { month: null, throughDate: null, dryRun: false, allowBlockers: false };
  for (const value of argv) {
    if (value === '--dry-run') args.dryRun = true;
    else if (value === '--allow-blockers') args.allowBlockers = true;
    else if (value.startsWith('--month=')) args.month = value.slice('--month='.length);
    else if (value.startsWith('--through-date=')) args.throughDate = value.slice('--through-date='.length);
    else if (!args.month && /^\d{4}-\d{2}$/.test(value)) args.month = value;
    else throw new Error(`Unknown argument: ${value}`);
  }
  args.month ??= '2026-07';
  if (!/^\d{4}-\d{2}$/.test(args.month)) throw new Error('month must be YYYY-MM.');
  if (args.throughDate && !/^\d{4}-\d{2}-\d{2}$/.test(args.throughDate)) throw new Error('--through-date must be YYYY-MM-DD.');
  if (args.throughDate && !args.throughDate.startsWith(args.month)) throw new Error('--through-date must be inside the selected month.');
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
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:tr|td|th|div|section|article|p|li|h[1-6]|a)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[ \t\u3000]+/g, ' ')
    .replace(/\r/g, '')
    .replace(/\n\s+/g, '\n')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

function compact(value) {
  return text(value).replace(/\s+/g, ' ').trim();
}

function decodeBody(buffer, venueName) {
  const tokens = ['競馬', '発走', '競走', '距離', venueName];
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

async function fetchPage(url, venueName) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'user-agent': 'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; review-controlled NAR monthly collector)',
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'accept-language': 'ja,en-US;q=0.8,en;q=0.6',
      },
    });
    const buffer = await response.arrayBuffer();
    const decoded = decodeBody(buffer, venueName);
    return { ok: response.ok, status: response.status, finalUrl: response.url, encoding: decoded.encoding, body: decoded.body, error: null };
  } catch (error) {
    return { ok: false, status: null, finalUrl: url, encoding: null, body: '', error: String(error?.cause?.code ?? error?.message ?? error) };
  } finally {
    clearTimeout(timer);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function monthUrl(month) {
  const [year, mm] = month.split('-');
  return `https://www.keiba.go.jp/KeibaWeb/MonthlyConveneInfo/MonthlyConveneInfoTop?k_month=${String(Number(mm))}&k_year=${year}`;
}

function extractRaceListUrls(html, month) {
  const found = [];
  for (const match of html.matchAll(/href=["']([^"']*RaceList[^"']*k_babaCode=\d{1,2}[^"']*k_raceDate=[^"']+)["']/gi)) {
    const href = decodeEntities(match[1]);
    const url = new URL(href, 'https://www.keiba.go.jp/');
    const venueCode = url.searchParams.get('k_babaCode')?.padStart(2, '0');
    const rawDate = url.searchParams.get('k_raceDate');
    if (!venueCode || !rawDate) continue;
    const date = rawDate.replaceAll('/', '-');
    if (!date.startsWith(month)) continue;
    found.push({ venue_code: venueCode, date, race_list_url: url.toString() });
  }
  const dedup = new Map();
  for (const row of found) dedup.set(`${row.venue_code}:${row.date}`, row);
  return [...dedup.values()].sort((a, b) => a.venue_code.localeCompare(b.venue_code) || a.date.localeCompare(b.date));
}

function normalizeTime(value) {
  const match = String(value ?? '').match(/(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function discoverRaceNumbers(html) {
  const found = new Set();
  for (const match of html.matchAll(/[?&]k_raceNo=(\d{1,2})(?:&|["'])/gi)) {
    const value = Number(match[1]);
    if (value >= 1 && value <= 30) found.add(value);
  }
  for (const match of text(html).matchAll(/(?:^|\s)(\d{1,2})\s*R(?:\s|$)/gi)) {
    const value = Number(match[1]);
    if (value >= 1 && value <= 30) found.add(value);
  }
  return [...found].sort((a, b) => a - b);
}

function continuousFromOne(numbers) {
  return numbers.length >= 2 && numbers.every((value, index) => value === index + 1);
}

function detailUrl(venueCode, date, raceNumber) {
  const params = new URLSearchParams({ k_babaCode: venueCode, k_raceDate: date.replaceAll('-', '/'), k_raceNo: String(raceNumber) });
  return `https://www.keiba.go.jp/KeibaWeb/TodayRaceInfo/DebaTable?${params}`;
}

function raceName(block, raceNumber) {
  for (const match of block.matchAll(/<a\b[^>]*href=["'][^"']*(?:D[ea]baTable|S_DebaTable)[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const value = compact(match[1]);
    if (value && !/(出馬表|詳細|オッズ|結果)/.test(value)) return value;
  }
  const lines = text(block)
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .filter((line) => !new RegExp(`^${raceNumber}\s*R$`, 'i').test(line))
    .filter((line) => !/^\d{1,2}:\d{2}$/.test(line))
    .filter((line) => !/^(?:ダート|芝)?\s*[右左]\s*\d{3,4}\s*[mｍＭ]$/.test(line))
    .filter((line) => !/(出馬表|オッズ|結果|払戻|映像|予想|投票|変更情報|頭数)/.test(line));
  return lines.find((line) => line.length >= 2 && line.length <= 120) ?? null;
}

function parseListRows(html, record, date) {
  const rows = new Map();
  const blocks = [...html.matchAll(/<tr\b[^>]*>[\s\S]*?<\/tr>/gi)].map((match) => match[0]);
  for (const block of blocks) {
    const plain = compact(block);
    const hrefRace = block.match(/[?&]k_raceNo=(\d{1,2})(?:&|["'])/i);
    const raceMatch = hrefRace ?? plain.match(/(?:^|\s)(\d{1,2})\s*R(?:\s|$)/i);
    const timeMatch = plain.match(/(?:^|\s)(\d{1,2}:\d{2})(?:\s|$)/);
    const courseMatch = plain.match(/(?:(ダート|芝))?\s*([右左])?\s*(\d{3,4})\s*[mｍＭ]/);
    if (!raceMatch || !timeMatch || !courseMatch) continue;
    const raceNumber = Number(raceMatch[1]);
    const distance = Number(courseMatch[3]);
    if (raceNumber < 1 || raceNumber > 30 || distance < 600 || distance > 6000) continue;
    const name = raceName(block, raceNumber);
    if (!name) continue;
    rows.set(raceNumber, {
      race_number: raceNumber,
      label: `Race ${raceNumber}`,
      post_time_local: normalizeTime(timeMatch[1]),
      race_name: name,
      distance_m: distance,
      list_surface_raw: courseMatch[1] ?? null,
      list_direction_raw: courseMatch[2] ?? null,
      detail_url: detailUrl(record.venue_code, date, raceNumber),
    });
  }
  return [...rows.values()].sort((a, b) => a.race_number - b.race_number);
}

function surfaceFromRaw(raw) {
  if (raw === '芝') return 'Turf';
  if (raw === 'ダート') return 'Dirt';
  return null;
}
function directionFromRaw(raw) {
  if (raw === '右') return 'right';
  if (raw === '左') return 'left';
  return null;
}
function directionFromRecord(record) {
  if (record.course_direction === 'left') return 'left';
  if (record.course_direction === 'right') return 'right';
  return null;
}
function courseLabel(surface, direction) {
  const labels = [surface === 'Turf' ? 'Turf Course' : 'Dirt Course'];
  if (direction === 'right') labels.push('Right');
  if (direction === 'left') labels.push('Left');
  return labels.join(' / ');
}
function safeRaceListFallback(row, record) {
  const surface = surfaceFromRaw(row.list_surface_raw) ?? (record.surfaces?.length === 1 && record.surfaces.includes('dirt') ? 'Dirt' : null);
  const direction = directionFromRaw(row.list_direction_raw) ?? directionFromRecord(record);
  if (!surface || !direction) return null;
  if (surface === 'Turf' && !record.surfaces?.includes('turf')) return null;
  if (surface === 'Dirt' && !record.surfaces?.includes('dirt')) return null;
  return { surface, distance_m: row.distance_m, course_label: courseLabel(surface, direction), source: 'race_list_and_racecourse_matrix' };
}

function parseDetail(html) {
  const plain = compact(html);
  const patterns = [
    /(ダート|芝)\s*(\d{3,4})\s*[mｍＭ]\s*[（(]([^）)]+)[）)]/,
    /([右左])\s*(ダート|芝)\s*(\d{3,4})\s*[mｍＭ]/,
    /(ダート|芝)\s*([右左])\s*(\d{3,4})\s*[mｍＭ]/,
  ];
  let surfaceRaw = null;
  let distance = null;
  let courseRaw = '';
  for (const [index, pattern] of patterns.entries()) {
    const match = plain.match(pattern);
    if (!match) continue;
    if (index === 0) [surfaceRaw, distance, courseRaw] = [match[1], Number(match[2]), match[3]];
    else if (index === 1) [courseRaw, surfaceRaw, distance] = [match[1], match[2], Number(match[3])];
    else [surfaceRaw, courseRaw, distance] = [match[1], match[2], Number(match[3])];
    break;
  }
  if (!surfaceRaw || !distance) return null;
  const surface = surfaceRaw === '芝' ? 'Turf' : 'Dirt';
  const labels = [surface === 'Turf' ? 'Turf Course' : 'Dirt Course'];
  if (/内/.test(courseRaw)) labels.push('Inner');
  if (/外/.test(courseRaw)) labels.push('Outer');
  if (/右/.test(courseRaw)) labels.push('Right');
  if (/左/.test(courseRaw)) labels.push('Left');
  return { surface, distance_m: distance, course_label: [...new Set(labels)].join(' / '), source: 'deba_table' };
}

function missingFields(row) {
  return [!row.label && 'label', !row.post_time_local && 'post_time_local', !row.race_name && 'race_name', !Number.isInteger(row.distance_m) && 'distance_m', !row.surface && 'surface', !row.course_label && 'course_label'].filter(Boolean);
}

async function collectMeeting(record, meeting) {
  const list = await fetchPage(meeting.race_list_url, record.name_ja);
  if (!list.ok) return { status: list.error ? 'source_unavailable' : 'http_error', record, meeting, list, rows: [], blockers: [{ reason: list.error ?? `HTTP ${list.status}` }] };
  const expected = discoverRaceNumbers(list.body);
  const parsed = parseListRows(list.body, record, meeting.date);
  if (!continuousFromOne(expected)) return { status: 'parser_failure', record, meeting, list, expected, rows: parsed, blockers: [{ reason: 'race_number_discovery_incomplete' }] };
  if (JSON.stringify(parsed.map((row) => row.race_number)) !== JSON.stringify(expected)) return { status: 'parser_failure', record, meeting, list, expected, rows: parsed, blockers: [{ reason: 'list_parser_incomplete' }] };

  const rows = [];
  for (const row of parsed) {
    await sleep(delayMs);
    const detail = await fetchPage(row.detail_url, record.name_ja);
    const detailMetadata = detail.ok ? parseDetail(detail.body) : null;
    const metadata = detailMetadata ?? safeRaceListFallback(row, record);
    rows.push({
      race_number: row.race_number,
      label: row.label,
      post_time_local: row.post_time_local,
      race_name: row.race_name,
      distance_m: metadata?.distance_m ?? row.distance_m,
      surface: metadata?.surface ?? null,
      course_label: metadata?.course_label ?? null,
      source_trace: {
        list_url: meeting.race_list_url,
        detail_url: row.detail_url,
        detail_http_status: detail.status,
        detail_encoding: detail.encoding,
        detail_parsed: Boolean(detailMetadata),
        course_metadata_source: metadata?.source ?? null,
      },
    });
  }
  const incomplete = rows.map((row) => ({ race_number: row.race_number, missing_fields: missingFields(row) })).filter((row) => row.missing_fields.length);
  if (incomplete.length) return { status: 'meeting_incomplete', record, meeting, list, expected, rows, blockers: incomplete };
  return { status: 'meeting_complete', record, meeting, list, expected, rows };
}

const args = parseArgs(process.argv.slice(2));
execFileSync(process.execPath, ['scripts/check-calendar-nar-complete-fixture-set.mjs'], { cwd: root, stdio: 'inherit' });
const matrix = readJson(matrixPath);
const schedule = await fetchPage(monthUrl(args.month), '地方競馬');
if (!schedule.ok) throw new Error(`Monthly schedule fetch failed: ${schedule.error ?? schedule.status}`);
const allLinks = extractRaceListUrls(schedule.body, args.month).filter((meeting) => !args.throughDate || meeting.date <= args.throughDate);
const linksByCode = new Map();
for (const link of allLinks) {
  if (!linksByCode.has(link.venue_code)) linksByCode.set(link.venue_code, []);
  linksByCode.get(link.venue_code).push(link);
}

const venue_statuses = [];
const meetings = [];
const blockers = [];
for (const record of matrix.records) {
  const venueMeetings = linksByCode.get(record.venue_code) ?? [];
  if (!venueMeetings.length) {
    venue_statuses.push({ venue_code: record.venue_code, racecourse_id: record.racecourse_id, status: 'no_meeting_in_target_month', meeting_count: 0, meeting_dates: [] });
    continue;
  }
  venue_statuses.push({ venue_code: record.venue_code, racecourse_id: record.racecourse_id, status: 'has_target_month_meetings', meeting_count: venueMeetings.length, meeting_dates: venueMeetings.map((meeting) => meeting.date) });
  for (const meeting of venueMeetings) {
    console.log(`[nar-monthly] ${record.name_en} ${meeting.date}`);
    const result = await collectMeeting(record, meeting);
    if (result.status === 'meeting_complete') {
      meetings.push({
        schema_version: 'nar-monthly-meeting-candidate-v1',
        candidate_id: `nar-${record.racecourse_id}-${meeting.date}`,
        work_id: 'WHR-CAL-JAPAN-NAR-A-PLUS',
        country_id: 'japan',
        authority_id: 'nar-local-government-racing',
        racing_system_id: 'japan-nar-system',
        racecourse_id: record.racecourse_id,
        racecourse_name_en: record.name_en,
        racecourse_name_ja: record.name_ja,
        venue_code: record.venue_code,
        date: meeting.date,
        timezone: 'Asia/Tokyo',
        source: { source_id: 'nar-official-race-list-and-deba-table', official_race_list_url: meeting.race_list_url, list_http_status: result.list.status, list_encoding: result.list.encoding, storage_policy: 'public_safe_extracted_fields_only_no_raw_html' },
        meeting_completeness: { expected_race_numbers: result.expected, expected_race_count: result.expected.length, observed_race_count: result.rows.length, continuous_race_numbers: true, all_a_plus_fields_complete: true },
        timetable_rows: result.rows,
        review: { status: 'needs_review', promotion_eligible: false, reason: 'Monthly NAR candidate requires human review before canonical promotion.' },
      });
    } else {
      blockers.push({ venue_code: record.venue_code, racecourse_id: record.racecourse_id, date: meeting.date, status: result.status, blockers: result.blockers ?? [], list_http_status: result.list?.status ?? null, list_final_url: result.list?.finalUrl ?? meeting.race_list_url });
    }
  }
}

const report = {
  schema_version: 'nar-monthly-collection-report-v1',
  generated_at: new Date().toISOString(),
  work_id: 'WHR-CAL-JAPAN-NAR-A-PLUS',
  target_month: args.month,
  through_date: args.throughDate,
  official_schedule_url: schedule.finalUrl,
  racecourses_checked: venue_statuses.length,
  racecourses_with_meetings: venue_statuses.filter((row) => row.status === 'has_target_month_meetings').length,
  racecourses_without_meetings: venue_statuses.filter((row) => row.status === 'no_meeting_in_target_month').length,
  meetings_discovered: allLinks.length,
  complete_meeting_candidates: meetings.length,
  blocked_meetings: blockers.length,
  candidate_path: candidatePath,
  promotion_eligible_candidates: 0,
  publication_effect: 'none',
  venue_statuses,
  blockers,
};

const candidates = {
  schema_version: 'nar-monthly-meeting-candidates-v1',
  generated_at: report.generated_at,
  work_id: 'WHR-CAL-JAPAN-NAR-A-PLUS',
  target_month: args.month,
  through_date: args.throughDate,
  source: { official_schedule_url: schedule.finalUrl, matrix_path: matrixPath, fixture_precondition: 'data/fixtures/timetable/nar/complete-meetings' },
  review: { status: 'needs_review', promotion_eligible: false, canonical_write: 'disabled', public_write: 'disabled', raw_source_storage: 'disabled' },
  venue_statuses,
  meetings,
  blockers,
};

if (!args.dryRun) {
  writeJson(candidatePath, candidates);
  writeJson(reportPath, report);
}
console.log(JSON.stringify(report, null, 2));
if (venue_statuses.length !== 14) process.exit(1);
if (blockers.length && !args.allowBlockers) process.exit(1);
