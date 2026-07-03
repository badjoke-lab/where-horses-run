import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const matrixPath = 'data/static/nar-flat-racecourse-compatibility-v1.json';
const fixtureDirectory = 'data/fixtures/timetable/nar/complete-meetings';
const reportPath = 'data/generated/timetable/nar-complete-fixture-report.json';
const timeoutMs = 25000;
const requestDelayMs = 180;

function parseArgs(argv) {
  const values = { all: false, dryRun: false, venueCode: null };
  for (const arg of argv) {
    if (arg === '--all') values.all = true;
    else if (arg === '--dry-run') values.dryRun = true;
    else if (arg.startsWith('--venue-code=')) values.venueCode = arg.split('=')[1];
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!values.all && !values.venueCode) {
    throw new Error('Usage: node scripts/timetable/collect-nar-complete-fixtures.mjs --all [--dry-run] | --venue-code=NN [--dry-run]');
  }
  if (values.all && values.venueCode) throw new Error('--all and --venue-code are mutually exclusive.');
  if (values.venueCode && !/^\d{2}$/.test(values.venueCode)) throw new Error('--venue-code must contain two digits.');
  return values;
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

function stripHtml(value) {
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
  return stripHtml(value).replace(/\s+/g, ' ').trim();
}

function decodeBody(buffer, venueName) {
  const tokens = ['競馬', '発走', '競走', '距離', venueName];
  const candidates = ['utf-8', 'shift_jis'].map((encoding) => {
    try {
      const text = new TextDecoder(encoding).decode(buffer);
      const score = tokens.reduce((total, token) => total + (text.split(token).length - 1), 0);
      return { encoding, text, score };
    } catch {
      return { encoding, text: '', score: -1 };
    }
  });
  candidates.sort((left, right) => right.score - left.score);
  return candidates[0];
}

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchPage(url, venueName) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'user-agent': 'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; review-controlled fixture collector)',
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'accept-language': 'ja,en-US;q=0.8,en;q=0.6',
      },
    });
    const buffer = await response.arrayBuffer();
    const decoded = decodeBody(buffer, venueName);
    return {
      ok: response.ok,
      http_status: response.status,
      final_url: response.url,
      content_type: response.headers.get('content-type'),
      body_size: buffer.byteLength,
      encoding: decoded.encoding,
      body: decoded.text,
      network_error: null,
    };
  } catch (error) {
    return {
      ok: false,
      http_status: null,
      final_url: url,
      content_type: null,
      body_size: 0,
      encoding: null,
      body: '',
      network_error: String(error?.cause?.code ?? error?.message ?? error),
    };
  } finally {
    clearTimeout(timer);
  }
}

function normalizeTime(value) {
  const match = String(value ?? '').match(/(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function detailUrl(date, venueCode, raceNumber) {
  const params = new URLSearchParams({
    k_babaCode: venueCode,
    k_raceDate: date.replaceAll('-', '/'),
    k_raceNo: String(raceNumber),
  });
  return `https://www.keiba.go.jp/KeibaWeb/TodayRaceInfo/DebaTable?${params.toString()}`;
}

function anchorRaceName(block) {
  const matches = [...block.matchAll(/<a\b[^>]*href=["'][^"']*(?:D[ea]baTable|S_DebaTable)[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi)];
  for (const match of matches) {
    const value = compact(match[1]);
    if (value && !/(出馬表|詳細)/.test(value)) return value;
  }
  return null;
}

function fallbackRaceName(block, raceNumber) {
  const lines = stripHtml(block)
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .filter((line) => !new RegExp(`^${raceNumber}\s*R$`, 'i').test(line))
    .filter((line) => !/^\d{1,2}:\d{2}$/.test(line))
    .filter((line) => !/^(?:芝)?[右左]\s*\d{3,4}\s*[mｍＭ]$/.test(line))
    .filter((line) => !/(出馬表|オッズ|結果|払戻|映像|予想|投票|変更情報|頭数)/.test(line));
  return lines.find((line) => line.length >= 2 && line.length <= 120) ?? null;
}

function parseListRows(html, record) {
  const rows = new Map();
  const tableRows = [...html.matchAll(/<tr\b[^>]*>[\s\S]*?<\/tr>/gi)].map((match) => match[0]);
  const blocks = tableRows.length ? tableRows : stripHtml(html).split(/(?=\b\d{1,2}\s*R\b)/i);

  for (const block of blocks) {
    const plain = compact(block);
    const raceMatch = plain.match(/(?:^|\s)(\d{1,2})\s*R(?:\s|$)/i);
    const timeMatch = plain.match(/(?:^|\s)(\d{1,2}:\d{2})(?:\s|$)/);
    const courseMatch = plain.match(/(?:ダート|芝)?\s*([右左])?\s*(\d{3,4})\s*[mｍＭ]/);
    if (!raceMatch || !timeMatch || !courseMatch) continue;

    const raceNumber = Number(raceMatch[1]);
    const distance = Number(courseMatch[2]);
    if (raceNumber < 1 || raceNumber > 30 || distance < 600 || distance > 6000) continue;

    const raceName = anchorRaceName(block) ?? fallbackRaceName(block, raceNumber);
    if (!raceName) continue;

    rows.set(raceNumber, {
      race_number: raceNumber,
      label: `Race ${raceNumber}`,
      post_time_local: normalizeTime(timeMatch[1]),
      race_name: raceName,
      distance_m: distance,
      list_course_text: courseMatch[0].replace(/\s+/g, ''),
      detail_url: detailUrl(record.official_race_list_date, record.venue_code, raceNumber),
    });
  }

  return [...rows.values()].sort((left, right) => left.race_number - right.race_number);
}

function parseDetailMetadata(html) {
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
    if (index === 0) {
      surfaceRaw = match[1];
      distance = Number(match[2]);
      courseRaw = match[3];
    } else if (index === 1) {
      courseRaw = match[1];
      surfaceRaw = match[2];
      distance = Number(match[3]);
    } else {
      surfaceRaw = match[1];
      courseRaw = match[2];
      distance = Number(match[3]);
    }
    break;
  }
  if (!surfaceRaw || !distance) return null;

  const surface = surfaceRaw === '芝' ? 'Turf' : 'Dirt';
  const labels = [surface === 'Turf' ? 'Turf Course' : 'Dirt Course'];
  if (/内/.test(courseRaw)) labels.push('Inner');
  if (/外/.test(courseRaw)) labels.push('Outer');
  if (/右/.test(courseRaw)) labels.push('Right');
  if (/左/.test(courseRaw)) labels.push('Left');

  return {
    surface,
    distance_m: distance,
    course_label: [...new Set(labels)].join(' / '),
    official_course_text: `${surfaceRaw} ${distance}m ${courseRaw}`.trim(),
  };
}

function continuousFromOne(rows) {
  return rows.length >= 2 && rows.every((row, index) => row.race_number === index + 1);
}

function missingFields(row) {
  return [
    !row.label ? 'label' : null,
    !row.post_time_local ? 'post_time_local' : null,
    !row.race_name ? 'race_name' : null,
    !Number.isInteger(row.distance_m) ? 'distance_m' : null,
    !row.surface ? 'surface' : null,
    !row.course_label ? 'course_label' : null,
  ].filter(Boolean);
}

async function collectRecord(record) {
  const listResponse = await fetchPage(record.official_race_list_url, record.name_ja);
  if (!listResponse.ok) {
    return {
      record,
      status: listResponse.network_error ? 'network_error' : 'http_error',
      list_fetch: listResponse,
      rows: [],
      fixture: null,
    };
  }

  const listRows = parseListRows(listResponse.body, record);
  if (!listRows.length) {
    return {
      record,
      status: 'no_meeting_or_parser_miss',
      list_fetch: { ...listResponse, body: undefined },
      rows: [],
      fixture: null,
    };
  }

  const rows = [];
  for (const row of listRows) {
    await sleep(requestDelayMs);
    const detailResponse = await fetchPage(row.detail_url, record.name_ja);
    const metadata = detailResponse.ok ? parseDetailMetadata(detailResponse.body) : null;
    rows.push({
      race_number: row.race_number,
      label: row.label,
      post_time_local: row.post_time_local,
      race_name: row.race_name,
      distance_m: metadata?.distance_m ?? row.distance_m,
      surface: metadata?.surface ?? null,
      course_label: metadata?.course_label ?? null,
      source_trace: {
        list_url: record.official_race_list_url,
        detail_url: row.detail_url,
        detail_http_status: detailResponse.http_status,
        detail_encoding: detailResponse.encoding,
        detail_parsed: Boolean(metadata),
      },
    });
  }

  const continuous = continuousFromOne(rows);
  const incompleteRows = rows
    .map((row) => ({ race_number: row.race_number, missing_fields: missingFields(row) }))
    .filter((row) => row.missing_fields.length);
  const complete = continuous && incompleteRows.length === 0;

  const fixture = complete ? {
    schema_version: 'nar-complete-meeting-fixture-v1',
    fixture_id: `nar-${record.racecourse_id}-${record.official_race_list_date}`,
    work_id: 'WHR-CAL-JAPAN-NAR-A-PLUS',
    country_id: 'japan',
    authority_id: 'nar-local-government-racing',
    racing_system_id: 'japan-nar-system',
    racecourse_id: record.racecourse_id,
    racecourse_name_en: record.name_en,
    racecourse_name_ja: record.name_ja,
    venue_code: record.venue_code,
    date: record.official_race_list_date,
    timezone: 'Asia/Tokyo',
    source: {
      source_id: 'nar-official-race-list-and-deba-table',
      official_race_list_url: record.official_race_list_url,
      list_http_status: listResponse.http_status,
      list_encoding: listResponse.encoding,
      storage_policy: 'public_safe_extracted_fields_only_no_raw_html',
    },
    meeting_completeness: {
      expected_race_count: rows.length,
      observed_race_count: rows.length,
      continuous_race_numbers: true,
      all_a_plus_fields_complete: true,
    },
    timetable_rows: rows,
    review: {
      status: 'needs_review',
      promotion_eligible: false,
      reason: 'Fixture evidence requires human review before candidate generation.',
    },
  } : null;

  return {
    record,
    status: complete ? 'meeting_complete' : 'meeting_incomplete',
    list_fetch: { ...listResponse, body: undefined },
    rows,
    continuous,
    incomplete_rows: incompleteRows,
    fixture,
  };
}

const options = parseArgs(process.argv.slice(2));
const matrix = readJson(matrixPath);
const selected = options.all
  ? matrix.records
  : matrix.records.filter((record) => record.venue_code === options.venueCode);
if (!selected.length) throw new Error(`No matrix record matched venue code ${options.venueCode}.`);

const results = [];
for (const record of selected) {
  console.log(`[nar-complete-fixture] ${record.name_en} ${record.official_race_list_date}`);
  const result = await collectRecord(record);
  results.push(result);
  if (result.fixture && !options.dryRun) {
    const fileName = `${record.racecourse_id}-${record.official_race_list_date}.json`;
    writeJson(`${fixtureDirectory}/${fileName}`, result.fixture);
  }
}

const report = {
  schema_version: 'nar-complete-fixture-report-v1',
  generated_at: new Date().toISOString(),
  work_id: 'WHR-CAL-JAPAN-NAR-A-PLUS',
  matrix_path: matrixPath,
  mode: options.all ? 'all_14' : 'single_venue',
  dry_run: options.dryRun,
  racecourses_checked: results.length,
  complete_meetings: results.filter((result) => result.status === 'meeting_complete').length,
  incomplete_meetings: results.filter((result) => result.status === 'meeting_incomplete').length,
  source_failures: results.filter((result) => ['network_error', 'http_error'].includes(result.status)).length,
  parser_misses: results.filter((result) => result.status === 'no_meeting_or_parser_miss').length,
  statuses: results.map((result) => ({
    venue_code: result.record.venue_code,
    racecourse_id: result.record.racecourse_id,
    date: result.record.official_race_list_date,
    official_race_list_url: result.record.official_race_list_url,
    status: result.status,
    race_count: result.rows.length,
    continuous_race_numbers: result.continuous ?? false,
    incomplete_rows: result.incomplete_rows ?? [],
    http_status: result.list_fetch.http_status,
    final_url: result.list_fetch.final_url,
    encoding: result.list_fetch.encoding,
    network_error: result.list_fetch.network_error,
  })),
};

if (!options.dryRun) writeJson(reportPath, report);
console.log(JSON.stringify(report, null, 2));

if (report.complete_meetings !== results.length) process.exit(1);
